# 0025. The white mark takes the dark grounds, and the accent becomes the mark's blue

Status: accepted
Date: 2026-08-21
Phase: 6

Closes the fallback ADR 0023 left standing, and replaces the accent colour chosen in ADR 0019.

## Context

Two files were supplied on 2026-08-21: `Logo_Design_White.png`, and a colour reference showing
the same lockup in navy with a blue gradient on the Y.

They answer two separate things that had been open for different reasons.

## The white mark

ADR 0023 put the supplied black mark in the header and left the footer set in Satoshi, because
black artwork on `--color-bg-inverse` measures 1.06:1 and section 0.3 forbids recolouring a
supplied mark. The options were type or nothing, and the operator was told rather than shown a
silently inverted logo. That was the correct call and it was always waiting on this file.

`Logo_Design_White.png` is the same artwork, not a recolour of ours. Verified: it trims to
**2101 by 989**, identical to the black variant, at the same 2.124 aspect. The Y carries a grey
gradient where the black one carries a dark gradient.

Measured over the exported 255 by 120 render, ink against ground:

| | median ink | darkest 5 percent, which is the Y | on `--bg-inverse` |
|---|---|---|---|
| White mark | `#FFFFFF` | `#C3C3C3` | **19.78:1**, and 11.22:1 at the Y |
| Black mark, for contrast | | | 1.06:1 |

It renders at the same 40px as the header mark, from the same `Wordmark` component, which now
picks a file rather than picking between artwork and type. The `data-placeholder` tag is gone
because it is no longer standing in for anything.

**This also settles a composition problem reported the previous session.** The footer's mark was
a `<p>` set in Satoshi Black, uppercase, left aligned, a few hundred pixels below the real
lockup in the sticky header. Both were visible in one frame at the bottom of every page and
read as two competing logos rather than one identity. Same mark at the same size on both
grounds removes the question. The oversized `wordmark-close` watermark at the very bottom stays
type: it is `aria-hidden`, decorative, and at 26vw a 2560px viewport would need roughly 7700px
of raster for a 3x render from a 2101px source.

## The blue accent

`docs/brand.md` contains no colour section at all. The orange was never a supplied brand fact;
it came from the build brief. So taking the accent from the supplied mark is not a conflict
with a supplied document, it is the first time the accent has had a brand source.

The values are sampled from the reference, not eyeballed. The Y carries a gradient from
`#2B4D8A` at its foot to `#336BC8` at its head, hue 217, and the body of the lockup is
`#1E2A44`.

### The constraint that picked the values

`--color-accent-strong` is the focus ring on **every** ground as well as the fill behind white
text, so it has to clear 4.5:1 on white and on `--bg-raised` while still clearing the 3:1
non-text floor on `--bg-inverse`. That is a narrow luminance band, and it is why the darkest
blues in the artwork could not take the role: `#2B4D8A` is 8.30:1 on white and only 2.38:1 on
the dark ground, which fails the ring.

`#336BC8`, the Y's own head colour, lands almost exactly where the orange was:

| token | was | now | white | `--bg-raised` | `--bg-inverse` |
|---|---|---|---|---|---|
| `--color-accent` | `#FF521F` | `#4C86DB` | 3.24 to **3.66** | 3.00 to **3.39** | 6.10 to **5.41** |
| `--color-accent-strong` | `#C93C0E` | `#336BC8` | 5.08 to **5.15** | 4.70 to **4.77** | 3.90 to **3.84** |
| `--color-accent-on-inverse` | `#FF521F` | `#4C86DB` | | | 6.10 to **5.41** |

The blue was chosen to land on those numbers rather than merely to pass them, so every contrast
relationship the design was tuned against survives the swap. Two of them improve: `--accent` on
`--bg-raised` was at exactly 3.00, the floor with no margin, and is now 3.39.

`--color-accent-on-inverse` carries near-black text in `accent-fill-inverse`, which needs 4.5:1
of `#0A0A0C` on the fill. `#4C86DB` measures 5.41:1. That is the one number that gets worse,
from 6.10, and it clears AA at any size.

Everything ADR 0019 section 5 decided about *where* the accent may be used is unchanged: fills
and text on `--accent-strong`, graphics on `--accent`, the focus ring on `--accent-strong`.

### It propagates without any code change

Every runtime reader, the hero field shader, the 2D particle field and the Thread overlay, pulls
its accent from the CSS custom property at mount. Only the defensive literal fallbacks needed
editing. The blue reached the WebGL points and the Thread head by changing three lines of CSS.

## One harness criterion was wrong before this change and would have failed on a correct build

`check-home`'s S3 hover criterion held `rgb(255, 82, 31)` as a literal. That is the stale copied
constant fault the Verification rules already name, and it was live: the swap would have failed
a criterion on a correct build. It now injects a probe element carrying
`var(--color-accent-on-inverse)`, reads the computed colour off it, and compares the two inside
the same computed-style pass. It asserts the index matches the token, which is what the
criterion always meant.

## Consequences

- BLOCKERS 2 loses its dark variant clause. Still open: no vector, and no square single-glyph
  mark for the favicon.
- The favicon set and the OG mark keep the black artwork on the light canvas. They are drawn on
  white and unaffected.
- `wyrd-footer.png` and `.webp`, the 64px black export kept unused since Phase 0, are now dead
  twice over and stay only because the export costs nothing.
- Accessibility is 100 on all seven routes after the swap, and 122 harness checks pass.
- A vector still needs to replace both rasters. Every size is a resample of a 2101px original.
