import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import {
  After,
  AfterAll,
  Before,
  BeforeAll,
  setDefaultTimeout,
  setWorldConstructor,
  World,
} from "@cucumber/cucumber";
import { drizzle } from "drizzle-orm/d1";
import { type Browser, type BrowserContext, chromium, type Page } from "playwright";
import { createTestHarness, type TestHarness } from "wrangler";
import type { Change, Plan } from "../../src/plan";
import { epics, picks } from "../../src/worker/tables";
import { resultsArtifact, type Verdict } from "./run";

setDefaultTimeout(60_000);

const PORTAL_DIR = join(import.meta.dirname, "..", "..");
const GENERATED = join(PORTAL_DIR, "test", "fixture", "generated");
export const REPOSITORY = "acme/shop";
const REPOSITORY_ID = 1;
const ROUTES = `/repos/${REPOSITORY}/`;
const TOKEN = "read-only-test-token";
const WORKFLOW = "ci.yml";
const RESULTS_ARTIFACT = "test-results";
const MAIN = "main";
const BRANCHES_ASKED = /refs\(refPrefix: "refs\/heads\/"[^)]*\)[\s\S]*committedDate/;

const sha1 = (text: string) => createHash("sha1").update(text).digest("hex");
const blobShaOf = (text: string) => sha1(`blob ${Buffer.byteLength(text)}\0${text}`);

type Branch = { files: Map<string, string>; changed: Date };

type TestRun = {
  id: number;
  branch: string;
  event: "push" | "pull_request";
  commit: string;
  finished: Date;
  verdicts: Map<string, Verdict>;
};

const branches = new Map<string, Branch>();
const latestRuns = new Map<string, TestRun>();
let runs = 0;
let github: Server;
let storage: Server;
let storagePort: number;
let portal: TestHarness;
let portalUrl: URL;
let browser: Browser;

function branchNamed(name: string): Branch {
  const branch = branches.get(name) ?? {
    files: new Map([["README.md", "# shop\n"]]),
    changed: new Date(),
  };
  branches.set(name, branch);
  return branch;
}

const headOf = (name: string) =>
  sha1(`${name} changed at ${branchNamed(name).changed.toISOString()}`);

function directoriesOf(paths: string[]): string[] {
  const directories = new Set<string>();
  for (const path of paths) {
    const parts = path.split("/").slice(0, -1);
    parts.forEach((_, end) => {
      directories.add(parts.slice(0, end + 1).join("/"));
    });
  }
  return [...directories];
}

async function listening(server: Server): Promise<number> {
  await new Promise<void>((ready) => server.listen(0, "127.0.0.1", ready));
  return (server.address() as AddressInfo).port;
}

const answerJson = (response: ServerResponse, body: unknown) =>
  response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(body));

const runWithId = (id: string | undefined) =>
  [...latestRuns.values()].find((each) => String(each.id) === id);

function answerAsStorage(request: IncomingMessage, response: ServerResponse) {
  const [, id] = /^\/(\d+)\.zip$/.exec(request.url ?? "") ?? [];
  const latest = runWithId(id);
  if (!latest || request.headers.authorization) {
    response.writeHead(403).end();
    return;
  }
  const verdictOf = (path: string, scenario: string) => latest.verdicts.get(`${path}\n${scenario}`);
  response
    .writeHead(200, { "content-type": "application/zip" })
    .end(resultsArtifact(branchNamed(latest.branch).files, verdictOf, latest.finished));
}

function runsAsked(asked: URLSearchParams) {
  const branch = asked.get("branch") ?? "";
  const latest = latestRuns.get(branch);
  const event = asked.get("event");
  const finished =
    latest &&
    asked.get("status") === "completed" &&
    (branch === MAIN ? event === "push" : event === null || event === latest.event);
  if (!finished) return [];
  const repository = { id: REPOSITORY_ID, full_name: REPOSITORY };
  return [
    {
      id: latest.id,
      head_branch: branch,
      head_sha: latest.commit,
      event: latest.event,
      status: "completed",
      updated_at: latest.finished.toISOString(),
      repository,
      head_repository: repository,
    },
  ];
}

