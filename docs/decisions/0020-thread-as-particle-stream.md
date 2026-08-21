# 0020. The Thread as a particle stream

Status: accepted, in progress
Date: 2026-08-21
Phase: particle brief, `HERO-PARTICLES-AND-THREAD.md`

Amends ADR 0018, the Thread. Extends ADR 0015, render tiering, and ADR 0017, the hero shader.

This record is written as the work lands rather than after it. Sections for the inverse block crossing, the per tier split below the Full tier, and the below 1024 fallback are added by the steps that decide them, and the status stays `in progress` until they are all present.

## Context

The Thread was an SVG stroke drawn on scroll with `stroke-dashoffset`. The brief makes it a dense stream of particles on the same route, so that the field the visitor played with in the hero becomes the line that leads them down the page. Only the rendering changes: same geometry, same scroll scrubbed reveal, same branching, same reconvergence.

Brief 7b.3 says the Thread stays SVG. This supersedes that, on the operator's written instruction, and it is the fourth WebGL use 7b.2 asks for an ADR about. This is that ADR.

## 1. The SVG paths stay the geometry source

The route is defined once, in the path data the layout measurement produces, and the particles are a reading of it.

The paths stay in the DOM and render at `opacity: 0` on the particle tiers. `samplePaths` reads them back with `getTotalLength` and `getPointAtLength`. Rejected alternatives: redefining the curve in JavaScript, which is two definitions of one route and drifts the moment the layout changes, and generating it in a shader, which is the same problem with less visibility.

`opacity: 0` rather than `display: none` or `visibility: hidden`, because `getPointAtLength` needs a rendered element.

Sampling is by arc length, not by segment or by curve parameter. A cubic and a straight run of the same length get the same number of particles, which is what stops the curves at the branch point from looking starved. Normals come from the sampled neighbours rather than from two more `getPointAtLength` calls per point, which is the difference between one DOM call per particle and three.

Resampling happens on layout and on resize, debounced, and never on scroll.

## 2. One canvas, promoted

Brief 7b.4 allows one `<Canvas>` per page, fixed position, with per section scenes. The hero owned the only WebGL until now and a canvas scoped to the hero met that trivially. The Thread spans the document, so the rule had to be met properly: `SiteScene` owns the canvas, and the hero field and the Thread stream are two scenes inside it.

The host sits at `z-2`, which is the slot the SVG Thread held: above the grain at `z-1`, above the dark ground an inverse `Section` paints in the positioned-auto layer, and below section content at `z-10`. That layering, which ADR 0019 established for the hairline, is what lets the stream cross a dark block without any blend mode.

Two consequences, recorded rather than hidden. The hero field now paints above the grain instead of below it, which is a 3 percent multiply and about one level of lightening. And the field has to do two things the browser used to do for it: place itself in document space so it scrolls with the hero, and clip itself to the hero's document band, which is what `overflow-hidden` on the section was doing.

## 3. Placement rides the object matrix, because uniforms went stale

This cost four builds and it is the most useful thing in this record.

The mapping from document pixels to world units was first written as three float uniforms and an expression in the vertex shader. The stream rendered nothing at all: the object was in the scene, visible, not frustum culled, with 16,000 points and a program that compiled without a warning, and no particle appeared anywhere in the viewport at any scroll position. Every uniform read back correctly in JavaScript on the same frame it was written.

The cause is that **a component's own uniforms object is not the object the renderer uploads.** Printed from the running page:

```
sameUniformsObject  false
sameOpacityHolder   false
sameColourHolder    false
sameColourValue     true
```

The material holds a copy: a new outer object, a new `{ value }` holder per uniform, and the `value` property copied by reference. So writing `myUniforms.uOpacity.value = x` writes to a holder nothing reads, and the uniform sits at its initial value forever, while mutating `myUniforms.uHalfSizePx.value[0]` reaches the GPU because the array is shared. That asymmetry is what made the failure so hard to read: the vec2 updated, the floats did not, and the visible symptom was misplacement rather than the actual fault.

The actual fault was `uOpacity`, stuck at its initial `0`, so every fragment fell through `alpha < 0.002` and discarded. Placement was a second instance of the same defect and a red herring for two builds.

Two decisions follow.

**Placement rides `matrixWorld`.** Positions are document pixels in the buffer; the scene sets the object's `scale` to `(w, -w, 1)` and its position to `(-halfWidth * w, (halfHeight + scroll) * w, 0)`, which is the same arithmetic expressed as a transform. Three uploads it along with every other object's matrices, so there is no cache of ours between the number and the vertex and this cannot recur. The negative y scale is the flip from document coordinates, where y grows downward. Points have no winding, so a mirrored scale costs nothing. Point size is in framebuffer pixels and is unaffected by object scale, which is what makes the trick safe.

**Every animated uniform is written through `material.current.uniforms`.** That object is by definition the one the renderer uploads. The hero field already did this for the uniforms it animates, which is why it worked, and it did not for `uPixelRatio` and `uSize`, which were set in an effect against the memoised object. `uSize` was right by luck, since its stale value is its intended one at the reference width. `uPixelRatio` was not: stale at 1, every point in the hero field was half its intended size on any 2x display. Both moved onto the live material in the same change.

## 4. Scroll comes from Lenis

`currentScroll()` returns `window.__lenis?.scroll`, falling back to the document. Lenis owns the scroll and per tick writes its own animated value to the document and then calls `ScrollTrigger.update()`, so reading Lenis is reading the number the Thread's ScrollTriggers were updated with. Reading `window.scrollY` from a render loop that runs on its own frame would let the stream and the SVG geometry disagree by a frame of easing, which is exactly what criterion 8 forbids.

