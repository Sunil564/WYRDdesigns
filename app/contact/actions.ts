'use server'

import { Resend } from 'resend'
import { contactPage } from '@/content/contact'
import { site } from '@/content/site'
import {
  FIELD,
  IDLE_STATE,
  MIN_ELAPSED_MS,
  type ContactState,
  type ContactValues,
} from '@/lib/contact-fields'
import { contactSchema, type ContactInput } from '@/lib/contact-schema'

/**
 * The contact form's server action. Brief section 6.5.
 *
 * Validation is Zod, on the server, and there is no second validator on the client that
 * could disagree with it. Delivery is Resend, to the address in `content/site.ts`. There is
 * no third party embedded form anywhere near this.
 *
 * **Without `RESEND_API_KEY` this fails visibly and says so.** It never reports success it
 * did not achieve. That is the single most important line in the file: a contact form that
 * silently swallows an enquiry is worse than one that is obviously broken, because the
 * studio never learns that the message existed. The visitor gets a sentence saying the
 * message did not go through and the email address that does work, and the server logs a
 * loud line naming the missing variable. See `docs/BLOCKERS.md`.
 */

/**
 * The text a visitor typed, echoed back on every failure.
 *
 * React 19 resets an uncontrolled form once its action completes, so without this a failed
 * submit empties the form and the visitor retypes everything. Read straight from FormData
 * rather than from the parsed result, because the parse is exactly what fails on the paths
 * that need this most.
 */
function valuesFrom(formData: FormData): ContactValues {
  return {
    name: String(formData.get(FIELD.name) ?? ''),
    company: String(formData.get(FIELD.company) ?? ''),
    email: String(formData.get(FIELD.email) ?? ''),
    message: String(formData.get(FIELD.message) ?? ''),
  }
}

/** Read at call time, not at module load, so the deployed value is the one that is used. */
function resendKey(): string | undefined {
  const key = process.env.RESEND_API_KEY?.trim()
  return key && key.length > 0 ? key : undefined
}

function subjectFor(input: ContactInput): string {
  const from = input.company.length > 0 ? `${input.name}, ${input.company}` : input.name
  return `Enquiry from ${from}`
}

/** Plain text, because this goes to a person and not to a template. */
function bodyFor(input: ContactInput): string {
  const lines = [
    `Name: ${input.name}`,
    input.company.length > 0 ? `Company: ${input.company}` : null,
    `Email: ${input.email}`,
    input.needs.length > 0 ? `Needs: ${input.needs.join(', ')}` : null,
    input.timeline.length > 0 ? `Timeline: ${input.timeline}` : null,
    input.budget.length > 0 ? `Budget: ${input.budget}` : null,
    '',
    input.message,
  ]
  return lines.filter((line) => line !== null).join('\n')
}

export async function submitContact(
  _previous: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const values = valuesFrom(formData)

  /*
    Spam checks first, and both fail the same quiet way. A bot gets told nothing useful about
    which check caught it, and a person cannot trip the honeypot at all because the field is
    hidden from pointers, keyboards and assistive technology alike.
  */
  const trap = String(formData.get(FIELD.trap) ?? '').trim()
  if (trap.length > 0) {
    return { status: 'error', fieldErrors: {}, formError: contactPage.errors.generic, values }
  }

  const startedAt = Number(formData.get(FIELD.startedAt) ?? 0)
  const elapsed = Number.isFinite(startedAt) && startedAt > 0 ? Date.now() - startedAt : 0
  if (elapsed < MIN_ELAPSED_MS) {
    return { status: 'error', fieldErrors: {}, formError: contactPage.errors.tooFast, values }
  }

  const parsed = contactSchema.safeParse({
    name: formData.get(FIELD.name) ?? '',
    company: formData.get(FIELD.company) ?? '',
    email: formData.get(FIELD.email) ?? '',
    needs: formData.getAll(FIELD.needs).map(String),
    timeline: formData.get(FIELD.timeline) ?? '',
    budget: formData.get(FIELD.budget) ?? '',
    message: formData.get(FIELD.message) ?? '',
  })

  if (!parsed.success) {
    /*
      Our own wording, not Zod's. "String must contain at least 1 character(s)" is a
      developer's sentence, and the brief asks for human wording.
    */
    const fieldErrors: ContactState['fieldErrors'] = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (field === 'name' && !fieldErrors.name) fieldErrors.name = contactPage.errors.name
      if (field === 'email' && !fieldErrors.email) fieldErrors.email = contactPage.errors.email
      if (field === 'message' && !fieldErrors.message) {
        fieldErrors.message = contactPage.errors.message
      }
    }
    return {
      status: 'error',
      fieldErrors,
      formError: Object.keys(fieldErrors).length > 0 ? null : contactPage.errors.generic,
      values,
    }
  }

  const key = resendKey()
  if (!key) {
    /*
      Visible failure, never a silent success. The log names the variable so whoever is
      running this knows exactly what is missing rather than guessing from a red box.
    */
    console.error(
      '[contact] RESEND_API_KEY is not set, so nothing was delivered. The enquiry from ' +
        `${parsed.data.email} was received and dropped. Set the variable, see .env.example ` +
        'and docs/BLOCKERS.md item 9.',
    )
    return {
      status: 'error',
      fieldErrors: {},
      formError: contactPage.errors.unconfigured,
      values,
    }
  }

  try {
    const resend = new Resend(key)
    const { error } = await resend.emails.send({
      /*
        `onboarding@resend.dev` is Resend's own verified sender and works before a domain is
        verified, which cannot happen while the production domain is unregistered. It moves to
        the real domain with the same variable that unblocks BLOCKERS item 1.
      */
      from: 'WYRD Designs <onboarding@resend.dev>',
      to: [site.email],
      replyTo: parsed.data.email,
      subject: subjectFor(parsed.data),
      text: bodyFor(parsed.data),
    })

    if (error) {
      console.error('[contact] Resend refused the message:', error)
      return { status: 'error', fieldErrors: {}, formError: contactPage.errors.generic, values }
    }
  } catch (cause) {
    /*
      A thrown error here is the network being down or the SDK failing, and the visitor's
      message is gone either way. Say so rather than pretending.
    */
    console.error('[contact] delivery threw:', cause)
    return { status: 'error', fieldErrors: {}, formError: contactPage.errors.generic, values }
  }

  return { ...IDLE_STATE, status: 'success' }
}
