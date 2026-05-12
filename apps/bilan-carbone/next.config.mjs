import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const bucketName = process.env.SCW_BUCKET_NAME
const region = process.env.SCW_REGION
const scalewayUrl = `${bucketName}.s3.${region}.scw.cloud`

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: {
    compilationMode: 'annotation',
  },
  output: 'standalone', // we use the standalone output to be able to reduce bundle size by copying only the necessary assets in the standalone folder (see copy-assets.js)
  turbopack: {
    resolveAlias: {
      underscore: 'lodash',
      // NOTE: while the package is not published to npm, we use a local path
      '@abc-transitionbascarbone/publicodes-count': './publicodes-packages/publicodes-count/',
      '@abc-transitionbascarbone/publicodes-clickson': './publicodes-packages/publicodes-clickson/',
      '@abc-transitionbascarbone/publicodes-tilt': './publicodes-packages/publicodes-tilt/',
      // '@publicodes/forms': '../../publicodes/publicodes/packages/forms/src/',
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  images: {
    remotePatterns: [{ hostname: scalewayUrl }],
  },
  transpilePackages: [
    'mui-color-input',
    '@abc-transitionbascarbone/publicodes-count',
    '@abc-transitionbascarbone/publicodes-clickson',
    '@abc-transitionbascarbone/publicodes-tilt',
    '@publicodes/forms',
  ],
  reactStrictMode: true,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
    },
  ],
}

export default withNextIntl(nextConfig)
