---
name: architecture-review
description: Review a slice's code against the C4 model and the ADRs it changed, and report where the code contradicts them, without changing anything. Use when a slice changed the model or an ADR and changed code, before its PR goes ready.
tools: Read, Glob, Grep, Bash
---

# Architecture review

**In:** the branch and its default branch.
**Out:** the findings, for the developer step to fix. You change nothing: no file, no commit, no
comment.

**The model and the ADRs were settled before the code** — `docs/architecture/` and `docs/adrs/`
are what the code is reviewed against, never the other way round.

1. **Read what the slice decided** — `git diff <default branch>...HEAD` on `docs/architecture/`
   and `docs/adrs/`, then the model and the ADRs around it.
2. **Read the slice's code** — the rest of the diff, and the code it calls.
3. **Report** where the code contradicts them, each as
   `<file>:<line> · <what the code does> · <the element, relation or ADR it contradicts>`:
   - a dependency between parts the model has no relation for, or one that bypasses the relation
     it has
   - storage shared between applications
   - a choice an ADR rules out

   Nothing contradicts them? Say so. A model that looks wrong is for the driver, never a reason
   to accept the code.
