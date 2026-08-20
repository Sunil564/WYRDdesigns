# Source inventory

Recursive inventory of the authoritative source folder, per section 0.1 of the build brief.

```
M:\WYRD Projects\WYRD Website\Codebase2
```

Read on 2026-08-19. Ten files, three folders. Nothing skipped.

## Documents in the source folder

| File | What it is | Used for |
|---|---|---|
| `files-web/WYRD-WEBSITE-BUILD-PLAN.md` | The build brief itself, byte identical to the copy at the repo root | Architecture, structure, motion, process |
| `files-web/CLAUDE.md` | Repo instruction file, byte identical to the copy at the repo root | Working rules |
| `files-web/run-phases.sh` | Bounded phase runner shell script, byte identical to the copy at the repo root | Build process |

`brand.md` was expected here per section 0.1 and `CLAUDE.md`. It is not in this folder. It was located in two sibling folders, byte identical in both (md5 `a25828bc103ab3e08605ef10ae881ea2`):

- `M:\WYRD Projects\WYRD Website\files\brand.md`
- `M:\WYRD Projects\WYRD Website\Codebase\brand.md`

That file is committed unmodified to `docs/brand.md` and treated as the supplied authoritative brand document. See `docs/decisions/0001-source-ingestion-and-precedence.md`.

## Brand assets in the source folder

| File | Format | Dimensions | Vector | What it is |
|---|---|---|---|---|
| `Company logo/Logo_Design_Black final.png` | PNG, RGBA | 2131 x 1036, ink bounds 2101 x 989 | No, raster | The WYRD Designs wordmark. Lowercase `wyrd` with an overlapping lighter grey `Y`, `Designs` set below and right. Solid black on transparent. |

Derived variants, written by `scripts/process-assets.py`, all from the unmodified source:

| Output | Size | Purpose |
|---|---|---|
| `public/brand/wyrd-logo-supplied.png` | 2131 x 1036 | The source file, committed verbatim |
| `public/brand/wyrd-header.webp` and `.png` | 153 x 72 | Header mark at 3x its 24px render height |
| `public/brand/wyrd-footer.webp` and `.png` | 408 x 192 | Footer wordmark at 3x its 64px render height |
| `public/brand/wyrd-og-mark.png` | 1200 x 400 | Mark on brand paper for OG composition |
| `public/brand/icon-16.png`, `icon-32.png`, `icon-180.png`, `icon-512.png` | as named | Favicon and touch icon set, mark contained on brand paper |

The supplied mark is black on transparent and is therefore invisible on `--color-bg`. It has not been recoloured, inverted, redrawn, or restretched. The header and footer set the wordmark in Satoshi as an interim treatment. See `docs/decisions/0003-brand-mark-handling.md` and the phase report.

## Client logos in the source folder

All six are raster. No vector source was supplied for any of them.

| File | Format | Dimensions | Identification | Confidence |
|---|---|---|---|---|
| `Client logos/Bhavani logo.png` | PNG, RGBA | 1861 x 1556 | `Bhavani sarees`. Peacock and lotus emblem above a serif wordmark, maroon and violet. | Certain, the wordmark is legible |
| `Client logos/G-Monisa.png` | PNG, RGBA | 1196 x 866 | `G MONISA`. Registered mark, red and black lockup with a monogram roundel and a lightning bolt. | Certain, the wordmark is legible |
| `Client logos/Maharaja_Logo.png` | PNG, RGBA | 1080 x 868 | `Maharaja`. Red `M` under a blue crown, script wordmark across it, registered mark. | Certain, the wordmark is legible |
| `Client logos/SITEO LOGO.jpeg` | JPEG, RGB, white background | 1600 x 400 | `SITEO`. Five colour blocks with knocked out letterforms. | Certain, the wordmark is legible |
| `Client logos/Seervi EXPO - Copy.png` | PNG, RGBA | 1024 x 1024 | `SEERVI BUSINESS EXPO`, dated 2026 in the roundel. Magenta and navy. | Certain, the wordmark is legible |
| `Client logos/Vaihini.png` | PNG, RGBA | 2927 x 1252 | Artwork reads `Vahini PIPES`, registered mark, red on white in a rounded outline. The filename reads `Vaihini`. | Artwork certain, filename spelling differs |

Derived output, written by `scripts/process-assets.py`, one ink mask per logo at 96px canvas height plus a manifest:

| Client | Files | Mask size |
|---|---|---|
| Bhavani Sarees | `public/logos/bhavani-sarees.webp` and `.png` | 115 x 96 |
| G Monisa | `public/logos/g-monisa.webp` and `.png` | 113 x 96 |
| Maharaja | `public/logos/maharaja.webp` and `.png` | 135 x 96 |
| SITEO | `public/logos/siteo.webp` and `.png` | 284 x 96 |
| Seervi Business Expo | `public/logos/seervi-business-expo.webp` and `.png` | 87 x 96 |
| Vahini Pipes | `public/logos/vahini-pipes.webp` and `.png` | 201 x 96 |

Masks are tinted with `currentColor` at render time, which is how S5 moves from `--color-fg-muted` to `--color-fg` on hover without a second file per logo. Technique and the six logo count consequence: `docs/decisions/0004-client-logo-treatment.md`.

## Documents found outside the source folder

Read for context, not treated as authoritative, because they are not in the source folder named in section 0.1 and they describe a different and earlier project. `M:\WYRD Projects\WYRD Website\files\site-spec.md` states of itself: "Not the final site. Built to be replaced."

Committed unmodified to `docs/supplied-superseded/` so the history is in version control:

| File | What it is | Status |
|---|---|---|
| `design-system.md` | Light paper and sage palette, Poppins and Inter, hand drawn doodle rule | Superseded by section 4 of the brief. See ADR 0002. |
| `site-spec.md` | One page temporary site spec, eight service rows, anchor nav | Superseded by section 6 of the brief |
| `engineering.md` | Engineering notes for the earlier build | Superseded by sections 7 and 7b of the brief |
| `eval-checklist.md` | Acceptance checklist for the earlier build | Superseded by section 11 of the brief |
| `00-PROJECT-SETUP.md` | Setup notes for the earlier build | Superseded by section 10 of the brief |

Also present outside the source folder and deliberately not used:

- `M:\WYRD Projects\WYRD Website\Codebase` and `Codebase2\files-web` duplicates: an earlier trial repository. Section 0.4 rules it out as a source.
- `M:\WYRD Projects\WYRD Website\Images and logos`: six raster illustrations, `01.jpg.jpeg`, `DOnt Scroll.jpg.jpeg`, `Events.png`, `Marketing.png`, `Website illustration.png`, `video.png`. Not in the source folder, unlabelled as to intended placement, and the brief bans decorative imagery of unverified provenance. Flagged to the operator below rather than used.
- `M:\WYRD Projects\WYRD Website\Instructions\claude-code-brief-hero-particles.md`: a hero particle brief for the earlier build. Section 7b of the current brief governs the particle field.

## UNIDENTIFIED

Nothing in the source folder is unidentified. Two items need an operator decision.

1. **`Vaihini.png` spelling.** The artwork reads `Vahini PIPES`. The filename reads `Vaihini`. The site currently uses `Vahini Pipes`, taken from the artwork, since the artwork is the client's own rendering of their name. Confirm the correct spelling. A client name is a fact and this one has two candidate spellings.
2. **`Images and logos` folder.** Six illustrations sit outside the source folder with no accompanying note. If any of them are intended for the site, say which section each belongs to and confirm they are licensed to WYRD. Until then they are not used.
