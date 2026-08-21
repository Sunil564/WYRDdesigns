# 0021. The Next major upgrade, assessed and not taken

Status: assessed, not decided
Date: 2026-08-21
Phase: 5 close, before Phase 6

## Context

`npm audit` reports high severity advisories whose only offered fix is `next@16`, a major version bump. The operator asked for the risk assessed before anything is done. Nothing in this record changes a dependency. It is an assessment.

## What the advisories actually are

Two chains reach `next`, and they are not the same kind of problem.

### `sharp` below 0.35.0

GHSA-f88m-g3jw-g9cj, four inherited libvips CVEs: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591. Classified CWE-1395, dependency on a vulnerable third party component. **The advisory carries no CVSS vector and no score**, which matters when reading the word "high": npm is reporting the severity of the upstream libvips issues, not a scored assessment of sharp's exposure, and certainly not of ours.

Installed: `sharp@0.34.5`, reached only through `next@15.5.23`. It is not a direct dependency and nothing in this codebase imports it.

### `postcss`

Four advisories. Three are about `sourceMappingURL` in CSS comments causing arbitrary `.map` file reads, one is an XSS via an unescaped closing style tag in stringify output. Two carry real vectors, at 7.5 and 6.1.

There are **two postcss versions in the tree**, and only one of them touches our CSS:

| Path | Version | Vulnerable |
|---|---|---|
| `@tailwindcss/postcss@4.3.3` | `postcss@8.5.26` | No. Above every affected range, the highest of which is 8.5.22 |
| `next@15.5.23` | `postcss@8.4.31` | Yes, to all four |

Our `postcss.config.mjs` declares exactly one plugin, `@tailwindcss/postcss`, so the pipeline that processes `app/globals.css` runs the patched 8.5.26. Next's bundled 8.4.31 handles its own internal CSS work.

Every one of these advisories requires **attacker controlled CSS**. This build processes one stylesheet, written by us, at build time. There is no user submitted CSS, no CMS, and no runtime CSS compilation.

## Is `sharp` reachable in our usage

The premise this was raised under was "build time image processing, no user uploads". The first half is wrong in a way worth correcting, because it changes where to look.

**`sharp` in Next is a request time dependency, not a build time one.** It backs the `/_next/image` optimizer endpoint, which runs when a request arrives. Measured against the verification server rather than assumed:

- `/_next/image?url=%2Flogos%2Fbhavani-sarees.png&w=640&q=75` returns 200, `image/png`, 2377 bytes. sharp ran.
- A remote URL returns 400, with the message that the url parameter is not allowed.
- A path traversal attempt returns 400, with the message that the resource is not a valid image.

So the endpoint is live, publicly reachable, and sharp does run. That is the honest finding, and it is not what "build time" implies. `.next-verify/cache/` contains `eslint`, `swc` and `webpack` and no image cache, which confirms the build itself never invoked sharp.

What stops it being exposure is the input, not the reachability:

- **Nothing in this codebase uses `next/image`.** One `img` element exists, in `ClientLogo`, deliberately plain and pointing at a local static asset. The optimizer is dead weight we ship rather than a path our markup exercises.
- **The optimizer will only fetch our own files.** `next.config.ts` declares no `images.remotePatterns`, so a remote URL is refused with a 400 before any decoding happens. Path traversal is refused too.
- So the only images sharp can be made to decode are the files we put in `public/`, all of which we generated or were supplied and committed.

The libvips CVEs are memory safety issues triggered by malformed image data. **An attacker cannot supply image data to this deployment.** They can ask the optimizer to re-encode our own logo at a width of their choosing, which is a denial of service consideration at worst and not what these CVEs describe.

**The condition that would change this** is a single line: adding `images.remotePatterns` to `next.config.ts`, which is what anyone reaching for a remote image would do. That turns a closed input into an open one. Whoever adds it inherits this assessment and should re-read it.

## What the Next major would change that touches this codebase

The Next API surface here is unusually small, which is the strongest argument that an upgrade is low risk. Measured:

| Surface | Usage |
|---|---|
| `from 'next'` | 9, all `import type` of `Metadata` or `Viewport`. Types only |
| `next/link` | 8 |
| `next/navigation` | 2, `notFound` and `usePathname` |
| `next/dynamic` | 2 |
| `next/font/local` | 1 |
| File conventions | `layout.tsx` and `page.tsx` only. No middleware, no route handlers, no `error`, `loading`, `template` or `default` |
| `next.config.ts` | `reactStrictMode`, `distDir`, `poweredByHeader`, `productionBrowserSourceMaps`, `experimental.optimizePackageImports`, `eslint.dirs` |

Two things are already on the far side of the last migration: `params` is a Promise in the dynamic route, which was the Next 15 async params change, and React is already 19.2.8.

