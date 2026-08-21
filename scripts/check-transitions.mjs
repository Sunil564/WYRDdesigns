/**
 * Page transitions. Development only, run against a production build.
 *
 * Four things worth asserting, and two of them are about what must not happen:
 *
 * - a client side navigation animates
 * - the first load does not, so the page transition does not collide with the `[data-reveal]`
 *   entrance system or delay first paint behind an animation
 * - the wrapper never carries a transform, because a transform would make it the containing
 *   block for the `fixed` WebGL canvas inside `app/page.tsx` and drag it around on every
 *   navigation to the homepage
 * - reduced motion does not animate at all
 *
 * The transform check is the one that would be easy to drop and expensive to lose. It is
 * asserted on the computed style during the transition, not on the absence of a prop.
 *
 * Usage: bash scripts/verify-server.sh, then
 *   SHOOT_BASE=http://localhost:3100 node scripts/check-transitions.mjs
 */

import { assertBuildFresh } from './build-fresh.mjs'
import { createHarness } from './route-checks.mjs'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'

/*
  Refuse to measure a build older than the source. See scripts/build-fresh.mjs.
*/
assertBuildFresh({ base: BASE })

const harness = createHarness({ base: BASE })
const { record, open } = harness
await harness.launch()

/** The wrapper's mode and opacity, plus where the fixed layers actually sit. */
const probe = (page) =>
  page.evaluate(() => {
    const wrapper = document.querySelector('[data-page-transition]')
    const style = wrapper ? getComputedStyle(wrapper) : null
    const canvasHost = document.querySelector('[data-thread-stream]')
    const header = document.querySelector('header')
    const canvasBox = canvasHost?.getBoundingClientRect()
    const headerBox = header?.getBoundingClientRect()
    return {
      present: Boolean(wrapper),
      mode: wrapper?.getAttribute('data-page-transition') ?? null,
      transform: style?.transform ?? null,
      opacity: style ? Number(style.opacity) : null,
      canvasTop: canvasBox ? Math.round(canvasBox.top) : null,
      canvasLeft: canvasBox ? Math.round(canvasBox.left) : null,
      headerTop: headerBox ? Math.round(headerBox.top) : null,
    }
  })

// ------------------------------------------------ the first load is not a transition
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)
  const first = await probe(page)
  record(
    'the first load renders at rest rather than fading the whole page in',
    first.present && first.mode === 'first-load' && first.opacity === 1,
    `mode ${first.mode}, opacity ${first.opacity}`,
  )
  await context.close()
}

// ------------------------------------------------------- a navigation does transition
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)

  await page.click('header a[href="/studio"]')
  await page.waitForTimeout(120)
  const during = await probe(page)
  await page.waitForTimeout(1600)
  const settled = await probe(page)

  record(
    'a client side navigation animates and settles at full opacity',
    during.mode === 'animated' &&
      during.opacity !== null &&
      during.opacity < 0.99 &&
      settled.opacity === 1,
    `mid transition opacity ${during.opacity}, settled ${settled.opacity}`,
  )
  await context.close()
}

// ---------------------------------- the wrapper never becomes a containing block
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}/studio`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)

  /*
    Navigate to the homepage, which is the only route carrying the fixed WebGL canvas, and
    sample while the transition is running. If the wrapper carried a transform, the canvas
    would be positioned against it rather than against the viewport and would not be at 0, 0.
  */
  await page.click('header a[href="/"]')
  await page.waitForTimeout(140)
  const during = await probe(page)
  await page.waitForTimeout(1800)
  const settled = await probe(page)

  record(
    'the transition wrapper carries no transform, so fixed layers stay anchored',
    during.transform === 'none' && settled.transform === 'none',
    `transform during "${during.transform}", settled "${settled.transform}"`,
  )
  record(
    'the WebGL canvas and the header stay at the viewport origin through a transition',
    during.headerTop === 0 &&
      settled.headerTop === 0 &&
      settled.canvasTop === 0 &&
      settled.canvasLeft === 0,
    `during: canvas top ${during.canvasTop} left ${during.canvasLeft}, header ${during.headerTop}. ` +
      `Settled: canvas top ${settled.canvasTop} left ${settled.canvasLeft}, header ${settled.headerTop}`,
  )
  await context.close()
}

// -------------------------------------------------- reduced motion does not animate
{
  const { context, page } = await open(1440, 900, 'reduce')
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)
  await page.click('header a[href="/studio"]')
  await page.waitForTimeout(100)
  const during = await probe(page)
  await page.waitForTimeout(1200)
  const settled = await probe(page)
  record(
    'reduced motion navigates with no fade at all',
    during.opacity === 1 && settled.opacity === 1 && during.mode === 'reduced',
    `mode ${during.mode}, opacity during ${during.opacity}, settled ${settled.opacity}`,
  )
  await context.close()
}

await harness.finish()
