# Code review

**A slice is reviewed before its pull request goes ready, not on GitHub.** The `developer` step
has reviewer agents review it locally, on the driver's Claude subscription — in parallel, and
each in a context of its own, not the one that wrote the code:

| Agent | Runs when the slice | Reviews |
|---|---|---|
| [`security-review`](../../plugins/novibe/agents/security-review.md) | crosses a trust boundary — see [Security](security.md#before-the-pr-goes-ready) | the diff, with Cloudflare's [`security-audit`](https://github.com/cloudflare/security-audit-skill) |
| [`architecture-review`](../../plugins/novibe/agents/architecture-review.md) | changed the model or an ADR, and changed code | every dependency the slice adds across an element's boundary, against the model's relations and the accepted ADRs |

A slice that meets neither trigger is not reviewed by an agent.

**A finding quotes what it contradicts** — the relation, or the ADR line. One that cannot be
tied to a quoted line is left out, which keeps a reviewer's taste out of the findings.

**The reviewers only report.** The `developer` step fixes a confirmed finding test-first — never
by changing the spec, the model or an ADR — and posts one comment on the pull request listing
every finding: the reviewer, its severity, `file:line`, and fixed in which commit or open and
why. Reviewed again, it edits that comment rather than adding another.

**The driver merges.** They read the spec, the design and that comment, not the whole diff; no
agent merges.

[`plugins/novibe/evals/`](../../plugins/novibe/evals/) checks the `developer` step's judgment: the
`security-audit` cases which slices get a security review, the `architecture-review` case that
code contradicting the model the slice just changed is fixed, not the model.
