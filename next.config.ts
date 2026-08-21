import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /*
    Verification builds go to their own directory so a production build can be
    measured while the dev server is still running out of .next. Unset in normal
    use, so the default is untouched.
  */
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    // GSAP and Motion both ship deep module trees. Optimising the imports keeps
    // the Reduced tier bundle inside the 250kb budget in section 11.
    optimizePackageImports: ['gsap', 'motion', 'lucide-react'],
  },
  eslint: {
    dirs: ['app', 'components', 'content', 'lib', 'scripts'],
  },
}

/*
  MDX, for the legal documents only.

  `pageExtensions` is deliberately not widened to include `.mdx`, because no route is an MDX
  file. Every route stays a `page.tsx` and imports its copy from `content/legal`, so the
  layout lives in one component and the operator edits prose rather than a page. See ADR 0021.

  No remark or rehype plugins. The documents are headings, paragraphs and lists, and a plugin
  chain is a dependency and a build cost for formatting nobody has asked for.
*/
const withMDX = createMDX({})

export default withMDX(nextConfig)
