/**
 * Meeting Service - Production Ready
 * Currently uses localStorage, ready for PostgreSQL migration
 * 
 * To migrate to PostgreSQL:
 * 1. Install Prisma: npm install prisma @prisma/client
 * 2. Initialize: npx prisma init
 * 3. Replace localStorage calls with prisma queries
 * 4. See comments for PostgreSQL equivalents
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
  private storage = {
    meetings: 'meetings',
    messages: 'meeting-messages',
    notifications: 'notifications',
    recordings: 'recordings',
  };

  // ==================== MEETINGS ====================

  async getAllMeetings(hostId?: string): Promise<Meeting[]> {
    try {
      // PostgreSQL equivalent:
      // return await prisma.meeting.findMany({
      //   where: hostId ? { hostId } : {},
      //   orderBy: { createdAt: 'desc' }
      // });

      // Load from all storage locations
      const myRooms = JSON.parse(localStorage.getItem(this.storage.meetings + '-my') || '[]');
      const scheduledRooms = JSON.parse(localStorage.getItem(this.storage.meetings + '-scheduled') || '[]');
      const activeRooms = JSON.parse(localStorage.getItem(this.storage.meetings + '-active') || '[]');

      // Deduplicate by code
      const meetingMap = new Map<string, Meeting>();

      [...myRooms, ...scheduledRooms, ...activeRooms].forEach((meeting: any) => {
        if (!meetingMap.has(meeting.code)) {
          meetingMap.set(meeting.code, {
            ...meeting,
            createdAt: meeting.createdAt || new Date().toISOString(),
          });
        }
      });

      const meetings = Array.from(meetingMap.values());

      // Filter by host if specified
      if (hostId) {
        return meetings.filter(m => m.hostId === hostId);
      }

      return meetings;
    } catch (error) {
      console.error('Error loading meetings:', error);
      return [];
    }
  }

  async createMeeting(data: Omit<Meeting, 'id' | 'createdAt' | 'status'>): Promise<Meeting> {
    try {
      // PostgreSQL equivalent:
      // return await prisma.meeting.create({ data });

      const meeting: Meeting = {
        ...data,
        id: 'meeting-' + Date.now(),
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };

      // Save to scheduled rooms
      const scheduledRooms = JSON.parse(localStorage.getItem(this.storage.meetings + '-scheduled') || '[]');
      scheduledRooms.push(meeting);
      localStorage.setItem(this.storage.meetings + '-scheduled', JSON.stringify(scheduledRooms));

      // Also save to my rooms
      const myRooms = JSON.parse(localStorage.getItem(this.storage.meetings + '-my') || '[]');
      myRooms.push(meeting);
      localStorage.setItem(this.storage.meetings + '-my', JSON.stringify(myRooms));

      // Create notification
      await this.createNotification({
        userId: data.hostId,
        type: 'meeting-starting',
        title: 'Meeting Scheduled',
        message: `Your meeting "${data.name}" has been scheduled`,
        meetingCode: data.code,
      });

      return meeting;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }

  async updateMeeting(code: string, updates: Partial<Meeting>): Promise<Meeting | null> {
    try {
      // PostgreSQL equivalent:
      // return await prisma.meeting.update({ where: { code }, data: updates });

      const meetings = await this.getAllMeetings();
      const meeting = meetings.find(m => m.code === code);

      if (!meeting) return null;

      const updatedMeeting = { ...meeting, ...updates, updatedAt: new Date().toISOString() };

      // Update in all storage locations
      ['my', 'scheduled', 'active'].forEach(location => {
        const key = this.storage.meetings + '-' + location;
        const rooms = JSON.parse(localStorage.getItem(key) || '[]');
        const index = rooms.findIndex((r: any) => r.code === code);
        if (index !== -1) {
          rooms[index] = updatedMeeting;
          localStorage.setItem(key, JSON.stringify(rooms));
        }
      });

      return updatedMeeting;
    } catch (error) {
      console.error('Error updating meeting:', error);
      return null;
    }
  }

  async deleteMeeting(code: string): Promise<boolean> {
    try {
      // PostgreSQL equivalent:
      // await prisma.meeting.delete({ where: { code } });

      ['my', 'scheduled', 'active'].forEach(location => {
        const key = this.storage.meetings + '-' + location;
        const rooms = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = rooms.filter((r: any) => r.code !== code);
        localStorage.setItem(key, JSON.stringify(filtered));
      });

      return true;
    } catch (error) {
      console.error('Error deleting meeting:', error);
      return false;
    }
  }

  async startMeeting(code: string): Promise<Meeting | null> {
    return await this.updateMeeting(code, { status: 'active' });
  }

  async endMeeting(code: string): Promise<Meeting | null> {
    return await this.updateMeeting(code, { status: 'ended' });
  }

  // ==================== MESSAGES ====================

  async createMessage(data: Omit<MeetingMessage, 'id' | 'timestamp' | 'read'>): Promise<MeetingMessage> {
    const message: MeetingMessage = {
      ...data,
      id: 'msg-' + Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    const key = this.storage.messages + '-' + data.meetingCode;
    const messages = JSON.parse(localStorage.getItem(key) || '[]');
    messages.push(message);
    localStorage.setItem(key, JSON.stringify(messages));

    return message;
  }

  async getMessages(meetingCode: string): Promise<MeetingMessage[]> {
    const key = this.storage.messages + '-' + meetingCode;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  async markMessageRead(_messageId: string): Promise<void> {
    // Implementation for marking messages as read
  }

  // ==================== NOTIFICATIONS ====================

  async createNotification(data: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<Notification> {
    const notification: Notification = {
      ...data,
      id: 'notif-' + Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    const notifications = JSON.parse(localStorage.getItem(this.storage.notifications) || '[]');
    notifications.unshift(notification); // Add to beginning
    localStorage.setItem(this.storage.notifications, JSON.stringify(notifications));

    return notification;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    // PostgreSQL equivalent:
    // return await prisma.notification.findMany({
    //   where: { userId },
    //   orderBy: { timestamp: 'desc' },
    //   take: 50
    // });

    const notifications = JSON.parse(localStorage.getItem(this.storage.notifications) || '[]');
    return notifications.filter((n: Notification) => n.userId === userId || !userId);
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const notifications = JSON.parse(localStorage.getItem(this.storage.notifications) || '[]');
    const notification = notifications.find((n: Notification) => n.id === notificationId);
    if (notification) {
      notification.read = true;
      localStorage.setItem(this.storage.notifications, JSON.stringify(notifications));
    }
  }

  async clearNotifications(_userId: string): Promise<void> {
    localStorage.setItem(this.storage.notifications, '[]');
  }

  // ==================== RECORDINGS ====================

  async saveRecording(data: Omit<Recording, 'id' | 'createdAt'>): Promise<Recording> {
    const recording: Recording = {
      ...data,
      id: 'rec-' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    const recordings = JSON.parse(localStorage.getItem(this.storage.recordings) || '[]');
    recordings.push(recording);
    localStorage.setItem(this.storage.recordings, JSON.stringify(recordings));

    return recording;
  }

  async getRecordings(meetingCode?: string): Promise<Recording[]> {
    const recordings = JSON.parse(localStorage.getItem(this.storage.recordings) || '[]');
    
    if (meetingCode) {
      return recordings.filter((r: Recording) => r.meetingCode === meetingCode);
    }
    
    return recordings;
  }

  async deleteRecording(id: string): Promise<boolean> {
    const recordings = JSON.parse(localStorage.getItem(this.storage.recordings) || '[]');
    const filtered = recordings.filter((r: Recording) => r.id !== id);
    localStorage.setItem(this.storage.recordings, JSON.stringify(filtered));
    return true;
  }

  // ==================== STATISTICS ====================

  async getStatistics(hostId?: string): Promise<{
    totalMeetings: number;
    activeMeetings: number;
    scheduledMeetings: number;
    totalParticipants: number;
    totalRecordings: number;
    storageUsed: number;
  }> {
    const meetings = await this.getAllMeetings(hostId);
    const recordings = await this.getRecordings();

    return {
      totalMeetings: meetings.length,
      activeMeetings: meetings.filter(m => m.status === 'active').length,
      scheduledMeetings: meetings.filter(m => m.status === 'scheduled').length,
      totalParticipants: meetings.reduce((sum, m) => sum + (m.participants || 0), 0),
      totalRecordings: recordings.length,
      storageUsed: recordings.reduce((sum, r) => sum + (r.size || 0), 0),
    };
  }
}

// Export singleton instance
export const meetingService = new MeetingService();
export default meetingService;
