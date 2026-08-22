# Neon capability cards and card audio

Two changes. Read `docs/design-system.md`, ADR 0019 (light canvas conversion), and `CLAUDE.md` first.

Item 1 is a system change, not a colour swap. Item 2 is new. Do them as separate commits.

---

## Item 1: neon capability cards

### 1.1 What is actually changing

The four capability cluster cards currently render as `--bg-inverse` blocks: near-black ground with the inverse contrast pair, `--fg-inverse` text, `--accent-on-inverse` for the index digit on hover.

They become neon. That is not a background value swap, because the contrast direction reverses. Measured:

| Ground | Dark text | White text | Usable |
|---|---|---|---|
| neon cyan `#00E5FF` | 12.86:1 | 1.54:1 | dark |
| neon lime `#CCFF00` | 16.83:1 | 1.18:1 | dark |
| neon magenta `#FF10F0` | 6.20:1 | 3.19:1 | dark |
| neon mint `#00FF9C` | 14.87:1 | 1.33:1 | dark |

Every neon bright enough to read as neon needs **dark** text. So these cards stop being inverse-context blocks and become light-context blocks on a coloured ground.

The `variant` prop added in 4b already carries this idea. Add a third value: `light | inverse | neon`. A neon card reads `--fg`, `--fg-muted`, and `--border` from the light set, over its own ground colour. Do not invent a parallel `--fg-neon` set unless a measurement forces it.

### 1.2 The accent problem

`--accent` `#4C86DB` measured against each neon: 2.38, 3.11, 1.15, 2.75. It is invisible on all of them.

So anything inside a neon card currently using the accent must change. The known case is the index digit turning accent on hover. Replace it with `--fg` at full weight against the card's muted state, or drop the colour change and keep the hairline sweep as the hover signal. Pick one, say which and why.

**Audit every accent usage inside these cards**, not just the index. Links, focus rings, and any hover state.

### 1.3 Scope: the four cards only

Do not apply neon to the contact call to action, the footer, or the case study hero frames.

Reasons, in order:
- The page needs a dark ending. The contact section and footer read as one dark base and that is what gives the scroll a terminus.
- The contact CTA band carries the thread's inverse colour switch built in step 6, with band Y ranges as uniforms. Changing that ground reopens work that is finished and correct.
- Case study hero frames exist to frame photography. A neon frame around a photograph fights it.
- Four neon cards is a deliberate accent. Six neon regions is a different site.

The thread passes **behind** these cards per the standing occlusion ruling, so no particle colour logic is affected. Confirm that holds rather than assuming it.

### 1.4 Palette

Starting set, one per cluster, all clearing 6:1 against dark text:

| Card | Neon | Contrast with `--fg` |
|---|---|---|
| 01 BUILD | `#00E5FF` cyan | 12.86:1 |
| 02 REACH | `#CCFF00` lime | 16.83:1 |
| 03 SHOW | `#FF10F0` magenta | 6.20:1 |
| 04 STAGE | `#00FF9C` mint | 14.87:1 |

Tune by eye. Any substitution must be measured against `--fg` and clear 4.5:1 before it ships.

These are new tokens, `--neon-01` through `--neon-04`, and their addition reverses the design system's single-accent rule. Write an ADR recording that reversal and why, so the rule is understood as deliberately retired rather than forgotten.

### 1.5 Watch for

- **Focus rings.** Tuned for a dark ground. Re-verify on every neon.
- **The grain overlay.** It inverts inside `--bg-inverse` blocks. On a bright neon ground it will read differently again. Check it does not read as dirt.
- **Hairlines.** `--border-inverse` on black is invisible on neon. These cards need the light-set border or none.
- **Adjacency.** Four saturated neons in a 2x2 grid with tight gutters can vibrate against each other. If they do, widen the gutters or desaturate one, do not reduce all four.

---

## Item 2: card audio

Four to five tones, played on click.

### 2.1 Use a scale, not four arbitrary tones

This is the decision that determines whether it sounds designed or accidental. Four unrelated pitches sound wrong in some click orders and fine in others, and a visitor will click them in every order.

**Use a pentatonic scale.** Any combination of its notes is consonant, so every click order sounds intentional. A major pentatonic starting around C4:

| Card | Note | Hz |
|---|---|---|
| 01 | C4 | 261.63 |
| 02 | D4 | 293.66 |
| 03 | E4 | 329.63 |
| 04 | G4 | 392.00 |

If a fifth is needed elsewhere, A4 at 440.00 completes the scale.

### 2.2 No audio library

Web Audio API directly. An `OscillatorNode` into a `GainNode` with a short envelope is roughly forty lines and adds zero bundle weight. Tone.js is around 200kb and the Full tier sits at roughly 465kb of a 500kb ceiling. This is not a case where a library earns its size.

- Waveform: sine, or triangle if sine reads too pure. Not square or sawtooth.
- Envelope: fast attack, short decay, total under 250ms. A tone that outlasts the click reads as a notification, not as feedback.
- Add a small amount of reverb or a second oscillator a fifth above at low gain if it sounds thin. Judge by listening.

### 2.3 Rules

- **One `AudioContext`**, created lazily on first interaction. Browsers block it before then, and creating one per click leaks.
- **On deliberate click only.** Never hover, never scroll, never page load.
- **Quiet.** Start around 0.08 gain and tune down rather than up. Someone is browsing this in an office.
- **A visible mute control** near the cards or in the header, with the choice persisted. Sound the visitor cannot turn off is worse than no sound.
- **Default on**, quiet. Off by default means nobody ever hears it and the feature is dead weight.
- **Never the only feedback.** The card already has visual hover and click states. Audio is additive, and a visitor with sound off or hearing loss must lose nothing.
- **Respect `prefers-reduced-motion` as a proxy.** There is no reduced-sound media query, but someone who has asked for less motion has signalled a preference for a calmer page. Default to muted when it is set, and let the toggle still work.

---

## Acceptance criteria

1. Cards render on neon grounds with dark text. Every text and ground pair measured, all clearing AA, reported individually.
2. No accent-coloured element remains inside a neon card. Grep, do not assume.
3. Neon applied to the four capability cards only. Contact CTA, footer, and case study frames unchanged.
4. The thread still passes behind the cards and no particle colour logic changed. Verified, not assumed.
5. `variant` extended to `neon`. No parallel token set invented unless a measurement forced it, and if one was, the measurement is shown.
6. Focus rings visible on all four neons.
7. Grain does not read as dirt on a neon ground.
8. The four cards do not vibrate against each other at 1440 or 412.
9. ADR recording the reversal of the single-accent rule.
10. Audio uses a pentatonic scale, one note per card.
11. Web Audio API only. Bundle delta reported. No new dependency.
12. One lazily created `AudioContext`. Verified no leak across fifty clicks.
13. Tone under 250ms, gain at or below 0.08.
14. Mute control visible, functional, persisted, and defaulting to muted under `prefers-reduced-motion`.
15. Audio fires on click only. Verified it does not fire on hover, scroll, or load.
16. Keyboard activation of a card plays the tone, so the feedback is not mouse-only.
17. Lighthouse: mobile 90 or above, desktop 85 or above. Report both.
18. Full suite green. Expect harness failures asserting the old inverse treatment on these cards; rewrite them to assert the new one.
19. Screenshots at 1440 and 412.

## Judge by listening and looking

Two things no measurement settles:

- Whether four saturated neons read as deliberate or as a toy. Screenshot the capabilities section in the context of the sections above and below it, not in isolation.
- Whether clicking all four in sequence sounds like a phrase or like a fault. Say which.

Report both before I look.
