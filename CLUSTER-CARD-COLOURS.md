# Cluster card colours

Read `docs/design-system.md`, ADR 0019 (light canvas conversion), and `CLAUDE.md` first.

This is a system change, not a colour swap. One commit.

A previous version of this work, including an audio component, exists at tag `neon-cards-and-audio-backup` (`32ba2fe`) and was reverted. The audio is out of scope here. Do not rebuild it, do not port anything from that tag except by reference if it helps. The palette below replaces the one in that version entirely.

---

## 1. The palette

Two colours, alternating across the four capability cluster cards.

| Card | Ground | Text | Contrast |
|---|---|---|---|
| 01 BUILD | `#4461E4` royal blue | `--fg-inverse` | 4.77:1 |
| 02 REACH | `#E4FDB8` lime tint | `--fg` | 17.94:1 |
| 03 SHOW | `#4461E4` royal blue | `--fg-inverse` | 4.77:1 |
| 04 STAGE | `#E4FDB8` lime tint | `--fg` | 17.94:1 |

Measured, so none of this needs re-deriving:

- Royal with white `#FFFFFF` is 5.15:1, with mist `#F7F6F4` is 4.77:1. Both clear AA. With near-black it is 3.84:1 and **fails** for body text.
- Lime with near-black `#0A0A0C` is 17.94:1. With white it is 1.10:1 and is unusable.
- The two grounds against each other measure 4.67:1, so they separate cleanly in a 2x2 grid and will not vibrate.

Verify all of these against the live tokens rather than trusting the table. If `--fg-inverse` or `--fg` have moved since these were computed, the numbers change.

## 2. The structural point

The two grounds take **opposite** contrast pairs. Royal cards read the inverse set, lime cards read the light set. That is the whole change: which pair a card points at, not a new set of text tokens.

The `variant` prop added in 4b already carries `light | inverse`. Extend it so a card selects its ground and its pair together. Confirm this maps onto what 4b built, and if it does not, say so before working around it. Do not invent a parallel `--fg-lime` token set unless a measurement forces one, and if it does, show the measurement.

New ground tokens: `--card-royal` and `--card-lime`. Their addition reverses the design system's single-accent rule. Write an ADR recording that reversal and why, so the rule reads as deliberately retired rather than forgotten.

## 3. The accent problem

`--accent` `#4C86DB` measures 1.41:1 on royal and 3.32:1 on lime. Unusable on both.

Remove the accent from inside these cards entirely rather than hunting a value that survives both grounds. Anything currently accented uses `--fg-inverse` on royal and `--fg` on lime, and the hairline sweep stays as the hover signal. The known case is the index digit turning accent on hover.

**Audit every accent usage inside these cards**, not just the index: links, focus rings, any hover state. Grep, do not assume.

Also flag: royal `#4461E4` and accent `#4C86DB` are close in hue. Screenshot the capabilities section with an accent button in frame and say whether they read as a deliberate pair or as a near-miss.

## 4. Scope: the four cards only

Do not colour the contact call to action, the footer, or the case study hero frames.

- The page needs a dark ending. Contact and footer read as one dark base and that is what gives the scroll a terminus.
- The contact CTA band carries the thread's inverse colour switch built in step 6, with band Y ranges as uniforms. Changing that ground reopens finished work.
- Case study frames exist to hold photography. A coloured frame fights the image.

The thread passes **behind** these cards per the standing occlusion ruling, so no particle colour logic should be affected. Confirm rather than assume.

## 5. Watch for

- **Focus rings.** Tuned for a dark ground. Verify on both new grounds.
- **The grain overlay.** It inverts inside `--bg-inverse` blocks. On lime especially, check it does not read as dirt.
- **Hairlines.** `--border-inverse` is invisible on lime. Lime cards take the light border or none.
- **Corner radius.** The design system specifies `0` for structural blocks and explicitly rejects a rounded-card look. The reference these colours came from used a radius; that is a separate decision and is not in scope here. Do not change the radius.
- **Case study and work cards.** If any component shares code with the cluster cards, confirm this change does not leak into it.

---

## Acceptance criteria

1. Cards render on the two grounds with the correct pair each. Every text and ground pair measured against the live tokens, all clearing AA, reported individually.
2. No accent-coloured element remains inside a cluster card. Grep output shown.
3. Colour applied to the four cluster cards only. Contact CTA, footer, case study frames, and work cards unchanged.
4. The thread still passes behind the cards and no particle colour logic changed. Verified.
5. `variant` extended rather than a parallel token set invented. If one was needed, the measurement that forced it is shown.
6. Focus rings visible on both grounds.
7. Grain does not read as dirt on either ground.
8. Corner radius unchanged.
9. The four cards do not vibrate against each other at 1440 or 412.
10. ADR recording the reversal of the single-accent rule.
11. Royal against the accent button screenshotted, with a verdict on whether it reads as a pair or a near-miss.
12. Full suite green. Expect harness failures asserting the old inverse treatment on these cards; rewrite them to assert the new one, and show a negative control proving the rewritten criterion can still fail.
13. Screenshots at 1440 and 412.

Scale verification per the rule in `CLAUDE.md`. This is a colour and token change, so the route harnesses that touch the capabilities section, contrast, typecheck, lint and dashes are the relevant set. Run the full suite before pushing to production. State which you ran and why.

## Judge by looking

Whether two alternating colours read as deliberate or as a checkerboard. Screenshot the capabilities section in the context of the sections above and below it, not in isolation.

Report before I look.
