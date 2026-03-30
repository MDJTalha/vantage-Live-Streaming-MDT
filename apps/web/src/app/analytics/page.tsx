'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@vantage/ui';
import { BarChart3, ArrowLeft, Video } from 'lucide-react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f1f] to-[#020617] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Video className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">VANTAGE Executive</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto">
              <BarChart3 className="h-10 w-10 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold">Analytics & Insights</h1>
            <p className="text-foreground-secondary">
              Track your meeting performance and engagement metrics
            </p>
          </div>

          {/* Analytics Dashboard component (replaces static placeholders) */}
          <AnalyticsDashboard />
        </div>
      </main>
    </div>
  );
}
