import { Router, Request, Response } from 'express';
import { z } from 'zod';
import EngagementRepository from '../repositories/EngagementRepository';
import AuthMiddleware from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const createPollSchema = z.object({
  roomId: z.string(),
  question: z.string().min(1).max(500),
  options: z.array(z.object({
    id: z.string(),
    text: z.string().min(1).max(200),
  })).min(2).max(10),
  multipleChoice: z.boolean().default(false),
});

const voteSchema = z.object({
  optionId: z.string(),
});

const createQuestionSchema = z.object({
  content: z.string().min(1).max(1000),
});

/**
 * ============================================
 * Poll Routes
 * ============================================
 */

/**
 * GET /api/v1/polls/room/:roomId
 * Get all polls for a room
 */
router.get('/room/:roomId', AuthMiddleware.optional, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;

    const polls = await EngagementRepository.getPollsByRoom(roomId);

    res.json({
      success: true,
      data: polls,
    });
  } catch (error: any) {
    console.error('Error fetching polls:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch polls',
      },
    });
  }
});

/**
 * GET /api/v1/polls/:id/results
 * Get poll results
 */
router.get('/:id/results', AuthMiddleware.optional, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const results = await EngagementRepository.getPollResults(id);

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Error fetching poll results:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch poll results',
      },
    });
  }
});

/**
 * POST /api/v1/polls
 * Create a new poll
 */
router.post('/', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, question, options, multipleChoice } = createPollSchema.parse(req.body);

    const poll = await EngagementRepository.createPoll({
      roomId,
      question,
      options,
      multipleChoice,
      createdBy: req.user?.userId || '',
    });

    res.status(201).json({
      success: true,
      data: poll,
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

    console.error('Error creating poll:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create poll',
      },
    });
  }
});

/**
 * POST /api/v1/polls/:id/activate
 * Activate a poll
 */
router.post('/:id/activate', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { durationMinutes = 30 } = req.body;

    const poll = await EngagementRepository.activatePoll(id, durationMinutes);

    res.json({
      success: true,
      data: poll,
    });
  } catch (error: any) {
    console.error('Error activating poll:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to activate poll',
      },
    });
  }
});

/**
 * POST /api/v1/polls/:id/end
 * End a poll
 */
router.post('/:id/end', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const poll = await EngagementRepository.endPoll(id);

    res.json({
      success: true,
      data: poll,
    });
  } catch (error: any) {
    console.error('Error ending poll:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to end poll',
      },
    });
  }
});

/**
 * POST /api/v1/polls/:id/vote
 * Vote on a poll
 */
router.post('/:id/vote', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { optionId } = voteSchema.parse(req.body);

    const vote = await EngagementRepository.voteOnPoll(id, {
      optionId,
      userId: req.user?.userId,
    });

    res.json({
      success: true,
      data: vote,
    });
  } catch (error: any) {
    console.error('Error voting on poll:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'VOTE_ERROR',
        message: error.message || 'Failed to vote',
      },
    });
  }
});

/**
 * DELETE /api/v1/polls/:id
 * Delete a poll
 */
router.delete('/:id', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const poll = await EngagementRepository.deletePoll(id);

    res.json({
      success: true,
      data: poll,
    });
  } catch (error: any) {
    console.error('Error deleting poll:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete poll',
      },
    });
  }
});

/**
 * ============================================
 * Question (Q&A) Routes
 * ============================================
 */

/**
 * GET /api/v1/questions/room/:roomId
 * Get all questions for a room
 */
router.get('/room/:roomId', AuthMiddleware.optional, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;

    const questions = await EngagementRepository.getQuestionsByRoom(roomId);

    res.json({
      success: true,
      data: questions,
    });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch questions',
      },
    });
  }
});

/**
 * POST /api/v1/questions
 * Create a new question
 */
router.post('/', AuthMiddleware.optional, async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, content } = createQuestionSchema.parse(req.body);

    const question = await EngagementRepository.createQuestion({
      roomId,
      userId: req.user?.userId,
      guestName: req.user?.email?.split('@')[0],
      content,
    });

    res.status(201).json({
      success: true,
      data: question,
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

    console.error('Error creating question:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create question',
      },
    });
  }
});

/**
 * POST /api/v1/questions/:id/upvote
 * Upvote a question
 */
router.post('/:id/upvote', AuthMiddleware.optional, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const question = await EngagementRepository.upvoteQuestion(id);

    res.json({
      success: true,
      data: question,
    });
  } catch (error: any) {
    console.error('Error upvoting question:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to upvote',
      },
    });
  }
});

/**
 * PATCH /api/v1/questions/:id/answer
 * Mark question as answered
 */
router.patch('/:id/answer', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const question = await EngagementRepository.markQuestionAnswered(id);

    res.json({
      success: true,
      data: question,
    });
  } catch (error: any) {
    console.error('Error marking question answered:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to update question',
      },
    });
  }
});

/**
 * DELETE /api/v1/questions/:id
 * Delete a question
 */
router.delete('/:id', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const question = await EngagementRepository.deleteQuestion(id);

    res.json({
      success: true,
      data: question,
    });
  } catch (error: any) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete question',
      },
    });
  }
});

export default router;
