/**
 * Copy and options for the `/contact` route. Brief section 6.5.
 *
 * Two things here need their sourcing stated, because both put numbers on the site and this
 * route carries more numbers than any other.
 *
 * **The INR brackets.** `docs/brand.md` section 5 states a deal size of Rs 25k to Rs 5L, so
 * both endpoints are that verified range and only the interior boundary is structure. These
 * are not prices. CLAUDE.md bans a price, meaning what the studio charges, and this asks the
 * visitor what they have to spend, which the brief specifies twice and is a qualifier on an
 * enquiry rather than a rate card.
 *
 * **The USD brackets.** No USD figure appears in `docs/brand.md`, and converting the rupee
 * range would mean inventing an exchange rate and baking today's rate into the repository.
 * So these are independent round numbers for the secondary market rather than conversions,
 * and they are the one set of figures on this route with no document behind them. Flagged
 * for the operator rather than presented as sourced.
 *
 * Timeline and cluster options are the brief's wording verbatim.
 */

export type Currency = 'INR' | 'USD'

export const contactPage = {
  eyebrow: 'Contact',
  headline: 'Tell us what you are making.',
  lead: 'One email, one form, one studio. You will talk to the people doing the work.',
  details: {
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    locationLabel: 'Where we are',
    socialLabel: 'Elsewhere',
  },
  form: {
    legend: 'Project enquiry',
    name: { label: 'Name', placeholder: 'Your name' },
    company: { label: 'Company', placeholder: 'Optional' },
    email: { label: 'Email', placeholder: 'you@company.com' },
    needs: {
      label: 'What do you need',
      hint: 'Pick as many as apply.',
    },
    timeline: { label: 'Timeline' },
    budget: {
      label: 'Budget',
      hint: 'Optional. It helps us tell you quickly whether we are a fit.',
      toggleLabel: 'Currency',
    },
    message: { label: 'Message', placeholder: 'What are you making, and what does it need?' },
    /**
     * The honeypot. Labelled and named like a real field so a bot fills it, hidden from
     * people and from assistive technology so nobody else ever sees it.
     */
    trap: { label: 'Website', name: 'website' },
    submit: 'Send enquiry',
    submitting: 'Sending',
    required: 'Required',
  },
  success: {
    heading: 'Sent.',
    body: 'We read everything that comes in and reply from a real address. If it is urgent, the phone numbers on the left are the fastest route.',
  },
  errors: {
    /** Human wording, no codes. The entered values are never cleared. */
    generic: 'Something went wrong sending that. Nothing was lost, try again.',
    /**
     * What a visitor sees when the mail service is not configured. It says the message was
     * not sent, because it was not, and it offers the address that does work.
     */
    unconfigured:
      'The form cannot send right now. Your message has not gone through. Email us directly and it will reach the same place.',
    name: 'Tell us what to call you.',
    email: 'We need an email address that works, or we cannot reply.',
    message: 'Tell us a little about the project.',
    tooFast: 'That submitted faster than a person can type. Try again.',
  },
  meta: {
    title: 'Contact',
    description:
      'Start a project with WYRD Designs. Tell us what you are making and we will reply from a real address. Bangalore, India.',
  },
} as const

/** The four clusters plus direction and an honest opt out. Brief 6.5, verbatim. */
export const needOptions = [
  { value: 'build', label: 'Build' },
  { value: 'reach', label: 'Reach' },
  { value: 'show', label: 'Show' },
  { value: 'stage', label: 'Stage' },
  { value: 'direction', label: 'Direction' },
  { value: 'unsure', label: 'Not sure yet' },
] as const

/** Brief 6.5, verbatim. The empty value is the unanswered state, not an option. */
export const timelineOptions = [
  { value: '', label: 'Select a timeline' },
  { value: 'under-4-weeks', label: 'Under 4 weeks' },
  { value: '1-to-3-months', label: '1 to 3 months' },
  { value: '3-months-plus', label: '3 months plus' },
  { value: 'exploring', label: 'Exploring' },
] as const

export const budgetOptions: Record<Currency, ReadonlyArray<{ value: string; label: string }>> = {
  INR: [
    { value: '', label: 'Prefer not to say' },
    { value: 'inr-under-25k', label: 'Under Rs 25,000' },
    { value: 'inr-25k-1l', label: 'Rs 25,000 to Rs 1,00,000' },
    { value: 'inr-1l-5l', label: 'Rs 1,00,000 to Rs 5,00,000' },
    { value: 'inr-5l-plus', label: 'Above Rs 5,00,000' },
  ],
  USD: [
    { value: '', label: 'Prefer not to say' },
    { value: 'usd-under-1k', label: 'Under $1,000' },
    { value: 'usd-1k-5k', label: '$1,000 to $5,000' },
    { value: 'usd-5k-25k', label: '$5,000 to $25,000' },
    { value: 'usd-25k-plus', label: 'Above $25,000' },
  ],
}

export const currencies: ReadonlyArray<Currency> = ['INR', 'USD']
