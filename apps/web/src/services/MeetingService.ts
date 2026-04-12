/**
 * Meeting Service — Production Ready
 * C-06 FIX: No localStorage fallbacks — all calls go to API
 */

export interface Meeting {
  id: string;
  name: string;
  code: string;
  hostId: string;
  hostName?: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  participants: number;
  scheduledAt?: string;
  duration?: number;
  maxParticipants?: number;
  settings?: {
    allowChat: boolean;
    allowScreenShare: boolean;
    allowRecording: boolean;
    requirePassword: boolean;
    enableWaitingRoom: boolean;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface MeetingMessage {
  id: string;
  meetingCode: string;
  type: string;
  from: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  meetingCode?: string;
  timestamp: string;
  read: boolean;
}

export interface Recording {
  id: string;
  meetingCode: string;
  meetingName: string;
  url: string;
  duration: number;
  size: number;
  createdAt: string;
}

// C-06 FIX: Required API URL — no localhost fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL && process.env.NODE_ENV === 'production') {
  console.error('❌ NEXT_PUBLIC_API_URL is not configured');
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

class MeetingService {
  // ==================== MEETINGS ====================

  async getAllMeetings(hostId?: string): Promise<Meeting[]> {
    if (!API_URL) throw new Error('API_URL not configured');

    const url = hostId
      ? `${API_URL}/api/v1/meetings?hostId=${hostId}`
      : `${API_URL}/api/v1/meetings`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch meetings: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.meetings || data.data || data;
  }

  async getMeeting(code: string): Promise<Meeting | null> {
    if (!API_URL) throw new Error('API_URL not configured');

    const response = await fetch(`${API_URL}/api/v1/meetings/${code}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Failed to fetch meeting: ${response.status}`);

    const data = await response.json();
    return data.meeting || data.data;
  }

  async createMeeting(meeting: {
    name: string;
    description?: string;
    scheduledAt?: string;
    duration?: number;
    maxParticipants?: number;
    settings?: {
      allowChat?: boolean;
      allowScreenShare?: boolean;
      allowRecording?: boolean;
      requirePassword?: boolean;
      enableWaitingRoom?: boolean;
    };
  }): Promise<Meeting> {
    if (!API_URL) throw new Error('API_URL not configured');

    const response = await fetch(`${API_URL}/api/v1/meetings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(meeting),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create meeting' }));
      throw new Error(error.error || 'Failed to create meeting');
    }

    const data = await response.json();
    return data.meeting || data.data;
  }

  async updateMeeting(code: string, updates: Partial<Meeting>): Promise<Meeting> {
    if (!API_URL) throw new Error('API_URL not configured');

    const response = await fetch(`${API_URL}/api/v1/meetings/${code}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) throw new Error(`Failed to update meeting: ${response.status}`);

    const data = await response.json();
    return data.meeting || data.data;
  }

  async deleteMeeting(code: string): Promise<void> {
    if (!API_URL) throw new Error('API_URL not configured');

    const response = await fetch(`${API_URL}/api/v1/meetings/${code}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to delete meeting: ${response.status}`);
  }

  // ==================== MESSAGES ====================

  async getMeetingMessages(meetingCode: string): Promise<MeetingMessage[]> {
    if (!API_URL) throw new Error('API_URL not configured');

    const response = await fetch(`${API_URL}/api/v1/chat/${meetingCode}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to fetch messages: ${response.status}`);

    const data = await response.json();
    return data.messages || data.data || [];
  }

  async sendMeetingMessage(meetingCode: string, content: string): Promise<MeetingMessage> {
    if (!API_URL) throw new Error('API_URL not configured');

    const response = await fetch(`${API_URL}/api/v1/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ meetingId: meetingCode, content }),
    });

    if (!response.ok) throw new Error(`Failed to send message: ${response.status}`);

    const data = await response.json();
    return data.message || data.data;
  }

  // ==================== RECORDINGS ====================

  async getRecordings(meetingCode?: string): Promise<Recording[]> {
    if (!API_URL) throw new Error('API_URL not configured');

    const url = meetingCode
      ? `${API_URL}/api/v1/recordings?meetingId=${meetingCode}`
      : `${API_URL}/api/v1/recordings`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to fetch recordings: ${response.status}`);

    const data = await response.json();
    return data.recordings || data.data || [];
  }

  // ==================== NOTIFICATIONS ====================

  async getNotifications(): Promise<Notification[]> {
    if (!API_URL) throw new Error('API_URL not configured');

    // Using meetings endpoint which returns notifications in the full response
    const response = await fetch(`${API_URL}/api/v1/meetings`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to fetch notifications: ${response.status}`);

    const data = await response.json();
    return data.notifications || data.data?.notifications || [];
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    if (!API_URL) throw new Error('API_URL not configured');

    // Notifications are typically marked read via a PATCH or dedicated endpoint
    // Adjust based on your API structure
    const response = await fetch(`${API_URL}/api/v1/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to mark notification read: ${response.status}`);
  }

  // ==================== STATISTICS ====================

  async getMeetingStatistics(): Promise<{
    totalMeetings: number;
    totalParticipants: number;
    totalDuration: number;
    upcomingMeetings: number;
  }> {
    if (!API_URL) throw new Error('API_URL not configured');

    const response = await fetch(`${API_URL}/api/v1/analytics/dashboard`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`Failed to fetch statistics: ${response.status}`);

    const data = await response.json();
    return data.statistics || data.data || {
      totalMeetings: 0,
      totalParticipants: 0,
      totalDuration: 0,
      upcomingMeetings: 0,
    };
  }
}

export const meetingService = new MeetingService();
export default meetingService;
