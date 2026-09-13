# Conventions

The rules of working this way, and why. Each is enforced by a file in the place its tool reads
it, and this repository is set up with all of them — so a guard that stops working stops working
here first. **Take what you want**; every guard stands alone.

| Convention | Asks for | Enforced by |
|---|---|---|
| [Claude Code](claude-code.md) | every Claude session, local or on the web, turns the guards on | [`.claude/settings.json`](../../.claude/settings.json) |
| [Git](git.md) | a branch per slice, and what must not be pushed | [`.githooks/pre-push.d/git.sh`](../../.githooks/pre-push.d/git.sh) |
| [Code](code.md) | comments state a constraint the code cannot express | [`.githooks/pre-push.d/code.sh`](../../.githooks/pre-push.d/code.sh) |
| [Gherkin](gherkin.md) | what a feature file carries, and the tag vocabulary | [`.githooks/pre-push.d/gherkin.sh`](../../.githooks/pre-push.d/gherkin.sh), [`.gherkin-lintrc`](../../.gherkin-lintrc) |
| [LikeC4](likec4.md) | the architecture model validates | [`.githooks/pre-push.d/likec4.sh`](../../.githooks/pre-push.d/likec4.sh) |
| [Phases](phases.md) | a commit is spec, design or code — never a mix | [`.githooks/pre-push.d/phases.sh`](../../.githooks/pre-push.d/phases.sh) |
| [Copilot](copilot.md) | Copilot ships without touching the spec or the design, and reviews for architecture and security | [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md), [`.github/skills/`](../../.github/skills/) |
| [Security](security.md) | a credential is never committed in the first place | [`.githooks/pre-commit.d/security.sh`](../../.githooks/pre-commit.d/security.sh) |

## Adopting

Point an assistant at this repository — *"set up the git and gherkin conventions from
novibe-org/novibe here"*. Each convention says what it asks for and which file enforces it, which
is enough to wire it the way that project already runs hooks: husky, lefthook, a framework, or
plain `core.hooksPath`.

By hand it is the same thing. Every guard is a standalone script that exits non-zero when it
refuses, so call the ones you want from your own `pre-push` or `pre-commit` — as
[`.githooks/pre-push`](../../.githooks/pre-push) does here.

Every guard is overridable except one: the credential path check refuses and means it, because a
bypass on that one is the only thing it exists to prevent. The rest take an override, since a
guard you cannot override is a guard people delete.
