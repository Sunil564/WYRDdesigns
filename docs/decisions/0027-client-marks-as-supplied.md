# 0027. Client marks render as supplied, in their own colours

Status: accepted
Date: 2026-08-22

Supersedes ADR 0004, which specified the ink mask treatment.

## Context

The S5 row rendered five of six client marks as alpha only ink masks tinted with
`currentColor`, moving from `--color-fg-muted` to `--color-fg` on hover. SITEO rendered in
full colour, because five colour blocks with the letters knocked out in white do not survive
being reduced to one ink: on the light canvas its third block mapped to a mean alpha of 22 of
255, so the `T` became a white letter on a near white block.

That was a defensible reading of Phase 4b section 8, and it produced two problems.

**SITEO looked like a mistake.** One mark in colour among five in grey does not read as "this
one could not be monochromed", it reads as an oversight. The row was drawing attention to its
own exception.

**It created a blocker that could not close.** `docs/BLOCKERS.md` item 8 asked the operator to
obtain a single colour version of SITEO's mark from SITEO. That is a request to another
company for a new asset, in order to satisfy a treatment we had chosen. The blocker existed
because of the decision, not because of the client.

## Decision

Every mark renders as supplied, in its own colours, at one shared optical height. No masks, no
tint, no hover colour transition.

The second reason is the better one and it is worth stating plainly: **these are other
companies' marks.** Rendering them in our house grey, and animating them to a different grey
on hover, is restyling someone else's property to suit our page. Optical height normalisation
is a layout decision about our row. Recolouring is a decision about their brand.

## What was removed

The mask pipeline is gone rather than left dormant, because a dormant pipeline is a second way
to render the same thing that nothing exercises.

- `scripts/process-assets.py` loses the `mono` column and the mask branch. Every mark is now
  trimmed on ink, cropped, scaled to its optical height and flattened onto the canvas colour.
  It no longer writes the PNG mask pair or the `-original` variant.
- `to_ink_mask` survives. It is no longer used to make a mask, only to find the true bounding
  box of a mark whose file has a white background rather than transparency, which several of
  these do. That is the one job it was always doing reliably.
- `content/clients.ts` loses `mono` from the type and from every entry.
- `ClientLogo` has one rendering instead of two.
- The `logo-mask` utility is deleted from `globals.css`.
- The hover colour transition is removed from the row. It drove `currentColor` through the
  masks and had nothing left to tint.

## The harness asserted the treatment, so it had to change

The criterion read `five as muted masks and SITEO as original artwork`, and checked for
exactly five elements with `role="img"` computing to `rgb(94, 94, 102)`. It was a precise
description of a decision rather than of a requirement, so reversing the decision failed it.

It now asserts six `img` elements, zero masks, every one actually loaded, and neither
`mask-image` nor `filter` set on any of them.

A second criterion was added, because the DOM cannot answer the question that matters. Each
mark is drawn to a canvas and its pixels counted for saturation, so **"renders in its own
colours" is measured rather than inferred from the absence of a mask.** A tint applied by some
route the first criterion does not know about would still fail it.

## Consequences

- `docs/BLOCKERS.md` item 8 closes. There is no odd one out, so there is nothing to ask SITEO
  for.
- The row is six marks of genuinely different colour, weight and construction. Whether that
  reads as a set is a composition judgement, reported to the operator with screenshots at
  1440 and 412 rather than decided here.
- ADR 0004's reasoning about optical rather than bounding box normalisation still stands and
  is still implemented. Only the colour treatment is reversed.
