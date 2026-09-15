import { z } from "zod";
import type { Branches } from "../feature";
import type { Env } from "./env";
import { FEATURE_PATH } from "./parse";
import { type Results, resultsInArtifact } from "./results";

const RESULTS_ARTIFACT = "test-results";
const NEVER_CHANGES = "max-age=31536000, immutable";
const BRANCHES_A_PAGE = 100;

const ShaSchema = z.string().regex(/^[0-9a-f]{40}$/, "not a git sha");

const ListedBranchesSchema = z.array(
  z.object({ name: z.string(), commit: z.object({ sha: ShaSchema }) }),
);

const CommitSchema = z.object({ committer: z.object({ date: z.string() }) });

const TreeSchema = z.object({
  truncated: z.boolean(),
  tree: z.array(z.object({ path: z.string(), type: z.string(), sha: ShaSchema })),
});

const RunsSchema = z.object({
  workflow_runs: z.array(z.object({ id: z.number(), head_sha: ShaSchema, updated_at: z.string() })),
});

const ArtifactsSchema = z.object({
  artifacts: z.array(z.object({ id: z.number(), expired: z.boolean() })),
});

type TestRun = { commit: string; finished: string; results: Results };

const urlOf = (env: Env, route: string) =>
  new URL(`/repos/${env.REPOSITORY}/${route}`, env.GITHUB_API_URL);

async function fromGitHub(
  env: Env,
  route: string,
  accept = "application/vnd.github+json",
): Promise<Response> {
  const response = await fetch(urlOf(env, route), {
    headers: {
      accept,
      "user-agent": "novibe-portal",
      "x-github-api-version": "2022-11-28",
      ...(env.GITHUB_TOKEN ? { authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
    },
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status} to ${route}`);
  return response;
}

async function neverChanging(env: Env, route: string, accept?: string): Promise<Response> {
  const key = urlOf(env, route);
  const cache = await caches.open("github");
  const cached = await cache.match(key);
  if (cached) return cached;
  const body = await (await fromGitHub(env, route, accept)).arrayBuffer();
  await cache.put(key, new Response(body, { headers: { "cache-control": NEVER_CHANGES } }));
  return new Response(body);
}

export async function branchesOf(env: Env): Promise<Branches> {
  const listed: z.infer<typeof ListedBranchesSchema> = [];
  for (let page = 1; ; page += 1) {
    const asked = new URLSearchParams({ per_page: String(BRANCHES_A_PAGE), page: String(page) });
    const answer = await fromGitHub(env, `branches?${asked}`);
    const onPage = ListedBranchesSchema.parse(await answer.json());
    listed.push(...onPage);
    if (onPage.length < BRANCHES_A_PAGE) break;
  }
  const others = await Promise.all(
    listed
      .filter(({ name }) => name !== env.MAIN)
      .map(async ({ name, commit }) => {
        const answer = await neverChanging(env, `git/commits/${commit.sha}`);
        const { committer } = CommitSchema.parse(await answer.json());
        return { name, changed: Date.parse(committer.date) };
      }),
  );
  others.sort((one, other) => other.changed - one.changed);
  return { main: env.MAIN, others: others.map(({ name }) => name) };
}

export async function commitOf(env: Env, branch: string): Promise<string> {
  const route = `commits/${encodeURIComponent(branch)}`;
  const answer = await fromGitHub(env, route, "application/vnd.github.sha");
  return ShaSchema.parse(await answer.text());
}

export async function featureFilesAt(env: Env, commit: string) {
  const listing = await fromGitHub(env, `git/trees/${commit}?recursive=1`);
  const { truncated, tree } = TreeSchema.parse(await listing.json());
  if (truncated) throw new Error(`GitHub truncated the tree of ${commit}`);
  const files = tree.filter(({ type, path }) => type === "blob" && FEATURE_PATH.test(path));
  return Promise.all(
    files.map(async ({ path, sha }) => {
      const blob = await neverChanging(env, `git/blobs/${sha}`, "application/vnd.github.raw+json");
      return { path, text: await blob.text() };
    }),
  );
}

export async function latestTestRun(env: Env): Promise<TestRun | undefined> {
  const finished = new URLSearchParams({
    branch: env.MAIN,
    event: "push",
    status: "completed",
    per_page: "1",
  });
  const workflow = encodeURIComponent(env.WORKFLOW);
  const runs = await fromGitHub(env, `actions/workflows/${workflow}/runs?${finished}`);
  const [run] = RunsSchema.parse(await runs.json()).workflow_runs;
  if (!run) return undefined;
  const listed = await fromGitHub(env, `actions/runs/${run.id}/artifacts?name=${RESULTS_ARTIFACT}`);
  const { artifacts } = ArtifactsSchema.parse(await listed.json());
  const artifact = artifacts.find(({ expired }) => !expired);
  if (!artifact) return undefined;
  const zip = await neverChanging(env, `actions/artifacts/${artifact.id}/zip`);
  const results = resultsInArtifact(await zip.arrayBuffer());
  return results && { commit: run.head_sha, finished: run.updated_at, results };
}
