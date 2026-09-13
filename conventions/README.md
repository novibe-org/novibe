# Conventions

The rules of working this way, in the form a build can check. These are the files this
repository uses itself — not copies of them — so a rule that stops working stops working here
first.

| | |
|---|---|
| `githooks/pre-push` | four guards, all overridable, all fail-open when `gh` is absent |
| `.gherkin-lintrc` | what a feature file must carry, and the tag vocabulary |

## Adopting them

```sh
git config core.hooksPath conventions/githooks
npm i -D github:StefanStuehrmann/gherkin-lint-plus
npx gherkin-lint-plus -c conventions/.gherkin-lintrc features
```

Copy the two config files if you would rather keep them at your project root; the hook reads
them by path, so keep the paths together.

## What the hook refuses

- **A push to a branch whose pull request is already merged or closed.** The driver merges
  fast, and those commits are orphaned.
- **A branch that contains every commit of another whose pull request is open.** Its pull
  request would review that work as well as its own. Squash merges are handled: the guard asks
  which pull requests are open rather than whether commits are ancestors of `main`, because
  squashing puts a branch's content in `main` without its commits.
- **A diff whose added lines are mostly comments**, over both a count and a share — agents
  narrate. `COMMENT_GLOBS` names the languages, so set it rather than discovering that the
  guard silently never fires for yours.
- **A specification that does not lint**, when the linter is installed and there is a
  `features/` directory. Feedback here, a gate in CI.

Each is overridable — `ALLOW_STACKED=1`, `ALLOW_COMMENTS=1`, `ALLOW_LINT=1` — because a guard
you cannot override is a guard people delete.

## Which linter

[`StefanStuehrmann/gherkin-lint-plus`](https://github.com/StefanStuehrmann/gherkin-lint-plus),
installed from the git URL above rather than from npm. It carries three rules the published
package does not have — `required-feature-tags`, `no-dupe-feature-tags` and `no-comments` —
which the rest of the flow depends on: `@id:` is how a plan refers to a feature across renames,
and a feature file with comments is one whose narrative is missing.

They were offered upstream and the pull request is still open months later, so the fork is the
recommendation until that changes.
