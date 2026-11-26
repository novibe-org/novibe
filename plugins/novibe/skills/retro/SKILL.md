---
name: retro
description: "Look back on a slice that was harder than it should have been, find where the agent struggled, and propose where each lesson goes — a guard, a reviewer heuristic, the spec or the model, an issue with an eval for NoVibe — never a note in CLAUDE.md or memory. Proposes only; the driver picks. Use after a slice the driver calls hard, while its session is still in context."
---

# Retro

**In:** the slice's session — this one, while it is still in context, or the log the driver
points to — and the slice's branch.
**Out:** findings for the driver, most severe first. You write nothing until the driver picks one.

**A lesson goes where it holds every time.** A skill is guidance, followed most of the time; a
rule that has to hold is a guard. A note in `CLAUDE.md`, `AGENTS.md` or a memory file is neither:
never propose one, nor a reminder anyone has to keep in mind.

**A smooth slice teaches nothing.** No struggle in the session? Say so and propose nothing — no
"consider", no nice-to-have, no list of what you left out. A retro that has to find something
invents generic advice.

**Only the session counts.** The context was compacted and the driver points to no log? Say so,
and ask for the session's log; a summary is no moment to quote.

1. **Find the struggles** — read the session, and the spec, model, conventions and guards it
   names. A struggle is a moment that cost the driver: they corrected the agent, the agent did a
   step twice or undid one, the driver answered a question the spec, the model or an ADR should
   have answered, a guard was overridden or a reviewer's finding rejected, a command kept failing.
   A guard that refused once and was then satisfied is the rail working: no struggle, unless the
   same refusal came back.
2. **Tie each to its moments** — quote them. A finding you cannot point to in the session is
   dropped, however true it sounds.
3. **Route each by whose rule it is, then by what went wrong.** A NoVibe skill, reviewer agent or
   reference, or a guard copied from NoVibe — `.githooks/VERSION` names the NoVibe release it came
   from — is NoVibe's, and so is a rule a NoVibe skill states, even where the project writes it
   down too. In a repository that uses NoVibe, its fix is an issue for
   [novibe-org/novibe](https://github.com/novibe-org/novibe/issues), drafted for the driver, with
   the eval case that reproduces it — never a workaround in that repository. In NoVibe's own
   repository, it is the eval case in `plugins/novibe/evals/`, then the fix that makes it pass.
   Everything else is the project's:

   | The session shows… | The fix |
   |---|---|
   | a rule a machine can check, broken — written down or not | a guard: a git hook in `.githooks/` or a CI check that refuses it |
   | a rule only judgement can check, broken | a heuristic for the project's reviewer |
   | behaviour the driver settled while building, that the spec doesn't hold | scenarios, through the requirements step — a `spec:` commit |
   | structure the driver settled while building, that the model doesn't hold | the model, through the architecture step — an `arch:` commit |
   | a guard or reviewer that fired on what the driver wanted | loosen it or retire it — never a reminder to override it |
   | the project's own tooling in the way | the project's fix |

   Mechanical beats prose: when a check can catch it, the fix is the check, never a line in a doc.
   Prefer wiring up a check the project already has over writing a new one.
4. **Propose** — per finding: what happened, its moments, the fix and where it goes. Most severe
   first: what cost the driver most, or would again. Then stop: the driver picks.
5. **Hand each picked finding to its owner** — a spec or model change lands on this slice's branch,
   through `requirements-engineer` or `architect`, before the driver merges; merged already, it is
   a new slice from the default branch. A guard, heuristic or tooling fix is a slice of its own:
   give the driver its branch name and a short brief to start in a session of its own. A NoVibe
   issue: show the driver its exact body — it goes to a public tracker, so nothing private — and
   file it with `gh issue create` only once they say so.

## Done when

Every struggle in the session is a finding tied to its moments, or there were none and you said
so; the driver has picked; and each picked finding is with its owner.