There is no `scrollerProxy` in this build, so the two are the same number by construction. The accessor exists so there is one place to change if that ever stops being true.

## 5. Density conserves weight across the branch

Density is particles per pixel of path, not a total, so a taller page gets more particles rather than a sparser thread. The trunk carries the full figure and the four branches and four strands carry a fraction of it, so one thread dividing into four reads as one thread dividing rather than as four new threads.

The figure itself is set from the route as measured, not chosen. Trunk length plus the weighted branch total is 6,669px of effective path at 1024 and 7,637px at 1920, so the whole route costs the density times that. At 1.5 every width from 1024 up lands between 10,003 and 11,454 points, mid band for the brief's 8,000 to 12,000, with room on both sides for the page to grow.

It was 2.2 first, which is 16,181 points at 1440 against a 16,000 ceiling, and the ceiling was thinning every path to fit. So the number that shipped for two builds was not a density decision at all, it was a cap. Both limits now announce themselves: leaving the band logs the count and the density to replace it with, and reaching the ceiling throws in development and warns before thinning in production. A limit that rewrites geometry without saying so is the same failure as a uniform that never reaches the GPU, and it costs the same to find.

## 6. The reveal is driven by document Y, not by arc length

Step 5 revealed a particle when its normalised position along its own path was at or below that path's scroll progress, one uniform array entry per path. That is the obvious reading of "same scrub as the current stroke-dashoffset", and it is wrong for a route that is not vertical.

Arc length and document Y diverge wherever the path turns. The branch fan spends a lot of arc length crossing very little page, so an arc length head slows in Y while the scroll does not, and the head drifts off the top of the viewport. The route also has a near horizontal convergence run at the bottom, which has the same problem in reverse.

So the reveal line is now a single scalar in document pixels, and a particle is revealed when its own document Y is at or above it. The line sits at two thirds of viewport height, derived every frame from the same Lenis scroll value that places the object, in the same frame. That makes `revealLine - scroll` a constant, so the line is stationary on screen by construction rather than by tuning, and the head band cannot leave the viewport. Measured: the head's front edge sits within 2px of the line at every scroll position where the stream is not painted over, in both directions.

Three things fell out of the change rather than being designed:

- **The four branches reveal together.** They occupy one Y range, so one head crosses all four at the same height. Measured at the reveal front, the fan carries 149 to 180 inked pixels against the trunk's 118 to 129, with peak deviation 139 to 158 against the trunk's 156 to 164. One thread dividing, not four new ones.
- **Two guards became unnecessary.** Step 5 needed an explicit "path has not started" and "path has finished" test, because nine paths each parked an accent blob at their own end point. Neither exists now: a particle below the line is simply not revealed, and when the line descends past the end of the route the last particles fall out of the head band on their own.
- **The per path uniform arrays are gone**, along with the dynamic array indexing by attribute. A scroll frame writes two floats.

What was given up: the scrub. The old head lagged the scroll by a beat, which is what made the line feel drawn rather than clipped. A lagging reveal line is a line that slides up and down the viewport, so the lag had to go. The reveal is now instantaneous with scroll, which is what the brief asks for and why it also forbids any easing on the render side.

The SVG carrier's `scrub: 1` went with it, and had to. Leaving it would have put the carrier and the particles on two different curves: measured on a jump from 1200 to 2000, the carrier was still travelling 800ms and 395px after the reveal line had already arrived. It is `scrub: true` now, so both track scroll with no interpolation.

They are still not the same number, and cannot be. The carrier reveals by arc length per path and the stream by document Y across all paths, so a settled carrier tip and the reveal line sit 448px apart at that same scroll position. That is not a fault to fix but a trap to know about: the carrier's `stroke-dashoffset` was a valid reference for verifying the stream in step 5 and is not one any more. Measure the stream against the reveal line.

The wider fact behind both: on no tier does anything visible consume what that ScrollTrigger animates. The carrier paths are `opacity: 0` on the particle tiers, and on the Static tier the effect does not run and the stroke renders fully drawn. Whether to keep animating an invisible path at all is a separate question, left open rather than answered here.

`aAlong` and `aGroup` are still sampled and still uploaded, read by nothing. The handoff in step 8 has to assign a hero particle to a place on the route, and that is what they are for.

## 7. The Thread runs behind content, and is visible on bare page

Operator decision, taken against the full route inventory below: all four occluders stay as they are. The Thread passes behind the capabilities intro panel, behind the four dark cluster cards, behind the work grid placeholder panels, and behind the contact button. It is visible on bare page ground. That is the design, not a defect to work around.

The reasoning, recorded because it will look like an omission later otherwise: particles over body text read as broken, and particles over real photography will read as dirt once the placeholders are replaced by client work. Both are worse than a thread that disappears behind a block and comes out the other side.

The inventory, sampled at 1,809 points along all nine paths against every element in every section:

| Section | Route pts | Occluder | Occluded | Ground |
|---|---|---|---|---|
| hero | 1 | none | 0 | |
| positioning | 152 | none | 0 | visible |
| capabilities | 921 | `div[data-thread-branch-point]` | 471 | `#F7F6F4`, 16 percent of it on body text |
| | | `article[data-thread-branch-target]` x4 | 293 | `#0A0A0C`, 15 percent on text including the cluster headings |
| work | 286 | `div[data-placeholder]` | 132 | `#F7F6F4`, no text, all of it artwork |
| clients | 86 | `span` x3, the logo marks | 7 | `#5E5E66`, which is the particle rest colour exactly |
| process | 109 | none | 0 | visible |
| studio-strip | 108 | none | 0 | visible |
| contact and footer | 147 | `a[data-thread-converge]` | 4 | `#FF521F`, the terminus |

