# Thread Visibility, Hero Weight, Client Logo Loop

Amends `HERO-PARTICLES-AND-THREAD.md`. Read that first, and `CLAUDE.md`.

Steps 4 and 5 are committed. Step 6 (inverse block crossing) has not started. This brief inserts two items before step 6 and one after.

---

## Order, and why it is not the order the operator listed

These three requests are not independent.

The reveal currently advances by arc length along the path. Document Y and arc length diverge wherever the path is not vertical. The branches at the capabilities section add substantial arc length across very little vertical distance, so the reveal head slows in Y while the scroll does not, and the head drifts above the viewport. That is item 1.

Item 3 adds a circular loop around the client logos, which is a large amount of arc length across almost no vertical distance. It would make item 1 significantly worse.

So: fix the reveal first, then hero weight, then the loop.

---

## Item A: reveal by document Y, not arc length

### A.1 The change

A particle is revealed when its **document Y** is at or above the reveal line, rather than when its normalised arc-length position is at or below scroll progress.

The reveal line sits at a fixed offset in the viewport, roughly 60 to 70 percent of viewport height from the top. It moves with the scroll in document space, so in viewport space it is stationary. The head band is therefore always on screen, by construction rather than by tuning.

Add `aDocY` as a per-particle attribute, or derive it from the existing position attribute if that is already in document space, which it is. Reveal test becomes a comparison against a single scalar uniform.

Keep `aAlong`. It is still needed for per-path ordering and for anything that depends on progress along a strand.

### A.2 What this fixes for free

- **The head is always visible.** No scroll position exists where the head is off screen.
- **Branches reveal together.** All four strands occupy the same Y range, so they reveal simultaneously. This answers the open question about whether the branch produces one head or four. It produces four, arriving together, and that is now the intended behaviour rather than an accident. Watch that four simultaneous accent clusters do not read as too much. If they do, reduce per-strand head alpha so the combined weight matches the trunk's, rather than reducing the head length.
- **Any horizontal path section works.** Loops, curves, and detours no longer cost the head its position.

### A.3 Constraints

- Progress must still come from the same ScrollTrigger `onUpdate` that sets the SVG carrier's `stroke-dashoffset`. Do not introduce a second scroll source. The reveal line's document Y is derived from that value, not from a separate scroll read.
- Nothing on the render side eases toward the reveal line. That property was correct in step 5 and must stay correct.
- Undrawn particles must still leave the clip volume rather than drawing at zero alpha. Do not regress that.
- The Reduced tier 2D overlay uses the same rule, tested on the CPU.
- Verify on scroll reversal. The head must track back up without drift, as it did in step 5.

### A.4 One case to check

Where the path is exactly horizontal, every particle in that run shares a Y and reveals in a single frame. On the branch strands this is the desired effect. On a long horizontal run it would read as a flash.

Check the process section (S6), where the Thread runs left to right through four nodes. If it flashes, the fix is a small per-particle Y jitter, 2 to 4px, applied only to the reveal test and not to the rendered position, so the run reveals as a fast sweep rather than a snap. Report whether this was needed.

---

## Item B: hero particle size

### B.1 Check first, then act

The operator reports hero points reading as thin dots and wants roughly 50 percent more.

`uPixelRatio` was stale at 1 until `070edf5`, which halved hero point size on any 2x display. Before changing anything, confirm which build the size complaint was made against. State plainly whether `070edf5` was in it.

- **If the complaint predates `070edf5`:** the fix already roughly doubles the size on a 2x display. Say so and ask the operator to look again before you apply anything further. Do not stack 50 percent on top of a doubling unasked.
- **If the complaint postdates `070edf5`:** apply the increase as below.

### B.2 The increase

- Base point size up 50 percent from current.
- Alpha floor unchanged unless the larger points now read too light, in which case raise it slightly and report.
- Per-point size variance preserved proportionally.
- Accent points keep their 15 percent size premium as a ratio, so they scale with the base.
- Cursor displacement, curl noise, point count, and blending all unchanged.

### B.3 The consequence the operator has not been told

The hero is going up and the thread is coming down. Criterion 10 measured the stream at roughly twice the old hairline's weight, so the thread needs to lose weight while the hero gains it.

That breaks the assumption from earlier in this build that a single shared tuning pass moves both. It does not. The two scenes now need independent base values.

What must still be shared is the **step 8 handoff**. Hero particles migrate onto the thread, and if hero points are 50 percent larger while thread points are roughly 50 percent smaller, a migrating particle changes size by a factor of three during the migration. Unhandled, it will pop.

