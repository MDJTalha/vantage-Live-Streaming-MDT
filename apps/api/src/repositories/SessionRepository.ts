import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SessionRepository {
  /**
   * Create session
   */
  static async create(data: {
    userId: string;
    tokenHash: string;
    refreshToken: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
    provider?: string;
  }) {
    return prisma.session.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        refreshToken: data.refreshToken,
        refreshTokenHash: data.refreshTokenHash,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        provider: data.provider,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get session by token hash
   */
  static async getByToken(tokenHash: string) {
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
   * Get session by refresh token hash
   */
  static async getByRefreshToken(refreshTokenHash: string) {
    return prisma.session.findUnique({
      where: { tokenHash: refreshTokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get all sessions for user
   */
  static async getUserSessions(userId: string) {
    return prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete session
   */
  static async delete(sessionId: string) {
    return prisma.session.delete({
      where: { id: sessionId },
    });
  }

  /**
   * Delete session by token hash
   */
  static async deleteByToken(tokenHash: string) {
    return prisma.session.delete({
      where: { tokenHash },
    });
  }

  /**
   * Delete all sessions for user
   */
  static async deleteAllForUser(userId: string) {
    return prisma.session.deleteMany({
      where: { userId },
    });
  }

  /**
   * Delete expired sessions
   */
  static async deleteExpired() {
    return prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Update session
   */
  static async update(sessionId: string, data: {
    tokenHash?: string;
    refreshTokenHash?: string;
    expiresAt?: Date;
  }) {
    return prisma.session.update({
      where: { id: sessionId },
      data,
    });
  }

  /**
   * Count active sessions for user
   */
  static async countActiveSessions(userId: string) {
    return prisma.session.count({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Get sessions by IP address
   */
  static async getByIpAddress(ipAddress: string, limit: number = 10) {
    return prisma.session.findMany({
      where: { ipAddress },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Cleanup old sessions (call periodically)
   */
  static async cleanup() {
    return this.deleteExpired();
  }
}

export default SessionRepository;
