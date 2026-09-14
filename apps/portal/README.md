# portal

Where the driver reads the features on main. Its Worker reads `features/` on main from GitHub's
API on every open and parses each file; the app lists them and shows any one as written. Only what
is pushed to main shows. `portal/` at the root is the old portal, until this one replaces it.

## Run it locally

Put a read-only fine-grained token (Contents: read) for the repository in `apps/portal/.dev.vars`,
as in `.dev.vars.example` — a public repository reads without one. `REPOSITORY` in
`wrangler.jsonc` names the repository, and `REF` the branch, tag or commit read — `main` unless
you say otherwise. Then, from the root:

```
pnpm install
pnpm dev:portal
```

and open `http://localhost:8790`. To look at a branch's features instead, override `REF` for the
run — with no `--` before `--var`, or pnpm hands wrangler a literal `--` and the override is lost:

```
pnpm dev:portal --var REF:feat/move-the-portal
```

## Tests

`pnpm test` builds the app and runs `features/specification/` through cucumber-js. Each run boots
the Worker in wrangler's test harness against a stand-in for GitHub's API, and drives a real
browser with Playwright's Chromium (`pnpm exec playwright install chromium` once per machine).
