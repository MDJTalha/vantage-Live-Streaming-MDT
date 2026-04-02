/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vantage/ui', '@vantage/types', '@vantage/utils'],

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
}

module.exports = nextConfig
