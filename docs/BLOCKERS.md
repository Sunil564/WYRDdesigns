# Blockers and open items

Nothing here halts the build. Each item is a real world fact the build cannot invent, with the exact consequence of it staying unresolved.

## Open

### 1. Production domain not registered

Section 0.4. `NEXT_PUBLIC_SITE_URL` is unset, so absolute URLs resolve to the Vercel deployment URL, or to `http://localhost:3000` in development. `docs/brand.md` records the intended domain as `wyrddesigns.in`.

Unblocks by: registering the domain and setting `NEXT_PUBLIC_SITE_URL` in the Vercel project. One variable, no code change. See ADR 0005.

Blocks: Phase 7 deploy to a production domain. Nothing earlier.

### 2. No vector or light variant of the WYRD mark

The supplied mark is a black on transparent PNG. It is invisible on `--color-bg`, and it is not this build's place to recolour a brand mark. The header and footer therefore set the wordmark in Satoshi as an interim treatment, tagged `data-placeholder`.

Unblocks by: supplying an SVG, AI, EPS, or PDF of the mark, plus a variant intended for dark backgrounds. Ideally also a square single glyph mark for a 16px favicon.

Blocks: nothing. The site ships with a typographic wordmark until then. See ADR 0003.

### 3. `Vaihini.png` spelling

The artwork reads `Vahini PIPES`. The filename reads `Vaihini`. The site uses `Vahini Pipes`, from the artwork.

Unblocks by: one word from the operator.

Blocks: nothing. A wrong client name is a wrong fact, so it is tracked rather than assumed correct.

### 4. Client logo clearance

`docs/brand.md` says named case studies are pending clearance and that the site uses capability proof, not logos. Six client logos were supplied in the source folder anyway, and the brief specifies a logo section. The logos render. See ADR 0002 section 6.

Unblocks by: confirming the six logos are cleared for display. If not, deleting the entries in `content/clients.ts` removes the section.

Blocks: nothing.

### 5. No real project data

`/work` and `/work/[slug]` render from `content/projects.ts`, which carries placeholder entries flagged as such. No client name, outcome metric, or year is invented. The outcome block does not render without real numbers.

Unblocks by: supplying cleared project details.

Blocks: nothing. Placeholder cards are the specified behaviour.

### 6. No street address, no team names

`docs/brand.md` supplies Bangalore, Karnataka, India, and two phone numbers, and no street address or team names. So `/studio` has no team section and structured data emits no postal address.

Unblocks by: supplying either, if either should appear.

Blocks: nothing.

### 7. `Images and logos` folder

Six illustrations sit outside the source folder with no note on intended placement or licensing. Not used.

Unblocks by: naming which section each belongs to, and confirming the licence.

Blocks: nothing.

### 8. SITEO has no single colour version

The SITEO mark is five colour blocks with the letters knocked out in white. On the
old dark canvas it monochromed cleanly. On the light canvas the third block reduces
to a mean alpha of 22 out of 255, so the `T` inside it becomes a white letter on a
near white block and stops being readable.

Per Phase 4b section 8, that mark now renders in its original colours while every
other logo in the row is monochrome. It is the only colour thing in that row.

Unblocks by: asking SITEO for a single colour or reversed version of their mark, or
confirming they are happy for the full colour mark to be used.

Blocks: nothing. The row renders and every mark is legible.

### 9. Resend API key

Phase 5 sends the contact form through Resend to `hello@wyrddesigns.in`. `RESEND_API_KEY` and a verified sending domain are needed for real delivery.

Unblocks by: a Resend account, a verified domain, and the key in the Vercel project.

Blocks: end to end delivery verification in Phase 5. The form, validation, and error states are testable without it.

### 10. Frame rate on real hardware is unverified

Particle brief criterion 21 asks for 60fps while scrolling the full page on a mid-range laptop, and never below 30fps on any Full tier device. Neither figure has been measured on hardware.

Everything in this build was measured headless with no GPU, where the same sweep reads 16.7 to 24.7ms median depending on viewport and run. Those numbers say the work got cheaper as counts came down, which is real, and they say nothing about whether a 2021 laptop holds 60fps.

Unblocks by: running the page on a real device. `scripts/check-hero.mjs` already reports an fps figure and asserts only the 30fps floor, which passes headless and is not the criterion.

Blocks: closing criterion 21. Nothing ships differently because of it.

### 11. Two rendering judgements need a real display

Both were reported at the time and neither is a fault, but both are judgements a headless screenshot cannot settle.

The hero field at 5,280 is at the edge of reading as sparse: individual particles are separately countable at 1440 where they read as a texture before. And the spiral trail reads as a fuzzy line in a still frame rather than as a rotating trail, because its rotation exists only as motion, at one turn per eight seconds.

Unblocks by: looking at both on a physical screen at full brightness. If the field reads as thin, the count is one constant. If the rotation reads as busy rather than alive, the spin rate is another.

Blocks: nothing. See ADR 0020 sections 11 and 14.

## Resolved

### Reduced tier rendered no Thread

Was item 10. Section 2.3 of the particle brief gave the Reduced tier a 2D canvas overlay and it was never built, so on that tier nothing drew the route: the WebGL scene is not mounted, the SVG carrier sat at `opacity: 0`, and there was no overlay to take its place. Because `useRenderTier` returns Reduced for any coarse pointer before any capability test, that was every phone and every tablet without reduced motion enabled.

Resolved by decision rather than by build. The overlay was scoped and rejected as disproportionate: it would have meant a second implementation of the reveal, the head, the inverse band switch, the dispersion, the spiral, the text dimming and the handoff, each free to drift from the shader's version with nothing comparing them, on the one tier that exists to stay light. The Reduced tier renders the SVG hairline complete instead, exactly as Static does. Measured on an emulated phone and tablet: tier `reduced`, SVG opacity 1, zero Three.js requests, no console output. See ADR 0020 section 16.



Nothing yet.
