import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: {
    compilationMode: 'annotation',
  },
  output: 'standalone', // we use the standalone output to be able to reduce bundle size by copying only the necessary assets in the standalone folder (see copy-assets.js)
  turbopack: {
    resolveAlias: {
      '@abc-transitionbascarbone/publicodes-mip': '../../packages/publicodes-packages/publicodes-mip/',
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  transpilePackages: ['mui-color-input', '@abc-transitionbascarbone/publicodes-mip'],
  reactStrictMode: true,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
    },
  ],
}

export default withNextIntl(nextConfig)
