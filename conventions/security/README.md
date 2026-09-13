# Security

**A credential is never committed in the first place.** `.gitignore` is not enough on its own:
it has no effect once a file is tracked, and a branch cut before the rule existed has nothing.

## What `pre-commit` refuses

- **A staged file whose *path* looks like a credential** — `.env`, [`.dev.vars`](https://developers.cloudflare.com/workers/configuration/secrets/) (Cloudflare
  Workers), `secrets.yaml`, `*.secret`, each with their environment suffixes, and with
  `.example`, `.sample` and `.template` allowed. Checking the path means it does not depend on
  recognising what is inside. This one fails closed **and takes no override** — an escape hatch
  here is the only failure it exists to prevent.
- **A secret found by [`gitleaks`](https://github.com/gitleaks/gitleaks)** in the staged
  changes, when it is installed. This one fails
  open, so not having the tool does not block anybody.

If something is already tracked, `git rm --cached <path>` — the file stays on disk.

## On GitHub

Turn on what finds known problems the same way every time — free on public repositories; private
ones need GitHub's security products:

- **Code scanning** (CodeQL, default setup) — known vulnerability patterns, with Copilot Autofix
  proposing the fix.
- **Secret scanning with push protection** — a token or key refused at the push.
- **Dependency review** — a new dependency with a known vulnerability.

What a scanner cannot see — a new entry point without an authorization check, input used before
the boundary validates it, one tenant's data reachable by another — is for review:
[`copilot/skills/security-review`](../copilot/skills/security-review/).

## If you add a gitleaks allowlist

Anchor the patterns **and** set `regexTarget = "secret"`:

```toml
[[rules]]
id = "generic-api-key"
[rules.allowlist]
regexTarget = "secret"
regexes = ['''^the-exact-value-that-is-not-a-secret$''']
```

Anchoring alone tests the regex against the rule's whole match — key name and separator
included — so `^value$` matches nothing and the allowlist allows nothing. That looks like it
worked, right until the findings it was meant to permit all come back.

Allow the value, not the rule and not the file. A muted rule stays muted over code nobody has
written yet.

The full schema is in [gitleaks' configuration docs](https://github.com/gitleaks/gitleaks#configuration).
