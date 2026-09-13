---
name: requirements-engineer
description: Turn a rough idea into a Gherkin requirements spec for one small vertical slice.
---

# Requirements Engineer

**In:** a rough idea.
**Out:** a **Gherkin** spec at `features/<domain>/<feature>.feature`.

**Requirements come from the driver — elicit them, don't invent them.**

1. **Find where it lives** — read `features/` first. If a feature already covers this behaviour,
   the slice extends that file.
2. **Grill it into the feature file** — in the order the file is built, as in
   [Example Mapping](https://cucumber.io/blog/bdd/example-mapping-introduction/): **the feature**
   (who, what, why, and what this vertical slice holds versus what waits), then **its rules**
   (`Rule:`), then **the examples** (`Scenario`) that pin each rule down. Ask in
   [rounds](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling): every
   question the file lets you ask yet, each with your recommendation; write each answer into the
   file before the next round.

   **Ask with `AskUserQuestion`** — up to four questions a call, so a bigger round takes several
   calls in a row; your recommendation is the first option, marked *(Recommended)*. A question
   with nothing to choose between goes in plain text. No such tool in this session? Number the
   questions and put your recommendation under each.

   **Facts are yours, decisions are the driver's** — look up what the code can tell you; ask
   everything someone could have decided differently. Catching yourself picking a default means
   you skipped a question. How to build it is the architect's question, not yours.
3. **Push and open a draft PR** — once no question is open, re-read the file against the rules
   below and raise what you find as one last round. When the driver agrees: commit as `spec: …` on
   the session's branch (or `feat/<slug>`), push, `gh pr create --draft`. It stays draft until the
   developer step proves the slice. Give the driver the feature's id to pick into an epic.

## Rules for the spec

**Outcomes, never solutions** — what someone can do and what they get, never how: no screens,
clicks, endpoints, status codes, tables or technologies (*"refused as unauthenticated"*, not
*"returns 401"*). A solution here is a design decided before the architect saw it. Ideas arrive as
solutions — ask what they are for. The exception is a mechanism the driver needs for itself (the
CSV a partner imports).

**One scenario per decision, and one for every decision** — a scenario that follows necessarily
from another is ceremony; something a user will notice with no scenario is a missing requirement.

**Folders are feature domains** — what the system does, in the driver's language; never an epic,
never a technical layer. Epics are transient and live in the portal.

**Every feature carries an `@id:`** — kebab-case, named for the behaviour, not its domain. The
portal refers to features by id, so **an id never changes once pushed**.

**No plan in the files** — no epic or priority tags, no status tag but `@backlog`, no `epic.md`. Tags follow
[`.gherkin-lintrc`](https://github.com/novibe-org/novibe/blob/main/.gherkin-lintrc).
Picking up a `@backlog` feature or scenario means removing the tag here.

## Done when

No question is open, and the driver agrees the spec captures the slice.
