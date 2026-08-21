import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { SiteMotion } from '@/components/motion/SiteMotion'
import { instrumentSerif, satoshi } from '@/lib/fonts'
import { SITE_URL } from '@/lib/site-url'
import { organizationGraph } from '@/lib/structured-data'
import { THEME_COLOR_BG } from '@/lib/theme'
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
      { url: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/brand/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  /*
    The share card. `wyrd-og.png` had existed since Phase 0 at 1200 by 400 and nothing
    referenced it, so every link to this site shared with no image at all. It is now 1200 by
    630, which is the ratio every card reader crops to; at 3:1 it letterboxed in a feed.

    No title, description or url is set here on purpose. Next fills all three from the
    resolved document metadata, so every route shares its own title and its own copy rather
    than the homepage's. Writing them here explicitly was the first version and it made
    /studio and every project page announce themselves as the homepage.

    Only the image is stated, because there is one: the studio's mark, on every route. When
    there is real project imagery, per route cards become worth revisiting.

    `metadataBase` resolves every relative URL here, and it comes from SITE_URL, which is
    the only place an origin is defined. Nothing below hardcodes one. ADR 0005.
  */
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: 'en_IN',
    images: [
      {
        url: '/brand/wyrd-og.png',
        width: 1200,
        height: 630,
        alt: `${site.name}, ${site.tagline}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/brand/wyrd-og.png'],
  },
}

export const viewport: Viewport = {
  themeColor: THEME_COLOR_BG,
  /*
    Light, because the site is. This read `dark` from the initial build and survived Phase
    4b, which turned the canvas white and correctly moved THEME_COLOR_BG with it but left
    this behind. It is not cosmetic: `color-scheme` is what the browser renders form
    controls, scrollbars and the pre-paint canvas from, so a white page was declaring dark
    chrome to every one of them.
  */
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${satoshi.variable} ${instrumentSerif.variable}`}>
      <head>
        {/*
          Entrances are flipped on by an IntersectionObserver. With JavaScript off
          nothing would flip, so the content is shown in its final state instead of
          staying invisible. One rule, no runtime cost.
        */}
        <noscript>
          <style>{`[data-reveal],[data-enter]{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        {/*
          JSON-LD for the studio. In the document rather than injected, so it is in the
          served HTML for a crawler that runs no JavaScript. `lib/structured-data.ts` says
          what is in it and, at more length, what is deliberately not.
        */}
        <script
          type="application/ld+json"
          // The content is ours, built from content/site.ts, with no user input anywhere
          // in it. JSON.stringify is the serialiser, not a sanitiser.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationGraph()) }}
        />
      </head>
      <body>
        <SiteMotion>
          <Header />
          <div id="content">{children}</div>
          <Footer />
        </SiteMotion>
        <div className="grain" aria-hidden="true" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
