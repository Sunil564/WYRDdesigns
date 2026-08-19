# Motion system

Motion is the product on this site. That is exactly why it is disciplined. Every effect below has a reason: it either serves the Thread metaphor or it serves legibility. Anything that serves neither was cut.

Tokens live in `app/globals.css`. Implementation lives in `components/motion/`.

## 1. Tokens

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | entrances |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | position and layout changes |
| `--dur-fast` | 200ms | hover, micro states |
| `--dur-base` | 500ms | most entrances |
| `--dur-slow` | 900ms | large reveals, hero |
| `--stagger-sibling` | 60ms | between sibling elements |
| `--stagger-char` | 18ms | between characters in a headline |

All from brief section 5.1. `brand.md` is silent on motion. The superseded document banned parallax, scroll jacking, and cursor followers, and it does not govern this build. The brief specifies a cursor label on work cards, a magnetic button, and scrubbed scroll, so those ship. Recorded here because it is a real reversal of an earlier written rule, not an oversight.

## 2. Global rules

1. Every scroll triggered entrance fires **once**, at 20 percent element visibility, and never re-fires on scroll up. Implemented in `useInView` with `once: true`, and in GSAP with `toggleActions: 'play none none none'`.
2. Stagger is 60ms between siblings, 18ms between characters. Not tuned per section.
3. Nothing animates longer than 1.2s. Nothing loops faster than 4s.
4. Every RAF loop and every WebGL scene pauses on viewport exit through `IntersectionObserver`, and on `document.hidden` through a `visibilitychange` listener.
5. Only `transform` and `opacity` are animated. No animated `width`, `height`, `top`, `left`, or `margin` anywhere. The one exception is `stroke-dashoffset` on the Thread, which is what SVG line drawing is, and it is composited on the GPU by every current browser.
6. `prefers-reduced-motion: reduce` is implemented in the same commit as every effect, never bolted on afterwards.

## 3. Reduced motion

Reduced motion is a hard stop, not a softening. See ADR 0012.

| Layer | Full and Reduced tier | Static tier, reduced motion |
|---|---|---|
| Entrances | animate in | rendered in final state on first paint |
| Headline split | per character reveal | plain text, never split |
| Thread | drawn on scroll | rendered complete at rest colour |
| Particle field | WebGL or 2D canvas | not mounted at all |
| Marquee and loops | running | not running |
| Hover states | colour and background transitions | instant state change |
| Magnetic button, cursor label | active | disabled |

Two mechanisms enforce it, and both are required:

- A CSS block in `globals.css` reduces every animation and transition to 1ms under the media query. That covers anything declarative and anything a third party ships.
- `useReducedMotion()` returns a boolean that JavaScript branches on, so canvases and RAF loops are never created in the first place. A 1ms transition on a mounted WebGL canvas is still a mounted WebGL canvas.

The site with zero motion must still look composed. That is verified by screenshot at each breakpoint, not by reasoning about the code.

## 4. The Thread

The organising idea from brief section 2.2, and the reason the motion system is coherent rather than a collection of effects.

- A fixed position SVG overlay spanning the homepage. `pointer-events: none`, above the grain, below content.
- The path is drawn with `stroke-dasharray` and `stroke-dashoffset`, offset driven by scroll progress with GSAP ScrollTrigger and `scrub: 1`.
- Body stroke is `--color-line`. A 240px travelling segment of `--color-signal` follows the draw head, so the live tip glows and the drawn body sits back. Implemented as a second path with its own dash pattern rather than a gradient, because a gradient cannot follow a path head.
- At the capabilities section the path branches into four strands, one terminating at each cluster block.
- At the contact section the four strands reconverge into one line that terminates at the button.
- Below 1024px: a single straight vertical line, no branching. Branch geometry depends on a two column grid that does not exist on mobile.
- Reduced motion: the full path renders at rest colour with no draw animation and no travelling segment.

Technical approach and the mobile fallback: ADR 0018.

## 5. Per section motion

