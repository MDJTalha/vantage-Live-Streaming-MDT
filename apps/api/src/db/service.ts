import { PrismaClient } from '@prisma/client';
import { IncludePatterns, getPaginationParams, getPaginationMeta, QueryMonitor, batchFetch, mapResults } from '../utils/database';
import { Logger } from '../utils/errors';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export class DatabaseService {
  /**
   * Health check for database connection
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get user by email (optimized)
   */
  static async getUserByEmail(email: string) {
    return QueryMonitor.monitor('getUserByEmail', () =>
      prisma.user.findUnique({
        where: { email },
        select: IncludePatterns.user.withStats,
      })
    );
  }

  /**
   * Get user by ID (optimized)
   */
  static async getUserById(id: string) {
    return QueryMonitor.monitor('getUserById', () =>
      prisma.user.findUnique({
        where: { id },
        select: IncludePatterns.user.withStats,
      })
    );
  }

  /**
   * Create a new user
   */
  static async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    role?: string;
  }) {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Get room by room code (optimized - prevents N+1 for participants)
   */
  static async getRoomByCode(roomCode: string) {
    return QueryMonitor.monitor('getRoomByCode', () =>
      prisma.room.findUnique({
        where: { roomCode },
        select: {
          ...IncludePatterns.room.basic,
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          // Limited participants to prevent loading all for large rooms
          _count: {
            select: {
              participants: true,
              messages: true,
              polls: true,
            },
          },
        },
      })
    );
  }

  /**
   * Get room by ID with detailed info (optimized)
   */
  static async getRoomById(id: string) {
    return QueryMonitor.monitor('getRoomById', () =>
      prisma.room.findUnique({
        where: { id },
        select: {
          ...IncludePatterns.room.basic,
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          status: true,
          analytics: true,
          _count: {
            select: {
              participants: true,
              messages: true,
              polls: true,
              recordings: true,
            },
          },
        },
      })
    );
  }

  /**
   * Create a new room
   */
  static async createRoom(data: {
    roomCode: string;
    name: string;
    description?: string;
    hostId: string;
    settings?: any;
    passwordHash?: string;
  }) {
    return prisma.room.create({
      data: {
        ...data,
        settings: data.settings || {},
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Update room status
   */
  static async updateRoomStatus(roomId: string, status: string) {
    return prisma.room.update({
      where: { id: roomId },
      data: {
        status,
        startedAt: status === 'ACTIVE' ? new Date() : undefined,
        endedAt: status === 'ENDED' ? new Date() : undefined,
      },
    });
  }

  /**
   * Add participant to room
   */
  static async addParticipant(roomId: string, data: {
    userId?: string;
    guestName?: string;
    guestEmail?: string;
    role?: string;
  }) {
    return prisma.roomParticipant.create({
      data: {
        roomId,
        ...data,
        role: data.role || 'PARTICIPANT',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Remove participant from room
   */
  static async removeParticipant(participantId: string) {
    return prisma.roomParticipant.update({
      where: { id: participantId },
      data: {
        leftAt: new Date(),
        isSpeaking: false,
        isVideoEnabled: false,
        isAudioEnabled: false,
      },
    });
  }

  /**
   * Get active participants in room
   */
  static async getActiveParticipants(roomId: string) {
    return prisma.roomParticipant.findMany({
      where: {
        roomId,
        leftAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * Create chat message
   */
  static async createMessage(data: {
    roomId: string;
    userId?: string;
    guestName?: string;
    content: string;
    messageType?: string;
    parentId?: string;
  }) {
    return prisma.chatMessage.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Get chat messages for room
   */
  static async getMessages(roomId: string, limit: number = 50) {
    return prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create session for user
   */
  static async createSession(data: {
    userId: string;
    tokenHash: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.session.create({
      data,
    });
  }

  /**
   * Get session by token
   */
  static async getSessionByToken(tokenHash: string) {
    return prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Delete expired sessions
   */
  static async deleteExpiredSessions() {
    return prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Update participant media state
   */
  static async updateParticipantMedia(
    participantId: string,
    data: {
      isSpeaking?: boolean;
      isVideoEnabled?: boolean;
      isAudioEnabled?: boolean;
    }
  ) {
    return prisma.roomParticipant.update({
      where: { id: participantId },
      data,
    });
  }

  /**
   * Create poll
   */
  static async createPoll(data: {
    roomId: string;
    question: string;
    options: any;
    multipleChoice: boolean;
    createdBy: string;
  }) {
    return prisma.poll.create({
      data,
    });
  }

  /**
   * Vote on poll
   */
  static async voteOnPoll(pollId: string, data: {
    optionId: string;
    userId?: string;
    guestId?: string;
  }) {
    return prisma.pollVote.create({
      data: {
        pollId,
        ...data,
      },
    });
  }

  /**
   * Get poll with votes
   */
  static async getPollWithVotes(pollId: string) {
    return prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        votes: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Create recording
   */
  static async createRecording(data: {
    roomId: string;
    url: string;
    duration: number;
    sizeBytes?: bigint;
  }) {
    return prisma.recording.create({
      data,
    });
  }

  /**
   * Update recording status
   */
  static async updateRecordingStatus(recordingId: string, status: string) {
    return prisma.recording.update({
      where: { id: recordingId },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }

  /**
   * Get user's rooms
   */
  static async getUserRooms(userId: string) {
    return prisma.room.findMany({
      where: {
        OR: [
          { hostId: userId },
          {
            participants: {
              some: { userId },
            },
          },
        ],
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          where: { userId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get active rooms
   */
  static async getActiveRooms() {
    return prisma.room.findMany({
      where: { status: 'ACTIVE' },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          where: { leftAt: null },
        },
      },
    });
  }

  /**
   * Increment analytics
   */
  static async incrementAnalytics(roomId: string, field: string, by: number = 1) {
    return prisma.roomAnalytics.update({
      where: { roomId },
      data: {
        [field]: {
          increment: by,
        },
      },
    });
  }
}

export default DatabaseService;
