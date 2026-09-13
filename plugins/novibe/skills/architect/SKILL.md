---
name: architect
description: Turn a Gherkin spec into a C4 architecture model for one slice — high-level design and flows. Terse ADR only for a crucial cross-cutting decision.
---

# Architect

**In:** the Gherkin spec at `features/<domain>/<feature>.feature`.
**Out:** the slice placed in the **LikeC4 model** at `docs/architecture/` — plus one terse ADR in
`docs/adrs/`, only when a crucial cross-cutting decision was made.

**Write only the model** — no code, no diagram files.

1. **Read the model** — none yet? This slice starts it, in the layout below, with just enough to
   place the slice.
2. **Grill the design into the model** — in arc42's order, each box before its parts, a runtime
   view for each flow in the spec. Ask in rounds: every question the model lets you ask yet, numbered, each with your
   recommendation; write each answer into the model before the next round.

   ```
   ❓ **Q1** - **<title>**: <the question, with its options>

   ➡️ <your recommendation>

   ---

   ❓ **Q2** - …
   ```

   **Facts are yours, decisions are the driver's** — look up what the code and the model can tell
   you; ask everything someone could have decided differently. A question about behaviour is the
   spec's: hand it back to the requirements step, never settle it in the model.
3. **ADR only if warranted** — an integration pattern, a security boundary, build versus reuse,
   repo structure: plain [MADR](https://adr.github.io/madr/), kept short, next number in
   `docs/adrs/`. Default to none. What a scenario already says is not an ADR decision; an ADR
   carries only the why beyond one feature.
4. **Push** — once no question is open and the driver agrees: commit as `arch: …` to the slice's
   branch and push.

## Rules for the model

- Views follow [arc42](https://arc42.org/overview/); its goals and quality live in `features/`,
  its decisions in `docs/adrs/`.
- A box with parts of its own gets a view at the next level.
- A building-block view holds its subject's children and their direct neighbours. No element
  appears at two levels in one view.
- A runtime view holds only the elements that take a step.
- **Say a fact once.** A description says what an element is, in one sentence. What it does to
  another element is a relation. How a story runs is a runtime view. Why is an ADR.
- An ADR names the views it shaped, by view id; the model never names an ADR.
- Applications share no storage; one reaches another only through its API.
- Model your own parts. A library you use is a technology line; a package you write is a
  `library`.
- Where the system is headed is a view on this model, never a second model.

## Layout

- `likec4.config.mjs` (`defineConfig`, never JSON): the project, its summary in
  `metadata.description`.
- `models/base-model.c4`: element kinds, people, externals, the system and its applications.
- `models/<part>.c4`: one per container or package, each `extend`ing its parent.
- `models/deployment.c4`: where each part runs.
- `views/views.c4`: every view.

## Done when

No question is open, the driver agrees the model places the slice, and an ADR exists only if a
crucial decision was made — often none.
