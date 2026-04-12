import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';
import AuthMiddleware from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'recordings');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `recording-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit
});

// ==================== GET ALL RECORDINGS ====================
router.get('/', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.query;
    
    const recordings = await prisma.recording.findMany({
      where: meetingId ? { meetingId: meetingId as string } : { userId: req.user!.userId },
      include: {
        meeting: {
          select: {
            name: true,
            code: true,
          }
        },
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const recordingList = recordings.map(rec => ({
      id: rec.id,
      meetingId: rec.meetingId,
      meetingName: rec.meeting?.name || 'Unknown Meeting',
      meetingCode: rec.meeting?.code || '',
      userId: rec.userId,
      userName: rec.user?.name || 'Unknown',
      title: rec.title,
      description: rec.description,
      url: rec.url,
      thumbnailUrl: rec.thumbnailUrl,
      duration: rec.duration,
      size: rec.size,
      format: rec.format,
      status: rec.status,
      isPublic: rec.isPublic,
      downloadCount: rec.downloadCount,
      viewCount: rec.viewCount,
      createdAt: rec.createdAt,
      processedAt: rec.processedAt,
    }));

    return res.json({ recordings: recordingList });
  } catch (error: any) {
    console.error('Error fetching recordings:', error);
    return res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

// ==================== GET RECORDING BY ID ====================
router.get('/:id', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const recording = await prisma.recording.findUnique({
      where: { id },
      include: {
        meeting: {
          select: {
            name: true,
            code: true,
            hostId: true,
          }
        },
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    // Check permissions
    if (recording.userId !== req.user!.userId && recording.meeting?.hostId !== req.user!.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Increment view count
    await prisma.recording.update({
      where: { id },
      data: { viewCount: recording.viewCount + 1 }
    });

    return res.json({
      id: recording.id,
      meetingId: recording.meetingId,
      meetingName: recording.meeting?.name || 'Unknown Meeting',
      meetingCode: recording.meeting?.code || '',
      userId: recording.userId,
      userName: recording.user?.name || 'Unknown',
      title: recording.title,
      description: recording.description,
      url: recording.url,
      thumbnailUrl: recording.thumbnailUrl,
      duration: recording.duration,
      size: recording.size,
      format: recording.format,
      status: recording.status,
      isPublic: recording.isPublic,
      downloadCount: recording.downloadCount,
      viewCount: recording.viewCount + 1,
      createdAt: recording.createdAt,
      processedAt: recording.processedAt,
    });
  } catch (error: any) {
    console.error('Error fetching recording:', error);
    return res.status(500).json({ error: 'Failed to fetch recording' });
  }
});

// ==================== UPLOAD RECORDING ====================
router.post('/upload', AuthMiddleware.requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { meetingId, title, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get file info
    const stat = fs.statSync(req.file.path);
    const fileSize = stat.size;

    // Get video duration (simplified - in production use ffprobe)
    const duration = 0; // TODO: Extract actual duration

    // Create recording record
    const recording = await prisma.recording.create({
      data: {
        meetingId,
        userId: req.user!.userId,
        title: title || `Recording ${new Date().toLocaleString()}`,
        description: description || null,
        url: `/uploads/recordings/${req.file.filename}`,
        thumbnailUrl: null,
        duration,
        size: fileSize,
        format: path.extname(req.file.filename).slice(1),
        status: 'READY',
        isPublic: false,
      }
    });

    return res.status(201).json({
      id: recording.id,
      title: recording.title,
      url: recording.url,
      status: recording.status,
      createdAt: recording.createdAt,
    });
  } catch (error: any) {
    console.error('Error uploading recording:', error);
    return res.status(500).json({ error: 'Failed to upload recording' });
  }
});

// ==================== DELETE RECORDING ====================
router.delete('/:id', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const recording = await prisma.recording.findUnique({
      where: { id },
      include: {
        meeting: {
          select: {
            hostId: true,
          }
        }
      }
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    // Check permissions (owner or meeting host)
    if (recording.userId !== req.user!.userId && recording.meeting?.hostId !== req.user!.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file if exists
    const filePath = path.join(process.cwd(), recording.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update status to deleted
    await prisma.recording.update({
      where: { id },
      data: { status: 'DELETED' }
    });

    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting recording:', error);
    return res.status(500).json({ error: 'Failed to delete recording' });
  }
});

// ==================== GET DOWNLOAD URL ====================
router.get('/:id/download', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const recording = await prisma.recording.findUnique({
      where: { id }
    });

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    // Increment download count
    await prisma.recording.update({
      where: { id },
      data: { downloadCount: recording.downloadCount + 1 }
    });

    return res.json({
      url: recording.url,
      filename: `${recording.title}.${recording.format}`,
    });
  } catch (error: any) {
    console.error('Error getting download URL:', error);
    return res.status(500).json({ error: 'Failed to get download URL' });
  }
});

export default router;
