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

In Claude Code, open `/plugin` and find **NoVibe** under Discover. Or install the latest from
`main`:

```text
/plugin install novibe --marketplace novibe-org/novibe
```

## Skills

| Invoke | What it does for you |
|---|---|
| **`novibe`** | drives a change end to end — spec → design → tests — one step at a time |
| **`requirements-engineer`** | asks you, round by round, until the feature file holds *what* to build |
| **`architect`** | asks you the same way until the C4 model holds the design; an ADR only when it matters |
| **`developer`** | builds it test-first — red → green — until the spec's scenarios pass |

Only need one part? Invoke `requirements-engineer`, `architect`, or `developer` directly. Skip
NoVibe for trivial edits.

## What it touches

The skills are plain `SKILL.md` instructions. The plugin ships no MCP server, hook or script,
and sends nothing anywhere of its own. It works through the tools your session already has: files
in your repository, and a planning tool such as Jira only if you connected one.

## More

The method, its conventions, and the git hooks that enforce them every time:
[github.com/novibe-org/novibe](https://github.com/novibe-org/novibe) ·
[novibe.org](https://novibe.org)

Apache-2.0
