import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const bucketName = process.env.SCW_BUCKET_NAME
const region = process.env.SCW_REGION
const scalewayUrl = `${bucketName}.s3.${region}.scw.cloud`

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', // TODO: Uncomment this if we meed to reduce the app size and add heavy node_modules packages to .slugignore
  turbopack: {
    resolveAlias: { underscore: 'lodash' },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  images: {
    remotePatterns: [{ hostname: scalewayUrl }],
  },
  // cacheComponents: true, // Next 16 feature disabled for now - requires architectural changes to withAuth HOC
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
    turbopackFileSystemCacheForDev: true,
  },
  transpilePackages: ['mui-color-input'],
  reactStrictMode: true,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
    },
  ],
}

export default withNextIntl(nextConfig)