Two corrections to earlier readings in this build, both recorded because each was stated confidently and was wrong. The z-10 sections are not themselves opaque; specific content inside them is, which is why "visible over bare page ground and nowhere else" overstated it. Positioning, process and the studio strip carry the thread with nothing in the way at all. And `div[data-inverse-band]` carries no z-index above 2, so it does not occlude: measured at the contact call to action, 687 of the stream's 1,294 pixels there sit over dark ground.

None of this is new. The pre-particle hairline baseline in `build-logs/thread-before-full.txt` reports contrast 0 and coverage 0 percent at the branch, clusters and strands stops. The SVG stroke was equally invisible in all the same places, and the zeros sat in a log nobody read as occlusion.

## 8. Step 6 is one band, not four cards

Section 2.5 of the particle brief is written for a stream that crosses every inverse block, and section 7 above removes most of what it was written for. The cluster cards were the crossing problem, and there is nothing left to switch on them: the stream is behind them.

What remains is real and still needed. The contact call to action's inverse band is not an occluder, so the stream genuinely crosses it, on a `#0A0A0C` ground where `--fg-muted` particles measure the same 1.28:1 the hairline did. So step 6 is:

- One band, the contact call to action. Resting particles switch to `--fg-inverse-muted` and the head to `--accent-on-inverse` inside it.
- A hard switch at the band edge, no fade, because the background edge is hard.
- Implemented as the brief's preferred approach: the band's document Y range passed to the shader as a uniform, each particle testing its own Y. `threadStore` already carries `bandTops`, `bandBottoms` and `bandCount` from the same measurement pass that samples the paths, so there is one source of truth for where the dark ground is and nothing to add on the geometry side.
- Not `mix-blend-mode` on the canvas, which would blend the hero field along with the stream. ADR 0019 rejected difference blending for the stroke with arithmetic, and the canvas case is strictly worse.
- The footer needs nothing: the route terminates at the contact button, above it.

Criteria 11, 12 and 16 of the particle brief are amended to this scope. 16's weight conservation at the branch is unaffected and already measured in section 6; what it loses is the clause about reading correctly against the dark capabilities cards, which is now moot.

## 9. Step 6 as built

One band, measured at 1440 as document 7075 to 7975, the contact call to action. Nine route paths cross it and the switch happens per particle from its own document Y against a uniform array of band ranges, gated by a band count. A point primitive carries one vertex, so the varying reaches the fragment shader as exactly 0 or 1 and the switch is hard without a single comparison in the fragment shader: the edge falls between two particles.

Verified by forcing `--color-fg-inverse-muted` to `#00ff00` before the page's scripts read it, which is the only way to tell two similar greys apart at partial coverage. Particles on the dark ground came back `rgb(1,223,2)`, greenness 221, against greenness 2 with the real tokens. Zero green rows above the band edge, first green row 1px past it, out of 595 route rows sampled.

One thing the brief expects that does not visibly happen: the head does not change colour. `--accent-on-inverse` and `--accent` are both `#ff521f`, because ADR 0019 section 5 found the accent reads on both grounds and deliberately gave it no twin. Both are read from tokens rather than collapsed into one, so the day they diverge this needs no shader change, but today the visible switch at a band edge is the rest colour alone, `--fg-muted` to `--fg-inverse-muted`.

No blend mode on the canvas. The footer needs nothing: the route terminates at the contact button, inside the band's upper half.

## 10. The client logo loop: arcs tried, reverted, replaced by dispersion

Two arcs were built first, one per strand column, each bowing outward around the logo set and rejoining below it. They are reverted, and the reason is a measurement rather than a preference.

The logo row is 751 by 40 at 1024, 1440 and 1920 alike, because its size is intrinsic to six marks rather than a fraction of the viewport. The strand columns move outward with the viewport and the row does not, so the bow each arc has to make shrinks as the viewport grows:

| width | marks box | strand columns | bow needed | read as |
|---|---|---|---|---|
| 1024 | 137 to 888 | 268, 756 | 191px | one wide ellipse around the set |
| 1440 | 345 to 1096 | 372, 1068 | 87px | two brackets beside the set |
| 1920 | 585 to 1336 | 612, 1308 | 87px | two brackets beside the set |

Above 1024 each lobe came out 87px wide and 152px tall, taller than it is wide, with 700px of open space and four unenclosed logos between the two. An arc enclosing a 751 by 40 box from a start point 27px inside its edge cannot be wider than it is tall, so no arc adjustment fixes it. The section does not support an enclosing shape.

What replaced it is a dispersion, and it is a rendering behaviour rather than a route. Particles travelling the strands spread outward through a band around the logo row and re-gather below it. Three things follow from that which the arcs could not offer: the SVG paths stay straight runs so path length, sample count and the density tripwire are all untouched; a cloud has no aspect ratio it has to satisfy, so it adapts to whatever the row measures at any width; and the particles behave differently in that section, which is the thread doing something rather than an ornament placed near it.

The mechanism is step 6's, reused: a document Y range as a uniform, tested per particle against its own Y. The band is the marks box plus 200px above and below, which is 440px of run at every width, long enough for the bloom and the re-gather to read as movement. The ramp is a triangle in Y across the band, eased by smoothstep so it has zero slope at both edges and at the peak. Direction is hashed off `aRandom` rather than taken radially from a centre, which would draw a circle and land back at the arcs, and hashed rather than used raw because `aRandom` already drives size and alpha. Spread is a third of the row's width horizontally against the row's own height vertically, which is about 6:1 rather than the 2:1 the brief names as the bias: the magnitudes win, because 2:1 off a 250px reach would put the cloud 125px above and below a 40px row and produce the blob the brief is trying to avoid.

