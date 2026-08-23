# 0029. Two cluster card grounds, and the single accent rule is retired

Status: accepted
Date: 2026-08-23

Amends `docs/design-system.md` section 1.2 on the single accent rule. Does not supersede
ADR 0019: the light canvas and the use of dark blocks as punctuation both stand.

## Context

The four capability cluster cards were four identical dark blocks on the white canvas. They
are the section the page is built around, and four of the same thing in a 2x2 grid reads as a
list rather than as four distinct offers.

`CLUSTER-CARD-COLOURS.md` sets two grounds alternating across them, royal `#4461E4` and lime
`#E4FDB8`, and makes the structural point that the two take **opposite** contrast pairs: royal
reads the inverse text set, lime reads the light set.

The design system said, in one line and without qualification: "One accent. No second accent,
no gradient palette." Two grounds is not a second accent, but the line as written forbids the
change, and a rule that is quietly worked around is worse than one that is retired on the
record. Hence this ADR.

A previous version of this work existed at tag `neon-cards-and-audio-backup` and was reverted
whole. Its palette and its audio component are both out of scope and nothing was ported.

## The brief assumed a prop that did not exist

`CLUSTER-CARD-COLOURS.md` section 2 said the `variant` prop added in Phase 4b already carries
`light | inverse` and asked for it to be extended.

There is such a prop, on `Section`, on `Wordmark` and on `Button`. There was none on the
cluster cards. `CapabilityGrid` hardcoded the inverse treatment on every card as Tailwind
classes on the article, so there was nothing on a card to extend and no way for a card to say
which ground it was on.

The operator confirmed the requirement rather than the mechanism: a card must select its
ground and its text pair together instead of reading one hardcoded set.

**What was built.** A `variant` prop on the card, `royal | lime`, named for `Section`'s
because it does the same job one level up. The values differ deliberately: a section chooses a
token set, a card chooses a ground. It lands on the element as `data-variant`, and
`app/globals.css` resolves ground, ink, muted ink and hairline from it in one block. A card is
described by which variant it is and nothing else.

## Decision

Two ground tokens, `--color-card-royal` and `--color-card-lime`. They are grounds, not
accents: nothing outside these four cards may use them, and neither is a text colour anywhere.

The single accent rule is retired for grounds and kept for accents. There is still exactly one
accent, `--color-accent`, and these two tokens do not compete with it because no element is
ever painted with them as a foreground.

### Measured, against the live tokens

Forty text and ground pairs across four cards, two widths, at rest and under a real hover.
Every pair clears AA. The tightest is 4.77:1.

| pair                             | measured |
| -------------------------------- | -------- |
| `--fg-inverse` on royal          | 4.77:1   |
| `--fg-inverse` on royal, hovered | 5.42:1   |
| `--fg` on lime                   | 17.94:1  |
| `--fg-muted` on lime             | 5.82:1   |
| royal against lime               | 4.67:1   |

### Three things the measurement forced

**Royal has no muted tier, and that is the one visible cost of this change.**
`--color-fg-inverse-muted` measures 1.84:1 on royal. The lightest grey that clears 4.5:1 there
is about `#F0F0F0`, which is within 0.3:1 of the main text and reads as the same colour. So
royal drops the tier rather than inventing a token that is muted in name only, and hierarchy
comes from scale and weight, which is what the design system already says to do when the
accent is unavailable. Lime keeps its tier, because it has the room royal does not.

The consequence is asymmetric and it is visible: on a royal card the service name and its
description are the same white, where on lime they separate. Recorded rather than hidden. The
palette is the brief's and was not changed to fix it; darkening royal would buy the tier back
and is an operator decision, not one to take inside this commit.

**Hover deepens rather than lifts.** The inherited behaviour mixed the ground toward its own
ink, which on royal costs the tightest pair on the page: 12 percent of mist mixed into royal
takes 4.77:1 under the floor. Mixing toward `--color-fg` moves both grounds away from their
text, so the hover state is the higher contrast one on both.

