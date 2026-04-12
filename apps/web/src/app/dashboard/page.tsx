'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  DashboardHeader,
  StatsCards,
  MeetingList,
  AIInsightsPanel,
  RecentRecordings,
} from '@/components/dashboard';
import ChatButton from '@/components/ChatButton';
import AISearchModal from '@/components/AISearchModal';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const meetingService = {
  getAllMeetings: async (_userId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/v1/meetings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch meetings');
      const data = await response.json();
      return data.data || data.meetings || [];
    } catch (error) {
      console.error('API fetch failed, using localStorage fallback:', error);
      const rawMeetings = localStorage.getItem('scheduledMeetings');
      if (!rawMeetings) return [];
      try {
        const scheduledMeetings = JSON.parse(rawMeetings);
        return scheduledMeetings.map((m: any) => ({
          id: m.id,
          name: m.name || 'Untitled Meeting',
          code: m.code || m.id?.replace('meeting-', 'MTG-') || `MTG-${Date.now().toString(36).toUpperCase()}`,
          hostId: m.hostId,
          hostName: m.hostName,
          status: (m.status || 'scheduled').toLowerCase(),
          participants: m.participants || 0,
          date: m.scheduledDate,
          duration: m.duration || 60,
        }));
      } catch {
        return [];
      }
    }
  },
  getStatistics: async (_userId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/v1/meetings/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      return data.data || data.stats || {
        totalMeetings: 0,
        activeMeetings: 0,
        scheduledMeetings: 0,
        totalParticipants: 0,
        totalRecordings: 0,
        storageUsed: 0,
      };
    } catch (error) {
      console.error('Stats API failed, using demo stats:', error);
      const rawMeetings = JSON.parse(localStorage.getItem('scheduledMeetings') || '[]');
      const scheduledCount = rawMeetings.filter((m: any) => m.status === 'SCHEDULED').length;
      const activeCount = rawMeetings.filter((m: any) => m.status === 'ACTIVE').length;
      return {
        totalMeetings: rawMeetings.length,
        activeMeetings: activeCount,
        scheduledMeetings: scheduledCount,
        totalParticipants: 0,
        totalRecordings: 0,
        storageUsed: 0,
      };
    }
  },
};

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'scheduled'>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAISearch, setShowAISearch] = useState(false);
  const [aiSearchQuery] = useState('');
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    activeMeetings: 0,
    scheduledMeetings: 0,
    totalParticipants: 0,
    totalRecordings: 0,
    storageUsed: 0,
  });

  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }
      const userRooms = await meetingService.getAllMeetings(user.id);
      setRooms(userRooms);
    } catch (err: any) {
      console.error('Error loading rooms:', err);
      setError(err.message || 'Failed to load meetings.');
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [user]);

  async function loadStats() {
    try {
      if (!user?.id) return;
      const stats = await meetingService.getStatistics(user.id);
      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadAIInsights() {
    try {
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
  }, [user, loadRooms]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadRooms();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, loadRooms]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <DashboardHeader
        showSettings={showSettings}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onToggleAISearch={() => setShowAISearch(true)}
      />

      <main className="container mx-auto px-6 py-8 space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <StatsCards stats={stats} />
            <MeetingList
              rooms={rooms}
              isLoading={isLoading}
              error={error}
              activeTab={activeTab}
              searchQuery={searchQuery}
              onSetActiveTab={setActiveTab}
              onRefresh={loadRooms}
            />
          </div>
          <div className="space-y-6">
            <AIInsightsPanel insights={aiInsights} />
            <RecentRecordings />
          </div>
        </div>
      </main>

      <AISearchModal
        isOpen={showAISearch}
        onClose={() => setShowAISearch(false)}
        initialQuery={aiSearchQuery}
      />

      <ChatButton />
    </div>
  );
}
