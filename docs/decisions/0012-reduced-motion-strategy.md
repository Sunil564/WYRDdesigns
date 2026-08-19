# 0012. Reduced motion strategy

Status: accepted
Date: 2026-08-20
Phase: 1

## Context

The brief requires that `prefers-reduced-motion: reduce` renders the entire site in final state, with no motion, no canvas of any kind mounted, and that it still looks composed. It also requires the handling to land in the same commit as each effect rather than as a later pass.

On a site where motion is the product, that is not a small branch. It is a second, still version of every section.

## Options considered

1. **CSS only.** One media query zeroing every animation and transition. Covers anything declarative including third party CSS, and does nothing about a mounted WebGL canvas or a running RAF loop. A frozen transition on a live canvas is still a live canvas burning battery.
2. **JavaScript only.** A hook returning the preference, branched on everywhere. Complete control, and it misses any transition declared in CSS, which is most of them, and it does nothing before hydration.
3. **Both, with a division of labour.** Chosen.

## Decision

Two mechanisms, each with a defined job.

**CSS, in `app/globals.css`.** Under the media query: every animation and transition drops to 1ms, `scroll-behavior` goes to `auto`, and `[data-reveal]` is forced to its final state with `opacity: 1` and `transform: none`. This runs before any JavaScript, so there is no window in which something moves.

**`useReducedMotion()`, in `components/motion/`.** Returns a boolean. Anything that mounts a canvas, starts a RAF loop, attaches a `pointermove` handler, or initialises Lenis branches on it and does not construct the thing at all. Not paused. Not hidden. Never created.

The hook returns `false` during server render and the first paint, then the real value. That order is deliberate: `false` and `true` render identical markup for every component that uses it, so there is no hydration mismatch, and the CSS has already frozen everything by the time the hook resolves.

Entrances use one more rule. `Reveal` sets `data-reveal="out"` on the server and flips it to `in` when the element is 20 percent visible. With JavaScript disabled nothing would flip and the content would stay invisible, so the root layout ships a `<noscript>` style that forces the final state. Invisible content is a worse failure than an unanimated entrance.

## Consequences

- Reduced motion is a real, tested state, not a claim. The screenshot harness at `scripts/shoot.mjs` takes every route with `reducedMotion: 'reduce'` so the still version is looked at, per criterion 13.
- No WebGL, no 2D canvas, no Lenis, and no pointer effects under reduced motion. The Static tier in brief 7b.1 and this ADR describe the same state from two directions.
- Every motion component carries the branch. That is the cost, and it is the point: a component cannot be finished while its still version is missing.
- Content is never hidden behind a reveal it cannot trigger, whether JavaScript failed, was blocked, or the observer never fires.
