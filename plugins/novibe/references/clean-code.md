# Clean Code

Robert C. Martin, *Clean Code* (2008), chapter 17, *Smells and Heuristics*, by ID and in our own
words. The `developer` step refactors by every heuristic here; `clean-code-review` reviews by
them. A finding names its ID; what has no ID here is taste, and taste is not a finding.

## Names

- **N1** · a name says what the thing is or does; no filler (`Manager`, `Helper`, `Handler`,
  `Util`, `Data`, `Info`)
- **N2** · a name says what, at the level of abstraction of its caller, not how it is built
- **N3** · standard nomenclature: the spec's and the model's word first, by the
  [ubiquitous language](ubiquitous-language.md), then the field's or the
  pattern's term
- **N4** · one meaning only; two readings are two names
- **N5** · the longer the scope, the longer the name
- **N6** · no encodings: no type, scope or member prefixes
- **N7** · a name says its side effects: `createOrFind`, not `find`

## Functions

- **F1** · few arguments; three or more need a reason
- **F2** · no output arguments: change the receiver or return the value
- **F3** · no flag arguments: a boolean that selects behaviour is two functions
- **F4** · no dead function

## General

- **G2** · the obvious behaviour is there: what a reader expects from the name works
- **G3** · the boundaries are handled: empty, one, the last, the limit
- **G4** · no overridden safety: no disabled check, silenced warning or skipped test
- **G5** · no duplication: the same idea in one place, reusing what exists
- **G6** · each detail at its level: no low-level detail in a high-level module, or the reverse
- **G8** · expose little: a narrow interface, little public state
- **G9** · no dead code: unused variables, imports, branches
- **G11** · the same thing done the same way throughout
- **G12** · no clutter: empty constructors, unused defaults, noise
- **G13** · no artificial coupling: nothing placed where it is only convenient
- **G14** · no feature envy: a function using another object's data belongs to that object
- **G16** · no obscured intent: no dense expression a name could explain
- **G17** · each responsibility where a reader would look for it
- **G19** · an explanatory variable for a step of a computation
- **G20** · a function's name says what it does
- **G23** · polymorphism over the same switch or if-chain on a type in several places
- **G24** · the project's own conventions
- **G25** · a named constant, not a magic number or string
- **G26** · precise: no float for money, no ignored null, no ignored concurrency
- **G28** · a conditional's intent in a function: `if (isEligible(order))`
- **G29** · no negative conditional where a positive one reads
- **G30** · a function does one thing
- **G31** · no hidden temporal coupling: an order of calls the signatures make visible
- **G33** · a boundary condition in one place, not `+ 1` scattered
- **G34** · a function descends one level of abstraction
- **G35** · configuration at the top, passed down, not read deep inside
- **G36** · no transitive navigation: `a.b().c().d()` (the Law of Demeter)

## Comments

- **C1–C5** · no comment that only narrates, repeats, is obsolete or misleading, and no
  commented-out code; a comment states a constraint the code cannot express

## Errors

- **Ch7** · an error is never swallowed: no empty `catch`, no ignored failure, no `null` for an
  error the caller must handle (chapter 7)

## Not here

- **No length limits and no formatting** — the formatter's and the linter's.
- **T1–T9** — the scenarios are the tests; the `developer` step says how they run.
- **E1–E2, J1–J3** — the build, and Java only.
- **Step definitions** are dumb and scenario-specific on purpose: duplication between them is no
  finding.
