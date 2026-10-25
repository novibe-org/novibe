![NoVibe](icon.svg)

# NoVibe

### You manage the intent. The machine writes the code.

Spec-driven development for Claude Code, on standards you already know — **Gherkin** that runs
as the tests, and a **C4** design you can look at. Ask Claude to build something *the NoVibe
way*, and it walks one slice at a time, pausing for your call between steps.

**One slice, the NoVibe way:**

| | You | The agent |
|---|---|---|
| **1 · Specify** | answer, one round at a time | asks until a Gherkin feature file holds what to build |
| **2 · Design** | decide | asks until a [LikeC4](https://likec4.dev) model holds the design; an ADR only for a cross-cutting decision |
| **3 · Build** | watch the scenarios turn green | writes the tests first — the feature file *is* the test |
| **4 · Ship** | review the spec and the design, not a thousand lines of diff | hands over a change that matches what you decided |

> **Vibe coding:** describe it, ship it, audit what the machine made — trapped in review hell.
>
> **NoVibe:** you author the spec and the design; the machine builds to them, and the executable spec proves it.

## Install

In Claude Code, open `/plugin` and find **NoVibe** under Discover. Or from the terminal:

```text
claude plugin install novibe --marketplace novibe-org/novibe
```

In each repository that works the NoVibe way, add a `.novibe.yml` at its root; a comment is enough:
`# This repository works the NoVibe way`.

## Skills and agents

| Invoke | What it does for you |
|---|---|
| **`novibe`** | drives a change end to end — spec → design → tests — one step at a time |
| **`requirements-engineer`** | asks you, round by round, until the feature file holds *what* to build |
| **`architect`** | for a slice that brings a new component, framework or technology: asks you the same way until the C4 model holds the design; an ADR only when it matters |
| **`developer`** | builds it test-first — red → green — until the spec's scenarios pass |

| Agent | Reviews, before the PR goes ready |
|---|---|
| **`security-review`** | a slice that crosses a trust boundary, with Cloudflare's [`security-audit`](https://github.com/cloudflare/security-audit-skill) |
| **`architecture-review`** | a slice that changed the C4 model or an ADR: its code against them |
| **`clean-code-review`** | a slice that changed code: by Clean Code's heuristics, each finding cited by its ID |

Only need one part? Invoke `requirements-engineer`, `architect`, or `developer` directly. Skip
NoVibe for trivial edits.

In a repository with a `.novibe.yml` at its root, a `SessionStart` hook tells each session which skill
a spec, the architecture or code goes through, so a request that names the fix doesn't skip it.

## What it touches

The skills are plain `SKILL.md` instructions, and the reviewer agents plain agent files that
read and report, never change. Its one hook prints that reminder and nothing else; the plugin
ships no MCP server, and sends nothing anywhere of its own. `security-review` runs Cloudflare's `security-audit`: installing NoVibe from
its marketplace installs it too; from the Directory, install it with
`npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit --global`. It works through the tools your session already has: files
in your repository, and a planning tool such as Jira only if you connected one.

## More

The method, its conventions, and the git hooks that enforce them every time:
[github.com/novibe-org/novibe](https://github.com/novibe-org/novibe) ·
[novibe.org](https://novibe.org)

Apache-2.0
