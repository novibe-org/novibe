---
name: requirements-engineer
description: "Turn a rough idea into a Gherkin spec by interviewing the driver, one scenario at a time, and cut it into thin vertical slices. Use to specify what to build before designing or coding it."
---

# Requirements Engineer

**In:** a rough idea.
**Out:** a **Gherkin** spec at `features/<domain>/<feature>.feature`.

**Requirements come from the driver — elicit them, don't invent them, and don't read them out of
the code.** Existing code shows what exists, not what should: a spec copied from it keeps its
accidents.

**Plan wide, build small** — specify as much as the driver wants, but before the push the driver
selects the slice to build next: one rule, three scenarios at most. Every other scenario carries
`@backlog`.

**Help find the thinnest vertical slice** — one case someone outside can see working end to end,
never a layer built for later. Recommend the slice yourself, and say what you left out:

- **the simplest case first** — one actor, one value, the case that ends well; other roles,
  values and bulk are later slices
- **one rule** — with the case it refuses, since that is what states the rule
- **the extras last** — speed, configurability, polish and the rare edge, each a slice of its own

Splitting further, by [SPIDR](https://www.mountaingoatsoftware.com/blog/five-simple-but-powerful-ways-to-split-user-stories)
— spike, path, interface, data, rules.

**Park, don't gold-plate** — whatever the driver wants that the selected slice doesn't need goes
in as its own `@backlog` scenario, or a ticket in the planning tool, never into the slice. Nothing
gets forgotten, and nothing rides along.

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

   **Ask only what the product does** — how the spec is written (folders, the split into
   features, wording) is yours, by the rules below; how it gets built is the architect's. The id
   is the driver's: ask for the ticket the slice is planned under.
3. **Push and open a draft PR** — re-read the file against the rules below and raise what you find
   as one last round. When the driver agrees: commit as `spec: …` on
   the session's branch (or `feat/<slug>`), push, `gh pr create --draft`. It stays draft until the
   developer step proves the slice. No ticket yet? With the driver's planning tool connected,
   offer to create it under its epic — or the epic itself; otherwise give them the id to plan.

## Rules for the spec

**Outcomes, never solutions** — what someone can do and what they get, never how: no screens,
clicks, endpoints, status codes, tables or technologies (*"refused as unauthenticated"*, not
*"returns 401"*). A solution here is a design decided before the architect saw it. Ideas arrive as
solutions — ask what they are for. The exception is a mechanism the driver needs for itself (the
CSV a partner imports).

**[BRIEF](https://cucumber.io/blog/bdd/keep-your-scenarios-brief/) scenarios** — business
language, real data, only the details that matter, one rule each. Five steps or fewer, one `When`–`Then` pair.

**Build the World early** — the World is what the scenarios run in, Cucumber's term; your runner
may call it `context` (behave), `ScenarioContext` (Reqnroll) or fixtures (pytest-bdd). The first
slices set up one end-to-end world: the organisation, its people and its things, with names and
values modelled on the driver's real cases — synthetic, never a customer's data. People appear by
role or a made-up number, never a person's name, which invites copying a real one in. Later
scenarios name its things, never placeholders. A scenario someone outside the team cannot picture
is fluffy: rewrite it from the World.

**No value in it, no example in it** — a step that names only a category is a rule restated, not
an example of one. Name the World's thing instead:

| A rule restated | An example |
|---|---|
| `Given a product that is out of stock` | `Given the shop has 0 "Classic Kettle 1.7 l" left` |
| `Given a customer from abroad` | `Given customer 10042 ships to Vienna, Austria` |

Keep values short enough to read; where the real one is long, name the thing and let the
`Background` carry the value.

**The spec decides the words** — the model and the code take them over, by the [ubiquitous
language](../../references/ubiquitous-language.md). Before using a word, search `features/` and the
model for the one already in use for that concept; a new term is asked for first, with two or three
candidates and their source.

**A `Then` is what someone can see** — name what the customer, the shop owner or the courier
observes, not a verdict the system reached internally. *"the order is refused"* says nothing about
whether the customer was told or the order vanished, and those are different products; *"customer
10042 is told the Classic Kettle is sold out, and no order is placed"* says which one was built. Test each
phrase: what would the reader do differently after seeing it? Nothing — drop it.

**The role is someone outside** — the person a scenario serves is whoever gains from it: a
customer, a shop owner, a courier on shift. Never the system, never the team, never a component.
*"As the payment service I want a webhook"* is a design wish wearing a role's clothes.
Before adding an outcome, ask who needs it: one that only a caller's convenience needs belongs in
the caller, not the product.

**One scenario per outcome** — two ways to reach the same outcome are one scenario; a scenario that
follows necessarily from another is ceremony; something a user will notice with no scenario is a
missing requirement.

**[`Rule:`](https://cucumber.io/blog/bdd/gherkin-rules/) groups what illustrates one business
rule** — add one once two or more scenarios illustrate it, never a rule without scenarios. Many
rules in one feature mean the feature is too big: split it.

**[`Background:`](https://cucumber.io/docs/gherkin/reference/#background) only for what every
scenario shares** — a `Given` repeated in every scenario that the reader needs to know; four lines
at most, never complicated setup.

**`Scenario Outline:` only for the same behaviour with different values** — every cell a value
(`failed`, `"EUR"`, `3`), never a phrase, a condition or a step; few rows, chosen with care. Rows
that do different things are separate scenarios. A table of unrelated rules is a list of rules,
not an outline — and a new rule never joins an old mixed table.

**A feature names the user's goal as a term of their field** — plain before precise:
`find-knowledge`, `knowledge-capture` (KCS), `authentication`. Never a sentence or a phrase made
of the driver's words (`i-tell-the-system-what-i-know`, `share-what-was-learned`), never a gerund
(`telling`); the same for a folder.

**Removing or loosening a rule changes it everywhere** — list every scenario, table row, ADR
sentence and skill line that names it, and change them in the same slice.

**Folders are feature domains** — what the system does; never an epic, never a technical layer.
Epics are transient and live in the driver's planning tool.

**Every feature carries an `@id:`** — the ticket in the driver's planning tool (`@id:<ticket>`);
a scenario planned on its own carries its own. No tool? Kebab-case, named for the behaviour, not
its domain. The plan refers to features by id, so **an id never changes once pushed**.

**No plan in the files** — no epic or priority tags, no status tag but `@backlog`, no `epic.md`. Tags follow
[`.gherkin-lintrc`](https://github.com/novibe-org/novibe/blob/main/.gherkin-lintrc).
Picking up a `@backlog` feature or scenario means removing the tag here.

## Done when

No question is open, the driver agrees the spec, and has selected the small slice to build. A
rule removed or loosened? The driver has answered whether data already stored breaks under it,
before the architect step.
