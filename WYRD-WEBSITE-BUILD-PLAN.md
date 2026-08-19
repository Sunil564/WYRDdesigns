# WYRD Designs: Full Website Build Brief

Standalone brief. Assume no access to prior conversation. Read this whole file before writing any code.

---

## 0. SOURCE MATERIALS, READ BEFORE ANYTHING ELSE

### 0.1 The source folder

```
M:\WYRD Projects\WYRD Website\Codebase2
```

This folder is the authoritative source of brand truth. Task one, before any scaffolding, before any code:

1. Recursively list the folder. Do not skip subfolders.
2. Read every text, markdown, and document file in it.
3. Inventory every image and asset file: name, format, dimensions, whether it is vector or raster, and what you believe it is.
4. Write the result to `docs/source-inventory.md` in the new repo, with a line per file stating what it is and where it is used in the build. Anything you cannot identify goes in an `UNIDENTIFIED` list at the bottom for the operator to resolve. Do not guess what an unlabelled asset is and use it anyway.

Expected to be present, though verify rather than assume:
- `brand.md` and possibly `design-system.md` or `engineering.md`
- WYRD brand logo and wordmark files
- Client logo files

### 0.2 Precedence

`brand.md` from `Codebase2` **overrides this brief** wherever the two conflict on brand matters: voice, positioning, colour, type, naming, tone, taglines, service descriptions, any stated fact.

This brief governs architecture, structure, motion, and build process. `brand.md` governs what the brand is and how it speaks.

If `brand.md` contradicts this brief on a brand matter, follow `brand.md`, and write an ADR recording the conflict and the resolution. If a conflict is genuinely ambiguous, or if `brand.md` contradicts this brief on architecture, stop and ask the operator.

If `design-system.md` or `engineering.md` are present in the source folder, the same precedence applies within their scope: they override sections 4, 5, and 7 of this brief.

Copy all such documents into `docs/` in the new repo as the first commit, unmodified, so the source of truth lives in version control.

### 0.3 Brand logo handling

Locate the WYRD logo and wordmark in the source folder.

- If a vector file exists (SVG, AI, EPS, PDF), use it. Convert to optimised inline SVG. Strip metadata, set `fill="currentColor"` so it inherits theme colour, add a `<title>` for accessibility.
- If only raster exists, export to WebP at 3x the largest rendered size, plus a PNG fallback, and record in an ADR that a vector version should replace it.
- Produce these variants: header mark, footer wordmark, favicon set (16, 32, 180, 512), and the OG image mark.
- Do not redraw, recolour, restretch, or reinterpret the logo. If the supplied logo does not work against the dark canvas, say so in your phase report rather than modifying it.
- If no logo file exists in the folder, set the wordmark in Satoshi per section 4, and write an ADR stating that a real mark is pending.

### 0.4 Resolved inputs

All resolved. Nothing to ask the operator. Do not prompt for these.

1. `CONTACT_EMAIL` = `hello@wyrddesigns.in`. Use this for the form recipient, the `mailto:` link on `/contact` and in the footer, and the `Organization` structured data email field.

2. `PRODUCTION_DOMAIN` = not yet registered. Do not invent one and do not hardcode a guess anywhere.
   - Read it from `process.env.NEXT_PUBLIC_SITE_URL`, falling back to `http://localhost:3000` in development.
   - Set that variable in `.env.example` with a comment stating it is pending.
   - `metadataBase`, the sitemap, `robots.txt`, canonical tags, and OG image URLs all derive from that single variable. When the domain is registered, one environment variable changes and everything follows. Verify there is exactly one place in the codebase where the origin is defined.
   - Note the pending domain in `docs/BLOCKERS.md`.

3. `CURRENT_SITE_URL` = none usable. The existing site was an early trial and holds no verified facts. **Do not scrape anything. Do not attempt to find or fetch a previous WYRD site.** Every fact on the new site comes from the `Codebase2` source folder or from the operator. Nothing else is a source.

Because there is no legacy content to inherit, the fact base is narrow by definition. That is expected, not a problem to solve. Any section whose content cannot be sourced from `Codebase2` renders with placeholder content that is visibly generic (a `<Placeholder>` visual, lorem-free neutral copy from this brief) or does not render at all. It never renders with a plausible-sounding invention.

---

## 1. MANDATE

Rebuild from zero. The previous site was an early trial and carries nothing worth keeping: no structure, no components, no styling, no content model, and no verified facts. Do not look for it, do not fetch it, do not reference it. The only source of truth is the `Codebase2` folder and the operator.

**Company:** WYRD Designs, trading name of WYRD Tech Pvt Ltd. Bangalore, India.

**Services:** web and ecommerce development, digital marketing and social, SEO, corporate film and video, explainer video, brand and creative direction, exhibitions and events, promotional campaigns.

**Buyers:** Indian SMB and mid-market founders (primary), United States (secondary). Founders and marketing heads, not enterprise procurement. They decide fast, they respond to evidence of taste, they distrust jargon.

