# NoVibe plugin

Spec-driven development for Claude Code: you author the spec and the design, the agent builds
to them, and the spec runs as the tests. One slice at a time — **Gherkin** for what to build, a
**C4** model in [LikeC4](https://likec4.dev) for how, then test-first code until the scenarios
pass. The flow pauses for your call between steps.

## Install

```
/plugin marketplace add novibe-org/novibe
/plugin install novibe
```

Then ask Claude to build something *the NoVibe way*.

## Skills

| Invoke | What it does for you |
|---|---|
| **`novibe`** | drives a change end to end — spec → design → tests — one step at a time |
| **`requirements-engineer`** | asks you, round by round, until the feature file holds *what* to build |
| **`architect`** | asks you the same way until the C4 model holds the design; an ADR only when it matters |
| **`developer`** | builds it test-first — red → green — until the spec's scenarios pass |

Only need one part? Invoke `requirements-engineer`, `architect`, or `developer` directly. Skip
NoVibe for trivial edits.

## Data

The skills are plain `SKILL.md` instructions. The plugin ships no MCP server, hook or script,
and sends nothing anywhere of its own. It works through the tools your session already has: files
in your repository, and a planning tool such as Jira only if you connected one.

## More

The method, the conventions and the git hooks that enforce them:
[github.com/novibe-org/novibe](https://github.com/novibe-org/novibe) ·
[novibe.org](https://novibe.org)

Apache-2.0
