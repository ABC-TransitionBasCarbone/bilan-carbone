import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const bucketName = process.env.SCW_BUCKET_NAME
const region = process.env.SCW_REGION
const scalewayUrl = `${bucketName}.s3.${region}.scw.cloud`

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', // TODO: Uncomment this if we meed to reduce the app size and add heavy node_modules packages to .slugignore
  turbopack: {
    resolveAlias: {
      underscore: 'lodash',
      // NOTE: while the package is not published to npm, we use a local path
      '@abc-transitionbascarbone/publicodes-count': './publicodes-packages/publicodes-count/',
      // '@publicodes/forms': '../../publicodes/publicodes/packages/forms/src/',
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  images: {
    remotePatterns: [{ hostname: scalewayUrl }],
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
  transpilePackages: ['mui-color-input', '@abc-transitionbascarbone/publicodes-count', '@publicodes/forms'],
  reactStrictMode: true,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
    },
  ],
}

export default withNextIntl(nextConfig)
