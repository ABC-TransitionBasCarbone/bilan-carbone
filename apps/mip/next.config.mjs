import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // we use the standalone output to be able to reduce bundle size by copying only the necessary assets in the standalone folder (see copy-assets.js)
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/icons-material', '@abc-transitionbascarbone/survey'],
  reactCompiler: {
    compilationMode: 'annotation',
  },
}

export default withNextIntl(nextConfig)
