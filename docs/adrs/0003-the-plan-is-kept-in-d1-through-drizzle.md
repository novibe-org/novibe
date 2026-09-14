# ADR-0003: The plan is kept in D1, through Drizzle

**Status:** accepted · 2026-09-14

## Context

Epics are the portal's first state of its own. They must outlive a restart, stay out of the
repository, and never mix between repositories. Renaming, ordering and test results will build on
the same place.

## Decision

- **Cloudflare D1, one plan per repository.** The plan is kept under the repository the Worker
  reads, and the same plan shows whichever ref is previewed. Under `wrangler dev` it persists on
  the driver's machine.
- **Drizzle from the start.** Drizzle defines the tables, their types and the migrations.
- **One change per call.** The app sends a single change, and the Worker holds the plan's rules:
  it checks the plan, then writes the change in one batch. With one driver changing the plan
  locally, nothing interleaves between the check and the write; hosting the plan for several
  people would revisit that.
- **The Worker joins the plan with the features**, marking a feature no longer on main as gone;
  the app only shows the answer.

## Alternatives

- A Durable Object with SQLite: more consistency machinery than one driver's plan needs.
- KV: the whole plan as one value, with no transactions.
- The browser's storage: the plan would live in a single browser.

## Consequences

- A test run keeps its plan in memory, apart from the plan `wrangler dev` keeps on disk.
- Hosting needs its own D1 database with the migrations applied.

Shapes the views `portal`, `readFeatures`, `changePlan` and `local`.
