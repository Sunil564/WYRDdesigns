# 0035. The cloud field behind S6 is removed until its contrast is solved

Status: accepted
Date: 2026-09-18
Phase: post launch build

Reverts ADR 0031. Supersedes ADR 0033, which was itself already reverted. BLOCKERS item 20 is
closed by this, by removal rather than by solution.

## Context

A Vanta CLOUDS2 field sat behind `How we work` from 2026-09-10, added at the operator's
request. It looked good and it was built properly: dynamically imported inside the Full tier
only, against our own Three.js, with Reduced and Static downloading zero bytes of it.

It never met WCAG AA, and BLOCKERS item 20 tracked that from the day it landed.

Three attempts at the contrast, in order:

1. **ADR 0031 shipped it and recorded the failure.** Worst measured ratio 1.46:1 on the body
   line, against rendered pixels. Recorded rather than fixed, because tint, scrim or layout
   is a design decision and that call was the operator's.
2. **ADR 0033 made S6 a dark band**, which took the body line to 8.08:1 and closed the item.
   Reverted on 2026-09-18: it worked, and a dark band at S6 was the wrong composition for the
   homepage.
3. **Remeasured after that revert, at 1440 on the Full tier**, over every pixel of a text free
   strip rather than only its darkest point. Two of the three inks came back at **1.00:1**.

## The question that settled it

**Is the invisible element text, or decoration?**

Every one of them is text.

| ink | worst | what carries it in S6 |
| --- | --- | --- |
| `--color-fg-muted` | **1.00:1** | the `How we work` eyebrow, and all four step body lines |
| `--color-accent-strong` | **1.00:1** | the step index, `01` to `04` |
| `--color-fg` | 1.32:1 | the four step titles |

The only decoration in the section is the scrubbed process rule, which uses `bg-accent` and
was never implicated.

1.00:1 is not low contrast. It means the field holds pixels at exactly the ink's own
luminance, so where one landed behind a word, the word was not there. Every word in `How we
work` was invisible somewhere in the field's cycle, on the Full tier, on the homepage.

A decorative element failing contrast is a defect to schedule. Body copy that disappears is
not shippable, so the field comes out and the section is plain again.

## What it would take to bring it back

The arithmetic is the durable part and it has survived three attempts. Contrast is a function
of the background's relative luminance, so solving `4.5:1` for the background gives a floor,
not a preference:

| ink | luminance | the background must be |
| --- | --- | --- |
| `--color-fg` `#0a0a0c` | 0.0031 | at or above grey 120 |
| `--color-fg-muted` `#5e5e66` | 0.1134 | at or above **grey 216** |
| `--color-accent-strong` `#336bc8` | 0.1539 | at or above **grey 240** |

**Tinting the field to the light palette is impossible, not difficult.** It would have to hold
above grey 240 everywhere, at every moment, for the step index alone, and grey 240 to white is
fifteen values. A field confined to fifteen values is not a field. A scrim is the same solve
wearing a different hat: clearing grey 240 needs 92 percent white over the texture, which
leaves a ghost.

So exactly one route is left that costs no contrast at all: **keep the field clear of the
columns the text occupies.** A band of field beside the content, or above it, or behind the
section's margin, rather than under the words. That is a layout change and it is the thing to
try when this comes back.

Two shader facts were paid for in ADR 0033 and are worth keeping:

1. **The sky gradient is a fixed unit.** `out1 = skyColor - d.w` spans 1.0 over the canvas
   height whatever colour it is given, so no sky colour renders evenly and any bound is
   applied by pre-offsetting the colour rather than choosing a darker one.
2. **Colours must bypass Three's colour management.** A hex number arrives linearised and
   renders darker than it reads; `setRGB` against the working space assigns exact numbers.

The code is at `72b6654` and its bounded version at `47f0b8e`. `scripts/make-cloud-noise.py`
generated the seeded tileable noise the shader needs, since the existing grain tiles cannot
serve: they are alpha speckle on flat RGB, so the channel the shader reads is a constant.

## Consequences

`vanta` comes out of `package.json`, `types/vanta.d.ts` and `public/textures/clouds-noise.png`
go with it, and `Section` loses the `background` prop that existed only for this.

**`scripts/check-contrast.mjs` now covers S6 again.** It reads background colours from the DOM
and a canvas has none, so for eight days it reported a pass on this section and that pass meant
nothing. With no canvas there, the section is ordinary DOM and the harness is telling the truth
about it once more.

Full tier bundle drops back to 479.3kb over the wire against a 500kb budget, measured, from
491.2kb with the bounded field and 484.1kb with the reverted one.
