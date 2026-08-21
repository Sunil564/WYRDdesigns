# Placeholder register

Every placeholder on the site, what it stands in for, and what replaces it. Generated visuals carry a `data-placeholder` attribute with the note text, so this list can be checked against the built HTML with a grep:

```
grep -o 'data-placeholder="[^"]*"' .next/server/app/*.html
```

Kept current at the end of every phase. Updated through Phase 4.

## Brand

| Where | Path | What is there now | What replaces it |
|---|---|---|---|
| Header mark | `components/layout/Wordmark.tsx` | **No longer a placeholder.** The supplied mark renders, 32px tall on mobile and 40px from `sm` up, WebP with a PNG fallback at 3x. See ADR 0023 | A vector, so sizes above the header stop being resamples of a 2101px raster |
| Wordmark on dark grounds | `components/layout/Wordmark.tsx` | **No longer a placeholder.** The supplied white variant renders at the same 40px as the header mark, 19.78:1 on `--color-bg-inverse`. See ADR 0025 | A vector, same as the header |
| Footer closing watermark | `components/layout/Footer.tsx` | `WYRD` at 26vw in the inverse hairline colour. Decorative and `aria-hidden`, and deliberately typographic: at 2560px it renders around 665px tall, which needs roughly 7700px of raster for 3x from a 2101px source | A vector. Until then this is a design choice rather than a stand-in |
| Favicon 16 and 32 | `public/brand/icon-16.png`, `icon-32.png` | The supplied wordmark contained on white, regenerated for the light canvas in Phase 4b. Legible as a shape, not as letters, at 16px | A square single glyph mark |

## Home

| Where | Component | Seed | What is there now | What replaces it |
|---|---|---|---|---|
| S4 lead card | `Placeholder` | `ecommerce-garments` | Generated abstract visual, 4:5, `gradient` | The lead visual for that project |
| S4 second card | `Placeholder` | `brand-film-manufacturing` | Generated abstract visual, 16:9, `lines` | The lead visual for that project |
| S4 third card | `Placeholder` | `exhibition-hospitality` | Generated abstract visual, 16:9, `mesh` | The lead visual for that project |

Each S4 card also carries a visible `Pending clearance` tag, because the project itself is a placeholder and not only its visual. The tag disappears when the entry in `content/projects.ts` sets `placeholder: false`.

All three are generated in the light context: a `--bg-raised` panel with tints of `--bg-sunken` and `--border`, one sparing accent, and the dark grain. A placeholder inside a dark block takes `context="inverse"` and generates from the inverse tokens instead. The context is an explicit prop, never inferred from the parent.

## Work

| Where | Component | What is there now | What replaces it |
|---|---|---|---|
| `/work` grid cards | `Placeholder` | One generated visual per project entry, three today, at 4:5. The grid is exactly as long as `content/projects.ts` and is never padded | Real project visuals |
| `/work/[slug]` hero visual | `Placeholder` | One generated visual at 21:9. The hero frame is a dark block per Phase 4b section 4, so it takes `context="inverse"` and generates from the inverse tokens | The real project hero |
| `/work/[slug]` body visuals | `Placeholder` | Three generated visuals, alternating full bleed 21:9 and inset 16:10. Three rather than the brief's three to five because every one is a placeholder and five empty frames read as a longer apology than three | Real project imagery, and then the count follows the imagery rather than this constant |
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
| Project entries | `content/projects.ts` | Entries flagged `placeholder: true`, with no client name, no outcome metric, and a generic sector description | Cleared project data. Until then the outcome block does not render at all, per ADR 0009. |

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
