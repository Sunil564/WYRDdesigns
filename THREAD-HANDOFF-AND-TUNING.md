# Core density, hero count, hero handoff, wider dispersion

Amends `THREAD-SPIRAL-TRAIL.md` and `ITEM-C-DISPERSION.md`. Item 3 is step 8 of the order of work in `HERO-PARTICLES-AND-THREAD.md`, which was never built. Read all three, and `CLAUDE.md`.

Four items. Three are tuning, one is a build. Do the tuning first and commit it, then the build.

---

## 1. Thin the core of the trail

The trail's centre line is too dense. Radius is currently squared, which crowds particles toward the core deliberately. Reverse that, carefully.

**Do not simply invert the exponent.** A uniform radius distribution reads as a hollow tube, which was the failure the squaring was avoiding. What is wanted is a thinner core, not an empty one.

Two changes together:

- **Add a minimum radius floor**, roughly 25 to 35 percent of maximum. No particle sits on the centre line. This is the change that does most of the work: it hollows the dense core without emptying the middle band.
- **Soften the exponent** from 2 to roughly 0.8 to 1.2, so the remaining distribution across the annulus is closer to even.

Tune both by eye together. If it starts reading as a tube with a visible hole, raise the exponent back toward 2 before lowering the floor.

Everything else about the spiral stays: wavelength 350px, radius 16px, the two independent hashes, the rotation at 0.785 rad/s, position on cosine and size and alpha on sine.

## 2. Hero field count

Reduce hero particle count by 12 percent. No other hero change: size, noise, cursor displacement, accent ratio, and blending all stay.

This closes item B by a different route than the brief expected. Mark item B CANCELLED, superseded by this reduction.

## 3. Hero handoff, step 8

Particles from the lower half of the hero field appear to break away and form the thread as the user scrolls out of the hero.

### How to build it

The obvious implementation is wrong. Lerping particles from the hero geometry into the thread geometry means two scenes coordinating ownership of the same particles across two draw calls, with attribute counts that do not match.

**Build it entirely inside the thread scene instead.** The thread's own particles start scattered and converge onto the path:

- Give each thread particle in the first stretch of the trunk an **origin position**: a scattered point in the hero's lower half, distributed to match the hero field's density and character, derived from `aRandom` so no extra attribute upload is needed beyond the origin itself.
- A per-particle **converge factor** ramps from 0 to 1 as the reveal line approaches that particle's document Y. At 0 the particle sits at its scattered origin, at 1 it sits on the path with its full spiral offset.
- Interpolate **position, size, and alpha** together on the same factor. This is the requirement recorded earlier: hero and thread now carry independent base sizes, so a particle migrating between them changes size, and unhandled it will pop.
- The convergence target is the path position **plus** its spiral offset, not the bare path position. Otherwise particles converge to a tight line and then spring outward into the spiral, in two visible stages.

Only the trunk's first stretch does this, roughly the first 600 to 900px of path below the hero. Below that, particles start on the path as they do now.

The hero scene is not modified. Its particles stay where they are. The effect reads as hero particles condensing because the thread's scattered origins share the hero field's density and character, not because the same particles moved.

### Watch for

- **Stagger.** If every particle converges at the same rate the whole stretch snaps into place at once. Offset the converge ramp per particle off `aRandom` so they arrive over a range rather than together.
- **Double density.** Where thread origins overlay the hero field, the two are drawn together and that region reads denser than the hero alone. If it looks wrong, thin the origins rather than touching the hero field.
- **Reveal interaction.** The converge factor is driven by the reveal line and so is the reveal test. Both read undisplaced document Y. Confirm a particle is not revealed before it has begun converging, which would make it appear at its scattered origin from nothing.

## 4. Wider dispersion at the clients section

The two clouds should be wider and should overlap over the centre of the logo row, rather than flanking it.

- **Bias the horizontal displacement inward.** The left strand throws predominantly right, the right strand predominantly left, roughly 70/30 inward to outward. Keep some outward spread so it does not read as two arrows aimed at each other.
- **Increase maximum spread** enough that the two clouds meet and overlap across the middle marks. Currently each column spreads about 405px against a 751px row with two strands, so the middle is open. Widen until the overlap is real, not just adjacent.
- **Vertical spread** unchanged, unless the wider horizontal makes it read flat, in which case raise slightly and say so.
- **Spiral composition** currently drops spiral radius to 30 percent inside the band. Keep that rule. With a wider dispersion it may want to go lower still so the cloud reads as one form rather than as a spiral inside a cloud. Report what you used.
- All six marks must stay legible with a denser overlapping cloud behind them. Re-run the dirt check crops.

---

## Acceptance criteria

1. Trail core is visibly thinner without reading as a hollow tube. Minimum radius floor and exponent both stated.
2. Hero count reduced 12 percent. Diff confirms size, noise, displacement, accent ratio, blending unchanged.
3. Item B marked CANCELLED, superseded by the count reduction.
4. Thread particles in the first trunk stretch converge from scattered hero-region origins onto the path.
5. Position, size, and alpha interpolate on the same converge factor. No size pop.
6. Convergence target includes the spiral offset. No two-stage settle.
7. Convergence is staggered per particle, not simultaneous.
8. No particle is revealed before it has begun converging.
9. The hero scene is unmodified apart from the count reduction. Verify by diff.
10. Clients clouds overlap across the centre of the logo row. Screenshot at 1024, 1440, 1920.
11. All six marks legible, dirt check crops re-run.
12. Frame time unchanged within noise. Report it.
13. Density counts unchanged, or the new band value stated.
14. Screenshots at 1440 of the hero exit at three scroll positions through the convergence.

## Judge by looking

Two things a measurement cannot settle:

- Whether the convergence reads as particles leaving the hero and becoming the thread, or as a separate group of particles fading in near the hero. If the latter, the origins do not match the hero field's character closely enough.
- Whether the overlapping clouds read as one form around the logo row, or as two clouds that happen to touch.

Report both in those terms.