Displacement applies to the drawn position only. The reveal test and the head window both read the undisplaced Y, and have to: a particle that had drifted upward would otherwise reveal before its neighbours and the leading edge would fray.

**The head needed damping.** The brief's first preference is that the head disperses with everything else and blooms and re-forms. It does not survive that: undamped, the accent scattered evenly through the cloud and the leading edge stopped reading as a head. Damped to 14 percent of the ramp at full head weight, the bright core holds together while the settled stream behind it spreads, so the thread arrives at the row as a line and disperses behind its own head. The dim trailing edge of the head still spreads, by construction, because damping is proportional to a particle's own head weight: measured accent bounding width per column is about 405px against a full spread of 500px, and nearly all of that width is faint tail rather than core.

Below 1024 the route is one straight line down the page centre and it passes through the clients section, so it disperses too, at half the horizontal magnitude. There is far less room either side and a full third of the row's width would leave the viewport.

Counts are back to the pre arc figures exactly, 10,003 at 1024, 11,032 at 1440 and 11,454 at 1920, which is the check that the dispersion added nothing to the route. The band does not overlap the single inverse band at any width. Frame time over the same 900 to 7000 sweep used before this work measures 20.7ms median and 27ms at p95, against 23.3 and 23.7ms median measured earlier in the build, so no cost that is separable from headless noise.

Kept from the arc attempt because they stand without it: the density tripwire, which caught the arc version running to 12,132 points, and the correction that measures the marks box from the host's children rather than the host itself. The host is a flex row spanning the content column, 1344px wide at 1440 against the marks' 751, and measuring it put the arcs at x -12, off the left edge at two of three widths. The cloud is sized off that same box.

**What it looks like, which is the part that had to be judged rather than measured.** It reads as dispersion. The shape has structure, a tight strand entering at the top, a wide bloom at the row, a re-gather below, and structure is what separates motion from noise on a light ground. Two things are weaker than that. The clouds are centred on the strand columns rather than on the row, so the two middle logos have open space behind them and the row is flanked rather than surrounded. And the head's faint accent tail leaves a scatter of pink specks near the outer marks, which is the least clean element in the section. All six marks stay legible, and nothing sits on a mark closely enough to read as dirt: `build-logs/screens/itemC-dirt-check-left.png` and `itemC-dirt-check-right.png` are the close crops that judgement is made on.

## 11. The spiral trail, and criterion 10 superseded

Amending brief. Section 2.4's 1 to 3px perpendicular offset is the same mechanism turned down until it read as a pinstripe; this is it turned up, with rotation.

Position swings on `cos(phase)` along the path normal, size and alpha on `sin(phase)`, ninety degrees apart. The separation is the whole effect: in phase, a particle is largest at its widest excursion, which reads as a flat wobble. Out of phase it is largest as it crosses the centre line, which is what a particle on a helix does. `z` is 0 by construction so there is no real depth to draw, and the swell is the entire illusion of it.

Phase advances on a new `aDistance` attribute, arc length in pixels from the start of the particle's own path, rather than on `aAlong`. `aAlong` is normalised and the paths run from 1,252 to 5,236px, so one rotation per unit of `aAlong` would spin four times faster on the trunk than on a strand. Wavelength is 350px, radius 16px, and two independent hashes off `aRandom` decide phase and radius separately. The radius hash is squared so the distribution crowds toward the core: uniform radii read as a hollow tube, because the outer band has more circumference to fill and the cosine projection piles up at the extremes as well.

Base point size goes from 2.0 to 3.0. **Criterion 10 of the parent brief is SUPERSEDED, not failed.** It measured the stream against the pre particle SVG hairline, and that reference no longer exists: the brief that set it asked for a stream carrying a 1px line's weight, and this one asks for a loose trail spread over a 16px radius. The two cannot both be satisfied, and the operator has chosen the trail. The measurement that replaces it is whether the trail holds presence, which is a judgement rather than a ratio.

**The brief's "start static" does not work, for a structural reason rather than a tuning one.** Phase is randomised per particle across the full circumference, which is what the brief asks for and is right, because without it the trail is one thin corkscrew instead of a volume. But a randomised static helix is indistinguishable from a randomly spread tube: there is no coherent sinusoid to see and nothing is moving, so there is no rotation to read. Raising the size modulation from 0.45 to 0.8 changed the still image very little, which confirmed it. So the time term the brief offers as optional is not optional, and the trail rotates at rest at 0.785 rad/s, one turn per eight seconds. Verified as motion rather than by eye: in a 64 by 320 crop of one strand at rest, 1,786 pixels changed over two seconds against 1,253 inked at any instant, so particles are moving to substantially new positions.

**What it looks like, in the brief's own terms: in a still frame I see a fuzzy line, not a spiral trail.** Individual particles are visible and their sizes clearly vary, but nothing reads as rotating around a centre, and the reason is the paragraph above. The rotation exists only as motion, so a screenshot cannot show it and neither can I judge from one whether it reads as a trail or as busy. That needs a real display.

**Composition with the dispersion.** Both offsets stack on the same particles inside the client logo band, so the spiral radius drops to 30 percent where the dispersion ramp is at full, and the trail resolves into the cloud instead of adding to it. Confirmed by looking: the cloud keeps a clean lens shape.

