/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vantage/ui', '@vantage/types', '@vantage/utils'],
  
  // Turbopack configuration
  turbopack: {
    root: '../../',
  },
  
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
  
  // Metadata base for social images
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
}

module.exports = nextConfig
