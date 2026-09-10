# 0033. The clouds fail on a light ground, so S6 became a dark one

Status: accepted
Date: 2026-09-10
Phase: post launch build

Supersedes the colour decision in ADR 0031, which passed no colours at all and let Vanta's
defaults render. It does not supersede anything else in that document: the tiering, the
Three.js handling, the context disposal and the pixel ratio cap all stand.

## Context

ADR 0031 added the cloud field behind `How we work` and recorded, as BLOCKERS item 20, that
the section's text did not meet WCAG AA against it. Worst measured ratio on the body line was
1.46:1. Three ways out were offered: tint the field to the light palette, put a scrim between
it and the content, or keep the field clear of the text.

The first of those was the recommendation. **It is arithmetically impossible**, and working
that out is what produced this decision.

## Why a light field cannot work

Contrast is a function of the background's relative luminance. Solving `4.5:1` for the
background, against each ink the section uses:

| ink | luminance | the background must be |
| --- | --- | --- |
| `--color-fg` `#0a0a0c` | 0.0031 | at or above L 0.189, grey 120 |
| `--color-fg-muted` `#5e5e66` | 0.1134 | at or above L 0.685, **grey 216** |
| `--color-accent-strong` `#336bc8` | 0.1539 | at or above L 0.868, **grey 240** |

So a light field has to stay above grey 240 everywhere, at every moment, for the step index
alone. Grey 240 to white is a range of fifteen values. **A cloud field confined to fifteen
values is not a cloud field**, and no amount of colour choice changes that: it is the ink's
luminance that sets the floor.

A scrim is the same arithmetic wearing a different hat. Compositing the field under 92 percent
white to clear grey 240 leaves a ghost of a texture, and 92 percent is what the accent index
requires.

Now the same solve in the other direction, for the inverse ink the site already owns:

| ink | luminance | the background must be |
| --- | --- | --- |
| `--color-fg-inverse` `#f7f6f4` | 0.9222 | at or below L 0.166, **grey 113** |
| `--color-fg-inverse-muted` `#9a9aa2` | 0.3259 | at or below L 0.034, grey 51 |
| `--color-accent-on-inverse` `#4c86db` | 0.2370 | at or below L 0.014, grey 31 |

Grey 0 to grey 113 is a usable range. That is the whole decision.

## Decision

**S6 is an inverse band, and the cloud field is its ground.**

Every piece of ink in the section goes to full `--color-fg-inverse`: the eyebrow, the step
index, the title and the body line. Not the muted token and not the accent, because the table
above disqualifies both against anything but a near black ground, and a field held below grey
51 would be indistinguishable from the flat block it sits on. The codebase already does
exactly this on the blue cluster card, where `--card-ink-muted` resolves to full inverse ink
for the same reason.

The one accent left in the section is the scrubbed process line, which is not text and is not
governed by the contrast rule. It moves to `--color-accent-on-inverse`, the bright variant the
dark blocks already use.

### The field is bounded by a constant with the arithmetic attached

`FIELD_CEILING = 0.40` in `CloudsScene`. That is grey 102 at L 0.1329, which measures
**5.32:1** against the inverse ink, inside the L 0.166 limit with headroom for the grain and
the renderer's dithering. Above 0.45 the section fails AA and nothing warns you, which is why
the number is a named constant with the solve written above it rather than a value in a call.

### Three things had to be understood about the shader to bound it at all

1. **The sky gradient is a fixed unit and cannot be flattened.** `out1 = skyColor - d.w`,
   where `d.w = gl_FragCoord.y / iResolution.y - 0.65`. The sky therefore runs from
   `skyColor + 0.65` at the bottom of the canvas to `skyColor - 0.35` at the top, a span of
   1.0 whatever colour it is given. There is no sky colour that renders evenly. The colour
   passed is pre-offset by that 0.65 so the bright end lands exactly on the ceiling; the dark
   end goes below zero and clamps into the section's own ground.
2. **Colours must bypass Three's colour management.** Three converts sRGB to linear on the way
   in, and this effect was written against a renderer that did no conversion on the way out,
   which is why ADR 0031 set `outputColorSpace` to linear. A colour handed in as a hex number
   is therefore linearised and renders darker than it reads, which is what made the default
   sky the near black band in the first screenshots. `setRGB` against the working colour space
   is the one path that assigns the exact numbers, and it is also what lets a component hold
   the negative value the offset needs: `Color.set` copies another `Color` rather than
   clamping it.
3. **The hue comes from a token, the brightness from the constant.** The field is
   `--color-border-inverse` normalised so its brightest channel is 1, then scaled to the
   ceiling. No hex value for this effect appears in the source, and a palette change carries
   the clouds with it.

## What was measured

On a text free strip at the bottom of the band, which is the bright end of the gradient and
therefore the worst case, on the Full tier against the rendered pixels:

| | 1440 | 412 |
| --- | --- | --- |
| field luminance, median | 0.0646 | 0.0610 |
| field luminance, 99.9th percentile | 0.0703 | 0.0664 |
| worst ratio, every ink in the section | **8.08:1** | **8.35:1** |

**The first version of this measurement reported 1.00:1 and was wrong.** It sampled the whole
band, and on a dark ground the brightest pixel in any sample containing text is the text. The
field has to be measured where no ink is. The same mistake in the other direction is what let
the light version look acceptable in a screenshot.

`scripts/check-contrast.mjs` now reports this section correctly for the first time, at
18.31:1, because the ground is real markup on an ancestor rather than a canvas: it reads
`--color-bg-inverse`, which is what sits behind the field. That is a true statement about the
band and still not a statement about the clouds, so the pixel measurement above remains the
evidence for those.

Also unchanged and re-verified: zero Three.js bytes on Reduced and Static, Full tier at
491.2kb against a 500kb budget, 14 of 14 tier checks, and every rendered text and background
pair on the site at AA.

## Consequences

- **The homepage now has two dark bands, S6 and S8, where it had one.** Phase 4b calls dark
  blocks punctuation, and two in the last three sections is a real change to the page's
  rhythm. It is the price of the effect, and it is reversible by reverting this ADR without
  touching ADR 0031's machinery.
- **The Reduced and Static tiers get a plain dark band.** They render no clouds, which was
  already true, but the band is now a deliberate composition on those tiers rather than the
  absence of one. Verified by screenshot: the section reads as intended with no field at all.
- **The Thread crosses the band in its inverse colour automatically**, because the section is
  a real `data-inverse-band` now rather than a canvas the Thread knows nothing about.
- **The visible cloud detail is confined to the lower half of the band**, since the sky clamps
  to black above the point where the gradient goes negative. That reads as a horizon, and it
  is inherent to bounding a unit gradient below grey 113 rather than a defect.
- **`Eyebrow` gained a `variant` prop.** Overriding its colour through `className` silently did
  nothing: `cn` is a plain joiner with no conflict resolution, by its own documented contract,
  so `text-fg-muted` and `text-fg-inverse` both landed in the attribute and stylesheet order
  decided. It rendered muted on the dark band and looked like a wrong colour rather than a
  wrong API.
