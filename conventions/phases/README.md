# Phases

**A commit belongs to one phase.** The spec, the design and the code are decided in that order,
and each by its own step — so a commit says which one it is, and touches nothing else.

| Commit | May touch |
|---|---|
| `spec: …` | `features/` |
| `arch: …` | `docs/architecture/` and `docs/adrs/` |
| anything else | everything except those |

A requirement that turns out wrong while building is fixed, not worked around: it becomes its own
`spec:` commit, where the driver sees it.

`pre-push` refuses a pushed commit that touches files outside its phase — `FEATURES_DIR`,
`ARCHITECTURE_DIR` and `ADRS_DIR` if yours live elsewhere, `ALLOW_PHASE=1` to override.
