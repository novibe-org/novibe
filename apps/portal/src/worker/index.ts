import type { Branches, Feature, Run } from "../feature";
import { ChangeSchema, type Planned } from "../plan";
import type { Env } from "./env";
import { branchesOf, commitOf, featureFilesAt, latestTestRun } from "./github";
import { parsed } from "./parse";
import { changed, goneFrom, planOf } from "./plan";

async function withThePlan(asked: URLSearchParams, env: Env): Promise<Response> {
  const branch = asked.get("branch") || env.MAIN;
  let branches: Branches;
  let features: Feature[];
  let run: Run | null;
  try {
    const [listed, commit] = await Promise.all([branchesOf(env), commitOf(env, branch)]);
    const [files, tested] = await Promise.all([
      featureFilesAt(env, commit),
      latestTestRun(env, branch),
    ]);
    branches = listed;
    features = files.map(({ path, text }) => parsed(path, text, tested?.results));
    run = tested ? { finished: tested.finished, earlier: tested.commit !== commit } : null;
  } catch (failure) {
    console.error(failure);
    return Response.json({ error: "could not read the branch" }, { status: 502 });
  }
  const plan = await planOf(env.PLAN, env.REPOSITORY);
  return Response.json({
    repository: env.REPOSITORY,
    branch,
    branches,
    features,
    run,
    ...plan,
    gone: goneFrom(plan, features),
  } satisfies Planned);
}

async function changing(request: Request, env: Env): Promise<Response> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ refused: "a change is sent as JSON" }, { status: 415 });
  }
  const change = ChangeSchema.safeParse(await request.json().catch(() => undefined));
  if (!change.success) {
    const refused = change.error.issues[0]?.message ?? "not a change";
    return Response.json({ refused }, { status: 400 });
  }
  const answer = await changed(env.PLAN, env.REPOSITORY, change.data);
  if ("refused" in answer) {
    return Response.json({ refused: answer.refused }, { status: answer.status });
  }
  return Response.json(answer);
}

export default {
  async fetch(request, env) {
    const { pathname, searchParams } = new URL(request.url);
    if (pathname === "/api/features") return withThePlan(searchParams, env);
    if (pathname === "/api/plan" && request.method === "POST") return changing(request, env);
    return new Response("not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