**The constraint that shapes everything:** the studio is new and has a short list of completed projects. The site must not pretend otherwise. So: design-heavy, information-light. The site itself is the portfolio piece. Every section must be worth looking at even when it says very little. Volume of work is replaced by quality of execution.

**Hard rules:**
- Never invent a client name, a project, a testimonial, a statistic, a founding year, a team size, or a price.
- No prices anywhere on the site. Pricing is a conversation.
- No long em dashes in any copy, code comment, or document. Use a comma, a colon, or a full stop.
- No agency cliches. Banned outright: "craft", "bespoke digital experiences", "passionate about", "elevate your brand", "in today's fast paced world", "solutions", "synergy", "end-to-end partner", "we believe".

---

## 2. BRAND FOUNDATION

### 2.1 The name

WYRD is Old English for fate. It also sounds like weird. The site answers to both, in one line, once, and never mentions it again. Do not apologise for it. Do not over-explain it. Never write a sentence about the name that contains "but".

### 2.2 The organising idea: The Thread

In the old sense, wyrd was a thread. Spun, measured, cut. This is not decoration, it is the structural spine of the entire design and motion system:

- A single hairline runs vertically through the whole homepage, drawn progressively as the user scrolls.
- At the capabilities section it splits into four strands, one per service cluster.
- At the contact section the strands reconverge into one line that terminates at the form.

This gives every motion decision a reason to exist. Motion that cannot be justified by the thread metaphor or by legibility gets cut.

### 2.3 Voice

Confident, plain, unhurried. Short sentences. Concrete nouns. Says the thing and stops. Never sells twice in the same paragraph.

Good: "You will talk to the people doing the work."
Bad: "We pride ourselves on offering our clients direct, unfettered access to our senior creative talent."

---

## 3. SITE MAP

Five routes. No more. A small studio with a huge navigation reads as insecure.

```
/                 Home            the whole story in one scroll
/work             Work            short list, honestly framed
/work/[slug]      Case study      template, built once, populated with placeholders
/studio           Studio          who, where, how we work, the name
/contact          Contact         form plus direct details
```

Legal pages `/privacy` and `/terms` render from MDX, linked in footer only, minimal styling.

Navigation: `Work`, `Studio`, `Contact` plus a `Start a project` button. Logo left. That is the entire header.

---

## 4. DESIGN SYSTEM

**Precedence check first.** If `brand.md` or `design-system.md` from the source folder in section 0.1 specifies colour, type, spacing, or logo treatment, those values win over everything in this section. Use this section only to fill the gaps they leave silent. Record every value you took from the supplied documents and every value you took from this brief, in `docs/design-system.md`, so the origin of each token is traceable.

Write the reconciled result to `docs/design-system.md`, then implement it as Tailwind v4 theme tokens in `app/globals.css`.

### 4.1 Colour

Dark canvas. This is a studio that does film and events, dark reads correctly and makes placeholder imagery look intentional rather than unfinished.

| Token | Value | Use |
|---|---|---|
| `--color-void` | `#08080A` | page canvas |
| `--color-surface` | `#101013` | cards, raised blocks |
| `--color-surface-2` | `#191920` | hover state, inset blocks |
| `--color-line` | `#26262E` | hairlines, borders, the Thread at rest |
| `--color-paper` | `#F2EFE9` | primary text, warm off-white, never pure white |
| `--color-muted` | `#8B8B95` | secondary text, labels, meta |
| `--color-signal` | `#FF521F` | accent, one colour only |
| `--color-signal-dim` | `#B33714` | accent pressed/secondary state |

One accent. Do not add a second. Do not add a gradient palette. If something needs emphasis and signal orange is already used nearby, use scale and weight instead of a new colour.

Light mode: not built. Single dark theme. Record this in an ADR.

### 4.2 Type

Two families, both free for commercial use, self-hosted via `next/font/local`. Do not load from a CDN.

- **Display and UI: Satoshi Variable** (Fontshare). Weights 300 to 900. Used for everything structural.
- **Editorial accent: Instrument Serif, Italic** (Google Fonts). Used only for the manifesto lines and pull quotes. Never for UI, never for body copy, never more than one phrase per viewport.

Scale, fluid via `clamp()`:

| Token | Min | Max | Use |
|---|---|---|---|
| `--text-mega` | 3rem | 9.5rem | hero headline only |
| `--text-display` | 2.25rem | 5rem | section headlines |
| `--text-title` | 1.5rem | 2.5rem | card and subsection titles |
| `--text-lead` | 1.125rem | 1.5rem | intro paragraphs |
| `--text-body` | 1rem | 1.125rem | body |
| `--text-label` | 0.75rem | 0.8125rem | eyebrows, meta, uppercase, tracking `0.12em` |

Rules: tighten tracking as size grows, `-0.03em` at mega, `0` at body. Line height `0.95` at mega, `1.6` at body. Headlines cap at 3 lines. Body measure caps at 68 characters.

### 4.3 Space and grid

8px base. Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256.

12 column grid, max content width 1440px, gutters 24px mobile / 48px desktop. Sections get 128px vertical padding mobile, 192px desktop.

### 4.4 Other

