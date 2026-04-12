import { Router, Response } from 'express';
import { z } from 'zod';
import ChatRepository from '../repositories/ChatRepository';
import AuthMiddleware from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const createMessageSchema = z.object({
  roomId: z.string(),
  content: z.string().min(1).max(1000),
  messageType: z.enum(['TEXT', 'EMOJI', 'SYSTEM', 'FILE', 'IMAGE']).optional(),
  parentId: z.string().optional(),
});

/**
 * GET /api/v1/chat/:roomId
 * Get messages for a room
 */
router.get('/:roomId', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before, after } = req.query;

    const messages = await ChatRepository.getByRoom(roomId, {
      limit: Number(limit),
      before: before ? new Date(before as string) : undefined,
      after: after ? new Date(after as string) : undefined,
    });

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch messages',
      },
    });
  }
});

/**
 * POST /api/v1/chat
 * Create a new message
 */
router.post('/', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, content, messageType, parentId } = createMessageSchema.parse(req.body);

    const message = await ChatRepository.create({
      roomId,
      userId: req.user?.userId,
      content,
      type: messageType || 'TEXT',
      parentId,
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
      return;
    }

    console.error('Error creating message:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create message',
      },
    });
  }
});

/**
 * DELETE /api/v1/chat/:messageId
 * Delete a message
 */
router.delete('/:messageId', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;

    await ChatRepository.delete(messageId);

    res.json({
      success: true,
      data: { message: 'Message deleted' },
    });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete message',
      },
    });
  }
});

/**
 * GET /api/v1/chat/:roomId/search
 * Search messages
 */
router.get('/:roomId/search', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const { q, limit = 20 } = req.query;

    if (!q) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search query is required',
        },
      });
      return;
    }

    const messages = await ChatRepository.search(roomId, q as string, Number(limit));

    res.json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search messages',
      },
    });
  }
});

export default router;
