<div align="center">

# NoVibe

### Be the driver, not the passenger.

**A spec-driven development suite** — Claude Code skills that make you decide first, a portal to
read and plan the specification, and the guard rails that keep it honest.

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
| [**The plugin**](plugins/novibe/) | a guided flow for Claude Code, and the specialists it runs |
| [**The portal**](apps/portal/) | the specification, what the last run proved, and the plan — in one page |
| [**Conventions**](docs/conventions/) | the guard rails that keep an agentic workflow honest, checked by git hooks |

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
contract; code is their consequence. Start each slice in its own
[Claude Code on the web](https://claude.ai/code) session, so slices run side by side:

1. **Specify** it as business scenarios — then pick the feature into its epic in the portal.
2. **Design** it in the architecture model — look at it with `likec4 serve`.
3. **Build** it test-first — point it at the spec, the model and the ADRs; don't restate the
   decisions in your prompt, or it builds what you wrote instead of what was reviewed.
4. **Ship** it — turn on
   [agent merge](https://docs.github.com/en/copilot/how-tos/github-copilot-app/managing-issues-and-pull-requests#merging-a-pull-request)
   in the GitHub Copilot app: it answers review comments, fixes failing checks and merge
   conflicts, and merges once GitHub allows. Turning it on is your decision to merge.

Only need one part? Invoke `requirements-engineer`, `architect`, or `developer` directly.
Skip NoVibe for trivial edits.

## 🗺️ The portal

**Mostly for big projects and planning in advance** — a small project can pick its next slice
without it.

Features live in the repository by domain; **epics don't** — which feature goes into which epic,
and in what order, is a decision people keep changing, so it lives in the portal instead. The
portal reads the feature files on any of a repository's branches straight from GitHub, main
unless you choose another, shows what that branch's latest test run proved for each scenario, and
lets you drag features into epics. It runs locally under `wrangler dev`;
[`apps/portal/README.md`](apps/portal/README.md) says how.

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

Claude sessions turn the hooks on themselves, locally and on the web, through
[`.claude/settings.json`](.claude/settings.json). Pushing without Claude? Once per clone:

```
git config core.hooksPath .githooks
```

This repository is set up the way a NoVibe project should be, so adopting means copying from where
each file already lives:

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
