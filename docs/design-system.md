# Design system, reconciled

Every token is traceable. The **Origin** column says where the value came from: `brand.md` is the supplied brand document at `docs/brand.md`, `brief` is section 4 of `WYRD-WEBSITE-BUILD-PLAN.md`, `derived` is a value this build chose to fill a gap the other two left silent.

Implemented in `app/globals.css` as Tailwind v4 `@theme` tokens. Nothing outside that file may hardcode a hex colour or a px font size.

Precedence, per ADR 0001: `brand.md` wins on brand matters. The superseded `design-system.md` in `docs/supplied-superseded/` describes the earlier light and sage build with the doodle rule. It does not govern this build and none of its values are used.

## 1. Colour

Light canvas, dark blocks as punctuation. Phase 4b, which amends section 4 of the build brief. The superseded dark values are recorded at the end of this section rather than deleted.

Tokens are named by **role**, not by appearance, so no component knows or cares which context it is in. They keep the `--color-` prefix because that is the namespace Tailwind v4 generates utilities from: the role name is everything after the prefix, and the utilities read `bg-bg`, `text-fg`, `border-border`.

### 1.1 Light context, the default

| Token                   | Value     | Use                                     | Origin            |
| ----------------------- | --------- | --------------------------------------- | ----------------- |
| `--color-bg`            | `#FFFFFF` | page canvas                             | Phase 4b          |
| `--color-bg-raised`     | `#F7F6F4` | cards, panels on the canvas             | Phase 4b          |
| `--color-bg-sunken`     | `#EFEDE9` | hover and inset states                  | Phase 4b          |
| `--color-border`        | `#E2DFDA` | hairlines, dividers, the Thread at rest | Phase 4b          |
| `--color-fg`            | `#0A0A0C` | primary text                            | Phase 4b          |
| `--color-fg-muted`      | `#5E5E66` | secondary text, labels, meta            | Phase 4b          |
| `--color-accent`        | `#FF521F` | large text and non text graphics only   | brief, restricted |
| `--color-accent-strong` | `#C93C0E` | any accent at text size                 | Phase 4b          |

### 1.2 Inverse context, the dark blocks

| Token                       | Value     | Use                            | Origin   |
| --------------------------- | --------- | ------------------------------ | -------- |
| `--color-bg-inverse`        | `#0A0A0C` | dark block ground              | Phase 4b |
| `--color-fg-inverse`        | `#F7F6F4` | text on a dark block           | Phase 4b |
| `--color-fg-inverse-muted`  | `#9A9AA2` | secondary text on a dark block | Phase 4b |
| `--color-border-inverse`    | `#24242A` | hairline on a dark block       | Phase 4b |
| `--color-accent-on-inverse` | `#FF521F` | accent inside a dark block     | Phase 4b |

`--color-accent` and `--color-accent-on-inverse` hold the same value today and are deliberately separate tokens. The orange that works on white is not the orange that works on black, and one day one of them changes without the other.

`brand.md` is silent on colour. Its section 1 fixes identity, not palette.

One accent. No second accent, no gradient palette. Emphasis that cannot use the accent uses scale and weight.

**Retired for grounds, 2026-08-23, see ADR 0029.** The rule above stands for accents and there
is still exactly one, `--color-accent`. It no longer forbids a second _ground_: the capability
cluster cards render on `--color-card-royal` and `--color-card-lime`, which alternate across
the four and take opposite text pairs. Neither is a foreground colour anywhere, and nothing
outside those four cards uses either. Retired on the record rather than worked around, because
a rule quietly stepped over is worse than one deliberately amended.

### 1.2b Card grounds

| Token                | Value     | Use                             | Origin   |
| -------------------- | --------- | ------------------------------- | -------- |
| `--color-card-royal` | `#4461E4` | cluster card ground, odd cards  | ADR 0029 |
| `--color-card-lime`  | `#E4FDB8` | cluster card ground, even cards | ADR 0029 |

