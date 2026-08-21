# Phase 5: the four remaining routes

Standalone brief. Read `WYRD-WEBSITE-BUILD-PLAN.md` sections 6.2 to 6.5, `docs/brand.md`, and `CLAUDE.md` first. This adds constraints learned during the thread work that the original plan did not carry.

Four routes: `/work`, `/work/[slug]`, `/studio`, `/contact`.

---

## 1. The constraint that shapes all four

The studio is new and has a short list of completed projects. Six client logos exist. Almost nothing else does.

**Never invent a client name, a project, an outcome, a statistic, a testimonial, a date, a team member, or a price.** This is the hardest rule in the build and these four routes are where it will be under most pressure, because case study templates and work grids are shaped to hold content that does not exist yet.

The rule when content is missing: **the element does not render.** Not a placeholder that reads as real. Not lorem. Not a plausible-sounding invention. An absent section is correct.

Every placeholder that does ship gets `data-placeholder` and an entry in `docs/placeholders.md` stating what should replace it.

## 2. Carry these forward from the thread work

Six process rules earned during the last stretch. They apply to everything below.

- **Assert on pixels, or on what the renderer reports drawing.** Never on a sibling subsystem's state, never on a computed style standing in for a visual outcome.
- **Never force a tier or flag in the harness.** Measure what a real device resolves to.
- **Assert against values the page publishes,** not constants copied from source. A copied constant is a second source of truth that goes stale silently.
- **Stop after three diagnostic attempts** on any single problem. Report what you ruled out and ask.
- **Do not measure what a person can see.** Report what you built and let the operator look.
- **A measured zero is a finding, not a null.**

## 3. Scope boundaries

**The Thread is homepage only.** Do not extend it to these routes. Inner pages carry the grain and the type system, not the particle work.

**Budget.** Full tier is at 456.7kb against a 500kb ceiling, Reduced at 229.5kb against 250kb. Phase 5 adds Zod, MDX, and layout animation. Both will be tight. Measure after each route and report. If either ceiling is threatened, stop and raise it rather than absorbing it.

**No new colour tokens, no new type sizes.** Everything comes from the existing design system. If a layout seems to need something new, it does not, use scale and weight.

---

## 4. `/work`

Per section 6.2 of the main plan.

- Header: `Work`, plus one line: `Selected projects. More on request.`
- Filter row: `All`, `Build`, `Reach`, `Show`, `Stage`. Filtering animates position with Motion's layout animation so cards move rather than pop.
- Card grid using the same card component as the homepage's S4.

**Do not pad the grid.** If four projects exist, four cards render. A grid with two real projects and four invented ones is worse than a grid with two. Close the page with the contact call to action.

Filter chips for clusters with no projects should be disabled or absent, not clickable into an empty state, unless the empty state is written honestly and reads well.

## 5. `/work/[slug]`

Per section 6.3. Built once as a template, populated with clearly flagged placeholder content.

Structure: full-bleed hero visual, project title, meta row (client, year, services, role), the brief in one paragraph, three to five work blocks alternating full-bleed and inset visuals, an outcome block, next and previous navigation.

**The outcome block does not render without real outcome data.** No fabricated metric, no "increased engagement", no percentage. If there is no number, the section is absent.

The meta row omits any field it does not have rather than showing an empty label.

## 6. `/studio`

Per section 6.4.

- Opening statement, large type.
- The name, once: `WYRD is Old English for fate. It also sounds like weird. We answer to both.` Then the thread paragraph. Never mention the name again anywhere on the site, and never write a sentence about it containing "but".
- Capabilities recap, compact list form. The four clusters under Direction.
- How we work: the expanded version of the homepage process section.
- **Team: only if real names are supplied.** If not, the section does not exist. Do not write a generic "our team" block.
- Location and contact.

## 7. `/contact`

Per section 6.5. Two columns: details left, form right.

Fields: Name (required), Company, Email (required, validated), What do you need (multi-select chips: Build, Reach, Show, Stage, Direction, Not sure yet), Timeline (Under 4 weeks, 1 to 3 months, 3 months plus, Exploring), Budget (optional select, INR brackets with a manual currency toggle to USD, defaulting to INR), Message (required).

**Handling.** Server Action, Zod validation on the server, Resend for delivery to `hello@wyrddesigns.in`. Honeypot field plus a timing check. No third party embedded form.

**Resend key.** If `RESEND_API_KEY` is absent, the form must fail visibly in development with a clear message, and must not silently succeed. Add the variable to `.env.example`. Note in `docs/BLOCKERS.md` that a real key is needed before launch.

**States:** idle, submitting (button label swaps, disabled), success (form replaced by a short confirmation in place, not an alert), error (inline, human wording, entered values retained).

Test the failure paths, not just the happy path: invalid email, missing required field, network failure mid-submit, double submit.

---

## 8. Acceptance criteria

Report each individually.

1. Every route has a unique title and meta description. Every absolute URL derives from `process.env.NEXT_PUBLIC_SITE_URL`. Grep confirms no hardcoded domain.
2. Lighthouse Accessibility 100 on all four routes.
3. Keyboard navigation complete, visible focus everywhere, focus order sensible in the form.
4. No horizontal scroll from 320px to 2560px on any route.
5. All touch targets 44px minimum.
6. Every text and background pair meets WCAG AA, including inside inverse blocks.
7. `prefers-reduced-motion` renders all four routes in final state, composed, no motion.
8. The form delivers to `hello@wyrddesigns.in` with a key present, and fails visibly without one.
9. All four failure paths tested: invalid email, missing required, network failure, double submit.
10. Filtering animates position rather than popping.
11. The case study template renders correctly for a project with no outcome data: section absent, not empty.
12. The work grid is not padded with invented projects.
13. `/studio` has no team section unless real names were supplied.
14. **Fact audit.** List every proper noun and every number rendered across the four routes, with its source. Anything without a source in `docs/brand.md`, the `Codebase2` folder, or an operator instruction is a failure.
15. Every placeholder tagged `data-placeholder` and listed in `docs/placeholders.md`.
16. Bundle measured after each route. Full and Reduced tier figures reported against their ceilings.
17. Zero TypeScript errors, zero ESLint errors, zero runtime console output.
18. No em dash characters anywhere in the repo.
19. No new colour tokens or type sizes introduced.
20. Harness criteria for these routes assert on pixels or published values, and force no tier.

## 9. Order

One route per commit. Report against the criteria that apply, then stop.

1. `/work`
2. `/work/[slug]`
3. `/studio`
4. `/contact`

`/contact` last because it is the only one with a server dependency and the most failure paths.

## 10. Judge by looking

At the end, screenshots of all four routes at 375, 768, and 1440, plus the form in each of its four states. The operator reviews before Phase 6.

State plainly which of the four routes is carrying the most placeholder content, since that is the one most at risk of reading as an empty template rather than as a small studio's honest site.
