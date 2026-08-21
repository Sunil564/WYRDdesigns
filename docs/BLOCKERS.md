# Blockers and open items

Nothing here halts the build. Each item is a real world fact the build cannot invent, with the exact consequence of it staying unresolved.

**Numbers here are permanent identifiers, never reused and never renumbered.** Code comments and ADRs cite them by number, so closing item 3 does not turn item 4 into item 3, and a resolved item keeps its number in the Resolved section below. This rule exists because it was already broken once: item 14 was the footer 404s, was resolved, and its number was immediately reused for a new item, which left `app/privacy/page.tsx` pointing at the wrong entry. Gaps in the sequence are correct.

## Open

### 1. Production domain not registered

Section 0.4. `NEXT_PUBLIC_SITE_URL` is unset, so absolute URLs resolve to the Vercel deployment URL, or to `http://localhost:3000` in development. `docs/brand.md` records the intended domain as `wyrddesigns.in`.

Unblocks by: registering the domain and setting `NEXT_PUBLIC_SITE_URL` in the Vercel project. One variable, no code change. See ADR 0005.

Blocks: Phase 7 deploy to a production domain. Nothing earlier.

### 2. No vector or light variant of the WYRD mark

The supplied mark is a black on transparent PNG. It is invisible on `--color-bg`, and it is not this build's place to recolour a brand mark. The header and footer therefore set the wordmark in Satoshi as an interim treatment, tagged `data-placeholder`.

Unblocks by: supplying an SVG, AI, EPS, or PDF of the mark, plus a variant intended for dark backgrounds. Ideally also a square single glyph mark for a 16px favicon.

Blocks: nothing. The site ships with a typographic wordmark until then. See ADR 0003.


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


### 10. Lighthouse Performance is unverified

**Half of this is now closed.** Lighthouse runs on every route, in `scripts/check-lighthouse.mjs`, as a devDependency driving Playwright's own Chromium against the verification server. Accessibility and Best Practices are device independent, so they are real numbers here.

Accessibility is **100 on all seven routes**, which is plan criterion 10 and Phase 5 criterion 2, closed. It was not 100 when first measured: the homepage scored 96 and `/work` 98, and three real defects had to be fixed first. Those are in the commit that added this.

Best Practices is **96 on the homepage and 96 elsewhere**, reported and not gated because the plan sets no target. The only failing audit is `errors-in-console`, and the only two entries are 404s for `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js`, which Vercel's edge serves and a local server does not have. It would be 100 deployed, and that cannot be verified from here.

What stays open is **Performance**, both budgets: mobile Reduced tier at 90 or above, desktop Full tier at 85 or above, from plan sections 602 and 603. The harness deliberately does not score it. This is headless Chromium on a software renderer with no GPU, where the same page measures 16.7 to 24.7ms median frame time across runs, so a Performance score from here would be a precise looking figure that says nothing about a real device. SEO is also unscored, for a narrower reason: several of its audits check a canonical against a real origin, and the production domain does not exist, so it would be scoring item 1 rather than the markup.

Unblocks by: running Lighthouse against a deployed preview on real hardware. The harness already takes a `SHOOT_BASE`, so it is one environment variable and no code change.

Blocks: closing plan criteria 1 and 2. Nothing ships differently because of it.


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


### 15. The USD budget brackets have no source

Decision needed, not a defect. Nothing about them is wrong today, and they are the only figures on `/contact` with no document behind them.

`docs/brand.md` section 5 states a deal size of Rs 25,000 to Rs 5,00,000, so the INR brackets are anchored to a verified range with one interior boundary as structure. No USD figure appears anywhere in the supplied material. Converting the rupee range would mean choosing an exchange rate and baking today's rate into the repository, where it would quietly go wrong. So the USD brackets are independent round numbers for the secondary market: under $1,000, $1,000 to $5,000, $5,000 to $25,000, above $25,000.

Two ways to resolve, both the operator's:

- Supply real USD brackets, and they replace the four values in `budgetOptions.USD` in `content/contact.ts`.
- Drop the currency toggle, and the form ships INR only. That is a smaller change than it sounds: delete `budgetOptions.USD` and the `currencies` array, and the toggle and its `role="group"` come out of `ContactForm` with them.

Blocks: nothing shipping. `scripts/check-contact.mjs` allows the current figures explicitly in its digit allowlist, so changing them fails that criterion until the allowlist is updated too, which is the intended coupling.

## Resolved

### 3. `Vaihini.png` spelling

The artwork read `Vahini PIPES` and the supplied filename read `Vaihini`. The site used `Vahini Pipes`, taken from the artwork rather than from the filename, and tracked the discrepancy rather than assuming the choice was right.

Confirmed correct by the operator. `Vahini Pipes` is the real company name, it is what `content/clients.ts` and `public/logos/manifest.json` already carry, and it is what renders. No code change was needed to close this, only the confirmation.

The filename keeps its original spelling in `manifest.json` under `source`, because it is the name of a supplied file and renaming a source asset to match a decision about a different field would lose the link back to what was handed over.


### 14. The footer linked to two routes that did not exist

`content/site.ts` gave `legalNav` a Privacy and a Terms entry, the footer rendered both on every page, and both returned 404. It was the only place on the site where a visible link was known to fail, and it surfaced while removing an expired 404 mask from `scripts/check-hero.mjs` rather than by looking at the footer.

Resolved by building both routes with holding text rather than by deleting the links. `/privacy` and `/terms` render through one shared `LegalPage` layout and take their prose from `content/legal/privacy.mdx` and `terms.mdx`, so supplying the real documents is a change to two `.mdx` files and one flag. Both pages say on the page that they are not the published document, state no date or period they cannot support, and give the direct address. `scripts/check-legal.mjs` follows the footer's own links and asserts all of it, 25 of 25.

Still open: the documents themselves. Neither can be written by this build.


### Reduced tier rendered no Thread

Deliberately unnumbered. This was item 10 while it was open, and its number was reused for the Lighthouse entry when it closed, which is the same mistake the rule at the top of this file now forbids. Rather than renumber the Lighthouse item and break the ADR that cites it, this one keeps no number and is found by its title. Section 2.3 of the particle brief gave the Reduced tier a 2D canvas overlay and it was never built, so on that tier nothing drew the route: the WebGL scene is not mounted, the SVG carrier sat at `opacity: 0`, and there was no overlay to take its place. Because `useRenderTier` returns Reduced for any coarse pointer before any capability test, that was every phone and every tablet without reduced motion enabled.

Resolved by decision rather than by build. The overlay was scoped and rejected as disproportionate: it would have meant a second implementation of the reveal, the head, the inverse band switch, the dispersion, the spiral, the text dimming and the handoff, each free to drift from the shader's version with nothing comparing them, on the one tier that exists to stay light. The Reduced tier renders the SVG hairline complete instead, exactly as Static does. Measured on an emulated phone and tablet: tier `reduced`, SVG opacity 1, zero Three.js requests, no console output. See ADR 0020 section 16.



Nothing yet.
