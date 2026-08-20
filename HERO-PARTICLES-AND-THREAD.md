# Hero Particle Weight and Particle Thread

Standalone brief. Read `WYRD-WEBSITE-BUILD-PLAN.md` and `CLAUDE.md` first. This amends sections 5.3 and 7b of that brief.

## Baseline, read before starting

Phase 4b (light canvas conversion) is **complete**. The site is on a white canvas with dark blocks at the capabilities cluster cards, the contact call to action, the footer, and case study hero frames.

Everything below is written against the post-4b state. Do not apply values from the pre-4b dark version and do not add anything to `docs/BLOCKERS.md` about retuning.

Three consequences that govern this whole brief:

1. **Blending is normal, not additive.** Every particle added or modified here uses normal blending with per-point alpha. Additive on white produces nothing.
2. **Density was already halved and base size was already raised by roughly 30 percent** during 4b, because dark points read smaller and louder on white. All size and ratio adjustments in this brief are relative to the **current** post-4b values, not to the original dark values. Compounding the two is how the field ends up looking like confetti.
3. **The Thread now crosses dark blocks.** This is a new problem for a particle stream and is dealt with in section 2.6.

Re-measure the Full and Reduced tier bundle sizes against the current build before starting. The Phase 4 figures (222.7kb and 452.8kb) predate 4b and are not the baseline.

---

## Part 1: Hero particle weight

The hero field works. Do not restructure it. This is a tuning pass on two properties only: weight and colour distribution. Do not change the curl noise, the cursor displacement, the point count, or the tier logic.

### 1.1 Check first

Section 7b.2A of the main brief specifies that roughly one point in twelve carries the accent, driven by a per-point random attribute. Phase 4b preserved that ratio while inverting the palette.

Before changing anything, determine which is true:

- **It was never implemented.** Implement it as specified, then tune per 1.3.
- **It was implemented but does not read.** Report the current ratio and the current `--accent` alpha and size multiplier, then tune per 1.3.

Report which you found. If it was never implemented, that is a missed criterion from Phase 3 and it goes in the phase report.

Note that the token is `--accent` after the 4b rename. `--color-signal` no longer exists.

### 1.2 Weight

Make points read heavier without making the field look like confetti.

**Critical:** 4b already increased base point size by roughly 30 percent for the light canvas. Do not apply another 40 percent on top of that, the two compound to nearly double the original and the field will read as noise.

- Increase base point size by roughly **15 to 20 percent** from the **current post-4b** value. Tune by eye, not to a number.
- Raise the alpha floor. On white with normal blending, higher alpha means darker and heavier, which is the intent. The dimmest points should still be clearly present rather than at the edge of perception.
- Keep the per-point size variance. A uniform size reads as a texture rather than as a field. If anything, widen the variance slightly as base size grows.
- Point size must still attenuate with depth if the field has any Z spread, otherwise the far points will now dominate.

Cap: dark points on white are visually louder than light points on black at the same size and count. If the field starts reading as noise rather than as depth, you have gone too far. Back off. If weight cannot be achieved without noise, reduce point count and raise size further rather than pushing both up.

### 1.3 Accent distribution

Orange on white is significantly louder than orange on black. The same ratio that looked sparse on the dark canvas will look busy here. Move conservatively and check at each step.

- Raise the accent ratio from one in twelve to roughly **one in nine**. Tune by eye. Only go further if it still reads as too few at 1440px on a real display.
- Accent points render slightly larger than the base, roughly 15 percent, and at a higher alpha floor. They should be the points the eye catches first.
- Accent points use `--accent` `#FF521F`. These are graphics, not text, so the 3.24:1 ratio against white is acceptable here. Do not substitute `--accent-strong`, it will read as brown at this size.
- Distribution stays random per point, seeded so it is stable across reloads. Do not cluster accent points spatially, and do not put them all in one depth plane.
- Accent points must still respond to cursor displacement identically to the rest. They are not a separate system.
- Check that accent points do not reduce the contrast of the headline text where the field passes behind it. Criterion 11 of the main brief still applies.

### 1.4 Do not

- Do not add a second accent colour.
- Do not add bloom back. ADR 0017 cut it with a measured number and 4b confirmed it reads as a grey wash on white.
- Do not change the point count, unless section 1.2's cap forces a reduction, in which case report it.
- Do not switch back to additive blending to make points look stronger. It does nothing on white.
- Do not touch the Reduced tier's density logic, only its colour and size to match.

---

## Part 2: The Thread becomes a particle stream

### 2.1 What is changing

The Thread is currently an SVG stroke, drawn on scroll with `stroke-dashoffset`, following nine measured paths above 1024px and one straight line below.

It becomes a dense stream of particles following the same geometry. Same route, same scroll-scrubbed reveal, same branching at the capabilities section, same reconvergence at contact. Only the rendering changes.

The particles read as having come from the hero field. That is the point of the effect: the field the user played with at the top of the page becomes the line that leads them down it.

