# 0028. The budget brackets are rupees only, and there is no currency toggle

Status: accepted
Date: 2026-08-22

## Context

`/contact` shipped two sets of budget brackets and a chip toggle between them, defaulting to
INR.

The INR set is sourced. `docs/brand.md` section 5 states a deal size of Rs 25k to Rs 5L, so
both endpoints are a verified range and only the interior boundary is structure.

**The USD set was not sourced and never could be from what we hold.** No dollar figure appears
anywhere in `docs/brand.md`. Converting the rupee range would have meant inventing an exchange
rate and baking one day's rate into the repository, so the brackets shipped as independent
round numbers chosen to look plausible for the secondary market. They were flagged in
`docs/BLOCKERS.md` item 15 as a decision needed rather than presented as sourced, which was
the right call at the time and was never a stable resting place.

The site's second non-negotiable rule is that a fact which is not verified does not render.
Four unsourced money figures behind a toggle is that rule being escaped by one click.

## Decision

Rupees only. The USD brackets are deleted and the currency toggle with them.

A US enquiry states its budget in the message field. That costs the visitor one sentence and
costs the site nothing it cannot stand behind. It is also more useful than a bracket: a
sentence carries context that four fixed ranges cannot.

The toggle went with the brackets rather than being kept for a future currency. A control with
one option is not a control, and leaving it would have invited exactly the same numbers back.

## What changed

- `content/contact.ts`: `budgetOptions` is a flat array rather than a record keyed by currency.
  The `Currency` type and the `currencies` list are gone. The hint reads "Optional, in rupees",
  so the currency is stated in copy where the toggle used to state it in UI.
- `components/sections/ContactForm.tsx`: the chip group is gone, and with it the `currency`
  state. The select maps `budgetOptions` directly.
- `lib/contact-schema.ts`: the accepted values are one list rather than the union of two.
  Worth noting for what it prevents: the schema would otherwise have kept accepting the four
  USD values after nothing could submit them, which is how a removed feature keeps a live
  server route.

## The harness asserted the toggle, twice

One criterion required exactly two currency chips with pressed state. Another clicked USD and
asserted the brackets switched. Both described the feature rather than the requirement.

The remaining criterion is `the budget select offers INR brackets only, with no currency
toggle`, which folds the chip count into the same assertion. That matters: the previous
version asserted the select *defaults* to INR, which a toggle satisfied while still offering
unsourced figures one click away. The claim is "rupees only", so the escape route is part of
what has to be checked.

`/contact`'s digit allowlist criterion now reports only phone numbers, structural counts and
the three rupee figures.

## Consequences

- `docs/BLOCKERS.md` item 15 closes.
- The US market is a stated secondary audience in `docs/brand.md` and now has no budget
  qualifier on the form. That is a real cost, accepted deliberately: an unqualified enquiry is
  better than a qualified one built on invented numbers.
- If USD brackets are ever wanted, they need a sourced figure first. This ADR is the record of
  why they cannot simply be added back.
