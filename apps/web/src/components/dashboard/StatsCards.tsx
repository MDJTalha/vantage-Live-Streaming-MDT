'use client';

import { Video, Users, FileText, Shield, TrendingUp, CheckCircle2 } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalMeetings: number;
    activeMeetings: number;
    scheduledMeetings: number;
    totalParticipants: number;
    totalRecordings: number;
    storageUsed: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <div className="group p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-3xl font-bold text-white mb-1">{stats.totalMeetings}</p>
            <p className="text-sm text-slate-400">Total Meetings</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
            <Video className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <TrendingUp className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400 font-medium">+12% this month</span>
        </div>
      </div>

      <div className="group p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-3xl font-bold text-white mb-1">{stats.totalParticipants}</p>
            <p className="text-sm text-slate-400">Total Participants</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
            <Users className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <TrendingUp className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400 font-medium">+24% this month</span>
        </div>
      </div>

      <div className="group p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-3xl font-bold text-white mb-1">{stats.totalRecordings}</p>
            <p className="text-sm text-slate-400">Recordings</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
            <FileText className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <TrendingUp className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400 font-medium">+8% this month</span>
        </div>
      </div>

      <div className="group p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-3xl font-bold text-white mb-1">98%</p>
            <p className="text-sm text-slate-400">Uptime SLA</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400 font-medium">Enterprise grade</span>
        </div>
      </div>
    </div>
  );
}