| pair                             | measured | note                                                          |
| -------------------------------- | -------- | ------------------------------------------------------------- |
| `--fg-inverse` on royal          | 4.77     | AA, the tightest pair on the site                             |
| `--fg-inverse` on royal, hovered | 5.42     | hover deepens, so contrast rises                              |
| `--fg` on lime                   | 17.94    | AA at every size                                              |
| `--fg-muted` on lime             | 5.82     | AA at every size                                              |
| royal against lime               | 4.67     | the two grounds separate in the grid                          |
| `--fg-inverse-muted` on royal    | 1.84     | **fails**, which is why royal has no muted tier               |
| `--accent` on royal              | 1.41     | **fails**, no accent inside these cards                       |
| `--accent-strong` on royal       | 1.00     | **absent**, not merely weak: the focus ring is the card's ink |

### 1.3 Contrast, every pair enumerated

Computed on the actual token values, not sampled from one automated check on one page.

**Light context**

| Pair                       | Ratio | Verdict                             |
| -------------------------- | ----- | ----------------------------------- |
| fg on bg                   | 19.78 | AAA at every size                   |
| fg on bg-raised            | 18.31 | AAA at every size                   |
| fg on bg-sunken            | 16.92 | AAA at every size                   |
| fg-muted on bg             | 6.42  | AA at every size                    |
| fg-muted on bg-raised      | 5.95  | AA at every size                    |
| fg-muted on bg-sunken      | 5.49  | AA at every size                    |
| accent-strong on bg        | 5.08  | AA at every size                    |
| accent-strong on bg-raised | 4.70  | AA at every size                    |
| accent-strong on bg-sunken | 4.34  | AA at every size                    |
| bg on accent-strong        | 5.08  | AA at every size, the filled button |
| accent on bg               | 3.24  | large text and graphics only        |
| accent on bg-raised        | 3.00  | graphics only, at the floor         |
| bg on accent               | 3.24  | **fails for a label, not used**     |
| border on bg               | 1.33  | decorative hairline, never text     |

**Inverse context**

| Pair                            | Ratio | Verdict                                     |
| ------------------------------- | ----- | ------------------------------------------- |
| fg-inverse on bg-inverse        | 18.31 | AAA at every size                           |
| fg-inverse-muted on bg-inverse  | 7.08  | AA at every size                            |
| accent-on-inverse on bg-inverse | 6.10  | AA at every size                            |
| bg-inverse on accent-on-inverse | 6.10  | AA at every size, the filled button on dark |
| accent-strong on bg-inverse     | 3.90  | focus ring, clears the 3:1 non text floor   |
| border-inverse on bg-inverse    | 1.28  | decorative hairline, never text             |

Four consequences that constrain components:

1. **The accent is restricted.** `#FF521F` is 3.24:1 on white. Legal for large text and non text graphics, illegal for body copy, labels, meta, and small links. Those use `--color-accent-strong`.
2. **Filled accent surfaces use `--accent-strong` with white text.** Phase 4b 3.3 specifies white on `--accent` and asks for the pair to be verified. Verified, it is 3.24:1 and fails AA for a 13px label. The `accent-fill` utility therefore fills with `--accent-strong`, where white is 5.08:1. Inside an inverse block the bright accent is correct, because near black on it is 6.10:1, which is what `accent-fill-inverse` does.
3. **The focus ring is `--accent-strong`, not `--accent`.** `--accent` measures 3.00:1 against `--bg-raised`, exactly the floor and no margin against a form field. `--accent-strong` has headroom on white, on raised, and on the dark ground.
4. `--color-fg-muted` holds AA on all three light surfaces. There is no headroom for a fourth darker light surface, and there is not going to be one.

Text over the particle field and over placeholder visuals is checked against its rendered background, not against the canvas token, since a particle can land behind a character.

### 1.4 Superseded, recorded not deleted

The dark canvas palette this replaced, from Phase 0b to Phase 4:

