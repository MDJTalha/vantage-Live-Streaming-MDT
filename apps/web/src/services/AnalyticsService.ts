/**
 * Analytics Service - Frontend API Client
 * Handles room analytics, dashboard metrics, and user activity
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface RoomAnalytics {
  roomId: string;
  roomName: string;
  totalParticipants: number;
  uniqueParticipants: number;
  averageDuration: number;
  totalDuration: number;
  chatMessages: number;
  pollsCreated: number;
  questionsAsked: number;
  recordingsCount: number;
  peakConcurrentUsers: number;
  engagement: {
    chatParticipation: number;
    pollParticipation: number;
    questionParticipation: number;
  };
  period: string;
}

export interface DashboardMetrics {
  totalMeetings: number;
  totalParticipants: number;
  totalDuration: number;
  totalRecordings: number;
  averageMeetingDuration: number;
  engagement: {
    chatMessages: number;
    pollsCreated: number;
    questionsAsked: number;
    reactionsSent: number;
  };
  trends: {
    meetingsGrowth: number;
    participantsGrowth: number;
    durationGrowth: number;
  };
  topRooms: Array<{
    id: string;
    name: string;
    participants: number;
    duration: number;
  }>;
  period: string;
}

export interface UserActivity {
  userId: string;
  userName: string;
  meetingsHosted: number;
  meetingsJoined: number;
  totalDuration: number;
  chatMessagesSent: number;
  pollsCreated: number;
  questionsAsked: number;
  reactionsSent: number;
  lastActiveAt: string;
}

class AnalyticsService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Get room analytics
   */
  async getRoomAnalytics(roomId: string): Promise<RoomAnalytics> {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/room/${roomId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch room analytics');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(days: number = 30): Promise<DashboardMetrics> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/analytics/dashboard?days=${days}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch dashboard metrics');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get user activity stats
   */
  async getUserActivity(): Promise<UserActivity> {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/activity`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch user activity');
    }

    const result = await response.json();
    return result.data;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