| Section | Effect | Trigger |
|---|---|---|
| S1 Hero headline | SplitText to characters, from `opacity: 0, y: 40%, rotateX: -35deg`, 18ms stagger, `--dur-slow`, `--ease-out`, each line masked by `overflow: hidden` | on mount, once |
| S1 Hero eyebrow | fade in 200ms before the headline | on mount |
| S1 Hero lead and actions | fade and rise, 300ms after the headline finishes | on mount |
| S1 Particle field | curl noise drift in the vertex shader, cursor repulsion by inverse square, cursor uniform lerped at 0.08 | continuous while in view |
| S2 Positioning | line by line mask reveal, 120ms stagger, italic phrase 400ms after the rest, surrounding text held at 70 percent opacity until it completes | scroll, once |
| S3 Capabilities | Thread branches scrubbed to scroll, blocks enter with 60ms stagger and `y: 32px` | scroll, once |
| S3 Capability hover | background `--color-surface` to `--color-surface-2` over `--dur-fast`, index digit to `--color-signal`, hairline sweeps left to right across the top edge | pointer |
| S3 Grid pointer | soft radial highlight follows the pointer, driven by two CSS custom properties updated on `pointermove`, not a per frame repaint | pointer |
| S4 Work cards | staggered mask reveal, visual scales 1.12 to 1 inside a fixed frame so the frame never moves | scroll, once |
| S4 Card hover | visual to 1.04 over `--dur-base`, title shifts right 8px | pointer |
| S4 Cursor | native cursor swapped for a `VIEW` label following the pointer at 0.15 lerp | pointer, fine only |
| S5 Client logos | static centred row at six logos. Marquee at eight or more, two rows opposed, 40s per pass, pause on hover | continuous while in view |
| S6 Process | Thread draws left to right through four nodes, each step revealing as the head reaches its node, scrubbed. Below 1024px, stacked and revealed on entrance | scroll |
| S7 Studio strip | text reveal only. The site needs a quiet section before the close | scroll, once |
| S8 Contact CTA | four strands reconverge into one terminating at the button. Button is magnetic, up to 12px toward the cursor within 90px, springs back on leave | scroll and pointer |
| S9 Footer | none. The oversized clipped wordmark is static | none |
| Page transitions | Full tier dissolves through a noise threshold in the direction of the Thread, roughly 700ms. Reduced tier crossfades with a 24px Y offset | route change |

Magnetic button and cursor label are disabled on coarse pointers and under reduced motion. Both are pointer affordances, and a finger has no hover.

## 6. Library split

| Library | Owns | Why not the other one |
|---|---|---|
| GSAP with ScrollTrigger | scrubbed scroll, the Thread, per section entrances, pinning | Motion has no equivalent to scrubbed timeline control over a path |
| GSAP SplitText | per character headline splitting | doing it by hand means rebuilding grapheme and line handling |
| Motion | component state, layout animation on the `/work` filter, `AnimatePresence` page transitions | GSAP has no layout animation primitive, and Motion's spring is better for the magnetic button |
| Three.js and R3F | the three WebGL uses in brief 7b | DOM cannot do 30,000 points or a displacement shader |
| 2D canvas | the Reduced tier particle fallback | loading Three.js to draw 90 dots is the bug the tiering exists to prevent |

ADR 0008 records the split. A fourth animation library needs its own ADR.

## 7. Scroll

Architecture and the single RAF loop: ADR 0014.

Lenis owns the scroll, GSAP ScrollTrigger is driven from Lenis's `scroll` event, and `ScrollTrigger.update` is called from it. `lenis.raf` runs on GSAP's ticker so there is exactly one RAF loop for scroll on the page.

Anchor links and hash scrolling go through `lenis.scrollTo`, so an in page link does not fight the smooth scroll. `html.lenis { scroll-behavior: auto }` disables native smooth scroll while Lenis is mounted, since the two together produce a visible double ease.

Under reduced motion Lenis is not mounted at all and native scroll handles everything.

## 8. Performance rules that are motion decisions

- Split headlines reserve their final layout box before animating, so the character reveal causes zero CLS.
- The cursor highlight in S3 writes two CSS custom properties on `pointermove` and lets the compositor paint the gradient. It never triggers a JavaScript repaint per frame.
- `will-change` is set only on elements that are about to animate, and removed on completion. A permanent `will-change` on a large element costs memory on every frame.
- The hero canvas is `aria-hidden` and `pointer-events: none`, so it can never block a click on either hero action.
