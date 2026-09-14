# ADR-0002: GitHub's answers are parsed with zod, and types come from the schemas

**Status:** accepted · 2026-09-14

## Context

The Worker acts on what GitHub answers, and the app shows what the Worker returns. A malformed
answer passed on unchecked fails somewhere far from GitHub.

## Decision

- **zod schemas are the only definition of the portal's data shapes.** TypeScript types are
  derived from them with `z.infer`.
- **Only input from outside is parsed at runtime:** GitHub's answers, in the Worker. The app uses
  the Worker's answer through the derived types.

## Consequences

- A change to a shape is a change to one schema.
- zod is a dependency of the portal.

Shapes the views `portal` and `readFeatures`.
