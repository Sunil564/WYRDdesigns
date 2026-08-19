# Design system, reconciled

Every token is traceable. The **Origin** column says where the value came from: `brand.md` is the supplied brand document at `docs/brand.md`, `brief` is section 4 of `WYRD-WEBSITE-BUILD-PLAN.md`, `derived` is a value this build chose to fill a gap the other two left silent.

Implemented in `app/globals.css` as Tailwind v4 `@theme` tokens. Nothing outside that file may hardcode a hex colour or a px font size.

Precedence, per ADR 0001: `brand.md` wins on brand matters. The superseded `design-system.md` in `docs/supplied-superseded/` describes the earlier light and sage build with the doodle rule. It does not govern this build and none of its values are used.

## 1. Colour

| Token | Value | Use | Origin |
|---|---|---|---|
| `--color-void` | `#08080A` | page canvas | brief |
| `--color-surface` | `#101013` | cards, raised blocks | brief |
| `--color-surface-2` | `#191920` | hover state, inset blocks | brief |
| `--color-line` | `#26262E` | hairlines, borders, the Thread at rest | brief |
| `--color-paper` | `#F2EFE9` | primary text, never pure white | brief |
| `--color-muted` | `#8B8B95` | secondary text, labels, meta | brief |
| `--color-signal` | `#FF521F` | the one accent | brief |
| `--color-signal-dim` | `#B33714` | accent pressed and secondary state | brief |

`brand.md` is silent on colour. Its section 1 fixes identity, not palette, and the palette in the superseded document belongs to a different site. So the brief's dark canvas stands unopposed.

One accent. No second accent, no gradient palette. Emphasis that cannot use signal orange uses scale and weight.

Contrast, computed on the actual token pairs rather than assumed:

| Pair | Ratio | Verdict |
|---|---|---|
| paper on void | 17.44 | AAA at every size |
| paper on surface | 16.55 | AAA at every size |
| paper on surface-2 | 15.23 | AAA at every size |
| signal on void | 6.17 | AA at every size, AAA at large |
| signal on surface | 5.86 | AA at every size |
| muted on void | 5.93 | AA at every size |
| muted on surface | 5.63 | AA at every size |
| muted on surface-2 | 5.18 | AA at every size |
| void on signal | 6.17 | AA at every size, the filled button |
| paper on signal | 2.82 | fails, never used |
| line on void | 1.33 | decorative hairline, never text |

Two consequences that constrain components:

1. **The filled signal button sets its label in `--color-void`, not `--color-paper`.** Paper on signal is 2.82 and fails AA outright. Void on signal is 6.17 and passes at every size. This is not a stylistic preference, and a later change to a light label on the orange button is a regression.
2. `--color-muted` holds AA on all three surface values, so meta and label text can sit on any of them. It has no headroom for a fourth darker surface, and there is not going to be one.

Text over the particle field and over placeholder visuals is checked against its rendered background in Phase 3 and Phase 4, not against the canvas token, since a particle can land behind a character.

## 2. Type

| Role | Face | Weights | Origin |
|---|---|---|---|
| Display and UI | Satoshi Variable | 300 to 900 | brief |
| Editorial accent | Instrument Serif Italic | 400 | brief |

`brand.md` names no faces. The superseded document named Poppins and Inter, and it does not govern. Both faces are self hosted from `public/fonts`, no CDN request. Licensing in ADR 0011.

### Scale

| Token | Min | Max | Line height | Tracking | Origin |
|---|---|---|---|---|---|
| `--text-mega` | 2.25rem | 6rem | 0.95 | -0.03em | brief, adjusted |
| `--text-display` | 2.25rem | 5rem | 1.02 | -0.022em | brief |
| `--text-title` | 1.5rem | 2.5rem | 1.15 | -0.012em | brief |
| `--text-lead` | 1.125rem | 1.5rem | 1.5 | -0.006em | brief |
| `--text-body` | 1rem | 1.125rem | 1.6 | 0 | brief |
| `--text-label` | 0.75rem | 0.8125rem | 1.4 | 0.12em | brief |

