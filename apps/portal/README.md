# portal

Where the driver reads the features on main, sees what the tests proved, and plans them into
epics. Its Worker reads `features/` on main from GitHub's API on every open and parses each file;
the app lists them and shows any one as written. Only what is pushed to main shows. `portal/` at
the root is the old portal, until this one replaces it.

What the tests proved comes from main's latest finished CI run. CI writes the scenarios' results
in Cucumber Messages to `test/results/messages.ndjson` and uploads the file as the `test-results`
artifact of every run, whether the tests pass or fail. The Worker asks GitHub's Actions API for
the latest finished push run of `WORKFLOW` on `REF`, downloads its artifact, and marks each
scenario as passed, failed or not run; each feature and each epic shows how many of its scenarios
passed. Results from a run for another commit than the main shown are said to be from an earlier
main.

A feature file, fetched by its content hash, and a results artifact, fetched by its id, never
change, so they go through the Cache API; under `wrangler dev` it keeps them in
`apps/portal/.wrangler/state` between runs. Main's commit, its file list and its latest finished
run are asked of GitHub on every open.

The plan — the epics and the features picked into them, each in the order the driver puts them —
is kept in a D1 database, under the repository the Worker reads, so it outlives a restart and
shows whichever ref is read. The Worker applies one change at a time: starting, renaming, moving or
removing an epic, and picking a feature into one at a chosen place, moving it within it or taking
it out. Drizzle defines the tables in `src/worker/tables.ts`; after changing them, write
the next migration into `migrations/` with `pnpm --filter @novibe/portal db:generate`.

## Run it locally

Put a read-only fine-grained token for the repository in `apps/portal/.dev.vars`, as in
`.dev.vars.example`, with the permissions Contents: read and Actions: read. GitHub hands out a
workflow artifact only to a signed-in caller, so even a public repository needs the token.
`REPOSITORY` in `wrangler.jsonc` names the repository, `REF` the branch, tag or commit read —
`main` unless you say otherwise — and `WORKFLOW` the workflow file whose runs carry the results.
Then, from the root:

```
pnpm install
pnpm dev:portal
```

and open `http://localhost:8790`. `pnpm dev:portal` applies any new migrations to the local plan
first; the plan stays in `apps/portal/.wrangler/state` between runs. To look at a branch's
features instead, override `REF` for the run — with no `--` before `--var`, or pnpm hands wrangler
a literal `--` and the override is lost:

```
pnpm dev:portal --var REF:feat/move-the-portal
```

## Tests

`pnpm test` builds the app and runs `features/specification/`, `features/planning/` and
`features/status/` through cucumber-js, writing the results to `test/results/messages.ndjson`.
Each run boots the Worker in wrangler's test harness, with a D1 database of its own, against a
stand-in for GitHub's API that also serves test runs and their results artifacts, and drives a
real browser with Playwright's Chromium (`pnpm --filter @novibe/portal exec playwright install
chromium` from the root, once per machine). The test run keeps its plan and its cache in memory,
apart from what `pnpm dev:portal` keeps.
