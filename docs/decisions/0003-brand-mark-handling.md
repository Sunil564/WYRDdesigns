# 0003. Brand mark handling: raster source, dark canvas, interim wordmark

Status: accepted
Date: 2026-08-19
Phase: 0

## Context

Section 0.3 of the brief requires the logo processed to inline SVG with `fill="currentColor"` if a vector exists, or exported to WebP at 3x plus a PNG fallback if only raster exists, with an ADR asking for a vector. It also requires a header mark, a footer wordmark, a favicon set at 16, 32, 180, and 512, and an OG mark. It forbids redrawing, recolouring, restretching, or reinterpreting the mark, and says that if the supplied logo does not work against the dark canvas, say so rather than modify it.

What was supplied: `Company logo/Logo_Design_Black final.png`, 2131 x 1036 PNG with alpha, ink bounds 2101 x 989. Lowercase `wyrd` with an overlapping lighter grey `Y`, `Designs` below and right. Solid black on transparent, with a grey to black gradient on the `Y`.

Two problems.

1. No vector. The mark is raster only, so it cannot become inline SVG with `currentColor`.
2. The mark is black. The canvas is `--color-void`, `#08080A`. Contrast between black artwork and a near black canvas is effectively zero. The mark is invisible where the brief needs it most.

Auto tracing the raster to SVG was rejected: a trace of a gradient filled letterform with a soft antialiased edge is a redrawing, and it would silently change the shape of a brand mark.

## Options considered

1. **Invert or recolour the mark to paper.** Visually the obvious fix. Forbidden in as many words by section 0.3, and it is not the build's call to decide what colour a client's mark is.
2. **Render the black mark on a paper coloured plate in the header.** Honest, but it puts a light rectangle in the top left of a dark site on every route, which reads as a badly placed image, not as a logo.
3. **Ship the raster variants as supplied, and set the header and footer wordmark in Satoshi as an interim treatment.** Section 0.3 already sanctions the Satoshi wordmark path for the case where no usable logo file exists. This is that case for the dark canvas specifically. Chosen.

## Decision

- The source file is committed verbatim at `public/brand/wyrd-logo-supplied.png`.
- `scripts/process-assets.py` exports the required raster variants from the unmodified source, at 3x their render height: `wyrd-header` at 153 x 72 for a 24px render, `wyrd-footer` at 408 x 192 for a 64px render, WebP plus PNG fallback for each. Nothing is recoloured. They are committed and unused on the dark canvas, ready for the day a light or vector version arrives.
- The header mark and the footer wordmark are set in Satoshi, letterspaced, as `WYRD` in `--color-paper` with `Designs` in `--color-muted`, matching the lockup order of the supplied mark. Tagged `data-placeholder` and listed in `docs/placeholders.md`.
- The icon set at 16, 32, 180, and 512 places the unmodified mark, contained with 12 percent padding, on `--color-paper`. Placing an unmodified mark on the light ground it was drawn for is not a modification, and a browser tab is not the dark canvas.
- The OG mark is the same treatment at 1200 x 400.

## Consequences

- The site never shows a black on black logo, and the supplied artwork is never altered.
- The header wordmark is typographic, not the real mark. It is a placeholder with a real deadline, not a permanent choice.
- **Needed from the operator:** a vector of the mark, SVG or AI or EPS or PDF, and a light or single colour variant intended for dark backgrounds. With those, the interim wordmark is replaced and the mark inlines as SVG with `currentColor` in one commit.
- The favicon at 16px shows a full wordmark contained in a 16px square, which is legible as a dark shape rather than as letters. A square single glyph mark would fix it. That is a design request for the operator, not something this build invents.
