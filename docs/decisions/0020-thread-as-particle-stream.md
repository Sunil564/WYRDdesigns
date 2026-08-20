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

## Consequences

- The Thread is the fourth WebGL use on the site. Brief 7b.2's list of three is now a list of four, and this record is the argument 7b.2 requires.
- The reveal stays on the same ScrollTrigger per path that drew the stroke. Progress is written into a shared typed array rather than React state, because it changes sixty times a second and must never cause a render.
- The Static tier keeps the SVG stroke, complete and unanimated, with the two path crossing solution from ADR 0019 intact. Nothing about that tier changes.
- Verification reads counts from the DOM rather than inferring them from pixels: `data-field-count` for the hero field and `data-thread-stream` for the stream.
- What is not decided yet: the inverse block crossing, the Reduced tier's 2D overlay, and whether below 1024 gets a stream or keeps the stroke. Those are the steps that follow, and each adds its section here.
