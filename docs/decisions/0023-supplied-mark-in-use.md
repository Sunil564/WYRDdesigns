# 0023. The supplied mark goes into use, on light grounds only

Status: accepted
Date: 2026-08-21
Phase: 6

Amends ADR 0003, which shelved this mark. It does not supersede it: 0003's reasoning was correct for the site as it then was.

## Context

`Codebase2/Company logo/Logo_Design_Black final.png` was ingested in Phase 0 and has sat unused in `public/brand/` ever since. ADR 0003 shelved it for one reason: the site was dark, the artwork is black on transparent, and black on `--color-bg` is invisible. The header and footer were set in Satoshi instead, tagged `data-placeholder`.

**Phase 4b turned the canvas white and nobody went back for the mark.** That is the whole of it. The blocker that justified the fallback stopped existing four phases ago, and the fallback outlived it because nothing was watching for the condition to clear. Worth naming as a pattern: a workaround recorded against a condition needs the condition recorded with it, or the workaround becomes permanent by default.

The file in `public/brand/wyrd-logo-supplied.png` is byte identical to the source, sha1 `b4e9e7db7fde`, so nothing had to be re-ingested.

## What the artwork is

2101 by 989 after trimming, aspect 2.124. Lowercase `wyrd` with a gradient on the Y, `Designs` set smaller below and right. Measured ink distribution over opaque samples: 84.33 percent near black under luminance 40, 15.65 percent between 40 and 96, which is the Y's gradient, and 0.02 percent above 215, which is anti aliasing rather than a design element.

It is used unmodified. Not redrawn, not recoloured, not restretched, per section 0.3.

## Where it now renders

| Surface | Ground | Renders |
|---|---|---|
| Header | `--color-bg-raised` | The mark, 32px tall on mobile and 40px from `sm` up |
| Favicon set, 16 / 32 / 180 / 512 | white | The mark, contained, generated since Phase 0 |
| OG mark, 1200 by 400 | white | The mark, contained, generated since Phase 0 |
| Footer closing treatment | `--color-bg-inverse` | Unchanged. Still type. See below |

Exported at 3x the largest render by `scripts/process-assets.py`: `wyrd-header.webp` and `.png` at 255 by 120, which is 3x of 40. WebP with a PNG fallback through `<picture>`, intrinsic width and height on the `img` so the box is reserved before the file loads and the header cannot shift.

**40px was chosen by looking, not calculated.** At 32px the `Designs` inside the lockup is cramped; at 40px it reads. The mark is 85px wide there, inside an 81px header bar with room either side. A rendering of 32, 40, 48 and 56px is at `build-logs/screens/logo-header-sizes.png`.

## It does not read on the dark grounds, and it is not being inverted

Measured, ink against ground, WCAG contrast:

| Ground | Darkest ink | The Y's gradient |
|---|---|---|
| `--color-bg` white | 21.00:1 | |
| `--color-bg-raised` `#F7F6F4` | 19.44:1 | |
| `--color-bg-inverse` `#0A0A0C` | **1.06:1** | up to about 1.4:1 |
| Footer hairline `#24242A` | **1.36:1** | |

Rendered and looked at, at `build-logs/screens/logo-on-both-grounds.png`: on the inverse ground the mark is a ghost. The gradient Y is faintly visible because it is not quite black, and `Designs` disappears entirely. That is not a contrast problem to tune. Section 0.3 forbids recolouring a supplied mark, so the options were type or nothing, and the operator is told rather than shown a silently inverted logo.

The footer's closing treatment is additionally impossible for a second, independent reason. It is `clamp(6rem, 26vw, 26rem)` type in the inverse hairline colour, so at a 2560px viewport it renders around 665px tall and full bleed wide. Three times that from a 2101px source is not available, and it would be black on near black even if it were. The `wyrd-footer` export stays in the pipeline, unused, rather than being deleted, because the day a dark variant arrives it is the asset that surface needs.

`Wordmark`'s `inverse` branch keeps the typographic fallback and keeps its `data-placeholder` tag. The `light` branch no longer carries one, because it is no longer standing in for anything.

## Consequences

- The header is the real mark on every route. The `data-placeholder` count in `main` is unchanged, since the header was never in `main`.
- The favicon set is compromised at 16 and 32px and the compromise is structural: a 2.124 aspect lockup letterboxed into a square leaves the mark small. Legible as a shape at 32, rough at 16. A square single glyph mark would fix it and none was supplied.
- A vector should replace this raster. Every size here is a resample of a 2101px original, which is adequate for a 40px header at 3x and will not be adequate for anything larger.
- ADR 0003's `data-placeholder` tagging and its refusal to recolour both stand. Only its conclusion about where the mark can be used has changed, and only because the canvas did.
