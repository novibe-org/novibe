import { z } from "zod";
import type { Branches } from "../feature";
import type { Env } from "./env";
import { FEATURE_PATH } from "./parse";
import { type Results, resultsInArtifact } from "./results";

const RESULTS_ARTIFACT = "test-results";
const NEVER_CHANGES = "max-age=31536000, immutable";
const RUNS_A_PAGE = 10;

const BRANCHES = `query Branches($owner: String!, $name: String!, $after: String) {
  repository(owner: $owner, name: $name) {
    refs(refPrefix: "refs/heads/", first: 100, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { name target { ... on Commit { committedDate } } }
    }
  }
}`;

const ShaSchema = z.string().regex(/^[0-9a-f]{40}$/, "not a git sha");

const BranchesPageSchema = z.object({
  data: z.object({
    repository: z.object({
      refs: z.object({
        pageInfo: z.object({ hasNextPage: z.boolean(), endCursor: z.string().nullable() }),
        nodes: z.array(
          z.object({ name: z.string(), target: z.object({ committedDate: z.string() }) }),
        ),
      }),
    }),
  }),
});

const TreeSchema = z.object({
  truncated: z.boolean(),
  tree: z.array(z.object({ path: z.string(), type: z.string(), sha: ShaSchema })),
});

const RunsSchema = z.object({
  workflow_runs: z.array(
    z.object({
      id: z.number(),
      head_sha: ShaSchema,
      updated_at: z.string(),
      repository: z.object({ id: z.number() }),
      head_repository: z.object({ id: z.number() }).nullable(),
    }),
  ),
});

const ArtifactsSchema = z.object({
  artifacts: z.array(z.object({ id: z.number(), expired: z.boolean() })),
});

type TestRun = { commit: string; finished: string; results: Results };

const urlOf = (env: Env, route: string) =>
  new URL(`/repos/${env.REPOSITORY}/${route}`, env.GITHUB_API_URL);

const headersFor = (env: Env, accept: string) => ({
  accept,
  "user-agent": "novibe-portal",
  "x-github-api-version": "2022-11-28",
  ...(env.GITHUB_TOKEN ? { authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
});

async function fromGitHub(
  env: Env,
  route: string,
  accept = "application/vnd.github+json",
): Promise<Response> {
  const response = await fetch(urlOf(env, route), { headers: headersFor(env, accept) });
  if (!response.ok) throw new Error(`GitHub answered ${response.status} to ${route}`);
  return response;
}

async function askedOfGitHub(env: Env, query: string, variables: object): Promise<unknown> {
  const response = await fetch(new URL("/graphql", env.GITHUB_API_URL), {
    method: "POST",
    headers: { ...headersFor(env, "application/json"), "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status} to a GraphQL query`);
  return response.json();
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
  const [owner, name] = env.REPOSITORY.split("/");
  const listed: { name: string; changed: number }[] = [];
  let after: string | null = null;
  do {
    const answer = await askedOfGitHub(env, BRANCHES, { owner, name, after });
    const { refs } = BranchesPageSchema.parse(answer).data.repository;
    for (const { name, target } of refs.nodes) {
      listed.push({ name, changed: Date.parse(target.committedDate) });
    }
    after = refs.pageInfo.hasNextPage ? refs.pageInfo.endCursor : null;
  } while (after);
  const others = listed.filter(({ name }) => name !== env.MAIN);
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

export async function latestTestRun(env: Env, branch: string): Promise<TestRun | undefined> {
  const finished = new URLSearchParams({
    branch,
    ...(branch === env.MAIN ? { event: "push" } : {}),
    status: "completed",
    per_page: String(RUNS_A_PAGE),
  });
  const workflow = encodeURIComponent(env.WORKFLOW);
  const runs = await fromGitHub(env, `actions/workflows/${workflow}/runs?${finished}`);
  const run = RunsSchema.parse(await runs.json()).workflow_runs.find(
    ({ repository, head_repository }) => head_repository?.id === repository.id,
  );
  if (!run) return undefined;
  const listed = await fromGitHub(env, `actions/runs/${run.id}/artifacts?name=${RESULTS_ARTIFACT}`);
  const { artifacts } = ArtifactsSchema.parse(await listed.json());
  const artifact = artifacts.find(({ expired }) => !expired);
  if (!artifact) return undefined;
  const zip = await neverChanging(env, `actions/artifacts/${artifact.id}/zip`);
  const results = resultsInArtifact(await zip.arrayBuffer());
  return results && { commit: run.head_sha, finished: run.updated_at, results };
}
