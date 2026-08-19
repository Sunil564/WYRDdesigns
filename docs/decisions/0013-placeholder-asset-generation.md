# 0013. Placeholder asset generation

Status: accepted
Date: 2026-08-20
Phase: 1

## Context

The studio has a short list of cleared projects and no supplied project imagery. The site is design heavy on purpose, so a section that shows nothing where a visual belongs breaks the composition, and a section that shows a fake visual breaks something worse.

The brief bans stock photography, Unsplash, and Picsum, and asks for a seeded generator producing deterministic abstract visuals.

## Options considered

1. **Stock photography.** Banned by the brief and correctly so. Nothing makes a studio site read as a template faster.
2. **Unsplash or Picsum by URL.** Also banned. Both are a third party request in the render path, both change under you, and neither is licensed for a client site in the way it looks like it is.
3. **A flat surface block where a visual belongs.** Honest, and it leaves a dark hole in an asymmetric card layout that the composition was designed around.
4. **A seeded deterministic generator producing abstract visuals in the brand palette.** Chosen.

## Decision

`components/ui/Placeholder.tsx`, a **server component** that renders inline SVG. No client JavaScript, and because every route is static the SVG is baked into the HTML at build time, which is the brief's "rendered at build time where possible".

- **Deterministic.** `seededRandom` in `lib/utils.ts` is mulberry32 with an FNV-1a string hash. Same seed, same visual, on every reload, every machine, and every deploy. Layouts do not shuffle between builds and screenshots stay comparable.
- **Palette only.** Colours are the `--color-*` variables, referenced as `var()` inside the SVG, so a token change propagates and no hex value appears outside `globals.css`.
- **Composed, not blurred.** Three to four soft radial blobs, then a hard structure pass: a grid pattern, two or three crisp horizontal rules with at most one in signal orange, and an inset hairline frame. Gradients alone read as an out of focus photograph, which is the exact impression to avoid. The hard edges are what make it read as a deliberate visual.
- **Three variants.** `gradient` for soft fields, `mesh` for a tighter grid, `lines` for a diagonal ruled field. `aspect` is a prop, so a tall card and a wide hero use the same component.
- **Accent restraint.** The accent appears in at most one blob per visual, on a seeded coin flip, so a row of three cards never reads as three orange smudges.
- **Carries the canvas grain**, so a placeholder shares the page texture rather than sitting on top of it.

Every instance takes a required `note` prop describing what real asset belongs there. It renders as `data-placeholder="<note>"`, so a grep over the built HTML finds all of them, and each one is listed in `docs/placeholders.md`.

For video, per the brief: a placeholder still with a play affordance and a slow scale drift. No autoplaying video, no fake footage.

## Consequences

- Zero client cost, zero third party requests, zero licensing question, and a stable visual identity for unfinished sections.
- The visuals are abstract and will never be mistaken for a photograph of real work, which is the honest position given the fact base.
- `note` being required means a placeholder cannot be added without saying what it is standing in for.
- When real imagery arrives, the swap is one component per slot and `docs/placeholders.md` is the work list.
- Determinism is load bearing for verification: a screenshot diff between two builds only shows real changes.
