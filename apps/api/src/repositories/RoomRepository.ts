import { PrismaClient, RoomStatus, RoomRole } from '@prisma/client';

const prisma = new PrismaClient();

export class RoomRepository {
  /**
   * Find room by ID
   */
  static async findById(id: string) {
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
      },
    });
  }

  /**
   * Find room by room code
   */
  static async findByCode(code: string) {
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
                email: true,
              },
            },
          },
        },
        analytics: true,
      },
    });
  }

  /**
   * Create room
   */
  static async create(data: {
    code: string;
    name: string;
    hostId: string;
    passwordHash?: string;
  }) {
    return prisma.room.create({
      data: {
        code: data.code,
        name: data.name,
        hostId: data.hostId,
        password: data.passwordHash,
        status: 'SCHEDULED',
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
   * Update room
   */
  static async update(id: string, data: Partial<{
    name: string;
    description: string;
    status: RoomStatus;
    startedAt: Date;
    endedAt: Date;
  }>) {
    return prisma.room.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete room
   */
  static async delete(id: string) {
    return prisma.room.delete({
      where: { id },
    });
  }

  /**
   * Update room status
   */
  static async updateStatus(id: string, status: RoomStatus) {
    const updateData: any = { status };
    
    if (status === 'ACTIVE') {
      updateData.startedAt = new Date();
    } else if (status === 'ENDED') {
      updateData.endedAt = new Date();
    }

    return prisma.room.update({
      where: { id },
      data: updateData,
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
        _count: {
          select: {
            participants: {
              where: { leftAt: null },
            },
          },
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
        _count: {
          select: {
            participants: {
              where: { leftAt: null },
            },
          },
        },
      },
    });
  }

  /**
   * Get scheduled rooms
   */
  static async getScheduledRooms() {
    return prisma.room.findMany({
      where: { status: 'SCHEDULED' },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Add participant to room
   */
  static async addParticipant(roomId: string, data: {
    userId?: string;
    name: string;
    role?: RoomRole;
  }) {
    return prisma.roomParticipant.create({
      data: {
        roomId,
        userId: data.userId,
        name: data.name,
        role: (data.role || 'PARTICIPANT') as RoomRole,
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
        isVideoOff: false,
        isMuted: false,
      },
    });
  }

  /**
   * Get participant by ID
   */
  static async getParticipant(participantId: string) {
    return prisma.roomParticipant.findUnique({
      where: { id: participantId },
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
   * Update participant
   */
  static async updateParticipant(participantId: string, data: {
    role?: RoomRole;
    isSpeaking?: boolean;
    isVideoOff?: boolean;
    isMuted?: boolean;
    isHandRaised?: boolean;
  }) {
    return prisma.roomParticipant.update({
      where: { id: participantId },
      data,
    });
  }

  /**
   * Get participant count in room
   */
  static async getParticipantCount(roomId: string) {
    return prisma.roomParticipant.count({
      where: {
        roomId,
        leftAt: null,
      },
    });
  }

  /**
   * Check if user is in room
   */
  static async isUserInRoom(roomId: string, userId: string) {
    const participant = await prisma.roomParticipant.findFirst({
      where: {
        roomId,
        userId,
        leftAt: null,
      },
    });
    return !!participant;
  }

  /**
   * Get participant by user and room
   */
  static async getParticipantByUserAndRoom(roomId: string, userId: string) {
    return prisma.roomParticipant.findFirst({
      where: {
        roomId,
        userId,
        leftAt: null,
      },
    });
  }
}

export default RoomRepository;
