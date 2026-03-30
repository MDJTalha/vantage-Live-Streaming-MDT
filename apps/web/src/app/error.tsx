'use client';

import { useEffect, useState } from 'react';
import { Button } from '@vantage/ui';
import { Video, RefreshCcw, Home, Mail } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Log error to error reporting service
    console.error('Error caught by error page:', error);
  }, [error]);

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-8 animate-fade-in-up">
        {/* Aurora Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-destructive/20 to-transparent rounded-full blur-[180px] opacity-40" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-[200px] opacity-30" />
        </div>

        {/* Error Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
            <Video className="h-12 w-12 text-destructive" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            Something Went Wrong
          </h1>
          <p className="text-lg text-foreground-secondary max-w-md mx-auto">
            We're sorry for the inconvenience. Our team has been notified and we're working to fix it.
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-left">
            <p className="text-sm font-mono text-destructive">
              {error.message || 'Unknown error'}
            </p>
            {error.digest && (
              <p className="text-xs text-destructive/70 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button
            variant="primary"
            size="lg"
            onClick={reset}
            className="bg-gradient-to-r from-primary to-accent hover:shadow-xl hover:shadow-primary/30"
          >
            <RefreshCcw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.location.href = '/'}
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Contact Support */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-sm text-foreground-muted mb-4">
            Still experiencing issues?
          </p>
          <a
            href="mailto:support@vantage.live"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <Mail className="h-4 w-4" />
            Contact Support
          </a>
        </div>

        {/* Status Page Link */}
        <div className="pt-4">
          <p className="text-xs text-foreground-muted">
            Check our{' '}
            <a href="#" className="text-primary hover:underline">
              status page
            </a>{' '}
            for system status
          </p>
        </div>
      </div>
    </main>
  );
}
