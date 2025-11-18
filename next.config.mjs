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

      // On dev mode, we use the source code of publicodes-count
      // to allow easier debugging. In prod mode, the build version is used.
      ...(process.env.NODE_ENV === 'development'
        ? {
            '@abc-transitionbascarbone/publicodes-count': './publicodes-packages/publicodes-count/',
          }
        : {}),
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  images: {
    remotePatterns: [{ hostname: scalewayUrl }],
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
  transpilePackages: ['mui-color-input', '@abc-transitionbascarbone/publicodes-count'],
  reactStrictMode: true,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
    },
  ],
}

export default withNextIntl(nextConfig)
