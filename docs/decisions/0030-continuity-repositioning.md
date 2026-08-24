# 0030. Continuity as what in-house buys, not as a replacement differentiator

Status: accepted
Date: 2026-08-24
Phase: 5

## Context

The site's copy argued **scope**: we do more than websites, we also do film and search and events. Every headline was a variation of that argument, and it came straight from `docs/brand.md` section 2, whose One line was `We don't just build websites. We build everything around them.`

An operator brief proposed replacing that argument with **continuity**: we build the thing and we keep working on it with you, with continuity as the new differentiator.

That brief was refused before any code changed. `docs/brand.md` names exactly one differentiator, in-house coverage of strategy, content and technical execution against competitors who subcontract, and instructs that it be said plainly and not dressed up. Its One line and its descriptor are scope sentences end to end. Nothing in section 2 mentions duration, after launch, or ongoing work. Replacing the differentiator would have put the site in direct contradiction with the document that outranks it on positioning, per the precedence rule in `CLAUDE.md`, and `brand.md` is the operator's to change.

## Options considered

1. **Ship the continuity hero, leave `brand.md` alone.** Two sources of truth immediately, drifting from the first commit. Every later phase re-litigates which one is right. Refused.
2. **Keep the scope position, change nothing.** Costs nothing and forgoes the argument. The buyer's real objection is an agency that disappears once the invoice clears, and a scope list does not answer it.
3. **Replace the differentiator with continuity, and amend `brand.md` to match.** Coherent, but it throws away the one claim the studio can actually substantiate. In-house is verifiable from `brand.md` section 6. Continuity on its own is a promise with no mechanism attached, and the reader has no reason to believe it.
4. **Keep the differentiator, lead with what it buys.** Chosen.

## Decision

The differentiator does not change. In-house remains the claim, stated plainly, exactly as `brand.md` section 2 requires.

What changes is the emphasis. The site leads with what in-house buys the client rather than with the fact of it. The two are sequential, not competing: a studio that subcontracts its marketing cannot keep working on a brand after the site ships, because the people who did the work were never theirs. Continuity is the consequence of in-house, not an alternative to it.

Concretely:

- `docs/brand.md` section 2 One line is amended, by operator decision, to `We build it. Then we grow it with you.` A dated supersession note sits under it.
- The descriptor gains the consequence clause: `in-house, so the people who built it are the people who keep working on it.`
- The differentiator paragraph and both taglines are untouched.
- The hero lead states the differentiator and then what it buys, in that order: `One team, in-house, still here after launch.`
- S2 keeps its scope argument in full and gains one closing sentence naming the mechanism.
- Meta descriptions, the OG description and the `Organization` and `LocalBusiness` structured data descriptions follow the amended descriptor.
- ADR 0002 section 2, which recorded the old headline as agreed and unconflicted, is marked superseded with a pointer here. It is not deleted.

## What was deliberately not written

**No duration claim.** The brief's draft of the S2 closing sentence read `which is why we are still on it a year later`. That is a statement about how long this studio's engagements have run, and the studio is new. It is the same category of fact as a founding year or a client count, which the second non-negotiable rule in `CLAUDE.md` forbids, and no number check would have caught it because `a year` has no digits in it. Shipped instead: `which is why we are still on it long after the site goes live`, which describes the practice and asserts no measured length.

**No result claim.** `We grow it with you` describes a service. `We grow your revenue` would be a promise with nothing behind it.

**One substitution against the brief.** The brief replaced S2's `the booth at the trade show` with `the stand at the expo`, to drop the two American nouns. The site says `stall`, not `stand`: `brand.md` section 3 fixes the exhibitions service wording as `Stall design, collateral and on-ground management`, and the project on `/work` is `Exhibition presence, hospitality`. `Stall` is the word the studio and its buyers already use, and `stand` would have been a synonym appearing nowhere else on the site. `Expo` stands, as the event noun.

**No softening of the differentiator.** `brand.md` forbids dressing it up, so the hero says `in-house` and not `integrated`, `unified`, `seamless` or `under one roof`.

## Consequences

- `docs/brand.md` and the site now argue the same thing, and the amendment landed in the same commit as the copy, so there is no revision in which they disagree.
- The `/studio` opening paragraph renders `site.descriptor` directly, so the amended descriptor puts the continuity argument on that route with no separate copy change.
- `scripts/check-home.mjs` gains a superseded-copy criterion alongside the locked-copy one. A positive check on new copy cannot detect old copy left behind in a second component or a meta tag, which is the actual failure mode of a repositioning: a hero that argues one thing above a page that still argues the other.
- The Thread metaphor now fits better than it did. A thread is continuous, which was always a slightly odd fit for a scope argument. No motion work follows from this: the observation is recorded so nobody re-derives it.
- The timing measurements in `SplitHeadline` and the tracking compensation in `globals.css` were both derived from the 62 character headline. Both are annotated with what they were measured against. Neither is re-derived, because both are protected by direct assertions rather than by the numbers in the comments.
