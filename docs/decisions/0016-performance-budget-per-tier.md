# 0016. Performance budget per tier, and what was traded

Status: accepted
Date: 2026-08-20
Phase: 2b

## Context

Section 11 sets budgets per tier rather than one blended number, because a blended number hides the thing that matters: what an Indian SMB founder on a mid range Android actually downloads. The brief also says, in as many words, not to pretend a WebGL hero and a mobile Performance score of 90 are both achievable, and not to report a Reduced tier measurement as a desktop number.

## Decision

The budget, and how each line is measured rather than asserted.

| Metric | Reduced | Full | Measured by |
|---|---|---|---|
| JS over the wire on `/` | under 250kb | under 500kb | `performance.getEntriesByType('resource')`, `encodedBodySize`, against a production build |
| Three.js bytes | **zero** | as needed | refetching every loaded chunk and grepping the bodies |
| Lighthouse Performance | 90 or above, mobile | 85 or above, desktop | Phase 7, reported per tier, never once |
| LCP | under 2.0s mobile | under 2.5s desktop | field metrics through Speed Insights, lab in Phase 7 |
| CLS | under 0.05 | under 0.05 | the split headline reserves its box before animating |
| INP | under 200ms | under 200ms | no per frame JavaScript on pointer paths |
| Hero frame rate | not applicable | 60fps on a 2021 mid range laptop, never below 30fps | Phase 3 |

**The cut order if the Full tier goes over 500kb**, from the brief and not negotiable: drei imports first, then postprocessing, then particle count. Particle count is the visual, and it is cut last.

**What was actually traded for the visual work.** The Full tier ships roughly 235kb more JavaScript than the Reduced tier. That buys the shader field, the card displacement, and the noise dissolve page transition. It costs desktop Lighthouse Performance, which is why the desktop target is 85 and not 95. Chasing 95 on desktop means deleting the work the site exists to demonstrate.

**What was not traded.** The mobile number. The Reduced tier carries no Three.js, no postprocessing, and one 2D canvas with 40 to 90 particles and no library behind it. That is the tier most visitors get and it is the one that must not slip.

## Standing rules that protect the budget

- Text is the LCP element on every route. If a canvas ever becomes LCP, that is a bug, not a tradeoff.
- Only `transform` and `opacity` are animated in the DOM. The Thread's `stroke-dashoffset` is the single exception, and it is what SVG line drawing is.
- Every RAF loop and every WebGL scene suspends on viewport exit and on `document.hidden`.
- The Satoshi licence forbids subsetting, so 42.6kb unsubset is the font floor. Accepted, in budget, recorded in ADR 0011.
- `optimizePackageImports` covers `gsap`, `motion`, and `lucide-react`. Individual icon imports only, never the barrel.
- Placeholder visuals are server rendered inline SVG, so they cost zero client JavaScript.

## Consequences

- Measured at Phase 2b, against a production build: Reduced 205.4kb, Full 440.4kb over the wire. Both inside budget with the hero shader still to be added.
- Full has 60kb of headroom, which is tight. The hero shader is a few kb of GLSL in a chunk that already exists. Anything that wants drei has to justify itself against that 60kb.
- `npm run verify` does not measure any of this. Byte budgets are measured by `scripts/check-tiers.mjs` against `next start`, because a dev build is 20MB of unminified JavaScript and reporting from it would be meaningless.
