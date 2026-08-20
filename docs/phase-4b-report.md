# Phase 4b acceptance report

Light canvas conversion. All 18 criteria from section 11, reported individually, measured in a real browser against a production build. Branch `light-theme`, ten commits, section 12's order followed exactly.

Suites, all development only, all run against `next start`:

| Command | Result |
|---|---|
| `node scripts/check-contrast.mjs` | 906 text elements, 51 distinct combinations, all AA |
| `node scripts/check-home.mjs` | 26 of 26 |
| `node scripts/check-hero.mjs` | 19 of 19 |
| `node scripts/check-shell.mjs` | 21 of 21 |
| `node scripts/check-tiers.mjs` | 14 of 14 |
| `npm run verify` | dashes, types, lint, build all clean |

---

## 1. No colour token named by appearance remains anywhere

**PASS.** Eight tokens renamed to roles, five inverse tokens added, in a commit with no value changes so the rename was provably behaviour neutral. Internal palette keys and shader uniforms went with them: nothing reads `uColourSignal` while the token is called accent.

`grep -niE "\b(void|paper|surface|signal)\b"` over `app`, `components`, `content`, `lib`, `scripts` returns two hits, neither a token: the phrase "surface value shift" in the `/tokens` copy, and the word `surface` inside the S2 headline, which is brand copy from `docs/brand.md`.

The `accent-surface` utility was renamed to `accent-fill` during this check, so no utility name contains an appearance word either. Stale prose describing "signal background, void label" was rewritten to say what the button now does.

## 2. No hardcoded hex value exists outside `app/globals.css`

**PASS, with one documented exception.** `lib/theme.ts`, the `theme-color` viewport meta, which the browser reads before any stylesheet and therefore cannot reference a CSS variable. It is alone in its own file with the reason written in it.

This criterion found real defects rather than pedantic ones. Both particle fields and the probe scene carried literal hex fallbacks for `getPropertyValue`, and all six still held **dark palette values**: dead code that had already gone stale, which is exactly the failure the rule exists to catch. They now fall back to the body's own resolved colour, so no copy of a token value exists anywhere. The Thread's SVG mask uses the `white` and `black` keywords, which are mask luminance rather than colours.

## 3. Every text and background pair meets WCAG AA

**PASS.** `scripts/check-contrast.mjs` is new and is the evidence. It walks every element with its own text on `/`, `/tokens`, and `/tiers`, at 375, 768, and 1440, resolves the background by walking up and compositing translucency, and applies the 1.4.3 thresholds: 3:1 for large text, 4.5:1 otherwise.

906 elements measured, 51 distinct colour, size and weight combinations, all passing. The tightest real pairs: 5.08 for white on `--accent-strong` at 12px, 5.08 for `--accent-strong` on white, 5.95 for `--fg-muted` on `--bg-raised`, 6.10 for near black on `--accent-on-inverse`, 7.08 for `--fg-inverse-muted` on the dark ground.

**This criterion caught the most important defect of the phase.** It reported near white text on white in S8. The dark ground was a sibling layer at `z-1`: visually correct, and invisible to anything that walks the DOM for a background, which is every automated contrast checker including the one behind Lighthouse. The ground now sits on the wrapper, an ancestor of the text, which fixes the report and keeps the layering, because `relative` with no z-index does not create a stacking context.

## 4. `--accent` at body text size appears nowhere

**PASS.** Audited in the same commit as the palette swap, not deferred. Moved to `--accent-strong`: filled buttons, chips, field errors and asterisks, field error borders, process indexes, the cursor label, and every link hover. The accent stays where it is a graphic: eyebrow rules, the process line, the Thread head, the particle field, the capability sweep.

Confirmed from the contrast enumeration rather than by reading the source: `rgb(255, 82, 31)` appears as a **background** with a near black label at 6.10, and never as a text colour at any size.

The brief's own instruction in 3.3 to fill accent buttons with white on `--accent` was verified and does not hold: it measures 3.24:1, legal for large text, and every filled button here carries a 13px label. The `accent-fill` utility therefore fills with `--accent-strong` at 5.08. Recorded in ADR 0019.

## 5. The WebGL field is visible on white, normal blending, no bloom, visually tuned

**PASS.** `NormalBlending` with per point alpha. No postprocessing pass and no in shader halo lobe either, since a wide low amplitude lobe on a light ground is a grey wash.

Tuned, not ported. Three things a numeric port would have shipped:

