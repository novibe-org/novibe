# ADR-0004: What the tests proved comes from main's CI run, as a results artifact

**Status:** accepted · 2026-09-14

## Context

The portal shows what the tests proved about each scenario on main. CI already runs the scenarios
on every push to main but keeps nothing of what it found, and the Worker can read only what GitHub
serves it.

## Decision

- **CI keeps the results as a workflow artifact.** Every run on main uploads them, whether the
  tests pass or fail, in Cucumber Messages, Cucumber's standard stream tying each result to its
  scenario's place in the feature files.
- **The Worker reads main's latest finished run** through GitHub's Actions API with the same
  read-only token, which then also needs Actions: read. A run still in progress is skipped.
- **Read on every open, like the features.** The portal keeps no copy of the features or the
  results, so nothing it shows can drift from what GitHub holds.

## Alternatives

- Keeping features per commit and results per run in D1: a faster open, but a second copy of what
  GitHub holds, which can drift.
- CI committing the results to a branch: simpler to read, but CI would need write access and the
  repository would collect bot commits.
- The Cucumber JSON report: simpler, but it represents outlines and rules less faithfully.

## Consequences

- Each open also downloads the latest results artifact, so opening stays slow.
- Results exist only for runs made after CI starts uploading them, and only while GitHub keeps
  the artifact.

Shapes the views `portal` and `readFeatures`.
