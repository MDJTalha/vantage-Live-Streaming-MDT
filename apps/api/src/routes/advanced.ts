import { Router, Request, Response } from 'express';
import { z } from 'zod';
import RecordingService from '../services/RecordingService';
import MediaProcessorService from '../services/MediaProcessorService';
import AnalyticsRepository from '../repositories/AnalyticsRepository';
import AuthMiddleware from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();
const recordingService = new RecordingService();
const mediaProcessorService = new MediaProcessorService();

// Validation schemas
const startRecordingSchema = z.object({
  roomId: z.string(),
  title: z.string(),
  outputFormat: z.enum(['mp4', 'webm', 'mkv']).optional(),
});

const startStreamSchema = z.object({
  roomId: z.string(),
  platform: z.enum(['youtube', 'twitch', 'facebook', 'custom']),
  streamKey: z.string(),
  rtmpUrl: z.string(),
});

/**
 * ============================================
 * Recording Routes
 * ============================================
 */

/**
 * POST /api/v1/recordings/start
 * Start recording a room
 */
router.post('/start', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, title, outputFormat } = startRecordingSchema.parse(req.body);

    const recordingId = await mediaProcessorService.startRecording({
      roomId,
      title,
      outputFormat,
    });

    res.json({
      success: true,
      data: { recordingId },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.errors },
      });
      return;
    }

    console.error('Error starting recording:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to start recording' },
    });
  }
});

/**
 * POST /api/v1/recordings/stop
 * Stop recording
 */
router.post('/stop', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { recordingId } = req.body;

    const recordingKey = await mediaProcessorService.stopRecording(recordingId);

    res.json({
      success: true,
      data: { recordingKey },
    });
  } catch (error: any) {
    console.error('Error stopping recording:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/v1/recordings/:roomId
 * List recordings for a room
 */
router.get('/:roomId', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;

    const recordings = await recordingService.listRecordings(roomId);

    res.json({
      success: true,
      data: recordings,
    });
  } catch (error: any) {
    console.error('Error listing recordings:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/v1/recordings/:roomId/:key/url
 * Get signed URL for recording playback
 */
router.get('/:roomId/:key/url', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const decodedKey = decodeURIComponent(key);

    const url = await recordingService.getRecordingUrl(decodedKey);

    res.json({
      success: true,
      data: { url },
    });
  } catch (error: any) {
    console.error('Error getting recording URL:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * DELETE /api/v1/recordings/:key
 * Delete recording
 */
router.delete('/:key', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const decodedKey = decodeURIComponent(key);

    await recordingService.deleteRecording(decodedKey);

    res.json({
      success: true,
      data: { message: 'Recording deleted' },
    });
  } catch (error: any) {
    console.error('Error deleting recording:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * ============================================
 * Live Streaming Routes
 * ============================================
 */

/**
 * POST /api/v1/stream/start
 * Start streaming to external platform
 */
router.post('/stream/start', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, platform, streamKey, rtmpUrl } = startStreamSchema.parse(req.body);

    const streamId = await mediaProcessorService.startStream(roomId, {
      platform,
      streamKey,
      rtmpUrl,
    });

    res.json({
      success: true,
      data: { streamId },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.errors },
      });
      return;
    }

    console.error('Error starting stream:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to start stream' },
    });
  }
});

/**
 * POST /api/v1/stream/stop
 * Stop streaming
 */
router.post('/stream/stop', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { streamId } = req.body;

    await mediaProcessorService.stopStream(streamId);

    res.json({
      success: true,
      data: { message: 'Stream stopped' },
    });
  } catch (error: any) {
    console.error('Error stopping stream:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/v1/stream/status
 * Get active streams
 */
router.get('/stream/status', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const recordings = mediaProcessorService.getActiveRecordings();
    const streams = mediaProcessorService.getActiveStreams();

    res.json({
      success: true,
      data: { recordings, streams },
    });
  } catch (error: any) {
    console.error('Error getting stream status:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * ============================================
 * Analytics Routes
 * ============================================
 */

/**
 * GET /api/v1/analytics/room/:roomId
 * Get room analytics
 */
router.get('/analytics/room/:roomId', AuthMiddleware.optional, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;

    const analytics = await AnalyticsRepository.getRoomAnalytics(roomId);

    if (!analytics) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Analytics not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error('Error getting room analytics:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/v1/analytics/dashboard
 * Get dashboard metrics
 */
router.get('/analytics/dashboard', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const metrics = await AnalyticsRepository.getDashboardMetrics(userId, Number(days));

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('Error getting dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/v1/analytics/activity
 * Get user activity stats
 */
router.get('/analytics/activity', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const activity = await AnalyticsRepository.getUserActivity(userId);

    res.json({
      success: true,
      data: activity,
    });
  } catch (error: any) {
    console.error('Error getting user activity:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

export default router;
