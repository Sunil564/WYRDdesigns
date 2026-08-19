# 0005. Site origin from a single environment variable

Status: accepted
Date: 2026-08-19
Phase: 0

## Context

Section 0.4 of the brief: the production domain is not registered. Nothing may hardcode one. `metadataBase`, the sitemap, `robots.txt`, canonical tags, and OG image URLs all derive from one variable, and there must be exactly one place in the codebase where the origin is defined. `docs/brand.md` records `wyrddesigns.in` as the intended domain, which is intent, not a live fact.

## Decision

`lib/site-url.ts` exports `SITE_URL` and nothing else does origin resolution:

- reads `process.env.NEXT_PUBLIC_SITE_URL`
- falls back to `https://$VERCEL_PROJECT_PRODUCTION_URL` when that is set, so preview and production deploys resolve before the domain exists
- falls back to `http://localhost:3000` otherwise
- strips a trailing slash so callers can concatenate paths safely

`.env.example` documents the variable and records `https://wyrddesigns.in` in a comment as the intended value, not as a default.

Every absolute URL in the app imports from that module. A grep for `wyrddesigns` in `app/`, `components/`, `content/`, and `lib/` returns nothing but that comment reference in `.env.example` and prose in `docs/`.

## Consequences

- Registering the domain is one environment variable change.
- Preview deploys have correct absolute URLs with no configuration.
- The grep in `run-phases.sh` that warns on a hardcoded `wyrd` URL in `app/` or `src/` stays quiet.
- Recorded as an open item in `docs/BLOCKERS.md` per section 0.4, which is informational and does not block any phase.
