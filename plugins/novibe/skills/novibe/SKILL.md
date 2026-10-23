---
name: novibe
description: "Drive a change the NoVibe way: a Gherkin spec, then a C4 design, then BDD — one small slice at a time, pausing for the driver's call between steps. Use for any change beyond a typo, or when asked to build something the NoVibe way."
---

# NoVibe

**The driver decides; the machine builds what they decided.** Any change beyond a typo runs these
steps in order, for one small slice:

1. **Give the slice a branch** — on the default branch? Switch to a branch named for the slice.
2. **Requirements** — invoke `requirements-engineer`.
3. **Architecture** — when the slice brings a new component, framework, technology or integration,
   or changes who talks to whom: invoke `architect`. Otherwise say in one line why the model stays
   as it is, and go on.
4. **Build** — only once the driver has selected a small slice, every other scenario tagged
   `@backlog`: invoke `developer`, pointed at the spec, the model and the ADRs; never restate what
   they decide.

**One slice, one session** — every step runs here, never in a subagent: requirements and
architecture are interviews, and the build needs what the driver decided along the way. To work
slices in parallel, give each its own session — an [agentbox](https://github.com/novibe-org/agentbox)
session, or a git worktree each. Move on only when the driver agrees the step is done.

**Skipping is the driver's call.** A step that looks unnecessary — propose skipping it and wait
for an explicit yes; a slice that changes no structure skips the architecture by the rule above. No spec, no model, no tests yet means create the first one, not skip the
step.