**The largest risk is the bundler, not the API.** This build currently runs webpack: `next build` prints no Turbopack banner and `package.json` passes no `--turbopack` flag. Next 16 makes Turbopack the default for `next build`. That is a swap of the thing that produces every byte this project measures, and this project measures bytes hard. Four pieces of the build are unusual enough to name as what a bundler swap would exercise:

- Hand written GLSL in tagged template literals, in `components/motion/webgl/*.glsl.ts`, which is only ever a string but has already broken once on a quoting subtlety.
- `experimental.optimizePackageImports` for `gsap`, `motion` and `lucide-react`, which exists specifically to keep the Reduced tier under 250kb. An experimental flag is exactly the kind of thing a major version promotes, renames or drops.
- The MDX pipeline added this phase, `@next/mdx` with no plugins.
- Tailwind v4 through `@tailwindcss/postcss`.

**What I cannot verify from here, and am not going to assert:** the specific Next 16 breaking change list. The Vercel documentation search available in this environment returned no migration guide, and I will not reconstruct a changelog from memory and present it as fact. Everything above is measured from this repository. The changelog half of this assessment is unverified and needs the official upgrade guide read against the inventory above.

## What the suite would catch, and what it would not

This matters more than the changelog, because it decides whether an upgrade can be attempted safely at all.

### Would catch

| Regression | Caught by |
|---|---|
| Any route failing to render, 404, or erroring | All nine route harnesses, every one asserts a clean console and a live page |
| Three.js reaching the Reduced or Static tier | `check-tiers`, which greps chunk bodies for Three identifiers rather than trusting chunk names |
| Either tier bundle crossing its ceiling | `check-tiers`, asserting Reduced under 250kb and Full under 500kb on transferred bytes |
| The hero field or Thread not drawing | `check-hero` and `check-home`, both asserting on pixels |
| Tier resolution changing | `check-tiers`, all three tiers forced and checked |
| Accessibility regressing | `check-lighthouse`, 100 on seven routes |
| Contrast regressing | `check-contrast`, every rendered pair across nine routes |
| The contact form's four failure paths | `check-contact` |
| Metadata, canonicals, heading structure, focus rings, touch targets, overflow | `route-checks`, shared across five routes |
| A stale build being measured | `build-fresh`, on every harness |

### Would not catch

| Regression | Why not |
|---|---|
| **Performance** | Nothing here measures it honestly. Headless software rendering, no GPU. BLOCKERS 10 and 11. A Turbopack swap that made the site slower on real hardware would pass every check in this repository |
| **Anything on a real phone** | Every harness runs emulated. `useRenderTier` returns Reduced for a coarse pointer, and no real touch device has ever loaded this site |
| **Visual regression** | There is no screenshot diffing. Screenshots are captured for a person to look at. A layout that broke subtly at a width nobody screenshots would pass |
| **The Static tier's SVG Thread route** | `check-home` asserts it paints, but nothing compares its geometry against the measured route |
| **Font loading and FOUT** | `next/font/local` behaviour is not asserted anywhere |
| **Build determinism** | Nothing asserts the same source produces the same chunk hashes |
| **Production only behaviour** | Analytics scripts 404 locally, so anything about their delivery is untested here, as the Best Practices 96 already shows |

## The recommendation, which is not a decision

Neither advisory chain is exploitable in this deployment as it stands. `sharp` cannot be fed attacker data because the optimizer refuses every input except our own committed files, and `postcss` cannot be fed attacker CSS because there is no path by which a stranger supplies CSS. Both would remain unexploitable after the upgrade too. The upgrade removes the advisory, not a live risk.

Set against that, the upgrade swaps the bundler underneath a project whose whole tiering argument is measured in bytes, and the one thing the suite cannot verify is the one thing a bundler swap most affects.

So: **not urgent, and worth doing deliberately rather than under the impression that something is currently exposed.** The sequence that would make it safe is a deployed preview first, so Performance and real device behaviour become measurable, and the upgrade after that, with the full suite plus a Lighthouse run against the preview on both sides of it. That ordering also closes BLOCKERS 10 and 11, which is the same missing capability in both cases.

## One thing this assessment found that was not asked about

Installing `lighthouse` as a devDependency in the previous commit brought in its own advisory chain: `extract-zip` at high severity via `@puppeteer/browsers` and `puppeteer-core`, and fifteen moderate `@opentelemetry` advisories via `@sentry/node`. All are development only and none ships. It is recorded here rather than left for someone to discover, and it is the cost of the Lighthouse harness stated plainly.

## Consequences

- Nothing is upgraded. `next` stays at 15.5.23.
- BLOCKERS 13 is rewritten from "a high severity advisory" to what this found, and gains the `postcss` chain and the Lighthouse devDependency chain, neither of which was in it.
- Anyone adding `images.remotePatterns` to `next.config.ts` changes the sharp conclusion and needs to re-read this.
