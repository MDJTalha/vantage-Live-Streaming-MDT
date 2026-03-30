import { Router, Request, Response } from 'express';
import { z } from 'zod';
import RoomService from '../services/RoomService';
import AuthMiddleware from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// ============================================
// 🔒 SECURITY FIX C-03: Input Validation Schemas
// Prevents SQL injection and NoSQL injection
// ============================================

// Room code validation - only alphanumeric and hyphens
const roomCodeSchema = z.string()
  .min(1, 'Room code is required')
  .max(50, 'Room code must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\-]+$/, 'Room code must contain only letters, numbers, and hyphens');

// Room ID validation - UUID format
const roomIdSchema = z.string()
  .min(1, 'Room ID is required')
  .max(50, 'Room ID must be less than 50 characters')
  .uuid('Invalid room ID format');

// Validation schemas
const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  settings: z.object({
    maxParticipants: z.number().min(2).max(500).optional(),
    allowChat: z.boolean().optional(),
    allowScreenShare: z.boolean().optional(),
    allowRecording: z.boolean().optional(),
    requirePassword: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    enableBreakoutRooms: z.boolean().optional(),
    enableWaitingRoom: z.boolean().optional(),
  }).optional(),
  password: z.string().min(4).max(50).optional(),
});

const joinRoomSchema = z.object({
  password: z.string().optional(),
  guestName: z.string().optional(),
});

/**
 * GET /api/v1/rooms
 * Get user's rooms
 */
router.get('/', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const rooms = await RoomService.getUserRooms(req.user.userId);

    res.json({
      success: true,
      data: rooms,
    });
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch rooms' },
    });
  }
});

/**
 * GET /api/v1/rooms/active
 * Get active rooms
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    const rooms = await RoomService.getActiveRooms();

    res.json({
      success: true,
      data: rooms,
    });
  } catch (error: any) {
    console.error('Error fetching active rooms:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch active rooms' },
    });
  }
});

/**
 * POST /api/v1/rooms
 * Create a new room
 */
router.post('/', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const { name, description, settings, password } = createRoomSchema.parse(req.body);

    const room = await RoomService.create({
      hostId: req.user.userId,
      name,
      description,
      settings,
      password,
    });

    res.status(201).json({
      success: true,
      data: room,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }

    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create room' },
    });
  }
});

/**
 * GET /api/v1/rooms/:roomCode
 * Get room by code
 * 🔒 SECURITY FIX C-03: Validates room code to prevent SQL injection
 */
router.get('/:roomCode', async (req: Request, res: Response) => {
  try {
    // 🔒 SECURITY FIX: Validate room code format
    const { roomCode } = roomCodeSchema.parse(req.params);

    const room = await RoomService.getByCode(roomCode);

    if (!room) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Room not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: room,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid room code format',
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        },
      });
      return;
    }

    console.error('Error fetching room:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch room' },
    });
  }
});

/**
 * POST /api/v1/rooms/:roomCode/join
 * Join a room
 */
router.post('/:roomCode/join', AuthMiddleware.optional, async (req: AuthRequest, res: Response) => {
  try {
    const { roomCode } = req.params;
    const { password, guestName } = joinRoomSchema.parse(req.body);

    const room = await RoomService.getByCode(roomCode);

    if (!room) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Room not found' },
      });
      return;
    }

    // Check if room is active
    if (room.status !== 'ACTIVE' && room.status !== 'SCHEDULED') {
      res.status(400).json({
        success: false,
        error: { code: 'ROOM_NOT_ACTIVE', message: 'Room is not active' },
      });
      return;
    }

    // Verify password if required
    if ((room.settings as any).requirePassword && password) {
      const isValid = await RoomService.verifyPassword(room.id, password);
      if (!isValid) {
        res.status(403).json({
          success: false,
          error: { code: 'INVALID_PASSWORD', message: 'Invalid room password' },
        });
        return;
      }
    }

    // Check if room is full
    const isFull = await RoomService.isRoomFull(room.id);
    if (isFull) {
      res.status(400).json({
        success: false,
        error: { code: 'ROOM_FULL', message: 'Room is full' },
      });
      return;
    }

    // Join room
    const participant = await RoomService.join(room.id, {
      userId: req.user?.userId,
      guestName: guestName || req.user?.email?.split('@')[0],
    });

    res.json({
      success: true,
      data: {
        room,
        participant,
      },
    });
  } catch (error: any) {
    console.error('Error joining room:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to join room' },
    });
  }
});

/**
 * POST /api/v1/rooms/:roomId/start
 * Start a room
 */
router.post('/:roomId/start', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const room = await RoomService.getById(roomId);

    if (!room || room.hostId !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only host can start the room' },
      });
      return;
    }

    const updatedRoom = await RoomService.start(roomId);

    res.json({
      success: true,
      data: updatedRoom,
    });
  } catch (error: any) {
    console.error('Error starting room:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to start room' },
    });
  }
});

/**
 * POST /api/v1/rooms/:roomId/end
 * End a room
 */
router.post('/:roomId/end', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const room = await RoomService.getById(roomId);

    if (!room || room.hostId !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only host can end the room' },
      });
      return;
    }

    const updatedRoom = await RoomService.end(roomId);

    res.json({
      success: true,
      data: updatedRoom,
    });
  } catch (error: any) {
    console.error('Error ending room:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to end room' },
    });
  }
});

/**
 * PATCH /api/v1/rooms/:roomId/settings
 * Update room settings
 */
router.patch('/:roomId/settings', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const room = await RoomService.getById(roomId);

    if (!room || room.hostId !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only host can update settings' },
      });
      return;
    }

    const updatedRoom = await RoomService.updateSettings(roomId, req.body);

    res.json({
      success: true,
      data: updatedRoom,
    });
  } catch (error: any) {
    console.error('Error updating room settings:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update settings' },
    });
  }
});

/**
 * POST /api/v1/rooms/:roomId/participants/:participantId/promote
 * Promote participant to co-host
 */
router.post('/:roomId/participants/:participantId/promote', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, participantId } = req.params;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const room = await RoomService.getById(roomId);

    if (!room || room.hostId !== req.user.userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only host can promote participants' },
      });
      return;
    }

    const participant = await RoomService.promoteToCohost(participantId);

    res.json({
      success: true,
      data: participant,
    });
  } catch (error: any) {
    console.error('Error promoting participant:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to promote participant' },
    });
  }
});

/**
 * DELETE /api/v1/rooms/:roomId/participants/:participantId
 * Remove participant from room
 */
router.delete('/:roomId/participants/:participantId', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, participantId } = req.params;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const room = await RoomService.getById(roomId);

    if (!room || (room.hostId !== req.user.userId && room.participants?.every(p => p.id !== participantId))) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only host or co-host can remove participants' },
      });
      return;
    }

    await RoomService.removeParticipant(participantId);

    res.json({
      success: true,
      data: { message: 'Participant removed' },
    });
  } catch (error: any) {
    console.error('Error removing participant:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to remove participant' },
    });
  }
});

export default router;
