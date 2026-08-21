/**
 * `/contact` route verification. Development only, run against a production build.
 *
 * The route level checks come from `scripts/route-checks.mjs`. What is here is the four
 * failure paths and the unconfigured case, which is most of the value: a contact form that
 * works on the happy path and loses a message on any other is worse than no form, because
 * the studio never learns the enquiry existed.
 *
 * Every failure is asserted on what the visitor sees and on what the form still holds, never
 * on internal state. "Retains entered values" means the characters are still in the input.
 *
 * Usage: bash scripts/verify-server.sh, then
 *   SHOOT_BASE=http://localhost:3100 node scripts/check-contact.mjs
 */

import { assertBuildFresh } from './build-fresh.mjs'
import { createHarness } from './route-checks.mjs'

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'

/*
  Refuse to measure a build older than the source. See scripts/build-fresh.mjs.
*/
assertBuildFresh({ base: BASE })

const ROUTE = '/contact'

/** Above MIN_ELAPSED_MS in lib/contact-schema.ts, so a legitimate submit is not rejected. */
const SETTLE_MS = 3000

const harness = createHarness({ base: BASE })
const { record, open } = harness
await harness.launch()

/** Fill the form the way a person would, leaving the honeypot alone. */
async function fillValidly(page, { email = 'someone@example.com', message = 'A real enquiry.' } = {}) {
  await page.fill('#name', 'Test Person')
  await page.fill('#company', 'Test Company')
  await page.fill('#email', email)
  await page.fill('#message', message)
}

async function stateOf(page) {
  return page.evaluate(() => {
    const form = document.querySelector('form[data-contact-state]')
    const success = document.querySelector('[data-contact-state="success"]')
    const error = document.querySelector('[data-contact-error]')
    const inlineErrors = Array.from(document.querySelectorAll('p[id$="-error"]')).map((node) =>
      (node.textContent ?? '').trim(),
    )
    return {
      formPresent: Boolean(form),
      successPresent: Boolean(success),
      formError: (error?.textContent ?? '').trim(),
      inlineErrors,
      values: {
        name: document.querySelector('#name')?.value ?? null,
        company: document.querySelector('#company')?.value ?? null,
        email: document.querySelector('#email')?.value ?? null,
        message: document.querySelector('#message')?.value ?? null,
      },
      submitLabel: (document.querySelector('[data-contact-submit]')?.textContent ?? '').trim(),
      submitDisabled: document.querySelector('[data-contact-submit]')?.disabled ?? null,
    }
  })
}

// ---------------------------------------------------------------- shared route checks
await harness.checkHead(ROUTE)
await harness.checkKeyboardAndTargets(ROUTE, { stops: 30 })
await harness.checkReducedMotion(ROUTE)
await harness.checkOverflow(ROUTE)

// ------------------------------------------------------------------- the idle state
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)

  const form = await page.evaluate(() => {
    const trap = document.querySelector('#website')
    const trapBox = trap?.getBoundingClientRect()
    return {
      requiredFields: Array.from(document.querySelectorAll('[required]')).map((node) => node.id),
      needsChips: document.querySelectorAll('fieldset [aria-pressed]').length,
      // Should be zero. The toggle was removed with the USD brackets, ADR 0028.
      currencyChips: document.querySelectorAll('[aria-label="Currency"] [aria-pressed]').length,
      budgetOptions: Array.from(document.querySelectorAll('#budget option')).map((node) =>
        (node.textContent ?? '').trim(),
      ),
      timelineOptions: Array.from(document.querySelectorAll('#timeline option')).length,
      trapPresent: Boolean(trap),
      trapVisible: Boolean(trapBox && trapBox.left > -1000 && trapBox.width > 4),
      trapTabbable: trap?.tabIndex !== -1,
      startedAt: document.querySelector('input[name="startedAt"]')?.value ?? null,
    }
  })

  record(
    'the required fields are name, email and message',
    ['name', 'email', 'message'].every((id) => form.requiredFields.includes(id)),
    `required: ${form.requiredFields.join(', ')}`,
  )
  record(
    'the multi select is real buttons with pressed state',
    form.needsChips >= 6,
    `${form.needsChips} need chips, ${form.timelineOptions} timeline options`,
  )
  /*
    Rupees, and no way to reach anything else. This asserted that the select defaulted to
    INR, which a currency toggle satisfied while still offering unsourced USD brackets one
    click away. It now asserts the toggle is gone as part of the same criterion, because
    "INR only" is the claim and the toggle was how that claim was escaped. ADR 0028.
  */
  record(
    'the budget select offers INR brackets only, with no currency toggle',
    form.budgetOptions.some((label) => label.includes('Rs')) &&
      !form.budgetOptions.some((label) => label.includes('$')) &&
      form.currencyChips === 0,
    `${form.currencyChips} currency chips, options: ${form.budgetOptions.join(' | ')}`,
  )
  record(
    'the honeypot exists, is off screen, and is not a tab stop',
    form.trapPresent && !form.trapVisible && !form.trapTabbable,
    `present ${form.trapPresent}, visible ${form.trapVisible}, tabbable ${form.trapTabbable}`,
  )
  record(
    'the timing stamp is set on mount rather than at build time',
    form.startedAt !== null && Number(form.startedAt) > 0,
    `startedAt ${form.startedAt}`,
  )
  await context.close()
}

