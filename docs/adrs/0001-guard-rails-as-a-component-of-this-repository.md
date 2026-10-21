---
status: accepted
date: 2026-10-21
decision-makers: Stefan Stührmann
---

# Guard rails as a component of this repository

## Context and Problem Statement

NoVibe publishes parts that people take on their own: the Claude Code plugin, and the guard rails, which repositories install and update by version. A rule of the method is often both a skill in the plugin and a guard that enforces it, and 6 of the 20 commits that changed a guard so far changed the plugin with it. Hook managers, GitHub Actions and update bots expect one component per repository: its hook manifest and package at the root, its versions as the repository's tags. Where do the guard rails live?

## Decision Drivers

* A rule's skill and its guard change in one pull request
* A repository takes up the guard rails without the plugin, and the other way round
* Each part has versions of its own, so an update to one does not move the other
* One person maintains NoVibe, so it adds a repository only when it must

## Considered Options

* A component of this repository, tagged `guard-rails-v<version>`
* A repository of their own, `novibe-org/guard-rails`, tagged `v<version>`
* One version for this whole repository, tagged `v<version>`

## Decision Outcome

Chosen option: "A component of this repository, tagged `guard-rails-v<version>`", because a rule's skill and guard then still change together, while a repository that pins `guard-rails-v1.0.0` never sees a plugin release. The guard rails keep their code in `guard-rails/`; only what the tools read from fixed places sits outside it: `.pre-commit-hooks.yaml` and `package.json` at the root, the reusable workflow in `.github/workflows/`, and the architecture diff in `actions/`. The plugin is released as `plugin-v<version>`, and further components follow the same pattern.

It shaped the views `containers`, `guardRails`, `installGuardRails`, `updateGuardRails` and `deployment`.

### Consequences

* Good, because a change to a rule is one pull request and one review, as it is today
* Good, because prek follows a single component's tags with `update.repos.<url>.include_tags`, and Renovate with `extractVersion`
* Bad, because the original pre-commit's `autoupdate` filters no tags and can move a repository to a plugin tag; it is not supported for updates
* Bad, because the release configuration names the root files that belong to the guard rails, as they sit outside `guard-rails/`
* Bad, because a GitHub Marketplace listing needs an action at a repository's root; none is planned

### Confirmation

The scenarios of `features/guards/installation.feature` install and update the guard rails from this repository by their `guard-rails-v<version>` tags.

## Pros and Cons of the Options

### A repository of their own, `novibe-org/guard-rails`, tagged `v<version>`

* Good, because every tool finds what it expects, with plain version tags
* Bad, because a rule's skill and its guard become two pull requests, released in order
* Bad, because it is another repository to maintain

### One version for this whole repository, tagged `v<version>`

* Good, because every tool, the original pre-commit's `autoupdate` too, takes plain version tags
* Bad, because every plugin release is a guard rails release, and repositories get updates that change nothing for them
