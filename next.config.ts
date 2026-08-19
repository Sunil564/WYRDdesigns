import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
