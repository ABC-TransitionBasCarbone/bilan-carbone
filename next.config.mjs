import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const bucketName = process.env.SCW_BUCKET_NAME
const region = process.env.SCW_REGION
const scalewayUrl = `${bucketName}.s3.${region}.scw.cloud`

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: { underscore: 'lodash' },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  images: {
    remotePatterns: [{ hostname: scalewayUrl }],
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
  reactStrictMode: true,
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
      ],
    },
  ],
}

export default withNextIntl(nextConfig)
