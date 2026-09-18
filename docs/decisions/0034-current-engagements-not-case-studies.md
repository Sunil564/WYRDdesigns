# 0034. `/work` lists current engagements, and the case study route is deleted

Status: accepted
Date: 2026-09-18
Phase: post launch build

## Context

`/work` held three project cards behind a cluster filter, and `/work/[slug]` held a case
study template built once, in Phase 5, against one cleared project whose visuals were all
still pending. Two of the three cards were flagged `Pending clearance` and carried no client
name at all.

That shape was honest but it was describing a studio with finished work to show, and this one
does not have any yet. What it has is six clients it is working for now. The operator asked
for the page to say that instead.

## Decision

**`/work` is a list of current engagements.** Six rows, one per client, matching the six
marks in the homepage client row. Header: "Work", and "Current engagements. Full case studies
as they finish."

**`/work/[slug]` is deleted**, along with `CaseStudyBlocks`, `ProjectHero`, `WorkCard`,
`WorkGrid`, `CursorLabel` and `scripts/check-case-study.mjs`. The template was good and is
not being thrown away: it is in git history at `bacea77~1` and comes back one project at a
time as case studies finish. Deleting it beats leaving a route that 404s on every slug or,
worse, one that renders a page with nothing on it.

`content/projects.ts`, `content/caseStudy.ts` and `components/ui/ProjectImage.tsx` are kept
and now import nowhere. They are the data and the renderer the returning template needs, the
image files in `public/work/` are still on disk, and deleting all of it to satisfy a dead
code check would mean reconstructing it from history in a month.

### Rows, not emptied cards

The card was a bordered frame whose remaining job, once the 4:5 image came out, was to look
like a picture that failed to load. The content per client is four short text fields, which
wants a rule above it and nothing else. One `EngagementRow` component serves `/work` and
homepage S4, so the two treatments cannot drift.

S4's asymmetry goes with it. A tall lead card across seven columns with two stacked in five
existed to give a lead image room, and there is no image. S4 is the first three rows, same
component, three equal rows.

### Nothing links, and the VIEW cursor is gone

There is no case study behind any of these, so a link would 404 or land somewhere saying less
than the row already does. The hover scale and the VIEW cursor label went with the link: an
element that lights up under the pointer and then does nothing is worse than one that never
offered.

### The filter is gone

Six rows do not need a filter. The chips were wired to `project.clusters`, and the engagement
content deliberately does not carry that field: the services list on each row is the
operator's own wording, which does not map cleanly onto the four clusters, and forcing it to
would be inventing a classification.

Removing the filter also took the only client state on the route, so `/work` is now entirely
a server component and `motion/react` no longer loads on it. `/work` first load JS went from
4.89kB to 2.58kB, and the homepage from 15.4kB to 14.3kB.

## The harnesses this broke, and what replaced them

Seven files, all of it breakage rather than improvement.

`check-case-study.mjs` is deleted with its route. In `check-work.mjs`, three of five criteria
measured things that no longer exist: card link resolution, one card per project keyed on
slug, and decoded card visuals. They were deleted rather than loosened, because an assertion
kept alive past its feature reads as coverage and is not. What replaced them asks what a list
can be asked: one row per engagement with no repeats, every row complete in all four fields,
nothing clickable inside a row, and no card frame or cursor label anywhere on the page.

The new fourth criterion compares homepage S4 against `/work` **page to page**, not either
against a list written into the harness. A copied list is a second source of truth that goes
stale silently.

`check-home.mjs` lost "S4 card hover scales the visual, shifts the title, and shows the VIEW
label" and gained the property the rows do have to hold: S4 is three inert rows with exactly
one link out, no images, no card frames.

`check-not-found.mjs` needed real thought rather than a find and replace. Its control was
`/work/bhavani-garments`, the live route that proves the 404 handler is not catching
everything, and that route is now deleted. Without a control, its two 404 assertions would
pass on a completely broken site. The control is `/work`, which is the right one because the
unmatched path it is paired against sits underneath it. The criterion "a real route with an
unknown parameter answers 404" is gone, because no parameterised route exists to test.

`check-studio.mjs`, `check-contrast.mjs` and `check-lighthouse.mjs` each carried the slug in a
route list and each lost that entry.

## Consequences

`app/sitemap.ts` no longer maps projects into paths. It would have published six addresses
that answer 404.

`docs/placeholders.md` described S4 cards, `/work` grid cards and the whole `/work/[slug]`
visual set. The S4 and grid rows are struck, and the case study section is kept in full and
marked as describing a route that does not render, because it is the capture brief for the
first project that comes back.

**The client names do not match the logo row.** Five of the six differ from
`content/clients.ts`. See BLOCKERS item 21. That is not created by this decision, it is
surfaced by it: before today the client names existed only as logo alt text, and now they
are headings on two pages.
