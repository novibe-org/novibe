# Copilot

**Copilot ships the pull request, not the decisions behind it.** Agent merge answers review
comments, fixes failing checks and merges; without being told, it would as happily edit a
scenario to turn a check green.

**Copilot code review looks where the risk is.** `security-review` follows untrusted input
through the changed code to what makes it exploitable; `architecture-review` catches code that
ignores the model and the ADRs.

Copy them into your repository — or add their lines to the ones you have:

- [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md)
- [`.github/skills/`](../../.github/skills/) — `architecture-review` and `security-review`