// ------------------------------------------------------ failure path 1: invalid email
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(SETTLE_MS)
  await fillValidly(page, { email: 'not-an-email' })
  await page.click('[data-contact-submit]')
  await page.waitForTimeout(2500)
  const after = await stateOf(page)

  record(
    'failure path, invalid email: inline message, form still there, values retained',
    after.formPresent &&
      !after.successPresent &&
      after.inlineErrors.length > 0 &&
      after.values.email === 'not-an-email' &&
      after.values.name === 'Test Person' &&
      after.values.message === 'A real enquiry.',
    `inline: ${after.inlineErrors.join(' | ') || '(none)'}. ` +
      `Retained name "${after.values.name}", email "${after.values.email}", ` +
      `message "${after.values.message}"`,
  )
  await context.close()
}

// -------------------------------------------------- failure path 2: missing required field
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(SETTLE_MS)
  /* Everything but the message, which is required. */
  await page.fill('#name', 'Test Person')
  await page.fill('#email', 'someone@example.com')
  await page.click('[data-contact-submit]')
  await page.waitForTimeout(2500)
  const after = await stateOf(page)

  record(
    'failure path, missing required field: inline message, form still there, values retained',
    after.formPresent &&
      !after.successPresent &&
      after.inlineErrors.length > 0 &&
      after.values.name === 'Test Person' &&
      after.values.email === 'someone@example.com',
    `inline: ${after.inlineErrors.join(' | ') || '(none)'}. ` +
      `Retained name "${after.values.name}", email "${after.values.email}"`,
  )
  await context.close()
}

// ---------------------------------------------------- failure path 3: network failure
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(SETTLE_MS)
  await fillValidly(page)

  /*
    Kill the action request mid flight. This is the case where a form most often lies: the
    request never lands, nothing comes back, and a naive form either hangs on "Sending" for
    ever or flips to success on a rejected promise.
  */
  await page.route(`${BASE}${ROUTE}`, (route) =>
    route.request().method() === 'POST' ? route.abort('failed') : route.continue(),
  )
  await page.click('[data-contact-submit]')
  await page.waitForTimeout(4000)
  const after = await stateOf(page)
  await page.unroute(`${BASE}${ROUTE}`)

  record(
    'failure path, network failure mid submit: no false success, values retained',
    !after.successPresent &&
      after.formPresent &&
      after.values.name === 'Test Person' &&
      after.values.message === 'A real enquiry.',
    `success shown ${after.successPresent}, form present ${after.formPresent}, ` +
      `submit reads "${after.submitLabel}", disabled ${after.submitDisabled}, ` +
      `retained name "${after.values.name}"`,
  )
  await context.close()
}