- Radii: `0` for structural blocks, `4px` for inputs, `999px` for pills and buttons. No 12px rounded card look.
- Borders: 1px `--color-line` only. No shadows anywhere. Depth comes from surface value shifts, not from blur.
- Grain: a single tiling noise texture at 3 to 5 percent opacity over the whole page, fixed position, `pointer-events: none`. This is what stops the dark canvas reading as flat.

---

## 5. MOTION SYSTEM

Write to `docs/motion.md`. Motion is the product here. It still has to be disciplined.

### 5.1 Tokens

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | default for entrances |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | position and layout changes |
| `--dur-fast` | 200ms | hover, micro |
| `--dur-base` | 500ms | most entrances |
| `--dur-slow` | 900ms | large reveals, hero |

### 5.2 Global rules

- Every scroll-triggered entrance fires once, at 20 percent element visibility, and never re-fires on scroll up.
- Stagger between siblings: 60ms. Between characters in a headline: 18ms.
- Nothing animates for longer than 1.2s. Nothing loops faster than 4s.
- Every animated section pauses its RAF loop when out of viewport, via `IntersectionObserver`.
- `prefers-reduced-motion: reduce` is not an afterthought: it must be implemented in the same commit as each effect. Reduced motion means all content renders in final state instantly, all loops stop, all canvases do not mount. The site must be fully usable and still look composed with zero motion.

### 5.3 The Thread implementation

A fixed-position SVG overlay spanning the homepage, `pointer-events: none`, sitting above the grain and below content.

- Path drawn with `stroke-dasharray` / `stroke-dashoffset`, offset driven by scroll progress with GSAP ScrollTrigger `scrub: 1`.
- Stroke `--color-line` at rest. A 240px travelling segment of `--color-signal` follows the current draw head, so the live tip of the thread glows and the drawn body sits back.
- At the capabilities section the path branches into four, each strand terminating at its cluster block.
- Below 1024px viewport width: render a single straight vertical line only, no branching. Complexity here is not worth the mobile layout cost.
- Reduced motion: render the full path at rest colour, undrawn animation skipped.

---

## 6. PAGE SPECIFICATIONS

### 6.1 Home

Nine sections, in this order.

---

**S1. Hero**

Full viewport height. Content vertically centred, left aligned on desktop, on a 12 column grid starting at column 2.

Layout:
- Eyebrow label: `DESIGN AND TECHNOLOGY STUDIO, BANGALORE`
- Headline at `--text-mega`: **We don't just build websites. We build everything around them.**
- Lead paragraph, max 60ch: `Web, film, search, social, and the room it all happens in. One studio, one thread through the whole thing.`
- Two actions: `Start a project` (filled, signal) and `See what we do` (text link with animated underline, scrolls to S3)

Motion, three layers, built in this order:
1. **Headline reveal.** Split to characters using GSAP SplitText. Characters animate from `opacity: 0, y: 40%, rotateX: -35deg` with 18ms stagger, `--dur-slow`, `--ease-out`. Mask each line with `overflow: hidden` so characters rise out of a hard edge. Eyebrow fades in 200ms before, lead and buttons 300ms after the headline finishes.
2. **Particle field.** Built per section 7b.2A. Full tier gets the WebGL shader field. Reduced tier gets a 2D canvas fallback: roughly 90 particles on desktop, 40 on tablet, drifting on a low-amplitude noise field, sizes 1 to 3px, colours `--color-line` and `--color-muted` at 20 to 50 percent alpha, one in twelve in `--color-signal`, cursor repulsion within a 180px radius easing back over 1.2s, hard cap 400 live particles. Static tier mounts nothing.
   - Touch and coarse pointer devices: ambient drift only, no cursor interaction.
3. **Thread origin.** The Thread begins at the bottom centre of the hero and is the visual handoff into S2.

Acceptance: headline is legible at every breakpoint from 320px up, no CLS from the type animation (reserve final layout box before animating), the canvas never blocks a click on either button, and no Three.js bytes are downloaded on the Reduced or Static tier.

---

**S2. Positioning statement**

Single centred block, generous vertical space, no imagery. Text at `--text-display`, with one phrase in Instrument Serif italic.

Copy:
> Most studios hand you a website and wish you luck. *The website is one surface.* The film, the search results, the ads, the booth at the trade show, the way the whole thing holds together: that is the work.

Motion: line by line mask reveal on scroll, 120ms stagger between lines. The italic phrase reveals last, 400ms after the rest, in `--color-paper` while surrounding text sits at 70 percent opacity until it completes.

---

**S3. Capabilities**

The core section. One spine, four strands.

Structure:
- Section eyebrow: `WHAT WE DO`
- Spine block, full width, sitting above the four: **Brand and creative direction.** With the line: `The decisions that everything else follows from. This sits on top of every project, including the ones that are only one thing.`
- Then four cluster blocks in a 2x2 grid on desktop, stacked on mobile. Each is a bordered surface block, no rounding, with: a two-digit index, a one-word name, a one-line definition, and the service list.

