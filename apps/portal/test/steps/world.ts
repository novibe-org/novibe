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
import { type Browser, type BrowserContext, chromium, type Page } from "playwright";
import { createTestHarness, type TestHarness } from "wrangler";

setDefaultTimeout(60_000);

const PORTAL_DIR = join(import.meta.dirname, "..", "..");
const GENERATED = join(PORTAL_DIR, "test", "fixture", "generated");
const REPOSITORY = "acme/shop";
const TOKEN = "read-only-test-token";

const main = new Map<string, string>();
let github: Server;
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

function answerAsGitHub(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url ?? "/", "http://github.test");
  if (request.headers.authorization !== `Bearer ${TOKEN}`) {
    response.writeHead(401).end();
    return;
  }
  if (url.pathname === `/repos/${REPOSITORY}/git/trees/main`) {
    const paths = [...main.keys()];
    const tree = [
      ...directoriesOf(paths).map((path) => ({ path, type: "tree", sha: `tree:${path}` })),
      ...paths.map((path) => ({ path, type: "blob", sha: encodeURIComponent(path) })),
    ];
    response
      .writeHead(200, { "content-type": "application/json" })
      .end(JSON.stringify({ sha: "main", tree, truncated: false }));
    return;
  }
  const [, sha] = /^\/repos\/acme\/shop\/git\/blobs\/(.+)$/.exec(url.pathname) ?? [];
  const content = sha === undefined ? undefined : main.get(decodeURIComponent(sha));
  if (content === undefined) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "content-type": "application/vnd.github.raw+json" }).end(content);
}

BeforeAll(async () => {
  github = createServer(answerAsGitHub);
  await new Promise<void>((listening) => github.listen(0, "127.0.0.1", listening));
  const { port } = github.address() as AddressInfo;
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
      vars: {
        GITHUB_API_URL: `http://127.0.0.1:${port}`,
        REPOSITORY,
        REF: "main",
        GITHUB_TOKEN: TOKEN,
      },
    }),
  );
  portal = createTestHarness({ workers: [{ configPath: config }] });
  ({ url: portalUrl } = await portal.listen());
  browser = await chromium.launch();
});

AfterAll(async () => {
  await Promise.all([
    browser?.close(),
    portal?.close(),
    new Promise((closed) => (github ? github.close(closed) : closed(undefined))),
  ]);
});

export class PortalWorld extends World {
  written: string[] = [];
  private context: BrowserContext | undefined;
  private current: Page | undefined;

  holds(path: string, text: string) {
    main.set(path, text);
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
}

setWorldConstructor(PortalWorld);

Before(() => {
  main.clear();
  main.set("README.md", "# shop\n");
});

After(async function (this: PortalWorld) {
  await this.close();
});
