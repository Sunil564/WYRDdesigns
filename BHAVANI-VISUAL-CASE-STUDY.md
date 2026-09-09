# Bhavani Garments: visual-first case study

Supersedes `PROJECT-BHAVANI-GARMENTS.md`. That brief mapped the supplied copy into the existing template. This one restructures the page around visuals and cuts the copy to roughly a third.

Read `docs/brand.md` and `CLAUDE.md` first.

---

## 1. The principle

**Show the work. Caption it. Stop.**

The supplied case study runs about 500 words. This page should run about 150. Everything cut is either implied by a screenshot or is detail a genuinely interested reader will ask for in the enquiry.

The strongest asset available here is not generated imagery. It is **screenshots of the thing you actually built**. A screenshot of the live catalogue is verifiable evidence. A generated image of silk is decoration. Where a real screen can carry a point, use it and delete the paragraph that was explaining it.

This also resolves the imagery problem from the previous brief: the AI-generated silk and handloom images do not belong on this page at all. Not because they misrepresent, but because they are weaker than what is actually available.

---

## 2. Template extension needed

The case study template was built for three to five blocks alternating full-bleed and inset visuals, with body copy. This page needs more slots and two new types.

**Report the template's current structure before changing it.** Then extend it to support:

- **Device-framed screenshot.** A mobile screen rendered inside a simple phone outline, or a desktop screen in a browser outline. Without a frame, a screenshot on a white page reads as a floating rectangle.
- **Motion loop.** A short muted looping MP4, not a GIF. See section 6.
- **Paired visual.** Two images side by side on desktop, stacked on mobile.
- **Caption.** One or two lines under a visual, at `--text-body` in `--fg-muted`. Distinct from a body block.

Keep the extension minimal. These are four block types, not a page builder.

---

## 3. The page, block by block

Every visual slot below is a placeholder until the real asset arrives. Section 5 covers how they behave in the meantime.

### Header

**Title:** Bhavani Garments
**Meta row:** Retail, Tumkur, Karnataka · Catalogue website, digital marketing retainer · Build, Reach
**Year:** omitted, not supplied

**Hero statement:**
> Built the shopfront. Then filled it.

**Standfirst**, two lines, the only paragraph on the page:
> Three women's clothing showrooms in Tumkur. Strong walk-in trade, no online presence, and staff sending product photos one at a time from their own phones.

### VISUAL 1: the hero

Full bleed, 16:9 desktop, 4:5 mobile.

**What it should be:** the live catalogue site, desktop and mobile shown together. Browser frame on the left holding the homepage, phone frame overlapping it on the right holding a category view. Shot against a plain ground, no reflections, no gradient backdrops.

**Caption:** none. The hero speaks for itself.

### Block A: The catalogue

**Copy, two lines:**
> Browse by category, open a product, tap Enquire on WhatsApp. Name, price and size pre-fill into the chat.

**VISUAL 2:** Paired, device-framed mobile screenshots. Left: a category grid. Right: a single product page with the Enquire button visible.

**Caption:** Lady Nighty, Jeans Tops and Kurtis, Ladies Undergarments at launch.

### Block B: The handoff

This is the single most important visual on the page. It shows the whole idea in three seconds.

**Copy, one line:**
> The sale still closes where it always did. We removed the friction, not the relationship.

**VISUAL 3:** A motion loop, 3 to 5 seconds, muted, looping. Screen recording of a real phone: product page, thumb taps Enquire, WhatsApp opens with the message already filled in. That is the entire flow.

**Caption:** No cart, no checkout, no payment gateway. The client did not need ecommerce, so we did not build it.

### Block C: Owner-managed

**Copy, one line:**
> The owner adds products, sets prices, and toggles sizes. No developer call to change a price.

**VISUAL 4:** Desktop screenshot of the admin, product edit view. Blur or replace any real customer data. If nothing sensitive is on screen, leave it as captured.

**Caption:** Domain, hosting and every account in the client's name. No lock-in.

### Block D: Then, visibility

**Copy, two lines:**
> A website nobody finds is a brochure in a drawer. Bhavani Garments moved onto a monthly retainer after go-live.

**VISUAL 5:** Paired. Left: the Instagram grid, device-framed, showing the actual posts. Right: the Google Business Profile panel as it appears in search.

**Caption:** Seven posts and five reels a month, shot on location. Google Business Profile and local SEO carried the weight, because for three showrooms in Tumkur local search beats national reach.

### VISUAL 6: the work itself

Full bleed, 16:9 desktop, 4:5 mobile.

**What it should be:** a still from the reel shoots. Real garments, real store. This is the one slot where photography rather than a screen is right, and it is the only place the physical business appears.

**Caption:** none.

### Block E: The loop

The closing argument, and it should be a diagram rather than a paragraph.

**VISUAL 7:** Four labelled nodes connected by a line, drawn in the site's own design system rather than screenshotted:

`Instagram` → `Catalogue` → `WhatsApp` → `In store`

