# Gherkin

**One `Feature:` per file, and every feature carries an `@id:`.** A plan, a backlog or a portal
refers to features by that id, never by path, so a file can be renamed or its scenarios moved
without breaking every reference to it.

**No comments in a feature file.** What a scenario means belongs in the `Feature:` narrative,
which is prose by design and is what a reader and any renderer both show. Where a scenario came
from is a tag, which can be queried and linted; a comment can be neither.

The vocabulary is four tags, and a tag outside it fails the lint, so it cannot grow by
accident:

| | |
|---|---|
| `@id:<slug>` | identity, required on every feature |
| `@source:<origin>` | optional: where the rule came from — a standard, a policy, us |
| `@backlog` | not built yet: future by declaration, not by absence |
| `@long-running` | slow enough to want excluding from the inner loop deliberately |

Add to `allowed-tags` when your project needs more. A rewrite needs several — a citation into
the system being replaced, a departure kept on purpose, something reading could not settle —
and the `novibe-rewrite` plugin says what they are for.

## The linter

[`StefanStuehrmann/gherkin-lint-plus`](https://github.com/StefanStuehrmann/gherkin-lint-plus),
from its git URL rather than npm:

```sh
npm i -D github:StefanStuehrmann/gherkin-lint-plus
npx gherkin-lint-plus -c conventions/gherkin/.gherkin-lintrc features
```

It carries `required-feature-tags`, `no-dupe-feature-tags` and `no-comments`, which the rest of
the flow depends on. They were offered upstream; that pull request is still open months later.

`pre-push` runs it when the linter is installed and there is a `features/` directory —
`FEATURES_DIR` if yours is elsewhere, `ALLOW_LINT=1` to override.