| Index | Name | Line | Services |
|---|---|---|---|
| 01 | BUILD | Sites and stores that hold up under real traffic. | Web development, Ecommerce development |
| 02 | REACH | Getting found, and getting chosen. | SEO, Digital marketing, Social, Promotional campaigns |
| 03 | SHOW | Moving pictures that explain and persuade. | Corporate film and video, Explainer video |
| 04 | STAGE | The physical version of the brand. | Exhibitions, Events |

Motion:
- The Thread branches into four here, one strand landing on each block. Strand draw is scrubbed to scroll.
- Blocks enter with a 60ms stagger, `y: 32px` and opacity, once.
- Hover: block background lifts `--color-surface` to `--color-surface-2` over `--dur-fast`, the index digit shifts to `--color-signal`, and a hairline sweeps left to right across the block's top edge. No scale transforms, no shadow.
- Cursor over the grid: a soft radial highlight follows the pointer across the block surfaces, implemented with a CSS custom property updated on `pointermove`, not a per-frame JS repaint.

---

**S4. Selected work**

Honest framing. Do not manufacture volume.

- Eyebrow: `SELECTED WORK`
- Headline: `A short list, on purpose.`
- Three project cards in an asymmetric layout: card 1 spans 7 columns and is tall, cards 2 and 3 stack in the remaining 5 columns. On mobile they stack full width.
- Each card: placeholder visual, project name, one-line description, service tags, year. All placeholder until real data is supplied.
- Link: `All work` to `/work`.

Motion: cards enter with staggered mask reveal, the visual scaling from `1.12` to `1` inside a fixed frame so the frame never moves. On hover, the visual scales to `1.04` over `--dur-base` and the title shifts right by 8px. Cursor over a card swaps the native cursor for a `VIEW` label that follows the pointer with 0.15 lerp smoothing.

---

**S5. Client logos**

Only section that uses real supplied assets.

- Eyebrow: `WORKED WITH`
- A continuous marquee, two rows moving in opposite directions, slow, roughly 40s per full pass. Pause on hover.
- Logos rendered monochrome at `--color-muted`, moving to `--color-paper` on hover.
- Edges masked with a `linear-gradient` fade to `--color-void` so logos do not hard-cut at the viewport edge.
- If fewer than 8 logos are available, drop to a single centred static row instead of a marquee. A marquee with 4 logos looks like a marquee with 4 logos.

Asset handling: read client logo source files from the `Codebase2` folder in section 0.1, per the inventory you wrote to `docs/source-inventory.md`. For each file: convert to SVG if vector, otherwise trim whitespace and export to WebP at 2x the display height. Normalise all to a consistent optical height, not a consistent bounding box. Output to `public/logos/`. Write a manifest at `content/clients.ts` with `{ name, file, alt }`. Use the real company name for `alt`. Never rename or invent a client.

---

**S6. Process**

Four steps, horizontal on desktop, connected by the Thread running through them.

| Step | Name | Line |
|---|---|---|
| 01 | Understand | We ask what the business actually needs before we discuss what to make. |
| 02 | Direct | We decide the idea and the look, and we write the decisions down. |
| 03 | Make | Design, build, shoot, install. Whatever the job needs. |
| 04 | Hand over | You get the files, the access, and someone who picks up the phone. |

Motion: on scroll, the Thread draws left to right through the four nodes, each step's text revealing as the thread reaches its node. Scrubbed to scroll progress, so the user controls the pace. Below 1024px, stack vertically and reveal on entrance instead of scrub.

---

**S7. Studio strip**

Short. Three facts, no photos of laptops, no stock imagery of people pointing at whiteboards.

Copy:
> We are a small studio in Bangalore. You will talk to the people doing the work. There is no account layer between you and the person making the thing.

Plus a link to `/studio`.

Motion: minimal. Text reveal only. The site needs a quiet section here before the close.

---

**S8. Contact call to action**

Full viewport. The four Thread strands reconverge into one line that terminates at the button.

- Headline at `--text-mega`: `Tell us what you are making.`
- Button: `Start a project`, magnetic (translates up to 12px toward the cursor within a 90px radius, springs back on leave, disabled on touch and reduced motion).
- Direct email link below, in `--color-muted`.

---

**S9. Footer**

Three columns: wordmark and one line, navigation, contact and social. Bottom bar: `WYRD Tech Pvt Ltd`, year, privacy, terms.

Include a large wordmark treatment: `WYRD` set at viewport width, clipped at the bottom edge of the page, in `--color-surface-2`. Costs nothing, closes the page with weight.

---

### 6.2 `/work`

- Header: `Work`, plus one line: `Selected projects. More on request.`
- Filter row by cluster: `All`, `Build`, `Reach`, `Show`, `Stage`. Filtering uses layout animation so cards move to new positions rather than popping.
- Grid of project cards, same card component as S4.
- If fewer than 6 real projects exist, do not pad the grid. Render what exists and close the page with the contact call to action.

### 6.3 `/work/[slug]`

Template, built once, populated with placeholder content and clearly marked as such in the content file.

