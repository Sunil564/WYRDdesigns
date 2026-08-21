# Item C, revised: dispersion instead of arcs

Replaces item C in `THREAD-VISIBILITY-AND-LOOP.md` entirely. Read that file and `CLAUDE.md` first.

## Why the arcs are being dropped

The screenshots settle it. At 1440 and 1920 the bow reads as two brackets flanking a logo row, with 700px of open space and four unenclosed logos between them. Your own analysis had the cause right: the logo row is 751 x 40 at every width because its size is intrinsic to six marks, while the strand columns move outward with the viewport, so each lobe ends up taller than it is wide. That is aspect ratio, not tuning, and no amount of arc adjustment fixes it.

Revert the bow. The strands return to straight runs through the clients section. Keep the density tripwire fix and the marks-box measurement correction if they stand independently of the arcs.

## What replaces it

Not a path shape. A **dispersion**: particles travelling the strands spread outward as they pass through the clients section, forming a loose cloud around the logo set, then re-gather onto the strand and continue down the page.

This is better than the arcs for three reasons worth stating, because they should inform how you build it:

1. **No geometry changes.** The SVG paths stay as straight runs. Nothing is added to the route, so path length, density, and the tripwire are all untouched.
2. **No aspect ratio problem.** A cloud has no shape it must fit. It adapts to whatever the logo box is at any width.
3. **It is the thread doing something,** rather than an ornament placed near the logos. The particles behave differently in this section, which is the effect you were after.

Applies to both strand columns.

## How it works

The mechanism is the one step 6 already built: a Y range as a uniform, tested per particle against its own document Y.

**Band.** The clients section's logo row, expanded vertically. The band should start above the marks and end below them, with enough run that the bloom and the re-gather both have room to happen gradually. Derive it from the marks bounding box, not the section box, since the section is much taller than the row. Use the marks box, which you already corrected during the arc attempt.

**Ramp.** A scalar per particle, from its own document Y position within the band: 0 at the band edges, 1 at the centre, eased so it grows and decays smoothly rather than linearly. This is what makes the spread happen as the user scrolls, and it happens automatically because the ramp is a function of Y.

**Displacement.** Offset the particle's rendered position by a per-particle direction scaled by the ramp.

- Direction comes from `aRandom`, so the cloud is organic rather than a geometric shape. Do not use a fixed radial direction from a centre point, that produces a circle and you are back where you started.
- Bias the spread horizontally, roughly 2:1 over vertical. The logo row is wide and short, so a spread that is equally tall reads as a blob rather than as a cloud around a row.
- Magnitude: start with a maximum spread that reaches roughly the height of the logo row above and below it, and roughly a third of the row's width to either side of each strand. Tune by eye, this will need looking at.

**Critical: displace the rendered position only, never the reveal test.** The reveal compares document Y against the reveal line. If displaced Y feeds that comparison, particles will reveal out of order and the head will smear. Keep the original Y for the reveal, use the displaced position for `gl_Position` only.

**Density.** The particles spread apart, so the strand thins where the cloud is widest. That is correct and expected: the thread is dispersing. Do not compensate by adding particles.

**Occlusion.** Per the standing ruling, the thread passes behind content. The cloud passes behind the logo marks. Confirm the marks stay fully legible with the cloud behind them, and that no particle sits close enough to a mark to read as dirt on it.

**Colour.** The clients section is on the light canvas and is outside every inverse band. Standard resting colour. Confirm the band does not overlap an inverse band range.

**The head.** When the reveal head passes through the band, its particles disperse too. That should look correct, the head blooms and re-forms. Watch that it does not lose legibility as a head. If it does, damp the ramp for particles inside the head window so the head holds together while the settled stream behind it spreads.

## Tiers

- **Full:** as above, in the vertex shader.
- **Reduced:** the 2D overlay does not exist yet (BLOCKERS item 10). When it is built, it gets the same dispersion, tested on the CPU. Note the requirement there now.
- **Static:** SVG stroke only, straight runs, no dispersion. Nothing to do.
- **Below 1024px:** single straight line. Apply the dispersion if the line passes through the clients section, at reduced magnitude since there is less horizontal room. Report what you chose.

## Acceptance criteria

1. The bow arcs are reverted. The strands are straight runs through the clients section and the SVG paths carry no added arc geometry.
2. Path length, sample count, and density are unchanged from before the arc attempt. Report the counts at 1024, 1440, 1920.
3. Particles spread outward through the clients band and re-gather below it, driven by a Y-derived ramp.
4. Spread direction is per-particle and organic, not radial from a centre point.
5. Spread is biased horizontally, roughly 2:1.
6. The reveal test uses original document Y, not displaced Y. Verify the head does not smear and particles reveal in order.
7. All six logo marks remain fully legible with the cloud behind them.
8. No particle reads as dirt on a mark. Judge this by screenshot, not by distance measurement.
9. The clients band does not overlap any inverse band.
10. The head remains legible as a head while passing through the band. Report whether damping was needed.
11. Screenshots at 1024, 1440, and 1920, plus one mid-scroll where the head is inside the band.
12. Frame time unchanged within noise. Report it.
13. ADR updated: the arcs were tried and reverted, why the section's dimensions do not support an enclosing shape, and that dispersion replaced it.

## The thing to judge by looking

Whether the cloud reads as the thread dispersing, or as a smudge behind the logos. The failure mode here is not geometric, it is that a low-contrast particle spread on white can simply look like noise. If it reads as noise rather than as motion, say so, and say whether more spread or less would fix it.

Screenshot before considering it done.
