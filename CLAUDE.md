# WYRD Designs Website

## Read this first

The full build brief is `./WYRD-WEBSITE-BUILD-PLAN.md`. Read it before any task in this repo. It is authoritative over your defaults.

The source folder `M:\WYRD Projects\WYRD Website\Codebase2` holds the operator's own `brand.md`, the WYRD logo and wordmark, and client logos. Section 0 of the brief covers how to ingest it. Do that first.

## Precedence

1. **Supplied `brand.md`** (from the source folder, copied to `docs/brand.md`) wins on every brand matter: voice, positioning, colour, type, naming, taglines, service descriptions, stated facts.
2. **The build brief** wins on architecture, structure, motion, and process.
3. **This file** is the summary. Where it is thinner than either of the above, they win.

Where a supplied document contradicts the brief on a brand matter, follow the supplied document and write an ADR. Where one contradicts the brief on architecture, stop and ask. Never overwrite or edit a supplied `brand.md`, extend it in a separate file if additions are needed.

## Company

WYRD Designs, trading name of WYRD Tech Pvt Ltd. Design and technology studio, Bangalore, India.
Services: web and ecommerce development, digital marketing and social, SEO, corporate film and video, explainer video, brand and creative direction, exhibitions and events, promotional campaigns.
Buyers: Indian SMB and mid-market founders (primary), United States (secondary). Founders and marketing heads, not enterprise procurement.

The studio is new with a short list of completed projects. The site is design-heavy and information-light on purpose. Never manufacture volume.

## Known facts

- Contact email: `hello@wyrddesigns.in`
- Production domain: not registered. Never hardcode one. Every absolute URL comes from `process.env.NEXT_PUBLIC_SITE_URL`, defined in exactly one place.
- Previous site: an early trial with nothing worth keeping. Do not look for it, fetch it, or reference it. `Codebase2` and the operator are the only sources of truth.

## Non-negotiable rules

1. **No long em dashes.** Not in copy, not in code comments, not in documentation, not in commit messages. Use a comma, a colon, or a full stop. Before any commit, grep the diff for the character and fix any hit.
2. **Never invent a fact.** No fabricated client name, project, testimonial, statistic, founding year, team size, award, or price. If a fact is not verified, the element that needs it does not render. An absent section is correct. A fictional one is a failure.
3. **No prices anywhere on the site.** Pricing is a conversation.
4. **No agency cliches.** Banned: craft, bespoke digital experiences, passionate about, elevate your brand, in today's fast paced world, solutions, synergy, end-to-end partner, we believe.
5. **The name.** WYRD is Old English for fate. It also sounds like weird. State this once, on `/studio`, and never again. Do not apologise for it. Never write a sentence about the name containing the word "but".

## Voice

Confident, plain, unhurried. Short sentences. Concrete nouns. Say the thing and stop.

Good: "You will talk to the people doing the work."
Bad: "We pride ourselves on offering clients unfettered access to senior creative talent."

## Working method

- **Phase gate.** The brief defines Phases 0, 0b, 1, 2, 2b, then 3 to 7. Phase 0 is source ingestion and must complete before any application code. Phase 2b establishes render tiering and must complete before any WebGL work. Execute one phase per session. Do not start the next phase without being told. End every phase by reporting pass or fail against that phase's acceptance criteria, individually, with specifics on failures. Never report a phase complete without this.
- **Decisions go in files.** Every architectural decision becomes a numbered ADR in `docs/decisions/` with context, options considered, decision, consequences. Nothing that matters stays only in chat output.
- **Plan before building.** For any non-trivial task inside a phase, write the plan and its acceptance criteria first.
- **Verify visually.** This site is judged on motion and composition. If Playwright MCP or Chrome DevTools MCP is available, screenshot each section at 375, 768, 1440px and check the render against the spec before claiming a criterion passes. Do not assume the output is correct because the code looks correct.
- **Check current docs.** Tailwind v4, Next.js 15, GSAP 3, and Motion have all shifted recently. Verify API surfaces against live documentation before writing config or animation code rather than relying on memory.

## Stack

Next.js 15 App Router, TypeScript strict, Tailwind v4 CSS-first `@theme`, GSAP 3 with ScrollTrigger and SplitText, Motion (successor to Framer Motion), Three.js via React Three Fiber with drei and hand-written GLSL, Lenis, local TypeScript and MDX content with no CMS, Server Actions plus Zod plus Resend for forms, Vercel.

This is a heavy motion site on purpose. WebGL is used in exactly three places, defined in section 7b of the brief: the hero particle field, the work card transitions, and page transitions. Nowhere else. A fourth use needs an ADR.

**The tiering rule, which governs everything.** `useRenderTier()` decides Full, Reduced, or Static once on mount. Three.js is dynamically imported with `ssr: false` inside the Full branch only. The Reduced and Static tiers must download zero Three.js bytes. If that ever breaks, the mobile performance budget is gone and nothing else in the build matters. Verify it in the network tab, do not assume it from the code.

Never `import * as THREE`. Never import all of drei. Import individual modules.

Do not install: a UI kit, a component library, a CMS, jQuery, a carousel library, a particle library (tsparticles and equivalents are banned, WebGL replaces them), or any animation library beyond GSAP, Motion, and Three.js. Substituting anything in this stack requires an ADR explaining why.

## WebGL uniforms

A ShaderMaterial holds a CLONE of the uniforms object it was constructed with.
Writing `uniforms.foo.value = x` against the object you passed in updates a holder
the renderer never reads, and the uniform stays at its initial value forever,
silently. Array-valued uniforms appear to work because the array itself is shared by
reference. This cost 90 minutes of blind debugging in the thread stream, and had been
silently halving hero point size on 2x displays since Phase 3.

Every animated uniform writes through `material.current.uniforms`. Static placement
rides `object.matrixWorld`, not uniforms.

Phase 5 adds two more WebGL scenes. This applies to both.

## Commits

Conventional commits. One commit per meaningful unit, not one per phase. Commit before starting risky work so there is an undo point.

## Placeholders

No stock photography, no Unsplash, no Picsum. Use the seeded `<Placeholder>` component described in the brief. Tag every placeholder with `data-placeholder` and list it in `docs/placeholders.md` with its path and what should replace it.
