# Repositioning, option C: continuity as what in-house buys

Supersedes `REPOSITIONING-COPY.md` entirely. Delete that file.

Read `docs/brand.md`, `docs/decisions/0002-brand-document-conflicts.md`, and `CLAUDE.md` first.

---

## 1. The decision, and why the previous brief was wrong

The previous brief proposed continuity as a **replacement** differentiator. You correctly refused it: `brand.md` names in-house coverage of strategy, content and technical execution as the differentiator, instructs that it be said plainly, and its One line and descriptor are scope sentences end to end.

The operator has chosen option C. The differentiator does not change. In-house remains the claim, stated plainly, exactly as `brand.md` section 2 requires.

What changes is the emphasis: the site leads with what in-house **buys the client** rather than with the fact of it. The two are not competing positions, they are sequential. A studio that subcontracts its marketing cannot keep working on a brand after the site ships, because the people who did the work were never theirs. Continuity is the consequence of in-house, not an alternative to it.

So: `brand.md`'s differentiator section is untouched. Its One line and descriptor are amended to state the consequence alongside the fact.

## 2. `brand.md` section 2, the amendment

The operator has authorised this change. Make it first, in the same commit, so the document and the site never disagree.

**One line**, replacing "We don't just build websites. We build everything around them.":

> We build it. Then we grow it with you.

**Descriptor**, replacing the current one:

> WYRD Designs is a digital and creative studio covering what a brand needs to be seen, understood and remembered, online and offline. One team across strategy, content and production, in-house, so the people who built it are the people who keep working on it.

**Differentiator: unchanged.** Do not edit that paragraph. In-house against competitors who subcontract, said plainly, remains exactly as written.

**Taglines: unchanged.** "Shape what becomes." and "Weird works." are untouched.

Add a short note under the amended One line recording that it supersedes the previous line, the date, and that the differentiator was deliberately left in place.

Then update `docs/decisions/0002-brand-document-conflicts.md`, which records the old headline as agreed and unconflicted. That finding is now superseded. Do not delete it, mark it superseded with a pointer to the new ADR.

## 3. The site copy

### 3.1 Hero

Current:
> We don't just build websites. We build everything around them.
>
> Web, film, search, social, and the room it all happens in. One studio, one thread through the whole thing.

New:
> We build it. Then we grow it with you.
>
> Web, film, search, social, and the events where it all lands. One team, in-house, still here after launch.

Three notes so you can judge substitutions rather than guess:

- **"It" is deliberately broad.** The studio builds sites, films and exhibition stands. Naming any one narrows the claim back to a web shop.
- **"The events where it all lands"** replaces "the room it all happens in". That phrase was the only oblique item in a list of plain ones, and it hid the exhibitions and events work behind a metaphor. Events is the word the buyer already uses for that spend, and it maps to the Stage cluster and to the expo project.
- **"One team, in-house, still here after launch"** is the whole argument in six words: the differentiator plainly stated, then what it buys. This is the line that keeps the site consistent with `brand.md`.

**Length check.** The hero headline caused a CLS bug fixed by giving line 2 real slack. The new headline is shorter and the lead is shorter, but verify the wrap at 375, 412, 768, 1024, 1440, 1920 and 2560 and confirm CLS stays at 0 on both form factors. Do not assume shorter is safer.

The line lives in three places: `content/site.ts`, `content/home.ts`, and `scripts/check-home.mjs` asserts it. Update all three.

### 3.2 Positioning statement, S2

Current argues scope only:
> Most studios hand you a website and wish you luck. *The website is one surface.* The film, the search results, the ads, the booth at the trade show, the way the whole thing holds together: that is the work.

New, keeping the scope argument and adding why it holds:
> Most studios hand you a website and wish you luck. *The website is one surface.* The film, the search results, the ads, the stand at the expo, the way the whole thing holds together: that is the work. We do all of it ourselves, which is why we are still on it a year later.

Reveal mechanics unchanged: line by line mask, 120ms stagger, italic phrase last at 400ms, surrounding text at 70 percent until it lands. The added sentence reveals with the final group.

Note "the booth at the trade show" becomes "the stand at the expo", matching the events language in the hero and the expo project.

### 3.3 Studio strip, S7

Unchanged. It already argues access and continuity and is the best-written block on the site. Confirm you did not touch it.

### 3.4 Contact call to action, S8

Current: `Tell us what you are making.`

New: `Tell us what you are building.`

Aligns the verb with the headline. If it reads worse in place, keep the original and say so.

### 3.5 `/studio`

The thread paragraph's last sentence, "We handle the whole length of it", is a scope claim in continuity clothing. Replace with:

> We stay on it for the whole length.

The name paragraph above it is unchanged. The capabilities recap and process sections are unchanged.

### 3.6 `/work` and `/contact` headers

Report what they currently say before changing anything. `/work` reads "Selected projects. More on request." which is neutral and probably needs nothing.

### 3.7 Metadata

Meta descriptions on every route, the OG description, and the `Organization` structured data description were written against the old One line. Rewrite to match the amended descriptor. Report before and after for each.

## 4. Constraints

- Voice unchanged: confident, plain, unhurried. Short sentences. Concrete nouns.
- **The differentiator is said plainly.** `brand.md` forbids dressing it up. "One team, in-house" is the plain statement. Do not soften it into "integrated", "unified", "seamless" or "under one roof".
- No agency cliches. Easy to reach for here and banned: partner, journey, growth partner, end-to-end, holistic, ecosystem, elevate, unlock, scale your business, retainer language.
- **No result claims.** "We grow it with you" describes a service. "We grow your revenue" is a promise with nothing behind it.
- "Still on it a year later" in S2 is a statement of how the studio works, not a claim that any specific engagement has lasted a year. If that reads as a factual claim rather than a description of practice, flag it and propose an alternative rather than shipping it.
- No new facts, no numbers, no dates.
- No long em dashes.

## 5. Acceptance criteria

1. `brand.md` section 2 amended: One line and descriptor replaced, differentiator and taglines untouched, supersession note added. Show the diff.
2. ADR 0002's headline finding marked superseded with a pointer, not deleted.
3. New ADR recording the repositioning, why option C was chosen over replacing the differentiator, and that in-house survives as the mechanism for continuity.
4. Hero updated in all three locations: `content/site.ts`, `content/home.ts`, `scripts/check-home.mjs`.
5. Hero wrap verified at seven widths. CLS 0 on mobile and desktop, measured on the deployment.
6. S2 updated, reveal mechanics unchanged, italic phrase still reveals last.
7. S7 confirmed untouched.
8. S8 verb aligned, or original kept with a reason.
9. `/studio` last sentence updated, name paragraph untouched.
10. `/work` and `/contact` headers reported before any change.
11. All meta descriptions, OG description and structured data description rewritten. Before and after for each.
12. No banned word in the new copy. Grep the list in section 4.
13. No result claim, no new fact, no number. The fact audit criterion still passes.
14. No em dash characters. Grep.
15. Every harness criterion asserting the old copy rewritten, with a negative control proving it can still fail.
16. Full suite green before pushing to production.
17. Screenshots of the hero, S2 and `/studio` at 1440 and 412.

## 6. Judge by reading

Read the homepage top to bottom as a visitor would. The failure mode is a hero arguing continuity above a page still arguing scope, or a page that now argues both without connecting them.

Specifically: does "One team, in-house, still here after launch" read as one claim or as two stapled together? If it reads as two, say so and propose a fix rather than shipping it.

Report before I look.
