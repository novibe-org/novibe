# portal

One place to read a project's specification and what the last test run proved, and to decide
what gets built next — without checking the repository out.

Three sources, kept apart on purpose:

| | | |
|---|---|---|
| **a ref** | what the specification is | `features/**/*.feature`, read out of a branch |
| **a run** | what it proved | Cucumber Messages, the protocol every Gherkin runner emits |
| **the store** | what anyone decided to do about it | SQLite at `data/portal.db` — the only writable one |

A feature is a file: Gherkin allows one `Feature:` per file, so the file is the feature and needs
no tag to say so. An **epic** picks features. It is a prioritisation decision, so it lives here
rather than as a tag in a repository that should not move when somebody changes their mind.

Order is array position in both directions — which epic comes first, and what comes first inside
one. A feature no epic lists shows as **not in any epic**, which is worth seeing rather than
inferring.

## Running it

```sh
nvm use                                            # Node 22
npm install
cp portal.config.example.json portal.config.json   # then point it at your checkouts
npm start                                          # http://localhost:4173
```

`portal.config.json` names the projects, and is ignored by git so an update never
conflicts with your setup. `runs` are Cucumber Messages files relative to
`root`; list several — a filtered inner loop and a full run — and the newest run that exercised a
scenario is the one that reports it.

## What a status means

| | |
|---|---|
| `PASSED` … `FAILED` | the runner said so |
| `future` | tagged `@backlog` — future by declaration, not by absence |
| `not-run` | built, but left out of every run on file — a tag filter, not a gap |

A `Scenario Outline` counts once; its `Examples` rows are what pass or fail.

## Identity

A feature declares an id of its own:

```gherkin
@id:checkout-with-a-saved-card @source:payments-api
Feature: Paying with a card the customer saved earlier
```

The plan refers to features by that id, never by path, so a file can be renamed or its scenarios
restructured into a different one without silently breaking every reference to it. A feature with
no `@id:` is marked in the list and falls back to its path.

Two features answering to one id is reported rather than resolved — a plan cannot be ambiguous
about what it picked.

## Which branch

The specification is read out of a git ref, not the working tree, so the backlog does not change
shape while somebody is prioritising it. The picker in the header switches branches; the default
is whatever is checked out.

The **status** cannot come from a ref — `target/cucumber.ndjson` is a build artefact of whatever
tree was last run. So the portal locates the run's scenarios in the ref it is showing, and says
so when it cannot: *"run 17:36 does not match this branch"*. It also reports the run's own
outcome, because a red run and a red backlog otherwise look identical.

## Storage

SQLite, through node's built-in `node:sqlite` — no dependency, no build step. Every statement
lives in `src/store.mjs` and every export is async even though the driver is not: Cloudflare D1
is async and Workers cannot load `node:sqlite`, so a move there is a driver swap in one file
rather than a change at every call site. Drizzle is a reasonable choice at that point; it has no
`node:sqlite` driver today, so adopting it now would mean taking on a native dependency to
prepare for a platform we are not yet on.
