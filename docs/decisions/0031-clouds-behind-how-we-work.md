# 0031. A Vanta cloud field behind S6

Status: accepted
Date: 2026-09-10
Phase: post launch build

## Context

The operator asked for Vanta's CLOUDS2 background behind the `How we work` section, and
supplied the snippet from Vanta's own site:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.clouds2.min.js"></script>
<script>
  var setVanta = () => { if (window.VANTA) window.VANTA.CLOUDS2({ el: ".s-page-1 .s-section-1 .s-section", ... }) }
  _strk.push(function() { setVanta(); window.edit_page.Event.subscribe("Page.beforeNewOneFadeIn", setVanta) })
</script>
```

Two rules in `CLAUDE.md` bear on this before any code is written. WebGL is used in exactly
three places and a fourth needs an ADR, which is this document. And the stack list forbids
adding an animation library beyond GSAP, Motion and Three.js without one.

The snippet itself cannot be used as given, for four reasons that are about this site rather
than about Vanta:

1. **It loads Three.js r121 from a CDN in a script tag.** This build pins `three` at 0.180.0
   and self hosts everything, fonts included. A second copy of the library, at a version
   five years older than ours, would ship alongside the one we already bundle.
2. **That script tag runs on every tier.** The Reduced and Static tiers must download zero
   Three.js bytes. A `<script src>` in the document is unconditional, so the snippet as
   written would put roughly 150kb of library on every phone that opens the homepage, which
   is the one thing the tiering rule exists to prevent.
3. **`_strk` and `window.edit_page` are Strikingly's page builder.** The snippet was copied
   from a Strikingly site and those two lines re-run the effect when that builder swaps a
   page. Neither symbol exists here and neither should.
4. **The selector `.s-page-1 .s-section-1 .s-section` is that site's markup, not ours.**

None of that is an argument against the effect. It is an argument against the delivery
mechanism, which is a script tag written for a hosted page builder.

## Options considered

1. **Paste the snippet.** Two copies of Three.js, on every tier, plus dead calls into another
   product's page builder. Refused on the tiering rule alone.
2. **Write the effect ourselves.** The shader is 30 lines of raymarch and the stack already
   says hand-written GLSL in React Three Fiber. It would have reused the canvas that is
   already mounted, cost close to nothing in bytes, and needed no new dependency. Rejected
   because it is a reimplementation of a specific look the operator chose by looking at it,
   and matching it by eye is a longer road than importing it.
3. **Install `vanta` from npm and run it against our own Three.js, inside the Full branch
   only.** Chosen.
4. **Decline.** Not ours to decide. The operator asked for it.

## Decision

`vanta@0.5.24` is a dependency. It has no dependencies of its own, is MIT licensed, and its
`dist/vanta.clouds2.min.js` is 11.5kb before compression. The effect runs on our terms:

- **Our Three.js, not `window.THREE`.** Vanta reads a global by default and accepts a `THREE`
  option instead. It gets an object assembled from named imports of exactly the ten members
  its source touches, read out of `_base.js` and `_shaderBase.js` rather than guessed. No
  script tag, no second copy of the library, and no `import * as THREE`, which this codebase
  forbids.
- **Full tier only.** `CloudsLayer` is a `TierGate` whose Full branch is a render function
  holding a dynamic import with `ssr: false`, the same shape as `SceneLayer`. Reduced and
  Static render nothing at all.
- **The pixel ratio is capped at 1.25.** The fragment shader raymarches 100 steps and takes
  four texture samples at each one, so every pixel costs 400 fetches and a 2x display would
  ask for four times as many pixels. Clouds are the one subject where a softer render is
  invisible. Vanta expresses this as `scale`, which divides `devicePixelRatio`, so a larger
  number renders fewer pixels.
- **Linear output.** The effect was written against r121, where the renderer wrote shader
  output through unchanged. Since r152 the default converts linear to sRGB on the way out,
  which lifts every midtone and turns this sky into a washed pale blue. The renderer is set
  back to `LinearSRGBColorSpace` so our render matches the effect its author shipped.
- **Our own noise texture.** The shader is nothing without one: it builds cloud density from
  four samples of a single texture, so with no texture it draws a flat gradient. Vanta ships
  `gallery/noise.png`; `scripts/make-cloud-noise.py` generates ours instead, seeded and
  tileable, for the same reason nothing else here is fetched from someone else's origin. The
  two existing grain tiles could not be reused: they are alpha speckle on a flat RGB, so the
  green channel the shader reads is a constant.
- **The context is disposed by us.** Vanta's `destroy()` removes its listeners and cancels
  its loop, then drops the renderer without disposing it. The cleanup reads the renderer
  before `destroy()` nulls the field, then disposes and force-loses the context.
- **No colours are passed.** Vanta's defaults render. That also keeps the second rule about
  hardcoded hex values true: no colour value for this effect appears in our source.

The section receives it through a new `background` slot on `Section`, which wraps the section
the way the inverse variant already does. That is what puts the clouds in the positioned-auto
layer: ground, then Thread at z-2, then content at z-10. A background handed to a section is
crossed by the Thread rather than covering it.

## What this cost, measured

Both numbers from `scripts/check-bundle.mjs` against the same build, with the clouds mounted
and with the section reverted to its previous line, so the delta is the feature and not the
month of other work between this and the stored baseline.

| tier | before | after | Three.js |
| --- | --- | --- | --- |
| full | 486.9kb over the wire | **491.6kb** | 221.3kb to 225.9kb |
| reduced | 246.7kb | **246.9kb** | **0kb, unchanged** |
| static | 246.7kb | **246.9kb** | **0kb, unchanged** |

So 4.7kb on the Full tier, of which 4.6kb is the additional Three.js modules Vanta needs and
the rest is the effect. The Full tier budget is 500kb and it now sits at 491.6kb. That
headroom was 13.1kb before this change and is 8.4kb after: the tier was already close, and
this did not cause that, but it is now the change that would be reverted first if something
else needs the room.

The Static tier still mounts no canvas anywhere on the page, so criterion 13 holds. Measured,
not inferred: 0 canvases in the document under a forced Static tier.

## The contrast finding, which is not resolved

**Recorded rather than fixed, because the fix is a design decision the operator has not been
asked for yet.**

The section's text now sits on a moving background, and it is not legible against it by the
standard the rest of the site meets. Measured on a text free strip inside the section on the
Full tier at 1440, against the pixels actually rendered:

| | background luminance |
| --- | --- |
| minimum | 0.0621 |
| median | 0.3113 |
| maximum | 0.4028 |

| text colour | worst ratio over that strip | |
| --- | --- | --- |
| `--color-fg` `#0a0a0c` | 2.11:1 | fails AA |
| `--color-fg-muted` `#5e5e66` | 1.46:1 | fails AA |
| `--color-accent-strong` `#336bc8` | 1.56:1 | fails AA |

