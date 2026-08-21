import type { Metadata } from 'next'
import { LegalPage } from '@/components/sections/LegalPage'
import Privacy from '@/content/legal/privacy.mdx'
import { legal } from '@/content/legal/legal'

/**
 * `/privacy`.
 *
 * Built before the copy exists, deliberately. The footer has linked here from every page
 * since Phase 4 and the route returned 404, which is the only place on the site where a
 * visible link was known to fail. See docs/BLOCKERS.md item 14.
 *
 * The prose is `content/legal/privacy.mdx`. Supplying the real policy is a change to that
 * file and to the `pending` flag below, and nothing else.
 */
export const metadata: Metadata = {
  title: legal.privacy.title,
  description: legal.privacy.description,
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPage title={legal.privacy.title} pending>
      <Privacy />
    </LegalPage>
  )
}
