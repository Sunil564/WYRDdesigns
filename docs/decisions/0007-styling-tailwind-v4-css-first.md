# 0007. Styling: Tailwind v4, CSS first, no JavaScript config

Status: accepted
Date: 2026-08-19
Phase: 0b

## Context

The brief specifies Tailwind CSS v4 with a CSS first `@theme` config, and requires that no hardcoded hex value or px font size exists anywhere outside `globals.css`. The design system also has to stay traceable to `docs/brand.md` and the brief, token by token.

## Options considered

1. **`tailwind.config.ts`, the v3 pattern.** Two sources of truth per token: the JavaScript object and the CSS variable it compiles to. Drift between them is invisible until something renders wrong.
2. **Plain CSS with custom properties, no Tailwind.** Full control, gives up the utility layer that keeps section markup readable and keeps one off values out of the codebase.
3. **Tailwind v4 with `@theme` in `app/globals.css`.** Chosen.

## Decision

All tokens are declared in `@theme` blocks in `app/globals.css`, the only file where a hex value or a px font size may appear.

- `@theme` for colour, type scale, radii, containers, easings, durations, and stagger constants.
- `@theme inline` for the two font families, because their values reference `--font-satoshi` and `--font-instrument-serif`, which `next/font/local` defines on the `html` element. Without `inline`, the generated utility points at a theme variable that resolves one level too late.
- Type scale entries carry their `--text-*--line-height` and `--text-*--letter-spacing` pairs, so `text-mega` sets size, leading, and tracking in one utility, and a headline cannot be given the wrong leading by hand.
- Spacing uses the v4 default 0.25rem base. Every value in the brief's 8px scale is already a first class utility, so no custom scale is declared. Declaring one would create a second way to write the same number.
- `@utility` for the eight repeated patterns: `measure`, `label`, `editorial`, `section-y`, `hairline-t`, `hairline-b`, `grain`, `logo-mask`. Anything used twice becomes a component instead.

No PostCSS plugins beyond `@tailwindcss/postcss`. No CSS in JS. No CSS modules.

## Consequences

- One token, one definition, one file. The origin map in `docs/design-system.md` cannot silently go stale.
- Grepping for `#` in `app/`, `components/`, and `content/` is a real audit, which is how the Phase 1 criterion is verified.
- Tailwind v4 syntax differs from v3 in ways that matter here: `@import 'tailwindcss'` instead of three directives, `@utility` instead of `@layer utilities`, `@theme` instead of `extend`. Verified against current documentation rather than memory.
