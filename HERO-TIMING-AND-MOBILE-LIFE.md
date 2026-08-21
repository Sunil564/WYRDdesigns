# Hero timing, mobile density, mobile thread motion

Three fixes plus two checks. Read `CLAUDE.md` and the relevant ADRs first.

---

## 1. Hero entrance reads as a stall

On both mobile and desktop, the headline types in, then there is a perceptible dead beat, then the subhead and buttons arrive. It reads as the page hanging rather than as a sequence.

**Diagnose before changing.** Two different things could produce this and they need different fixes:

- **Designed delay.** Build plan 6.1 S1 specifies the subhead and CTA arrive 300ms after typing completes. If that is all it is, the fix is timing.
- **A real stall.** Font loading, the GSAP SplitText run, hydration, or the WebGL scene mounting could be blocking the main thread between the two. If so, the gap is longer than 300ms and varies between loads.

Measure the actual elapsed time between the headline's last character and the subhead's first frame, over several loads, at 1x and 4x CPU throttle. Report the range. Then fix whichever it is.

**If it is the designed delay:** overlap rather than sequence. Start the subhead and buttons at roughly 65 to 75 percent of the headline's type animation, so they are already arriving as the last characters land. The eye should never be given an empty beat to notice. Keep the stagger between subhead and buttons.

**If it is a stall:** report what is blocking and propose the fix before making it.

Both must still respect reduced motion: everything renders in final state, no sequence at all.

## 2. Mobile hero field is too sparse and appears static

Two complaints: very few particles, and the ones present do not appear to move.

### Density

The hero 2D fallback was built in Phase 3, before any benchmarking, when the cost of Canvas 2D on a phone was unknown. The thread overlay benchmark from ADR 0024 has since measured it: 2,000 particles at 2.77ms per frame under 6x throttle, and the full feature set costs only 18 percent more than a lean one.

So the hero fallback's density was set by caution that measurement has since retired. Raise it substantially, using the same benchmark method rather than a guess: find the count that holds 60fps at 4x throttle with headroom at 6x, then set it below that.

Viewport culling does not help the hero field the way it helps the thread, since the whole field is on screen. Budget accordingly.

### Motion

Confirm the field is actually animating and not drawing a static frame. Check the RAF loop is running, that `IntersectionObserver` is not pausing it while the hero is in view, and that drift amplitude and speed are large enough to perceive at phone scale.

If drift is running but imperceptible, raise the amplitude. A field that moves too slowly to notice is worse than a static one, because it costs frame budget for nothing.

Report which it was.

## 3. Mobile thread has no life

Below 1024px the route is a single straight vertical line. It reads as a rule rather than as a thread.

**Give the line a weave.** Not random: anchored to the page's own structure, so the motion means something.

- The path drifts laterally across the viewport as it descends, reaching its extremes near section boundaries and content blocks, and returning toward centre between them.
- Amplitude should be a fraction of viewport width, enough to be clearly a weave rather than a wobble, but never so far that it crosses under text more than the straight line already does. The text dimming handles overlap, so this is about legibility of the weave, not safety.
- The weave is **geometry**, defined in the SVG path below 1024px, not a displacement added in the renderer. One definition of the route, as with everything else.
- Derive the anchor points from the measured section positions, not from hardcoded Y values, so it survives a content change.

The spiral, the reveal, the dispersion, and the text dimming all continue to apply on top of the woven path.

**Also raise the mobile spiral radius.** At phone scale the current radius produces a column about 20px wide, which is most of why it reads as a line. A wider spiral on a weaving path is what gives it life.

Judge by looking, at three scroll positions, and say whether it reads as a thread finding its way down the page or as a line that wiggles.

---

## 4. Accent checks

Two, both cheap.

1. **Grep the shaders for hardcoded accent values.** The thread head cluster and the hero accent particles must read from the token, not from a hex baked in during a tuning pass. The peak measurement proves the head is bright, not that it is the current colour. Confirm which colour it actually renders.

2. **Confirm `--accent-on-inverse` still equals `--accent`** after the change. If the new accent does not read on the dark ground, the contact band colour switch stops being a no-op and needs a real second value. Report the contrast ratio of the accent against `--bg-inverse`.

---

## Acceptance criteria

1. Measured gap between headline completion and subhead first frame, reported as a range across several loads at 1x and 4x. Cause identified as designed delay or stall.
2. The entrance reads as continuous, with no empty beat. Judge by looking.
3. Reduced motion still renders the hero in final state with no sequence.
4. Mobile hero count raised, with the benchmark that justifies it. 60fps at 4x with headroom at 6x.
5. Mobile hero field confirmed animating, with drift perceptible at phone scale. Report whether it was stopped or merely imperceptible.
6. Mobile thread weaves, defined in the SVG path, anchored to measured section positions rather than hardcoded values.
7. Mobile spiral radius raised. The thread no longer reads as a 20px column.
8. All existing effects still apply on the woven path: spiral, reveal, dispersion, text dimming.
9. Shader accent values read from tokens. Grep output shown.
10. `--accent-on-inverse` status confirmed, with the contrast ratio against `--bg-inverse`.
11. Full suite green, Lighthouse re-run on the deployment. Mobile must stay at or above 90, desktop at or above 85. Report both, and the TBT delta from the density increase.
12. Screenshots: hero entrance at three points on both mobile and desktop, mobile thread at three scroll positions.

## Order

1. Diagnose item 1, report, then fix.
2. Item 2, benchmark first.
3. Item 3.
4. Item 4 checks, fold into the final report.

Commit after each. The density increase and the weave both carry frame-rate risk, so keep them separable.
