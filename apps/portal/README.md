# portal

Where the driver chooses a branch, reads its features, sees what its tests proved, and plans them
into epics. Its Worker reads `features/` on the branch shown, main unless another is chosen, from
GitHub's API on every open and parses each file; the app lists them and shows any one as written,
with a link to its file on that branch on GitHub. Only what is pushed shows.

The branch chooser next to the portal's name lists main first, set apart, then every other branch,
the most recently changed first by the date of its head commit. The branch shown is kept in the
page's address, so loading the page again keeps it, and every link in the portal carries it.

What the tests proved comes from the branch's latest finished CI run. CI writes the scenarios'
results in Cucumber Messages to `test/results/messages.ndjson` and uploads the file as the
`test-results` artifact of every run, whether the tests pass or fail. The Worker asks GitHub's
Actions API for the latest finished run of `WORKFLOW` on the branch shown: on `MAIN` its latest
push run, on any other branch its latest run of either kind, counting only runs whose head is in
this repository. It downloads that run's artifact and marks each scenario as passed, failed or not
run; each feature and each epic shows how many of its scenarios passed. Results from a run for
another commit than the one shown are said to be from an earlier main, or an earlier commit of
another branch.

The branches, each with the date of its head commit, come from a single query to GitHub's GraphQL
API, paged only when a repository has more than 100 of them. A feature file, fetched by its content
hash, and a results artifact, fetched by its id, never change, so they go through the Cache API;
under `wrangler dev` it keeps them in `apps/portal/.wrangler/state` between runs. The branches, the
shown branch's commit, its file list and its latest finished run are asked of GitHub on every open.

The plan — the epics and the features picked into them, each in the order the driver puts them —
is kept in a D1 database, under the repository the Worker reads, so it outlives a restart and is
the same whichever branch is shown. A feature in an epic that the branch shown does not hold stays
there, marked as not on this branch. The Worker applies one change at a time: starting, renaming,
moving or removing an epic, and picking a feature into one at a chosen place, moving it within it
or taking it out. Drizzle defines the tables in `src/worker/tables.ts`; after changing them, write
the next migration into `migrations/` with `pnpm --filter @novibe/portal db:generate`.

## Run it locally

Put a read-only fine-grained token for the repository in `apps/portal/.dev.vars`, as in
`.dev.vars.example`, with the permissions Contents: read and Actions: read. GitHub hands out a
workflow artifact only to a signed-in caller, so even a public repository needs the token.
`REPOSITORY` in `wrangler.jsonc` names the repository, `MAIN` its main branch, and `WORKFLOW` the
workflow file whose runs carry the results. Then, from the root:

```
pnpm install
pnpm dev:portal
```

and open `http://localhost:8790`. `pnpm dev:portal` applies any new migrations to the local plan
first; the plan stays in `apps/portal/.wrangler/state` between runs.

## Tests

`pnpm test` builds the app and runs `features/specification/`, `features/planning/` and
`features/status/` through cucumber-js, writing the results to `test/results/messages.ndjson`.
Each run boots the Worker in wrangler's test harness, with a D1 database of its own, against a
stand-in for GitHub's API that serves several branches, each with its own feature files and latest
test run with its results artifact, and drives a real browser with Playwright's Chromium
(`pnpm --filter @novibe/portal exec playwright install chromium` from the root, once per machine).
The test run keeps its plan and its cache in memory, apart from what `pnpm dev:portal` keeps.
