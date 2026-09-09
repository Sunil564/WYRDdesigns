# 0032. A visual-first case study, and the four block types it needed

Status: accepted
Date: 2026-09-10
Phase: post launch build

## Context

`BHAVANI-VISUAL-CASE-STUDY.md` supersedes `PROJECT-BHAVANI-GARMENTS.md` and restructures one
case study around its visuals, cutting the copy to roughly a third. It is also the first real
project data this build has had: a named client, a place, a sector, an engagement, and a
description of what was made. Everything on the page traces to that document.

**`PROJECT-BHAVANI-GARMENTS.md` is not in the repository.** The superseding brief refers to it
and to "the supplied case study", and neither is present. So the fact audit in criterion 9 of
the brief traces to `BHAVANI-VISUAL-CASE-STUDY.md` alone, which carries every fact the page
renders. Nothing was taken from memory of the older document, because there is nothing to
remember it from.

The template it lands in was built for a project with nothing cleared. Its body is three
alternating frames and no prose at all: `CaseStudyBlocks` mapped a fixed array of three image
getters, and the only words on the page were the title, a one line summary under a
`The brief` label, and a meta row. The brief describes the template as holding "three to five
blocks alternating full-bleed and inset visuals, with body copy". The first half was right and
the second was not: there was no body copy block, and there never had been.

## Decision

### The block system

`Project` gains an optional `blocks` array. A project without one renders the original three
frames, unchanged, which is what the two uncleared projects still do. A project with one
renders its blocks in order.

Four block types, which is the number the brief allows:

| type | what it is |
| --- | --- |
| `copy` | one or two lines. All the page's prose lives here |
| `visual` | one slot, or two side by side on desktop and stacked below `sm` |
| `loop` | a short muted looping clip |
| `diagram` | labelled nodes joined by a line, drawn from tokens |

**Device framing, pairing and the caption are fields, not types.** The brief lists four
capabilities to support and caps the extension at four block types, and those two constraints
only both hold if some capabilities are expressed as fields. Which ones is not arbitrary:

- **`frame` sits on the slot, not the block**, because a pair can mix. Visual 5 is an
  Instagram grid beside a Google Business Profile panel, and a block level frame could not
  describe that.
- **`caption` sits on the block** and renders as `figure` with `figcaption`. A caption is not
  a sibling of the picture it describes, it is part of it, and a standalone caption block
  would be a paragraph that happens to sit underneath one. This is the one deliberate
  departure from the brief's list, and it produces one fewer type and better markup.

The device frames are a border, a radius and two hairlines, drawn from tokens. No mockup
asset and no library. A photorealistic handset would be the loudest thing on a page whose
argument is the screen inside it. The phone frame is capped at 18rem and centred: uncapped, a
9:16 slot fills its column and draws a 460px phone on desktop, which reads as a grey tower.

### The page order

The default template opens with the hero visual and puts the title under it. A project with
`blocks` opens with the words and lets its own first block be the hero, which is what the
brief's section 3 asks for. It also keeps the largest paint on that route a heading rather
than a picture, which is the brief's own performance rule. Measured: the LCP element on
`/work/bhavani-garments` is the standfirst paragraph at both 1440 and 412.

### The content model

- **`clusters` replaces `cluster`.** A project can sit in more than one, which is what makes
  the Reach chip enable: Bhavani Garments is Build and Reach. The card publishes its clusters
  as `data-clusters` so verification reads them off the page rather than keeping a copy.
- **`images` becomes nullable.** This project uses none. The generated silk frames are still
  in `public/work` and are now wired to nothing: they are the wrong subject for this client,
  because a picture of silk is decoration beside a screenshot of the catalogue that was
  actually built. `WorkCard` and the body both fall back to the seeded placeholder.
- **New fields**: `statement` (the hero line), `sector`, `engagement`, and `stack`. Each is
  nullable and each renders nothing when null, which is the rule the meta row already had.
- **The meta row skips the client when it repeats the h1.** On a cleared project the title is
  the client's name, and saying it again under a heading that just said it is noise dressed as
  information. `engagement` replaces `services` where it exists, for the same reason: the
  client's words for the work beat our service catalogue's on the client's page.

### Placeholder state

Nine slots, all `Placeholder`, all carrying `data-placeholder` with the sentence describing
what belongs in them, all listed in `docs/placeholders.md`. Ten elements rather than nine,
because the two slots with a different mobile ratio render both and let CSS pick: one element
changing `aspect-ratio` at a breakpoint reserves the wrong box on first paint at one of the
two widths.

**The loop slot renders a still, not a `video`.** There is no file. An empty video element is
a poster attribute pointing at nothing and a source that 404s. The element arrives with the
clip, and with it `preload="none"`, `muted`, `playsinline`, the in-viewport autoplay and the
reduced motion branch.

## What was measured

- **Body copy: 111 words**, against the brief's ceiling of 200. Counted from the rendered page
  at both widths, excluding captions, meta, the stack line and the diagram labels.
- **Zero digits render on the route.** The numbers in the copy are words: `Seven posts and
  five reels`, `Three women's clothing showrooms`. That is the brief's own phrasing and it is
  what keeps the existing no-numbers criterion true without an allowlist.
- **LCP is text** at 1440 and at 412.
- **CLS is 0.0033 at 1440 and 0.0061 at 412 on a cold cache, and exactly 0.00000 on a warm
  one.** So the whole of it is the font swap reflowing the captions, not an unsized box: every
  media slot reserves its aspect ratio from markup. The control is `/work/brand-film-manufacturing`,
  which shows 0.00037 and 0, and whose only shift is the header nav. This page has more text
  than that one, and the shift scales with the text.
- **Accessibility 100** on `/work/bhavani-garments`, and every rendered text and background
  pair meets AA.
- **Lighthouse Performance is not measured.** The local harness does not score it, by its own
  design, so criterion 11's mobile 90 needs a deployment. It is the one acceptance criterion
  in the brief that is still open.

## Consequences

- **The slug changed from `ecommerce-garments` to `bhavani-garments`.** A named case study at
  a placeholder URL would be odd, and nothing links to the old one from outside the repo,
  since there is no production domain yet. Five harnesses carried the old slug and now carry
  the new one.
- **Three harness criteria were rewritten**, and the pattern in each is the same and worth
  naming: a check that counted `data-placeholder` went permanently zero when the visuals
  became real files, was rewritten to count decoded images, and went to zero again on a
  project whose assets are all pending. Each version was right for the route in front of it.
  They now count both, because both are ways a slot can be filled. One of them,
  `a cluster with no cleared project is a disabled chip`, had lost its case entirely: every
  cluster now holds a project, so nothing was disabled and the assertion could not fail. It is
  now the invariant rather than one instance of it, with both sides read off the page.
- **BLOCKERS item 5 is now partly closed.** One project of three is cleared and named. The
  other two are unchanged.
- **The `Pending clearance` tag is gone from one card.** The project is cleared; only its
  pictures are pending, and the page says nothing about missing pictures.