function answerAsGraphQL(request: IncomingMessage, response: ServerResponse) {
  let asked = "";
  request.setEncoding("utf8");
  request.on("data", (chunk: string) => {
    asked += chunk;
  });
  request.on("end", () => {
    const { query = "", variables = {} } = JSON.parse(asked) as {
      query?: string;
      variables?: Record<string, unknown>;
    };
    const [owner, name] = REPOSITORY.split("/");
    if (!BRANCHES_ASKED.test(query) || variables.owner !== owner || variables.name !== name) {
      answerJson(response, {
        data: null,
        errors: [{ message: "not a query the stand-in answers" }],
      });
      return;
    }
    const nodes = [...branches]
      .sort(([one], [other]) => one.localeCompare(other))
      .map(([branch, { changed }]) => ({
        name: branch,
        target: { committedDate: changed.toISOString() },
      }));
    const pageInfo = { hasNextPage: false, endCursor: null };
    answerJson(response, { data: { repository: { refs: { pageInfo, nodes } } } });
  });
}

function answerAsGitHub(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? "/", "http://github.test");
  if (request.headers.authorization !== `Bearer ${TOKEN}`) {
    response.writeHead(401).end();
    return;
  }
  if (request.method === "POST" && url.pathname === "/graphql") {
    answerAsGraphQL(request, response);
    return;
  }
  const route = url.pathname.startsWith(ROUTES) ? url.pathname.slice(ROUTES.length) : "";
  const heads = [...branches.keys()].map((name) => ({ name, sha: headOf(name) }));
  const [, ref = ""] = /^commits\/(.+)$/.exec(route) ?? [];
  const named = heads.find(({ name }) => name === decodeURIComponent(ref));
  if (named) {
    response.writeHead(200, { "content-type": "application/vnd.github.sha" }).end(named.sha);
    return;
  }
  const [, commit] = /^git\/trees\/([0-9a-f]{40})$/.exec(route) ?? [];
  const head = heads.find(({ sha }) => sha === commit);
  if (head) {
    const { files } = branchNamed(head.name);
    const tree = [
      ...directoriesOf([...files.keys()]).map((path) => ({
        path,
        type: "tree",
        sha: sha1(`tree ${path}`),
      })),
      ...[...files].map(([path, text]) => ({ path, type: "blob", sha: blobShaOf(text) })),
    ];
    answerJson(response, { sha: sha1(`tree of ${head.sha}`), tree, truncated: false });
    return;
  }
  if (route === `actions/workflows/${WORKFLOW}/runs`) {
    const workflow_runs = runsAsked(url.searchParams);
    answerJson(response, { total_count: workflow_runs.length, workflow_runs });
    return;
  }
  const [, listedFor] = /^actions\/runs\/(\d+)\/artifacts$/.exec(route) ?? [];
  const listedRun = runWithId(listedFor);
  if (listedRun) {
    const named = url.searchParams.get("name") === RESULTS_ARTIFACT;
    const artifacts = named ? [{ id: listedRun.id, name: RESULTS_ARTIFACT, expired: false }] : [];
    answerJson(response, { total_count: artifacts.length, artifacts });
    return;
  }
  const [, zipped] = /^actions\/artifacts\/(\d+)\/zip$/.exec(route) ?? [];
  const zippedRun = runWithId(zipped);
  if (zippedRun) {
    const location = `http://127.0.0.1:${storagePort}/${zippedRun.id}.zip`;
    response.writeHead(302, { location }).end();
    return;
  }
  const [, sha] = /^git\/blobs\/([0-9a-f]{40})$/.exec(route) ?? [];
  const content = [...branches.values()]
    .flatMap(({ files }) => [...files.values()])
    .find((text) => blobShaOf(text) === sha);
  if (content === undefined) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "content-type": "application/vnd.github.raw+json" }).end(content);
}

