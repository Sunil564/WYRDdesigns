import localFont from 'next/font/local'

/**
 * Both faces are self hosted from public/fonts. No CDN request, no FOUT.
 *
 * Satoshi is served as the official unmodified variable woff2. The ITF Free
 * Font License permits self hosting and forbids subsetting or format
 * conversion, so next/font/local points at the file as shipped. See
 * docs/decisions/0011.
 */
export const satoshi = localFont({
  src: [
    {
      path: '../public/fonts/Satoshi-Variable.woff2',
      weight: '300 900',
      style: 'normal',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
  preload: true,
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
})

/**
 * Instrument Serif, italic only, latin only. Used for manifesto lines and pull
 * quotes, never for UI or body copy. SIL Open Font License.
 */
export const instrumentSerif = localFont({
  src: [
    {
      path: '../public/fonts/InstrumentSerif-Italic-latin.woff2',
      weight: '400',
      style: 'italic',
    },
  ],
  variable: '--font-instrument-serif',
  display: 'swap',
  preload: true,
  fallback: ['ui-serif', 'Georgia', 'Times New Roman', 'serif'],
})
