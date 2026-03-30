import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { TranscriptionService } from './services/transcription';
import { SummarizationService } from './services/summarization';

const app: Express = express();
const PORT = process.env.AI_SERVICE_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize services
const transcriptionService = new TranscriptionService();
const summarizationService = new SummarizationService();

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'ai-services',
    timestamp: new Date().toISOString(),
    services: {
      transcription: 'ready',
      summarization: 'ready',
    },
  });
});

/**
 * POST /api/v1/ai/transcribe
 * Transcribe audio to text
 */
app.post('/api/v1/ai/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioData, language = 'en' } = req.body;

    if (!audioData) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Audio data is required' },
      });
      return;
    }

    const result = await transcriptionService.transcribe(audioData, language);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSCRIPTION_ERROR',
        message: error.message || 'Failed to transcribe audio',
      },
    });
  }
});

/**
 * POST /api/v1/ai/transcribe/stream
 * Start real-time transcription stream
 */
app.post('/api/v1/ai/transcribe/stream', async (req: Request, res: Response) => {
  try {
    const { roomId, language = 'en' } = req.body;

    if (!roomId) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Room ID is required' },
      });
      return;
    }

    const streamId = await transcriptionService.startStream(roomId, language);

    res.json({
      success: true,
      data: { streamId },
    });
  } catch (error: any) {
    console.error('Stream error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STREAM_ERROR',
        message: error.message || 'Failed to start stream',
      },
    });
  }
});

/**
 * POST /api/v1/ai/transcribe/stream/:streamId
 * Send audio chunk to transcription stream
 */
app.post('/api/v1/ai/transcribe/stream/:streamId', async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;
    const { audioChunk } = req.body;

    if (!audioChunk) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Audio chunk is required' },
      });
      return;
    }

    const result = await transcriptionService.processChunk(streamId, audioChunk);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Chunk processing error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: error.message || 'Failed to process audio chunk',
      },
    });
  }
});

/**
 * POST /api/v1/ai/summarize
 * Generate meeting summary
 */
app.post('/api/v1/ai/summarize', async (req: Request, res: Response) => {
  try {
    const { transcript, type = 'full' } = req.body;

    if (!transcript) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Transcript is required' },
      });
      return;
    }

    const summary = await summarizationService.summarize(transcript, type);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Summarization error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUMMARIZATION_ERROR',
        message: error.message || 'Failed to generate summary',
      },
    });
  }
});

/**
 * POST /api/v1/ai/highlights
 * Extract meeting highlights
 */
app.post('/api/v1/ai/highlights', async (req: Request, res: Response) => {
  try {
    const { transcript, transcriptWithTimestamps } = req.body;

    if (!transcript) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Transcript is required' },
      });
      return;
    }

    const highlights = await summarizationService.extractHighlights(transcript, transcriptWithTimestamps);

    res.json({
      success: true,
      data: highlights,
    });
  } catch (error: any) {
    console.error('Highlights error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HIGHLIGHTS_ERROR',
        message: error.message || 'Failed to extract highlights',
      },
    });
  }
});

/**
 * POST /api/v1/ai/action-items
 * Extract action items from transcript
 */
app.post('/api/v1/ai/action-items', async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Transcript is required' },
      });
      return;
    }

    const actionItems = await summarizationService.extractActionItems(transcript);

    res.json({
      success: true,
      data: actionItems,
    });
  } catch (error: any) {
    console.error('Action items error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ACTION_ITEMS_ERROR',
        message: error.message || 'Failed to extract action items',
      },
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🤖 VANTAGE AI Services                                  ║
║                                                           ║
║   Status: Running                                         ║
║   Port: ${PORT}                                              ║
║                                                           ║
║   Services:                                               ║
║   - Transcription (Whisper)                               ║
║   - Summarization (LLM)                                   ║
║   - Highlights Extraction                                 ║
║   - Action Items                                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