### 2.2 SVG stays as the geometry source

Do not redefine the path in JavaScript or in a shader. The SVG paths are the single source of truth for the Thread's route and they must remain so, or the geometry drifts from the layout.

Approach:

1. Keep the existing SVG paths in the DOM. Set them to `stroke: none` or `opacity: 0`, they become invisible geometry carriers, not rendered artwork.
2. On layout and on resize, sample each path with `getTotalLength()` and `getPointAtLength()` into a `Float32Array` of positions, normalised to document coordinates.
3. Sample density: enough points that the stream reads as continuous at 1440px width. Start around 8,000 to 12,000 across the whole route and tune. Distribute by arc length, not by segment, or the curves will be sparser than the straight runs.
4. Feed the sampled positions to the particle renderer as an attribute buffer.
5. Resample on resize, debounced. Do not resample on scroll.

This keeps one definition of the route. If the layout changes, the SVG changes, and the particles follow automatically.

### 2.3 Rendering, per tier

**Full tier.** WebGL points, same technique as the hero field.

Architectural note that matters: the hero scene is currently scoped to the hero section. The Thread spans the whole document. Section 7b.4 of the main brief already mandates one shared fixed-position canvas with per-section scenes. If the hero canvas is not already that shared canvas, promote it to one now, with the hero field and the thread stream as two scenes within it. Do not add a second `<Canvas>`.

**Reduced tier.** No Three.js, so this is a 2D canvas overlay, fixed position, `pointer-events: none`, drawing the sampled points directly. Reduce sample density to roughly a third. Same geometry source, same reveal logic.

**Static tier.** No particles. The SVG stroke renders as it does today, fully drawn, no animation. Restore its stroke for this tier only.

**Below 1024px.** Single straight line, as today. It may be a particle stream if it costs nothing extra, since the geometry is already sampled. If it costs frame budget on the Reduced tier, fall back to the SVG stroke. Measure, then decide, and record the decision.

### 2.4 Behaviour

**Reveal.** Scroll progress drives a threshold uniform. A particle is visible only where its normalised position along the path is at or below current progress. Same scrub as the current `stroke-dashoffset`, driven by the same ScrollTrigger, so the two never desynchronise.

**The head.** The current implementation has a 240px travelling accent segment at the draw head. In particle form this becomes a denser, brighter cluster: particles within the head region render at higher alpha, larger size, and in `--accent`. Behind the head, particles settle to a resting state.

**Resting colour, corrected for the light canvas.** The pre-4b line rested at the border token. Do not use `--border` `#E2DFDA` for the resting particles: that value was chosen for a solid 1px hairline, and discrete particles at that lightness on white will be effectively invisible. Rest the particles at `--fg-muted` `#5E5E66` instead, at 50 to 70 percent alpha, tuned so the stream reads with the same visual weight the old hairline had. Verify by placing a screenshot of the old line beside the new stream, they should carry equally.

**Blending.** Normal, with per-point alpha. Never additive.

**Idle motion.** Particles are not pinned rigidly to the path. Each gets a small per-particle offset perpendicular to the path, oscillating slowly on a noise function, amplitude 1 to 3px. The line should breathe, not vibrate. If it reads as jitter, cut the amplitude in half.

**The handoff from the hero.** As the user scrolls past the hero, a subset of hero field particles, roughly 400 to 800, are recruited: they lerp from their noise-field position to their assigned position on the thread over a short scroll distance, then join the stream. This is the detail that makes the effect land. Implement it as a per-particle mix factor driven by scroll progress through the hero exit, not as a separate spawn system.

**Branching.** At the capabilities section the stream splits into four, one per cluster. Each branch is its own sampled path. Particle density per branch should be roughly a quarter of the trunk so the visual weight is conserved rather than quadrupled.

### 2.5 Crossing the dark blocks, new problem

Phase 4b introduced `--bg-inverse` blocks at the capabilities cluster cards, the contact call to action, the footer, and case study hero frames. Section 7 of the 4b brief solved the crossing for an **SVG stroke**, most likely with `mix-blend-mode: difference` or a clipped second path. Read ADR from 4b and confirm which was chosen.

That solution does not automatically carry to a WebGL canvas. `mix-blend-mode` on a canvas element blends the entire canvas against the page, which would also affect the hero field and every other particle on screen. Do not assume it transfers.

This matters most at the capabilities section, which is both where the stream branches into four and where the darkest blocks sit. Getting it wrong there loses the single most important moment in the whole effect.

Required behaviour: particles resting at `--fg-muted` on white must switch to `--fg-inverse-muted` where they cross an inverse block, and the accent head must switch to `--accent-on-inverse`. The transition should be a hard switch at the block edge, not a fade, because the background edge is hard.

Preferred implementation: pass the inverse regions to the shader as a small uniform array of Y ranges in document space, derived from the same layout measurement pass that samples the paths. Each particle tests its own Y against those ranges in the vertex or fragment shader and picks its colour. This is a handful of comparisons per particle, costs nothing, and keeps one source of truth for where the dark blocks are.

