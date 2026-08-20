# Engineering

How this repo is built and what the rules are when adding to it.

## 1. Stack as installed

| Layer | Package | Version |
|---|---|---|
| Framework | `next` | 15.5.23 |
| Runtime | `react`, `react-dom` | 19.2.8 |
| Styling | `tailwindcss`, `@tailwindcss/postcss` | 4.3.3 |
| Scroll motion | `gsap` | 3.15.0 |
| Component motion | `motion` | 13.1.0 |
| Smooth scroll | `lenis` | 1.3.26 |
| Icons | `lucide-react` | 1.33.0 |
| Validation | `zod` | 4.4.3 |
| Analytics | `@vercel/analytics`, `@vercel/speed-insights` | 2.0.1, 2.0.0 |
| Types and lint | `typescript` 5.9.3, `eslint` 9.39.5, `eslint-config-next` 15.5.23, `prettier` 3.9.6 |

Installed later, in the phase that needs them, so they are not in the graph before then:

| Layer | Package | Phase |
|---|---|---|
| WebGL | `three` 0.180.0 pinned, `@react-three/fiber` 9.7.0, `@react-three/drei` 10.7.8, `@types/three` 0.180.0 | 2b |
| Email | `resend` | 5 |
| Long form content | `@next/mdx` and the MDX pipeline | 5 |

Next.js 16 is current. This build stays on 15 because the brief specifies it. See ADR 0006.

`three` is pinned to 0.180.0 rather than the current 0.185. From 0.184 onward three prints a `THREE.Clock` deprecation warning, and R3F 9.7 constructs a `Clock` internally, so every page with a canvas would log a warning. Criterion 18 allows none. The pin comes off when R3F moves to `THREE.Timer`. See ADR 0017.

`drei` is installed and imported nowhere. It stays that way until a specific helper earns its bytes, per the cut order in ADR 0016.

## 2. Commands

| Command | What it does |
|---|---|
| `npm run dev` | development server |
| `npm run build` | production build, fails on a type error |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `app`, `components`, `content`, `lib`, `scripts` |
| `npm run format` | Prettier write |
| `npm run check:dashes` | fails on any em dash, en dash, horizontal bar, or minus sign in the repo |
| `npm run assets` | regenerates `public/logos` and `public/brand` from the source folder |
| `npm run verify` | dashes, types, lint, build, in that order |
| `node scripts/shoot.mjs` | screenshots every route at 375, 768, and 1440, plus a reduced motion pass |
| `node scripts/check-shell.mjs` | asserts the Phase 2 shell behaviours in a real browser |
| `node scripts/check-tiers.mjs` | asserts the tier split and the byte budgets against `next start` |
| `node scripts/check-hero.mjs` | asserts the Phase 3 hero criteria against `next start` |

`npm run verify` is what a phase runs before reporting. It is not a substitute for looking at the site.

## 3. TypeScript

`strict: true` plus four settings that are not in the Next.js default and are deliberate:

- `noUncheckedIndexedAccess`. Array access returns `T | undefined`. Content arrays are read by index in several places and this catches the off by one.
- `noUnusedLocals` and `noUnusedParameters`. Dead code in a motion file usually means a half finished effect.
- `noImplicitOverride` and `noFallthroughCasesInSwitch`.

`any` is not used. Where a third party type is genuinely unavailable, the value is narrowed at the boundary with a type guard, not cast through.

## 4. Structure

```
app/            routes, layout, globals.css, server actions
components/
  sections/     one file per homepage section, S1 to S9
  ui/           Button, Chip, Field, Eyebrow, Reveal, Marquee, MagneticButton, CursorLabel
  motion/       Thread, ParticleField, SplitReveal, useLenis, useReducedMotion, useInView, useRenderTier
  layout/       Header, Footer, Container, Grid, Section
content/        typed content modules, no CMS
lib/            site-url, seo, validation, utils
public/         fonts, logos, brand, noise.png, og
docs/           brand, design system, motion, engineering, placeholders, decisions
scripts/        asset processing, grain generation, dash check
```

Rules:

- A component that renders content never fetches or derives it. Content comes from `content/` as a typed import.
- A `'use client'` boundary sits as low in the tree as it can. Sections are server components that render a small client leaf for their motion, not client components end to end.
- Nothing imports from `app/` into `components/`.
- The site origin comes from `lib/site-url.ts` and nowhere else. See ADR 0005.

## 5. WebGL rules

These are the rules that keep the performance budget. They are not suggestions.

- Never `import * as THREE`. Import the individual modules used.
- Never import all of `@react-three/drei`. Import the individual helper.
- Three.js is loaded with `next/dynamic` and `ssr: false`, inside the Full tier branch only. The Reduced and Static tiers download zero Three.js bytes. Verified in the network tab under a throttled mobile profile, not inferred from the code.
- One `<Canvas>` per page maximum.
- `dpr={[1, 2]}`. Never 3x.
- `frameloop="demand"` unless the scene is continuously animating.
- Dispose geometries, materials, and textures on unmount.
- Ship a context loss handler that falls back to the Reduced tier.
- All particle motion in the vertex shader. A CPU `for` loop over positions means it was built wrong.

## 6. Performance budget

Per tier, because a single blended number hides the thing that matters.

| Metric | Reduced tier | Full tier |
|---|---|---|
| Lighthouse Performance | 90 or above, mobile | 85 or above, desktop |
| JS on `/`, gzipped | under 250kb | under 500kb |
| LCP | under 2.0s mobile | under 2.5s desktop |
| CLS | under 0.05 | under 0.05 |
| INP | under 200ms | under 200ms |
| Three.js bytes | zero | as needed |

The LCP element is text on every route. If the canvas ever becomes the LCP element, that is a bug.

If the Full tier exceeds 500kb, the cut comes from drei imports and postprocessing before it comes from particle count. See ADR 0016.

## 7. Content

Local typed modules. No CMS. See ADR 0009.

- `content/site.ts` identity, navigation, contact, socials
- `content/services.ts` the four clusters and the spine, service wording verbatim from `docs/brand.md`
- `content/projects.ts` projects, every placeholder field flagged
- `content/clients.ts` logo manifest, generated from `public/logos/manifest.json`
- `content/process.ts` the four process steps
- `content/legal/*.mdx` privacy and terms

The invariant: a field that has no verified value is `null`, and the component checks for `null` and renders nothing. There is no placeholder string standing in for a fact. An absent section is correct, a fictional one is a build failure.

## 8. Accessibility floor

- Lighthouse Accessibility 100 on every route.
- Every canvas is `aria-hidden` and `pointer-events: none`.
- A WebGL rendered project visual keeps an accessible DOM equivalent behind it. An image in WebGL is invisible to a screen reader.
- Focus is visible on every interactive element, 2px `--color-accent` at 3px offset.
- Focus is never trapped except intentionally in the mobile menu, which closes on Escape and on route change.
- Touch targets 44px minimum.
- No horizontal scroll from 320px to 2560px.

## 9. Definition of a finished phase

1. Every acceptance criterion for the phase reported individually as PASS or FAIL, with specifics on failures.
2. `npm run verify` clean.
3. Screenshots at 375, 768, and 1440 checked against the spec for anything visual.
4. Every decision made during the phase written as a numbered ADR.
5. One conventional commit per meaningful unit.

A phase is not complete because the code looks right. This site is judged on motion and composition, and both have to be looked at.
