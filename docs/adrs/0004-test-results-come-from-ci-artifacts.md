# ADR-0004: What the tests proved comes from the branch's CI run, as a results artifact

**Status:** accepted · 2026-09-14

## Context

The portal shows what the tests proved about each scenario on the branch it shows. CI runs the
scenarios on every push to this repository's default branch, main, and on every pull request but keeps nothing of what it found, and
the Worker can read only what GitHub serves it.

## Decision

- **CI keeps the results as a workflow artifact.** Every run uploads them, whether the tests pass
  or fail, in Cucumber Messages, Cucumber's standard stream tying each result to its scenario's
  place in the feature files.
- **The Worker reads the branch's latest finished run** through GitHub's Actions API with the same
  read-only token, which then also needs Actions: read. For the default branch that is its latest push run; for
  any other branch its latest finished run of either kind. Only runs from this repository count,
  so a fork's pull request cannot pose as a branch. A run still in progress is skipped.
- **Only what cannot change is cached.** The branches, a branch's file list and its latest finished
  run are asked of GitHub on every open. A feature file, fetched by its content hash, and a results
  artifact, fetched by its id, never change, so their responses go through Cloudflare's Cache API.
  The portal only reads, so nothing it shows can drift from what GitHub holds.

## Alternatives

- Keeping features per commit and results per run in D1: a second copy the portal would have to
  keep in step with GitHub, which can drift.
- No cache at all: nothing kept, but every open downloads every feature file and the artifact.
- CI committing the results to a branch: simpler to read, but CI would need write access and the
  repository would collect bot commits.
- The Cucumber JSON report: simpler, but it represents outlines and rules less faithfully.

## Consequences

- A new commit's changed files and a new run's artifact are downloaded once; after that, an open
  only asks GitHub what is latest.
- Cached responses were fetched with the token, which is fine while the portal runs only locally.
- Results exist only for runs made after CI starts uploading them, and only while GitHub keeps
  the artifact.
- A repository whose default branch is not main needs its CI to run on pushes to that branch: a
  workflow's trigger names branches, not the default one.

Shapes the views `portal` and `readFeatures`.
