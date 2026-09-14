import type { Env } from "./env";
import { FEATURE_PATH } from "./parse";

type Tree = { tree: { path: string; type: string; sha: string }[] };

async function fromGitHub(env: Env, route: string, accept: string): Promise<Response> {
  const response = await fetch(new URL(`/repos/${env.REPOSITORY}/${route}`, env.GITHUB_API_URL), {
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

export async function featureFilesOnMain(env: Env): Promise<{ path: string; text: string }[]> {
  const listing = await fromGitHub(
    env,
    "git/trees/main?recursive=1",
    "application/vnd.github+json",
  );
  const { tree } = (await listing.json()) as Tree;
  const files = tree.filter(({ type, path }) => type === "blob" && FEATURE_PATH.test(path));
  return Promise.all(
    files.map(async ({ path, sha }) => {
      const blob = await fromGitHub(env, `git/blobs/${sha}`, "application/vnd.github.raw+json");
      return { path, text: await blob.text() };
    }),
  );
}
