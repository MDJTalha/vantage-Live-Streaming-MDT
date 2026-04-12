import { Router, Response } from 'express';
import AuthMiddleware from '../middleware/auth';
import RateLimiter from '../middleware/rateLimiter';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// C-08 FIX: AI Services URL from environment (FastAPI server)
const AI_SERVICES_URL = process.env.AI_SERVICES_URL || 'http://localhost:5000';

/**
 * C-08 FIX: Call AI service via HTTP instead of spawning Python subprocess
 * - Non-blocking (doesn't block Node.js event loop)
 * - Proper timeout (60s)
 * - Error isolation (AI crash doesn't crash API)
 * - No Python dependency on API server
 */
async function callAIService(endpoint: string, params: any, timeoutMs = 60000): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${AI_SERVICES_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error(`AI service timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  }
}

// ==================== RUN DATA CORRECTION ====================
router.post('/correct-meeting/:meetingId', RateLimiter.strict(), AuthMiddleware.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { meetingId } = req.params;
    const { userId } = req.user!;

    const result = await callAIService('data_correction', {
      action: 'correct_meeting',
      meetingId,
      userId,
    });

    res.json({
      success: true,
      meetingId,
      corrections: result.corrections,
      analysis: result.analysis,
    });
  } catch (error) {
    throw error;
  }
});

// ==================== ENRICH USER PROFILES ====================
router.post('/enrich-users', RateLimiter.strict(), AuthMiddleware.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.query;

    const result = await callAIService('data_correction', {
      action: 'enrich_users',
      userId: userId as string,
    });

    res.json({
      success: true,
      usersEnriched: result.users_enriched,
      enrichments: result.enrichments,
    });
  } catch (error) {
    throw error;
  }
});

// ==================== ENHANCE RECORDINGS ====================
router.post('/enhance-recordings', RateLimiter.strict(), AuthMiddleware.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { recordingId } = req.query;

    const result = await callAIService('data_correction', {
      action: 'enhance_recordings',
      recordingId: recordingId as string,
    });

    res.json({
      success: true,
      recordingsEnhanced: result.recordings_enhanced,
      enhancements: result.enhancements,
    });
  } catch (error) {
    throw error;
  }
});

// ==================== BUILD KNOWLEDGE GRAPH ====================
router.post('/build-knowledge', RateLimiter.strict(), AuthMiddleware.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50 } = req.query;

    const result = await callAIService('data_correction', {
      action: 'build_knowledge',
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      meetingsProcessed: result.meetings_processed,
      knowledgeNodesAdded: result.knowledge_nodes_added,
    });
  } catch (error) {
    throw error;
  }
});

// ==================== DATA QUALITY AUDIT ====================
router.get('/audit-quality', RateLimiter.strict(), AuthMiddleware.requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await callAIService('data_correction', {
      action: 'audit_quality',
    });

    res.json({
      success: true,
      audit: result,
    });
  } catch (error) {
    throw error;
  }
});

// ==================== AI CHAT (GENERAL) ====================
router.post('/chat', RateLimiter.strict(), AuthMiddleware.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { message, domain = 'general' } = req.body;

    const result = await callAIService('brain', {
      action: 'chat',
      message,
      domain,
    });

    res.json({
      success: true,
      response: result.response,
      analysis: result.analysis,
    });
  } catch (error) {
    throw error;
  }
});

export default router;
