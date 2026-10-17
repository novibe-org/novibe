# Gherkin

**One `Feature:` per file, and every feature carries an `@id:`.** A plan, a backlog or a portal
refers to features by that id, never by path, so a file can be renamed or its scenarios moved
without breaking every reference to it.

**No comments in a feature file.** What a scenario means belongs in the `Feature:` narrative,
which is prose by design and is what a reader and any renderer both show. Where a scenario came
from is a tag, which can be queried and linted; a comment can be neither.

**No solutions in the spec.** A scenario says what someone can do and what they get, not which
button they press or which status code comes back. `no-restricted-patterns` refuses the words
that give a solution away — a starter list: a project whose product *is* an API drops the API
words from its copy.

The vocabulary is three tags, and a tag outside it fails the lint, so it cannot grow by
accident:

| | |
|---|---|
| `@id:<key>` | identity, required on every feature — the planning tool's ticket, or a slug without one; a scenario planned on its own may carry its own |
| `@backlog` | not built yet: future by declaration, not by absence |
| `@long-running` | slow enough to want excluding from the inner loop deliberately |

Add to `allowed-tags` what your project actually needs — where a rule came from, who owns it,
whatever you will really filter on. A rewrite needs several of its own, and the
`novibe-rewrite` plugin says what they are for.

## The linter

[`@novibe-org/gherkin-lint-plus`](https://github.com/novibe-org/gherkin-lint-plus), our fork of
[`krrish377/gherkin-lint-plus`](https://github.com/krrish377/gherkin-lint-plus):

```sh
npm i -D @novibe-org/gherkin-lint-plus
npx gherkin-lint-plus -c .gherkin-lintrc features
```

It carries `required-feature-tags`, `no-dupe-feature-tags` and `no-comments`, which the rest of
the flow depends on. They were offered upstream in
[krrish377/gherkin-lint-plus#1](https://github.com/krrish377/gherkin-lint-plus/pull/1), still
open; upstream has not moved since, so the fork is the one we maintain.

`pre-push` runs it when the linter is installed and there is a `features/` directory —
`FEATURES_DIR` if yours is elsewhere, `ALLOW_LINT=1` to override.
