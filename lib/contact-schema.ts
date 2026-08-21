import { z } from 'zod'
import { budgetOptions, needOptions, timelineOptions } from '@/content/contact'

/**
 * The contact form's shape, validated on the server. Brief section 6.5.
 *
 * Every option list is derived from `content/contact.ts` rather than retyped here, so a
 * select and its validator cannot disagree. A copied list is a second source of truth that
 * goes stale silently.
 *
 * The client does no validation of its own beyond what the browser gives for free. There is
 * exactly one validator and it runs where it cannot be skipped.
 *
 * Field names and the state shape live in `lib/contact-fields.ts`, which imports nothing.
 * This module is server only because Zod is, and the client must never reach it.
 */

const values = <T extends ReadonlyArray<{ value: string }>>(options: T) =>
  options.map((option) => option.value)

/** Optional selects accept the empty string, which is the unanswered state. */
const optionalChoice = (allowed: string[]) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || allowed.includes(value), {
      message: 'Choose one of the listed options.',
    })

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().max(160).optional().default(''),
  /*
    Zod's email check, not a regular expression of ours. Address grammar is deep enough that
    a handwritten pattern rejects real addresses, and the delivery attempt is the real test
    anyway.
  */
  email: z.string().trim().min(1).max(200).pipe(z.email()),
  needs: z.array(z.enum(values(needOptions) as [string, ...string[]])).max(needOptions.length),
  timeline: optionalChoice(values(timelineOptions)),
  budget: optionalChoice(values(budgetOptions)),
  message: z.string().trim().min(1).max(4000),
})

export type ContactInput = z.infer<typeof contactSchema>

export type {
  ContactState,
  ContactValues,
} from '@/lib/contact-fields'
