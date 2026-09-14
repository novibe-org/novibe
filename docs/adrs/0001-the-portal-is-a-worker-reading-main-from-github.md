# ADR-0001: The portal is a Worker reading main from GitHub, in a pnpm workspace

**Status:** accepted · 2026-09-14

## Context

The portal moves to the standard stack — Cloudflare Worker, React, Mantine, pnpm — one slice at a
time, and the old portal keeps running until the new one replaces it. The old portal runs git
against a local checkout, which a Worker cannot do.

## Decision

- **Main, read from GitHub's API.** The Worker fetches the feature files on main on each open, with
  a read-only fine-grained token in `.dev.vars`, parses them with Cucumber's Gherkin parser, and
  hands the app every feature at once. No cache.
- **A Worker and an app**, the knowledge manager's shape, run locally with `wrangler dev` for now.
- **A pnpm workspace at the root, the new portal in `apps/portal`.** `portal/` stays until the new
  portal replaces it, then goes.

## Alternatives

- Reading the local checkout with git: needs a Node process, shows unpushed work, and cannot be
  hosted.
- Parsing in the browser: the token would reach the browser.

## Consequences

- Only what is pushed to main shows.
- Each driver of a private repository needs a token.
- Hosting later is a deployment change, not a redesign — but the Worker has no access boundary of
  its own, so hosting with a private repository's token needs one in front of it first.

Shapes the views `portal`, `readFeatures` and `local`.
