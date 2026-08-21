# Blockers and open items

Nothing here halts the build. Each item is a real world fact the build cannot invent, with the exact consequence of it staying unresolved.

**Numbers here are permanent identifiers, never reused and never renumbered.** Code comments and ADRs cite them by number, so closing item 3 does not turn item 4 into item 3, and a resolved item keeps its number in the Resolved section below. This rule exists because it was already broken once: item 14 was the footer 404s, was resolved, and its number was immediately reused for a new item, which left `app/privacy/page.tsx` pointing at the wrong entry. Gaps in the sequence are correct.

## Open

### 1. Production domain not registered

Section 0.4. `NEXT_PUBLIC_SITE_URL` is unset, so absolute URLs resolve to the Vercel deployment URL, or to `http://localhost:3000` in development. `docs/brand.md` records the intended domain as `wyrddesigns.in`.

Unblocks by: registering the domain and setting `NEXT_PUBLIC_SITE_URL` in the Vercel project. One variable, no code change. See ADR 0005.

Blocks: Phase 7 deploy to a production domain. Nothing earlier.

### 2. No vector mark, no dark variant, no square glyph

**Partially resolved.** The supplied raster is now in use on every light ground: the header, the favicon set at 16, 32, 180 and 512, and the OG mark. It had been sitting unused in `public/brand/` since Phase 0 because ADR 0003 shelved it for a dark canvas that Phase 4b replaced. See ADR 0023.

Three things are still missing, and they are separate asks:

- **A vector.** Every size shipped is a resample of a 2101px raster. Adequate for a 40px header at 3x, not adequate for anything larger, and the footer's closing treatment renders around 665px tall at 2560px, which no crop of this file can serve.
- **A variant drawn for a dark background.** Measured against `--color-bg-inverse`, the artwork's darkest ink is 1.06:1 and the Y's gradient reaches about 1.4:1. Rendered and looked at, it is a ghost with `Designs` gone entirely. Section 0.3 forbids recolouring a supplied mark, so the header's `inverse` branch and the footer both keep the typographic fallback until a real variant exists.
- **A square single glyph.** The lockup is 2.124 aspect. Letterboxed into a favicon it leaves the mark small: legible as a shape at 32px, rough at 16px.

Unblocks by: supplying an SVG, AI, EPS or PDF of the mark, a variant for dark grounds, and ideally a square glyph. Any one of the three is independently useful.

Blocks: nothing. The site ships the raster on light grounds and type on dark ones.


### 4. Client logo clearance

**Not affected by the WYRD mark being supplied, and still open.** This item is about the six *client* marks, Bhavani Sarees, G Monisa, Maharaja, SITEO, Seervi Business Expo and Vahini Pipes, not about WYRD's own. `docs/brand.md` says named case studies are pending clearance and that the site uses capability proof rather than logos. Six client logos were supplied anyway and the brief specifies a logo section, so they render. See ADR 0002 section 6.

What is still needed is one sentence from the operator confirming the six are cleared for display. Nothing about the WYRD mark answers it.

Unblocks by: that confirmation. If clearance has not been given, deleting the entries in `content/clients.ts` removes the section, and the row disappears on its own at zero.

Blocks: nothing shipping, but it is the only place on the site that publishes another company's property.


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



### 11. Sustained frame rate on real hardware is unverified

**Not closed by the Lighthouse run, and worth being precise about why.** Lighthouse scores page
load: first paint, largest paint, blocking time, layout shift, speed index. Plan criterion 21
is a different measurement, holding 60fps while scrolling the full page on a mid range laptop
and never dropping below 30fps on any Full tier device. No Lighthouse run of any kind reports
that, so item 10 closing leaves this exactly where it was.

Everything that has measured frame rate in this build measured it headless with no GPU, where
the same sweep reads 16.7 to 24.7ms median depending on viewport and run. Those numbers say the
work got cheaper as counts came down, which is real, and say nothing about whether a 2021
laptop holds 60fps.

One number from the production run is adjacent and worth carrying here: desktop Total Blocking
Time is 270ms, on a deployment measured through Lighthouse's desktop CPU profile. That is the
Full tier's Three.js initialisation and it is the largest single cost in the desktop score. It
is a load time figure, not a scroll figure, so it bounds the problem rather than answering it.

Unblocks by: opening the deployed site on a real device and watching the frame counter while
scrolling. `scripts/check-hero.mjs` already reports an fps figure and asserts only the 30fps
floor, which passes headless and is not the criterion.

Blocks: closing plan criterion 21. Nothing ships differently because of it.


### 12. Two rendering judgements need a real display

Both were reported at the time and neither is a fault, but both are judgements a headless screenshot cannot settle.

The hero field at 5,280 is at the edge of reading as sparse: individual particles are separately countable at 1440 where they read as a texture before. And the spiral trail reads as a fuzzy line in a still frame rather than as a rotating trail, because its rotation exists only as motion, at one turn per eight seconds.

Unblocks by: looking at both on a physical screen at full brightness. If the field reads as thin, the count is one constant. If the rotation reads as busy rather than alive, the spin rate is another.

Blocks: nothing. See ADR 0020 sections 11 and 14.

### 13. Advisories whose only fix is a Next major

Assessed in full in ADR 0021, not upgraded. `next` stays at 15.5.23.

Two chains reach `next`, and neither is exploitable in this deployment:

