---
name: architecture-review
description: Review a pull request against the architecture model and the ADRs, and flag code that contradicts them.
---

# Architecture review

Read the architecture model in `docs/architecture/` and the ADRs in `docs/adrs/`, then flag code
in the diff that contradicts them:

- a dependency between parts the model has no relation for
- storage shared between applications
- a choice an ADR rules out

Name the element, relation or ADR the code contradicts. If the model is what's wrong, say so
rather than suggesting a workaround in code.
