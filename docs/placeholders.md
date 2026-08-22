# Placeholder register

Every placeholder on the site, what it stands in for, and what replaces it. Generated visuals carry a `data-placeholder` attribute with the note text, so this list can be checked against the built HTML with a grep:

```
grep -o 'data-placeholder="[^"]*"' .next/server/app/*.html
```

Kept current at the end of every phase. Updated through Phase 6.

Note that the grep no longer finds the project imagery: those slots render real files rather than `Placeholder` components. `data-placeholder` now appears only in `/tokens`, which is a development harness. Something can be a stand-in without being a `Placeholder`, and this register is the list, not the attribute.

## Brand

| Where | Path | What is there now | What replaces it |
|---|---|---|---|
| Header mark | `components/layout/Wordmark.tsx` | **No longer a placeholder.** The supplied mark renders, 32px tall on mobile and 40px from `sm` up, WebP with a PNG fallback at 3x. See ADR 0023 | A vector, so sizes above the header stop being resamples of a 2101px raster |
| Wordmark on dark grounds | `components/layout/Wordmark.tsx` | **No longer a placeholder.** The supplied white variant renders at the same 40px as the header mark, 19.78:1 on `--color-bg-inverse`. See ADR 0025 | A vector, same as the header |
| Footer closing mark | `components/layout/WordmarkClose.tsx` | **No longer a placeholder.** The supplied white artwork at 9 percent opacity, with a highlight that sweeps across it. 1.82x downscale from source at 1440px. See ADR 0026 | A vector. This is the largest render on the site and the surface one would most improve |
| Favicon 16 and 32 | `public/brand/icon-16.png`, `icon-32.png` | The supplied wordmark contained on white, regenerated for the light canvas in Phase 4b. Legible as a shape, not as letters, at 16px | A square single glyph mark |

## Home

**AI-generated, pending real photography.** Not resolved. These are no longer `Placeholder`
components and no longer carry `data-placeholder`, so the grep above will not find them: they
are real image files, and the thing standing in is the photography, not the element.

| Where | Slot | Source file | What replaces it |
|---|---|---|---|
| S4 lead card | `ecommerce-garments-card-large`, 4:5 | `1.1.png` | Real photography from the project |
| S4 second card | `brand-film-manufacturing-card-small`, 3:2 | `2.2.png` | Same |
| S4 third card | `exhibition-hospitality-card-small`, 3:2 | `3.2.png` | Same |

Each S4 card still carries its visible `Pending clearance` tag, because the project itself is
unconfirmed and not only its visual. The tag disappears when `content/projects.ts` sets
`placeholder: false`.

**The images are atmospheric, not evidential, and the alt text is written to match.** None of
them shows a client's product, a client's premises, or anything this studio delivered. Every
alt string describes what is in the frame and would be equally true of a stock library
picture, which is the test applied. See `content/projects.ts` for the strings and
`docs/image-inventory.md` for how the files were produced.

## Work

| Where | Component | What is there now | What replaces it |
|---|---|---|---|
| `/work` grid cards | `ProjectImage` | **AI-generated, pending real photography.** One 4:5 frame per project, `x.1`. The grid is exactly as long as `content/projects.ts` and is never padded | Real photography |
| `/work/[slug]` hero visual | `ProjectHero` | **AI-generated, pending real photography.** Two separate frames, `x.3` landscape at 16:9 above 1024px and `x.4` portrait at 4:5 below, chosen by the browser. Not one image cropped by CSS | Real photography, both orientations |
| `/work/[slug]` body visuals | `ProjectImage` | **AI-generated, pending real photography.** Three frames: `x.6` inset 4:3, `x.5` bleed 16:9, `x.7` inset 4:3. Three because that is how many frames each project has, which is now a fact about the imagery rather than a judgement about how many empty placeholders a reader tolerates | Real photography, and then the count follows it |
| `/work/[slug]` body captions | none | Nothing. A caption on a placeholder visual would be invented copy about a project nobody has described | Real captions, written from the project |

## Legal

| Where | Component | What is there now | What replaces it |
|---|---|---|---|
| `/privacy` prose | `content/legal/privacy.mdx` | Holding text. States what the site actually collects today and says the full policy is being prepared. Carries a visible `Not yet published` tag | The real privacy policy, supplied by the operator. Drop the `pending` flag in `app/privacy/page.tsx` with it |
| `/terms` prose | `content/legal/terms.mdx` | Holding text. States that nothing on the site is a contract and that work is agreed in writing first. Same visible tag | The real terms, same two changes |

Neither carries a date, a version, or a retention period, because all three would be facts about a document nobody has written. `scripts/check-legal.mjs` asserts that: zero digits render on either route.

## Content

| Where | File | What is there now | What replaces it |
|---|---|---|---|
| Project entries | `content/projects.ts` | Entries flagged `placeholder: true`, with no client name, no outcome metric, and a generic sector description. **Imagery does not change this.** Supplying pictures supplied no facts: client, year and outcome are all still `null` and still render nothing | Cleared project data. Until then the outcome block does not render at all, per ADR 0009. |
| Project imagery | `public/work/`, 21 files | AI-generated to `WYRD-IMAGE-PROMPTS.md`, at the source's own resolution. Fifteen of twenty one render softer than a 2x desktop display can show, which is recorded rather than fixed. Every source filename is in `public/work/manifest.json` | Real photography. `docs/image-inventory.md` says exactly what is being replaced and why it was there |

## What is deliberately absent rather than placeheld

These are not placeholders. They are sections that do not render because the fact does not exist, which is the correct behaviour per section 1 of the brief.

| Thing | Why absent |
|---|---|
| Team section on `/studio` | No real names supplied. The route ships with no team section, no generic "our team" block, and no placeholder person. `scripts/check-studio.mjs` asserts the absence three ways: no section label about people, no team phrase in the rendered text, and no image in `main`. |
| Street address | None supplied. Only `Bangalore, Karnataka, India` renders. |
| Outcome metrics on case studies | None supplied. Never invented. |
| Testimonials | None supplied. No section exists for them. |
| Client count, founding year, team size, years in business, awards | None supplied. Nothing on the site refers to any of them. On `/studio` this is asserted rather than trusted: every digit rendered on the route is matched against an allowlist of the four process indexes and the two phone numbers from `docs/brand.md`. |
| Prices | Banned outright. Pricing is a conversation. |
| Client logo marquee | Six logos supplied, and the marquee needs eight. A static centred row renders instead, per ADR 0004. |
