<div align="center">

# NoVibe

### Spec-driven development for coding agents — you manage the intent, the machine writes the code.

**Be the driver, not the passenger.** Skills that make you decide first — packaged as a Claude
Code plugin — and the conventions and guard rails that keep it honest.

*AI made writing code cheap. The work that matters — deciding what to build, designing it,
proving it right — didn't change. **NoVibe makes you do it first.***

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-3b82f6?style=flat-square)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-d97757?style=flat-square)](https://code.claude.com)
[![Manifesto](https://img.shields.io/badge/manifesto-novibe.org-6e56cf?style=flat-square)](https://novibe.org)

</div>

---

> **Vibe coding:** describe it, ship it, audit what the machine made. Trapped in review hell.
> **NoVibe:** spec-driven — you author the spec and the design; the machine builds to them, and
> the **executable spec proves it**. The `.feature` file isn't documentation of the code; the
> code is an implementation of the spec.

## ✨ What you get

| | |
|---|---|
| [**The plugin**](plugins/novibe/) | a guided flow for your coding agent, and the specialists it runs — a Claude Code plugin; the skills are plain `SKILL.md` |
| [**Conventions**](docs/conventions/) | the rules that keep an agentic workflow honest |
| [**Guard rails**](.githooks/) | git hooks that enforce them, every time |

Alongside: [cockpit](https://github.com/novibe-org/cockpit) — the driver's view of the spec, what
the tests proved and the plan; [agentbox](https://github.com/novibe-org/agentbox) to run sessions.

## 🧭 The plugin

| Invoke | What it does for you |
|---|---|
| **`novibe`** | drives a change end to end — spec → design → tests — one step at a time |
| **`requirements-engineer`** | asks you, round by round, until the feature file holds *what* to build |
| **`architect`** | asks you the same way until the C4 model holds the design; an ADR only when it matters |
| **`developer`** | builds it test-first — red → green — until the spec's scenarios pass |

```
/plugin marketplace add novibe-org/novibe
/plugin install novibe
```

## 🚀 Use

Ask Claude to build something **the NoVibe way** (or invoke `novibe`). It walks the flow one
step at a time and **pauses for your call between steps** — the spec and the model are the
contract; code is their consequence. Give each slice its own session:

1. **Specify** it as business scenarios.
2. **Design** it in the [LikeC4](https://likec4.dev) model, its views layered after
   [arc42](https://arc42.org/overview/). A complex design decision? Visualize and review it with
   `npx likec4 serve docs/architecture`.
3. **Build** it test-first — point it at the spec, the model and the ADRs; don't restate the
   decisions in your prompt, or it builds what you wrote instead of what was reviewed.
4. **Ship** it — turn on
   [agent merge](https://docs.github.com/en/copilot/how-tos/github-copilot-app/managing-issues-and-pull-requests#merging-a-pull-request)
   in the GitHub Copilot app: it answers review comments, fixes failing checks and merge
   conflicts, and merges once GitHub allows. Turning it on is your decision to merge.

Only need one part? Invoke `requirements-engineer`, `architect`, or `developer` directly.
Skip NoVibe for trivial edits.

## 🖥️ Runtime

Where your agents run is your choice — locally, in a container, or in the cloud. One slice per
session keeps slices apart; isolating them, with worktrees or separate sessions, is up to you.
We use [agentbox](https://github.com/novibe-org/agentbox): one container per session.

## 🗺️ Planning

Feature files live in the repository, grouped by domain — what the system does, never an epic.
**The plan doesn't:** epics, priorities and how a slice is split change all the time, so they
belong in a planning tool — Jira, [cockpit](https://github.com/novibe-org/cockpit), whatever you
already use. Tag a feature, or a scenario planned on its own, with its ticket as its id
(`@id:<ticket>`) and the tool keeps the rest.

The vision, the epic and why it matters usually come first, in that tool; NoVibe splits it down
into slices. Ask `requirements-engineer` to create the slice's ticket under the epic — or the epic
itself — when your tool is connected. More of this will be automated.

## 📚 Examples

| | |
|---|---|
| [**cockpit**](https://github.com/novibe-org/cockpit) | a whole project built the NoVibe way — its [features](https://github.com/novibe-org/cockpit/tree/main/features), its [architecture model](https://github.com/novibe-org/cockpit/tree/main/docs/architecture), its [ADRs](https://github.com/novibe-org/cockpit/tree/main/docs/adrs), the guard rails, and every change committed spec → design → tests |

## 🪝 Guard rails

A skill is guidance: an agent follows it most of the time, not every time. What has to hold every
time is enforced by a git hook instead — deterministic, whatever the agent made of its skill, and
just as much for fast merges and machine-written diffs. These are the guards this repository uses
itself; take the ones you want:

| | Refuses |
|---|---|
| [git](docs/conventions/git.md) | a push to a merged or closed pull request, and a branch stacked on another open one |
| [code](docs/conventions/code.md) | a diff that is mostly added comments |
| [security](docs/conventions/security.md) | a commit of a file whose path looks like a credential — the one guard without an override |
| [gherkin](docs/conventions/gherkin.md) | a feature file without an `@id:`, with an unknown tag, with comments, or naming a click, a button or an endpoint |
| [likec4](docs/conventions/likec4.md) | an architecture model that does not validate |
| [phases](docs/conventions/phases.md) | a `spec:` commit touching more than the spec, an `arch:` commit more than the model and ADRs, and any other commit touching either |
| [copilot](docs/conventions/copilot.md) | — instructions that keep agent merge off the spec and the design, and review skills that flag code contradicting the architecture or creating a security problem |

Claude sessions turn the hooks on themselves, wherever they run, through
[`.claude/settings.json`](.claude/settings.json). Pushing without Claude? Once per clone:

```
git config core.hooksPath .githooks
```

Adopting them means copying from where each file already lives:

| Copy | For |
|---|---|
| [`.githooks/`](.githooks/) | the entry hooks, and the guards in `pre-push.d/` and `pre-commit.d/` |
| [`.gherkin-lintrc`](.gherkin-lintrc) | the feature-file lint |
| [`.claude/settings.json`](.claude/settings.json) | the hook that turns the guards on, and the plugin |
| [`.github/copilot-instructions.md`](.github/copilot-instructions.md), [`.github/skills/`](.github/skills/) | Copilot's instructions and review skills |

[`docs/conventions/`](docs/conventions/) says what each rule is for.

<div align="center">

**Learn more at [novibe.org](https://novibe.org)** · be the driver.

</div>
