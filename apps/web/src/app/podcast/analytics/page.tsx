'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, BarChart3, TrendingUp, Users, Play, Clock, Calendar,
  Download, ArrowUpRight, ArrowDownRight, Globe, Headphones
} from 'lucide-react';

export default function PodcastAnalyticsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Demo analytics data
  const analytics = {
    totalPlays: 12453,
    playsChange: 12.5,
    totalListeners: 8234,
    listenersChange: 8.3,
    avgListenDuration: '32:15',
    durationChange: -2.1,
    totalDownloads: 5621,
    downloadsChange: 15.7,
    episodes: 5,
    totalHours: 4.5,
    topEpisodes: [
      { id: '4', title: 'Episode 4: The Future of AI in Business', plays: 2156, trend: 'up' },
      { id: '1', title: 'Episode 1: Introduction to VANTAGE', plays: 1834, trend: 'up' },
      { id: '2', title: 'Episode 2: Deep Dive into Live Streaming', plays: 1523, trend: 'down' },
      { id: '5', title: 'Episode 5: Remote Work Best Practices', plays: 1256, trend: 'up' },
      { id: '3', title: 'Episode 3: Executive Communication Tips', plays: 987, trend: 'up' }
    ],
    listenerDemographics: [
      { region: 'North America', percentage: 45, listeners: 3705 },
      { region: 'Europe', percentage: 30, listeners: 2470 },
      { region: 'Asia', percentage: 15, listeners: 1235 },
      { region: 'Other', percentage: 10, listeners: 824 }
    ],
    platforms: [
      { name: 'Spotify', percentage: 35, icon: '🎧' },
      { name: 'Apple Podcasts', percentage: 28, icon: '📱' },
      { name: 'YouTube', percentage: 22, icon: '📺' },
      { name: 'Direct', percentage: 15, icon: '🌐' }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/podcast')}
                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-md transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-medium text-slate-300">Podcast Analytics</h1>
                  <p className="text-xs text-slate-600">Performance insights</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                className="appearance-none px-4 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-300 focus:outline-none focus:border-purple-500/50 transition-all cursor-pointer"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <button className="px-4 py-1.5 text-xs font-medium rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-all flex items-center gap-1.5">
                <Download className="h-3 w-3" />
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Plays"
            value={analytics.totalPlays.toLocaleString()}
            change={analytics.playsChange}
            icon={<Play className="h-4 w-4" />}
          />
          <MetricCard
            title="Total Listeners"
            value={analytics.totalListeners.toLocaleString()}
            change={analytics.listenersChange}
            icon={<Users className="h-4 w-4" />}
          />
          <MetricCard
            title="Avg. Listen Duration"
            value={analytics.avgListenDuration}
            change={analytics.durationChange}
            icon={<Clock className="h-4 w-4" />}
          />
          <MetricCard
            title="Total Downloads"
            value={analytics.totalDownloads.toLocaleString()}
            change={analytics.downloadsChange}
            icon={<Download className="h-4 w-4" />}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Top Episodes */}
          <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Top Episodes</h3>
              <button
                onClick={() => router.push('/podcast/episodes')}
                className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-all flex items-center gap-1"
              >
                View All
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-3">
              {analytics.topEpisodes.map((episode, index) => (
                <div key={episode.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-500">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">{episode.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{episode.plays.toLocaleString()} plays</span>
                    {episode.trend === 'up' ? (
                      <ArrowUpRight className="h-3 w-3 text-green-400" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Listener Demographics */}
          <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Listener Demographics</h3>
              <Globe className="h-4 w-4 text-slate-500" />
            </div>
            <div className="space-y-3">
              {analytics.listenerDemographics.map((demo) => (
                <div key={demo.region}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">{demo.region}</span>
                    <span className="text-xs text-slate-500">{demo.listeners.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"
                      style={{ width: `${demo.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platforms */}
        <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-300">Platform Distribution</h3>
            <Headphones className="h-4 w-4 text-slate-500" />
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {analytics.platforms.map((platform) => (
              <div key={platform.name} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="text-2xl mb-2">{platform.icon}</div>
                <p className="text-sm font-medium text-slate-300">{platform.name}</p>
                <p className="text-xs text-slate-500">{platform.percentage}% of listeners</p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">Total Episodes</p>
            </div>
            <p className="text-2xl font-medium text-slate-300">{analytics.episodes}</p>
          </div>
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center">
                <Clock className="h-4 w-4 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">Total Hours of Content</p>
            </div>
            <p className="text-2xl font-medium text-slate-300">{analytics.totalHours}h</p>
          </div>
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">Avg. Episodes per Month</p>
            </div>
            <p className="text-2xl font-medium text-slate-300">2.5</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  icon
}: {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
}) {
  const isPositive = change >= 0;

  return (
    <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <p className="text-2xl font-medium text-slate-300">{value}</p>
        <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-xs text-slate-600">{title}</p>
      <div className={`flex items-center gap-1 mt-1 text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
        <span>{Math.abs(change)}% vs last period</span>
      </div>
    </div>
  );
}
