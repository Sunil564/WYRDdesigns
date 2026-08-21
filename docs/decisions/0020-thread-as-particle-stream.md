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

## Consequences

- The Thread is the fourth WebGL use on the site. Brief 7b.2's list of three is now a list of four, and this record is the argument 7b.2 requires.
- The reveal stays on the same ScrollTrigger per path that drew the stroke. Progress is written into a shared typed array rather than React state, because it changes sixty times a second and must never cause a render.
- The Static tier keeps the SVG stroke, complete and unanimated, with the two path crossing solution from ADR 0019 intact. Nothing about that tier changes.
- Verification reads counts from the DOM rather than inferring them from pixels: `data-field-count` for the hero field and `data-thread-stream` for the stream.
- What is not decided yet: the Reduced tier's 2D overlay, which must reproduce the Y based reveal on the CPU and currently renders nothing at all, and whether below 1024 gets a stream or keeps the stroke. Those are the steps that follow, and each adds its section here.
