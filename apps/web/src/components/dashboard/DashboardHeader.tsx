'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Video, Calendar, Users, Shield, Lock, Bell, Search, Settings, LogOut,
  Plus, Mic, BarChart3, Brain, Award
} from 'lucide-react';

interface DashboardHeaderProps {
  showSettings: boolean;
  onToggleNotifications: () => void;
  onToggleSettings: () => void;
  onToggleAISearch: () => void;
}

export function DashboardHeader({
  showSettings,
  onToggleNotifications,
  onToggleSettings,
  onToggleAISearch,
}: DashboardHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <>
      {/* Premium Security Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 border-b border-emerald-500/20 px-6 py-2">
        <div className="container mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-emerald-400">
            <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> End-to-End Encrypted</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> SOC 2 Type II Certified</span>
            <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-bold">Security Score: 98/100</span>
            <span className="text-emerald-300">●</span>
            <span className="text-emerald-300">All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Premium Logo */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">VANTAGE</h1>
                <p className="text-xs text-slate-500 font-medium">Executive Dashboard</p>
              </div>
            </div>

            {/* Premium Search */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div
                onClick={onToggleAISearch}
                className="relative w-full group cursor-pointer"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  readOnly
                  placeholder="Search meetings, recordings, or ask AI..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer hover:border-slate-600"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 bg-slate-800 rounded-md border border-slate-700">
                    <Search className="h-3 w-3" />
                    <span>AI Search</span>
                  </kbd>
                </div>
              </div>
            </div>

            {/* Premium Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/ai-data-correction')}
                className="p-2.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-xl transition-all group relative"
                title="AI Data Correction"
              >
                <Brain className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              </button>
              <button
                onClick={onToggleNotifications}
                className="relative p-2.5 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded-xl transition-all"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950" />
              </button>
              <div className="relative">
                <button
                  onClick={onToggleSettings}
                  className="p-2.5 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded-xl transition-all"
                >
                  <Settings className="h-5 w-5" />
                </button>
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-3 border-b border-slate-800">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Settings</p>
                    </div>
                    <button
                      onClick={() => { router.push('/account/profile'); }}
                      className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-3"
                    >
                      <Users className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => { router.push('/account/billing'); }}
                      className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-3"
                    >
                      <Award className="h-4 w-4" />
                      Billing & Plans
                    </button>
                    <button onClick={logout} className="w-full px-4 py-3 text-left text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-3 border-t border-slate-800">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
              <div className="w-px h-8 bg-slate-800 mx-2" />
              <div className="flex items-center gap-3">
                <div className="hidden lg:block text-right">
                  <p className="text-sm font-semibold text-white">{user?.name || 'Executive'}</p>
                  <p className="text-xs text-blue-400 font-medium">{user?.role || 'Administrator'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                  {user?.name?.charAt(0) || 'E'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="container mx-auto px-6 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <button
            onClick={() => router.push('/create-room')}
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/30 transition-all">
                <Plus className="h-7 w-7 text-white" />
              </div>
              <p className="text-base font-bold text-white mb-1">Start Meeting</p>
              <p className="text-sm text-blue-100/90">Instant meeting</p>
            </div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          </button>

          <button
            onClick={() => router.push('/schedule-room')}
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5"
          >
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/30 transition-all">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <p className="text-base font-bold text-white mb-1">Schedule</p>
              <p className="text-sm text-purple-100/90">Plan ahead</p>
            </div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          </button>

          <button
            onClick={() => router.push('/join')}
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
          >
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/30 transition-all">
                <Mic className="h-7 w-7 text-white" />
              </div>
              <p className="text-base font-bold text-white mb-1">Join Meeting</p>
              <p className="text-sm text-emerald-100/90">Enter code</p>
            </div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          </button>

          <button
            onClick={() => router.push('/analytics')}
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5"
          >
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/30 transition-all">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <p className="text-base font-bold text-white mb-1">Analytics</p>
              <p className="text-sm text-amber-100/90">Insights</p>
            </div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          </button>

          <button
            onClick={() => router.push('/recordings')}
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5"
          >
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/30 transition-all">
                <Video className="h-7 w-7 text-white" />
              </div>
              <p className="text-base font-bold text-white mb-1">Recordings</p>
              <p className="text-sm text-cyan-100/90">Library</p>
            </div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          </button>

          <button
            onClick={() => router.push('/podcast')}
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 transition-all shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-0.5"
          >
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/30 transition-all">
                <Mic className="h-7 w-7 text-white" />
              </div>
              <p className="text-base font-bold text-white mb-1">Podcast</p>
              <p className="text-sm text-pink-100/90">Studio</p>
            </div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => router.push('/admin')}
              className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5"
            >
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/30 transition-all">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <p className="text-base font-bold text-white mb-1">Admin</p>
                <p className="text-sm text-red-100/90">Panel</p>
              </div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            </button>
          )}

          <button
            onClick={() => router.push('/executive-dashboard')}
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
          >
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/30 transition-all">
                <Award className="h-7 w-7 text-white" />
              </div>
              <p className="text-base font-bold text-white mb-1">Executive</p>
              <p className="text-sm text-indigo-100/90">Dashboard</p>
            </div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          </button>
        </div>
      </div>
    </>
  );
}
