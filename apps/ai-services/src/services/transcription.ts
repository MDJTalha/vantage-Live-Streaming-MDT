/**
 * VANTAGE AI Services - Transcription Service
 * Real-time speech-to-text using OpenAI Whisper API
 */

import OpenAI from 'openai';
import { config } from '@vantage/config';
import { logger } from '../utils/logger';

export interface TranscriptionSegment {
  id: string;
  start: number; // seconds
  end: number;
  text: string;
  speaker?: string;
  language: string;
  confidence: number;
}

export interface TranscriptionResult {
  sessionId: string;
  segments: TranscriptionSegment[];
  fullText: string;
  language: string;
  duration: number;
  wordCount: number;
}

export interface StreamingTranscriptionOptions {
  language?: string;
  task?: 'transcribe' | 'translate';
  punctuate?: boolean;
  diarize?: boolean;
  maxSpeakers?: number;
}

export class TranscriptionService {
  private openai: OpenAI | null = null;
  private static initialized = false;

  /**
   * Initialize OpenAI client
   */
  private initialize(): void {
    if (TranscriptionService.initialized) {
      return;
    }

    const apiKey = config.ai.openaiApiKey;

    if (!apiKey || apiKey === 'sk-your-openai-api-key' || apiKey === 'your-openai-api-key') {
      logger.warn('OpenAI API key not configured. Transcription will use fallback mode.');
      TranscriptionService.initialized = true;
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      TranscriptionService.initialized = true;
      logger.info('✓ OpenAI client initialized for transcription');
    } catch (error) {
      logger.error('Failed to initialize OpenAI client', { error });
      TranscriptionService.initialized = true;
    }
  }

  /**
   * Transcribe audio file using OpenAI Whisper API
   */
  async transcribe(
    audioBuffer: Buffer,
    language: string = 'en'
  ): Promise<TranscriptionResult> {
    this.initialize();

    const sessionId = this.generateSessionId();
    const startTime = Date.now();

    try {
      if (!this.openai) {
        // Fallback: return mock transcription
        logger.warn('Using mock transcription (OpenAI not available)');
        return this.createMockTranscription(sessionId, audioBuffer);
      }

      // Convert buffer to Blob for OpenAI API
      const blob = new Blob([audioBuffer], { type: 'audio/wav' });
      
      // Create a File object from the blob
      const file = new File([blob], 'audio.wav', { type: 'audio/wav' });

      // Run transcription using OpenAI Whisper API
      const result = await this.openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: language,
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      // Parse segments from OpenAI response
      const segments: TranscriptionSegment[] = (result.segments || []).map((segment: any, index: number) => ({
        id: `${sessionId}-${index}`,
        start: segment.start || 0,
        end: segment.end || 0,
        text: segment.text || '',
        language: result.language || language,
        confidence: segment.confidence || 0.95,
      }));

      const fullText = result.text || segments.map(s => s.text).join(' ');
      const duration = (Date.now() - startTime) / 1000;

      logger.info('Transcription completed', {
        sessionId,
        duration,
        wordCount: fullText.split(' ').length,
        language: result.language,
      });

      return {
        sessionId,
        segments,
        fullText,
        language: result.language || language,
        duration,
        wordCount: fullText.split(' ').length,
      };
    } catch (error: any) {
      logger.error('Transcription failed', { sessionId, error });
      
      // Check for API key errors
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.');
      }
      
      throw new Error(`Transcription failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Streaming transcription (real-time)
   * Note: OpenAI Whisper doesn't support true streaming yet
   * This implementation buffers audio and transcribes in chunks
   */
  async *transcribeStreaming(
    audioChunks: AsyncIterable<Buffer>,
    options: StreamingTranscriptionOptions = {}
  ): AsyncGenerator<{
    segment: TranscriptionSegment;
    isFinal: boolean;
    partialText?: string;
  }> {
    this.initialize();

    const sessionId = this.generateSessionId();
    let buffer = Buffer.alloc(0);
    let segmentIndex = 0;

    try {
      for await (const chunk of audioChunks) {
        buffer = Buffer.concat([buffer, chunk]);

        // Process every 30 seconds of audio (approximately 480KB at 16kHz)
        if (buffer.length >= 480000) {
          const result = await this.transcribe(buffer, options.language || 'en');

          for (const segment of result.segments) {
            yield {
              segment: {
                ...segment,
                id: `${sessionId}-${segmentIndex++}`,
              },
              isFinal: true,
            };
          }

          // Keep last 5 seconds for context
          buffer = buffer.slice(-80000);
        }
      }

      // Process remaining audio
      if (buffer.length > 0) {
        const result = await this.transcribe(buffer, options.language || 'en');

        for (const segment of result.segments) {
          yield {
            segment: {
              ...segment,
              id: `${sessionId}-${segmentIndex++}`,
            },
            isFinal: true,
          };
        }
      }
    } catch (error) {
      logger.error('Streaming transcription failed', { sessionId, error });
      throw error;
    }
  }

  /**
   * Create mock transcription (fallback when OpenAI is not available)
   */
  private createMockTranscription(
    sessionId: string,
    audioBuffer: Buffer
  ): TranscriptionResult {
    logger.warn('Using mock transcription (OpenAI not configured)');

    return {
      sessionId,
      segments: [
        {
          id: `${sessionId}-0`,
          start: 0,
          end: 5,
          text: '[Transcription service requires OpenAI API key - please configure OPENAI_API_KEY in .env.local]',
          speaker: 'Speaker 1',
          language: 'en',
          confidence: 0.5,
        },
      ],
      fullText: '[OpenAI API key required for transcription]',
      language: 'en',
      duration: 5,
      wordCount: 8,
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Save transcription to file
   */
  async saveToFile(
    transcription: TranscriptionResult,
    format: 'txt' | 'json' | 'srt' | 'vtt'
  ): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');

    let content: string;

    switch (format) {
      case 'txt':
        content = transcription.fullText;
        break;

      case 'json':
        content = JSON.stringify(transcription, null, 2);
        break;

      case 'srt':
        content = this.toSRT(transcription);
        break;

      case 'vtt':
        content = this.toVTT(transcription);
        break;

      default:
        content = transcription.fullText;
    }

    const filePath = path.join(
      process.env.STORAGE_PATH || './storage',
      'transcriptions',
      `${transcription.sessionId}.${format}`
    );

    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, content, 'utf-8');

    return filePath;
  }

  /**
   * Convert to SRT subtitle format
   */
  private toSRT(transcription: TranscriptionResult): string {
    return transcription.segments
      .map((segment, index) => {
        const start = this.formatSRTTime(segment.start);
        const end = this.formatSRTTime(segment.end);
        return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`;
      })
      .join('\n');
  }

  /**
   * Convert to VTT subtitle format
   */
  private toVTT(transcription: TranscriptionResult): string {
    let vtt = 'WEBVTT\n\n';
    vtt += transcription.segments
      .map((segment) => {
        const start = this.formatVTTTime(segment.start);
        const end = this.formatVTTTime(segment.end);
        return `${start} --> ${end}\n${segment.text}`;
      })
      .join('\n\n');
    return vtt;
  }

  /**
   * Format time for SRT (HH:MM:SS,mmm)
   */
  private formatSRTTime(seconds: number): string {
    const date = new Date(seconds * 1000);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const secs = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${secs},${ms}`;
  }

  /**
   * Format time for VTT (HH:MM:SS.mmm)
   */
  private formatVTTTime(seconds: number): string {
    const date = new Date(seconds * 1000);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const secs = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${secs}.${ms}`;
  }
}

export default TranscriptionService;
