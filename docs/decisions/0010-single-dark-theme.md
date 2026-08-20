# 0010. Single dark theme, no light mode

Status: superseded by ADR 0019
Date: 2026-08-19
Phase: 0b

> Superseded on 2026-08-20 by Phase 4b, which converts the site to a light canvas
> with dark blocks used as contrast. The reasoning below is kept because it records
> why the dark canvas was chosen and what it cost to change. The palette it describes
> is preserved in docs/design-system.md section 1.4. One thing it got right survives:
> there is still exactly one theme, no toggle, and every token has one value. Dark is
> now a context applied to specific blocks rather than the whole canvas.

## Context

The brief specifies a dark canvas, says light mode is not built, and asks for the decision to be recorded. The studio does film and events. Dark reads correctly for that work and it makes placeholder imagery look intentional rather than unfinished, which matters on a site with a short project list.

The superseded `design-system.md` in `docs/supplied-superseded/` specifies a light paper palette with a sage accent. It belongs to the earlier trial build and does not govern, per ADR 0001.

## Decision

One theme, dark. `color-scheme: dark` on `:root`, `--color-bg` on `body`, no `prefers-color-scheme` branch, no toggle, no light token set. Every token has exactly one value.

## Consequences

- Half the palette work, half the contrast verification, and no class of bug where a component was only ever looked at in one mode.
- Contrast is verified once against real token pairs, recorded in `docs/design-system.md` section 1.
- A light mode later is not a toggle. It is a second palette plus a second pass on every placeholder visual, the particle field colours, and the grain blend mode. It would need its own ADR and its own phase.
- Visitors whose system prefers light get dark anyway. On a studio portfolio that is an authored choice, not a bug.
