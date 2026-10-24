# Code review

**A slice is reviewed before its pull request goes ready, not on GitHub.** The `developer` step
has reviewer agents review it locally, on the driver's Claude subscription — in parallel, and
each in a context of its own, not the one that wrote the code:


- [`security-review`](../../plugins/novibe/agents/security-review.md) — the diff, with Cloudflare's
  [`security-audit`](https://github.com/cloudflare/security-audit-skill)
- [`architecture-review`](../../plugins/novibe/agents/architecture-review.md) — the code against the
  model and the ADRs

Which reviewers a slice calls for, and how their findings are fixed and posted, is the
[`developer`](../../plugins/novibe/skills/developer/SKILL.md) step's steps 6 and 7. The reviewers only report.

**The driver merges.** They read the spec, the design and that comment, not the whole diff; no
agent merges.

[`plugins/novibe/evals/`](../../plugins/novibe/evals/) checks the `developer` step's judgment: the
`security-audit` cases which slices get a security review, the `architecture-review` case that
code contradicting the model the slice just changed is fixed, not the model.