**The head did not need damping, and has it anyway.** Undamped, the accent measured 23px wide and still read as a head, unlike the dispersion, which scattered it across 300px. Damped to 25 percent it measures 11px at the same ink. Kept because it sharpens the contrast between a tight arriving head and a spread trail behind it, which is a choice rather than a fix, and it is recorded as one.

**The inverse band edge is softened by one pixel.** The band test reads undisplaced Y for consistency with the reveal, per the brief, so a particle can be drawn on the far side of the edge from the ground its colour was chosen for. Measured with the sentinel injection, exactly 1 inverse coloured pixel is drawn above the edge, 4px past it, against 3,350 below. Real, and a single pixel.

**Density is unchanged and was not raised.** Counts stay 10,003, 11,032 and 11,454. The trail is thinner per unit width by construction, and it does not read as sparse at 3.0px points.

**The wider trail reaches four text runs it did not before**, at 19px rather than 3px of reach: a cluster index, the header's own button label, and two capability lines. All four sit behind an opaque ancestor that paints above `z-2`, so none of them is text the trail can actually be seen against. Nothing visible is newly crossed.

Frame time over the standard 900 to 7000 sweep measures 22.7ms median and 29.2ms at p95, against 20.7 and 27 before this change and 23.3 earlier in the build. Within noise on a headless software renderer.

## 12. Tuning: core density, hero count, wider dispersion

Three tuning items from the handoff brief, ahead of the handoff itself.

### The trail's core

`SPIRAL_RADIUS_FLOOR` 0.3, `SPIRAL_RADIUS_CURVE` 1.0. No particle's orbit comes inside 30 percent of the maximum radius, and the remaining distribution across the annulus is even rather than crowded toward the core.

Measured on a strand at 1440, ink per column at each offset from the centre line, with the 83 count background subtracted:

| offset | -8 | -6 | -4 | -2 | 0 | +2 | +4 | +6 | +8 | +10 |
|---|---|---|---|---|---|---|---|---|---|---|
| floor 0, curve 2 | 18 | 34 | 51 | 162 | 187 | 92 | 44 | 18 | 11 | 6 |
| floor 0.3, curve 1 | 52 | 59 | 66 | 87 | 84 | 72 | 68 | 66 | 41 | 21 |

The two central columns fall from 349 to 171, so the core is more than halved, and the ink moves outward: at 6px off centre it roughly doubles, and the profile is close to flat from the centre out to 8px before falling away by 16px. No hole.

**It still peaks slightly at the centre and cannot be made not to**, which is worth recording because the next person will try. The offset is `radius * cos(phase)` while size and alpha ride `sin(phase)`, ninety degrees apart, so a particle is largest and brightest exactly when its offset is zero. The heaviest particles are at the centre line by the same design decision that makes the rotation read at all. A radius floor moves orbits off the centre; it cannot move the swell off it. Emptying the core would mean breaking the ninety degree relationship, which is the one thing the brief says to keep.

### Hero count

12,000 to 10,560, down 12 percent. The entire hero diff is that constant and a comment: size, curl noise, cursor displacement, the one in nine accent ratio and normal blending are untouched.

**Item B is CANCELLED, superseded by this.** It asked for 50 percent more hero point size, against a build where `uPixelRatio` was stale at 1. The fix in `070edf5` already roughly doubled the points on a 2x display, so the complaint was answered before item B could be acted on, and the field is thinned rather than enlarged. Not deferred, not failed: the request no longer describes a problem the build has.

Runtime counts vary below the constant for two reasons that are both intended and worth knowing when reading a measurement: the field scales with viewport area, so a narrow window gets fewer, and the frame rate watchdog halves the count once per mount if it fires, which it does intermittently under headless software rendering. Measured 10,560 at 1440 on one run and 5,280 on another.

### Wider dispersion at the clients section

`DISPERSE_WIDTH_FRACTION` went from a third of the row's width to 0.85, in two steps, because the first was not enough and the measurement said so. Ink per column in the rows just below the marks, at 1440:

| | centre of row | left mark | right mark |
|---|---|---|---|
| fraction 1/3 | not measured, clouds visibly flanked | | |
| fraction 0.64 | 0.33 | 1.44 | 1.38 |
| fraction 0.85 | 0.54 | 0.69 | 1.40 |

At 0.64 the centre carried a quarter of the ink the mark columns did, because reaching the centre needed a particle in the top fifth of the cosine distribution. At 0.85 the inward reach is 638px against the 696px between the strands, roughly a third of each cloud crosses the centre, and the centre column now matches the left mark. At 1024 the centre reads 1.22 against 1.86 and 2.07; at 1920, 0.65 against 0.63 and 2.14.

The horizontal lean is inward, applied as an asymmetric scale on the cosine component rather than as a rotation, so there is no discontinuity where the sign flips: the horizontal offset is zero there either way. The outward side keeps 30 percent, which is 77/23 rather than the brief's 70/30. Tighter on purpose: at 0.43 of a 638px reach the outward side put particles at x -39 at 1024, off the left edge of the viewport.

Vertical spread is unchanged at the row's own height. The wider horizontal did not make it read flat.

`SPIRAL_IN_CLOUD` drops from 0.3 to 0.15. At 0.3 the wider cloud read as a spiral sitting inside a cloud rather than as one form.

**Judged by looking, it now reads as one form around the logo row**, not as two clouds that happen to touch: a single broad shallow sweep spanning the full width of the row with the two strand columns feeding into it from above, and particles behind and between all six marks. All six stay legible, and the dirt check crops show the scatter clearly separate from the marks. The weakness is the one already recorded in section 10, the head's faint accent tail leaving pink specks near the outer marks, and the wider cloud spreads those over more of the row.

