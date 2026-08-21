# Thread: spiral trail instead of a tight line

Amends `HERO-PARTICLES-AND-THREAD.md` section 2.4 (idle motion) and the base point size. Read that file, `ITEM-C-DISPERSION.md`, and `CLAUDE.md` first.

## Housekeeping first, do this before anything else

A stale Next server has been running on port 3000 for most of this build while verification served port 3100. The operator spent several turns looking at an old build and believing nothing had changed.

Kill it. Then make this impossible to repeat: either serve the verified build on 3000, or make the harness fail loudly if anything is listening on 3000 that is not the current build. Report which you did. This is the same class of failure as the harness reading invisible elements, a tool quietly serving something other than what was asked for.

## What is changing

The thread currently reads as a tight, precise, clustered line of particles. It should read as a loose spiral trail: bolder particles, spread well away from the path centre, rotating around the path as they follow it. Fairy-trail, not pinstripe.

The route is unchanged. The reveal is unchanged. This is entirely a rendering change: how particles sit relative to the path they follow.

## The mechanism

Section 2.4 already specifies a per-particle perpendicular offset oscillating on noise, at 1 to 3px amplitude. That is the right mechanism, turned down almost to nothing. This amplifies it and adds rotation.

### Spiral

The geometry is flat, `z` is 0 by construction, so a true 3D helix is not available. Fake the depth instead:

- **Position** offsets along the path normal by `cos(phase) * radius`. The tangents computed during sampling give you the normal.
- **Size and alpha** modulate on `sin(phase)`. Particles swell and brighten as they swing toward the viewer, shrink and fade as they swing away.

Position on cosine, size and alpha on sine, ninety degrees out of phase. That is what makes a flat oscillation read as rotation. Getting this wrong gives you a wobble, not a spiral.

**Phase** is `aAlong * frequency + aRandom * TAU`, plus a slow time term if the trail should rotate at rest. Start static and add the time term only if it looks inert. A trail that visibly spins while the user is not scrolling may read as busy.

The `aRandom` term is what matters most: it distributes particles around the full circumference rather than putting them all at the same point on the spiral. Without it you get one thin corkscrew. With it you get a volume.

**Frequency**: start at roughly one full rotation per 300 to 400px of path. Too fast reads as noise, too slow reads as a slow bend rather than a spiral. Tune by eye.

### Spread

- **Radius varies per particle**, driven off a hash of `aRandom` separate from the phase hash. Some particles sit near the core, some at the outer edge. That variance is what makes it a trail rather than a tube.
- Distribute radius so the core stays denser than the edge. A uniform distribution reads as a hollow tube because the outer band has more circumference to fill. Bias toward the centre.
- **Maximum radius**: start around 12 to 20px and tune upward. This is a large increase from 1 to 3px and the first attempt will probably look wrong in one direction or the other.

### Boldness

- Base point size up. Start at 50 percent and tune. The spread thins the apparent line, so heavier particles are needed to hold the same presence.
- This supersedes criterion 10 from the parent brief, which measured the stream against the old SVG hairline. That hairline is no longer the reference. Mark criterion 10 as SUPERSEDED, not FAILED, with the reason.

## Constraints

**Reveal reads undisplaced Y.** Same rule as the dispersion. The reveal test and the head window both use the original document Y. Only `gl_Position` sees the spiral offset. Breaking this smears the head.

**Displacements stack.** The clients section dispersion is a second offset on the same particles. Confirm they compose rather than fight: inside the clients band a particle carries both its spiral offset and its dispersion offset. If the sum blows out, ramp the spiral radius down where the dispersion ramp is high, so the trail resolves into the cloud rather than adding to it.

**The head.** A spiral head may stop reading as a head, the same failure the dispersion had. Apply the same fix if needed: damp the spiral radius for particles at full head weight, so the core arrives tight and the trail spirals out behind it. Report whether damping was needed and at what value.

**Density.** Spreading particles over a wider volume thins the trail. If it reads as too sparse, raise the density band deliberately with a new number in the tripwire, and say what you changed it to. Do not let it drift up into the ceiling.

**Occlusion.** A wider trail crosses more content. The standing ruling is that the thread passes behind everything, so this should be handled, but confirm the wider trail has not reached anything it did not previously overlap, particularly text.

**Inverse band.** The wider trail may now cross the contact CTA band edge at more points. The per particle Y test still applies, using undisplaced Y for consistency with the reveal. Confirm the edge stays hard.

**Tiers.** Full only for now. The Reduced tier's 2D overlay does not exist, BLOCKERS item 10. Note there that it must reproduce the spiral, the Y reveal, and the dispersion. Static tier is an SVG stroke and is unaffected.

## Acceptance criteria

1. Position offsets on cosine, size and alpha on sine, ninety degrees out of phase. Verify in the shader, not by screenshot.
2. Phase includes a per-particle `aRandom` term so particles occupy the full circumference rather than a single corkscrew.
3. Radius varies per particle from a hash independent of the phase hash, biased toward the core.
4. The trail reads as rotating, not as a flat wobble. Judge by looking, at three scroll positions.
5. Base point size increased and the trail holds visual presence despite the spread.
6. Reveal test and head window read undisplaced Y. Head does not smear.
7. Spiral and dispersion offsets compose without blowing out inside the clients band. Screenshot that section specifically.
8. Head remains legible as a head. Report whether damping was needed and its value.
9. Trail does not read as too sparse. If density changed, the new band value is stated.
10. Wider trail has not reached any text it did not previously overlap.
11. Inverse band edge stays hard at the contact CTA.
12. Frame time unchanged within noise. Report it.
13. Criterion 10 of the parent brief marked SUPERSEDED with reason.
14. Port 3000 resolved. State what you did.
15. Screenshots at 1440 at four scroll positions: just below the hero, mid page, the clients section, and the contact band.

## The thing to judge by looking

Whether it reads as a spiral trail or as a fuzzy line. The difference is whether you can see individual particles rotating around a centre, or just a blurry band. If it is a blurry band, the phase frequency or the size modulation is too weak, not the radius.

Report which of the two you see, in those words.
