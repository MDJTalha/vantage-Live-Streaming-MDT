/**
 * Summarization Service
 * Uses OpenAI API for meeting summaries, highlights, and action items
 */

import OpenAI from 'openai';
import { config } from '@vantage/config';
import { logger } from '../utils/logger';

export class SummarizationService {
  private openai: OpenAI | null = null;
  private static initialized = false;

  constructor() {}

  /**
   * Initialize OpenAI client
   */
  private initialize(): void {
    if (SummarizationService.initialized) {
      return;
    }

    const apiKey = config.ai.openaiApiKey;

    if (!apiKey || apiKey === 'sk-your-openai-api-key' || apiKey === 'your-openai-api-key') {
      logger.warn('OpenAI API key not configured. Summarization will use fallback mode.');
      SummarizationService.initialized = true;
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      SummarizationService.initialized = true;
      logger.info('✓ OpenAI client initialized for summarization');
    } catch (error) {
      logger.error('Failed to initialize OpenAI client', { error });
      SummarizationService.initialized = true;
    }
  }

  /**
   * Generate meeting summary using OpenAI
   */
  async summarize(
    transcript: string,
    type: 'full' | 'brief' | 'executive' = 'full'
  ): Promise<Summary> {
    this.initialize();

    const startTime = Date.now();
    logger.info('Generating summary...', { type, transcriptLength: transcript.length });

    try {
      if (!this.openai) {
        // Fallback mode
        return this.createFallbackSummary(type);
      }

      const prompt = this.buildSummaryPrompt(transcript, type);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert meeting analyst. Analyze the transcript and provide a structured JSON response with summary, key points, and decisions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      const duration = (Date.now() - startTime) / 1000;
      logger.info('Summary generated', { duration, type });

      return {
        type,
        summary: parsed.summary || 'Summary not available',
        keyPoints: parsed.keyPoints || parsed.key_points || [],
        decisions: parsed.decisions || [],
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Summarization failed', { error });
      
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.');
      }
      
      // Fallback to basic summary
      return this.createFallbackSummary(type);
    }
  }

