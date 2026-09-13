---
name: architect
description: Turn a Gherkin spec into a C4 architecture model for one slice — high-level design and flows. Terse ADR only for a crucial cross-cutting decision.
---

# Architect

**In:** the Gherkin spec at `features/<domain>/<feature>.feature`.
**Out:** a **C4 model** at `docs/architecture/` (LikeC4) — plus, only when a crucial
cross-cutting decision was actually made, one terse ADR in `docs/adrs/`. Model and ADR together
are what the developer step is handed.

Design it right — turn the spec into a clear design. The **model is the crucial artifact**: the
source of truth that carries the architecture into implementation and into the agent's context.
**Diagrams are secondary** — generated *from* the model, for the humans who later read it. That's
why we use **LikeC4**: it separates model and view, and emits Mermaid that renders in Markdown/GitHub.

**Never output code** — model/design level only; implementation is the developer's job.
**No internal planning docs** — the design lives in the C4 model, a sharable, living artifact.

1. **Locate the model** — `docs/architecture/`, wherever it already lives. If none exists yet,
   this slice starts it — model just enough to place the slice, not the whole system. Pick the
   shape by what you're modeling, not by default:
   - **One project** for a single cohesive system: `likec4.config.mjs` + a flat `model.c4` +
     `views.c4` at the project root (see **Layout** below for when to grow past flat).
   - **One project per flow** when the system decomposes into genuinely independent, separately
     browsable concerns — each should stand alone as its own page. Give each its own config +
     `model.c4`/`views.c4`. Fold cross-project shared elements (external systems, common element
     kinds) into a plain `_shared/` folder and `include: { paths: ["../_shared"] }` from every
     project's config, rather than a shared *project* or per-project `import`. `include`d
     elements are referenced directly, no namespace prefix — `import` is for a genuine one-off
     reference between otherwise-independent projects, not a common base every project needs.
   - Want to sketch where the architecture is headed, not just what is built? That is a **view**
     on the same model (e.g. a target-state Context view, tagged or noted as such), not a
     separate `vision/` tree or project — one model, multiple lenses.
2. **Design to the spec** — extend the model for the slice: add only the elements and relations it
   introduces.
3. **Agree, regenerate, commit** — iterate on the `.c4` with the driver; when you both agree it's
   settled, regenerate diagrams (`likec4 export markdown` for a browsable per-project README if
   your `likec4` has it — check `likec4 export --help`, it may still be pending release — else
   `pnpm gen:diagrams`), commit the model to the slice's branch **and push** — the branch
   carries the slice's draft PR, and the step isn't closed until it's on the remote. Never
   hand-edit a generated file.
4. **ADR only if warranted** — a crucial cross-cutting decision (integration pattern,
   security/boundary invariant, build-vs-reuse, repo structure): terse MADR-lite (~30–40 lines),
   next number in `docs/adrs/`. Default to none; never package a feature as an ADR. Same rule
   the other way: if a project's description needs more than a plain sentence to justify a
   decision — trade-offs, alternatives, why it applies beyond this one project — that decision
   has outgrown the description and belongs in an ADR instead, not more prose.

   **Never the same decision in both places.** If a fact is fully captured as an observable
   scenario in the `.feature` — what happens — it does not also need restating as an ADR
   decision; that's spec content wearing an ADR costume. Only the *why beyond this one
   feature* — trade-offs, alternatives considered, why it constrains other future work — earns
   the ADR. Find the same thing in both? Cut the spec-shaped half from the ADR and have the ADR
   reference the feature file by name instead of repeating it.

**Layout grows with the model, not ahead of it** — a flat `model.c4` + `views.c4` is the right
size for most slices. Once that stops being true, split **model and views into `models/` and
`views/` folders**, and split the model **by concern**: a shared `base-model.c4` (the shell) plus
one `*-model.c4` per concern that **`extend`s** the base (LikeC4 files merge in one project;
reference nested elements by full path). Views: a **Context** and a **Components** view, plus a
**flow** per concern (`*-flow` dynamic view). **Model your own components, not a library's** —
fold framework internals into the element's frame/technology (e.g. an SDK's OAuth server is the
worker's frame, not your component).

**Always `likec4.config.mjs` (`defineConfig`), never `.json`.** A JSON string cannot hold a
literal newline, and a project's config is where its descriptive summary lives — use `.mjs`
from the start so that never becomes a reason to migrate later.

**Project overview, not a comment.** A project's descriptive summary belongs in its config's
`metadata.description` — an exporter renders it as prose in the generated page — not a `//`
comment block at the top of the model, which is invisible to anyone reading the generated docs.

## Done when

You and the driver agree the model meets the spec, the views are regenerated, and an ADR exists
only if a crucial decision was actually made — often none.
