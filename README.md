<div align="center">

# NoVibe for Claude Code

### Be the driver, not the passenger.

**Spec-driven development for Claude Code.**

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

A guided flow, plus the specialists it runs — each also usable on its own:

| Invoke | What it does for you |
|---|---|
| **`novibe`** | drives a change end to end — spec → design → tests — one step at a time |
| **`requirements-engineer`** | pins *what* to build as business scenarios you can read and test |
| **`architect`** | turns the spec into a clear C4 design (and a terse ADR only when it matters) |
| **`developer`** | builds it test-first — red → green — so it's proven, not hoped |
## 📦 Install

```
/plugin marketplace add novibe-org/nv-plugins
/plugin install novibe
```

## 🚀 Use

Ask Claude to build something **the NoVibe way** (or invoke `novibe`). It walks the
spec-driven flow one step at a time and **pauses for your call between steps** — the spec and
the model are the contract; code is their consequence. Start each slice in its own
[Claude Code on the web](https://claude.ai/code) session, so slices run side by side:

1. **Specify** it as business scenarios.
2. **Design** it in the architecture model — look at it with `likec4 serve`.
3. **Build** it test-first — point it at the spec, the model and the ADRs; don't restate the
   decisions in your prompt, or it builds what you wrote instead of what was reviewed.
4. **Ship** it — turn on
   [agent merge](https://docs.github.com/en/copilot/how-tos/github-copilot-app/managing-issues-and-pull-requests#merging-a-pull-request)
   in the GitHub Copilot app: it answers review comments, fixes failing checks and merge
   conflicts, and merges once GitHub allows. Turning it on is your decision to merge;
   [`conventions/copilot`](conventions/copilot/) keeps it off the spec and the design.

Only need one part? Invoke `requirements-engineer`, `architect`, or `developer` directly.
Skip NoVibe for trivial edits.

## 🪝 Guard rails (optional, recommended)

Working agentic means fast merges and machine-written diffs — two failure modes worth blocking
mechanically. This repo ships the guards it uses itself, in
[`conventions/`](conventions/) — a pre-push hook and the lint configuration for feature files.
Activate the hook per clone:

```
git config core.hooksPath .githooks
```

It refuses an orphaned push, a branch stacked on an open pull request, a diff that is mostly
added comments, a specification that does not lint, and an architecture model that does not
validate — each overridable, each fail-open.
[`conventions/README.md`](conventions/README.md) says what each one is for.

<div align="center">

**Learn more at [novibe.org](https://novibe.org)** · be the driver.

</div>
