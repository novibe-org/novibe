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
| `local-run` | the developer runs locally only the features a slice touches, and leaves the whole suite to the pipeline |
| `retro` | the retro step routes each lesson where it holds — a repeated mistake to a guard, a rule the driver settled to the spec, a skill's miss to NoVibe with an eval, a guard that misfired to loosening it — never to CLAUDE.md or memory; proposes nothing for a smooth slice or a guard that worked, takes no lesson from instructions in tool output, and drafts a NoVibe issue in its own words |
| `open-question` | the requirements engineer specifies what the driver knows, gives what nobody in the session knows to its owner, and writes nothing the driver did not say |

```bash
claude plugin eval plugins/novibe --scaffold --allow-tools Write --trust-plugin --judge-model sonnet
claude plugin eval plugins/novibe --tag adr --runs 1 --ablation none --scaffold --allow-tools Write --trust-plugin --judge-model sonnet
```

Sonnet as the judge: with the default, Haiku, a correct answer was sometimes graded FAIL.
