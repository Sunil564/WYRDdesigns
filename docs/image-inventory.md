# Image inventory: AI generated project imagery

Source: `M:\WYRD Projects\WYRD Website\Codebase2\Website images`, 21 files, ingested 2026-08-22.
Originals are untouched in the source folder and nothing has been processed into `public/`.

**Processed 2026-08-22 at the operator's instruction: use these files, fit them, and look.**
The two problems below stand and are not fixed by anything in this document. They were
answered by moving the slots to the images rather than the images to the slots, so nothing was
cropped, upscaled, recoloured or adjusted. Every frame ships as the generated composition
entire, at the source's own resolution.

Neither problem is a fault in the generated images: they are internally consistent and match
the specification they were generated to. The specification does not match the site.

## Every file, as supplied

| File | Project | Slot | Format | Pixels | Ratio | Size |
|---|---|---|---|---|---|---|
| `1.1.png` | Bhavani Sarees | Card, large | PNG RGB | 1122 x 1402 | 0.8003 | 2.08 MB |
| `1.2.png` | Bhavani Sarees | Card, small | PNG RGB | 1536 x 1024 | 1.5000 | 1.85 MB |
| `1.3.png` | Bhavani Sarees | Case study hero, desktop | PNG RGB | 1672 x 941 | 1.7768 | 1.79 MB |
| `1.4.png` | Bhavani Sarees | Case study hero, mobile | PNG RGB | 1122 x 1402 | 0.8003 | 1.66 MB |
| `1.5.png` | Bhavani Sarees | Work block, full bleed | PNG RGB | 1672 x 941 | 1.7768 | 1.56 MB |
| `1.6.png` | Bhavani Sarees | Work block, inset | PNG RGB | 1448 x 1086 | 1.3333 | 1.90 MB |
| `1.7.png` | Bhavani Sarees | Work block, inset | PNG RGB | 1448 x 1086 | 1.3333 | 3.31 MB |
| `2.1.png` | PVC manufacturing | Card, large | PNG RGB | 1122 x 1402 | 0.8003 | 1.56 MB |
| `2.2.png` | PVC manufacturing | Card, small | PNG RGB | 1535 x 1024 | 1.4990 | 1.59 MB |
| `2.3.png` | PVC manufacturing | Case study hero, desktop | PNG RGB | 1672 x 941 | 1.7768 | 1.71 MB |
| `2.4.png` | PVC manufacturing | Case study hero, mobile | PNG RGB | 1122 x 1402 | 0.8003 | 1.49 MB |
| `2.5.png` | PVC manufacturing | Work block, full bleed | PNG RGB | 1672 x 941 | 1.7768 | 1.44 MB |
| `2.6.png` | PVC manufacturing | Work block, inset | PNG RGB | 1448 x 1086 | 1.3333 | 1.42 MB |
| `2.7.png` | PVC manufacturing | Work block, inset | PNG RGB | 1448 x 1086 | 1.3333 | 1.95 MB |
| `3.1.png` | Business expo | Card, large | PNG RGB | 1122 x 1402 | 0.8003 | 2.15 MB |
| `3.2.png` | Business expo | Card, small | PNG RGB | 1537 x 1023 | 1.5024 | 2.13 MB |
| `3.3.png` | Business expo | Case study hero, desktop | PNG RGB | 1672 x 941 | 1.7768 | 2.31 MB |
| `3.4.png` | Business expo | Case study hero, mobile | PNG RGB | 1122 x 1402 | 0.8003 | 1.81 MB |
| `3.5.png` | Business expo | Work block, full bleed | PNG RGB | 1672 x 941 | 1.7768 | 1.97 MB |
| `3.6.png` | Business expo | Work block, inset | PNG RGB | 1448 x 1086 | 1.3333 | 1.49 MB |
| `3.7.png` | Business expo | Work block, inset | PNG RGB | 1448 x 1086 | 1.3333 | 2.39 MB |

## Problem 1: the generated ratios do not match the slots the site actually renders

Every image matches the ratio `WYRD-IMAGE-PROMPTS.md` asked for, to within 0.16 percent. The
prompts document's technical table does not match the built site. It says so itself, under
Technical specification: *Confirm the real rendered dimensions against the build before
finalising crops.* That step was not taken before generating.

Measured from the built pages rather than read from the source:

