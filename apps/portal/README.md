# portal

Where the driver reads the features on main and plans them into epics. Its Worker reads
`features/` on main from GitHub's API on every open and parses each file; the app lists them and
shows any one as written. Only what is pushed to main shows. `portal/` at the root is the old
portal, until this one replaces it.

The plan — the epics and the features picked into them, each in the order the driver puts them —
is kept in a D1 database, under the repository the Worker reads, so it outlives a restart and
shows whichever ref is read. The Worker applies one change at a time: starting, renaming, moving or
removing an epic, and picking a feature into one, moving it within it or taking it out. Drizzle defines the tables in `src/worker/tables.ts`; after changing them, write
the next migration into `migrations/` with `pnpm --filter @novibe/portal db:generate`.

## Run it locally

Put a read-only fine-grained token (Contents: read) for the repository in `apps/portal/.dev.vars`,
as in `.dev.vars.example` — a public repository reads without one. `REPOSITORY` in
`wrangler.jsonc` names the repository, and `REF` the branch, tag or commit read — `main` unless
you say otherwise. Then, from the root:

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

`pnpm test` builds the app and runs `features/specification/` and `features/planning/` through
cucumber-js. Each run boots the Worker in wrangler's test harness, with a D1 database of its own,
against a stand-in for GitHub's API, and drives a real browser with Playwright's Chromium
(`pnpm --filter @novibe/portal exec playwright install chromium` from the root, once per machine).
The test run keeps its plan in memory, apart from the plan `pnpm dev:portal` keeps.
