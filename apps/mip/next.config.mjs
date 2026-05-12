import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/icons-material', '@abc-transitionbascarbone/survey'],
  reactCompiler: {
    compilationMode: 'annotation',
  },
}

export default withNextIntl(nextConfig)
