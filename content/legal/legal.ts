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
 *
 * The privacy holding text names the two analytics products the site runs, because that is
 * verifiable from `app/layout.tsx`, and says nothing about what they collect. An earlier
 * version claimed they use no cookies and build no profile. That is a claim about a third
 * party's behaviour, made on a privacy page, which is the one place a sentence has to be
 * right, and nothing in this repository can verify it. It waits for the real policy and a
 * check against Vercel's current documentation.
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
