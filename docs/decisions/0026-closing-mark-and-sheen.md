# 0026. The closing mark is the artwork, with a highlight that sweeps across it

Status: accepted
Date: 2026-08-21
Phase: 6

Replaces the typographic closing treatment that ADR 0023 and ADR 0025 both left standing.

## Context

The footer ended with `WYRD` set in Satoshi Black at `clamp(6rem, 26vw, 26rem)` in the inverse
hairline colour, clipped by the page edge. Two previous ADRs kept it as type for the same
reason: black artwork could not sit on a dark ground, and even after the white variant arrived
the closing treatment was judged too large for a 2101px source.

That second reason was checked rather than repeated, and it was wrong. **ADR 0023 stated the
treatment renders "around 665px tall at 2560px". It does not.** `clamp(6rem, 26vw, 26rem)` caps
at 26rem, so 416px is the largest font size it ever reaches; the 26vw term stops mattering above
1600px. The figure ignored the clamp ceiling, and a size that was never rendered was used to
rule the artwork out.

## The mark

The white artwork, unmodified, at `min(88vw, 72rem)`.

**It is not recoloured to reach the hairline value.** It is the file at `opacity: 0.09`, which
over `--color-bg-inverse` resolves to `#232325` against the `#24242A` the type used. Section 0.3
forbids recolouring a supplied mark and nothing here does: measured resting value on the page is
34 of 255 against a ground of 10.

At 1440px it renders 1152 by 542, which is **1.82x** downscale from the 2101px source, and
sharper at every narrower viewport. It is exported at the source's own resolution rather than
cut to 3x of a render size, because 2101px is simply all there is.

### It is shown whole, not clipped

The type bled off the bottom edge, and that clip is gone. It worked on a single line of caps and
does not work on a lockup: `Designs` sits inside the mark, and any bleed deep enough to read as
deliberate takes half a word with it. There is no clean row to cut at either. Measured, the
artwork's ink is one continuous band from row 0 to row 988 of 989, because `w` descends past the
line `Designs` sits on.

## The sheen

A narrow bright band on a wider, dimmer glow, sweeping left to right across the mark and then
holding off screen for the rest of a 9 second cycle, so it reads as an occasional catch of light
rather than a loop.

Measured on the built page: **peak 146 of 255 against a resting mark of 34, on a ground of 10.**

Three things about how it is built are load bearing:

**The mask is on the parent, not on the sheen.** A mask on a transformed element travels with
the element, so the first version animated `mask-position` to compensate. It measured a peak of
39 against a 34 baseline, which is to say it painted almost nothing while looking plausible in
the CSS. The mask now sits on the container, which never moves, and the band rides a
`translate3d` that stays on the compositor.

**Both ends of the gradient are zero alpha white, not `transparent`.** `transparent` is
premultiplied black, so a gradient running to it darkens as it fades. That left a visible hard
diagonal step where the band began, clearly wrong once rendered and looked at.

**The mask is the same file the img already loaded.** A CSS mask reads the alpha channel, which
the artwork carries, so there is no second request and no separate mask asset. A 1400px
alpha-only export was built and then deleted for this reason, saving 34kb.

## What it costs

- One 32kb lossless WebP, `loading="lazy"`, at the very bottom of a long page. Nothing above the
  fold waits on it.
- One compositor transform animation, which runs **only while the footer is on screen**.
  `useInView` with `once: false` gates it. An animation at the bottom of this page would
  otherwise tick for an entire visit without ever being seen, and `once: false` exists on that
  hook for exactly this.
- Under `prefers-reduced-motion` the sheen is `display: none`. Not dimmed, not frozen mid sweep:
  the highlight is the motion, so without motion there is the mark and nothing else.

## Consequences

- `wordmark-close` is no longer a placeholder of any kind. `docs/placeholders.md` loses its last
  wordmark row.
- The footer now renders the mark twice, at 40px in the column and at 1152px as the closer. They
  are the same artwork, which is the point.
- `wyrd-footer.png` and `.webp`, the 64px black export unused since Phase 0, are finally deleted.
  Nothing on a dark ground uses black artwork any more.
- BLOCKERS 2's vector clause gains a use it did not have: this is the largest render on the site
  at 1.82x, and it is the surface a vector would most improve.
- Accessibility stays 100 on all seven routes. The whole element is `aria-hidden`: the name is
  in the footer copy above it and in the header.
