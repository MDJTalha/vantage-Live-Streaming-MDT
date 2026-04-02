'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Video, Calendar, Users, Play, Shield, Lock, Bell, LogOut, ChevronRight, Briefcase, DollarSign, Building2 } from 'lucide-react';

interface Meeting {
  id: string;
  name: string;
  code: string;
  status: 'live' | 'upcoming';
  participants: number;
  dateTime?: string;
  duration?: string;
  priority?: 'critical' | 'high' | 'normal';
  type?: 'board' | 'investor' | 'executive';
  confidential?: boolean;
}

export default function ExecutiveDashboard() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [meetings] = useState<Meeting[]>([
    {
      id: '1',
      name: 'Q1 Board of Directors Meeting',
      code: 'BOARD-Q1-2026',
      status: 'live',
      participants: 12,
      dateTime: 'Today, 2:00 PM EST',
      duration: '2h',
      priority: 'critical',
      type: 'board',
      confidential: true,
    },
    {
      id: '2',
      name: 'Investor Relations - Series B',
      code: 'INVESTOR-SB-001',
      status: 'upcoming',
      participants: 8,
      dateTime: 'Tomorrow, 10:00 AM EST',
      duration: '90 min',
      priority: 'high',
      type: 'investor',
      confidential: true,
    },
  ]);

  // Show loading while auth checks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Loading...</h2>
          <p className="text-slate-400 text-sm">Preparing your dashboard</p>
        </div>
      </div>
    );
  }

  // If not logged in, show login button
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Executive Dashboard</h2>
          <p className="text-slate-400 mb-6">Please sign in to continue</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const liveMeeting = meetings.find(m => m.status === 'live');

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Security Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-emerald-900/80 to-emerald-950/80 border-b border-emerald-500/20 px-6 py-2">
        <div className="container mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-emerald-400">
            <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Encrypted</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> SOC 2 Compliant</span>
          </div>
          <span className="text-emerald-400 font-bold">Security: 98/100</span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">VANTAGE</h1>
                <p className="text-xs text-slate-400 font-medium">EXECUTIVE</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-white relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{user?.name || 'Executive'}</p>
                  <p className="text-xs text-amber-400 font-medium uppercase">{user?.role || 'CEO'}</p>
                </div>
                <button onClick={logout} className="text-slate-400 hover:text-white">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Executive'}</h2>
          <p className="text-slate-400 text-sm">Here's what's happening today</p>
        </div>

        {/* Live Meeting Alert */}
        {liveMeeting && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/50 via-red-900/40 to-red-950/50 border border-red-500/30 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <Video className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0e1a] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase animate-pulse">
                      ● Live Now
                    </span>
                    {liveMeeting.confidential && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Confidential
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white">{liveMeeting.name}</h3>
                  <p className="text-sm text-slate-400">{liveMeeting.participants} executives in meeting • {liveMeeting.duration}</p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/room-executive/${liveMeeting.code}`)}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-red-500/20"
              >
                <Play className="h-4 w-4 mr-2 inline" />
                Join Now
              </button>
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-slate-800">
            <Briefcase className="h-5 w-5 text-blue-400 mb-3" />
            <p className="text-2xl font-bold text-white">24</p>
            <p className="text-xs text-slate-400 mt-1">Meetings This Month</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-slate-800">
            <Users className="h-5 w-5 text-purple-400 mb-3" />
            <p className="text-2xl font-bold text-white">1,247</p>
            <p className="text-xs text-slate-400 mt-1">Total Participants</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-slate-800">
            <Clock className="h-5 w-5 text-green-400 mb-3" />
            <p className="text-2xl font-bold text-white">156</p>
            <p className="text-xs text-slate-400 mt-1">Hours Saved</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-slate-800">
            <Star className="h-5 w-5 text-amber-400 mb-3" />
            <p className="text-2xl font-bold text-white">94%</p>
            <p className="text-xs text-slate-400 mt-1">Engagement Rate</p>
          </div>
        </div>

        {/* Meetings List */}
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">All Meetings</h3>
            <div className="flex gap-3">
              <button className="border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-sm px-4 py-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </button>
              <button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-sm px-4 py-2 font-medium">
                Start Meeting
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-800">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="p-6 hover:bg-slate-800/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                      {meeting.type === 'board' ? (
                        <Briefcase className="h-5 w-5 text-slate-400" />
                      ) : meeting.type === 'investor' ? (
                        <DollarSign className="h-5 w-5 text-slate-400" />
                      ) : (
                        <Building2 className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-semibold text-white">{meeting.name}</h4>
                        {meeting.priority === 'critical' && (
                          <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold">Critical</span>
                        )}
                        {meeting.priority === 'high' && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold">High</span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          meeting.status === 'live' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                        }`}>
                          {meeting.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-current inline-block mr-1.5 animate-pulse" />}
                          {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="font-mono text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">{meeting.code}</span>
                        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{meeting.dateTime}</span>
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{meeting.duration}</span>
                        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{meeting.participants}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/room-executive/${meeting.code}`)}
                    className={`font-medium px-5 py-2.5 rounded-lg ${
                      meeting.status === 'live'
                        ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white'
                        : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white'
                    }`}
                  >
                    {meeting.status === 'live' ? 'Join Now' : 'Join Meeting'}
                    <ChevronRight className="h-4 w-4 ml-1 inline" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