| Slot | Prompt doc says | Site renders | Generated | Match |
|---|---|---|---|---|
| Card, large | 0.800 | 0.800 | 0.800 | yes |
| Card, small | 1.500 | 1.778 | 1.500 | **no** |
| Case study hero, desktop | 1.778 | 2.333 | 1.777 | **no** |
| Case study hero, mobile | 0.800 | no slot | 0.800 | **no** |
| Work block, full bleed | 1.778 | 2.333 | 1.777 | **no** |
| Work block, inset | 1.333 | 1.600 | 1.333 | **no** |
| Work block, inset | 1.333 | 1.600 | 1.333 | **no** |

Four of the seven slots disagree. `Card, large` is the only one that matches outright.
`Case study hero, mobile` has no slot at all yet: the case study renders one hero at 21:9 for
every width, so the separate mobile asset has nowhere to go until the `<picture>` element is
built.

## Problem 2: fifteen of the twenty one files fall short of 2x their slot

Measured against the largest box each slot renders, which is at a 1440px viewport.

| File | Slot renders | 2x needs | Supplied width | Of 2x |
|---|---|---|---|---|
| `1.1.png` | homepage lead card | 1524 px | 1122 px | **74%** |
| `1.2.png` | homepage short cards | 1060 px | 1536 px | **145%** |
| `1.3.png` | case study hero | 2688 px | 1672 px | **62%** |
| `1.4.png` | no separate slot exists | 728 px | 1122 px | **154%** |
| `1.5.png` | case study body, bleed | 2688 px | 1672 px | **62%** |
| `1.6.png` | case study body, inset | 1984 px | 1448 px | **73%** |
| `1.7.png` | case study body, inset | 1984 px | 1448 px | **73%** |
| `2.1.png` | homepage lead card | 1524 px | 1122 px | **74%** |
| `2.2.png` | homepage short cards | 1060 px | 1535 px | **145%** |
| `2.3.png` | case study hero | 2688 px | 1672 px | **62%** |
| `2.4.png` | no separate slot exists | 728 px | 1122 px | **154%** |
| `2.5.png` | case study body, bleed | 2688 px | 1672 px | **62%** |
| `2.6.png` | case study body, inset | 1984 px | 1448 px | **73%** |
| `2.7.png` | case study body, inset | 1984 px | 1448 px | **73%** |
| `3.1.png` | homepage lead card | 1524 px | 1122 px | **74%** |
| `3.2.png` | homepage short cards | 1060 px | 1537 px | **145%** |
| `3.3.png` | case study hero | 2688 px | 1672 px | **62%** |
| `3.4.png` | no separate slot exists | 728 px | 1122 px | **154%** |
| `3.5.png` | case study body, bleed | 2688 px | 1672 px | **62%** |
| `3.6.png` | case study body, inset | 1984 px | 1448 px | **73%** |
| `3.7.png` | case study body, inset | 1984 px | 1448 px | **73%** |

Six files clear it. The `x.2` card smalls do, because the homepage short card renders only
530px wide, and the `x.4` mobile heroes do because no slot renders them yet. The other fifteen
fall between 62 and 87 percent of what their slot needs.

The shortfall is a desktop problem only. At 412px every file clears 2x comfortably; the
largest mobile box is 364px wide and the narrowest source is 1122px. A phone gets a fully
resolved image from every one of these files. A 1440px laptop with a 2x display does not, for
fifteen of them.

The prompts document specified generating at 1600x2000, 2000x1333, 2560x1440 and 2000x1500.
Nothing arrived at those sizes: the 4:5 files are 1122x1402, the 3:2 are 1536x1024, the 16:9
are 1672x941 and the 4:3 are 1448x1086. Between 62 and 87 percent of what the slots need.

Upscaling is not an option and was not done.

## What shipped

Every file converted at its own resolution into `public/work/`, WebP with a JPG fallback, each
under 400kb. `public/work/manifest.json` records the source filename for every output, the way
the client logo manifest does.

Encoding steps quality down from 92 until the file fits rather than fixing one number, because
these frames differ enormously in how they compress: fine film grain over a dark field costs
far more than a flat background. Nineteen of twenty one held quality 92. Only
`ecommerce-garments-block-inset-2` (from `1.7.png`, the saree border detail, all raised thread
and shadow) needed q76 for WebP and q72 for JPG, and `exhibition-hospitality-hero-desktop`
needed q88 for its JPG.

The slots were changed to the images' ratios: card small to 3:2, case study hero and bleed
block to 16:9, inset blocks to 4:3. That is a composition change to pages already approved and
it is visible on the page rather than buried here.

The 2x shortfall is unresolved and unresolvable from these files. Fifteen of twenty one render
softer than a 2x desktop display can show. On a phone every one of them is fully resolved.
