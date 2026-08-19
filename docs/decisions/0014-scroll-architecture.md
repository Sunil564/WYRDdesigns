# 0014. Scroll architecture, and the one place focus is trapped

Status: accepted
Date: 2026-08-20
Phase: 2

## Context

The brief specifies Lenis for smooth scroll and GSAP ScrollTrigger for scrubbed scroll animation, and requires that Lenis does not break anchor links or in page hash scrolling. It also requires a mobile menu that traps focus and closes on Escape and on route change.

Smooth scroll libraries fail in two predictable ways. Either they run their own RAF loop alongthe animation library's, so two loops fight over the same frame, or they take over the scroll container and every scroll driven animation measures the wrong position.

## Decision

**One RAF loop.** `components/motion/useLenis.ts` constructs Lenis with `autoRaf: false`, adds `lenis.raf` to the GSAP ticker, and calls `ScrollTrigger.update` from Lenis's own `scroll` event. GSAP's ticker is the only RAF driving scroll on the page. `gsap.ticker.lagSmoothing(0)` is set, because lag smoothing skips frames and a scrubbed animation reads as a stutter when it does.

**Native scroll, not a transformed wrapper.** Lenis is used in its default mode where the document itself scrolls. That means ScrollTrigger needs no `scrollerProxy`, the scrollbar is real, `position: fixed` behaves, and anchor links land where they should.

**Touch stays native.** `syncTouch: false`. Smoothing a finger drag always feels like input lag on a phone.

**One instance, published on `window.__lenis`.** Typed in `types/global.d.ts`. Anything that needs to scroll to a target reaches it through `scrollToTarget`, which falls back to `scrollIntoView` when Lenis is not running. The alternative, a React context, would put a client boundary around the whole tree for a single object.

**Not constructed at all under reduced motion**, along with GSAP and ScrollTrigger, which are dynamically imported inside the same effect. That keeps roughly 50kb out of the Static tier and out of the first paint path on every tier, and it satisfies ADR 0012.

**`html.lenis { scroll-behavior: auto }`** while Lenis is mounted. Native smooth scroll plus Lenis produces a visible double ease on every anchor jump.

**Focus trap.** The mobile menu is the only trap on the site, which is what criterion 12 permits. It captures Tab and Shift Tab at the document level, cycles within the panel, closes on Escape, on a link click, and on a `usePathname` change, and returns focus to the button that opened it. Scroll is locked with both `lenis.stop()` and `overflow: hidden`, since Lenis does not exist under reduced motion and the lock still has to work.

## Consequences

- One frame loop, so a scrubbed Thread draw and the scroll itself cannot desynchronise.
- Anchor links, hash navigation, and programmatic scrolling all work with Lenis mounted. Verified in the browser by `scripts/check-shell.mjs`, which asserts a jump of 9298px lands within 200px of its target rather than assuming it does.
- Reduced motion visitors get plain native scroll and download none of the three libraries.
- The menu's focus behaviour is verified by tabbing 12 times and asserting focus never escapes, rather than by reading the code.
- `window.__lenis` is global state. It is one object, typed, created and destroyed in one effect, and it is the pragmatic call over wrapping the tree in a provider.
