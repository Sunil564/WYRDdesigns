/**
 * The contact form's field names and state shape. No validator, and no Zod.
 *
 * Split out of `lib/contact-schema.ts` for one reason, measured rather than assumed: the
 * client form needs the field names and the idle state, the schema module imports Zod, and
 * importing one pulled the other into the browser bundle. Full tier went from 464.9kb to
 * 484.1kb against a 500kb ceiling on the commit that added this route, which is 97 percent of
 * the budget for a library the client never runs.
 *
 * So the constants live here, the validator lives next door and imports these, and the client
 * imports only this file. Zod stays on the server where it does the work.
 */

/** Field names shared by the form and the action, so neither can drift from the other. */
export const FIELD = {
  name: 'name',
  company: 'company',
  email: 'email',
  needs: 'needs',
  timeline: 'timeline',
  budget: 'budget',
  message: 'message',
  /** Honeypot. Must arrive empty. */
  trap: 'website',
  /** Milliseconds since epoch, stamped when the form mounts. */
  startedAt: 'startedAt',
} as const

/**
 * How long a form must be open before a submission is believable, in milliseconds.
 *
 * Paired with the honeypot rather than replacing it: a bot that clears the trap still has to
 * wait, and a bot that waits still has to leave the trap alone. Two and a half seconds is
 * below the time it takes a person to fill four fields and above the time it takes a script
 * to post one.
 */
export const MIN_ELAPSED_MS = 2500

/** The text fields, echoed back so a failed submit can refill the form. */
export type ContactValues = {
  name: string
  company: string
  email: string
  message: string
}

/** Every field the form carries, which is also what the validator parses. */
export type ContactFieldName =
  | 'name'
  | 'company'
  | 'email'
  | 'needs'
  | 'timeline'
  | 'budget'
  | 'message'

/** What the action hands back to the form. Serializable throughout. */
export type ContactState = {
  status: 'idle' | 'success' | 'error'
  /** Inline messages, keyed by field name. */
  fieldErrors: Partial<Record<ContactFieldName, string>>
  /** One human sentence for anything that is not a single field's fault. */
  formError: string | null
  /**
   * What the visitor typed, returned on failure only.
   *
   * The first version of this deliberately did not carry values back, on the reasoning that
   * an uncontrolled form keeps its own DOM state. That is wrong under React 19: a form action
   * resets the form when it completes, so every failed submit emptied all four fields. Three
   * harness criteria failed on it. The values come back and seed `defaultValue`, which is
   * what makes "entered values retained" true rather than assumed.
   */
  values: ContactValues | null
}

export const EMPTY_VALUES: ContactValues = { name: '', company: '', email: '', message: '' }

export const IDLE_STATE: ContactState = {
  status: 'idle',
  fieldErrors: {},
  formError: null,
  values: null,
}
