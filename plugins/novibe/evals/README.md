# Evals

Each case is a directory: `case.yaml` holds the prompt and its graders, `fixture.sh` builds the
repository the agent works in. The name says what the skill is expected to do.

| Tag | What it checks |
|---|---|
| `security-audit` | the developer audits a slice that crosses a trust boundary, and skips one that does not |
| `architecture-review` | the developer has code that contradicts the model, which the slice just changed, reviewed against it, and fixes the code rather than the model |
| `ubiquitous-language` | the requirements engineer names a feature with the field's term, not the driver's loose phrasing |
| `slice-size` | the developer stops on a slice too big to build at once, and starts a small one |
| `adr` | the architect keeps a feature out of ADRs, and asks before an ADR for a cross-cutting decision |

```bash
claude plugin eval plugins/novibe --scaffold --allow-tools Write --trust-plugin --judge-model sonnet
claude plugin eval plugins/novibe --tag adr --runs 1 --ablation none --scaffold --allow-tools Write --trust-plugin --judge-model sonnet
```

Sonnet as the judge: with the default, Haiku, a correct answer was sometimes graded FAIL.