1. **The distribution was wrong, and had been since Phase 3.** Points were spread over a fixed 16 by 10 world box while the camera saw about 6.6 by 4.1, so five points in six were off screen. Spread now matches the viewport, which is why the count came down rather than up.
2. **Size chosen by measuring ink coverage** on a text free patch: 0.90 percent ported, 1.71 percent at size 6.0, 2.75 percent at 8.0 which read as blobs.
3. **Accent points at 78 percent of field alpha.** At full alpha, orange on white is confetti rather than flecks.

Then the review pass at 375 found a fourth: count scaled with area and size with width, because a 3px dot beside an 80px headline is dust and the same dot beside a 36px headline is grit. 12,000 points at 1440, 2,819 at 375, published as `data-field-count`.

Measured on a text free patch at 1440: mean 251.13 of 255, darkest pixel 95, 1.70 percent of pixels carrying ink.

## 6. The Reduced tier canvas fallback is equally visible on white

**PASS on visibility, and it is deliberately sparser.** Same crop as the shader field: darkest pixel 95, identical to the Full tier, so an individual particle is exactly as present. Ink coverage is 0.37 percent against the shader field's 1.70.

That gap is by design and predates this phase: the main brief allots the Reduced tier hundreds of particles, not tens of thousands, and says of it "Still good. Not the same." Halving to 45 as instructed measured a third of the shader field's ink and read as stray dots, so it was tuned back up to 72 on desktop, 48 at tablet, 30 on a phone. Colours and radius inverted with the same reasoning as the shader.

## 7. Zero Three.js bytes still download on the Reduced and Static tiers

**PASS, no regression.** Verified the same way as Phase 2b, by refetching every script the page loaded and grepping the bodies for `WebGLRenderer`, `BufferGeometry`, `ShaderMaterial`, and `react-three`, because chunk names are hashed.

On `/`: Full 453.8kb over the wire with three Three.js chunks, Reduced and Static 223.4kb with zero.

## 8. Grain is visible and does not read as noise or dirt, in both contexts

**PASS on measurement. Not verifiable on a physical display from here, and I am not claiming otherwise.**

Two textures, since one cannot serve both grounds. Dark speckle multiplied over the canvas at 3 percent, light speckle screened inside inverse blocks at 3 percent, both seeded and deterministic.

Measured on flat patches rather than eyeballed in a compressed screenshot:

| Where | Mean | Standard deviation | Range |
|---|---|---|---|
| light canvas | 252.02 of 255 | 1.49 levels | 249 to 255 |
| inside an inverse block | 14.32 of 255, ground is 10 | 1.70 levels | 10 to 18 |

Both sit inside the brief's 1.5 to 3 percent band. The single neutral grey texture with soft-light was tried first and dropped, because on white it lifts the whole canvas toward grey at any opacity that makes the grain visible.

## 9. The Thread is visible across the full page, including inverse blocks

**PASS.** Every path is drawn twice: once in `--border` masked to exclude the dark bands, once in `--border-inverse` clipped to them. Blend modes were tried first per the brief's suggestion and rejected with arithmetic, which is in ADR 0019.

Measured inside the dark block on a row the thread crosses: the hairline reads 36 against a ground of 11, which is the 1.28:1 the palette specifies and matches the 1.33:1 it has on white. Nine paths above 1024 and one straight line below, unchanged, verified by `check-home` at 1024, 1440, 1920, 2560 and at 375, 768, 1023.

The masking half of this was a real bug caught by looking: before it, the light hairline still painted inside the dark block at 17:1 and the inverse copy underneath it was pointless.

## 10. Every client logo is legible, failures listed in BLOCKERS

**PASS.** Checked one at a time on white, rendered at display size in both `--fg-muted` and the `--fg` hover state.

The masks were washing out, because ink tuned for a dark ground is too weak on white: a mid tone at 30 percent alpha is `#C5C5C8`. The pipeline now applies a 0.55 gamma to the mask alpha, which lifts mid tones and leaves the knockouts and solids alone.

Five of six survive. **SITEO does not:** five colour blocks with letters knocked out in white, whose third block reduces to 21 percent ink, so the letter inside it becomes white on near white. Per section 8 it ships in its original colours at the same optical height, and it is BLOCKERS item 8 as needing a supplied single colour version. It is conspicuously the only colour mark in the row, which is the honest consequence of the rule rather than a design choice.

## 11. Dark blocks appear only in the locations listed in section 4

**PASS.** Enumerated by grep. Three on the homepage: the four S3 cluster cards, S8 through `Section variant="inverse"`, and S9 the footer, which continues the same ground so the two read as one base. The fourth location, case study hero frames, belongs to Phase 5 where that route is built, and `Placeholder` already accepts the inverse context for it.

The only other uses of `--bg-inverse` are the inverse swatch block on the internal `/tokens` route, which exists to show the tokens, and the `Section` component itself. The hero, the positioning statement, and the work grid stay light.

