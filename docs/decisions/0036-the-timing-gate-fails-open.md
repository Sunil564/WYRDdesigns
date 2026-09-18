# 0036. The contact form's timing gate starts on interaction and fails open

Status: accepted
Date: 2026-09-18
Phase: post launch build

## Context

The contact form carries two spam checks: a honeypot field that must arrive empty, and a
timing gate that rejects a submission arriving sooner than `MIN_ELAPSED_MS` after a hidden
`startedAt` stamp.

The operator reported that the live form rejected **every** submission with "That submitted
faster than a person can type", including slow deliberate ones, and asked whether the
timestamp was reaching the server at all before anything was changed.

## What was actually wrong

The stamp reached the server. Its value was the problem, and only after the first failure.

Reproduced against production, twice, driving the real form:

| step | `startedAt` |
| --- | --- |
| fresh page load | `1789720226614` |
| before a submit with a bad email address | `1789720226614` |
| **after that submit returned a validation error** | **`0`** |
| retry with the address corrected, four seconds later | refused: "faster than a person can type" |

**React 19 resets the form when a form action completes.** Every uncontrolled field returns
to its `defaultValue`, and the stamp's was `"0"`. It had been written once, by a
`useEffect` with an empty dependency array, so nothing ever wrote it again.

The action then did this:

```ts
const elapsed = Number.isFinite(startedAt) && startedAt > 0 ? Date.now() - startedAt : 0
if (elapsed < MIN_ELAPSED_MS) reject()
```

Unmeasurable became `elapsed = 0`, which is below every threshold. So a stamp of zero was
read not as "no measurement" but as "submitted instantly", and the form refused everything
from that point until a reload.

**A first submission on a fresh page always worked**, which is why this was not obvious and
why it survived review. The failure needs one validation error first. A visitor who typed
their email address correctly the first time never met it. A visitor who made a typo hit a
form that told them they were a bot, repeatedly, and could not recover without knowing to
reload the page.

### The harness was green throughout

`scripts/check-contact.mjs` passed 22 of 22 for the eight days this was in production. Every
scenario in it loaded the page, submitted once, and closed the context, so nothing ever
exercised the second submission. The suite was not wrong about anything it asserted. It
simply had no assertion for the state that only exists after a failure, and a green suite
was read as coverage of a route it did not cover.

## Decision

**The gate fails open.** A missing, empty, zero or unparseable stamp means the clock never
started, so there is nothing to measure and the check abstains:

```ts
const measurable = Number.isFinite(stamp) && stamp > 0
if (measurable && Date.now() - stamp < MIN_ELAPSED_MS) reject()
```

This is the important half of the change and it follows from what the check is for. The
honeypot is what catches bots; the timing gate only ever existed to raise the price of
clearing it. A backstop that refuses real enquiries has cost more than the spam it stopped.
Abstaining gives up almost nothing: a bot that omits the field still has to leave the
honeypot alone.

**The clock starts on first interaction, not on mount.** Mount time measures how long a tab
has been open. A page restored from bfcache, or sitting in a background tab for an hour,
makes that number meaningless in both directions. Focus and input handlers sit on the form
in capture phase, so one pair covers every field including any added later.

**The clock lives in a ref and is written back after every action**, which is what actually
survives React's reset. The hidden input is transport, not storage.

**It resets on `pageshow`**, which is the only event a bfcache restore fires. The next
interaction starts it again.

**Threshold is 2000ms**, down from 2500.

**The honeypot is untouched.**

### The message changed too

Was: "That submitted faster than a person can type. Try again."

That sentence accuses the visitor of being a script, and it was wrong every single time it
appeared in production, because the cause was our hidden field and not their behaviour. It
now takes the blame and carries the fallback address in the same line, so someone who has
just written a paragraph and been refused is not left hunting for another way to reach the
studio.

## The sender was also wrong

Separately, and it would have bitten on the next deploy regardless.

`RESEND_API_KEY` is read in `app/contact/actions.ts`, in `resendKey()`, from `process.env`
**at call time rather than at module load**, which is correct and means the deployed value
is the one used.

The `from` address was `WYRD Designs <onboarding@resend.dev>`. That is Resend's shared
sender, it was the right choice while no domain existed, and it only delivers to the Resend
account holder. With `wyrddesigns.in` verified and `send.wyrddesigns.in` as the sending
subdomain, **Resend refuses any send whose `from` is not on the verified domain**, valid key
or not.

The sender moves to `site.mailFrom`, `WYRD Designs <forms@send.wyrddesigns.in>`, defined
once in `content/site.ts` next to the recipient and overridable with `RESEND_FROM`. The
recipient is unchanged at `site.email`, `hello@wyrddesigns.in`, and `replyTo` is still the
visitor's own address, so replying to an enquiry reaches the person who sent it.

`forms@` is a choice, not a requirement. Any local part works as long as the domain is
`send.wyrddesigns.in`.

## Consequences

Three criteria added to `check-contact.mjs`, all of which fail against the old code: the
clock starts on interaction rather than load, it survives the reset that follows a failed
submit, and a submission with the stamp stripped entirely is not refused.

A bot that posts with no `startedAt` at all now clears the timing gate. That is the
intended trade and the honeypot still stands in front of it. If spam ever justifies a
stricter gate, the answer is a real token with a server side issue time, not reading an
absent measurement as a guilty one.
