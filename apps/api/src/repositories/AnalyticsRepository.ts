import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnalyticsData {
  roomId: string;
  totalParticipants: number;
  peakConcurrent: number;
  totalDuration: number;
  chatMessages: number;
  polls: number;
  questions: number;
  recordings: number;
  engagement: {
    averageWatchTime: number;
    pollParticipation: number;
    questionCount: number;
    reactionCount: number;
  };
}

export interface DashboardMetrics {
  totalMeetings: number;
  totalParticipants: number;
  totalDuration: number;
  activeUsers: number;
  storageUsed: number;
  meetingsByDay: Array<{ date: string; count: number }>;
  topRooms: Array<{ id: string; name: string; participants: number }>;
}

/**
 * Analytics Repository
 * Handles analytics data aggregation and reporting
 */
export class AnalyticsRepository {
  /**
   * Get room analytics
   */
  static async getRoomAnalytics(roomId: string): Promise<AnalyticsData | null> {
    const analytics = await prisma.roomAnalytics.findUnique({
      where: { roomId },
    });

    if (!analytics) {
      return null;
    }

    return {
      roomId: analytics.roomId,
      totalParticipants: analytics.totalParticipants,
      peakConcurrent: analytics.peakConcurrent,
      totalDuration: analytics.totalDuration,
      chatMessages: analytics.chatMessages,
      polls: 0, // Would need to query polls table
      questions: 0, // Would need to query questions table
      recordings: 0, // Would need to query recordings table
      engagement: analytics.engagementMetrics as any,
    };
  }

  /**
   * Get dashboard metrics
   */
  static async getDashboardMetrics(userId: string, days: number = 30): Promise<DashboardMetrics> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get user's rooms
    const rooms = await prisma.room.findMany({
      where: {
        hostId: userId,
        createdAt: { gte: startDate },
      },
      include: {
        analytics: true,
      },
    });

    // Aggregate metrics
    const totalMeetings = rooms.length;
    const totalParticipants = rooms.reduce((sum, room) => sum + (room.analytics?.totalParticipants || 0), 0);
    const totalDuration = rooms.reduce((sum, room) => sum + (room.analytics?.totalDuration || 0), 0);
    const storageUsed = 0; // Would need to query S3

    // Meetings by day
    const meetingsByDay: Array<{ date: string; count: number }> = [];
    const dayMap = new Map<string, number>();

    rooms.forEach(room => {
      const date = room.createdAt.toISOString().split('T')[0];
      dayMap.set(date, (dayMap.get(date) || 0) + 1);
    });

    dayMap.forEach((count, date) => {
      meetingsByDay.push({ date, count });
    });

    meetingsByDay.sort((a, b) => a.date.localeCompare(b.date));

    // Top rooms by participants
    const topRooms = rooms
      .map(room => ({
        id: room.id,
        name: room.name,
        participants: room.analytics?.totalParticipants || 0,
      }))
      .sort((a, b) => b.participants - a.participants)
      .slice(0, 10);

    return {
      totalMeetings,
      totalParticipants,
      totalDuration,
      activeUsers: 0, // Would need to query active users
      storageUsed,
      meetingsByDay,
      topRooms,
    };
  }

  /**
   * Update room analytics
   */
  static async updateRoomAnalytics(
    roomId: string,
    data: Partial<{
      totalParticipants: number;
      peakConcurrent: number;
      totalDuration: number;
      chatMessages: number;
      engagementMetrics: any;
    }>
  ): Promise<void> {
    await prisma.roomAnalytics.upsert({
      where: { roomId },
      create: {
        roomId,
        totalParticipants: data.totalParticipants || 0,
        peakConcurrent: data.peakConcurrent || 0,
        totalDuration: data.totalDuration || 0,
        chatMessages: data.chatMessages || 0,
        engagementMetrics: data.engagementMetrics || {},
      },
      update: {
        totalParticipants: data.totalParticipants,
        peakConcurrent: data.peakConcurrent,
        totalDuration: data.totalDuration,
        chatMessages: data.chatMessages,
        engagementMetrics: data.engagementMetrics,
      },
    });
  }

  /**
   * Increment participant count
   */
  static async incrementParticipants(roomId: string): Promise<void> {
    await prisma.roomAnalytics.update({
      where: { roomId },
      data: {
        totalParticipants: { increment: 1 },
      },
    });
  }

  /**
   * Update peak concurrent
   */
  static async updatePeakConcurrent(roomId: string, count: number): Promise<void> {
    await prisma.roomAnalytics.update({
      where: { roomId },
      data: {
        peakConcurrent: { max: count },
      },
    });
  }

  /**
   * Increment chat messages
   */
  static async incrementChatMessages(roomId: string): Promise<void> {
    await prisma.roomAnalytics.update({
      where: { roomId },
      data: {
        chatMessages: { increment: 1 },
      },
    });
  }

  /**
   * Get user activity stats
   */
  static async getUserActivity(userId: string): Promise<{
    meetingsHosted: number;
    meetingsJoined: number;
    totalDuration: number;
    lastActive: Date | null;
  }> {
    const hostedRooms = await prisma.room.count({
      where: { hostId: userId },
    });

    const joinedRooms = await prisma.roomParticipant.count({
      where: { userId },
    });

    const roomAnalytics = await prisma.roomAnalytics.findMany({
      where: {
        room: {
          OR: [
            { hostId: userId },
            { participants: { some: { userId } } },
          ],
        },
      },
    });

    const totalDuration = roomAnalytics.reduce((sum, a) => sum + a.totalDuration, 0);

    const lastParticipant = await prisma.roomParticipant.findFirst({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
    });

    return {
      meetingsHosted: hostedRooms,
      meetingsJoined: joinedRooms,
      totalDuration,
      lastActive: lastParticipant?.joinedAt || null,
    };
  }
}

export default AnalyticsRepository;
