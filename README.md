# Greenly Wrapped

Spotify-Wrapped-style yearly recap per Greenly client: a shareable public
landing page + a per-client video, generated from one structured dataset
the climate-expert / delivery team produces.

> ⚠️ Temporarily under `emmanuellandau`. To be transferred into the Greenly
> org (`Offspend`) once an org owner can accept the transfer.

## Architecture & data spec

Full design lives in Notion — architecture, the `wrapped.v1` data contract,
the three-layer import pipeline, the scene/eligibility model, two-tier output
(account + individual), the video pipeline, and Vercel deployment:

**→ Greenly Wrapped — Architecture & Data Spec** (Notion, private draft)

## Core ideas

1. **One versioned data contract** (`wrapped.v1`) is the spine. Source data
   (a Google Sheet, one row per client) is mapped into it; both the web page
   and the video render from it.
2. **No single template** — a Wrapped is a *deck of scenes assembled per
   client* from the scenes they actually have data for.

## Planned layout (Turborepo + pnpm)

```
packages/
  schema/   Zod schema = single source of truth (TS types + JSON Schema)
  ui/       scenes/slides as React components + brand tokens (shared web + video)
apps/
  web/      Next.js on Vercel. Route: /wrapped/[year]/[slug]
  video/    Remotion / Hyperframe. Renders from same data + same ui/
```

## Status

Scaffolding not yet committed — this repo is the landing spot. Next:
`wrapped.v1` schema + sheet columns + scene manifest, pressure-tested against
one real (anonymized) client.