Structure: full-bleed hero visual, project title, meta row (client, year, services, role), the brief in one paragraph, what we did in three to five short blocks with alternating full-bleed and inset visuals, an outcome block that is omitted entirely if no real outcome data exists, and next/previous project navigation.

Never write a fabricated outcome metric. If there is no number, the section does not render.

### 6.4 `/studio`

- Opening statement, large type.
- The name, once: `WYRD is Old English for fate. It also sounds like weird. We answer to both.` Followed by: `Fate was a thread. Something spun, measured, and cut. A brand works the same way. Every choice about how you show up gets woven in. We handle the whole length of it.`
- Capabilities recap, compact list form.
- How we work: expanded version of S6.
- Team: only if real names are supplied. If not, this section does not exist.
- Location and contact.

### 6.5 `/contact`

Two columns. Left: headline, direct email, phone if a real one exists, Bangalore address if a real one exists, socials. Right: the form.

Form fields:
- Name (required)
- Company
- Email (required, validated)
- What do you need (multi-select chips: Build, Reach, Show, Stage, Direction, Not sure yet)
- Timeline (select: Under 4 weeks, 1 to 3 months, 3 months plus, Exploring)
- Budget (select, optional, INR brackets shown to visitors resolving to India, USD brackets otherwise, based on `Accept-Language` and timezone with a manual currency toggle. If this feels fragile, ship the toggle only and default to INR.)
- Message (textarea, required)

Handling: Next.js Server Action, validated with Zod on the server, submitted to Resend for email delivery to `CONTACT_EMAIL`. Honeypot field plus a timing check for spam. Never a third party embedded form iframe.

States: idle, submitting (button label swaps, disabled), success (form replaced by a short confirmation, not an alert), error (inline, human wording, retains entered values).

---

## 7. TECH STACK

Decided. Do not substitute without writing an ADR explaining why.

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript strict | Static-first, good defaults, deploys clean |
| Styling | Tailwind CSS v4, CSS-first `@theme` config | Tokens live in CSS, no JS config drift |
| Scroll motion | GSAP 3 with ScrollTrigger and SplitText | Scrubbed scroll and per-character splitting, both needed. GSAP plugins are free as of 2025, verify current licence before install and record in the ADR |
| Component motion | Motion (the `motion` package, successor to Framer Motion) | Layout animation, shared element transitions, page transitions |
| WebGL | Three.js via React Three Fiber, plus `@react-three/drei` | GPU particle fields and shader image transitions. See section 7b for the mandatory performance gate |
| Shaders | Hand-written GLSL, plus `glsl-noise` for curl and simplex | Instanced points and displacement transitions cannot be done with DOM |
| Particles | R3F instanced points with a custom shader on desktop, 2D canvas fallback below | GPU handles tens of thousands of points, canvas handles hundreds |
| Smooth scroll | Lenis | GSAP ScrollTrigger integrates cleanly with it |
| Content | Local TypeScript modules plus MDX for long-form | No CMS. Zero cost, zero latency, editable by the operator later |
| Forms | Server Actions plus Zod plus Resend | No third party form service |
| Icons | Lucide React | Consistent, tree-shakeable |
| Fonts | `next/font/local`, self-hosted | No CDN request, no FOUT |
| Hosting | Vercel | Matches the framework |
| Analytics | Vercel Analytics plus Vercel Speed Insights | No cookie banner needed |

Do not install: a UI kit, a component library, a CMS, jQuery, a carousel library, a particle library (tsparticles, particles.js, and equivalents are banned, the WebGL layer replaces them), or any animation library beyond GSAP, Motion, and Three.js.

---

## 7b. WEBGL LAYER

The site is judged on how it feels, and the target is the top tier of studio sites, not a well-behaved brochure. That means real GPU work, not CSS pretending. This section defines where WebGL earns its place and where it does not.

### 7b.1 The honest tradeoff, read this before building

Three.js plus R3F plus drei is roughly 150 to 250kb gzipped depending on what you import. A WebGL hero and a Lighthouse mobile Performance score of 90 are not both achievable. Do not pretend otherwise in your phase report.

The resolution is tiering, not compromise:

| Tier | Condition | What renders |
|---|---|---|
| **Full** | Desktop, pointer is fine, `deviceMemory >= 4`, WebGL2 available, `prefers-reduced-motion` unset | Full WebGL scene, shader transitions, postprocessing |
| **Reduced** | Tablet, or low memory, or WebGL2 unavailable, or pointer is coarse | 2D canvas particle fallback, CSS and Motion transitions only, no Three.js bundle loaded at all |
| **Static** | `prefers-reduced-motion: reduce` | No canvas, no loops. Final state, composed, still good looking |

Tier is decided once on mount by a `useRenderTier()` hook. Three.js is loaded with `next/dynamic` and `ssr: false`, imported **only** inside the Full tier branch, so the Reduced and Static tiers never download it. This is the single most important performance decision in the build. Verify it by checking the network tab on a throttled mobile profile and confirming zero Three.js bytes.

Import Three.js modules individually. Never `import * as THREE`. Never import all of drei.

### 7b.2 Where WebGL is used

