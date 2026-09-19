# 0037. The first contact number changed, and brand.md was not edited

Status: accepted
Date: 2026-09-19
Phase: post launch build

## Context

The operator replaced the first of the studio's two contact numbers on 2026-09-19:

| | was | is |
| --- | --- | --- |
| first | `+91 86603 33165` | **`+91 63619 61213`** |
| second | `+91 82176 18082` | unchanged |

Both numbers reached the codebase through `docs/brand.md` section 1, which is a supplied
document. ADR 0002 records them as verified supplied facts, which is why the `/contact`
phone line, the `/studio` contact block, the footer and the `LocalBusiness` structured data
all render a phone at all.

## The conflict this creates

`CLAUDE.md` sets `brand.md` above everything else on stated facts, and a phone number is a
stated fact. It also says the file is never edited: a supplied document is a record of what
was supplied, and rewriting it destroys the ability to tell what the studio actually handed
over from what was decided later.

So the two rules point in opposite directions here, and this is the resolution.

## Decision

**`content/site.ts` carries the new number. `docs/brand.md` is not touched.**

A direct instruction from the operator, given today, outranks a document they supplied
earlier. The supplied file is evidence of what was true when it was written, not a standing
veto on the operator changing their own phone number.

`docs/supplied-superseded/site-spec.md` also still carries the old number and is likewise
untouched, for the same reason and more obviously, since that whole directory is superseded
material kept for the record.

**So `docs/brand.md` section 1 now disagrees with the running site, on purpose.** Anyone
reconciling the two should read this ADR and not "fix" brand.md. If the phone list is ever
regenerated from brand.md, the old number comes back.

ADR 0002 also names `+91 86603 33165` in its own text. It is not amended either. An ADR
records what was decided when it was decided, and editing that sentence would make ADR 0002
claim it had considered a number that did not exist yet.

## Consequences

Three harness allowlists carried the digits and would otherwise have failed. Each of them
exists to prove that no number appears on a route without a source, so each had to learn the
new one: `check-home.mjs`, `check-studio.mjs` and `check-contact.mjs`.

Nothing else changes. The number is defined once, in `content/site.ts`, and the four places
it renders all read it from there. The `tel:` hrefs strip whitespace at render, so the
grouping is display only and the new value is grouped `+91 XXXXX XXXXX` to match its
sibling rather than run together as it was dictated.

If a future supplied document needs to add to `brand.md` rather than contradict it, the
pattern from `CLAUDE.md` still applies: a separate file, never an edit.
