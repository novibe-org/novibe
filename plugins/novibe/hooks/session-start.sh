#!/bin/sh
# Only in a repository that works the NoVibe way: one with Gherkin specs.
[ -d "${CLAUDE_PROJECT_DIR:-.}/features" ] || exit 0

cat <<'TEXT'
This repository works the NoVibe way. Before writing a spec, the architecture or code, invoke the
skill for that step, even when the request names the fix:
- a spec (`features/`): `novibe:requirements-engineer`
- the architecture (`docs/architecture/`, `docs/adrs/`): `novibe:architect`
- code: `novibe:developer`
A new feature or behaviour, from idea to code: `novibe:novibe`. A typo, a question or a doc
change needs none.
TEXT