**The pointer highlight moved below the cards.** It screened 14 percent of mist over the whole
grid, which was free when every card was near black and is not when one is a 4.77:1 ground: it
took royal's text under AA whenever the pointer was near it. At `z-index: 0` it lights the
gutter between the cards and leaves the grounds alone, which is the effect it was for.

## The accent inside these cards

`--color-accent` measures 1.41:1 on royal and 3.32:1 on lime, and `--color-accent-strong`
measures **1.00:1** on royal: `#336BC8` and `#4461E4` have almost the same relative luminance,
so the site focus ring is not weakened there but absent.

The accent is removed from inside the cards entirely rather than tuned to survive both grounds.

- The index digit no longer turns accent on hover. It does not change colour at all, and the
  hairline sweep carries the hover signal alone.
- The sweep is the card's own ink, 4.77:1 on royal and 17.94:1 on lime.
- The focus ring inside a card is the card's own ink, clearing the 3:1 non text floor on both.

Audited by grep and again at runtime: nothing inside the four cards resolves to either accent
token. `scripts/check-home.mjs` asserts it and proves the assertion can fail by planting one.

## Royal against the accent, which are close in hue

The brief asked for a verdict on whether royal `#4461E4` and the accent read as a deliberate
pair or as a near miss. Screenshotted at `build-logs/screens/cards-royal-vs-accent-*.png`,
where the header's filled "Start a project" button sits in frame with the grid at 1440px.

**The verdict is near miss, and the measurement agrees with the eye.** The first version of
this ADR said the opposite, written before the frame was looked at, and it was wrong.

|                                              | L      | chroma | hue       |
| -------------------------------------------- | ------ | ------ | --------- |
| royal `#4461E4`                              | 0.5483 | 0.2009 | 269.2 deg |
| `--accent-strong` `#336BC8`, the button fill | 0.5403 | 0.1565 | 260.0 deg |
| `--accent` `#4C86DB`                         | 0.6210 | 0.1428 | 257.9 deg |

Royal against the button fill is **0.0533** in oklab distance, where royal against lime is
0.4984, nearly ten times further. Their lightness matches to within 1.5 percent and their hue
is 9.2 degrees apart, so almost the whole of the difference is saturation. Two blues at the
same lightness, nine degrees apart, differing mainly in chroma is the profile of a colour that
was meant to match and did not, rather than of a second tone chosen on purpose.

The header is sticky, so the button is above the grid for the whole of the scroll through this
section rather than passing it once. That makes the proximity more visible, not less.

**Not fixed here, and it is a real open question.** Both ways out are operator decisions
outside a colour change to four cards: move royal further from the accent hue, or move the
accent. The palette in `CLUSTER-CARD-COLOURS.md` is the brief's and was not altered to resolve
something the brief asked to be reported on.

## Consequences

- Two more ground tokens exist and are scoped to one component by convention rather than by
  the compiler. If a third ground is ever wanted, it needs its own ADR.
- Royal cards read flatter than lime cards. See above.
- The grain is per variant: lime takes the dark noise multiplied, because screening light
  noise onto a ground that light is a near no op and would leave lime the only flat surface in
  the grid. Measured as an on and off difference on a text free patch: lime gains sd 1.44
  levels, royal gains sd 0.93, against the page grain's own tuned figure of sd 1.4.
- Scope held. The contact call to action, the footer, the case study frames and the work cards
  are untouched, so the page still ends dark and the thread's inverse band switch is not
  reopened.
- The thread still passes behind the cards. Section content sits at `z-index: 10` and the
  thread host at `z-index: 2`, unchanged, and no particle colour logic was touched.
- Corner radius is unchanged at `0`, per the design system's rejection of a rounded card look.
  The reference these colours came from used a radius and that remains a separate decision.