Three places. Nowhere else. If a fourth idea appears, it needs an ADR arguing why DOM cannot do it.

**A. Hero particle field.** Replaces the 2D canvas spec in section 6.1 for the Full tier.
- 20,000 to 40,000 instanced points, single draw call, `THREE.Points` with a custom `ShaderMaterial`.
- Vertex shader: positions driven by curl noise sampled over time, giving slow organic drift rather than linear travel. Points near the cursor are displaced along the vector away from it, force falling off by inverse square, then eased back to their noise-field position.
- Fragment shader: soft circular falloff, additive blending, colour mixed between `--color-line`, `--color-muted`, and `--color-signal` by a per-point random attribute so roughly one in twelve points carries the accent.
- Cursor position passed as a uniform, lerped at 0.08 so the field trails the pointer rather than snapping to it.
- All animation in the shader. No per-frame JavaScript loop over particles. If you find yourself writing a `for` loop over positions on the CPU, you have built it wrong.
- Postprocessing: a single subtle bloom pass on the accent points only. One pass, nothing else. Postprocessing stacks are where frame budgets die.

**B. Work card transitions.** Section 6.4 and the `/work` grid.
- Each project visual rendered to a WebGL plane rather than an `<img>` in the Full tier.
- On hover: a displacement shader pushes the image along a noise map from the cursor entry point, with a slight RGB channel offset at the leading edge. Returns on leave. Roughly 600ms, eased.
- On scroll: vertex positions curve on the Y axis by scroll velocity, so cards bend slightly as they move and settle flat when scrolling stops. Subtle. If it reads as a gimmick, halve the amplitude.
- Reduced tier: Motion `whileHover` scale and a CSS filter. Still good. Not the same.

**C. Page transitions.** Between routes.
- Full tier: the outgoing page renders to a render target and dissolves through a noise threshold while the incoming page resolves through the same mask, in the direction of the Thread. Roughly 700ms.
- Reduced tier: Motion `AnimatePresence` crossfade with a 24px Y offset.

### 7b.3 Where WebGL is not used

Not for text. Not for layout. Not for the Thread, that stays SVG. Not for the client logo marquee, that stays CSS transform. Not for any interface element a user must click, read, or type into. WebGL sits behind and around the content, never in front of it as the content.

### 7b.4 Rules

- One `<Canvas>` per page maximum. Shared across sections via a fixed-position canvas and per-section scenes, not one canvas per component.
- `frameloop="demand"` where a scene is not continuously animating. The hero is continuous, the work cards are not.
- Every scene pauses on `IntersectionObserver` exit and on `document.hidden`.
- DPR clamped: `dpr={[1, 2]}`. Never render at 3x on a high density display, the cost is quadratic and the gain is invisible.
- Dispose geometries, materials, and textures on unmount. Memory leaks in R3F are the default, not the exception.
- Textures: WebP, power of two where practical, `generateMipmaps` off for full screen planes.
- Frame budget: the hero must hold 60fps on a 2021 mid-range laptop and must not drop below 30fps on any Full tier device. If it cannot, cut particle count before cutting anything else.
- Ship a WebGL context loss handler. Losing context should fall back to the Reduced tier, not show a black rectangle.

---

## 8. REPO STRUCTURE

```
app/
  layout.tsx                 fonts, grain, thread mount, analytics
  globals.css                @theme tokens, base layer, utilities
  page.tsx                   home, composes sections
  work/page.tsx
  work/[slug]/page.tsx
  studio/page.tsx
  contact/page.tsx
  actions/submit-brief.ts    server action
components/
  sections/                  Hero, Positioning, Capabilities, Work, Clients, Process, StudioStrip, ContactCta, Footer
  ui/                        Button, Chip, Field, Marquee, Eyebrow, Reveal, MagneticButton, CursorLabel
  motion/                    Thread.tsx, ParticleField.tsx, SplitReveal.tsx, useLenis.ts, useReducedMotion.ts, useInView.ts
  layout/                    Header, Container, Grid, Section
content/
  site.ts                    nav, meta, contact details, socials
  services.ts                the four clusters plus direction
  projects.ts                project data, placeholder flagged
  clients.ts                 logo manifest
  process.ts
  legal/privacy.mdx, terms.mdx
lib/
  utils.ts, seo.ts, validation.ts
public/
  fonts/, logos/, noise.png, og/
docs/
  brand.md, design-system.md, motion.md, engineering.md
  decisions/NNNN-title.md    ADRs
```

Every architectural decision goes into `docs/decisions/` as a numbered ADR with: context, options considered, decision, consequences. Minimum ADRs required by the end of the build, listed in section 12.

---

## 9. PLACEHOLDER ASSET STRATEGY

Do not use stock photography. Do not use Unsplash or Picsum URLs. Both make a design-heavy site look like a template.

Build a `<Placeholder>` component that generates deterministic abstract visuals from a string seed:
- A seeded PRNG drives a canvas or SVG render of layered soft gradients in the brand palette, plus the site grain, plus a faint grid overlay.
- Same seed always produces the same image, so layouts are stable across reloads and builds.
- Props: `seed`, `aspect`, `variant` (`gradient` | `mesh` | `lines`).
- Rendered at build time to static files where possible to avoid client cost.

