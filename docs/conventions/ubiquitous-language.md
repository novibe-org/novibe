# Ubiquitous language

**One word for each concept, from the spec to the code.** Evans'
[ubiquitous language](https://martinfowler.com/bliki/UbiquitousLanguage.html): the spec decides
the words, and the model and the code take them over. A word that is wrong in the spec becomes an
element, a class, a table and an API, and renaming it later touches every one of them.

## Where a name comes from

| What is named | Its word |
|---|---|
| a feature, a folder of features | the user's goal in their field's standard terms, plain before precise: `find-knowledge`, `knowledge-capture` (KCS), `authentication` — never a sentence (`i-tell-the-system-what-i-know`) or a gerund (`telling`) |
| a concept of the domain | the field's standard term — *a refund*, *a backorder* — never an invented or generic one (*a negative order*, *a pending item*, *an entity*) |
| a thing in the team's world: their tools, products, parts | the team's own word, as their own material writes it: Grafana and Slack, not *dashboards* and *the chat*. A tidier word is one nobody searches for |
| a kind of thing a standard defines | the standard's name, verbatim; where ours differs, the ADR that adopted the standard lists the differences in one table |
| a mechanism | a standard's term (SHACL, OAuth) names the code that implements it, never a feature |
| a model element, a type, a function, a step definition | the spec's word for the concept — `Subscription` where the spec says *subscription*, never `Plan` |

## Rules

- **One word per concept, one concept per word** — across `features/`, the model, the ADRs and
  the code. Before using a word, find the one already in use for that concept: it wins, and a
  second word for the same concept is refused.
- **No word is introduced silently** — a new term is asked for first: two or three candidates
  with their source, and the driver picks. The driver's own word wins where they have one. A
  standard's name is never renamed silently either.
- **No filler in a name** — no *the*, *my*, *stuff*, *info*, *data*, *manager*, *handler*,
  *helper*, *util*, and no gerund standing in for a capability (*asking*, *telling*,
  *exploring*).
- **A rename is a slice of its own** — it changes the term everywhere at once: feature files,
  step definitions, the model, the ADRs and the code.

The `requirements-engineer` decides the words; the `architect` and the `developer` take them over.
