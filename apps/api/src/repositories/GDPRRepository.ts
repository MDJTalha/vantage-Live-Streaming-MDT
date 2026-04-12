import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DataExportRequest {
  userId: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  exportUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  completedAt?: Date;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: string;
  granted: boolean;
  createdAt: Date;
  updatedAt: Date;
  withdrawnAt?: Date | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * GDPR Compliance Repository
 * Handles data export, deletion, and consent management
 */
export class GDPRRepository {
  /**
   * Create data export request
   */
  static async createExportRequest(userId: string): Promise<string> {
    const requestId = `export-${userId}-${Date.now()}`;

    await prisma.dataExportRequest.create({
      data: {
        id: requestId,
        userId,
        status: 'PENDING',
      },
    });

    return requestId;
  }

  /**
   * Get user data for export
   */
  static async getUserData(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roomsHosted: {
          include: {
            participants: true,
            messages: { take: 1000 },
            polls: true,
            questions: true,
            recordings: true,
          },
        },
        participations: {
          include: {
            meeting: true,
          },
        },
        messages: { take: 1000 },
        sessions: true,
        notifications: { take: 100 },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;

    return {
      user: safeUser,
      exportedAt: new Date().toISOString(),
      format: 'json',
    };
  }

  /**
   * Process and package export data
   */
  static async processExport(requestId: string): Promise<string> {
    const request = await prisma.dataExportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Export request not found');
    }

    // Update status to processing
    await prisma.dataExportRequest.update({
      where: { id: requestId },
      data: { status: 'PROCESSING' },
    });

    try {
      // Get user data
      const exportData = await this.getUserData(request.userId);

      // In production, create downloadable file in S3
      // For now, store JSON directly
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: 'READY',
        },
      });

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  /**
   * Delete user data (Right to be Forgotten)
   */
  static async deleteUser(userId: string): Promise<void> {
    const transaction = await prisma.$transaction(async (tx) => {
      // Delete user's sessions
      await tx.session.deleteMany({ where: { userId } });

      // Delete user's notifications
      await tx.notification.deleteMany({ where: { userId } });

      // Delete user's messages (anonymize instead of delete for conversation integrity)
      await tx.chatMessage.updateMany({
        where: { userId },
        data: {
          userId: null,
          guestName: '[Deleted User]',
        },
      });

      // Delete user's poll votes
      await tx.pollVote.deleteMany({ where: { userId } });

      // Delete user's questions
      await tx.question.deleteMany({ where: { userId } });

      // Transfer room ownership or delete rooms
      await tx.room.updateMany({
        where: { hostId: userId },
        data: { hostId: 'system' }, // Transfer to system account
      });

      // Delete participant records
      await tx.roomParticipant.deleteMany({ where: { userId } });

      // Finally, delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    return transaction;
  }

  /**
   * Record user consent
   */
  static async recordConsent(data: {
    userId: string;
    consentType: string;
    granted: boolean;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ConsentRecord> {
    // Withdraw any existing consent of same type
    await prisma.consentRecord.updateMany({
      where: {
        userId: data.userId,
        consentType: data.consentType,
        withdrawnAt: null,
      },
      data: { withdrawnAt: new Date() },
    });

    // Create new consent record
    return prisma.consentRecord.create({
      data: {
        userId: data.userId,
        consentType: data.consentType,
        granted: data.granted,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * Get user's current consents
   */
  static async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    return prisma.consentRecord.findMany({
      where: {
        userId,
        withdrawnAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Withdraw consent
   */
  static async withdrawConsent(userId: string, consentType: string): Promise<void> {
    await prisma.consentRecord.updateMany({
      where: {
        userId,
        consentType,
        withdrawnAt: null,
      },
      data: { withdrawnAt: new Date() },
    });
  }

  /**
   * Check if user has given consent
   */
  static async hasConsent(userId: string, consentType: string): Promise<boolean> {
    const consent = await prisma.consentRecord.findFirst({
      where: {
        userId,
        consentType,
        granted: true,
        withdrawnAt: null,
      },
    });

    return !!consent;
  }

  /**
   * Get consent audit log
   */
  static async getConsentAuditLog(userId: string): Promise<ConsentRecord[]> {
    return prisma.consentRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Anonymize user data (alternative to deletion)
   */
  static async anonymizeUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@deleted.vantage`,
        name: 'Deleted User',
        avatarUrl: null,
        emailVerified: false,
      },
    });
  }

  /**
   * Get data retention report
   */
  static async getDataRetentionReport(): Promise<{
    totalUsers: number;
    totalRooms: number;
    totalMessages: number;
    totalRecordings: number;
    dataByAge: Array<{ ageDays: number; count: number }>;
  }> {
    const totalUsers = await prisma.user.count();
    const totalRooms = await prisma.room.count();
    const totalMessages = await prisma.chatMessage.count();
    const totalRecordings = await prisma.recording.count();

    // Get data by age (simplified)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const olderUsers = await prisma.user.count({
      where: {
        createdAt: { gte: ninetyDaysAgo, lt: thirtyDaysAgo },
      },
    });

    const oldestUsers = totalUsers - recentUsers - olderUsers;

    return {
      totalUsers,
      totalRooms,
      totalMessages,
      totalRecordings,
      dataByAge: [
        { ageDays: 30, count: recentUsers },
        { ageDays: 90, count: olderUsers },
        { ageDays: 90, count: oldestUsers },
      ],
    };
  }

  /**
   * Cleanup old data based on retention policy
   */
  static async cleanupOldData(retentionDays: number = 365): Promise<void> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    // Delete old sessions
    await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { createdAt: { lt: cutoffDate } },
        ],
      },
    });

    // Delete old export requests
    await prisma.dataExportRequest.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    console.log(`Cleanup completed. Deleted data older than ${retentionDays} days.`);
  }
}

export default GDPRRepository;
