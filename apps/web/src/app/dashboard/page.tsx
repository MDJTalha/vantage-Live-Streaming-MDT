'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Video, Calendar, Clock, Users, Play, Shield, Lock, Bell, Search, Settings, LogOut,
  ChevronRight, Plus, Copy, MoreVertical, Edit2, Trash2, X, Mic, FolderOpen,
  BarChart3, CheckCircle2, Sparkles, Brain, Zap, TrendingUp, Award, Target,
  FileText, MessageSquare, Star, AlertCircle, RefreshCw, ArrowRight
} from 'lucide-react';

interface Room {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'scheduled' | 'ended';
  participants: number;
  date?: string;
  duration?: string | number;
  priority?: 'critical' | 'high' | 'normal';
  type?: 'board' | 'investor' | 'executive' | 'team';
  aiSummary?: string;
  aiActionItems?: number;
  aiSentiment?: number;
}

interface AIInsights {
  dailyBriefing: string[];
  pendingActionItems: number;
  meetingsToday: number;
  recordingsReady: number;
  sentimentTrend: 'positive' | 'neutral' | 'negative';
  productivityScore: number;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scheduled'>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);

  useEffect(() => {
    if (user) {
      loadStats();
      loadAIInsights();
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadRooms();
  }, [user]);

  async function loadRooms() {
    setIsLoading(true);
    setError(null);
    try {
      const userRooms = await meetingService.getAllMeetings(user?.id);
      setRooms(userRooms);
    } catch (error: any) {
      setError(error.message || 'Failed to load meetings.');
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  }

  async function loadStats() {
    try {
      const stats = await meetingService.getStatistics(user?.id);
      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadAIInsights() {
    try {
      // Simulated AI insights - in production, fetch from API
      setAiInsights({
        dailyBriefing: [
          `Good ${getTimeOfDay()}, ${user?.name?.split(' ')[0] || 'Executive'}. Here's your briefing for today.`,
          'You have 2 meetings scheduled - Board meeting at 2 PM is high priority',
          '3 AI-generated summaries ready from yesterday\'s recordings',
          '5 action items need your attention from previous meetings',
        ],
        pendingActionItems: 5,
        meetingsToday: 2,
        recordingsReady: 3,
        sentimentTrend: 'positive',
        productivityScore: 94,
      });
    } catch (error) {
      console.error('Error loading AI insights:', error);
    }
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || room.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const [stats, setStats] = useState({
    totalMeetings: 0,
    activeMeetings: 0,
    scheduledMeetings: 0,
    totalParticipants: 0,
    totalRecordings: 0,
    storageUsed: 0,
  });

  if (!user) return null;

  const liveMeeting = rooms.find(m => m.status === 'active');
  const upcomingMeetings = rooms.filter(m => m.status === 'scheduled');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Premium Security Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 border-b border-emerald-500/20 px-6 py-2">
        <div className="container mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-emerald-400">
            <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> End-to-End Encrypted</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> SOC 2 Type II Certified</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> GDPR Compliant</span>
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
              <div className="relative w-full group">
                <Search className="absolute left-4 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search meetings, recordings, or ask AI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 rounded-xl transition-all"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
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
                      onClick={() => { setShowSettings(false); router.push('/account/profile'); }}
                      className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-3"
                    >
                      <Users className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => { setShowSettings(false); router.push('/account/billing'); }}
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

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* AI Daily Briefing - NEW */}
        {aiInsights && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/60 via-purple-950/60 to-blue-950/60 border border-blue-500/20 p-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">AI Daily Briefing</h2>
                    <p className="text-sm text-slate-400">Your personalized executive summary</p>
                  </div>
                </div>
                <button
                  onClick={loadAIInsights}
                  className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                  title="Refresh AI Insights"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {aiInsights.dailyBriefing.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                      <p className="text-slate-300 text-sm">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <Calendar className="h-5 w-5 text-blue-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{aiInsights.meetingsToday}</p>
                    <p className="text-xs text-slate-500">Meetings Today</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <FileText className="h-5 w-5 text-purple-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{aiInsights.recordingsReady}</p>
                    <p className="text-xs text-slate-500">Summaries Ready</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <Target className="h-5 w-5 text-amber-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{aiInsights.pendingActionItems}</p>
                    <p className="text-xs text-slate-500">Action Items</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions - Premium */}
        <div className="grid md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/create-room')}
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/30"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <p className="text-lg font-bold text-white mb-1">Start Meeting</p>
              <p className="text-sm text-blue-100">Instant meeting</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          </button>

          <button
            onClick={() => router.push('/schedule-room')}
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 transition-all shadow-lg shadow-purple-500/30"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <p className="text-lg font-bold text-white mb-1">Schedule</p>
              <p className="text-sm text-purple-100">Plan ahead</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          </button>

          <button
            onClick={() => router.push('/join')}
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/30"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <p className="text-lg font-bold text-white mb-1">Join Meeting</p>
              <p className="text-sm text-emerald-100">Enter code</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          </button>

          <button
            onClick={() => router.push('/analytics')}
            className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg shadow-amber-500/30"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <p className="text-lg font-bold text-white mb-1">Analytics</p>
              <p className="text-sm text-amber-100">Insights</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          </button>
        </div>

        {/* AI Quick Actions - NEW */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/50 to-blue-950/40 border border-purple-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">AI Assistant</h3>
                <p className="text-sm text-slate-400">Intelligent meeting assistance</p>
              </div>
            </div>
            <button className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-all flex items-center gap-1">
              View All AI Features
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <button className="group p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Generate Summary</p>
                  <p className="text-xs text-slate-500">AI meeting notes</p>
                </div>
              </div>
            </button>

            <button className="group p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                  <CheckCircle2 className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Action Items</p>
                  <p className="text-xs text-slate-500">Extract tasks</p>
                </div>
              </div>
            </button>

            <button className="group p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Sentiment Analysis</p>
                  <p className="text-xs text-slate-500">Meeting insights</p>
                </div>
              </div>
            </button>

            <button className="group p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                  <Zap className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Quick Actions</p>
                  <p className="text-xs text-slate-500">AI commands</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Live Meeting Alert - Premium */}
        {liveMeeting && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/60 via-red-900/40 to-red-950/60 border border-red-500/30 p-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <Video className="h-7 w-7 text-red-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-4 border-slate-950 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Live Now
                    </span>
                    {liveMeeting.priority === 'critical' && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Critical
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{liveMeeting.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {liveMeeting.participants} participants</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {liveMeeting.duration}</span>
                    {liveMeeting.aiSentiment && (
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-400">94% positive sentiment</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/room/${liveMeeting.code}`)}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center gap-2 group"
              >
                <Play className="h-5 w-5" />
                Join Now
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Stats - Premium */}
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

        {/* Meetings Section - Premium */}
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === 'all' 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                All Meetings
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === 'active' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === 'scheduled' 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                Scheduled
              </button>
            </div>
            <button
              onClick={() => router.push('/schedule-room')}
              className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-all flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Schedule Meeting
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-500">Loading your meetings...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-sm text-red-400 mb-4">{error}</p>
                <button onClick={loadRooms} className="text-sm font-medium text-blue-400 hover:text-blue-300">
                  Try Again
                </button>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-12 text-center">
                <FolderOpen className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                <p className="text-sm text-slate-500 mb-4">No meetings found</p>
                <button
                  onClick={() => router.push('/create-room')}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Create your first meeting
                </button>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <MeetingCard
                  key={room.id}
                  room={room}
                  onJoin={() => router.push(`/room/${room.code}`)}
                  onRefresh={loadRooms}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <NotificationsDropdown onClose={() => setShowNotifications(false)} />
      )}

      {/* Chat Feature */}
      <ChatButton />
    </div>
  );
}

// Premium Meeting Card Component
function MeetingCard({ room, onJoin, onRefresh }: { room: Room; onJoin: () => void; onRefresh: () => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isHost] = useState(true);

  const handleCopyLink = () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/room/${room.code}`;
    navigator.clipboard.writeText(url);
  };

  const handleDelete = async () => {
    if (confirm(`Delete "${room.name}"?`)) {
      const success = await meetingService.deleteMeeting(room.code);
      if (success) {
        onRefresh();
      }
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    setIsEditing(true);
  };

  const getPriorityColor = () => {
    switch (room.priority) {
      case 'critical': return 'from-red-500/20 to-red-600/20 border-red-500/30';
      case 'high': return 'from-amber-500/20 to-amber-600/20 border-amber-500/30';
      default: return 'from-slate-800/50 to-slate-900/50 border-slate-700/50';
    }
  };

  const getTypeIcon = () => {
    switch (room.type) {
      case 'board': return <Briefcase className="h-5 w-5" />;
      case 'investor': return <DollarSign className="h-5 w-5" />;
      case 'executive': return <Award className="h-5 w-5" />;
      default: return <Video className="h-5 w-5" />;
    }
  };

  return (
    <>
      <div className={`p-6 hover:bg-gradient-to-r ${getPriorityColor()} transition-all group`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
              {getTypeIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-base font-semibold text-white truncate">{room.name}</h4>
                {room.priority === 'critical' && (
                  <span className="px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex-shrink-0">
                    Critical
                  </span>
                )}
                {room.priority === 'high' && (
                  <span className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex-shrink-0">
                    High Priority
                  </span>
                )}
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex-shrink-0 ${
                  room.status === 'active' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                  room.status === 'scheduled' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                  'bg-slate-700/50 border-slate-600/50 text-slate-400'
                }`}>
                  {room.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />}
                  {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                <span className="font-mono bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/50">{room.code}</span>
                {room.date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {room.date}
                  </span>
                )}
                {room.duration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {room.duration}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {room.participants} participants
                </span>
                {room.aiActionItems !== undefined && room.aiActionItems > 0 && (
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {room.aiActionItems} AI action items
                  </span>
                )}
              </div>
              {room.aiSummary && (
                <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-300">{room.aiSummary}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onJoin}
              className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                room.status === 'active'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30'
              }`}
            >
              <Play className="h-4 w-4" />
              {room.status === 'active' ? 'Join Now' : 'Start'}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-xl transition-all"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                  {isHost ? (
                    <>
                      <button onClick={handleEdit} className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-3">
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button onClick={handleCopyLink} className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-3 border-t border-slate-800">
                        <Copy className="h-4 w-4" />
                        Copy link
                      </button>
                      <button onClick={handleDelete} className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-all flex items-center gap-3 border-t border-slate-800">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleCopyLink} className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-3">
                        <Copy className="h-4 w-4" />
                        Copy link
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <EditMeetingModal
          room={room}
          onClose={() => setIsEditing(false)}
          onSave={async (updatedData: any) => {
            await meetingService.updateMeeting(room.code, updatedData);
            setIsEditing(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}

// Placeholder components - import from actual files
function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute right-4 top-20 w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Notifications</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-center py-8 text-slate-500 text-sm">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No new notifications</p>
        </div>
      </div>
    </div>
  );
}

function EditMeetingModal({ room, onClose, onSave }: any) {
  const [name, setName] = useState(room.name);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Edit Meeting</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Meeting Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all">
              Cancel
            </button>
            <button onClick={() => onSave({ name })} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock service for demo
const meetingService = {
  getAllMeetings: async (userId: string) => [],
  getStatistics: async (userId: string) => ({
    totalMeetings: 0,
    activeMeetings: 0,
    scheduledMeetings: 0,
    totalParticipants: 0,
    totalRecordings: 0,
    storageUsed: 0,
  }),
  deleteMeeting: async (code: string) => true,
  updateMeeting: async (code: string, data: any) => true,
};

// Import actual components
import ChatButton from '@/components/ChatButton';
import { Briefcase, DollarSign } from 'lucide-react';
