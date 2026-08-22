# 0029. Neon capability cards, and the retirement of the single accent rule

Status: accepted
Date: 2026-08-22

Reverses the single accent rule in `docs/design-system.md`. Amends ADR 0019, which made these
four cards inverse blocks.

## Context

The four capability cluster cards were `--bg-inverse` blocks: near black ground, inverse
contrast pair, the accent on the index digit at hover. They become four neon grounds, one per
cluster.

The design system has said since Phase 1: *One accent. No second accent, no gradient palette.
Emphasis that cannot use the accent uses scale and weight.* That rule is now retired, and this
ADR exists so it is understood as deliberately retired rather than quietly forgotten.

**What the rule was protecting.** A site that reaches for a new colour every time something
needs emphasis ends up with no hierarchy, because everything is emphasised. The rule forced
emphasis through scale, weight and space, which is why the rest of the site still has exactly
one accent and why this ADR does not open the door further.

**Why it is retired here.** The four clusters are the one place on the site where four things
are genuinely peers and genuinely different. Scale and weight cannot express "four equal,
distinct categories" without ranking them, which is the one thing that would be wrong. Colour
can, and it is the only device that can.

The rule is replaced rather than deleted: **one accent, plus four cluster grounds, and nothing
else.** Section 1.3 of the brief already fences it, and the reasons there are good ones. The
contact band and footer are the page's dark terminus. The contact band carries the Thread's
inverse colour switch with band ranges as uniforms, finished and correct. Case study frames
exist to hold photography and a neon frame fights a photograph.

## The contrast direction reverses, which is the whole change

This is not a background swap. Measured against every neon bright enough to read as neon:

| Ground | `--fg` | white |
|---|---|---|
| `--neon-01` `#00E5FF` | 12.86 | 1.54 |
| `--neon-02` `#CCFF00` | 16.83 | 1.18 |
| `--neon-03` `#FF7AF7` | 8.83 | 2.66 |
| `--neon-04` `#00FF9C` | 14.87 | 1.33 |

White is unusable on all four. So these stop being inverse context blocks and become **light
context blocks on a coloured ground**: `--fg`, the light border, the light everything.

## Three things the measurement forced

**1. A muted token.** The brief allowed a parallel token only if a measurement demanded it.
`--fg-muted` `#5E5E66` is 4.18:1 on cyan and 2.01:1 on the brief's magenta, so it fails on the
ground it exists to sit on. `--color-fg-neon-muted` `#33333A` is the lightest neutral clearing
4.5:1 on all four, worst case 5.60:1. It is the only token added beyond the four grounds.

**2. A brighter 03.** The brief proposed `#FF10F0`. It measures 6.20:1 against `--fg` where the
others are 12.86, 16.83 and 14.87, and left nothing beneath it: the lightest possible muted
grey cleared 4.5:1 on it by 0.04, and on a hover state no muted value cleared it at all.
`#FF7AF7` keeps the hue at 8.83:1 and gives the muted token 5.60:1. Substitutions had to be
measured and clear 4.5:1; this one clears it by a wide margin and fixes the set's one outlier.

**3. Hover lightens.** The inverse version mixed toward `--fg-inverse` to lift a dark card. The
same instinct on a bright card darkens it, which reads as pressed rather than raised, and
measures worse: mixing 03 toward `--fg` gives a hovered ground where `--fg` itself reaches only
4.96:1 and no muted value clears 4.5 at all. Toward white it is 9.2 and 5.9. The direction of a
hover turns out to be a contrast decision, not a taste one.

## Every accent inside these cards is gone

`--accent` measures 2.38, 3.11, 1.15 and 2.75 on the four. It cannot appear inside them at all.

- **The index digit** goes `--fg-neon-muted` to `--fg` on hover. Item 1.2 offered dropping the
  colour change and keeping the sweep alone. Muted to full weight is the same gesture the
  accent step was, in the only direction the ground allows, and dropping it would leave the
  digit as the one element on the card that does not respond.
- **The sweep hairline** was `--accent-on-inverse`, 1.61:1 on 03. Now `--fg`, 6.20 at worst.
- **The focus ring** was `--accent-strong`, 1.61:1 on 03: invisible on the card most likely to
  be tabbed into. Now `--fg`, clearing 3:1 everywhere with the worst at 8.83.
- **Separators** were `--border-inverse`. `--border` is 1.13:1 on 02 and 1.00:1 on 04, which is
  not a faint hairline but no hairline. A 22 percent `--fg` tint is the only thing that reads
  on all four and stays derived from a token.

Verified rather than grepped: every computed `color`, `background-color`, `border-color`,
`outline-color` and `fill` on every descendant of every card was resolved through a canvas and
compared against all three accent tokens. Zero matches.

## Two blend modes inverted for the same reason as everything else

**Grain.** The inverse grain screens light noise onto near black. Screening the same file onto
`#CCFF00` lifts an already near maximum channel and reads as haze over the colour rather than
grain in it. It multiplies now, at 0.06. Same asset, opposite operation.

**The pointer highlight.** It screened near white to lift a dark card. On neon that washes the
colour toward white and stops reading as a highlight. It multiplies a light grey instead, which
deepens the neon under the cursor and is very nearly a no op on the white gutters between the
cards, which is the property the screen version had and the reason it was chosen.

## `variant` is on the card, not on `Section`

The brief asked for `light | inverse | neon` on the `variant` prop added in 4b. That prop is
`SectionVariant`, and **no section is neon.** Section 1.3 forbids the contact band, the footer
and the case study frames from becoming one, which is every full bleed region there is. Adding
a value to a section level union that no section may legally use would invite exactly the
spread the brief rules out.

It is `data-variant="neon"` on the card instead. Same idea, at the level that actually has it.

## One trap worth recording

The grounds were applied with `` style={{ '--neon': `var(--neon-0${index + 1})` }} ``. Tailwind
scans source as text, never saw the names, emitted `--neon-01` and `--neon-04` and tree-shook
the other two. Cards 02 and 03 rendered on a transparent ground with no error anywhere.

**A theme variable referenced only through a template literal is invisible to that scanner.**
The four names are written out in full in `NEON_GROUNDS` now.

## Consequences

- Sixteen text and ground pairs measured on the built page, at rest and on hover. All clear AA,
  tightest margin 1.24x over its floor.
- The Thread still passes behind: the cards are inside a `z-10` section and the Thread is at
  `z-2`. No particle colour logic changed, because none of it reads the card ground.
- The grain is now nearly imperceptible on these four. It does not read as dirt, which is what
  was asked, but it also contributes little. Left as it is rather than tuned up into the thing
  the criterion warns against.
- `docs/design-system.md` carries the replacement rule.