## 12. Components that render in both contexts take an explicit `variant` prop

**PASS.** `Section` takes `variant: light | inverse`. `Wordmark` takes `variant: light | inverse`, since it sits on the white header and the dark footer. `Placeholder` takes `context: light | inverse`, which selects both its token set and which grain it carries.

None of them inspects a parent, and no context is inherited through CSS scoping. That was a deliberate choice over re-pointing the same role tokens inside an `.inverse` scope, which would have been less code and would have made a component's colours depend on where it happened to be mounted.

Stated precisely, because the criterion is about components that **can** render in both: `Footer` and `MagneticButton` are single context by construction and read the inverse tokens directly. `Button`, `Chip`, and the `Field` family render only in light contexts today; they take no variant yet, and the day one lands on a dark block it gets the prop rather than a guess.

## 13. Placeholder visuals are regenerated and context aware

**PASS.** Two tuning passes, and the first was wrong in an instructive way: porting the dark generation put `--fg-muted` blobs at 50 to 85 percent over a light panel, which read as exactly the out of focus photograph a placeholder must never look like. Ink now appears only at 9 to 16 percent for depth, near canvas tints carry the volume, the grid and the hard rules carry the composition, and the `lines` variant sits at 45 percent on light where full strength read as a scribble.

Verified by looking at all three variants on `/tokens` and at the three real S4 cards, not by assuming the regeneration was correct. Seeds are unchanged, so the same seed still produces the same visual.

## 14. Screenshots at 375, 768, and 1440 of every section and route, reviewed

**PASS.** All nine homepage sections plus the footer at each of the three widths, and `/tokens` and `/tiers`, captured after a full scroll so scrubbed animations and reveals had fired. 29 screenshots, in `build-logs/screens`.

The review found the 375 field defect in criterion 5 and confirmed the rhythm the phase is for: light body, dark cards as punctuation mid page, dark close and footer as one base.

## 15. The reduced motion static tier still looks composed on the light canvas

**PASS.** Verified by screenshot at four scroll positions: hero, capabilities, work and logos, and the dark close. Zero canvases, no Lenis, every reveal at final opacity, the Thread complete at rest colour in both contexts, all nine sections present.

## 16. No performance regression against the Phase 4 baseline

**PASS on frame rate, flat on bytes.** Measured back to back on this machine, four samples each, same harness, by checking out `master` and rebuilding rather than comparing against a number from a different run.

| Metric | Phase 4, dark | Phase 4b, light | Change |
|---|---|---|---|
| Frame rate, headless, no GPU | 39.3fps mean of 39.4, 39.5, 39.1, 39.3 | **43.5fps** mean of 42.9, 43.8, 43.9, 43.3 | **plus 10.7 percent** |
| JS over the wire, `/`, Full | 452.8kb | 453.8kb | plus 1.0kb |
| JS over the wire, `/`, Reduced | 222.7kb | 223.4kb | plus 0.7kb |

The frame rate gain is the halo lobe going and 28,000 points becoming 12,000. The kilobyte is the `ClientLogo` component and the placeholder colour sets. An earlier draft of `ClientLogo` used `next/image` for the one non mono mark and cost 5kb of client runtime for a local static asset at a known size; it is a plain `img` with width and height set.

An earlier comparison in this session suggested a regression, 48.3 against 50.9. Both of those numbers came from runs with different browser flags and a single sample, and neither was a fair comparison. The table above is.

## 17. `docs/design-system.md` updated, old values recorded as superseded

**PASS.** Section 1 rewritten: light context, inverse context, every contrast pair enumerated in both, the four consequences that constrain components, and section 1.4 recording all eight superseded dark values in a table with where each one went. ADR 0010 is marked superseded by ADR 0019 with its reasoning kept intact.

## 18. ADR written covering all five topics

**PASS.** `docs/decisions/0019-light-canvas-conversion.md` covers why the theme changed, the role based rename, the WebGL blending change, the Thread's inverse crossing approach, and the grain inversion approach, each with the arithmetic or the measurement behind it, plus the accent restriction as a fifth decision.

---

## Not verifiable from here

Stated plainly rather than buried:

- **How the grain and the hairlines look on a physical display at full brightness.** Both are measured in pixel values and both sit inside the brief's bands. That is not the same as having looked at them on a screen, and the brief asks for a real display.
- **Frame rate on a real GPU.** Every number here is headless software rendering.
- **Lighthouse Accessibility and Performance.** Phase 7 owns those. The contrast work in criterion 3 removes the one thing that was structurally going to fail the accessibility audit.
