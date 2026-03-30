"use client";

import { useState, useEffect } from 'react';
import { Button } from '@vantage/ui';
import { BarChart3, Users, Clock, Database } from 'lucide-react';

interface DashboardMetrics {
  totalMeetings: number;
  totalParticipants: number;
  totalDuration: number;
  activeUsers: number;
  storageUsed: number;
  meetingsByDay: Array<{ date: string; count: number }>;
  topRooms: Array<{ id: string; name: string; participants: number }>;
}

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    // Use demo data instead of API
    loadDemoMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  async function loadDemoMetrics() {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Demo metrics for executives
    const demoMetrics: DashboardMetrics = {
      totalMeetings: 156,
      totalParticipants: 1247,
      totalDuration: 892, // hours
      activeUsers: 89,
      storageUsed: 245, // GB
      meetingsByDay: [
        { date: 'Mon', count: 12 },
        { date: 'Tue', count: 18 },
        { date: 'Wed', count: 24 },
        { date: 'Thu', count: 20 },
        { date: 'Fri', count: 16 },
        { date: 'Sat', count: 4 },
        { date: 'Sun', count: 2 },
      ],
      topRooms: [
        { id: '1', name: 'Q1 Board Meeting', participants: 250 },
        { id: '2', name: 'Executive Strategy Session', participants: 180 },
        { id: '3', name: 'Investor Relations Call', participants: 156 },
      ],
    };
    
    setMetrics(demoMetrics);
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0b1220] animate-pulse h-28" />
        <div className="p-4 rounded-2xl bg-[#0b1220] animate-pulse h-28" />
        <div className="p-4 rounded-2xl bg-[#0b1220] animate-pulse h-28" />
        <div className="p-4 rounded-2xl bg-[#0b1220] animate-pulse h-28" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center text-blue-200 py-8">No analytics data available</div>
    );
  }

  const maxCount = Math.max(...metrics.meetingsByDay.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Meetings"
          value={metrics.totalMeetings.toString()}
          icon={<BarChart3 className="h-6 w-6 text-blue-400" />}
        />
        <StatCard
          title="Total Participants"
          value={metrics.totalParticipants.toLocaleString()}
          icon={<Users className="h-6 w-6 text-blue-400" />}
        />
        <StatCard
          title="Total Duration"
          value={formatDuration(metrics.totalDuration)}
          icon={<Clock className="h-6 w-6 text-blue-400" />}
        />
        <StatCard
          title="Storage Used"
          value={formatBytes(metrics.storageUsed)}
          icon={<Database className="h-6 w-6 text-blue-400" />}
        />
      </div>

      {/* Meetings Chart */}
      <div className="rounded-2xl bg-[#1e293b] border border-blue-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Meetings Over Time</h3>
        <div className="h-64 flex items-end space-x-1">
          {metrics.meetingsByDay.map((day) => (
            <div
              key={day.date}
              className="flex-1 rounded-t"
              style={{ height: `${(day.count / maxCount) * 100}%`, background: 'linear-gradient(180deg,#06b6d4,#3b82f6)' }}
              title={`${day.date}: ${day.count} meetings`}
              aria-label={`${day.date}: ${day.count} meetings`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-blue-300">
          <span>{metrics.meetingsByDay[0]?.date}</span>
          <span>{metrics.meetingsByDay[metrics.meetingsByDay.length - 1]?.date}</span>
        </div>
      </div>

      {/* Top Rooms */}
      <div className="rounded-2xl bg-[#1e293b] border border-blue-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Meetings</h3>
        <div className="space-y-3">
          {metrics.topRooms.map((room, index) => (
            <div
              key={room.id}
              className="flex items-center justify-between p-3 bg-[#0b1220] rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-blue-300">#{index + 1}</span>
                <span className="font-medium text-white">{room.name}</span>
              </div>
              <span className="text-sm text-blue-300">{room.participants} participants</span>
            </div>
          ))}
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-center space-x-2">
        {[7, 14, 30, 90].map((d) => (
          <Button
            key={d}
            variant={days === d ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setDays(d)}
            disabled={isLoading}
          >
            Last {d} days
          </Button>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: any }) {
  return (
    <div className="p-4 rounded-2xl bg-[#1e293b] border border-blue-500/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-blue-300">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default AnalyticsDashboard;
