import { PrismaClient, RoomStatus, RoomRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export interface RoomSettings {
  maxParticipants: number;
  allowChat: boolean;
  allowScreenShare: boolean;
  allowRecording: boolean;
  requirePassword: boolean;
  password?: string;
  requireApproval: boolean;
  enableBreakoutRooms: boolean;
  enableWaitingRoom: boolean;
}

export interface RoomData {
  id: string;
  code: string;
  name: string;
  description?: string;
  hostId: string;
  status: RoomStatus;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  password?: string;
  host?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  participants?: RoomParticipantData[];
}

export interface RoomParticipantData {
  id: string;
  userId?: string;
  name: string;
  role: RoomRole;
  joinedAt: Date;
  isSpeaking: boolean;
  isVideoOff: boolean;
  isMuted: boolean;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

/**
 * Room Management Service
 * Handles room lifecycle and access control
 */
export class RoomService {
  /**
   * Create a new room
   */
  static async create(data: {
    hostId: string;
    name: string;
    description?: string;
    settings?: Partial<RoomSettings>;
    password?: string;
  }): Promise<RoomData> {
    const code = this.generateRoomCode();
    const password = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    const room = await prisma.room.create({
      data: {
        code,
        name: data.name,
        hostId: data.hostId,
        password,
        status: 'SCHEDULED' as const,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Add host as first participant
    await prisma.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: data.hostId,
        name: '',
        role: 'HOST' as RoomRole,
      },
    });

    return room as unknown as RoomData;
  }

  /**
   * Get room by code
   */
  static async getByCode(code: string): Promise<RoomData | null> {
    return prisma.room.findUnique({
      where: { code },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        participants: {
          where: { leftAt: null },
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
    }) as unknown as Promise<RoomData | null>;
  }

  /**
   * Get room by ID
   */
  static async getById(id: string): Promise<RoomData | null> {
    return prisma.room.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        participants: {
          where: { leftAt: null },
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
    }) as unknown as Promise<RoomData | null>;
  }

  /**
   * Verify room password
   */
  static async verifyPassword(roomId: string, password: string): Promise<boolean> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { password: true },
    });

    if (!room?.password) return true; // No password required

    return bcrypt.compare(password, room.password);
  }

  /**
   * Join room
   */
  static async join(roomId: string, data: {
    userId?: string;
    guestName?: string;
    guestEmail?: string;
  }): Promise<RoomParticipantData> {
    const participant = await prisma.roomParticipant.create({
      data: {
        roomId,
        userId: data.userId,
        name: data.guestName || '',
        role: 'PARTICIPANT' as RoomRole,
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

    return participant as unknown as RoomParticipantData;
  }

  /**
   * Leave room
   */
  static async leave(participantId: string): Promise<void> {
    await prisma.roomParticipant.update({
      where: { id: participantId },
      data: {
        leftAt: new Date(),
        isSpeaking: false,
        isVideoOff: false,
        isMuted: false,
      },
    });
  }

  /**
   * Start room
   */
  static async start(roomId: string): Promise<RoomData> {
    return prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'ACTIVE' as const,
        startedAt: new Date(),
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        participants: {
          where: { leftAt: null },
        },
      },
    }) as unknown as Promise<RoomData>;
  }

  /**
   * End room
   */
  static async end(roomId: string): Promise<RoomData> {
    // Mark all participants as left
    await prisma.roomParticipant.updateMany({
      where: { roomId },
      data: {
        leftAt: new Date(),
        isSpeaking: false,
        isVideoOff: false,
        isMuted: false,
      },
    });

    return prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'ENDED' as const,
        endedAt: new Date(),
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    }) as unknown as Promise<RoomData>;
  }

  /**
   * Update room settings
   */
  static async updateSettings(roomId: string, settings: Partial<RoomSettings>): Promise<RoomData> {
    return prisma.room.update({
      where: { id: roomId },
      data: {
        maxParticipants: settings.maxParticipants,
        allowChat: settings.allowChat,
        allowScreenShare: settings.allowScreenShare,
        allowRecording: settings.allowRecording,
        enableWaitingRoom: settings.enableWaitingRoom,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        participants: {
          where: { leftAt: null },
        },
      },
    }) as unknown as Promise<RoomData>;
  }

  /**
   * Promote participant to co-host
   */
  static async promoteToCohost(participantId: string): Promise<RoomParticipantData> {
    return prisma.roomParticipant.update({
      where: { id: participantId },
      data: { role: 'CO_HOST' as RoomRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    }) as unknown as RoomParticipantData;
  }

  /**
   * Demote co-host to participant
   */
  static async demoteToParticipant(participantId: string): Promise<RoomParticipantData> {
    return prisma.roomParticipant.update({
      where: { id: participantId },
      data: { role: 'PARTICIPANT' as RoomRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    }) as unknown as RoomParticipantData;
  }

  /**
   * Remove participant from room
   */
  static async removeParticipant(participantId: string): Promise<void> {
    await prisma.roomParticipant.update({
      where: { id: participantId },
      data: {
        leftAt: new Date(),
        isSpeaking: false,
        isVideoOff: false,
        isMuted: false,
      },
    });
  }

  /**
   * Get participant by ID
   */
  static async getParticipant(participantId: string): Promise<RoomParticipantData | null> {
    return prisma.roomParticipant.findUnique({
      where: { id: participantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    }) as unknown as Promise<RoomParticipantData | null>;
  }

  /**
   * Get participant by user and room
   */
  static async getParticipantByUserAndRoom(
    roomId: string,
    userId: string
  ): Promise<RoomParticipantData | null> {
    return prisma.roomParticipant.findFirst({
      where: { roomId, userId, leftAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    }) as unknown as Promise<RoomParticipantData | null>;
  }

  /**
   * Get all active participants in room
   */
  static async getActiveParticipants(roomId: string): Promise<RoomParticipantData[]> {
    return prisma.roomParticipant.findMany({
      where: { roomId, leftAt: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    }) as unknown as Promise<RoomParticipantData[]>;
  }

  /**
   * Get participant count
   */
  static async getParticipantCount(roomId: string): Promise<number> {
    return prisma.roomParticipant.count({
      where: { roomId, leftAt: null },
    });
  }

  /**
   * Check if room is full
   */
  static async isRoomFull(roomId: string): Promise<boolean> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { maxParticipants: true },
    });

    if (!room) return true;

    const count = await this.getParticipantCount(roomId);

    return count >= room.maxParticipants;
  }

  /**
   * Get user's rooms
   */
  static async getUserRooms(userId: string): Promise<RoomData[]> {
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
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            participants: {
              where: { leftAt: null },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' as const },
    }) as unknown as Promise<RoomData[]>;
  }

  /**
   * Get active rooms
   */
  static async getActiveRooms(): Promise<RoomData[]> {
    return prisma.room.findMany({
      where: { status: 'ACTIVE' as const },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            participants: {
              where: { leftAt: null },
            },
          },
        },
      },
    }) as unknown as Promise<RoomData[]>;
  }

  /**
   * Delete room
   */
  static async delete(roomId: string): Promise<void> {
    // First end the room if active
    await this.end(roomId);
    
    // Then delete
    await prisma.room.delete({
      where: { id: roomId },
    });
  }

  /**
   * Generate unique room code
   */
  private static generateRoomCode(): string {
    const adjectives = ['swift', 'calm', 'bright', 'wise', 'bold', 'keen', 'free', 'true', 'quick', 'smart'];
    const nouns = ['eagle', 'tiger', 'wolf', 'hawk', 'lion', 'bear', 'fox', 'owl', 'shark', 'dragon'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    
    return `${adjective}-${noun}-${number}`;
  }
}

export default RoomService;
