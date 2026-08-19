# 0008. Animation stack split

Status: accepted
Date: 2026-08-19
Phase: 0b

## Context

The brief names four animation technologies and the site uses all four. Without a written boundary, two of them end up doing the same job in different files and the bundle carries both.

## Decision

| Technology | Owns | Boundary |
|---|---|---|
| GSAP 3 with ScrollTrigger | scrubbed scroll, the Thread draw, section entrances, anything tied to scroll progress | nothing that is not scroll driven |
| GSAP SplitText | per character and per line headline splitting | headlines only, never body copy |
| Motion 13 | component state, layout animation on the `/work` filter, `AnimatePresence` page transitions, the magnetic button spring | nothing scroll scrubbed |
| Three.js with R3F and drei | the three WebGL uses in brief 7b and nowhere else | never text, layout, the Thread, or an interactive element |
| 2D canvas, hand written | the Reduced tier particle fallback | never on the Full tier |

Reasoning per boundary:

- **Scroll goes to GSAP.** ScrollTrigger with `scrub` gives frame accurate control of a timeline from scroll position, including drawing an SVG path head along a branching path. Motion's scroll support cannot do that with the same control.
- **Layout goes to Motion.** The `/work` filter must move cards to new positions rather than pop them. Motion does that with a prop. GSAP has no layout primitive, and Flip means hand managing the state.
- **The magnetic button goes to Motion.** It needs a spring settle on pointer leave, and Motion is already in the bundle for page transitions.
- **The fallback tier is hand written canvas, not a library.** Loading a particle library to draw 90 dots is the exact failure the tiering exists to prevent. It is about 60 lines.

Banned outright: any particle library, tsparticles and equivalents included, any carousel library, any UI kit, jQuery, and any fifth animation library. A fifth needs its own ADR.

## Consequences

- Two animation libraries in the Reduced tier bundle, GSAP and Motion. Both are import optimised through `optimizePackageImports`, and only the plugins actually used are imported.
- One clear answer to "which library does this effect" for every row in `docs/motion.md`.
- GSAP plugins including ScrollTrigger and SplitText are free under the standard GSAP licence as of 2025, checked before install. No Club GreenSock membership and no licence file to ship.
- If the Full tier bundle needs cutting, the order is drei imports, then postprocessing, then particle count. Motion and GSAP are load bearing across all tiers and are not the place to cut.
