import type { Metadata } from 'next'
import { LegalPage } from '@/components/sections/LegalPage'
import Terms from '@/content/legal/terms.mdx'
import { legal } from '@/content/legal/legal'

/**
 * `/terms`. See `app/privacy/page.tsx`: same shape, same reason for existing before its copy
 * does. The prose is `content/legal/terms.mdx`.
 */
export const metadata: Metadata = {
  title: legal.terms.title,
  description: legal.terms.description,
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage title={legal.terms.title} pending>
      <Terms />
    </LegalPage>
  )
}
