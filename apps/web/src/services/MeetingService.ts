/**
 * Meeting Service - Production Ready with Prisma
 * Connects to PostgreSQL via Prisma ORM
 */

export interface Meeting {
  id: string;
  name: string;
  code: string;
  hostId: string;
  hostName?: string;
  status: 'active' | 'scheduled' | 'ended';
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
  type: 'reschedule' | 'not-joining' | 'general';
  from: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'meeting-starting' | 'participant-joined' | 'recording-ready' | 'message-received';
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

class MeetingService {
  private apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // ==================== MEETINGS ====================

  async getAllMeetings(hostId?: string): Promise<Meeting[]> {
    try {
      const url = hostId 
        ? `${this.apiUrl}/api/v1/meetings?hostId=${hostId}`
        : `${this.apiUrl}/api/v1/meetings`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch meetings');
      }

      const data = await response.json();
      return data.meetings || data;
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  }

  async getMeetingByCode(code: string): Promise<Meeting | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/meetings/${code}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching meeting:', error);
      return null;
    }
  }

  async createMeeting(_data: {
    name: string;
    scheduledAt?: string;
    duration?: number;
    maxParticipants?: number;
    password?: string;
    allowChat?: boolean;
    allowScreenShare?: boolean;
    allowRecording?: boolean;
    enableWaitingRoom?: boolean;
  }): Promise<Meeting | null> {
    try {
      const response: Response = await fetch(`${this.apiUrl}/api/v1/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(_data)
      });

      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Error creating meeting:', error);
      return null;
    }
  }

  async updateMeeting(code: string, _data: Partial<Meeting>): Promise<Meeting | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/meetings/${code}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(_data)
      });

      if (!response.ok) {
        return null;
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Error updating meeting:', error);
      return null;
    }
  }

  async deleteMeeting(code: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/meetings/${code}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting meeting:', error);
      return false;
    }
  }

  async getStatistics(hostId: string) {
    try {
      const response = await fetch(`${this.apiUrl}/api/v1/meetings/statistics?hostId=${hostId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        totalMeetings: 0,
        activeMeetings: 0,
        scheduledMeetings: 0,
        totalParticipants: 0,
        totalRecordings: 0,
        storageUsed: 0,
      };
    }
  }
}

export const meetingService = new MeetingService();
export default meetingService;
