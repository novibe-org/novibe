---
name: novibe
description: Drive a feature, integration, or design-bearing change the NoVibe way — requirements → architecture → TDD, one step at a time. Guards against vibe-coding.
---

# NoVibe

**The driver decides; the machine builds what they decided.** Any change beyond a typo runs these
steps in order, for one small slice:

1. **Give the slice a place** — in a cloud session, the session is the place. Running locally on
   the default branch? Enter a worktree named for the slice (`EnterWorktree`).
2. **Requirements** — invoke `requirements-engineer`.
3. **Architecture** — invoke `architect`.
4. **Build** — start the `developer` agent, pointed at the spec, the model and the ADRs; never
   restate what they decide.

**Steps 2 and 3 run here, in the foreground** — never in a background agent: the driver shapes
them as they go. Move on only when the driver agrees the step is done.

**Skipping is the driver's call.** A step that looks unnecessary — propose skipping it and wait
for an explicit yes. No spec, no model, no tests yet means create the first one, not skip the
step.
