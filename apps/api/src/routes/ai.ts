import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import AuthMiddleware from '../middleware/auth';

const router = Router();

// ==================== RUN DATA CORRECTION ====================
router.post('/correct-meeting/:meetingId', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const { userId } = req.user!;

    // Run Python script
    const result = await runPythonScript('data_correction.py', {
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
  } catch (error: any) {
    console.error('Error correcting meeting data:', error);
    res.status(500).json({ error: 'Failed to correct meeting data' });
  }
});

// ==================== ENRICH USER PROFILES ====================
router.post('/enrich-users', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    const result = await runPythonScript('data_correction.py', {
      action: 'enrich_users',
      userId: userId as string,
    });

    res.json({
      success: true,
      usersEnriched: result.users_enriched,
      enrichments: result.enrichments,
    });
  } catch (error: any) {
    console.error('Error enriching user profiles:', error);
    res.status(500).json({ error: 'Failed to enrich user profiles' });
  }
});

// ==================== ENHANCE RECORDINGS ====================
router.post('/enhance-recordings', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { recordingId } = req.query;
    
    const result = await runPythonScript('data_correction.py', {
      action: 'enhance_recordings',
      recordingId: recordingId as string,
    });

    res.json({
      success: true,
      recordingsEnhanced: result.recordings_enhanced,
      enhancements: result.enhancements,
    });
  } catch (error: any) {
    console.error('Error enhancing recordings:', error);
    res.status(500).json({ error: 'Failed to enhance recordings' });
  }
});

// ==================== BUILD KNOWLEDGE GRAPH ====================
router.post('/build-knowledge', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    
    const result = await runPythonScript('data_correction.py', {
      action: 'build_knowledge',
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      meetingsProcessed: result.meetings_processed,
      knowledgeNodesAdded: result.knowledge_nodes_added,
    });
  } catch (error: any) {
    console.error('Error building knowledge graph:', error);
    res.status(500).json({ error: 'Failed to build knowledge graph' });
  }
});

// ==================== DATA QUALITY AUDIT ====================
router.get('/audit-quality', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await runPythonScript('data_correction.py', {
      action: 'audit_quality',
    });

    res.json({
      success: true,
      audit: result,
    });
  } catch (error: any) {
    console.error('Error running data quality audit:', error);
    res.status(500).json({ error: 'Failed to run data quality audit' });
  }
});

// ==================== AI CHAT (GENERAL) ====================
router.post('/chat', AuthMiddleware.requireAuth, async (req: Request, res: Response) => {
  try {
    const { message, domain = 'general' } = req.body;
    
    const result = await runPythonScript('brain.py', {
      action: 'chat',
      message,
      domain,
    });

    res.json({
      success: true,
      response: result.response,
      analysis: result.analysis,
    });
  } catch (error: any) {
    console.error('Error processing AI chat:', error);
    res.status(500).json({ error: 'Failed to process AI chat' });
  }
});

// ==================== HELPER ====================

function runPythonScript(scriptName: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../../ai-services/src', scriptName);
    
    const python = spawn('python', [
      scriptPath,
      JSON.stringify(params)
    ]);

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(output));
        } catch {
          resolve({ output });
        }
      } else {
        reject(new Error(error || `Script exited with code ${code}`));
      }
    });
  });
}

export default router;