Use the hairline weight and the accent, and let the connecting line echo the Thread. This is a small SVG, not an asset to source.

**Copy, one line beneath it:**
> Every piece points at the next one. That is the whole design.

### Stack

A single line of meta at the foot of the page, in `--fg-muted` at `--text-label`, not a block:

> Next.js, TypeScript, Tailwind, Supabase, Cloudinary, Vercel.

Everything else about row-level security, image delivery and email record migration comes out. It is detail for an enquiry, not for a page.

### Outcome

**Does not render.** No outcome data was supplied. This is the template working as designed.

---

## 4. What was cut, and why it should stay cut

For the record, so nobody restores it:

- The full problem paragraph. Visual 3 shows the problem being solved, which is stronger than describing it.
- "Two problems, one business. Most agencies solve one." Good line, wrong page. It is a positioning argument and it belongs on the homepage, not inside a case study.
- The stack paragraph. Reduced to one meta line.
- The design paragraph. The screenshots are the design argument.
- The full retainer deliverables list. Reduced to the two numbers that matter.

If the operator wants any of these back, they can go in, but each one trades a paragraph against the page's pace.

---

## 5. Placeholders until assets arrive

None of these visuals exist yet. Until they do:

- Each slot renders the existing seeded `<Placeholder>` component at the correct aspect ratio, so layout and rhythm are real and reviewable now.
- Each carries `data-placeholder` and an entry in `docs/placeholders.md` stating exactly what should replace it, in the words of section 3.
- The motion loop slot renders a `<Placeholder>` still, not a video element, so nothing is loaded that does not exist.
- **Do not wire the generated silk imagery into this page.** It is the wrong subject for this client and weaker than the real screens. Leave those files where they are and note in `placeholders.md` that they are unused for this project.

The page should be fully reviewable in placeholder state. If the layout only works once real screenshots land, the layout is wrong.

---

## 6. Asset specification

For whoever captures these. This is the list the operator hands on.

| # | Asset | Format | Ratio | Notes |
|---|---|---|---|---|
| 1 | Hero, desktop plus mobile together | PNG or WebP | 16:9 and 4:5 | Plain ground, no reflections |
| 2 | Category grid and product page | PNG or WebP | mobile screens, paired | Real products, real prices |
| 3 | Product to WhatsApp handoff | MP4 and WebM | 9:16 | 3 to 5s, screen recording |
| 4 | Admin, product edit view | PNG or WebP | 16:10 | Blur any customer data |
| 5 | Instagram grid and Google Business Profile | PNG or WebP | paired | Real, current |
| 6 | Reel shoot still | JPG or WebP | 16:9 and 4:5 | Real garments, real store |

**Screenshot rules.** Capture at 2x device pixel ratio. Use real content, never lorem or test products. Nothing sensitive on screen: no customer names, no order data, no admin email addresses.

**Motion loop rules.** MP4 (H.264) and WebM, no audio track, under 400kb each. Not a GIF. A three-second GIF of a UI flow runs 4 to 6MB against roughly 200kb for the same loop as H.264, and mobile Lighthouse currently scores 100.

**Mobile legibility.** A full desktop screenshot at 412px is unreadable. Where a desktop screen is shown, either crop to the relevant region on mobile or swap to the mobile equivalent. Decide per slot and record the decision.

---

## 7. Performance

Every rule here exists because mobile Lighthouse is at 100 with a 0.9s LCP and that took several rounds to win.

- The hero visual must not become the LCP element. Text is.
- Everything below the fold is lazy loaded.
- The motion loop: `preload="none"`, `muted`, `playsinline`, `loop`, autoplay only when in viewport, pause when out.
- Under `prefers-reduced-motion`, the loop renders its poster still and the video never loads.
- Intrinsic dimensions on every image and video so CLS stays at 0.
- Measure Lighthouse mobile before and after. If it drops below 90, report it and stop rather than absorbing it.

---

## 8. Acceptance criteria

1. Template structure reported before extension. Four new block types added, no more.
2. Page renders fully in placeholder state, layout and rhythm reviewable without real assets.
3. Every visual slot carries `data-placeholder` and an entry in `docs/placeholders.md` describing its replacement.
4. Generated silk imagery not wired to this project. Noted as unused in `placeholders.md`.
5. Total body copy on the page under 200 words, excluding captions and meta. Report the count.
6. No year, no outcome block. Both absent by design.
7. Cluster mapping Build and Reach. The Reach filter chip enables from the list.
8. The loop diagram is drawn from design system tokens, not an image asset.
9. Fact audit updated: new proper nouns and numbers traced to the supplied case study. Criterion passes.
10. Banned-word grep clean.
11. CLS 0 on both form factors. Lighthouse mobile at or above 90.
12. No em dash characters.
13. Full suite green before push.
14. Screenshots of the full case study at 1440 and 412, in placeholder state.

## 9. Judge by looking

With every visual still a placeholder, does the page read as a case study with pictures missing, or as a page that needs its copy back? If the second, the cut went too far and you should say which block needs a sentence returned.
