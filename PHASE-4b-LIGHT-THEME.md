# Phase 4b: Light Canvas Conversion

Insert after Phase 4, before Phase 5. Standalone brief. Read `WYRD-WEBSITE-BUILD-PLAN.md` and `CLAUDE.md` first, this amends sections 4, 5, 6, and 7b of that brief.

Do not start Phase 5 until this passes.

---

## 1. What is changing and why this is not a find and replace

The site currently uses a dark canvas. It is changing to a light canvas with dark blocks used deliberately as contrast, not as the default surface.

This is not a token value swap. Three systems were built assuming a dark ground and will fail visually, not just look different:

- **The WebGL hero field** uses additive blending. Additive blending on white produces nothing, white is already at maximum on every channel. The particles will disappear.
- **The grain overlay** is light noise at low opacity over black. The same values over white read as dirt on the screen.
- **Contrast direction inverts everywhere.** Measured, on the current palette: `--color-signal` `#FF521F` scores 6.17:1 against the dark canvas and 3.24:1 against white. It fails WCAG AA for body text on white. `--color-muted` `#8B8B95` scores 3.37:1 on white and also fails.

There is also a structural problem worth fixing while we are in here: the current tokens are named by appearance (`void`, `paper`, `surface`) rather than by role. That is why changing a background touches every component. Task 2 fixes it.

---

## 2. Rename tokens to roles

Do this first. Everything else depends on it.

Every colour token is renamed to describe its job, not its value. After this change, no component knows or cares whether the theme is light or dark.

| Old | New | Role |
|---|---|---|
| `--color-void` | `--bg` | page canvas |
| `--color-surface` | `--bg-raised` | cards, panels sitting on the canvas |
| `--color-surface-2` | `--bg-sunken` | hover and inset states |
| `--color-line` | `--border` | hairlines, dividers, the Thread at rest |
| `--color-paper` | `--fg` | primary text |
| `--color-muted` | `--fg-muted` | secondary text, labels, meta |
| `--color-signal` | `--accent` | accent |
| `--color-signal-dim` | `--accent-strong` | accent where contrast demands a darker value |

Add tokens that did not exist before, because inverted blocks now need their own contrast pair:

| Token | Role |
|---|---|
| `--bg-inverse` | dark block background |
| `--fg-inverse` | text on a dark block |
| `--fg-inverse-muted` | secondary text on a dark block |
| `--border-inverse` | hairline on a dark block |
| `--accent-on-inverse` | accent inside a dark block |

Rename mechanically across the whole codebase. Verify with a grep: no occurrence of `void`, `paper`, `surface-2`, or `signal` as a colour token name should remain anywhere.

---

## 3. New palette

### 3.1 Light context, the default

| Token | Value | Notes |
|---|---|---|
| `--bg` | `#FFFFFF` | pure white, as specified |
| `--bg-raised` | `#F7F6F4` | warm, very slightly off. Keeps stacked panels readable against pure white |
| `--bg-sunken` | `#EFEDE9` | hover and inset |
| `--border` | `#E2DFDA` | hairline. Must be visible on white without drawing attention |
| `--fg` | `#0A0A0C` | near black, not pure. 20.0:1 on white |
| `--fg-muted` | `#5E5E66` | darkened from the old grey. The old `#8B8B95` measured 3.37:1 on white and fails AA |
| `--accent` | `#FF521F` | unchanged. Measures 3.24:1 on white, so it is **restricted**, see 3.3 |
| `--accent-strong` | `#C93C0E` | 5.08:1 on white. This is the accent for anything text sized |

### 3.2 Inverse context, the dark blocks

| Token | Value |
|---|---|
| `--bg-inverse` | `#0A0A0C` |
| `--fg-inverse` | `#F7F6F4` |
| `--fg-inverse-muted` | `#9A9AA2` |
| `--border-inverse` | `#24242A` |
| `--accent-on-inverse` | `#FF521F` |

Note that `--accent` and `--accent-on-inverse` hold the same value. That is intentional and it is exactly why role naming matters: the orange that works on black is not the orange that works on white, and one day one of these will change without the other.