Density counts are unchanged: 10,003, 11,032 and 11,454. Frame time over the standard sweep measures 24.7, 22.1 and 21.8ms median across three runs with p95 at 38.0, 29.4 and 28.4, so the first run's p95 was noise and there is no separable cost.

## 13. The hero handoff, built in one scene

Step 8 of the parent brief's order of work, and the amending brief is right that the obvious implementation is wrong. Lerping particles out of the hero geometry into the thread geometry means two scenes negotiating ownership of the same particles across two draw calls with attribute counts that do not match.

Nothing is handed over. The hero scene is untouched apart from the count reduction in section 12, and none of its particles move. These are the stream's own particles: in the first 750px of trunk below the hero, a share of them start at a scattered point inside the hero's lower half and travel onto the path as the reveal line passes. It reads as the field condensing into the thread because the origins share the field's box and density, not because the same particles moved.

The convergence target is `drawn`, which already carries the dispersion and the spiral, not the bare path position. Converging onto the line and then springing outward into the trail would settle in two visible stages.

Position, size and alpha all interpolate on one factor, which is the requirement section 12 records: the two scenes carry independent base sizes now, and the migration is where that gets paid for.

**The size ratio was measured, and assuming it from the two constants was wrong by a factor of nearly three.** The hero's `uSize` is 6.0 and the stream's is 3.0, so the obvious ratio is 2.0, and at 2.0 the handoff drew a layer of large soft confetti across the hero that read as a separate group of particles rather than as the field. Blob analysis of a text free patch puts the hero field's median particle at 2.3px across against the stream's 3.2px, because the hero's 6.0 is before its viewport scale and its per point variance. The real ratio is 0.72: origins start smaller and grow as they land.

Two other things the first attempt got wrong, both named in the brief's "watch for" list:

- **Double density.** The whole window's worth of particles starting in the hero region put the stream's first stretch on top of the field's own. `ORIGIN_SHARE` is 0.55, so a little over 600 of the roughly 1,125 particles in the window are recruited and the rest begin on the path, which is the parent brief's 400 to 800.
- **The spiral swell applied at the origin.** A particle still out in the hero is not on the spiral yet, so both the size and the alpha modulation are gated on the settle factor. At 2.0 with the swell compounding, a single origin particle could render 14px across.

**Stagger and the reveal interaction.** Convergence starts `CONVERGE_LEAD` of 300px before the particle is revealed, which is deliberately larger than the 260px stagger. Without the lead, a late starting particle is revealed at converge 0, sits motionless at its scattered origin for up to a stagger's worth of scroll and then sets off, which is precisely the "appears at its scattered origin from nothing" the brief warns against. With it, converge at the instant of reveal is 0.614 for the earliest particle and 0.0168 for the latest, so every particle is already moving on the frame it first becomes visible. The part of the ramp before reveal is spent behind the cull, where nothing is drawn.

Reveal and the head window both read `position.y` before any displacement exists, and all three displacements, dispersion, spiral and handoff, apply to `gl_Position` alone.

**Judged by looking, and the answer is the good one: it reads as the field condensing into the thread**, not as a separate group fading in. At the point where the reveal line is 200px past the hero, the field above holds its own even fine texture and a funnel of particles narrows out of the bottom of it into the trunk; 500px further on, the last of them are still converging as a loose scatter above a stream that has already formed. The origins are not pickable out of the field as a distinct layer, which is the whole test, and it is the measured size ratio that made the difference rather than any change to the scatter itself.

Counts unchanged at 10,003, 11,032 and 11,454. Frame time 24.4ms median and 31.0ms at p95, inside the 21.8 to 24.7 and 28.4 to 38.0 range the same sweep measured before this change.

## 14. Text dimming, both counts halved, watchdog window moved

Four items from the dimming brief, in the order it required: the stream's count first, so the dimming was tuned against the density that ships rather than against one twice as dense.

### Stream count and trail alpha

`TRUNK_DENSITY` 1.5 to 0.75. Measured counts 5,874 at 375, 5,002 at 1024, 5,518 at 1440 and 5,728 at 1920. `POINT_BAND` moved with it to 4,000 to 6,000 and `MAX_POINTS` to 8,000, keeping the same third of headroom the ceiling had over the band before. The tripwire is silent at every width, which is the point: a count change that leaves the tripwire behind makes it fire on a decision rather than on drift, and that is how a guard gets ignored.

Settled trail alpha is 65 percent of what it was, 0.5 to 0.7 becoming 0.325 to 0.455. The head is untouched at 0.86 to 1.0, because the contrast between a bright head and a receded trail is the whole change.

The trail alpha was done with the count rather than after the dimming, a deviation from the stated order and the reason is the brief's own warning about the compound case: dimming tuned against the old alpha would have had to be tuned twice.

### Dimming over body copy

Boxes are collected in the same layout pass as the route and passed as a uniform array of rects in document space. Dimmed, never occluded: cutting the trail out over copy would break it into disconnected segments and lose the continuity the effect exists for.

**The cap is set against the uniform budget, not the page.** ESSL 1.00 guarantees only 128 vertex uniform vectors and each rect costs one, so this page's 87 raw boxes risked a shader that fails to compile on a conforming minimum implementation, which shows up as a thread that silently does not draw. Merging neighbouring blocks brings 87 down to 36 at 375px and 38 at 1024, 1440 and 1920, so `MAX_TEXT_RECTS` is 40 and **the cap is not reached at any width**. If a longer page ever exceeds it the largest boxes by area win and the collector says so on the console.

Merging is also the better rendering. A box per line or per list item dims in stripes; a box per block recedes the trail across the whole passage. The cost is that the gaps inside a block dim too, which is a far smaller error than half the page not dimming.

