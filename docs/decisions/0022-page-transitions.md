# 0022. Page transitions, and the WebGL dissolve that is not built

Status: accepted
Date: 2026-08-21
Phase: 6

## Context

Section 7b.2C specifies two page transitions:

- **Full tier:** the outgoing page renders to a render target and dissolves through a noise threshold while the incoming page resolves through the same mask, in the direction of the Thread. Roughly 700ms.
- **Reduced tier:** Motion `AnimatePresence` crossfade with a 24px Y offset.

One is built, differently from the spec. The other is not built at all. Both departures are here.

## What is built

`app/template.tsx`, an opacity transition on client side navigation, the same on every tier.

`template.tsx` rather than a wrapper in `layout.tsx` because the App Router remounts a template on every navigation and reuses a layout. The remount is the mechanism: the incoming tree is new, so an enter animation runs with no state to reset and no exit to coordinate.

Three decisions inside it needed measuring rather than reasoning.

### Opacity only, no transform

A transform on this wrapper makes it the containing block for every `position: fixed` descendant, and `{children}` contains one that matters: `SiteScene` renders the shared WebGL canvas as `fixed inset-0` from inside `app/page.tsx`. A transform here would re-anchor that canvas to the wrapper for the length of the transition, so the hero field and the Thread would slide by the offset amount on every navigation to the homepage. Opacity below 1 creates a stacking context but not a containing block, so fixed layers stay anchored to the viewport.

**This costs the 24px Y offset** that 7b.2C asks for. The alternative was moving the canvas up into the layout so it sits outside the wrapper, which would mount it on every route and ship Three.js to pages with no scene, undoing the tiering rule that the whole build is arranged around. The offset is the cheaper thing to give up.

Asserted rather than assumed: `scripts/check-transitions.mjs` reads the computed transform during a live navigation to the homepage and checks the canvas is still at the viewport origin.

### The first load does not transition

The first mount of a template is the initial page load. Fading the whole document in there would collide with the `[data-reveal]` entrance system that already stages the first screen, and would put an animation in front of first paint. A module scope flag survives the remount, so the first mount renders at rest and only navigations transition.

### Reduced motion is checked here, synchronously, and both halves took a measurement

`MotionConfig reducedMotion="user"` in `SiteMotion` covers every other Motion animation on the site. It was not enough here, and the comment claiming it was is the kind of assumption written down as a design note that this build keeps finding. Motion disables transform and layout animations under that setting by design and treats an opacity fade as safe. Measured with the preference set, the page still faded to 0.67 mid navigation.

The site's convention is stricter than Motion's default, in `globals.css`, in ADR 0012, and in every harness criterion asserting a route renders composed with nothing moving. So the check is explicit.

The first explicit check was also wrong. `useReducedMotion` starts at `false` and resolves in an effect, which is correct for a component that mounts once and wrong for a template that remounts on every navigation: it read "not reduced" on the first render of each one, started the fade, and corrected a frame later. Measured again, still 0.68. The preference is now read straight from `matchMedia` in the `useState` initialiser, which is safe because the decision is only ever consulted on a navigation, and that is client side by definition.

## What is not built, and why

**The Full tier WebGL dissolve is not built.**

It requires the outgoing page as a texture. Browsers do not expose a way to rasterise a live DOM tree into a WebGL render target. The three ways to approximate it:

- **A DOM to canvas library.** `html2canvas` and its equivalents re-implement layout and paint in JavaScript, get it approximately right, are large, and would be a new runtime dependency of a kind the stack rules in `CLAUDE.md` exist to prevent.
- **SVG `foreignObject`.** Serialises DOM into an image, taints the canvas, and does not load external resources, so the fonts and the client logos would be missing from the very snapshot the effect is made of.
- **The View Transitions API.** Does natively and correctly what 7b.2C describes: the browser captures outgoing and incoming snapshots and hands them over as pseudo elements that CSS can animate, including through a mask. It is the right modern answer to this specification. It is Chromium only for now, and in Next 15 the same document flavour sits behind `experimental.viewTransition`.

None of those is a small decision, and the third is genuinely attractive. Shipping a rough approximation of a marquee effect would be worse than shipping the plain version and saying so, which is what this record does.

**What would make it worth revisiting:** the View Transitions route, taken deliberately, with the noise threshold as a CSS mask on the view transition pseudo elements and the plain crossfade as the fallback everywhere it is unsupported. That is a Phase 7 conversation and it needs the operator, not a quiet substitution here.

## Consequences

- One transition on all three tiers, rather than two different ones.
- The Reduced tier's specified 24px Y offset is not implemented, and cannot be while the WebGL canvas lives inside the routed tree.
- 7b.2C's Full tier dissolve is unimplemented and stays that way until someone decides on View Transitions. It is not a defect and it is not quietly dropped: it is recorded here and in `docs/BLOCKERS.md`.
- `scripts/check-transitions.mjs`, five criteria, covering both what must happen and what must not.
