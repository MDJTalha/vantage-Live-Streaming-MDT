'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@vantage/ui';
import { Video, Home, Search, MessageCircle } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-8 animate-fade-in-up">
        {/* Aurora Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-[180px] opacity-40" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-[200px] opacity-30" />
        </div>

        {/* Error Code */}
        <div className="relative">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            404
          </h1>
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-full" />
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Page Not Found
          </h2>
          <p className="text-lg text-foreground-secondary max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-primary to-accent hover:shadow-xl hover:shadow-primary/30"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Home
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-12 border-t border-white/10">
          <p className="text-sm text-foreground-muted mb-6">Or explore these resources</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="#platform"
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-1"
            >
              <Video className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold">Platform</p>
              <p className="text-xs text-foreground-muted">Explore features</p>
            </a>
            <a
              href="#resources"
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-1"
            >
              <Search className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold">Resources</p>
              <p className="text-xs text-foreground-muted">Blog & guides</p>
            </a>
            <a
              href="#faq"
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-1"
            >
              <MessageCircle className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold">Help</p>
              <p className="text-xs text-foreground-muted">FAQs & support</p>
            </a>
          </div>
        </div>

        {/* Contact Support */}
        <div className="pt-8">
          <p className="text-sm text-foreground-muted">
            Still need help?{' '}
            <a href="mailto:support@vantage.live" className="text-primary hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
