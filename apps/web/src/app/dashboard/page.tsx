'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import meetingService from '@/services/MeetingService';
import ChatButton from '@/components/ChatButton';
import {
  Video, Calendar, Clock, Users, Play, Shield, Lock, Bell, Search, Settings, LogOut,
  ChevronRight, Plus, Copy, MoreVertical, Edit2, Trash2, X, Mic, FolderOpen,
  BarChart3, CheckCircle2
} from 'lucide-react';

interface Room {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'scheduled' | 'ended';
  participants: number;
  date?: string;
  duration?: string | number;
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
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load stats on mount
  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  // Settings handlers
  const handleProfileClick = () => {
    setShowSettings(false);
    router.push('/account/profile');
  };

  const handleBillingClick = () => {
    setShowSettings(false);
    router.push('/account/billing');
  };

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

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                         room.code.toLowerCase().includes(debouncedSearch.toLowerCase());
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

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Security Banner - Minimal */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2">
        <div className="container mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Encrypted</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> SOC 2</span>
          </div>
        </div>
      </div>

      {/* Header - Clean & Minimal */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Simple */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Video className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <h1 className="text-sm font-medium text-slate-300">VANTAGE</h1>
                <p className="text-xs text-slate-600">Dashboard</p>
              </div>
            </div>

            {/* Search - Minimal */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 h-3.5 w-3.5 text-slate-600" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-sm text-slate-400 placeholder:text-slate-700 focus:outline-none focus:border-slate-700 transition-all"
                />
              </div>
            </div>

            {/* Actions - Simple Icons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-md transition-all"
              >
                <Bell className="h-4 w-4" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-md transition-all"
                >
                  <Settings className="h-4 w-4" />
                </button>
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="p-2 border-b border-slate-800">
                      <p className="text-xs font-medium text-slate-500 px-2 py-1">Settings</p>
                    </div>
                    <button
                      onClick={handleProfileClick}
                      className="w-full px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-all flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={handleBillingClick}
                      className="w-full px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-all flex items-center gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Billing & Plans
                    </button>
                    <button onClick={logout} className="w-full px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-400 transition-all flex items-center gap-2 border-t border-slate-800">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
              <div className="w-px h-6 bg-slate-800 mx-2" />
              <button onClick={logout} className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded-md transition-all">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-xl font-medium text-slate-300 mb-1">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}</h2>
          <p className="text-sm text-slate-600">Here's what's happening today</p>
        </div>

        {/* Stats - With Icons */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-2xl font-medium text-slate-300">{stats.totalMeetings}</p>
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center">
                <Video className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            <p className="text-xs text-slate-600">Total Meetings</p>
            <p className="text-xs text-slate-700 mt-1">{stats.totalParticipants} total participants</p>
          </div>
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-2xl font-medium text-slate-300">{stats.activeMeetings}</p>
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            <p className="text-xs text-slate-600">Active Now</p>
            <p className="text-xs text-slate-700 mt-1">Currently in progress</p>
          </div>
          <div className="p-5 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-2xl font-medium text-slate-300">{stats.scheduledMeetings}</p>
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            <p className="text-xs text-slate-600">Scheduled</p>
            <p className="text-xs text-slate-700 mt-1">Upcoming meetings</p>
          </div>
        </div>

        {/* Quick Actions - Simple */}
        <div className="grid md:grid-cols-4 gap-3 mb-8">
          <button
            onClick={() => router.push('/create-room')}
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-all">
                <Plus className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Start</p>
                <p className="text-xs text-slate-600">Instant meeting</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push('/schedule-room')}
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-all">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Schedule</p>
                <p className="text-xs text-slate-600">Plan ahead</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push('/join')}
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-all">
                <Mic className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Join</p>
                <p className="text-xs text-slate-600">Enter code</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => router.push('/analytics')}
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-all">
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Analytics</p>
                <p className="text-xs text-slate-600">Insights</p>
              </div>
            </div>
          </button>
        </div>

