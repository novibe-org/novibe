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
the boundary validates it, one tenant's data reachable by another — is for review, before the PR
goes ready.

## Before the PR goes ready

The `developer` step has reviewer agents review the slice locally, on the driver's Claude
subscription, in parallel and each in a context of its own — not the one that wrote the code:

| Agent | Runs when the slice | Reviews |
|---|---|---|
| [`security-review`](../../plugins/novibe/agents/security-review.md) | crosses a trust boundary: a new entry point, authentication, untrusted input reaching an interpreter, per-tenant data, secrets, dependencies or deployment config | the diff, with Cloudflare's [`security-audit`](https://github.com/cloudflare/security-audit-skill) |
| [`architecture-review`](../../plugins/novibe/agents/architecture-review.md) | changed the model or an ADR, and changed code | the code against them |

The audit is thorough and heavy, so a slice that crosses no boundary skips it, and the PR says
why. The reviewers only report; the `developer` step fixes a confirmed finding test-first and
posts one comment on the PR listing every finding — fixed in which commit, or open and why.

**A required check on GitHub keeps it from being skipped.** The `developer` step records its
decision in the PR description, on a line of its own, and
[`.github/workflows/security-audit.yml`](../../.github/workflows/security-audit.yml) checks that
every ready PR has it, with a real reason or result — not a bare `none` or the template:

```
Security audit: the delete entry point — no confirmed findings
Security audit: none — docs only
```

The judgment stays with the `developer` step; the check only reads that it was made and written
down. Drafts are skipped, and editing the description runs it again. It holds whoever makes the
PR ready — Claude, a person, the web UI — and calls no model. Every repository that develops the
NoVibe way and wants this safety copies the workflow and makes `recorded` a required status check
in its ruleset.

[`plugins/novibe/evals/`](../../plugins/novibe/evals/) checks the developer step's judgment. The `security-audit` cases
check that the developer step audits a slice adding an unguarded route and skips one that only
renames; the `architecture-review` case, that it fixes code contradicting the model the slice
just changed, rather than the model.

```bash
cd plugins/novibe
claude plugin eval . --scaffold --allow-tools Write --tag security-audit
```

Installing NoVibe from its marketplace, `nv-plugins`, installs the skill with it, pinned to a
commit of Cloudflare's repository; moving it is a pull request here. The Anthropic Directory
installs the plugin alone; there, install the skill from Cloudflare:

```bash
npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit --global
```

Without it, `security-review` reports that it did not run, and the `developer` step stops and
says how to install it.

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
