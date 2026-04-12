import { PrismaClient, MessageType } from '@prisma/client';

const prisma = new PrismaClient();

export class MessageRepository {
  /**
   * Create message
   */
  static async create(data: {
    roomId: string;
    userId?: string;
    guestName?: string;
    content: string;
    messageType?: MessageType;
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
   * Get messages by room
   */
  static async getByRoom(roomId: string, options?: {
    limit?: number;
    before?: Date;
    after?: Date;
  }) {
    const { limit = 50, before, after } = options || {};

    const where: any = { roomId };
    
    if (before) {
      where.createdAt = { ...where.createdAt, lt: before };
    }
    if (after) {
      where.createdAt = { ...where.createdAt, gt: after };
    }

    return prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
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
   * Get message by ID
   */
  static async getById(id: string) {
    return prisma.chatMessage.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        parent: {
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
   * Delete message
   */
  static async delete(id: string) {
    return prisma.chatMessage.delete({
      where: { id },
    });
  }

  /**
   * Get message count for room
   */
  static async getCount(roomId: string) {
    return prisma.chatMessage.count({
      where: { roomId },
    });
  }

  /**
   * Get recent messages
   */
  static async getRecent(roomId: string, limit: number = 10) {
    return prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: limit,
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
}

export default MessageRepository;