- **`sharp@0.34.5`**, four inherited libvips CVEs. The advisory carries no CVSS vector, which is worth knowing before reading "high". sharp backs the `/_next/image` endpoint, which is request time rather than build time and is live: measured, it returns 200 on a local asset and 400 on both a remote URL and a path traversal. Nothing here uses `next/image`, and with no `images.remotePatterns` configured the optimizer will decode only files we committed. The CVEs need malformed image data and nobody can supply any.
- **`postcss`**, four advisories needing attacker controlled CSS. Two versions are in the tree and the one that processes our stylesheet, `postcss@8.5.26` under `@tailwindcss/postcss`, is above every affected range. Next's bundled 8.4.31 is the vulnerable one. There is no path by which a stranger supplies CSS to this build.

**What would change the sharp conclusion:** adding `images.remotePatterns` to `next.config.ts`. That single line turns a closed input into an open one.

Also recorded here because it was introduced by this build rather than inherited: installing `lighthouse` as a devDependency brought `extract-zip` at high severity via `@puppeteer/browsers`, and fifteen moderate `@opentelemetry` advisories via `@sentry/node`. Development only, none ships. That is the cost of the Lighthouse harness.

Unblocks by: an operator decision to upgrade, taken as its own piece of work. ADR 0021 recommends a deployed preview first, so Performance and real device behaviour become measurable, because the upgrade swaps webpack for Turbopack and Performance is precisely what the suite cannot verify. That ordering also closes items 10 and 11.

Blocks: nothing. Neither advisory is reachable with attacker controlled input.


### 15. The USD budget brackets have no source

Decision needed, not a defect. Nothing about them is wrong today, and they are the only figures on `/contact` with no document behind them.

`docs/brand.md` section 5 states a deal size of Rs 25,000 to Rs 5,00,000, so the INR brackets are anchored to a verified range with one interior boundary as structure. No USD figure appears anywhere in the supplied material. Converting the rupee range would mean choosing an exchange rate and baking today's rate into the repository, where it would quietly go wrong. So the USD brackets are independent round numbers for the secondary market: under $1,000, $1,000 to $5,000, $5,000 to $25,000, above $25,000.

Two ways to resolve, both the operator's:

- Supply real USD brackets, and they replace the four values in `budgetOptions.USD` in `content/contact.ts`.
- Drop the currency toggle, and the form ships INR only. That is a smaller change than it sounds: delete `budgetOptions.USD` and the `currencies` array, and the toggle and its `role="group"` come out of `ContactForm` with them.

Blocks: nothing shipping. `scripts/check-contact.mjs` allows the current figures explicitly in its digit allowlist, so changing them fails that criterion until the allowlist is updated too, which is the intended coupling.

### 16. The Full tier page transition is the plain one

Decision needed, not a defect. Section 7b.2C specifies a WebGL dissolve for the Full tier: the outgoing page rendered to a render target and dissolved through a noise threshold. What ships is an opacity transition, the same on every tier.

It is not built because it needs the outgoing page as a texture, and browsers do not expose a way to rasterise a live DOM tree into a WebGL render target. A DOM to canvas library would be a large new runtime dependency of the kind `CLAUDE.md` exists to prevent, and an SVG `foreignObject` snapshot taints the canvas and drops external resources, so the fonts and the client logos would be missing from the snapshot the effect is made of.

The View Transitions API does natively what 7b.2C describes, including animating through a mask, and is the right modern answer to that specification. It is Chromium only for now and sits behind `experimental.viewTransition` in Next 15.

The Reduced tier's specified 24px Y offset is also not implemented, and cannot be while the WebGL canvas lives inside the routed tree: a transform on the transition wrapper would re-anchor that `fixed` canvas and drag the hero field and the Thread on every navigation to the homepage.

Unblocks by: a decision on View Transitions, taken deliberately with the plain crossfade as the fallback. ADR 0022 has the full reasoning.

Blocks: nothing. The transition that ships works on every tier and is asserted by `scripts/check-transitions.mjs`.

## Resolved

### 10. Lighthouse Performance was unverified

Closed against the deployment, both budgets, both tiers, with the tier each form factor resolved to measured rather than assumed:

| | budget | scored | tier | |
|---|---|---|---|---|
| mobile | 90 or above | **100** | `reduced`, `pointer:fine false` | FCP 0.9s, LCP 0.9s, TBT 0ms, CLS 0, SI 2.0s |
| desktop | 85 or above | **89** | `full`, `pointer:fine true` | FCP 0.2s, LCP 0.3s, TBT 270ms, CLS 0, SI 0.9s |

Plan sections 602 and 603 write the budgets per tier, and the form factor is what picks the tier: Lighthouse's mobile emulation reports a coarse pointer, and `useRenderTier` sends every coarse pointer to Reduced before any capability test. Both resolved as intended, which is asserted as part of the criterion rather than assumed, because a mobile 100 reported as a Reduced tier number would be a false claim if the page had served Full.

Accessibility is 100 on all seven routes against the deployment as well as locally. Best Practices is **100** on the deployment against 96 locally, which confirms rather than predicts what that gap was: the two local 404s for `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js`, files Vercel's edge serves and a local server does not have.

`scripts/check-lighthouse.mjs` gained a remote mode for this. It takes an auth cookie from a Vercel share link and sends it as a header, so the audited URL is the clean one with no redirect and no token in it rather than the share URL itself.

Still open and not closed by this: item 11, sustained frame rate, which Lighthouse does not measure.



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