If you choose a different approach, justify it in the ADR. Whatever you choose must also work for the Reduced tier's 2D canvas, which can test the same ranges on the CPU.

Do not solve this by making the thread a colour that is merely acceptable on both grounds. A mid grey visible on white and on black is visible on neither well, and it will undo 4b's contrast work.

### 2.6 Performance

- Both scenes share one canvas and one render loop.
- The thread scene runs continuously while the page is scrolled, which is new: WebGL was previously alive only in the hero. The thread scene has no cursor interaction and a cheap vertex shader, so it should be near free. Verify that claim with a measurement, do not assume it.
- Pause on `document.hidden`.
- Do not run the thread scene at all while the hero fills the viewport and no thread is yet revealed.
- Budget note: measure the current post-4b Full tier size first, since the 452.8kb figure predates 4b. This work adds shader and sampling code, which should be single-digit kilobytes. Report the delta against the post-4b baseline. If the total passes the 500kb ceiling, stop and raise it with the operator rather than silently widening the budget.

---

## Acceptance criteria

Report each as PASS or FAIL with specifics.

1. Report whether accent points existed in the hero field before this change, and if not, note the missed Phase 3 criterion.
2. Hero points read visibly heavier at 1440px without the field reading as noise, on the white canvas. Screenshot before and after, side by side. Confirm the size increase was applied to the post-4b value and not compounded with 4b's own increase.
3. Accent points are roughly one in nine, use `--accent`, visually catch the eye first, are randomly and stably distributed, and respond to cursor displacement identically to base points.
4. Hero point count, curl noise, cursor displacement, blending mode, and tier logic are unchanged. Verify by diff. Blending is still normal, not additive.
5. The Thread's geometry still comes from the SVG paths. No route is defined twice.
6. Sampling is by arc length, so curves are no sparser than straight runs.
7. The particle stream follows the exact route of the previous line at 1024, 1440, and 1920px. Overlay a screenshot of the old line and the new stream to confirm.
8. Reveal stays locked to the same ScrollTrigger as before, with no desynchronisation on fast scroll or on scroll reversal.
9. The head cluster reads as a head: denser, brighter, in the accent.
10. Resting particles use `--fg-muted`, not `--border`, and the stream carries the same visual weight as the old hairline. Confirm with a side by side screenshot.
11. Particles crossing an inverse block switch to `--fg-inverse-muted`, and the head to `--accent-on-inverse`. Verified visually at the capabilities section, the contact call to action, and the footer.
12. The crossing switch is a hard edge at the block boundary, with no fade and no particles rendering invisible on either ground.
13. The crossing solution does not use `mix-blend-mode` on the canvas element, or if it does, it is proven not to affect the hero field or any other on screen particle.
14. Idle motion breathes rather than jitters.
15. The hero handoff is visible: particles are seen leaving the field and joining the stream.
16. Branching produces four strands with conserved visual weight, not four full-density lines, and reads correctly against the dark capabilities cards.
17. Full tier uses one shared canvas with two scenes. Grep confirms exactly one `<Canvas>`.
18. Reduced tier renders the 2D canvas stream, handles inverse block crossings on the CPU, and still downloads zero Three.js bytes, verified by grepping chunk bodies rather than trusting chunk names.
19. Static tier restores the plain SVG stroke, no canvas mounted, still correct across inverse blocks.
20. Below 1024px, whichever fallback was chosen is documented with the measurement behind the decision.
21. Frame rate holds 60fps while scrolling the full page on a mid-range laptop, and never drops below 30fps on any Full tier device.
22. Post-4b bundle baseline reported, plus the delta from this work. If the total exceeds 500kb, escalated rather than absorbed.
23. No memory growth across ten full page scrolls.
24. All WCAG AA text contrast from 4b still passes. The heavier field and higher accent ratio must not degrade headline legibility.
25. ADR written covering the SVG-as-geometry-source decision, the shared canvas promotion, the per-tier rendering split, and the inverse block crossing approach.

## Order of work

1. Branch. `git checkout -b particle-thread`.
2. Part 1 only. Commit. This is small and independently valuable.
3. Promote to a shared canvas if not already. Commit. Site should look identical after this step.
4. Path sampling, with the sampled points rendered as static dots and no reveal logic. Commit. This proves the geometry before any motion is added.
5. Reveal threshold and head cluster. Commit.
6. Inverse block crossing, per 2.5. Commit. Do this before idle motion, it is the highest risk item in this brief and you want to know early if the approach fails.
7. Idle motion. Commit.
8. Hero handoff. Commit.
9. Reduced and Static tier paths, including their own crossing handling. Commit.
10. Measure, then report.

Step 4 is the one that catches geometry bugs. Do not merge it into step 5. Step 6 is the one most likely to need a rethink. Do not merge it into anything.