So: the migration must interpolate size and alpha along with position, using the same mix factor. Write this into the step 8 notes now, while the reason is fresh, so it is not discovered as a visual bug later.

---

## Item C: client logo loop

Build this after item A and after step 6. It touches geometry that the crossing logic will already have been written against.

### C.1 What is wanted

The thread arrives at the client logo section, splits into two, each half circling the full logo set in opposite directions, then rejoins below and continues on the existing route.

### C.2 Implementation

**Geometry is SVG, as always.** The loop is added to the SVG paths, not constructed in JavaScript or in a shader. Section 2.2 of the parent brief holds: one definition of the route.

Structure it as **two separate paths**, a left arc and a right arc, rather than one closed circle. With a Y-based reveal this produces exactly the described effect: both arcs sweep downward from the top simultaneously and meet at the bottom. A single closed path would not.

- The split point sits above the logo set, the rejoin below it.
- Both arcs are symmetric about the section's centre line.
- The enclosed shape should be an ellipse fitted to the logo set's bounding box with generous padding, not a true circle. The logo marquee is far wider than it is tall, and a circle would either crop it or balloon the section.

**Padding and legibility.** The arcs must clear the logo bounding box by enough that they never sit close enough to compete with a mark. The client logos are the only real assets on the site and their legibility is a standing criterion. If the section is too short to fit a loop with adequate padding, say so rather than tightening the padding.

**Marquee interaction.** The logo marquee moves horizontally in two rows, opposite directions. The arcs are static geometry that the logos pass behind. Confirm the arcs sit behind the logos in stacking order, not in front.

**Density.** Split the trunk density in half across the two arcs, as with the capabilities branch, so total visual weight is conserved rather than doubled at the loop.

**Edge masks.** The marquee fades to `--bg` at the viewport edges. Check the arcs do not extend into the masked region and appear to be cut off mid-stroke.

**Colour.** The client logo section is on the light canvas, not an inverse block, so the standard resting colour applies. If step 6's crossing implementation uses Y-range uniforms, confirm this section is not accidentally inside one.

### C.3 The thing to check by looking

Two arcs enclosing a horizontal band of logos is either elegant or it reads as a decorative frame around a logo grid, which is a common and dated pattern. Screenshot it at 1024, 1440, and 1920 before considering it done. If it reads as a frame rather than as the thread doing something, say so.

---

## Acceptance criteria

1. Reveal is driven by document Y. The head band sits at a fixed viewport offset and is visible at every scroll position from the hero exit to the contact section. Verify by scanning for the head at ten evenly spaced scroll positions.
2. Progress still comes from the same ScrollTrigger `onUpdate` as the SVG carrier. One scroll source. Verify by grep.
3. No easing on the render side toward the reveal line.
4. Undrawn particles still leave the clip volume.
5. Scroll reversal tracks without drift, as verified in step 5.
6. The four branch strands reveal together and their combined weight does not exceed the trunk's. Report the measured contrast.
7. The process section's horizontal run reveals as a sweep, not a flash. Report whether Y jitter was needed.
8. The build that the hero size complaint was made against is identified, and whether it included `070edf5` is stated explicitly.
9. Hero base size increased 50 percent, with variance and the accent premium preserved as ratios. Count, noise, displacement, and blending unchanged, verified by diff.
10. Step 8 notes updated to require size and alpha interpolation during the handoff, with the reason recorded.
11. The client logo loop is defined in the SVG paths, as two arcs, not one closed path and not constructed in JS.
12. Arcs clear the logo bounding box with padding sufficient that no mark's legibility is affected. Verified by screenshot at three widths.
13. Arcs render behind the logos in stacking order.
14. Loop density is split so total weight is conserved.
15. Arcs do not extend into the marquee's edge fade.
16. Both arcs reveal simultaneously and meet at the bottom.
17. Reduced tier reproduces the Y-based reveal and the loop.
18. Static tier's SVG stroke includes the loop and still renders correctly.
19. Frame rate and bundle unchanged within measurement noise. Report both.
20. ADR updated: why reveal moved from arc length to document Y, and that the two scenes now carry independent base sizes with a shared handoff interpolation.

## Order of work

1. Item A. Commit. This is a correctness fix and stands alone.
2. Item B, after the build question in B.1 is answered. Commit.
3. Step 6, the inverse block crossing, per the parent brief. Commit.
4. Item C. Commit.

Do not merge item A into anything. If the Y-based reveal has a problem, you want it isolated.
