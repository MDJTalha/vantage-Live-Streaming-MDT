import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';
import AuthMiddleware from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// ==================== GET DASHBOARD ANALYTICS ====================
router.get('/dashboard', AuthMiddleware.requireAuth as any, async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  try {
    const { hostId } = req.query;
    const userId = hostId as string || user.userId;

    // Get meeting statistics
    const [totalMeetings, activeMeetings, scheduledMeetings, endedMeetings] = await Promise.all([
      prisma.meeting.count({ where: { hostId: userId } }),
      prisma.meeting.count({ where: { hostId: userId, status: 'ACTIVE' } }),
      prisma.meeting.count({ where: { hostId: userId, status: 'SCHEDULED' } }),
      prisma.meeting.count({ where: { hostId: userId, status: 'ENDED' } }),
    ]);

    // Get participant statistics
    const totalParticipants = await prisma.participation.aggregate({
      where: { meeting: { hostId: userId } },
      _count: true
    });

    // Get recording statistics
    const totalRecordings = await prisma.recording.count({
      where: { userId }
    });

    const recordingsSize = await prisma.recording.aggregate({
      where: { userId },
      _sum: { size: true }
    });

    // Get recent meetings
    const recentMeetings = await prisma.meeting.findMany({
      where: { hostId: userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { participations: true }
        }
      }
    });

    res.json({
      meetings: {
        total: totalMeetings,
        active: activeMeetings,
        scheduled: scheduledMeetings,
        ended: endedMeetings,
      },
      participants: {
        total: totalParticipants._count,
      },
      recordings: {
        total: totalRecordings,
        totalSize: recordingsSize._sum.size || 0,
      },
      recentMeetings: recentMeetings.map(m => ({
        id: m.id,
        name: m.name,
        code: m.code,
        status: m.status,
        participants: m._count.participations,
        scheduledAt: m.scheduledAt,
        createdAt: m.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// ==================== GET MEETING ANALYTICS ====================
router.get('/meetings/:meetingId', AuthMiddleware.requireAuth as any, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participations: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
              }
            }
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                name: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        reactions: {
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        recordings: true
      }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Calculate statistics
    const uniqueParticipants = new Set(meeting.participations.map(p => p.userId)).size;
    const totalMessages = meeting.messages.length;
    const totalReactions = meeting.reactions.length;
    const avgDuration = meeting.participations
      .filter(p => p.leftAt && p.joinedAt)
      .reduce((acc, p) => acc + (new Date(p.leftAt!).getTime() - new Date(p.joinedAt).getTime()), 0) / (uniqueParticipants || 1);

    return res.json({
      meeting: {
        id: meeting.id,
        name: meeting.name,
        code: meeting.code,
        status: meeting.status,
        scheduledAt: meeting.scheduledAt,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
      },
      statistics: {
        uniqueParticipants,
        totalMessages,
        totalReactions,
        avgDurationMs: Math.round(avgDuration),
        recordings: meeting.recordings.length,
      },
      participants: meeting.participations.map(p => ({
        id: p.id,
        name: p.guestName || p.user?.name,
        email: p.user?.email,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        duration: p.leftAt ? new Date(p.leftAt).getTime() - new Date(p.joinedAt).getTime() : null,
      })),
      recentMessages: meeting.messages.map(m => ({
        id: m.id,
        sender: m.sender?.name || 'Unknown',
        content: m.content,
        timestamp: m.createdAt,
      })),
      recentReactions: meeting.reactions.map(r => ({
        type: r.type,
        timestamp: r.createdAt,
      })),
      recordings: meeting.recordings.map(r => ({
        id: r.id,
        title: r.title,
        duration: r.duration,
        size: r.size,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching meeting analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch meeting analytics' });
  }
});

// ==================== GET USAGE ANALYTICS ====================
router.get('/usage', AuthMiddleware.requireAuth as any, async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  try {
    const { hostId } = req.query;
    const userId = hostId as string || user.userId;

    // Get current month's usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [meetingsThisMonth, participantsThisMonth, messagesThisMonth] = await Promise.all([
      prisma.meeting.count({
        where: {
          hostId: userId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          }
        }
      }),
      prisma.participation.count({
        where: {
          meeting: {
            hostId: userId,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            }
          }
        }
      }),
      prisma.message.count({
        where: {
          senderId: userId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          }
        }
      }),
    ]);

    // Get storage usage
    const storageUsage = await prisma.recording.aggregate({
      where: { userId },
      _sum: { size: true },
      _count: true
    });

    return res.json({
      period: {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
      },
      usage: {
        meetings: meetingsThisMonth,
        participants: participantsThisMonth,
        messages: messagesThisMonth,
        recordings: storageUsage._count,
        storageBytes: storageUsage._sum.size || 0,
        storageGB: (storageUsage._sum.size || 0) / (1024 * 1024 * 1024),
      },
    });
  } catch (error: any) {
    console.error('Error fetching usage analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch usage analytics' });
  }
});

// ==================== GET REVENUE ANALYTICS (ADMIN) ====================
router.get('/revenue', AuthMiddleware.requireAuth as any, async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  try {
    // Only for admin users
    if (user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get meetings by status
    const [activeMeetings, scheduledMeetings] = await Promise.all([
      prisma.meeting.count({ where: { status: 'ACTIVE' } }),
      prisma.meeting.count({ where: { status: 'SCHEDULED' } }),
    ]);

    // Get total recordings and storage
    const recordingsStats = await prisma.recording.aggregate({
      _count: true,
      _sum: { size: true }
    });

    return res.json({
      users: {
        total: totalUsers,
      },
      meetings: {
        active: activeMeetings,
        scheduled: scheduledMeetings,
      },
      recordings: {
        total: recordingsStats._count,
        totalSizeBytes: recordingsStats._sum.size || 0,
        totalSizeGB: (recordingsStats._sum.size || 0) / (1024 * 1024 * 1024),
      },
      period: {
        start: startOfYear.toISOString(),
        end: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching revenue analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

export default router;
