# Security

**A credential is never committed in the first place.** `.gitignore` is not enough on its own:
it has no effect once a file is tracked, and a branch cut before the rule existed has nothing.

## What `pre-commit` refuses

- **A staged file whose *path* looks like a credential** — `.env`, `secrets.yaml`, `*.secret`,
  with `.env.example` and friends allowed. Checking the path means it does not depend on
  recognising what is inside. This one fails closed.
- **A secret found by `gitleaks`** in the staged changes, when it is installed. This one fails
  open, so not having the tool does not block anybody.

If something is already tracked, `git rm --cached <path>` — the file stays on disk.

## If you add a gitleaks allowlist

Anchor the patterns **and** set `regexTarget = "secret"`. Anchoring alone tests the regex
against the rule's whole match, key name and separator included, so `^value$` matches nothing
and the allowlist allows nothing — which looks like it worked, right up until the eight
findings it was meant to permit come back.
