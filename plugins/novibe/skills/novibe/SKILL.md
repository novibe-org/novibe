---
name: novibe
description: Drive a feature, integration, or design-bearing change the NoVibe way — requirements → architecture → TDD, one step at a time. Guards against vibe-coding.
---

# NoVibe

**The driver decides; the machine builds what they decided.** Any change beyond a typo runs these
steps in order, for one small slice:

1. **Give the slice a branch** — on the default branch? Switch to a branch named for the slice.
2. **Requirements** — invoke `requirements-engineer`.
3. **Architecture** — invoke `architect`.
4. **Build** — invoke `developer`, pointed at the spec, the model and the ADRs; never restate
   what they decide.

**Every step runs here, in the foreground** — never in a background agent: the driver shapes
them as they go. Move on only when the driver agrees the step is done.

**Skipping is the driver's call.** A step that looks unnecessary — propose skipping it and wait
for an explicit yes. No spec, no model, no tests yet means create the first one, not skip the
step.
