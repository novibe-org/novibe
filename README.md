<div align="center">

<img src=".github/icon.svg" alt="" width="120" height="120" />

# NoVibe

### You manage the intent. The machine writes the code.

Spec-driven development for Claude Code, on standards you already know —
**Gherkin** that runs as the tests, a **C4** design you can look at, and **git hooks** that hold
every time.

</div>

<div align="center">

In Claude Code, open `/plugin` and find **NoVibe** under Discover — it is in the
[Anthropic Directory](https://claude.ai/directory). Or from the terminal:

</div>

```text
claude plugin install novibe --marketplace novibe-org/novibe
```

<div align="center">

Then ask Claude to build something *the NoVibe way*.

[![Plugin version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fnovibe-org%2Fnovibe%2Fmain%2Fplugins%2Fnovibe%2F.claude-plugin%2Fplugin.json&query=%24.version&label=Claude%20Code%20plugin&color=d97757&style=flat-square&logo=claude&logoColor=white)](plugins/novibe/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-3b82f6?style=flat-square)](LICENSE)
[![Manifesto](https://img.shields.io/badge/manifesto-novibe.org-6e56cf?style=flat-square)](https://novibe.org)

</div>

**One slice, the NoVibe way:**

| | You | The agent |
|---|---|---|
| **1&nbsp;·&nbsp;Specify** | answer, one round at a time | asks until a Gherkin feature file holds what to build |
| **2&nbsp;·&nbsp;Design** | decide | asks until a LikeC4 model holds the design; an ADR only for a cross-cutting decision |
| **3&nbsp;·&nbsp;Build** | watch the scenarios turn green | writes the tests first — the feature file *is* the test |
| **4&nbsp;·&nbsp;Ship** | review the spec and the design, not a thousand lines of diff | git hooks and a required check refuse what the conventions forbid |

> **Vibe coding:** describe it, ship it, audit what the machine made — trapped in review hell.
>
> **NoVibe:** you author the spec and the design; the machine builds to them, and the executable
> spec proves it.

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
| **`architect`** | for a slice that brings a new component, framework or technology: asks you the same way until the C4 model holds the design; an ADR only when it matters |
| **`developer`** | builds it test-first — red → green — until the spec's scenarios pass |

The `developer` step starts the reviewer agents a slice calls for, in parallel, on your Claude
subscription, and fixes what they find before the PR goes ready.

| Agent | Reviews, before the PR goes ready |
|---|---|
| **`security-review`** | a slice that crosses a trust boundary, with Cloudflare's [`security-audit`](https://github.com/cloudflare/security-audit-skill) |
| **`architecture-review`** | a slice that changed the C4 model or an ADR: its code against them |

## 🚀 Use

Ask Claude to build something **the NoVibe way** (or invoke `novibe`). It walks the flow one
step at a time and **pauses for your call between steps** — the spec and the model are the
contract; code is their consequence. Give each slice its own session:

1. **Specify** it as business scenarios.
2. **Design** it in the [LikeC4](https://likec4.dev) model, its views layered after
   [arc42](https://arc42.org/overview/). A complex design decision? Visualize and review it with
   `npx likec4 serve docs/architecture`.
3. **Build** it test-first — point it at the spec, the model and the ADRs; don't restate the
   decisions in your prompt, or it builds what you wrote instead of what was reviewed. Reviewer
   agents review the slice before its PR goes ready.
4. **Ship** it — turn on
   [agent merge](https://docs.github.com/en/copilot/how-tos/github-copilot-app/managing-issues-and-pull-requests#merging-a-pull-request)
   in the GitHub Copilot app: it reads the pull request, fixes what blocks it, and merges as soon
   as GitHub allows. Turning it on is your decision to merge.

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
itself; take the ones you want. Each guard stands alone and takes an explicit override — except
the credential-path check:

| | Refuses |
|---|---|
| [git](docs/conventions/git.md) | a push to a merged or closed pull request, a rewrite of a branch whose pull request is open, and a branch stacked on another open one |
| [code](docs/conventions/code.md) | a diff that is mostly added comments |
| [security](docs/conventions/security.md) | a commit of a file whose path looks like a credential — the one guard without an override — and, on GitHub, merging a ready PR that does not record its security audit decision |
| [gherkin](docs/conventions/gherkin.md) | a feature file without an `@id:`, with an unknown tag, with comments, or naming a click, a button or an endpoint |
| [likec4](docs/conventions/likec4.md) | an architecture model that does not validate |
| [madr](docs/conventions/madr.md) | an ADR that is not MADR, or that shares its number with another |
| [phases](docs/conventions/phases.md) | a `spec:` commit touching more than the spec, an `arch:` commit more than the model and ADRs, and any other commit touching either |
| [copilot](docs/conventions/copilot.md) | — instructions that keep agent merge off the spec and the design |

Claude sessions turn the hooks on themselves, wherever they run, through
[`.claude/settings.json`](.claude/settings.json). Pushing without Claude? Once per clone:

```bash
git config core.hooksPath .githooks
```

Adopting them means copying from where each file already lives, at a [release](#releases) tag
rather than `main`:

| Copy | For |
|---|---|
| [`.githooks/`](.githooks/) | the entry hooks, and the guards in `pre-push.d/` and `pre-commit.d/` |
| [`.gherkin-lintrc`](.gherkin-lintrc) | the feature-file lint |
| [`.madrlintrc.json`](.madrlintrc.json) | the ADR lint |
| [`.claude/settings.json`](.claude/settings.json) | the hook that turns the guards on, and the plugin |
| [`.github/copilot-instructions.md`](.github/copilot-instructions.md) | Copilot's instructions for agent merge |
| [`.github/workflows/security-audit.yml`](.github/workflows/security-audit.yml) | the check that a ready PR records its security audit decision — make it a required check |

[`docs/conventions/`](docs/conventions/) says what each rule is for.

## Releases

Each version of the plugin is a [release](https://github.com/novibe-org/novibe/releases), tagged
`vX.Y.Z` with the `version` in [`plugin.json`](plugins/novibe/.claude-plugin/plugin.json). Its
notes list the pull requests since the last one, and those titled as breaking, `feat!: …`, come
first.

Pin a repository to a release, and a change to a skill or a hook reaches it in a pull request that
bumps the `ref`, rather than in the next session:

```json
"extraKnownMarketplaces": {
  "nv-plugins": {
    "source": { "source": "github", "repo": "novibe-org/novibe", "ref": "v0.9.5" }
  }
}
```

[`.githooks/VERSION`](.githooks/VERSION) says which release a copy of the hooks came from. Bump it
with `plugin.json`; a pull request where the two differ fails its check, and merging a new version
publishes its release.

<div align="center">

**Learn more at [novibe.org](https://novibe.org)** · be the driver.

</div>
