# Text dimming, density reduction, watchdog fix

Amends `THREAD-SPIRAL-TRAIL.md` and `THREAD-HANDOFF-AND-TUNING.md`. Read those, `HERO-PARTICLES-AND-THREAD.md`, and `CLAUDE.md`.

Four items. Order matters, items 2 and 3 interact with the handoff and with each other.

---

## 1. Dim particles over text

Particles crossing body copy read as distracting, worst on mobile where the thread column and the text column overlap heavily. The process section is the clearest case: the occlusion inventory recorded it as having no occluder, so the thread draws straight over the copy.

**Dim, do not occlude.** Occluding would cut the thread into disconnected segments, which loses the continuity the whole effect depends on.

### Mechanism

Same machinery as the inverse band, extended from Y ranges to boxes.

- At layout, collect the bounding boxes of text elements that intersect the thread's horizontal extent. Headings, body copy, labels. Not decorative elements, not whitespace.
- Pass them as a uniform array of rects in document space. Cap the count, and if more boxes qualify than the cap allows, prefer the largest by area and report that the cap was hit.
- Each particle tests its own position against the rects. Inside one, alpha multiplies by a dim factor.
- Use the **displaced** position for this test, not the undisplaced Y. This differs from the reveal and the inverse band, and deliberately: the question is where the particle is actually drawn relative to the text, not where its path sits.

### Values

- Dim factor: start at 0.25 to 0.35 of normal alpha. Particles should still be present, just clearly receded.
- Add a small padding around each box, roughly 4 to 8px, so particles do not sit hard against a glyph edge at full brightness.
- **Soften the edge.** Unlike the inverse band, this transition should ramp over the padding rather than switching hard. A hard alpha step at a text box boundary will read as a rectangle cut out of the trail.
- The head is exempt or only lightly dimmed. It is the moving focal point and dimming it makes the thread appear to stall wherever it crosses copy. Report what you chose.

### Mobile

Below 1024px the thread is a single line and the text column is nearly full width, so most of the route will be inside a text box. Check the dimmed thread is still visible enough to read as a thread at all at 375px. If it disappears, raise the dim factor for that breakpoint rather than removing the feature.

## 2. Hero field, halve it

Current constant 10,560. Reduce by 50 percent, to 5,280.

Note what this means: it matches what the frame-rate watchdog currently produces when it fires. See item 4.

**This breaks the handoff tuning.** `ORIGIN_SHARE 0.55` was set so the stream's scattered origins match the hero field's density. With the field halved, the origins are now denser than the thing they are meant to blend into. Retune `ORIGIN_SHARE` so the origins remain indistinguishable from the field, and re-run the test that was used to confirm it: the origins must not be pickable out of the field as a distinct layer.

Report the new value and confirm by looking.

## 3. Thread stream, halve it and dim the trail

Two changes.

**Count.** Halve it, roughly 11,032 to 5,500 at 1440. This falls below the density tripwire's 8,000 to 12,000 band. Change the band deliberately to match the new target and state the new values. Do not let the tripwire fire and do not work around it.

**Trail alpha.** The settled trail behind the head should be dimmer than it is now, enough to stop it competing for attention across the page, while staying clearly visible.

- Reduce settled alpha. Start around 60 to 70 percent of current and tune.
- **The head is unchanged.** Same size, same alpha, same accent. The contrast between a bright head and a receded trail is the point.
- Watch the interaction with item 1. A trail at 65 percent alpha, dimmed a further 30 percent over text, may vanish. Check the compound case explicitly at 1440 and at 375px, and if it disappears, raise the text dim factor rather than the trail alpha.

**Order.** Do item 3's count change before item 1's tuning, so item 1 is tuned against the final density rather than against a trail twice as dense as it will ship.

## 4. Watchdog

Your analysis is right and the current behaviour is a false positive machine: a 2 second window containing 672ms of load blocking averages 39.6fps on any GPU, which is under the 40 threshold, so it fires based on boot contention rather than rendering capability. It fires on some loads and not others on the same machine and the same build.

Apply the smallest fix: **delay the measurement window until after the load settles.** Do not add the two-window or the step-back-up variants, they are more machinery for the same outcome.

Two things to check while in there:

- With the hero base now 5,280 and `MIN_COUNT` at 5,000, a downshift would take it to 5,000, a 5 percent reduction. Confirm the watchdog still does anything meaningful at the new count, and if it does not, say so rather than leaving a subsystem that cannot act. That is the dead-code pattern from earlier in this build.
- Confirm the downshift event does not fire during the handoff convergence, which would change field density mid-effect.

---

## Acceptance criteria

1. Text boxes intersecting the thread are collected at layout and passed as rects. Cap stated, and whether it was hit.
2. Particles inside a text box dim to the stated factor, with a ramped edge over the padding, not a hard step.
3. The dim test uses displaced position, not undisplaced Y.
4. Head dimming behaviour stated. The thread does not appear to stall where it crosses copy.
5. At 375px the thread is still visible as a thread. Screenshot.
6. Hero count 5,280. Diff confirms nothing else in the hero changed.
7. `ORIGIN_SHARE` retuned. Origins are not pickable out of the field as a distinct layer. Confirmed by looking, at two scroll positions through the convergence.
8. Thread count roughly halved. New density band values stated, tripwire not fired.
9. Settled trail alpha reduced, head unchanged.
10. Compound case checked: dimmed trail over text at 1440 and 375px. Still visible.
11. Watchdog window delayed until after load settles. Report what "settled" is defined as.
12. Whether the watchdog can still act meaningfully at 5,280 with `MIN_COUNT` 5,000. If not, say so.
13. Watchdog cannot fire during handoff convergence.
14. Frame time reported. Both counts halving should improve it.
15. Screenshots at 1440 and 375: process section, hero exit convergence, clients section, contact band.

## Judge by looking

- Whether the dimmed trail over text reads as receded or as broken up.
- Whether the halved thread still reads as a thread, or as scattered dots that happen to follow a line.
- Whether the halved hero field still has presence, or now reads as sparse.

Report all three in those terms.
