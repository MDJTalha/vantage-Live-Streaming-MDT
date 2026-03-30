import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
  // Basic Metadata
  title: {
    default: 'VANTAGE Executive - Enterprise Meeting Platform for Leadership Teams',
    template: '%s | VANTAGE Executive',
  },
  description: 'Secure, intelligent meeting infrastructure built for boards, executives, and global leadership teams. SOC 2 compliant, 99.99% uptime, enterprise-grade security.',
  keywords: [
    'executive meetings',
    'board meetings',
    'enterprise video conferencing',
    'secure meetings',
    'leadership collaboration',
    'boardroom technology',
    'executive communication',
    'enterprise streaming',
    'SOC 2 compliant',
    'GDPR compliant',
  ],
  authors: [{ name: 'VANTAGE Executive Team' }],
  creator: 'VANTAGE Executive',
  publisher: 'VANTAGE Executive',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Open Graph Metadata
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vantage.live',
    siteName: 'VANTAGE Executive',
    title: 'VANTAGE Executive - Where Important Meetings Happen',
    description: 'Secure, intelligent meeting infrastructure for boards, executives, and global leadership teams.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VANTAGE Executive - Enterprise Meeting Platform',
      },
    ],
  },

  // Twitter Card Metadata
  twitter: {
    card: 'summary_large_image',
    title: 'VANTAGE Executive - Enterprise Meeting Platform',
    description: 'Secure, intelligent meeting infrastructure for leadership teams',
    images: ['/twitter-image.png'],
    creator: '@vantage_exec',
  },

  // Additional Metadata
  alternates: {
    canonical: 'https://vantage.live',
  },

  // Verification
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },

  // Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },

  // Manifest
  manifest: '/manifest.json',

  // Structured Data (JSON-LD)
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'VANTAGE Executive',
      'applicationCategory': 'BusinessApplication',
      'operatingSystem': 'Web-based',
      'offers': {
        '@type': 'Offer',
        'price': 'Contact for pricing',
        'priceCurrency': 'USD',
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'ratingCount': '500+',
        'bestRating': '5',
        'worstRating': '1',
      },
      'featureList': [
        'End-to-End Encryption',
        'SOC 2 Type II Compliant',
        'GDPR Compliant',
        'AI Meeting Intelligence',
        '4K Video Support',
        'Global Infrastructure',
        '99.99% Uptime SLA',
        'Board-Level Privacy',
      ],
      'description': 'Secure, intelligent meeting infrastructure built for boards, executives, and global leadership teams.',
      'screenshot': '/screenshot.png',
      'downloadUrl': 'https://vantage.live/login',
      'releaseNotes': 'https://vantage.live/changelog',
    }),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://vantage.live" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://vantage.live" />
        
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              'name': 'VANTAGE Executive',
              'url': 'https://vantage.live',
              'logo': 'https://vantage.live/logo.png',
              'description': 'Enterprise meeting platform for leadership teams',
              'foundingDate': '2024',
              'founders': [
                {
                  '@type': 'Person',
                  'name': 'VANTAGE Team',
                },
              ],
              'contactPoint': {
                '@type': 'ContactPoint',
                'contactType': 'customer service',
                'email': 'support@vantage.live',
              },
              'sameAs': [
                'https://twitter.com/vantage_exec',
                'https://linkedin.com/company/vantage-executive',
              ],
            }),
          }}
        />
        
        {/* Structured Data for Product */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              'name': 'VANTAGE Executive',
              'description': 'Secure, intelligent meeting infrastructure for boards and executives',
              'brand': {
                '@type': 'Brand',
                'name': 'VANTAGE Executive',
              },
              'offers': {
                '@type': 'Offer',
                'availability': 'https://schema.org/InStock',
                'priceCurrency': 'USD',
                'price': 'Contact for pricing',
              },
              'aggregateRating': {
                '@type': 'AggregateRating',
                'ratingValue': '4.9',
                'reviewCount': '500+',
              },
              'featureList': [
                'End-to-End Encryption',
                'SOC 2 Type II Compliant',
                'AI Meeting Intelligence',
                '4K Video Support',
              ],
              'screenshot': '/screenshot.png',
            }),
          }}
        />
      </head>
      <body className={`${inter.className} bg-[#020617] text-white antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        
        {/* Structured Data for WebPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              'name': 'VANTAGE Executive - Enterprise Meeting Platform',
              'description': 'Secure, intelligent meeting infrastructure for leadership teams',
              'publisher': {
                '@type': 'Organization',
                'name': 'VANTAGE Executive',
                'logo': {
                  '@type': 'ImageObject',
                  'url': 'https://vantage.live/logo.png',
                },
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