// ------------------------------------------------------- failure path 4: double submit
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(SETTLE_MS)
  await fillValidly(page)

  /*
    Hold the first request open, so "mid flight" is genuinely mid flight.

    Without the hold the action finished before the second click landed, and the criterion
    passed on one POST while reporting the button as enabled, which is a true number beside a
    misleading sentence. Delaying the response makes both halves observable: the button is
    disabled while the request is out, and the second click therefore cannot send anything.
  */
  let posts = 0
  await page.route(`${BASE}${ROUTE}`, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    posts += 1
    await new Promise((resolve) => setTimeout(resolve, 2500))
    await route.continue()
  })

  await page.click('[data-contact-submit]')
  await page.waitForTimeout(400)
  const midFlight = await stateOf(page)
  /* Again, the way an impatient person double clicks. Forced, so a disabled button is proven
     by the request count rather than by Playwright refusing to click it. */
  await page.click('[data-contact-submit]', { force: true, timeout: 2000 }).catch(() => {})
  await page.waitForTimeout(5000)
  await page.unroute(`${BASE}${ROUTE}`)

  record(
    'failure path, double submit: the button disables in flight and only one request is sent',
    posts === 1 && midFlight.submitDisabled === true,
    `${posts} POST(s) to the action. Mid flight the button read "${midFlight.submitLabel}" ` +
      `and disabled was ${midFlight.submitDisabled}`,
  )
  await context.close()
}

// ------------------------------------- without a key, the form fails visibly and says so
{
  const { context, page, problems } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(SETTLE_MS)
  await fillValidly(page)
  await page.click('[data-contact-submit]')
  await page.waitForTimeout(5000)
  const after = await stateOf(page)

  /*
    The server under test has no RESEND_API_KEY, which is the state this repository ships in.
    So this is the real unconfigured path rather than a simulated one, and the assertion is
    that the visitor is told the message did not go through.
  */
  const saysNotSent = /has not gone through|cannot send/i.test(after.formError)
  record(
    'with RESEND_API_KEY absent the form fails visibly and never reports success',
    !after.successPresent && after.formPresent && after.formError.length > 0 && saysNotSent,
    `success shown ${after.successPresent}. Message: "${after.formError || '(none)'}"`,
  )
  record(
    'the unconfigured failure keeps the entered values and offers the direct address',
    after.values.name === 'Test Person' &&
      after.values.message === 'A real enquiry.' &&
      /email us directly/i.test(after.formError),
    `retained name "${after.values.name}", message "${after.values.message}"`,
  )
  /* Its own console line is expected here and is not a page problem. */
  const unexpected = problems.filter((problem) => !/RESEND_API_KEY/.test(problem))
  record(
    'the unconfigured path logs no page errors beyond its own warning',
    unexpected.length === 0,
    unexpected.join(' | '),
  )
  await context.close()
}

// ------------------------------------------------------------------------ fact audit
{
  const { context, page } = await open(1440, 900)
  await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'load' })
  await page.waitForTimeout(2000)
  const numbers = await page.evaluate(() => {
    const main = document.querySelector('main')
    const text = (main?.innerText ?? '').replace(/\s+/g, ' ')
    /* Select options are in the DOM whether or not they are the chosen one. */
    const options = Array.from(main?.querySelectorAll('option') ?? []).map(
      (node) => node.textContent ?? '',
    )
    const all = `${text} ${options.join(' ')}`
    return [...new Set([...all.matchAll(/\d[\d,]*/g)].map((match) => match[0]))]
  })

  /*
    The digit allowlist, the same mechanism /studio uses and the reason it is here: this route
    carries more numbers than any other, so reviewing them by eye is exactly where a stray
    figure would survive.

      91, 86603, 33165, 82176, 18082   the two phone numbers, docs/brand.md section 1
      4, 1, 3                          the timeline options, brief 6.5 verbatim
      25,000 / 1,00,000 / 5,00,000     INR brackets. 25,000 and 5,00,000 are the deal size
                                       range in docs/brand.md section 5. 1,00,000 is an
                                       interior boundary and is structure
      1,000 / 5,000 / 25,000           USD brackets. Round numbers for the secondary market,
                                       not conversions. The one unsourced set on the route
  */
  const allowed = new Set([
    '91', '86603', '33165', '82176', '18082',
    '4', '1', '3',
    '25,000', '1,00,000', '5,00,000',
    '1,000', '5,000',
  ])
  const unexplained = numbers.filter((value) => !allowed.has(value))
  record(
    'every number on the route traces to a source or to a listed form option',
    unexplained.length === 0,
    unexplained.length
      ? `unexplained: ${unexplained.join(', ')}`
      : `digits found: ${numbers.join(', ')}`,
  )
  await context.close()
}

await harness.finish()
