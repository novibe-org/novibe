# Conventions

The rules of working this way, in the form a build can check. **Take what you want** — each
directory stands alone, and the guards inside it run on their own.

| | |
|---|---|
| [`claude/`](claude/) | every Claude session, local or on the web, turns the guards on |
| [`git/`](git/) | a branch per slice, and what must not be pushed |
| [`code/`](code/) | comments state a constraint the code cannot express |
| [`gherkin/`](gherkin/) | what a feature file carries, and the tag vocabulary |
| [`likec4/`](likec4/) | the architecture model validates |
| [`phases/`](phases/) | a commit is spec, design or code — never a mix |
| [`copilot/`](copilot/) | Copilot ships the pull request without touching the spec or the design, and reviews code against the architecture |
| [`security/`](security/) | a credential is never committed in the first place |

## Adopting

Point an assistant at this directory — *"set up the git and gherkin conventions from
novibe-org/novibe in this repository"*. Each topic says what it asks for and ships the guard
that enforces it, which is enough to wire it the way that project already runs hooks: husky,
lefthook, a framework, or plain `core.hooksPath`.

By hand it is the same thing. Every guard is a standalone script that exits non-zero when it
refuses, so call the ones you want from your own `pre-push` or `pre-commit`. This repository
does exactly that, in [`.githooks/`](../.githooks).

These are the files this repository uses, not copies of them — so a guard that stops working
stops working here first. Every guard is overridable except one: the credential path check refuses and means it, because
a bypass on that one is the only thing it exists to prevent. The rest take an override, since a
guard you cannot override is a guard people delete.
