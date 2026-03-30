import { PrismaClient, MessageType } from '@prisma/client';

const prisma = new PrismaClient();

export interface ChatMessage {
  id: string;
  roomId: string;
  userId?: string;
  guestName?: string;
  content: string;
  messageType: MessageType;
  reactions: any[];
  parentId?: string;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

/**
 * Chat Repository
 * Handles chat message operations
 */
export class ChatRepository {
  /**
   * Create chat message
   */
  static async create(data: {
    roomId: string;
    userId?: string;
    guestName?: string;
    content: string;
    messageType?: MessageType;
    parentId?: string;
  }): Promise<ChatMessage> {
    return prisma.chatMessage.create({
      data: {
        roomId: data.roomId,
        userId: data.userId,
        guestName: data.guestName,
        content: data.content,
        messageType: data.messageType || 'TEXT',
        parentId: data.parentId,
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
   * Get messages by room with pagination
   */
  static async getByRoom(roomId: string, options?: {
    limit?: number;
    before?: Date;
    after?: Date;
  }): Promise<ChatMessage[]> {
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
      },
    });
  }

  /**
   * Get message by ID
   */
  static async getById(id: string): Promise<ChatMessage | null> {
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
   * Update message reactions
   */
  static async updateReactions(messageId: string, reactions: any[]): Promise<ChatMessage> {
    return prisma.chatMessage.update({
      where: { id: messageId },
      data: { reactions },
    });
  }

  /**
   * Add reaction to message
   */
  static async addReaction(messageId: string, userId: string, emoji: string): Promise<ChatMessage> {
    const message = await this.getById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    const reactions = message.reactions as any[] || [];
    
    // Check if user already reacted with this emoji
    const existingIndex = reactions.findIndex(
      (r) => r.userId === userId && r.emoji === emoji
    );

    if (existingIndex >= 0) {
      // Remove reaction (toggle off)
      reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      reactions.push({ userId, emoji, timestamp: new Date() });
    }

    return this.updateReactions(messageId, reactions);
  }

  /**
   * Delete message
   */
  static async delete(id: string): Promise<ChatMessage> {
    return prisma.chatMessage.delete({
      where: { id },
    });
  }

  /**
   * Get message count for room
   */
  static async getCount(roomId: string): Promise<number> {
    return prisma.chatMessage.count({
      where: { roomId },
    });
  }

  /**
   * Delete all messages in room
   */
  static async deleteByRoom(roomId: string): Promise<void> {
    await prisma.chatMessage.deleteMany({
      where: { roomId },
    });
  }

  /**
   * Search messages
   */
  static async search(roomId: string, query: string, limit: number = 20): Promise<ChatMessage[]> {
    return prisma.chatMessage.findMany({
      where: {
        roomId,
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
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

export default ChatRepository;