For video placeholders: a muted, looping, autoplaying `<video>` is not required. Use a `Placeholder` still with a play affordance and a subtle Ken Burns style slow scale drift on the still. This reads as intentional and ships at zero bandwidth cost. When real footage arrives, swap the component.

Every placeholder must be findable later: tag each with a `data-placeholder` attribute and list them in `docs/placeholders.md` with file path and what should replace it.

---

## 10. BUILD PHASES

Do not build out of order. Report against acceptance criteria at the end of each phase before starting the next.

### Phase 0: Source ingestion
Execute section 0 in full before writing any application code. Inventory the `Codebase2` folder, read every supplied document, copy `brand.md` and any sibling documents into `docs/` unmodified, write `docs/source-inventory.md`, and process the WYRD logo and wordmark into the variants listed in 0.3. Then reconcile the supplied brand documents against sections 2, 4, and 5 of this brief and write an ADR for every conflict resolved.

*Accepts when:* `docs/source-inventory.md` lists every file in the source folder with an identification, supplied brand documents are committed to `docs/` byte-identical to their source, logo variants are generated and render correctly against `--color-void`, every conflict between supplied documents and this brief has an ADR, nothing is listed as `UNIDENTIFIED` without being flagged to the operator in the phase report.

### Phase 0b: Scaffold and documentation
Next.js 15 app, TypeScript strict, Tailwind v4, ESLint, Prettier. Write `docs/design-system.md`, `docs/motion.md`, `docs/engineering.md`, reconciled per Phase 0. Do not overwrite a supplied `brand.md`, extend it in a separate file if it needs additions. Set up `docs/decisions/`. Install fonts locally. Commit.

*Accepts when:* app builds and serves, docs exist and reconcile correctly with the supplied sources, supplied `brand.md` is unmodified, fonts load with no network font request, `npm run build` passes with zero type errors.

### Phase 1: Tokens and primitives
All colour, type, space tokens as Tailwind v4 `@theme` variables. Build `Container`, `Grid`, `Section`, `Eyebrow`, `Button`, `Chip`, `Field`. Build the grain overlay. Build `useReducedMotion`, `useInView`, `Reveal`.

*Accepts when:* a token showcase route renders every token and primitive, no hardcoded hex value or px font size exists anywhere outside `globals.css`, `Reveal` fires once and respects reduced motion.

### Phase 2: Shell
Header with scroll-aware behaviour (transparent over hero, solid `--color-surface` with a bottom hairline after 80px scroll), mobile menu (full screen overlay, staggered link entrance), Footer, Lenis smooth scroll wired to GSAP ScrollTrigger.

*Accepts when:* header transitions correctly, mobile menu traps focus and closes on Escape and on route change, Lenis does not break anchor links or in-page scroll to a hash.

### Phase 2b: Render tiering and WebGL foundation
Build `useRenderTier()` per section 7b.1. Set up the shared `<Canvas>` with dynamic import, `ssr: false`, DPR clamp, demand frameloop, disposal on unmount, and a context loss handler. Build the 2D canvas fallback renderer. Prove the tier split with a throttled network trace before building anything on top of it.

*Accepts when:* Full tier loads Three.js and Reduced and Static tiers download zero Three.js bytes (verify in the network tab, this is the criterion the whole performance budget rests on), forcing each tier manually renders the correct branch, context loss falls back to Reduced rather than a black rectangle, no memory growth across ten mount and unmount cycles.

### Phase 3: Hero
Full spec from 6.1 S1. Build the three layers in the order given, verifying each before adding the next.

*Accepts when:* type animation causes zero CLS, the WebGL field holds 60fps on a mid-range laptop and never drops below 30fps on any Full tier device, the Reduced tier canvas fallback renders correctly, Static tier mounts no canvas at all, all particle motion happens in the shader with no CPU loop over positions, canvas blocks no clicks, coarse pointer fallback works with no console errors.

### Phase 4: Home sections
S2 through S9 in order. The Thread is built last, after all sections exist and their positions are stable.

*Accepts when:* every section matches its spec, the Thread draws correctly through all sections at all breakpoints above 1024px and falls back to a straight line below, no section re-triggers its entrance on scroll up.

### Phase 5: Inner pages
Work index with filtering, case study template, Studio, Contact with working form.

*Accepts when:* form submits and delivers to `CONTACT_EMAIL`, validation errors render inline and preserve input, filtering animates position rather than popping, case study template renders correctly with a project that has no outcome data (section omitted, not empty).

### Phase 6: Polish
Page transitions, 404 page, OG image generation via `next/og`, favicon set, sitemap, robots, structured data (`Organization` and `LocalBusiness`, only with verified real details). Every absolute URL derives from `process.env.NEXT_PUBLIC_SITE_URL` per section 0.4, since the production domain is not yet registered.

*Accepts when:* every route has a unique title and meta description, OG images render, sitemap lists all routes, no structured data field contains an unverified value, and grepping the codebase for a hardcoded domain returns nothing.

