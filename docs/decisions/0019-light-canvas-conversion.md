# 0019. Light canvas conversion

Status: accepted
Date: 2026-08-20
Phase: 4b

Supersedes ADR 0010, single dark theme.

## Context

Phase 4b, a standalone brief that amends sections 4, 5, 6, and 7b of the build plan: the site changes from a dark canvas to a light one, with dark blocks used deliberately as contrast rather than as the default surface.

The brief is explicit that this is not a find and replace, and it is right. Three systems were built assuming a dark ground and failed visually rather than merely looking different: the WebGL field uses additive blending, which produces nothing on white; the grain was light noise over black, which reads as dirt over white; and contrast direction inverts, so `--signal` at 6.17:1 on the dark canvas becomes 3.24:1 on white and fails AA for body text.

## Why the theme changed

Not this build's call. The operator asked for it in a written brief, and the brief carries the reasoning: a light canvas with dark blocks as punctuation. ADR 0010 argued for a single dark theme on the grounds that the studio does film and events and that dark makes placeholder imagery look intentional. That argument is now overridden, and the placeholder generator has been retuned for the light ground rather than left to look unfinished on it. ADR 0010 is superseded, not deleted, and the palette it recorded is preserved in `docs/design-system.md` section 1.4.

One thing that did not change: there is still exactly one theme. Dark is a **context applied to specific blocks**, not a mode a visitor chooses. There is no toggle, no `prefers-color-scheme` branch, and every token still has one value.

## The five decisions

### 1. Role based naming

Every colour token is named for its job. `--color-void` became `--color-bg`, `--color-paper` became `--color-fg`, and so on, with five inverse tokens added for the dark blocks. Done as its own commit with no value changes, so the rename was provably behaviour neutral: the site still looked dark and `check-home` still passed 26 of 26 afterwards.

The payoff is that no component knows which context it is in. A component that can render in both takes an explicit `variant` prop, `light` or `inverse`, and reads the matching tokens. Nothing inspects a parent, nothing inherits a context through CSS scoping. That was a deliberate choice over the tempting alternative, which was to re-point the same role tokens inside a `.inverse` scope: it would have been less code and it would have made a component's colours depend on where it happened to be mounted.

Tokens keep the `--color-` prefix, because that is the namespace Tailwind v4 generates utilities from. The role name is everything after it.

### 2. The WebGL field: normal blending, and three things the tuning pass caught

`AdditiveBlending` became `NormalBlending` with per point alpha. Additive on white produces nothing: white is already at maximum on every channel. The in shader halo that stood in for the bloom pass is gone as well, because a wide low amplitude lobe on a light ground is a grey wash around every accent point. There is still no postprocessing pass at all, so the 92kb ADR 0017 measured stays unspent.

The brief says not to skip the tuning pass. It was right to insist, because a numeric port would have shipped three faults:

1. **The distribution was wrong, and had been since Phase 3.** Points were scattered over a fixed 16 by 10 world box while the camera could see about 6.6 by 4.1 of it, so roughly five points in six were off screen. That was invisible on the dark canvas because the field was a faint glow either way. Spread now matches the viewport, which is why the count could come **down** rather than up.
2. **Point size needed more than the suggested 30 percent.** Measured by ink coverage on a text free patch of canvas: 0.90 percent at the ported size, 1.71 percent at 6.0, 2.75 percent at 8.0, which read as blobs. 6.0 it is.
3. **Accent points needed to sit back.** At full field alpha, orange on white reads as scattered confetti rather than flecks in the weave. They run at 78 percent of field alpha.

Count is 12,000, inside the halved band the brief specifies. The 2D fallback was halved to 45 as instructed, measured a third of the shader field's ink, and was tuned back up to 72 on desktop.

### 3. The Thread across inverse blocks: two paths, one masked

The brief suggests trying `mix-blend-mode` first, on the grounds of fewer moving parts. Tried, and rejected with arithmetic.

Difference blending makes the result `|backdrop - source|`, so one stroke value has to serve both grounds. A subtle hairline on white needs the result near 226, which means a source near 29. On the `#0A0A0C` ground that same source yields 19, which is nine levels off the background and invisible. Pushing the source up to 46 to get a visible line on dark makes the line `#D1D1D1` on white, heavier than the token. And the blend inverts the accent head, which comes out cyan on white.