### 3.3 Accent usage rule, non-negotiable

`--accent` `#FF521F` at 3.24:1 on white is legal for large text (24px and above, or 19px bold) and for non-text graphics. It is illegal for body copy, labels, meta text, and small links.

- Body sized text in the accent uses `--accent-strong`.
- Filled accent buttons use `--accent` as the background with `#FFFFFF` text. Verify that pair, it clears AA.
- Never place `--accent` text directly on `--bg-raised` at body size. It measures worse than on pure white.

Every accent usage in the codebase gets audited against this rule during this phase, not deferred.

---

## 4. Where dark blocks go

Dark blocks are punctuation. Used everywhere, they are just a dark site with white gaps. Used in the right three or four places, they carry rhythm.

Apply `--bg-inverse` to:

- **S3 Capabilities**, the four cluster blocks. These become dark cards on white. This is the section that most benefits from the contrast and it makes the four strands of the Thread land somewhere with weight.
- **S8 Contact call to action**, full bleed dark. The page closes on black. This gives the scroll an ending.
- **S9 Footer**, continuing from S8 so they read as one dark base.
- **Case study hero visuals** on `/work/[slug]`, as a frame around the image.

Everything else stays light. In particular the hero (S1), the positioning statement (S2), and the work grid (S4) stay white. The hero especially, a dark hero on a light site is the compromise that satisfies nobody.

Any component that can render in both contexts gets a `variant` prop of `light | inverse` that swaps which token set it reads. It must not detect context by inspecting a parent.

---

## 5. WebGL field, rework required

Section 7b.2A of the main brief is amended. The hero field still exists, it renders differently.

- **Blending.** Change `AdditiveBlending` to `NormalBlending` with per-point alpha. Additive is why it currently glows and it is why it will vanish on white.
- **Colour.** Points now render in `--fg-muted` and `--border` at 30 to 60 percent alpha, with roughly one in twelve in `--accent`. Darker points on a light ground, the inverse of the current relationship.
- **Bloom.** Remove the postprocessing pass entirely. Bloom on a light ground produces a grey wash. This also reclaims frame budget, which is a real gain.
- **Point size.** Points read smaller against light. Increase base size by roughly 30 percent and re-tune by eye rather than by number.
- **Density.** Dark points on white are visually louder than light points on black at equal count. Start by halving the count, from 20,000 to 40,000 down to 10,000 to 20,000, then tune up if it reads too sparse.
- **Cursor displacement.** Unchanged in behaviour. Re-check that the trail still reads at the new density.

The 2D canvas fallback for the Reduced tier gets the same colour inversion and the same density reduction.

Do not skip the tuning pass. A direct numeric port from the dark version will look wrong and the fault will not be obvious in code review.

---

## 6. Grain

- Invert: dark noise on light, rather than light noise on dark.
- Drop opacity to 1.5 to 3 percent. The values that worked on black are roughly double what white can carry.
- Verify on an actual display at full brightness, not only in a screenshot. Grain that is invisible in a compressed screenshot can still be visible and wrong on a real screen.
- Inside `--bg-inverse` blocks, the grain must invert back to light noise. Simplest implementation is a second grain layer scoped to inverse blocks with `mix-blend-mode` handling the switch. Choose an approach and record it in the ADR.

---

## 7. The Thread

- Rest colour becomes `--border`. Verify it is visible against pure white without becoming a hard line that competes with content.
- The travelling accent segment stays `--accent`. It reads well on white and it is a graphic, not text, so 3.24:1 is acceptable here.
- Where the Thread crosses a `--bg-inverse` block, it must switch to `--border-inverse` for that span or it will disappear. This is the fiddliest part of this phase. Options: a second SVG path clipped to the inverse regions, or `mix-blend-mode: difference` on the thread layer. Try blend mode first, it is fewer moving parts. Record the choice in the ADR.

---

## 8. Client logos

The logo pipeline currently monochromes to `--color-muted` for a dark ground. Reprocess.

