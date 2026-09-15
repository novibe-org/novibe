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
const REPOSITORY = "acme/shop";
const ROUTES = `/repos/${REPOSITORY}/`;
const TOKEN = "read-only-test-token";
const WORKFLOW = "ci.yml";
const RESULTS_ARTIFACT = "test-results";

const sha1 = (text: string) => createHash("sha1").update(text).digest("hex");
const blobShaOf = (text: string) => sha1(`blob ${Buffer.byteLength(text)}\0${text}`);
const MAIN = sha1("the main shown");

type TestRun = { id: number; commit: string; finished: Date; verdicts: Map<string, Verdict> };

const main = new Map<string, string>();
let run: TestRun | undefined;
let runs = 0;
let github: Server;
let storage: Server;
let storagePort: number;
let portal: TestHarness;
let portalUrl: URL;
let browser: Browser;

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

function answerAsStorage(request: IncomingMessage, response: ServerResponse) {
  const latest = run;
  if (!latest || request.headers.authorization || request.url !== `/${latest.id}.zip`) {
    response.writeHead(403).end();
    return;
  }
  const verdictOf = (path: string, scenario: string) => latest.verdicts.get(`${path}\n${scenario}`);
  response
    .writeHead(200, { "content-type": "application/zip" })
    .end(resultsArtifact(main, verdictOf, latest.finished));
}

function answerAsGitHub(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? "/", "http://github.test");
  if (request.headers.authorization !== `Bearer ${TOKEN}`) {
    response.writeHead(401).end();
    return;
  }
  const route = url.pathname.startsWith(ROUTES) ? url.pathname.slice(ROUTES.length) : "";
  if (route === "commits/main") {
    response.writeHead(200, { "content-type": "application/vnd.github.sha" }).end(MAIN);
    return;
  }
  if (route === `git/trees/${MAIN}`) {
    const tree = [
      ...directoriesOf([...main.keys()]).map((path) => ({
        path,
        type: "tree",
        sha: sha1(`tree ${path}`),
      })),
      ...[...main].map(([path, text]) => ({ path, type: "blob", sha: blobShaOf(text) })),
    ];
    answerJson(response, { sha: sha1(`tree of ${MAIN}`), tree, truncated: false });
    return;
  }
  if (route === `actions/workflows/${WORKFLOW}/runs`) {
    const asked = url.searchParams;
    const finishedOnMain =
      asked.get("branch") === "main" &&
      asked.get("event") === "push" &&
      asked.get("status") === "completed";
    const workflow_runs =
      run && finishedOnMain
        ? [
            {
              id: run.id,
              head_sha: run.commit,
              status: "completed",
              updated_at: run.finished.toISOString(),
            },
          ]
        : [];
    answerJson(response, { total_count: workflow_runs.length, workflow_runs });
    return;
  }
  if (run && route === `actions/runs/${run.id}/artifacts`) {
    const named = url.searchParams.get("name") === RESULTS_ARTIFACT;
    const artifacts = named ? [{ id: run.id, name: RESULTS_ARTIFACT, expired: false }] : [];
    answerJson(response, { total_count: artifacts.length, artifacts });
    return;
  }
  if (run && route === `actions/artifacts/${run.id}/zip`) {
    const location = `http://127.0.0.1:${storagePort}/${run.id}.zip`;
    response.writeHead(302, { location }).end();
    return;
  }
  const [, sha] = /^git\/blobs\/([0-9a-f]{40})$/.exec(route) ?? [];
  const content = [...main.values()].find((text) => blobShaOf(text) === sha);
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
        REF: "main",
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
  private context: BrowserContext | undefined;
  private current: Page | undefined;

  holds(path: string, text: string) {
    main.set(path, text);
  }

  holdsTitled(title: string): boolean {
    return [...main.values()].some((text) => text.includes(`\nFeature: ${title}\n`));
  }

  noLongerHolds(id: string) {
    for (const [path, text] of main) {
      if (text.split("\n", 1)[0]?.split(" ").includes(`@id:${id}`)) main.delete(path);
    }
  }

  testRun(): TestRun {
    run ??= { id: ++runs, commit: MAIN, finished: new Date(), verdicts: new Map() };
    return run;
  }

  proved(path: string, scenario: string, verdict: Verdict) {
    this.testRun().verdicts.set(`${path}\n${scenario}`, verdict);
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
    await this.current.goto(new URL("/", portalUrl).toString());
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
  main.clear();
  main.set("README.md", "# shop\n");
  run = undefined;
  const { PLAN } = await portal.getWorker<{ PLAN: D1Database }>().getEnv();
  const plan = drizzle(PLAN);
  await plan.batch([plan.delete(picks), plan.delete(epics)]);
});

After(async function (this: PortalWorld) {
  await this.close();
});
