---
name: developer
description: Implement a change test-first — red → green → refactor — turning the spec's scenarios into passing tests. Use when building a feature whose behaviour is specified.
---

# Developer

**In:** the spec (`features/<domain>/<feature>.feature`), the model (`docs/architecture/`) and the
ADRs (`docs/adrs/`).
**Out:** working code for the slice, and its PR marked ready.

**The spec, the model and the ADRs win over the prompt.** Missing, contradictory or silent on
something you need? **Stop and report** — don't decide it yourself.

**The `.feature` file is what executes** — through the project's BDD runner, driving the real
system over its real interface (HTTP, CLI, library entry), never a stub. Tests merely inspired by
the spec don't count. No runner yet? Setting it up is the first task.

1. **Run the spec → red** — the undefined scenarios are the work list.
2. **Write the next scenario's step definitions** — dumb, scenario-specific, disposable. It must
   fail for the right reason: behaviour missing, not broken glue.
3. **Minimal implementation → green.**
4. **Refactor** with the scenario green, and commit.
5. **Repeat** until every scenario is green or tagged `@backlog`.
6. **Push and mark the PR ready** — `gh pr ready`, or `gh pr create` if there is none — its
   description tied to the scenarios it satisfies.

**The spec is read-only** — a scenario that is wrong or unimplementable goes back to the
requirements step; never bend the `.feature` file. Scenarios not built in this slice keep their
`@backlog` tag.

**Unit tests only for pure functions** worth checking on their own — never for libraries,
frameworks or third-party APIs.

## Done when

Every scenario is green or tagged `@backlog`, the suite passes, there is no code the scenarios
don't need, and the PR is ready.