Values: dim to 0.3 of normal alpha, ramped across a 6px pad either side of each edge rather than stepped, because a hard alpha step on a rectangle reads as a rectangle cut out of the trail, which is more distracting than the particles were. **The head keeps 85 percent of its brightness**, taking only 15 percent of the dimming, so the thread does not appear to stall wherever it crosses copy.

The test uses the displaced position, unlike the reveal and the inverse band which use undisplaced Y. Deliberate, and the distinction is worth keeping straight: those two ask where the particle's place on the route is, and this one asks where the particle actually ended up relative to the words, which is the only thing that decides whether it distracts.

At 375px, where the thread column and the text column overlap almost completely, the trail measures 188 of 311 rows inked at mean deviation 45.5 against a control column at 0 rows, so it is still clearly a thread. No breakpoint specific dim factor was needed.

### Hero count, and why `ORIGIN_SHARE` did not move

`COUNT` 10,560 to 5,280. The whole hero diff is that constant and its comment.

The brief expected this to break the handoff tuning, on the reasoning that halving the field leaves the stream's scattered origins denser than the thing they blend into. It does not, and the reason is the order the brief itself set. Item 3 halved the stream's count first, which halved the number of particles in the handoff window, so the recruited origins halved in step with the field: about 620 of 10,560 before, about 310 of 5,280 after, which is 5.9 percent either way. `ORIGIN_SHARE` stays at 0.55, and confirmed by looking at the hero exit, the origins still cannot be picked out of the field as a distinct layer.

### Watchdog

The measurement window now waits three seconds after the field's first frame, a little under three times the end of the last load time long task. That is the whole fix, as instructed, and no downshift fired at either width on any run since.

A second gate stops the window completing once the handoff has begun, which is the criterion about not changing field density mid effect. The condition is the one the stream uses, the reveal line reaching the hero's bottom edge, so `REVEAL_OFFSET` is imported rather than the fraction written twice.

**And the honest part: the watchdog can no longer do anything meaningful.** `MIN_COUNT` is 5,000 and the base is now 5,280, so a downshift halves 5,280 to 2,640, clamps to 5,000, and delivers a 5.3 percent cut. It is a subsystem that can fire and cannot act, which is the pattern section 11's dead ScrollTrigger was. Two ways out, both the operator's call and neither taken here: lower `MIN_COUNT` so the cut means something, or remove the watchdog on the grounds that a field of 5,280 is already the low setting.

### Two harness repairs the density change forced

Both are the same fault in different places: a number copied out of the source and left behind when the source moved.

`check-home` asserted the point count against a hardcoded 8,000 to 12,000 and failed four criteria on a correct build. It now reads the band from `data-thread-band`, which `SceneCanvas` publishes from `POINT_BAND`, so the page states its own limit and the copy cannot go stale again.

The painting criterion's control column was a fixed offset, and at 1920 that offset landed inside the centred positioning copy: the control inked 155 of 331 rows on its own and left the thread 54 rows clear of a threshold needing 60. The threshold was not the problem and was not touched. The control is now the emptiest of eight candidate offsets, which is the closest available stand in for "this page without a thread on it". Margins after: 255 against 60 at 1024, 231 against 120 at 1440, 211 against 106 at 1920, 225 against 106 at 2560.

### Measured

Frame time over the standard sweep improves as the brief expected: 22.4ms median and 28.4ms p95 at 1440 against 24.4 and 31.0 before, and 16.7 and 17.9 at 375px. No console output at any width. 34 of 35 in `check-home`, the known Reduced tier gap.

### Judged by looking, all three in the brief's terms

- **The dimmed trail over text reads as receded, not broken up.** The ramp does the work: at 375px the trail visibly fades as it enters a paragraph and comes back in the gap between them, with no rectangular edge anywhere. The head crossing copy at full brightness is what keeps it from reading as an interruption.
- **The halved thread still reads as a thread**, not as scattered dots following a line. In the process section at 1440 both strands are continuous, and the particles are close enough together that the eye joins them without effort.
- **The halved hero field is at the edge of reading as sparse.** It still has presence and the handoff still works against it, but individual particles are now separately countable at 1440 where before they read as a texture. It is a dust rather than a field. That is a judgement rather than a fault, and it is the one of the three worth a second opinion on a real display.

## 15. The frame rate watchdog is removed, and the mobile tier means most of this is desktop only

Two closing findings, the second the more important.

### The watchdog is gone

It measured the two seconds after mount, which is the two seconds carrying the page load. Instrumented: 672ms of main thread blocking in three long tasks of 212 to 233ms, from hydration, the GSAP and Lenis imports and the Thread's sampling pass. A two second window holding 672ms of blocking delivers about 79 frames, averaging 39.6fps on any GPU, under its own 40 threshold. So it fired on boot contention rather than on rendering capability, intermittently, on one machine and one build.

Moving the window three seconds out stopped the false positives and left a subsystem that could fire and could not act: `MIN_COUNT` 5,000 against a base of 5,280 means a downshift clamps to 5,000 and cuts 5 percent. Operator decision, and the right one: removed rather than re-tuned, because a subsystem that halves the field on a false positive is worse than no subsystem. Context loss still downgrades the tier, which is a different mechanism and untouched.

### Every phone gets no Thread at all

`useRenderTier` returns `reduced` for any coarse pointer, unconditionally and before any capability test:

```
if (!window.matchMedia('(pointer: fine)').matches) return 'reduced'
```

