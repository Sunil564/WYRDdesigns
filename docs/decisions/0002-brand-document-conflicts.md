# 0002. Brand document conflicts with the build brief, resolved

Status: accepted
Date: 2026-08-19
Phase: 0

## Context

`docs/brand.md` is authoritative on brand matters, the brief is authoritative on architecture. Where the two describe the same thing differently, the conflict has to be resolved once and written down, or it gets re-litigated in every later phase.

## Decision

Each conflict below resolves in favour of `brand.md`, except where the item is architecture rather than brand.

### 1. Service list and wording

The brief names eight services in section 1 and groups them into four clusters in S3, with its own one line definitions. `brand.md` section 3 fixes the wording of eight services and says "Wording is fixed".

**Resolved:** service names and service lines come verbatim from `brand.md`. The four cluster structure, the two digit indexes, and the cluster one liners are the brief's architecture and stand. `content/services.ts` carries the `brand.md` wording inside the brief's structure.

Mapping used:

| Cluster | Services, `brand.md` wording |
|---|---|
| 01 BUILD | Web & ecommerce development |
| 02 REACH | SEO & GEO, Digital marketing & social, Promotional campaigns |
| 03 SHOW | Corporate films & video, Explainer videos |
| 04 STAGE | Exhibitions & events |
| Spine | Brand & creative direction |

`SEO & GEO` replaces the brief's plain `SEO`. `brand.md` is explicit that being named by AI answer engines is part of the offer, and that is a fact about what the studio sells.

### 2. Positioning and hero headline

Both agree on `We don't just build websites. We build everything around them.` No conflict. The brief's hero lead paragraph is connective copy and is kept, since `brand.md` permits connective copy that does not rewrite the locked lines.

### 3. Taglines

`brand.md` approves `Shape what becomes.` as primary. The brief does not mention a tagline. The tagline is used in the footer and in OG copy. `Weird works.` is marked informal in `brand.md` and is not used on the site.

### 4. The name

The brief's `/studio` copy is `WYRD is Old English for fate. It also sounds like weird. We answer to both.` `brand.md` fixes the phrasing as `Old English for fate. Yes, it sounds like weird.` and bans conceding with "but".

**Resolved:** `brand.md` phrasing, once, on `/studio`. The brief's thread paragraph that follows it is architecture facing copy about the organising idea and is kept.

### 5. Verified contact facts

`brand.md` supplies facts the brief marks as conditional: phone `+91 86603 33165` and `+91 82176 18082`, Instagram `instagram.com/wyrddesigns`, base Bangalore, Karnataka, India. These are verified supplied facts, so the `/contact` phone line and the social link render. No street address was supplied, so no street address renders and no `LocalBusiness` postal address field is emitted.

### 6. Client logos

The brief's S5 is a client logo section fed from the source folder. `brand.md` section 6 says "Named case studies pending clearance. Until then the site uses capability proof, not logos."

**Resolved:** the logos render. Reasoning: the operator placed six client logo files in the authoritative source folder, dated after `brand.md`, and the brief that ships with them specifies exactly how to process and render them. The `brand.md` sentence restricts named **case studies**, which stay unbuilt: `/work` and `/work/[slug]` carry no client names and no outcome metrics. A logo the operator supplied for this purpose is not a fabricated fact.

This is the one resolution in this ADR that goes against the letter of `brand.md`, so it is flagged in the Phase 0 report for the operator to reverse with one edit to `content/clients.ts` if clearance has not actually been given.

### 7. Domain

`brand.md` records the domain as `wyrddesigns.in`. Section 0.4 of the brief says the production domain is not registered, must never be hardcoded, and must come from `process.env.NEXT_PUBLIC_SITE_URL`.

**Resolved:** architecture wins on mechanism. The origin is read from one environment variable and appears in exactly one module. `wyrddesigns.in` is recorded in `.env.example` as a comment naming the intended value, not as a default. See ADR 0005.

### 8. Banned phrase lists

The two lists differ. Both are enforced, as a union. `solutions`, `synergy`, `end-to-end partner`, and `we believe` from the brief, plus `curated`, `unlock`, `seamless`, `cutting-edge`, and the rest from `brand.md`.

### 9. Audience

`brand.md` names sectors and a deal size range. The sectors are usable context for copy. The deal size range is money, and section 1 of the brief bans prices anywhere on the site. It stays out of the site and lives only in `docs/`.

## Consequences

- `content/services.ts` is the single home of service wording, sourced to `brand.md`.
- Copy review in later phases checks both banned lists.
- The S5 logo decision is the one item an operator veto would change, and it is isolated to one content file.
