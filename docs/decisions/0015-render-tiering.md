# 0015. Render tiering, and why Three.js is dynamically imported

Status: accepted
Date: 2026-08-20
Phase: 2b

## Context

Brief 7b.1 states the tradeoff plainly: Three.js with R3F and drei is 150 to 250kb gzipped, and a WebGL hero and a mobile Lighthouse Performance score of 90 are not both achievable. The resolution is tiering, and the brief calls it the single most important performance decision in the build. Criterion 5 in section 11 says that if zero Three.js bytes on the Reduced and Static tiers fails, nothing else in the list matters.

## Decision

Three tiers, decided once on mount by `useRenderTier()`.

| Tier | Condition | What renders |
|---|---|---|
| Static | `prefers-reduced-motion: reduce` | nothing. No canvas of any kind |
| Reduced | coarse pointer, or `deviceMemory < 4`, or fewer than 4 logical cores, or no WebGL2 | the 2D canvas field, `components/motion/ParticleField2D.tsx` |
| Full | everything else | the WebGL scene, dynamically imported |

Detection details that matter:

- **WebGL2 is tested by creating a context**, then immediately losing it, rather than by sniffing a user agent. One throwaway context on mount for a real answer.
- **A coarse pointer is Reduced regardless of how fast the device is.** Cursor interaction is the point of the Full tier field and a finger has no hover.
- **Absent `deviceMemory` counts as sufficient.** It is Chromium only. Safari and Firefox never report it and a 2021 MacBook is a Full tier machine. Treating unknown as insufficient would put every Safari visitor on the fallback.
- **`hardwareConcurrency` under 4 is Reduced.** A four core threshold catches low end Android and old laptops that report plenty of memory.

**The mechanism that enforces the byte split.** `TierGate` takes the Full branch as a **render function**, not as a node:

```tsx
<TierGate
  full={({ onContextLost }) => <SceneModule onContextLost={onContextLost} />}
  reduced={<ParticleField2D />}
/>
```

`SceneModule` is `next/dynamic(..., { ssr: false })`. Because the Full branch is a function, the element is not even constructed unless the tier resolves to `full`, so the dynamic import is never reached on the other two tiers and their chunks are never requested. A node passed eagerly would be safe today and one refactor away from not being.

`useRenderTier` returns `pending` on the server and on first paint. No branch is taken speculatively, and nothing renders a canvas before the tier is known.

**Context loss falls back, it does not fail.** `SceneCanvas` listens for `webglcontextlost`, calls `preventDefault`, and reports upward. `TierGate` downgrades Full to Reduced, so a lost context becomes a 2D field rather than a black rectangle.

**Disposal is explicit.** R3F disposes scene objects on unmount and leaves the renderer's GL context alive. `DisposeOnUnmount` calls `gl.dispose()` and `gl.forceContextLoss()`, which is what stops ten mount cycles becoming ten live contexts.

**Manual override for verification.** `?tier=full|reduced|static` on the URL, then `localStorage['wyrd:tier']`. The `/tiers` route is an internal harness, noindex and unlinked, that forces a tier, runs ten mount and unmount cycles, and drops the context on demand.

## Consequences, measured

From a production build, `next start`, transfer size over the wire on `/tiers`:

| Tier | JS over the wire | Three.js chunks | Branch rendered |
|---|---|---|---|
| Full | 440.4kb | 3 | WebGL canvas |
| Reduced | 205.4kb | 0 | 2D canvas |
| Static | 205.4kb | 0 | nothing |

`scripts/check-tiers.mjs` asserts all of it in a real browser, including a throttled mobile profile for the Reduced pass. It does not trust chunk names: it refetches every script the page loaded and greps the bodies for `WebGLRenderer`, `BufferGeometry`, `ShaderMaterial`, and `react-three`, because chunk names are hashed and a name match proves nothing either way.

Other consequences:

- The Full tier is at 440kb of a 500kb budget with the hero shader still to come. **drei is installed and not imported anywhere yet.** It stays that way unless a specific helper earns its bytes, and the cut order in ADR 0016 starts with drei for exactly this reason.
- Every effect now has three implementations to consider, not one. That is the cost of the decision and it is paid per component.
- A visitor turning reduced motion on mid session drops to Static without a reload, through the media query listener.