BeforeAll(async () => {
  github = createServer(answerAsGitHub);
  storage = createServer(answerAsStorage);
  const port = await listening(github);
  storagePort = await listening(storage);
  mkdirSync(GENERATED, { recursive: true });
  const config = join(GENERATED, "wrangler.jsonc");
  writeFileSync(
    config,
    JSON.stringify({
      name: "novibe-portal-test",
      main: join(PORTAL_DIR, "src", "worker", "index.ts"),
      compatibility_date: "2026-07-01",
      assets: {
        directory: join(PORTAL_DIR, "dist"),
        not_found_handling: "single-page-application",
        run_worker_first: ["/api/*"],
      },
      d1_databases: [
        {
          binding: "PLAN",
          database_name: "novibe-portal-plan",
          migrations_dir: join(PORTAL_DIR, "migrations"),
        },
      ],
      vars: {
        GITHUB_API_URL: `http://127.0.0.1:${port}`,
        REPOSITORY,
        MAIN,
        WORKFLOW,
        GITHUB_TOKEN: TOKEN,
      },
    }),
  );
  portal = createTestHarness({ workers: [{ configPath: config }] });
  ({ url: portalUrl } = await portal.listen());
  await portal.getWorker().applyD1Migrations("PLAN");
  browser = await chromium.launch();
});

AfterAll(async () => {
  await Promise.all([
    browser?.close(),
    portal?.close(),
    ...[github, storage].map(
      (server) => new Promise((closed) => (server ? server.close(closed) : closed(undefined))),
    ),
  ]);
});

export class PortalWorld extends World {
  written: string[] = [];
  picked: string | undefined;
  plan: Plan | undefined;
  feature = "";
  featurePath = "";
  scenario = "";
  shown: string | undefined;
  private context: BrowserContext | undefined;
  private current: Page | undefined;

  holds(path: string, text: string) {
    this.branchHolds(MAIN, path, text);
  }

  branchHolds(branch: string, path: string, text: string) {
    branchNamed(branch).files.set(path, text);
  }

  branchChanged(branch: string, changed: Date) {
    branchNamed(branch).changed = changed;
  }

  holdsTitled(title: string): boolean {
    const { files } = branchNamed(MAIN);
    return [...files.values()].some((text) => text.includes(`\nFeature: ${title}\n`));
  }

  titlesOn(branch: string): string[] {
    const { files } = branchNamed(branch);
    return [...files.values()].flatMap((text) => /\nFeature: (.*)\n/.exec(text)?.slice(1) ?? []);
  }

  noLongerHolds(id: string) {
    const { files } = branchNamed(MAIN);
    for (const [path, text] of files) {
      if (text.split("\n", 1)[0]?.split(" ").includes(`@id:${id}`)) files.delete(path);
    }
  }

  testRun(branch = MAIN): TestRun {
    const latest = latestRuns.get(branch) ?? {
      id: ++runs,
      branch,
      event: branch === MAIN ? "push" : "pull_request",
      commit: headOf(branch),
      finished: new Date(),
      verdicts: new Map(),
    };
    latestRuns.set(branch, latest);
    return latest;
  }

  proved(path: string, scenario: string, verdict: Verdict, branch = MAIN) {
    this.testRun(branch).verdicts.set(`${path}\n${scenario}`, verdict);
  }

  ranForAnEarlierMain() {
    this.testRun().commit = sha1("an earlier main");
  }

  async change(change: Change): Promise<Plan> {
    const response = await fetch(new URL("/api/plan", portalUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(change),
    });
    if (!response.ok) throw new Error(`the plan answered ${response.status}`);
    this.plan = (await response.json()) as Plan;
    return this.plan;
  }

  page(): Page {
    if (!this.current) throw new Error("the portal is not open yet");
    return this.current;
  }

  async open() {
    this.context ??= await browser.newContext();
    this.current ??= await this.context.newPage();
    const address = new URL("/", portalUrl);
    if (this.shown) address.searchParams.set("branch", this.shown);
    await this.current.goto(address.toString());
  }

  async close() {
    await this.context?.close();
  }

  async restart() {
    await this.close();
    this.context = undefined;
    this.current = undefined;
    await portal.update((options) => options);
    ({ url: portalUrl } = await portal.listen());
  }
}

setWorldConstructor(PortalWorld);

Before(async () => {
  branches.clear();
  branchNamed(MAIN).changed = new Date(0);
  latestRuns.clear();
  const { PLAN } = await portal.getWorker<{ PLAN: D1Database }>().getEnv();
  const plan = drizzle(PLAN);
  await plan.batch([plan.delete(picks), plan.delete(epics)]);
});

After(async function (this: PortalWorld) {
  await this.close();
});
