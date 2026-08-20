# 0018. The Thread: technical approach and the mobile fallback

Status: accepted
Date: 2026-08-20
Phase: 4

## Context

Brief sections 2.2 and 5.3. In the old sense wyrd was a thread: spun, measured, cut. The brief makes it the structural spine of the design and motion system rather than decoration, which is what gives every other motion decision on the site a reason to exist.

The requirements: a fixed SVG overlay spanning the homepage, above the grain and below content, non interactive. The path drawn with `stroke-dasharray` and `stroke-dashoffset`, driven by scroll progress with ScrollTrigger and `scrub: 1`. `--color-border` at rest with a 240px travelling segment of `--color-accent` following the draw head. Four strands at the capabilities section, one per cluster. Reconvergence into one line terminating at the contact button. A single straight vertical line below 1024px. Reduced motion renders it complete, at rest colour, undrawn.

## Decision

### Geometry is measured, not authored

Hardcoded coordinates would break on the first copy edit. Sections mark their own anchors and `Thread` reads their positions from the DOM:

| Attribute | Where | Role |
|---|---|---|
| `data-thread-origin` | hero, bottom centre | where the line starts |
| `data-thread-node` | S2, S4, S5, S6, S7 | a point the spine passes through |
| `data-thread-branch-point` | S3 spine block | where one line becomes four |
| `data-thread-branch-target` | the four cluster blocks | where each strand lands |
| `data-thread-converge` | the contact button | where four become one, and where it ends |

Nine paths on desktop: one spine from the hero to the branch point, four branches from the branch point to the four cluster blocks, four strands from the cluster blocks down the page to the button. The strands pass behind S4 to S7, which is what makes the page read as one continuous thing rather than eight stacked sections.

Geometry is recomputed on resize, on a `ResizeObserver` over the page, and after `document.fonts.ready`, because a reflowing headline moves every anchor below it.

### An absolutely positioned overlay, not a fixed one

The brief says fixed. A fixed overlay has to be redrawn or transformed on every scroll frame to stay registered with content that scrolls. An overlay absolutely positioned inside `main`, spanning the full document height, is registered with the content by construction: the geometry is in page coordinates, and scroll moves overlay and content together with no per frame work. The visual result is identical and there is no scroll handler.

Stacking: grain is fixed at `z-1`, the Thread sits at `z-2`, every `Section` is `z-10`. So the Thread is above the grain and behind content, exactly as specified, and it is `pointer-events: none` and `aria-hidden` throughout.

### `pathLength="1"` for the body, real length for the head

Each body path carries `pathLength="1"`, `stroke-dasharray="1"`, `stroke-dashoffset="1"`. That hides it with static attributes, before any JavaScript runs, so there is never a frame where a fully drawn thread flashes and then disappears. Progress then sets `strokeDashoffset` to `1 - progress` in normalised space, with no length measurement needed.

The signal head does need the real length, because its window is 240 real pixels: `stroke-dasharray: 240 (total + 240)` with the offset set to `240 - drawn`, which places the visible 240px segment at `[drawn - 240, drawn]`. That is how the live tip glows while the drawn body sits back at `--color-border`. It is a second path over the first rather than a gradient, because a gradient cannot follow a path head.

### One ScrollTrigger per path group

Each group has its own `start` and `end` anchors, so the spine draws between the hero and the capabilities section, the branches draw across S3, and the strands draw from S4 down to the button. All scrubbed at `scrub: 1`, which gives the head a beat of lag and is what makes the line feel drawn rather than clipped.

### Below 1024px: one straight vertical line

Not a scaled down version of the desktop geometry. One path, hero bottom to the contact button, straight down the centre, still drawn on scroll. Branch geometry depends on a two column grid that does not exist on mobile, and the brief is explicit that the complexity is not worth the layout cost. Verified: at 375, 768, and 1023 there is exactly one path and its `d` is two points sharing an x coordinate.

### Reduced motion

`stroke-dashoffset="0"` on every body path, no head paths rendered at all, no GSAP loaded, no ScrollTrigger created. The finished line, at rest colour, on first paint.

## Consequences

- The Thread survives copy edits, breakpoint changes, and section reordering, because it reads the DOM rather than a coordinate table.
- Nine paths and nine ScrollTriggers on desktop. All of them animate one property, `stroke-dashoffset`, which is the single documented exception to the transform and opacity rule in `docs/motion.md`. Every current browser composites it.
- The strands are the one thing in this ADR that goes slightly beyond the letter of the brief. The brief says the split happens at capabilities and the reconvergence happens at contact, without saying what the strands do in between. They run down the page, spaced on the cluster column positions. The alternative reading, that the thread disappears between the two sections, would have left the middle of the page without its spine.
- Verified in a real browser by `scripts/check-home.mjs`: nine paths above 1024 with all nine drawn past halfway after a full scroll, one straight path below, and offsets of exactly 0 under reduced motion.
- The geometry recompute is a layout read on resize. It is throttled to a frame and gated on a real size change, so scrolling on iOS, which fires resize, does not trigger it.