The body line and the step index are the worst of it: both sit close in luminance to the sky
itself, so there is no ratio to have.

**`scripts/check-contrast.mjs` will not catch this and will keep reporting a pass.** It walks
the DOM for a background colour, and a canvas has none, so it finds the light canvas token
above it and reports what that pair has always scored. This is exactly the failure mode
recorded in `Section`'s own comment, one layer further out, and the same class as an
acceptance harness reading an invisible element. Anyone reading a green contrast run on this
section should know it did not look at the clouds.

Three ways out, none taken here: tint the sky and cloud colours to the light palette so the
field stays bright enough for dark type, put a scrim between the clouds and the content, or
keep the clouds clear of the columns the text occupies.

## Consequences

- **WebGL now runs in four places, not three.** `CLAUDE.md` says three and names them. That
  sentence is now stale and should be amended to name this fourth one and point here.
- **A second WebGL context lives on the homepage on the Full tier.** Two canvases where there
  was one. Browsers allow a limited number and drop the oldest when it is exceeded, which is
  worth remembering before a fifth.
- **Vanta only renders while its element is on screen**, by its own `isOnScreen()` check, so
  the shader costs nothing while the visitor is elsewhere on the page. It has no
  `document.hidden` handling of its own and does not need any: `requestAnimationFrame` is not
  scheduled in a hidden tab.
- **`mouseControls` adds a `scroll` and a `mousemove` listener on `window`**, each of which
  calls `getBoundingClientRect`. It was left on because the operator's snippet had it on. It
  is the first thing to turn off if the section costs anything while scrolling.
- **The effect adds `toVector` to Three's `Color.prototype`** when it is constructed. It is
  additive and overrides nothing, but it is a shared class and this is the only place in the
  build that mutates one.
- **Sustained frame rate on real hardware is unmeasured**, as it is for everything else here.
  BLOCKERS item 11 already covers that and now covers one more shader.
