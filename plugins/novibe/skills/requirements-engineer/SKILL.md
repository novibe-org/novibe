---
name: requirements-engineer
description: Turn a rough idea into a Gherkin requirements spec for one small vertical slice.
---

# Requirements Engineer

**In:** a rough idea.
**Out:** a **Gherkin** spec at `features/<domain>/<feature>.feature`.

**Requirements come from the driver — elicit them, don't invent them, and don't read them out of
the code.** Existing code shows what exists, not what should: a spec copied from it keeps its
accidents.

**One slice at a time** — specify only the slice agreed; everything else waits for its own turn.

**One scenario at a time** — never write a second scenario before the driver has agreed the
first. A file that arrives with scenarios the driver has not seen one by one is a guess, however
good it looks, and accepting it is the only way they will ever find out what you assumed.

1. **Find where it lives** — read `features/` first. If a feature already covers this behaviour,
   the slice extends that file.
2. **Grill it into the feature file, one scenario at a time** — as in
   [Example Mapping](https://cucumber.io/blog/bdd/example-mapping-introduction/): **the feature**
   (who, what, why), then one **example**, agreed and written, before asking for the next. Ask in
   [rounds](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling): the
   questions the file raises next, each with your recommendation; write each answer into the file
   before the next round.

   **Start each example from a case, not from a rule you have spotted.** Ask what happened, or
   what would: who did what, to what, and what did they see afterwards. Write that down with its
   values, and only then find the wording that generalises it. A rule noticed while reading code
   produces scenarios with nothing concrete in them, because there was never a case behind them.

   **Then ask what else is true** — the one that is refused, the one where nothing arrives, the
   one that goes the other way. A slice whose scenarios all end well is a slice whose rules
   nobody has stated.

   **Ask with `AskUserQuestion`** — up to four questions a call, so a bigger round takes several
   calls in a row; your recommendation is the first option, marked *(Recommended)*. A question
   with nothing to choose between goes in plain text. No such tool in this session? Number the
   questions and put your recommendation under each.

   **Ask only what the product does** — how the spec is written (ids, folders, the split into
   features, wording) is yours, by the rules below; how it gets built is the architect's.
3. **Push and open a draft PR** — re-read the file against the rules below and raise what you find
   as one last round. When the driver agrees: commit as `spec: …` on
   the session's branch (or `feat/<slug>`), push, `gh pr create --draft`. It stays draft until the
   developer step proves the slice. Give the driver the feature's id to pick into an epic.

## Rules for the spec

**Outcomes, never solutions** — what someone can do and what they get, never how: no screens,
clicks, endpoints, status codes, tables or technologies (*"refused as unauthenticated"*, not
*"returns 401"*). A solution here is a design decided before the architect saw it. Ideas arrive as
solutions — ask what they are for. The exception is a mechanism the driver needs for itself (the
CSV a partner imports).

**[BRIEF](https://cucumber.io/blog/bdd/keep-your-scenarios-brief/) scenarios** — business
language, real data, only the details that matter, one rule each. Five steps or fewer, one `When`–`Then` pair.

**No value in it, no example in it** — a scenario whose steps name only categories (*"a device in
another organisation"*, *"a subscriber outside"*) is a rule restated, not an example of one. Put
the value the driver gave you in the step: *`"A"`*, *`"B"`*, *`3`*, a number they actually use.
Keep values short enough to read; where the real one is long, name the thing and let the
`Background` carry the value.

**A `Then` is what someone can see** — name what the sender, the device or the operator observes,
not a verdict the system reached internally. *"the message is refused"* says nothing about whether
the sender was told or the message vanished, and those are different products; *"the sender is
told they may not send there, and nothing reaches the device"* says which one was built.

**The role is someone outside** — the person a scenario serves is whoever gains from it: a
customer, a subscriber, an operator on call. Never the system, never the team, never a component.
*"As the operator of the SMSC I want an SRI4SM"* is a design wish wearing a role's clothes.

**One scenario per outcome** — two ways to reach the same outcome are one scenario; a scenario that
follows necessarily from another is ceremony; something a user will notice with no scenario is a
missing requirement.

**[`Rule:`](https://cucumber.io/blog/bdd/gherkin-rules/) groups what illustrates one business
rule** — add one once two or more scenarios illustrate it, never a rule without scenarios. Many
rules in one feature mean the slice is too big: cut it.

**[`Background:`](https://cucumber.io/docs/gherkin/reference/#background) only for what every
scenario shares** — a `Given` repeated in every scenario that the reader needs to know; four lines
at most, never complicated setup.

**`Scenario Outline:` only for the same behaviour with different values** — every cell a value
(`failed`, `"EUR"`, `3`), never a phrase, a condition or a step; few rows, chosen with care. Rows
that do different things are separate scenarios.

**Folders are feature domains** — what the system does, in the driver's language; never an epic,
never a technical layer. Epics are transient and live in the portal.

**Every feature carries an `@id:`** — kebab-case, named for the behaviour, not its domain. The
portal refers to features by id, so **an id never changes once pushed**.

**No plan in the files** — no epic or priority tags, no status tag but `@backlog`, no `epic.md`. Tags follow
[`.gherkin-lintrc`](https://github.com/novibe-org/novibe/blob/main/.gherkin-lintrc).
Picking up a `@backlog` feature or scenario means removing the tag here.

## Done when

No question is open, and the driver agrees the spec captures the slice.
