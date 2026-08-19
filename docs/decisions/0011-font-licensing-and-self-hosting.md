# 0011. Font licensing and self-hosting

Status: accepted
Date: 2026-08-19
Phase: 0b

## Context

The brief specifies Satoshi Variable from Fontshare for display and UI, and Instrument Serif Italic from Google Fonts for editorial accents, both self hosted through `next/font/local` with no CDN request. Licences have to be read before install, not assumed.

## What the licences actually say

**Satoshi, ITF Free Font License v2.0, dated 17 August 2026.** Full text committed at `docs/licenses/Satoshi-ITF-Free-Font-License.txt`.

- Commercial use permitted, free of charge, worldwide, unlimited period.
- Self hosting permitted **and recommended** in as many words, including through `@font-face`. The Fontshare API is explicitly optional.
- **Modification prohibited**, and the prohibition explicitly names subsetting, format conversion, and altering font names or metadata.
- **Redistribution prohibited**, including through publicly accessible servers and repositories, and providing the font software to external contractors.

**Instrument Serif, SIL Open Font License 1.1.** Full text committed at `docs/licenses/InstrumentSerif-OFL.txt`. Permits use, modification, subsetting, and redistribution with the notice.

## Decision

- Satoshi ships as the **official unmodified variable woff2**, `public/fonts/Satoshi-Variable.woff2`, 42.6kb, weight range 300 to 900, from the official Fontshare distribution. Not subset, not converted, not renamed. `next/font/local` performs no subsetting on local fonts, so the file is served exactly as shipped.
- Instrument Serif ships as the latin italic woff2 from the Google Fonts distribution, `public/fonts/InstrumentSerif-Italic-latin.woff2`, 22.1kb. Latin only and italic only, because the brief restricts it to manifesto lines and pull quotes.
- Both loaded with `next/font/local`, `display: 'swap'`, `preload: true`, and a real fallback stack. Zero runtime requests to any font CDN.
- Both licence texts committed under `docs/licenses/`.

## Consequences

- Two files, 64.7kb total, both preloaded. No FOUT, no third party request.
- One variable file covers 300 to 900, so weight is free after the first request, which is why the brief's weight and tracking rules are cheap to follow.
- **A constraint worth remembering:** the Satoshi licence forbids subsetting, so the usual optimisation of cutting a font down to the glyphs in use is not available here. 42.6kb unsubset is the floor, and it is inside budget.
- **A distribution risk to flag:** the ITF licence prohibits making the font software available through publicly accessible repositories. The woff2 is committed to this repository, which is fine while the repository is private. **If it is ever made public, the font file must be removed from git and fetched at build time instead.** Serving it from the site as a webfont is permitted use and is unaffected.
