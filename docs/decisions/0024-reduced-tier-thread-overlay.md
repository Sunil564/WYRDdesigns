# 0024. The Reduced tier draws the Thread on a 2D canvas

Status: accepted
Date: 2026-08-21
Phase: 6

Reverses section 16 of ADR 0020, which scoped this overlay and rejected it as disproportionate.

## Context

The Thread is the site's one continuous idea: a line that runs the length of the homepage,
reveals as you scroll, blooms through the client logos and gathers into a head. On the Full
tier it is 5,728 GLSL points. On the Reduced tier it was, until now, the SVG stroke: the same
route, drawn as a line, complete and still.

That was a defensible answer to "mobile has no thread" and a poor answer to "mobile has no
motion". Every coarse pointer resolves to Reduced, so the stroke is what a phone gets, and a
phone is the majority case for this audience. The stroke shows the shape of the idea without
performing it.

The rejection in 0020 §16 was made on an estimate. It has now been measured, and the estimate
was pessimistic.

## What was measured before building

Canvas 2D drawing cost, under CPU throttling, three strategies at equal particle counts:

| Strategy | Relative cost |
|---|---|
| `arc()` per particle | 1.0 |
| One path per alpha bucket | about 1.5 |
| Pre-rendered sprite via `drawImage` | about 8 |

Both predictions going in were wrong. Batching was expected to win and lost, because building
the buckets each frame costs more than the fills it saves. Sprite blitting was expected to be
much faster and is the slowest by a wide margin. Chromium's small-circle fill is very well
optimised and the naive loop wins.

**Viewport culling is the decisive optimisation, not the draw strategy.** A GPU discards
offscreen points for free; Canvas 2D does not, so every offscreen particle is paid for in
full. Culling to the viewport plus a 160px margin is what makes the count affordable.

## Decision

1,154 points sampled along the route at 0.2 of the Full tier's density, of which **107 are
drawn in any given frame** after the reveal line and the cull. The full feature set is kept:
the document-Y reveal, the head cluster, the spiral trail, the clients dispersion, the inverse
band colour switch, and the text dimming. Nothing was cut.

Measured on the built site at 412 by 823:

| CPU throttle | Median frame | p95 |
|---|---|---|
| 1x | 16.6ms (60fps) | 18.1ms |
| **4x, the Lighthouse mobile profile** | **16.6ms (60fps)** | 19.8ms |
| 6x, pessimistic | 19.8 to 21.1ms (47 to 51fps) | 28.5 to 32.5ms |

At 6x the same scroll sweep on the static tier, which draws no canvas at all, is 17.4ms. So
both canvases together cost about 3.7ms of a 21ms frame there. The 6x shortfall is mostly the
rest of the page, not the overlay.

Lighthouse mobile, local, against a same-build control that mounts no canvas: **TBT 113 to
126ms with the overlay, 94ms without**, run to run spread about 13ms. CLS unchanged at 0.008.
The overlay costs roughly 25ms of blocking time.

## The mobile dispersion is a symmetric bloom, not a scaled-down version of the desktop one

Below 1024px the Thread route is a single straight line, so the two-column dispersion has no
strands to lean between and nothing to bias inward toward. The single line blooms
symmetrically instead: outward on both sides through the logo band, gathered again below it.
Same Y-ramp mechanism, one line, no inward bias.

Rendered and looked at, `build-logs/screens/mobile-bloom-{above,at,below}.png`. Above the band
the column is about 20 CSS px wide, which is the spiral radius. Through the band it opens to
about 107px either side of centre, and the extents are even: 232px left, 213px right, in
device pixels. Below it closes back to a column and runs into the head.

## There is no reduced motion branch

`useRenderTier` tests `prefers-reduced-motion` first and returns `static` before it reaches
the coarse pointer test. A visitor with reduced motion on never mounts this component; they
get the SVG stroke, complete and still. A branch was written for that case and removed once
its unreachability was confirmed, rather than left in as a guarantee that never runs.

## Constants live in one file now

`components/motion/threadConstants.ts` holds every number the two renderers share. They cannot
share code, one being a shader and one a loop, but there is no reason for them to disagree
about a wavelength. The alternative was retyping twenty constants into the overlay, which is
the exact fault this build has already paid for more than once: a second copy of a number that
goes stale silently and is never compared against the first.

## Consequences

- The zero-Three.js rule is intact. Reduced measures 232.7kb over the wire, well under the
  250kb budget, with no Three.js chunk and no Three.js identifier in any body.
- `docs/BLOCKERS.md` item 10's original scope is now met rather than closed by decision.
- The 6x throttle case is honest and unresolved: a genuinely slow phone sees about 50fps
  through this section rather than 60. That is a real cost, taken knowingly, against a page
  that would otherwise be still.
- `useRenderTier` still sends every coarse pointer to Reduced before any capability test, so a
  flagship phone runs 107 particles when it could run thousands. Recorded as BLOCKERS 17.
