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

export default nextConfig
