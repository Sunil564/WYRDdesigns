# 0004. Client logos: ink mask monochrome, static row below eight

Status: accepted
Date: 2026-08-19
Phase: 0

## Context

S5 of the brief requires client logos rendered monochrome at `--color-muted`, moving to `--color-paper` on hover, normalised to a consistent optical height rather than a consistent bounding box, output to `public/logos/` with a manifest at `content/clients.ts`. It also says that below eight logos the marquee is dropped for a single centred static row.

Six logos were supplied, all raster, none vector. Their internals matter:

- Bhavani, Maharaja, Seervi, Vahini: dark artwork on transparent or white.
- G Monisa: a black bar with `MONISA` knocked out in white.
- SITEO: five saturated colour blocks with the letters knocked out in white.

A greyscale CSS filter fails here. Bhavani's maroon and Seervi's navy fall to near black and disappear on `#08080A`. A flat alpha silhouette also fails: it fills SITEO's knocked out letters and turns the mark into five solid blocks.

## Options considered

1. **CSS `filter: grayscale(1) brightness(2)`.** One line, no asset work, and it destroys the two dark logos and washes the colour blocks unevenly.
2. **Two files per logo, one muted and one paper.** Doubles the asset count and the hover swap flashes on first paint.
3. **A per pixel ink mask, tinted with `currentColor` at render time.** Chosen.

## Decision

`scripts/process-assets.py` converts each source logo to a mask whose alpha is `(1 - luminance) * sourceAlpha`, with near white pixels below an 8 percent ink threshold dropped to fully transparent. Dark artwork becomes ink. White knockouts stay holes. Mid tone colour blocks become mid opacity ink, so SITEO keeps its letterforms.

Each mask is trimmed to its ink bounds, scaled by a per logo optical factor, and centred on a 96px tall canvas, 3x the 32px desktop render height. The factor is the optical normalisation: a wide wordmark sits at 1.0, a square emblem sits lower, so nothing dominates the row by virtue of being square. Factors live in one list in the script.

Rendering uses `mask-image` on an element whose `background-color` is `currentColor`, so the row inherits `--color-muted` and moves to `--color-paper` on hover with one CSS transition and one file per logo. WebP is the served format, PNG is committed alongside as a fallback.

Six logos is fewer than eight, so S5 renders a single centred static row. No marquee.

`content/clients.ts` carries `{ name, file, alt, width, height }` per logo, generated from `public/logos/manifest.json`. Names are the real company names as they appear in the artwork. Nothing is renamed.

## Consequences

- One file per logo, correct monochrome on a dark canvas, hover handled in CSS with no JavaScript.
- Masks are lossless WebP and small, the largest is SITEO at 284 x 96.
- The row is static. When the operator supplies a seventh and eighth logo, the marquee component is built and the fallback branch flips. The component API is written to accept both counts now.
- Optical factors are a judgement, tuned by eye against the rendered row. They are data, not logic, and safe for the operator to adjust.
- `Vaihini.png` renders as `Vahini Pipes`, taken from the artwork rather than the filename. Flagged in `docs/source-inventory.md` under UNIDENTIFIED for operator confirmation, because a client name is a fact.
- If the operator has not in fact cleared these logos for display, deleting the entries in `content/clients.ts` removes S5. See ADR 0002 section 6.