**The one deviation, and the arithmetic behind it.** The brief specifies `--text-mega` at 3rem to 9.5rem. It also says headlines cap at three lines and the hero headline must be legible from 320px up. Those three constraints cannot all hold for the actual hero headline, which is 62 characters.

- At 1440px the content column is 1344px. Satoshi Black averages roughly 0.52em per character. At 9.5rem, 152px, that is about 17 characters per line, so 62 characters needs four lines. The three line cap fails.
- At 320px the content column is 272px. At 3rem, 48px, that is about 11 characters per line, so the headline needs six lines and the first sentence alone needs three.

Resolved by narrowing the clamp to 2.25rem and 6rem. At 1440px, 96px gives about 27 characters per line, so the two sentences occupy one line and two lines, three in total. At 320px, 36px gives about 15 characters per line, so each sentence takes two lines. Both constraints hold. Verified by screenshot in Phase 3, not by this arithmetic alone.

Rules kept as written in the brief: tracking tightens as size grows, line height 0.95 at mega and 1.6 at body, body measure caps at 68 characters through the `measure` utility.

`brand.md` section 5 fixes the writing, not the type. Its headline emphasis rule, one emphasised phrase per headline and never two, is a copy rule and is followed: the italic phrase in S2 is the only emphasis in that block.

## 3. Space and grid

8px base. The brief's scale is 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256. Tailwind v4's default `--spacing` is `0.25rem`, so every one of those values is already a first class utility and no custom scale is defined:

| Value | Utility |
|---|---|
| 4px | `1` |
| 8px | `2` |
| 12px | `3` |
| 16px | `4` |
| 24px | `6` |
| 32px | `8` |
| 48px | `12` |
| 64px | `16` |
| 96px | `24` |
| 128px | `32` |
| 192px | `48` |
| 256px | `64` |

Anything off that scale is a mistake, not a decision.

| Item | Value | Origin |
|---|---|---|
| Grid | 12 columns | brief |
| Max content width | 1440px, `--container-content` | brief |
| Gutter | 24px below 1024px, 48px at and above, `--gutter` | brief |
| Section vertical padding | 128px below 1024px, 192px at and above, `--section-y` | brief |
| Body measure | 68ch, `--container-measure` | brief |

Gutter and section rhythm are single custom properties that switch at one breakpoint, so a section never needs a responsive padding class.

## 4. Radii, borders, depth

| Token | Value | Use | Origin |
|---|---|---|---|
| `--radius-none` | 0 | structural blocks, cards, panels | brief |
| `--radius-input` | 4px | inputs, textareas, selects | brief |
| `--radius-pill` | 999px | buttons, chips | brief |

Borders are 1px `--color-line` and nothing else. No shadows anywhere on the site. Depth is a surface value shift, `--color-surface` to `--color-surface-2`.

The superseded document allowed "a single subtle lift on hover" with a 2px translate. Not used. The brief bans shadows and scale transforms on hover, and the hover treatment in S3 is a background shift plus a hairline sweep.

## 5. Grain

One tiling noise texture, `public/noise.png`, 128px, generated deterministically by `scripts/make-noise.py` from a fixed seed. Fixed position, full viewport, `pointer-events: none`, `opacity: 0.04`, `mix-blend-mode: soft-light`. Applied once in the root layout through the `grain` utility.

Origin: brief 4.4, which specifies 3 to 5 percent. 4 percent with soft-light reads as texture on both `--color-void` and `--color-surface`. Straight `normal` blending at the same opacity lifts the canvas visibly toward grey, which is why the blend mode is part of the token rather than the opacity alone.

## 6. Utilities

Deliberately few. Anything used twice becomes a component, anything used once stays inline.

| Utility | What it does |
|---|---|
| `measure` | caps a text block at 68ch |
| `label` | the uppercase eyebrow and meta treatment, `--text-label` with 0.12em tracking |
| `editorial` | Instrument Serif italic, for manifesto lines and pull quotes only |
| `section-y` | vertical section rhythm from `--section-y` |
| `hairline-t`, `hairline-b` | 1px `--color-line` divider |
| `grain` | the fixed grain overlay |
| `logo-mask` | renders an alpha only client logo mask in `currentColor` |

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
