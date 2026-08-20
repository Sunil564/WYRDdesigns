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

### 8. Resend API key

Phase 5 sends the contact form through Resend to `hello@wyrddesigns.in`. `RESEND_API_KEY` and a verified sending domain are needed for real delivery.

Unblocks by: a Resend account, a verified domain, and the key in the Vercel project.

Blocks: end to end delivery verification in Phase 5. The form, validation, and error states are testable without it.

## Resolved

Nothing yet.
