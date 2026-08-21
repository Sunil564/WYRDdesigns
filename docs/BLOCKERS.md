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

`RESEND_API_KEY` is unset, so the contact form cannot deliver. It does not pretend otherwise: the visitor is told the message has not gone through and given the direct address, and the server logs a line naming the variable. `scripts/check-contact.mjs` runs that path on every run and asserts it, so the behaviour cannot regress into a silent success.

The sender is `onboarding@resend.dev`, Resend's own verified address, because a custom sender needs a verified domain and the production domain is not registered. It moves to the real domain along with item 1.

Unblocks by: creating a Resend account, adding `RESEND_API_KEY` to the Vercel project, and the same variable locally. One variable, no code change.

Blocks: the form actually delivering. Nothing else. Every other path on `/contact` works without it.


### 10. Lighthouse has never been run, on any route

Not once, in any phase. Every score the build plan sets a number for is unverified: Accessibility 100 on every route, which is plan criterion 613 and Phase 5 criterion 2, and both Performance budgets, mobile Reduced tier at 90 or above and desktop Full tier at 85 or above, from plan section 602 and 603.

What has been measured instead, per route, is the set of things a harness can assert directly: one `h1`, one of each landmark, a title and description that are not the defaults, every keyboard stop rendered and carrying a visible focus ring, every interactive target 44px tall, no horizontal scroll from 320 to 2560, every rendered text and background pair against WCAG AA contrast ratios, and JS transferred against both tier ceilings. Those overlap with a good part of what Lighthouse's accessibility audit checks and with none of what its performance audit checks. They are not a substitute and have never been reported as one.

Unblocks by: adding `lighthouse` as a devDependency and running it against the verification server on 3100. Playwright's Chromium is already installed and can be launched with `--remote-debugging-port`, which is the endpoint Lighthouse drives, so no second browser is needed. The one thing this environment cannot give is a trustworthy Performance number: it is a headless software renderer with no GPU, and the same page here measures 16.7 to 24.7ms median frame time across runs. Accessibility, Best Practices and SEO are device independent and would be real. Performance has to come from a real device, which is item 11.

Blocks: closing Phase 5 criterion 2 and plan criteria 1, 2 and 10. Nothing ships differently because of it.

### 11. Frame rate on real hardware is unverified

Particle brief criterion 21 asks for 60fps while scrolling the full page on a mid-range laptop, and never below 30fps on any Full tier device. Neither figure has been measured on hardware.

Everything in this build was measured headless with no GPU, where the same sweep reads 16.7 to 24.7ms median depending on viewport and run. Those numbers say the work got cheaper as counts came down, which is real, and they say nothing about whether a 2021 laptop holds 60fps.

Unblocks by: running the page on a real device, which is also what item 10's Performance half needs. `scripts/check-hero.mjs` already reports an fps figure and asserts only the 30fps floor, which passes headless and is not the criterion.

Blocks: closing criterion 21. Nothing ships differently because of it.

### 12. Two rendering judgements need a real display

Both were reported at the time and neither is a fault, but both are judgements a headless screenshot cannot settle.

The hero field at 5,280 is at the edge of reading as sparse: individual particles are separately countable at 1440 where they read as a texture before. And the spiral trail reads as a fuzzy line in a still frame rather than as a rotating trail, because its rotation exists only as motion, at one turn per eight seconds.

Unblocks by: looking at both on a physical screen at full brightness. If the field reads as thin, the count is one constant. If the rotation reads as busy rather than alive, the spin rate is another.

Blocks: nothing. See ADR 0020 sections 11 and 14.

### 13. A high severity advisory in a transitive dependency

`npm audit` reports three high severity findings, all the same one: `sharp` below 0.35.0 inherits libvips vulnerabilities CVE-2026-33327, CVE-2026-33328, CVE-2026-35590 and CVE-2026-35591. `sharp` arrives through `next`, not through anything this build chose, and it was already present before Phase 5. It surfaced here because installing Resend ran the audit.

`npm audit fix --force` resolves it by installing `next@16.3.1`, which is a major version bump across the whole application and not a decision to take inside a route commit.

Unblocks by: an operator decision on upgrading Next, taken as its own piece of work with the full harness run afterwards.

Blocks: nothing today. `sharp` is used at build time for image optimisation and is not in the request path of any route this build ships.

### 14. The footer links to two routes that do not exist

`content/site.ts` gives `legalNav` a Privacy and a Terms entry, and the footer renders both on every page. Neither route exists: both return 404, confirmed against the verification server. Every page on the site therefore carries two links a visitor can click into an error.

It surfaced while fixing a harness pattern, not by looking at the footer. `scripts/check-hero.mjs` had been masking `/work`, `/studio` and `/contact` from its 404 check since those routes were unbuilt, and once they all shipped and the mask came off, the two that were genuinely broken were the ones left.

Neither route is in the Phase 5 brief, and neither can be written by this build: a privacy policy and terms of service are legal documents about how a real company handles real data, and inventing their contents is the same failure as inventing a client name.

Unblocks by: supplying the two documents, or deciding the site ships without them. If it ships without them, the fix is deleting the two entries in `legalNav` and the footer section disappears on its own, the same way the client logo row would.

Blocks: nothing shipping today, but it is the only place on the site where a visible link is known to fail.

## Resolved

### Reduced tier rendered no Thread

Was item 10. Section 2.3 of the particle brief gave the Reduced tier a 2D canvas overlay and it was never built, so on that tier nothing drew the route: the WebGL scene is not mounted, the SVG carrier sat at `opacity: 0`, and there was no overlay to take its place. Because `useRenderTier` returns Reduced for any coarse pointer before any capability test, that was every phone and every tablet without reduced motion enabled.

Resolved by decision rather than by build. The overlay was scoped and rejected as disproportionate: it would have meant a second implementation of the reveal, the head, the inverse band switch, the dispersion, the spiral, the text dimming and the handoff, each free to drift from the shader's version with nothing comparing them, on the one tier that exists to stay light. The Reduced tier renders the SVG hairline complete instead, exactly as Static does. Measured on an emulated phone and tablet: tier `reduced`, SVG opacity 1, zero Three.js requests, no console output. See ADR 0020 section 16.



Nothing yet.