So: every path is drawn twice. The inverse copy is clipped to the dark bands. The light copy carries a **mask** that cuts the bands out of it, because a clipPath is additive and this needs a subtraction. That second half matters: without it the light hairline stays visible inside the dark block at 17:1 and the inverse copy under it is pointless. That was a real bug, caught by looking at the block rather than by reading the code.

Bands are measured from the same DOM the rest of the thread geometry comes from, so nothing is hardcoded.

This also forced a layering decision. An inverse `Section` paints its dark ground as a **sibling layer at `z-1`**, not as its own background, so the order becomes ground, Thread at `z-2`, content at `z-10`, and the Thread crosses the block instead of hiding behind it. The ground is real markup rather than something JavaScript paints, so a dark block is dark before hydration and with scripting off. The consequence is that an inverse section sits one level deeper in the DOM, inside a `relative` wrapper with no z-index of its own.

Measured on the dark ground: the hairline reads at 36 against 11, which is the 1.28:1 the palette specifies and matches the 1.33:1 it has on white.

### 4. Grain: two textures, not one blend mode trick

Dark speckles multiplied over the light canvas at 3 percent. Light speckles screened inside inverse blocks at 3 percent, scoped to the block so they cannot leak onto the canvas. Both seeded, both deterministic, both 128px tiles.

The single neutral grey texture with `soft-light`, which is what the dark build used, was tried first and dropped: on white, soft-light lifts the whole canvas toward grey at any opacity that makes the grain visible. Two textures with one blend mode each does one job in one direction, and then the opacity number means what it says.

Measured on a flat patch of canvas rather than eyeballed in a compressed screenshot: mean 252.0 of 255, standard deviation 1.49 levels, range 249 to 255.

### 5. The accent is restricted, and the filled button moved

Phase 4b 3.3 says filled accent buttons use `--accent` with `#FFFFFF` text, and asks for that pair to be verified. Verified: 3.24:1. Legal for large text, and every filled button on this site has a 13px uppercase label, which is not large text. So `accent-surface` fills with `--accent-strong`, where white is 5.08:1.

Every accent usage in the codebase was audited against the rule in the same commit as the palette swap, not deferred: buttons, chips, field errors and asterisks, process indexes, the cursor label, and link hovers all moved to `--accent-strong`. The accent stays where it is a graphic: eyebrow rules, the process line, the Thread head, the particle field. The focus ring moved to `--accent-strong` too, because `--accent` measures exactly 3.00:1 against a `--bg-raised` form field.

## Consequences

- One theme, two contexts, thirteen colour tokens. Every pair enumerated in `docs/design-system.md` section 1.3.
- Dark blocks appear in exactly the places Phase 4b section 4 names: the four S3 cluster cards, S8, S9, and case study hero frames when Phase 5 builds that route. The hero, the positioning statement, and the work grid stay light, because a dark hero on a light site is the compromise that satisfies nobody.
- SITEO no longer monochromes. Its third block reduces to 21 percent ink on white, so the letter inside it stops being readable, and per section 8 it ships in its original colours and is listed in `docs/BLOCKERS.md`. It is the only colour mark in the row, which is the honest consequence of the rule rather than a design choice.
- The ink mask pipeline gained a 0.55 alpha gamma. Masks tuned for a dark ground wash out on white, because a mid tone at 30 percent alpha is `#C5C5C8`.
- Placeholder visuals take an explicit context and generate from that context's tokens. The light generation took two passes: the first port put ink blobs at 50 to 85 percent over a light panel and read as the out of focus photograph a placeholder must never look like.
- Performance improved slightly, as the brief predicted: removing the halo lobe and dropping from 28,000 points to 12,000 measures 48.3fps against 50.9fps headless with no GPU, and JS over the wire on `/` is unchanged at 452.9kb Full and 222.7kb Reduced, since no dependency changed.
- What is not verifiable from here: how the grain and the hairlines look on a physical display at full brightness. Both are measured in pixel values and both are inside the bands the brief specifies, and that is not the same thing as having looked at them on a screen.
