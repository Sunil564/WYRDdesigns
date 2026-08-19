import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { instrumentSerif, satoshi } from '@/lib/fonts'
import { SITE_URL } from '@/lib/site-url'
import { defaultMeta, site } from '@/content/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultMeta.title,
    template: `%s, ${site.name}`,
  },
  description: defaultMeta.description,
  applicationName: site.name,
  icons: {
    icon: [
      { url: '/brand/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/icon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/brand/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#08080A',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${satoshi.variable} ${instrumentSerif.variable}`}>
      <body>
        {children}
        <div className="grain" aria-hidden="true" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