- Monochrome to `--fg-muted` for the light canvas, moving to `--fg` on hover.
- Check every logo individually. Marks with white knockouts or white fills will now vanish or show as holes. Any logo that does not survive monochroming goes in its original form, and is listed in `docs/BLOCKERS.md` as needing a supplied mono version.
- The marquee edge mask gradients must fade to `--bg`, not the old dark value.

---

## 9. Placeholder visuals

The seeded `<Placeholder>` component generates gradients tuned for a dark ground.

- Regenerate against the light palette: soft tints of `--bg-raised`, `--border`, and sparing `--accent`, over white.
- Because seeds are deterministic, verify a representative sample visually rather than assuming the regeneration is correct.
- Placeholders inside `--bg-inverse` blocks keep the dark generation. Pass the context through as a prop.

---

## 10. Everything else to audit

- **Focus rings.** Tuned for dark. Re-verify visibility on white and on inverse blocks.
- **Form fields.** Borders, placeholder text, error states, disabled states. All were set against dark.
- **Selection colour.** `::selection` if set.
- **Scrollbar styling** if custom.
- **OG images.** Regenerate against the light palette.
- **Favicon.** A mark tuned for a dark site may not read on a light browser tab. Check both.
- **`<meta name="theme-color">`** and `color-scheme`. Both currently declare dark.
- **Loading and skeleton states.**
- **The 404 page** if built.

---

## 11. Acceptance criteria

Report each individually as PASS or FAIL with specifics on failures.

1. No colour token named by appearance remains anywhere. Grep for `void`, `paper`, `surface-2`, `signal` as token names returns nothing.
2. No hardcoded hex value exists outside `app/globals.css`.
3. Every text and background pair in the rendered site meets WCAG AA. Verify by enumerating pairs, not by running one automated check on one page.
4. `--accent` at body text size appears nowhere. All body sized accent text uses `--accent-strong`.
5. The WebGL hero field is clearly visible on white, uses normal blending, has no bloom pass, and has been visually tuned rather than numerically ported.
6. The Reduced tier canvas fallback is equally visible on white.
7. Zero Three.js bytes still download on the Reduced and Static tiers. This did not change and must not have regressed.
8. Grain is visible on a real display and does not read as noise or dirt, in both light and inverse contexts.
9. The Thread is visible across the full page, including where it crosses inverse blocks.
10. Every client logo is legible. Any that failed monochroming are listed in `docs/BLOCKERS.md`.
11. Dark blocks appear only in the locations listed in section 4.
12. Any component that renders in both contexts takes an explicit `variant` prop and does not inspect its parent.
13. Placeholder visuals are regenerated and context aware.
14. Screenshots at 375, 768, and 1440px of every homepage section, plus every other route, reviewed against this brief.
15. `prefers-reduced-motion` static tier still looks composed on the light canvas.
16. No performance regression against the Phase 4 baseline. Removing bloom should show a small improvement, report the actual number.
17. `docs/design-system.md` updated to the new palette with the old values recorded as superseded, not deleted.
18. ADR written covering: why the theme changed, the role based renaming, the WebGL blending change, the Thread inverse crossing approach, and the grain inversion approach.

---

## 12. Order of work

Do not reorder. Each step depends on the one before.

1. Commit current state on a branch. `git checkout -b light-theme`. This is a large change and you will want the dark version intact for comparison.
2. Rename tokens to roles, mechanically, no value changes. Commit. The site still looks dark and still works.
3. Swap values to the light palette. Commit. Most of the site is now correct, the WebGL and grain are broken.
4. Fix the grain. Commit.
5. Fix the WebGL field, including the tuning pass. Commit.
6. Fix the Thread, including inverse crossings. Commit.
7. Apply inverse blocks to the four locations in section 4. Commit.
8. Reprocess logos, regenerate placeholders and OG images. Commit.
9. Full audit against section 10. Commit.
10. Run acceptance criteria. Report.

Step 2 is the one that pays off later. Do not merge it with step 3.
