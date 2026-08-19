# WYRD Designs: temporary site spec

Goal: a credible studio site to show the market this month. Single page plus
contact. Real content, no lorem, no fake clients.

Not the final site. Built to be replaced.

---

## Scope

| In | Out |
|---|---|
| One-page scroll, anchor nav | CMS |
| Contact form to email | Blog |
| WhatsApp click-to-chat | Case study pages |
| Instagram link | Client logo wall |
| Basic SEO and schema | Pricing page |
| Mobile-first responsive | Multi-language |

Target: shippable in one working session with Claude Code.

---

## Sections, in order

### 1. Nav

Sticky, transparent over paper, hairline bottom border on scroll.

Left: WYRD logo (squiggle mark plus wordmark, "designs" lockup).
Right: Work, Services, About, Contact. Contact is a sage-outlined button.

Mobile: logo plus hamburger, full-screen overlay, sage links, large type.

### 2. Hero

Eyebrow: `BANGALORE, INDIA`

H1: **We don't just build websites. We build everything around them.**

Sub: One team across strategy, content and production. Digital and creative,
online and offline.

Two actions: "Start a project" (sage fill) and "See what we do" (text link,
scrolls to services).

Doodle: monitor with paintbrush, top right, from the deck.

Motion: headline lines stagger in at 80ms. One moment, nothing else.

### 3. What we do

Eyebrow: `WHAT WE DO`

H2: **Everything a brand needs to be seen and remembered.**
("seen and remembered" carries the emphasis)

Eight services, two columns, four rows. Each row: icon, title, one grey line,
hairline rule below. Exact wording from `brand.md` section 3.

Icons: line weight 1.5px, sage, 24px. Lucide is fine.

Mobile: single column.

### 4. How we work

Eyebrow: `HOW WE WORK`

Four steps, numbered. Numbering is justified here because it is a real
sequence.

1. **Understand** Business, buyer, and what is actually blocking growth.
2. **Plan** Scope, timeline, and what success looks like, written down.
3. **Build** Strategy, content and technical execution, in-house.
4. **Measure** What moved, what did not, what changes next.

Layout: horizontal on desktop with a hairline connecting them, stacked on
mobile.

### 5. Who's behind this

Eyebrow: `WHO'S BEHIND THIS`

Copy from the deck, verbatim:

> WYRD Designs is a digital and creative studio covering what a brand needs to
> be seen, understood and remembered, online and offline. One team across
> strategy, content and production.

Three panels: Digital, Brand & Production, Growth & Campaigns, with the
groupings from `brand.md`. Card background, 4px radius.

Below, quiet line: `Strategy, content, and technical execution, handled in-house.`

**Name explainer**, small, sage, once only:
`WYRD. Old English for fate. Yes, it sounds like weird.`

Doodle in the panel gap.

### 6. Work

Placeholder until clearance. Do not fabricate.

Eyebrow: `SELECTED WORK`
H2: **Recent builds.**

Three cards. Sage panel, project type, sector, one line on outcome. No client
names until confirmed. If no content is cleared, cut this section entirely
rather than filling it with invented work.

### 7. Contact

Eyebrow: `TALK TO US`
H2: **Tell us what you are building.**

Form: name, email, phone, one select (what you need, mapped to the eight
services), message. Sage submit button. Server action to hello@wyrddesigns.in.
Honeypot field. Inline validation, plain error text, no red panic.

Beside it, the deck's contact block:

| STUDIO | EMAIL | TALK TO US |
|---|---|---|
| WYRD Designs | hello@wyrddesigns.in | +91 86603 33165 |
| WYRD Tech Pvt Ltd | | +91 82176 18082 |

WhatsApp button using the first number.

Squiggle doodle above the block, matching the deck.

### 8. Footer

Hairline top. Logo, one line of copy, Instagram link, `hello@wyrddesigns.in`,
`© 2026 WYRD Tech Pvt Ltd`.

Instagram: https://www.instagram.com/wyrddesigns/

---

## Copy that must not change

Headlines and service lines are locked to `brand.md`. Claude Code may write
connective copy but does not rewrite these.

---

## SEO for this build

- Title: `WYRD Designs | Digital and creative studio in Bangalore`
- Description: `Web, ecommerce, SEO, video, brand and events. One team across strategy, content and production. Bangalore, India.`
- OG image: paper background, wordmark, tagline, one doodle
- `LocalBusiness` JSON-LD, Bangalore, phone, email

---

## Acceptance

Ships when every item in `eval-checklist.md` passes.
