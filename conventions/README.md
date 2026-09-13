# Conventions

The rules of working this way, in the form a build can check. **Take what you want** — each
directory stands alone, and the guards inside it run on their own.

| | |
|---|---|
| [`git/`](git/) | a branch per slice, and what must not be pushed |
| [`code/`](code/) | comments state a constraint the code cannot express |
| [`gherkin/`](gherkin/) | what a feature file carries, and the tag vocabulary |
| [`security/`](security/) | a credential is never committed in the first place |

## Adopting

Copy the guard you want into your own hook, or point git at the directory and let it run all
of them:

```sh
git config core.hooksPath conventions/githooks
```

`githooks/pre-push` and `githooks/pre-commit` name the guards this repository runs. Drop a line
to drop a topic.

These are the files this repository uses, not copies of them — so a guard that stops working
stops working here first. Every guard is overridable, because one you cannot override is one
people delete.
