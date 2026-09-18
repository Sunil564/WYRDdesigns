# 0033. The S6 inverse band was built, then reverted

Status: superseded by the revert it records
Date: 2026-09-18
Phase: post launch build

Records a decision that shipped on 2026-09-10 as commit `47f0b8e` and was reverted on
2026-09-18 at the operator's call. ADR 0031 stands unchanged and unsuperseded: the tiering,
the Three.js handling, the context disposal and the pixel ratio cap were never in question.
**BLOCKERS item 20 is open again, in the state ADR 0031 left it.**

## Context

ADR 0031 put the Vanta cloud field behind `How we work` and recorded that the section's text
failed WCAG AA against it, worst ratio 1.46:1 on the body line. Commit `47f0b8e` answered that
by turning S6 into a dark band with the field as its ground, which took the body line to
8.08:1 and closed the item.

The operator reviewed the result and judged that it did not land. A dark band at S6 is a
compositional decision about the homepage, not a contrast decision, and that call is theirs.

## Decision

Revert `47f0b8e`. S6 returns to the light palette with Vanta's default field, the `Eyebrow`
`variant` prop is removed, and `Section` stops painting a background beneath the grain.

## What must not be lost with it

The arithmetic in the reverted document is the durable part, and it constrains whatever comes
next. Contrast is a function of the background's relative luminance, so solving `4.5:1` for
the background against each ink S6 uses gives a floor, not a preference:

| ink | luminance | the background must be |
| --- | --- | --- |
| `--color-fg` `#0a0a0c` | 0.0031 | at or above grey 120 |
| `--color-fg-muted` `#5e5e66` | 0.1134 | at or above **grey 216** |
| `--color-accent-strong` `#336bc8` | 0.1539 | at or above **grey 240** |

**Tinting the field to the light palette is impossible, not merely difficult.** A light field
has to hold above grey 240 everywhere, at every moment, for the step index alone, and grey 240
to white is fifteen values. A field confined to fifteen values is not a field. A scrim is the
same solve wearing a different hat: clearing grey 240 needs 92 percent white over the texture,
which leaves a ghost.

That leaves two routes the next attempt can actually take. Keep the field clear of the columns
the text occupies, which is a layout change and costs no contrast at all. Or change the ink,
which is what the reverted commit did and what the operator has now declined in that
particular form.

Two shader facts were paid for in the reverted work and are worth keeping:

1. **The sky gradient is a fixed unit.** `out1 = skyColor - d.w` spans 1.0 over the canvas
   height whatever colour it is given. There is no sky colour that renders evenly, so any
   bound on the field is applied by pre-offsetting the colour, not by choosing a darker one.
2. **Colours must bypass Three's colour management.** A hex number arrives linearised and
   renders darker than it reads. `setRGB` against the working space assigns the exact numbers.

## Consequences

`scripts/check-contrast.mjs` reports a pass on this section and will keep reporting one. It
reads background colours from the DOM and a canvas has none. A green contrast run does not
cover S6 and did not cover it before `47f0b8e` either. The only measurement that counts here
is rendered pixels sampled on a text free strip inside the section.

At 768 the stacked layout puts the first step's body line on the dark band at the top of the
field, where it nearly disappears. That is visible, not only measured.