That is deliberate and documented there: a finger has no hover, and cursor interaction is the point of the Full tier field. The consequence for the Thread was not deliberate. On the Reduced tier the WebGL scene is not mounted, the SVG carrier sits at `opacity: 0`, and the 2D overlay of section 2.3 does not exist, so nothing draws the route. Measured, emulating a coarse pointer:

| context | pointer:fine | tier | webgl host | 2D overlay | svg opacity | Thread |
|---|---|---|---|---|---|---|
| 375 narrow desktop | true | full | yes | no | 0 | present |
| 375 phone | false | reduced | no | no | 0 | **absent** |
| 768 tablet | false | reduced | no | no | 0 | **absent** |

So the Thread is absent on every phone and every tablet that does not have reduced motion enabled. With reduced motion on, the tier is `static` and the full SVG stroke draws, which is the one mobile path that does render something.

**This makes most of the mobile work in these six briefs desktop only.** The 375px measurements of text dimming, the below 1024 dispersion at half magnitude, the single line's document Y reveal, the spiral and the handoff at narrow widths were all taken in a narrow desktop viewport with a fine pointer, which resolves to Full. None of it reaches a device with a touchscreen. The only part that does is the geometry: `measure` returns the single straight line below 1024 regardless of tier, and the Static tier draws it.

`check-home` could not have caught this, and for a reason worth recording alongside the rest of the harness findings: its `open()` helper writes `localStorage['wyrd:tier'] = 'full'` before navigating, so its 375px criteria force the Full tier and measure a page no phone will see. It emulates touch at that width and then overrides the very decision touch drives.

## 16. The Reduced tier gets the stroke, and the 2D overlay is rejected

Operator decision. Section 2.3 of the particle brief gives the Reduced tier a 2D canvas overlay drawing the sampled points at a third of the density, and it is not built and will not be.

**Scoped, and rejected as disproportionate.** Building it means a second renderer: a fixed full viewport canvas, its own draw loop, and CPU reimplementations of everything the vertex shader now does, which by this point is the document Y reveal, the head band, the inverse band colour switch, the client logo dispersion, the spiral trail with its rest rotation, the text dimming against forty rects, and the hero handoff. Every one of those would be a second implementation of a rule that already exists once, free to drift from it, and the drift would be invisible because nothing compares the two. That is the second-source-of-truth problem this build has already paid for twice, in the stale `POINT_BAND` copies and in the carrier that animated a value nothing read.

And the tier exists to stay light. Adding a per frame canvas loop to the tier chosen because the device is low powered or touch driven inverts its purpose.

So the Reduced tier renders the SVG hairline, complete, exactly as the Static tier does. ADR 0019's two path masked crossing already works there and needed no change. Mobile gets a real Thread, no Three.js, no new renderer: measured on an emulated phone and tablet, tier `reduced`, SVG opacity 1, dash offset 0, zero requests matching three or drei, no console output.

**Not revealed on scroll, and the reason is not cost.** A document Y reveal for a stroke needs a per path table mapping Y to normalised arc length, because `stroke-dashoffset` is an arc length quantity and the two diverge wherever the path turns, plus a per frame loop writing nine dash offsets. That is affordable, roughly 576 `getPointAtLength` calls at layout and nine binary searches a frame. It is rejected on the tier's contract rather than its cost: a scrubbed reveal is motion, and this is the tier a visitor lands on because their device or their input said keep it simple. The brief's own fallback is a fully drawn stroke, and that is the honest reading of it.

One thing fixed in passing that was pure waste. `streaming` included the Reduced tier, so the sampler ran its eleven thousand `getPointAtLength` calls there and published the result to a renderer that was never mounted. Full tier only now. `REDUCED_DENSITY` went with it, a constant that existed solely for the overlay.

The Reduced tier Thread entry in `docs/BLOCKERS.md` is closed as resolved by decision rather than by build. Cited by title rather than by number: it was item 10 when this was written, and that number now belongs to the Lighthouse entry.

## 17. The harness no longer forces a tier

`check-home`'s `open()` defaulted to writing `localStorage['wyrd:tier'] = 'full'` before navigating. It also emulates touch below 600px, so it emulated the exact input that makes `useRenderTier` return Reduced and then overrode the decision that input drives. Every narrow width criterion measured a page no phone can see, which is how the missing mobile Thread survived a green harness for the whole of this work.

The default is now no override. Criteria explicitly about a tier still name one, and the Full tier painting criteria do, which only pins what detection would decide at those widths anyway. The below 1024 criteria resolve naturally and report which tier they landed on.

What changed when the override came off, with the Reduced tier stroke in place: 35 of 35, up from 34, and the one criterion that had been failing since it was written now passes. At 375px the tier resolves to `reduced` and the Thread paints 330 of 331 rows against a control of 17. At 768 and 1023 it resolves to `full`, because this helper only emulates touch below 600px, so those two still measure the particle stream.

## Consequences

- The Thread is the fourth WebGL use on the site. Brief 7b.2's list of three is now a list of four, and this record is the argument 7b.2 requires.
- The reveal stays on the same ScrollTrigger per path that drew the stroke. Progress is written into a shared typed array rather than React state, because it changes sixty times a second and must never cause a render.
- The Static tier keeps the SVG stroke, complete and unanimated, with the two path crossing solution from ADR 0019 intact. Nothing about that tier changes.
- Verification reads counts from the DOM rather than inferring them from pixels: `data-field-count` for the hero field and `data-thread-stream` for the stream.
- What is not decided yet: the Reduced tier's 2D overlay, which must reproduce the Y based reveal on the CPU and currently renders nothing at all, and whether below 1024 gets a stream or keeps the stroke. Those are the steps that follow, and each adds its section here.
