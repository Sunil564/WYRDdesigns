# WYRD design system

Neo-minimal. Warm paper, sage utility, ink type, hand-drawn punctuation.

Restraint is the point. The doodles are the only loud element. Everything else
stays quiet.

---

## 1. Colour

Hex values are read from the current deck. Replace with exact brand values if
the source files differ.

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#FBFAF6` | Page background |
| `--card` | `#EDEFE5` | Panels, cards, service blocks |
| `--ink` | `#1C1B18` | Headings, primary text |
| `--ink-soft` | `#4A4843` | Body copy |
| `--sage` | `#7B8B62` | Eyebrows, labels, links, small accents |
| `--rule` | `#DDDCD3` | Hairlines, dividers |
| `--blush` | `#D8B4A6` | Doodle strokes only |

**Rules**

- Sage is a utility colour. Labels, eyebrows, active states. Never a fill for
  large areas, never a button background.
- No pure white and no pure black anywhere.
- No gradients. No shadows except a single subtle lift on hover.
- Blush appears only in hand-drawn marks, never as UI colour.

**Deliberate exclusion.** No terracotta or clay accent. It is the default AI
palette partner for cream backgrounds and would flatten the identity. Sage is
the choice.

---

## 2. Typography

Two faces. Geometric-humanist display, neutral grotesque body.

| Role | Face | Notes |
|---|---|---|
| Display | Poppins or General Sans, weight 600 | Tight tracking, -0.02em |
| Body | Inter, weight 400 and 500 | Default browser rendering |
| Eyebrow | Body face, weight 600, uppercase | 0.14em tracking, sage, 12px |

Substitute freely if the logo uses a different face, but keep it to two.

**Scale** (desktop, `clamp()` down to mobile)

| Token | Size | Line height |
|---|---|---|
| `--h1` | 64px | 1.05 |
| `--h2` | 44px | 1.12 |
| `--h3` | 26px | 1.25 |
| `--body-lg` | 19px | 1.6 |
| `--body` | 16px | 1.65 |
| `--caption` | 13px | 1.5 |

**Headline rule.** Every h2 uses a sage or ink emphasis on one phrase, not the
whole line. Reference: "Everything a brand needs to be **seen and remembered**."
Emphasis carries meaning. One per headline, never two.

**Measure.** Body text never wider than 68 characters.

---

## 3. Layout

- 12 column grid, 1200px max content width, 24px gutters
- Section vertical rhythm: 120px desktop, 72px mobile
- Generous negative space. If a section feels empty, it is probably correct.
- Border radius: 4px on cards, 0 on rules and dividers. Nothing rounder.
- Hairline dividers between list rows. This is the primary structural device.

**Service list pattern** (from the deck, keep it): two columns, each row is
icon, bold title, one grey line, hairline rule below. No cards, no boxes, no
shadows.

---

## 4. The doodle rule

Inherited studio rule, mandatory.

**Any large area of empty space gets a hand-drawn doodle.** Loose, single
stroke, blush or muted grey-green, never coloured in. Small, 60 to 140px.

Placement: top-right of a section, beside a headline, in the footer, in the
gap a short paragraph leaves. Never centred, never symmetrical, never more
than two per screen.

Subjects come from the studio's own world: a monitor with a paintbrush, a
squiggle, a camera, a cursor, a stall frame, a wave.

This is the signature element. It is what makes the site not a template. Spend
the boldness here and keep everything else disciplined.

---

## 5. Motion

Restrained. Framer-adjacent, not Framer-maximal.

| Event | Behaviour |
|---|---|
| Page load | Hero headline fades and rises 12px, 600ms, ease-out. One orchestrated moment, staggered 80ms per line. |
| Scroll reveal | Sections fade in, 16px rise, threshold 0.15, once only |
| Link hover | Sage underline draws left to right, 200ms |
| Card hover | 2px lift, 150ms. No scale, no glow. |
| Doodles | Optional single-pass SVG stroke draw on first reveal |

**Hard limits.** No parallax. No scroll-jacking. No cursor followers. No
autoplay video with sound. `prefers-reduced-motion` disables all of it.

---

## 6. Imagery

Photography: natural light, real work, real people, no stock handshakes.
Muted grade to sit against paper. Slight warmth.

Video: 16:9 for embeds, 4:5 for social crops. Never autoplay with sound.

If real assets are missing, use flat sage panels with a doodle. Never a
placeholder stock photo.

---

## 7. Accessibility floor

Not optional, not announced.

- Contrast: 4.5:1 body, 3:1 large text. Sage on paper passes at 16px+ bold,
  verify before using it small.
- Visible keyboard focus on every interactive element, sage 2px outline
- Semantic headings in order, no skipped levels
- Alt text on every image, empty alt on decorative doodles
- Touch targets 44px minimum
- Works at 320px width
