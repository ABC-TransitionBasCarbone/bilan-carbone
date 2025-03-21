import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const bucketName = process.env.SCW_BUCKET_NAME
const region = process.env.SCW_REGION
const scalewayUrl = `${bucketName}.s3.${region}.scw.cloud`

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: scalewayUrl }],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
}

export default withNextIntl(nextConfig)