| Old token            | Old value | Now                                                                                           |
| -------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `--color-void`       | `#08080A` | `--color-bg`, `#FFFFFF`. The old value survives as `--color-bg-inverse` at `#0A0A0C`          |
| `--color-surface`    | `#101013` | `--color-bg-raised`, `#F7F6F4`                                                                |
| `--color-surface-2`  | `#191920` | `--color-bg-sunken`, `#EFEDE9`                                                                |
| `--color-line`       | `#26262E` | `--color-border`, `#E2DFDA`. The old value is near `--color-border-inverse` at `#24242A`      |
| `--color-paper`      | `#F2EFE9` | `--color-fg`, `#0A0A0C`. The old value survives as `--color-fg-inverse`                       |
| `--color-muted`      | `#8B8B95` | `--color-fg-muted`, `#5E5E66`. The old grey measured 3.37:1 on white and failed AA            |
| `--color-signal`     | `#FF521F` | `--color-accent`, unchanged in value, restricted in use                                       |
| `--color-signal-dim` | `#B33714` | `--color-accent-strong`, `#C93C0E`, and it is now a contrast tool rather than a pressed state |

Why the theme changed at all, and the five decisions that came with it: ADR 0019.

## 2. Type

| Role             | Face                    | Weights    | Origin |
| ---------------- | ----------------------- | ---------- | ------ |
| Display and UI   | Satoshi Variable        | 300 to 900 | brief  |
| Editorial accent | Instrument Serif Italic | 400        | brief  |

`brand.md` names no faces. The superseded document named Poppins and Inter, and it does not govern. Both faces are self hosted from `public/fonts`, no CDN request. Licensing in ADR 0011.

### Scale

| Token            | Min      | Max       | Line height | Tracking | Origin          |
| ---------------- | -------- | --------- | ----------- | -------- | --------------- |
| `--text-mega`    | 2.25rem  | 6rem      | 0.95        | -0.03em  | brief, adjusted |
| `--text-display` | 2.25rem  | 5rem      | 1.02        | -0.022em | brief           |
| `--text-title`   | 1.5rem   | 2.5rem    | 1.15        | -0.012em | brief           |
| `--text-lead`    | 1.125rem | 1.5rem    | 1.5         | -0.006em | brief           |
| `--text-body`    | 1rem     | 1.125rem  | 1.6         | 0        | brief           |
| `--text-label`   | 0.75rem  | 0.8125rem | 1.4         | 0.12em   | brief           |

**The one deviation, and the arithmetic behind it.** The brief specifies `--text-mega` at 3rem to 9.5rem. It also says headlines cap at three lines and the hero headline must be legible from 320px up. Those three constraints cannot all hold for the actual hero headline, which is 62 characters.

- At 1440px the content column is 1344px. Satoshi Black averages roughly 0.52em per character. At 9.5rem, 152px, that is about 17 characters per line, so 62 characters needs four lines. The three line cap fails.
- At 320px the content column is 272px. At 3rem, 48px, that is about 11 characters per line, so the headline needs six lines and the first sentence alone needs three.

Resolved by narrowing the clamp to 2.25rem and 6rem. At 1440px, 96px gives about 27 characters per line, so the two sentences occupy one line and two lines, three in total. At 320px, 36px gives about 15 characters per line, so each sentence takes two lines. Both constraints hold. Verified by screenshot in Phase 3, not by this arithmetic alone.

Rules kept as written in the brief: tracking tightens as size grows, line height 0.95 at mega and 1.6 at body, body measure caps at 68 characters through the `measure` utility.

`brand.md` section 5 fixes the writing, not the type. Its headline emphasis rule, one emphasised phrase per headline and never two, is a copy rule and is followed: the italic phrase in S2 is the only emphasis in that block.

## 3. Space and grid

8px base. The brief's scale is 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256. Tailwind v4's default `--spacing` is `0.25rem`, so every one of those values is already a first class utility and no custom scale is defined:

| Value | Utility |
| ----- | ------- |
| 4px   | `1`     |
| 8px   | `2`     |
| 12px  | `3`     |
| 16px  | `4`     |
| 24px  | `6`     |
| 32px  | `8`     |
| 48px  | `12`    |
| 64px  | `16`    |
| 96px  | `24`    |
| 128px | `32`    |
| 192px | `48`    |
| 256px | `64`    |

Anything off that scale is a mistake, not a decision.

| Item                     | Value                                                 | Origin |
| ------------------------ | ----------------------------------------------------- | ------ |
| Grid                     | 12 columns                                            | brief  |
| Max content width        | 1440px, `--container-content`                         | brief  |
| Gutter                   | 24px below 1024px, 48px at and above, `--gutter`      | brief  |
| Section vertical padding | 128px below 1024px, 192px at and above, `--section-y` | brief  |
| Body measure             | 68ch, `--container-measure`                           | brief  |

Gutter and section rhythm are single custom properties that switch at one breakpoint, so a section never needs a responsive padding class.

## 4. Radii, borders, depth

| Token            | Value | Use                              | Origin |
| ---------------- | ----- | -------------------------------- | ------ |
| `--radius-none`  | 0     | structural blocks, cards, panels | brief  |
| `--radius-input` | 4px   | inputs, textareas, selects       | brief  |
| `--radius-pill`  | 999px | buttons, chips                   | brief  |

Borders are 1px `--color-border` and nothing else. No shadows anywhere on the site. Depth is a surface value shift, `--color-bg-raised` to `--color-bg-sunken`.

The superseded document allowed "a single subtle lift on hover" with a 2px translate. Not used. The brief bans shadows and scale transforms on hover, and the hover treatment in S3 is a background shift plus a hairline sweep.

## 5. Grain

One tiling noise texture, `public/noise.png`, 128px, generated deterministically by `scripts/make-noise.py` from a fixed seed. Fixed position, full viewport, `pointer-events: none`, `opacity: 0.04`, `mix-blend-mode: soft-light`. Applied once in the root layout through the `grain` utility.

Origin: brief 4.4, which specifies 3 to 5 percent. 4 percent with soft-light reads as texture on both `--color-bg` and `--color-bg-raised`. Straight `normal` blending at the same opacity lifts the canvas visibly toward grey, which is why the blend mode is part of the token rather than the opacity alone.

## 6. Utilities

Deliberately few. Anything used twice becomes a component, anything used once stays inline.

| Utility                    | What it does                                                                  |
| -------------------------- | ----------------------------------------------------------------------------- |
| `measure`                  | caps a text block at 68ch                                                     |
| `label`                    | the uppercase eyebrow and meta treatment, `--text-label` with 0.12em tracking |
| `editorial`                | Instrument Serif italic, for manifesto lines and pull quotes only             |
| `section-y`                | vertical section rhythm from `--section-y`                                    |
| `hairline-t`, `hairline-b` | 1px `--color-border` divider                                                  |
| `grain`                    | the fixed grain overlay                                                       |
| `logo-mask`                | renders an alpha only client logo mask in `currentColor`                      |

## 7. Naming and copy rules that touch the design

From `brand.md`, enforced in components and content, not only in review:

- `WYRD` is always all caps. `WYRD Designs` for the studio. `WYRD Tech Pvt Ltd` in legal, invoice, and footer contexts only.
- The name is explained once, on `/studio`, in the `brand.md` phrasing: `Old English for fate. Yes, it sounds like weird.` Never conceded with "but".
- One emphasised phrase per headline, never two.
- No long em dashes, anywhere. Checked by `npm run check:dashes`.
- No prices, anywhere.
- Banned phrases are the union of both lists in `brand.md` section 5 and brief section 1.

## 8. What the supplied documents left silent

Recorded so a later session does not read silence as agreement:

- `brand.md` specifies no palette, no type, no spacing, no radii, no motion. Every value in sections 1 to 6 above therefore comes from the brief or is derived.
- `brand.md` does specify identity, positioning, service wording, audience, voice, and the name treatment. Those govern `content/` and every line of copy.