  /**
   * Extract highlights from meeting using OpenAI
   */
  async extractHighlights(
    transcript: string,
    transcriptWithTimestamps?: TimestampedSegment[]
  ): Promise<Highlights> {
    this.initialize();

    const startTime = Date.now();
    logger.info('Extracting highlights...', { transcriptLength: transcript.length });

    try {
      if (!this.openai) {
        return this.createFallbackHighlights(transcriptWithTimestamps);
      }

      const prompt = `
Analyze this meeting transcript and extract the most important highlights, key moments, and significant statements.

Transcript:
${transcript}

Return a JSON response with an array of highlights, where each highlight has:
- timestamp: when it occurred (if available)
- text: the important statement or moment
- type: one of "important", "decision", "action", "question", "breakthrough"
- speakers: who was involved (if mentioned)
      `.trim();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at identifying key moments in meetings. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      const duration = (Date.now() - startTime) / 1000;
      logger.info('Highlights extracted', { duration, count: parsed.highlights?.length || 0 });

      return {
        highlights: (parsed.highlights || []).map((h: any, i: number) => ({
          timestamp: h.timestamp || `${Math.floor(i * 30)}s`,
          text: h.text || '',
          type: h.type || 'important',
          speakers: h.speakers || [],
        })),
        totalHighlights: parsed.highlights?.length || 0,
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Highlights extraction failed', { error });
      return this.createFallbackHighlights(transcriptWithTimestamps);
    }
  }

  /**
   * Extract action items from transcript using OpenAI
   */
  async extractActionItems(transcript: string): Promise<ActionItems> {
    this.initialize();

    const startTime = Date.now();
    logger.info('Extracting action items...', { transcriptLength: transcript.length });

    try {
      if (!this.openai) {
        return this.createFallbackActionItems(transcript);
      }

      const prompt = `
Analyze this meeting transcript and extract all action items, tasks, and commitments mentioned.

Transcript:
${transcript}

Return a JSON response with an array of actionItems, where each action item has:
- id: number
- description: what needs to be done
- assignee: who is responsible (or "TBD" if not specified)
- status: "pending" (default)
- dueDate: when it's due (or null if not specified)
      `.trim();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting action items from meetings. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      const duration = (Date.now() - startTime) / 1000;
      logger.info('Action items extracted', { duration, count: parsed.actionItems?.length || 0 });

      return {
        actionItems: (parsed.actionItems || []).map((a: any, i: number) => ({
          id: a.id || i + 1,
          description: a.description || '',
          assignee: a.assignee || 'TBD',
          status: (a.status as 'pending' | 'in-progress' | 'completed') || 'pending',
          dueDate: a.dueDate || null,
        })),
        totalItems: parsed.actionItems?.length || 0,
        pendingItems: parsed.actionItems?.filter((a: any) => a.status === 'pending')?.length || 0,
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Action items extraction failed', { error });
      return this.createFallbackActionItems(transcript);
    }
  }

  /**
   * Generate meeting insights using OpenAI
   */
  async generateInsights(transcript: string): Promise<Insights> {
    this.initialize();

    const startTime = Date.now();
    logger.info('Generating insights...', { transcriptLength: transcript.length });

    try {
      if (!this.openai) {
        return this.createFallbackInsights();
      }

      const prompt = `
Analyze this meeting transcript and provide insights about the meeting dynamics.

Transcript:
${transcript}

Return a JSON response with:
- sentiment: "positive", "neutral", or "negative"
- engagement: "high", "medium", or "low"
- topicsDiscussed: array of main topics
- dominantSpeakers: array of speaker names who spoke most
- meetingPace: "fast", "normal", or "slow"
      `.trim();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing meeting dynamics. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      const duration = (Date.now() - startTime) / 1000;
      logger.info('Insights generated', { duration });

      return {
        sentiment: (parsed.sentiment as 'positive' | 'neutral' | 'negative') || 'neutral',
        engagement: (parsed.engagement as 'high' | 'medium' | 'low') || 'medium',
        topicsDiscussed: parsed.topicsDiscussed || [],
        dominantSpeakers: parsed.dominantSpeakers || [],
        meetingPace: (parsed.meetingPace as 'fast' | 'normal' | 'slow') || 'normal',
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Insights generation failed', { error });
      return this.createFallbackInsights();
    }
  }

  /**
   * Build prompt for OpenAI summary generation
   */
  private buildSummaryPrompt(transcript: string, type: string): string {
    const instructions = {
      full: 'Provide a comprehensive summary of the meeting including all key points, decisions, and discussions.',
      brief: 'Provide a brief 2-3 paragraph summary of the main points.',
      executive: 'Provide an executive summary with key decisions and action items only.',
    };

    const selectedInstruction = instructions[type as keyof typeof instructions];

    return `
${selectedInstruction}

Meeting Transcript:
${transcript}

Please provide a JSON response with:
{
  "summary": "The main summary text",
  "keyPoints": ["point 1", "point 2", ...],
  "decisions": ["decision 1", "decision 2", ...]
}
    `.trim();
  }

  // ============ Fallback Methods (when OpenAI is not available) ============

  private createFallbackSummary(type: string): Summary {
    logger.warn('Using fallback summary (OpenAI not configured)');

    return {
      type,
      summary: '[Meeting summary requires OpenAI API - please configure OPENAI_API_KEY]',
      keyPoints: [
        'Configure OPENAI_API_KEY in .env.local to enable AI-powered summaries',
        'Key discussion point 2',
        'Key discussion point 3',
      ],
      decisions: ['Decision made during meeting'],
      generatedAt: new Date().toISOString(),
    };
  }

  private createFallbackHighlights(transcriptWithTimestamps?: TimestampedSegment[]): Highlights {
    logger.warn('Using fallback highlights (OpenAI not configured)');

    const highlights: Highlight[] = [];

    if (transcriptWithTimestamps) {
      const keywords = ['important', 'key', 'remember', 'note', 'highlight', 'main', 'critical'];

      transcriptWithTimestamps.forEach((segment) => {
        const text = segment.text.toLowerCase();
        if (keywords.some(kw => text.includes(kw))) {
          highlights.push({
            timestamp: segment.timestamp,
            text: segment.text,
            type: 'important',
            speakers: segment.speakers,
          });
        }
      });
    }

    return {
      highlights,
      totalHighlights: highlights.length,
      generatedAt: new Date().toISOString(),
    };
  }

  private createFallbackActionItems(transcript: string): ActionItems {
    logger.warn('Using fallback action items (OpenAI not configured)');

    const actionItems: ActionItem[] = [];
    const patterns = [
      /I'll\s+(.+)/gi,
      /we should\s+(.+)/gi,
      /need to\s+(.+)/gi,
      /action item[:\s]+(.+)/gi,
      /follow up on\s+(.+)/gi,
    ];

    patterns.forEach(pattern => {
      const matches = transcript.match(pattern);
      if (matches) {
        matches.forEach((match, index) => {
          actionItems.push({
            id: index + 1,
            description: match.replace(pattern, '$1').trim(),
            assignee: 'TBD',
            status: 'pending' as const,
            dueDate: null,
          });
        });
      }
    });

    return {
      actionItems,
      totalItems: actionItems.length,
      pendingItems: actionItems.filter(a => a.status === 'pending').length,
      generatedAt: new Date().toISOString(),
    };
  }

  private createFallbackInsights(): Insights {
    logger.warn('Using fallback insights (OpenAI not configured)');

    return {
      sentiment: 'neutral',
      engagement: 'medium',
      topicsDiscussed: ['Configure OPENAI_API_KEY to enable AI insights'],
      dominantSpeakers: [],
      meetingPace: 'normal',
      generatedAt: new Date().toISOString(),
    };
  }
}

// ============ Interfaces ============

export interface Summary {
  type: 'full' | 'brief' | 'executive';
  summary: string;
  keyPoints: string[];
  decisions: string[];
  generatedAt: string;
}

export interface Highlights {
  highlights: Highlight[];
  totalHighlights: number;
  generatedAt: string;
}

export interface Highlight {
  timestamp: string;
  text: string;
  type: 'important' | 'decision' | 'action' | 'question' | 'breakthrough';
  speakers?: string[];
}

export interface ActionItems {
  actionItems: ActionItem[];
  totalItems: number;
  pendingItems: number;
  generatedAt: string;
}

export interface ActionItem {
  id: number;
  description: string;
  assignee: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string | null;
}

export interface Insights {
  sentiment: 'positive' | 'neutral' | 'negative';
  engagement: 'high' | 'medium' | 'low';
  topicsDiscussed: string[];
  dominantSpeakers: string[];
  meetingPace: 'fast' | 'normal' | 'slow';
  generatedAt: string;
}

export interface TimestampedSegment {
  timestamp: string;
  text: string;
  speakers: string[];
}

export default SummarizationService;