        {/* Podcast Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Mic className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-300">Podcast Studio</h3>
                <p className="text-xs text-slate-600">Record and publish audio/video podcasts</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/podcast')}
              className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-all flex items-center gap-1"
            >
              View All
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-3">
            <button
              onClick={() => router.push('/podcast/new')}
              className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                  <Plus className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">New Episode</p>
                  <p className="text-xs text-slate-600">Start recording</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => router.push('/podcast/episodes')}
              className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                  <Video className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Episodes</p>
                  <p className="text-xs text-slate-600">Manage content</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => router.push('/podcast/analytics')}
              className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                  <BarChart3 className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Analytics</p>
                  <p className="text-xs text-slate-600">Performance</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Meetings Section */}
        <div className="rounded-lg bg-slate-900/50 border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'all' ? 'bg-slate-800 text-slate-300' : 'text-slate-600 hover:text-slate-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'active' ? 'bg-slate-800 text-slate-300' : 'text-slate-600 hover:text-slate-400'}`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'scheduled' ? 'bg-slate-800 text-slate-300' : 'text-slate-600 hover:text-slate-400'}`}
              >
                Scheduled
              </button>
            </div>
            <button
              onClick={() => router.push('/schedule-room')}
              className="text-xs font-medium text-slate-400 hover:text-slate-300 transition-all flex items-center gap-1"
            >
              <Calendar className="h-3 w-3" />
              Schedule
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-slate-800 border-t-slate-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-600">Loading...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-sm text-red-400 mb-3">{error}</p>
                <button onClick={loadRooms} className="text-xs text-slate-400 hover:text-slate-300">Retry</button>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-12 text-center">
                <FolderOpen className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-4">No meetings found</p>
                <button
                  onClick={() => router.push('/create-room')}
                  className="text-xs font-medium text-slate-400 hover:text-slate-300 transition-all flex items-center justify-center gap-1 mx-auto"
                >
                  <Plus className="h-3 w-3" />
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

// Meeting Card - Minimal
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

  return (
    <>
      <div className="p-4 hover:bg-slate-800/30 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
              <Video className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-slate-300 truncate">{room.name}</h4>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  room.status === 'active' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                  room.status === 'scheduled' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                  'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>
                  {room.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="font-mono bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">{room.code}</span>
                {room.date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{room.date}</span>}
                {room.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{room.duration}</span>}
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{room.participants}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onJoin}
              className="px-4 py-1.5 text-xs font-medium rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-all flex items-center gap-1.5"
            >
              <Play className="h-3 w-3" />
              {room.status === 'active' ? 'Join' : 'Start'}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-all"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-slate-900 border border-slate-800 rounded-md shadow-xl overflow-hidden z-50">
                  {isHost ? (
                    <>
                      <button onClick={handleEdit} className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-all flex items-center gap-2">
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                      <button onClick={handleCopyLink} className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-all flex items-center gap-2 border-t border-slate-800">
                        <Copy className="h-3 w-3" />
                        Copy link
                      </button>
                      <button onClick={handleDelete} className="w-full px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-400 transition-all flex items-center gap-2 border-t border-slate-800">
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleCopyLink} className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-all flex items-center gap-2">
                        <Copy className="h-3 w-3" />
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

// Edit Modal - Full Screen Overlay
function EditMeetingModal({ room, onClose, onSave }: { room: Room; onClose: () => void; onSave: (data: any) => void }) {
  const [name, setName] = useState(room.name);
  const [date, setDate] = useState(room.date?.split(',')[0] || '');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(typeof room.duration === 'string' ? room.duration?.replace(' min', '').replace('h', '') || '60' : '60');

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a meeting name');
      return;
    }
    onSave({
      name: name.trim(),
      date: date && time ? `${date}, ${time}` : date || room.date,
      duration: `${duration} min`,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium text-slate-300">Edit Meeting</h2>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-600"
              placeholder="Meeting name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">Duration (min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-600"
              min="1"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 text-sm font-medium rounded-md bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300 transition-all">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// Notifications Dropdown - Real data from service
function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      meetingService.getNotifications(user.id).then(setNotifications);
    }
  }, [user]);

  const clearAll = async () => {
    if (user) {
      await meetingService.clearNotifications(user.id);
      setNotifications([]);
    }
  };

  return (
    <div className="fixed inset-0 z-[99]" onClick={onClose}>
      <div className="absolute right-6 top-16 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-400">Notifications</h3>
          {notifications.length > 0 && (
            <button onClick={clearAll} className="text-xs text-slate-500 hover:text-slate-400">
              Clear all
            </button>
          )}
          <button onClick={onClose} className="text-slate-600 hover:text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-600">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3 hover:bg-slate-800/30 transition-all">
                  <p className="text-sm text-slate-300">{notif.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                  <p className="text-xs text-slate-700 mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
