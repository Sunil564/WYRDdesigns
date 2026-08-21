/**
 * Labels and holding copy for the two legal routes.
 *
 * The documents themselves live in `privacy.mdx` and `terms.mdx` beside this file. Both are
 * holding text today and say so on the page, because a privacy policy and terms of service
 * are statements about how a real company handles real data and real contracts, and writing
 * them from nothing is the same failure as inventing a client name.
 *
 * There is no "last updated" date on either page. A date would be a fact about a document
 * that does not exist yet. It arrives with the text.
 */

export const legal = {
  /** Shown on both routes while the document is holding text rather than the real thing. */
  pendingLabel: 'Not yet published',
  privacy: {
    title: 'Privacy',
    description:
      'How WYRD Designs handles the information you send us. The full policy is being prepared.',
  },
  terms: {
    title: 'Terms',
    description:
      'The terms covering work with WYRD Designs. The full document is being prepared.',
  },
} as const