### Phase 7: Verification and deploy
Run the full global acceptance checklist in section 11. Fix everything failing. Deploy to Vercel.

---

## 11. GLOBAL ACCEPTANCE CRITERIA

Report pass or fail on each, individually, with specifics on failures. Do not report a phase complete without this.

**Performance**

Budgets are per tier. A single blended number hides the thing that matters. Report each separately.

1. Lighthouse Performance, mobile (Reduced tier, no Three.js): **90 or above**. This is the number that must not slip, it is what most Indian SMB visitors will experience.
2. Lighthouse Performance, desktop (Full tier, WebGL): **85 or above**. Lower than a static site on purpose. Do not chase 95 here by gutting the visual work, and do not report a fake 95 by testing the Reduced tier and calling it desktop.
3. LCP under 2.0s on mobile, under 2.5s on desktop. CLS under 0.05 on both. INP under 200ms on both. The WebGL canvas must never be the LCP element, text is.
4. JS shipped on `/`: under **250kb** gzipped on the Reduced tier, under **500kb** gzipped on the Full tier. If Full exceeds 500kb, the cut comes from drei imports and postprocessing before it comes from particle count.
5. **Zero Three.js bytes on the Reduced and Static tiers.** Verified in the network tab under a throttled mobile profile. If this fails, nothing else in this list matters.
6. All DOM animation runs on `transform` and `opacity` only. No animated `width`, `height`, `top`, `left`, or `margin` anywhere.
7. Every RAF loop and every WebGL scene pauses on viewport exit and on `document.hidden`.
8. Hero holds 60fps on a 2021 mid-range laptop, never below 30fps on any Full tier device.
9. No WebGL memory growth across ten mount and unmount cycles of any scene.

**Accessibility**
10. Lighthouse Accessibility 100 on every route.
11. All text meets WCAG AA contrast against its actual rendered background, including text over placeholder visuals and over the particle field.
12. Full keyboard navigation, visible focus states on every interactive element, focus never trapped except intentionally in the mobile menu.
13. `prefers-reduced-motion: reduce` renders the entire site in final state with no motion, no canvas of any kind mounted, and the site still looks composed. Verify by screenshot.
14. Every image has meaningful alt text or `alt=""` if decorative. Every canvas is `aria-hidden`. WebGL-rendered project visuals keep an accessible DOM equivalent behind them, an image in WebGL is invisible to a screen reader.

**Responsive**
15. No horizontal scroll at any width from 320px to 2560px.
16. Verified at 320, 375, 768, 1024, 1440, 1920px.
17. All touch targets 44px minimum.

**Correctness**
18. Zero TypeScript errors, zero ESLint errors, zero console errors or warnings in the browser at runtime.
19. No em dash characters anywhere in the repo. Verify with a grep for the character.
20. No fabricated client name, project, testimonial, statistic, date, or price exists anywhere in the codebase. Verify by listing every proper noun and number rendered on the site and confirming its source.
21. Every placeholder is tagged and listed in `docs/placeholders.md`.
22. All required ADRs from section 12 exist.

---

## 12. REQUIRED ADRs

1. Framework and rendering strategy
2. Styling approach and why Tailwind v4 CSS-first over a config file
3. Animation stack split: GSAP for scroll, Motion for components and page transitions, Three.js and R3F for WebGL, 2D canvas for the fallback tier
4. Render tiering: how tier is detected, what each tier gets, and why Three.js is dynamically imported
5. Shader approach for the hero field, including why the motion lives in the vertex shader and not the CPU
6. Content stored in code rather than a CMS, with the migration path if that changes
7. Single dark theme, no light mode
8. Placeholder asset generation strategy
9. Form handling and spam mitigation
10. The Thread: technical approach and the mobile fallback
11. Reduced motion strategy
12. Font licensing and self-hosting
13. Performance budget per tier, and what was traded for the visual work

---

## 13. TOOLING

Use these if available in the environment. Check first, do not assume.

- **Context7 MCP** or equivalent docs retrieval, for current Next.js 15, Tailwind v4, GSAP 3, Motion, Three.js, and React Three Fiber API surfaces. Training data on Tailwind v4, Motion, and R3F v9 is likely stale, verify syntax before writing config or scene code.
- **Playwright MCP** or Chrome DevTools MCP, to screenshot each section at each breakpoint and self-verify against the spec rather than assuming the render is correct. Use this at the end of every phase.
- **Filesystem access** to read `M:\WYRD Projects\WYRD Website\Codebase2`, the source folder in section 0.1.
- **Web fetch** for current library documentation only. Not for finding or scraping any previous WYRD site, there is nothing there.

If a visual verification tool is available, use it. Building an animated site without looking at it is guessing.

---

## 14. DEFINITION OF DONE

The site is done when a founder in Bangalore or Austin lands on it cold, scrolls once, and concludes that whoever built this can be trusted with their brand. Not because of what it claims. Because of how it behaves.

Every claim on it is true. Everything that is not yet true is absent, not invented.
