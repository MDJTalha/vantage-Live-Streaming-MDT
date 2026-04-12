import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';
import AuthMiddleware from '../middleware/auth';

const router = Router();

// ==================== GET ALL MEETINGS ====================
router.get('/', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { hostId } = req.query;
    
    const meetings = await prisma.meeting.findMany({
      where: hostId ? { hostId: hostId as string } : {},
      include: {
        _count: {
          select: { participations: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const meetingList = meetings.map(meeting => ({
      id: meeting.id,
      name: meeting.name,
      code: meeting.code,
      hostId: meeting.hostId,
      status: meeting.status,
      participants: meeting._count.participations,
      scheduledAt: meeting.scheduledAt,
      duration: meeting.duration,
      maxParticipants: meeting.maxParticipants,
      settings: {
        allowChat: meeting.allowChat,
        allowScreenShare: meeting.allowScreenShare,
        allowRecording: meeting.allowRecording,
        requirePassword: !!meeting.passwordHash,
        enableWaitingRoom: meeting.enableWaitingRoom,
      },
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    }));

    return res.json({ meetings: meetingList });
  } catch (error: any) {
    console.error('Error fetching meetings:', error);
    return res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// ==================== GET MEETING BY CODE ====================
router.get('/:code', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    const meeting = await prisma.meeting.findUnique({
      where: { code },
      include: {
        _count: {
          select: { participations: true }
        }
      }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    return res.json({
      id: meeting.id,
      name: meeting.name,
      code: meeting.code,
      hostId: meeting.hostId,
      status: meeting.status,
      participants: meeting._count.participations,
      scheduledAt: meeting.scheduledAt,
      duration: meeting.duration,
      maxParticipants: meeting.maxParticipants,
      settings: {
        allowChat: meeting.allowChat,
        allowScreenShare: meeting.allowScreenShare,
        allowRecording: meeting.allowRecording,
        requirePassword: !!meeting.passwordHash,
        enableWaitingRoom: meeting.enableWaitingRoom,
      },
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    });
  } catch (error: any) {
    console.error('Error fetching meeting:', error);
    return res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// ==================== CREATE MEETING ====================
router.post('/', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      name,
      scheduledAt,
      duration,
      maxParticipants,
      password,
      allowChat,
      allowScreenShare,
      allowRecording,
      enableWaitingRoom,
    } = req.body;

    // Generate unique 6-character code
    const code = await generateUniqueCode();

    const meeting = await prisma.meeting.create({
      data: {
        code,
        name,
        hostId: req.user!.userId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        duration,
        maxParticipants: maxParticipants || 100,
        passwordHash: password,
        allowChat: allowChat ?? true,
        allowScreenShare: allowScreenShare ?? true,
        allowRecording: allowRecording ?? true,
        enableWaitingRoom: enableWaitingRoom ?? false,
        status: scheduledAt ? 'SCHEDULED' : 'ACTIVE',
      },
      include: {
        _count: {
          select: { participations: true }
        }
      }
    });

    res.status(201).json({
      id: meeting.id,
      name: meeting.name,
      code: meeting.code,
      hostId: meeting.hostId,
      status: meeting.status,
      participants: meeting._count.participations,
      scheduledAt: meeting.scheduledAt,
      duration: meeting.duration,
      maxParticipants: meeting.maxParticipants,
      settings: {
        allowChat: meeting.allowChat,
        allowScreenShare: meeting.allowScreenShare,
        allowRecording: meeting.allowRecording,
        requirePassword: !!meeting.passwordHash,
        enableWaitingRoom: meeting.enableWaitingRoom,
      },
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    });
    return;
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// ==================== UPDATE MEETING ====================
router.patch('/:code', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const updateData = req.body;

    // Remove code from update data (can't change code)
    delete updateData.code;

    const meeting = await prisma.meeting.update({
      where: { code },
      data: updateData,
      include: {
        _count: {
          select: { participations: true }
        }
      }
    });

    res.json({
      id: meeting.id,
      name: meeting.name,
      code: meeting.code,
      hostId: meeting.hostId,
      status: meeting.status,
      participants: meeting._count.participations,
      scheduledAt: meeting.scheduledAt,
      duration: meeting.duration,
      maxParticipants: meeting.maxParticipants,
      settings: {
        allowChat: meeting.allowChat,
        allowScreenShare: meeting.allowScreenShare,
        allowRecording: meeting.allowRecording,
        requirePassword: !!meeting.passwordHash,
        enableWaitingRoom: meeting.enableWaitingRoom,
      },
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    });
    return;
  } catch (error: any) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// ==================== DELETE MEETING ====================
router.delete('/:code', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    await prisma.meeting.delete({
      where: { code }
    });

    res.status(204).send();
    return;
  } catch (error: any) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// ==================== GET STATISTICS ====================
router.get('/statistics', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { hostId } = req.query;
    
    if (!hostId) {
      return res.status(400).json({ error: 'hostId is required' });
    }

    const [totalMeetings, activeMeetings, scheduledMeetings, totalParticipants] = await Promise.all([
      prisma.meeting.count({ where: { hostId: hostId as string } }),
      prisma.meeting.count({ where: { hostId: hostId as string, status: 'ACTIVE' } }),
      prisma.meeting.count({ where: { hostId: hostId as string, status: 'SCHEDULED' } }),
      prisma.participation.aggregate({
        where: { meeting: { hostId: hostId as string } },
        _count: true
      }),
    ]);

    return res.json({
      totalMeetings,
      activeMeetings,
      scheduledMeetings,
      totalParticipants: totalParticipants._count,
      totalRecordings: 0, // TODO: Implement
      storageUsed: 0, // TODO: Implement
    });
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ==================== HELPER FUNCTIONS ====================

async function generateUniqueCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code: string;
  let exists: boolean;

  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    exists = await prisma.meeting.findUnique({ where: { code } }).then(m => !!m);
  } while (exists);

  return code;
}

export default router;
