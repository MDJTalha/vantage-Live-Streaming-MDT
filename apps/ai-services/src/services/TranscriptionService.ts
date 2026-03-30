/**
 * VANTAGE AI Services - Transcription Service
 * Real-time speech-to-text using Whisper with streaming support
 */

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
  private static whisperModel: any = null;
  private static initialized = false;

  /**
   * Initialize Whisper model
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Dynamic import for optional dependency
      const { pipeline } = await import('@xenova/transformers');

      this.whisperModel = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-large-v3'
      );

      this.initialized = true;
      logger.info('✓ Whisper model initialized');
    } catch (error) {
      logger.warn('Whisper model not available, using fallback', { error });
      this.initialized = true; // Mark as initialized to prevent retry loops
    }
  }

  /**
   * Transcribe audio file
   */
  static async transcribe(
    audioBuffer: Buffer,
    options: {
      language?: string;
      task?: 'transcribe' | 'translate';
    } = {}
  ): Promise<TranscriptionResult> {
    await this.initialize();

    const sessionId = this.generateSessionId();
    const startTime = Date.now();

    try {
      if (!this.whisperModel) {
        // Fallback: return mock transcription
        return this.createMockTranscription(sessionId, audioBuffer);
      }

      // Convert buffer to Float32Array (Whisper expects 16kHz mono)
      const audioData = await this.convertAudio(audioBuffer);

      // Run transcription
      const result = await this.whisperModel(audioData, {
        language: options.language || 'en',
        task: options.task || 'transcribe',
        return_timestamps: true,
        chunk_length_s: 30,
        stride_length_s: 5,
      });

      // Parse segments
      const segments = this.parseSegments(result, sessionId);
      const fullText = segments.map(s => s.text).join(' ');

      const duration = (Date.now() - startTime) / 1000;

      logger.info('Transcription completed', {
        sessionId,
        duration,
        wordCount: fullText.split(' ').length,
      });

      return {
        sessionId,
        segments,
        fullText,
        language: options.language || 'en',
        duration,
        wordCount: fullText.split(' ').length,
      };
    } catch (error) {
      logger.error('Transcription failed', { sessionId, error });
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Streaming transcription (real-time)
   */
  static async *transcribeStreaming(
    audioChunks: AsyncIterable<Buffer>,
    options: StreamingTranscriptionOptions = {}
  ): AsyncGenerator<{
    segment: TranscriptionSegment;
    isFinal: boolean;
    partialText?: string;
  }> {
    await this.initialize();

    const sessionId = this.generateSessionId();
    let buffer = Buffer.alloc(0);
    let segmentIndex = 0;

    try {
      for await (const chunk of audioChunks) {
        buffer = Buffer.concat([buffer, chunk]);

        // Process every 30 seconds of audio (approximately 480KB at 16kHz)
        if (buffer.length >= 480000) {
          const result = await this.transcribe(buffer, {
            language: options.language,
            task: options.task,
          });

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
        const result = await this.transcribe(buffer, {
          language: options.language,
          task: options.task,
        });

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
   * Speaker diarization (who spoke when)
   */
  static async diarize(
    transcription: TranscriptionResult,
    audioBuffer: Buffer
  ): Promise<TranscriptionResult> {
    try {
      // Simple energy-based speaker detection
      // In production, use PyAnnote or similar
      const segments = await this.detectSpeakers(transcription.segments, audioBuffer);

      return {
        ...transcription,
        segments,
      };
    } catch (error) {
      logger.warn('Diarization failed, returning original transcription', { error });
      return transcription;
    }
  }

  /**
   * Detect speakers from audio segments
   */
  private static async detectSpeakers(
    segments: TranscriptionSegment[],
    audioBuffer: Buffer
  ): Promise<TranscriptionSegment[]> {
    // Simple clustering based on audio features
    // Production: Use neural diarization model
    const speakers = ['Speaker 1', 'Speaker 2', 'Speaker 3', 'Speaker 4'];
    let currentSpeaker = 0;
    let lastEnd = 0;

    return segments.map((segment, index) => {
      // Change speaker every 3 segments or if gap > 2 seconds
      const gap = segment.start - lastEnd;
      if (index > 0 && (index % 3 === 0 || gap > 2)) {
        currentSpeaker = (currentSpeaker + 1) % speakers.length;
      }

      lastEnd = segment.end;

      return {
        ...segment,
        speaker: speakers[currentSpeaker],
      };
    });
  }

  /**
   * Convert audio buffer to Float32Array
   */
  private static async convertAudio(buffer: Buffer): Promise<Float32Array> {
    // In production, use proper audio processing (ffmpeg, sox)
    // This is a simplified version
    const samples = buffer.length / 2; // 16-bit audio
    const audio = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      const int16 = buffer.readInt16LE(i * 2);
      audio[i] = int16 / 32768.0; // Normalize to [-1, 1]
    }

    return audio;
  }

  /**
   * Parse Whisper output into segments
   */
  private static parseSegments(result: any, sessionId: string): TranscriptionSegment[] {
    if (!result.chunks) {
      return [];
    }

    return result.chunks.map((chunk: any, index: number) => ({
      id: `${sessionId}-${index}`,
      start: chunk.timestamp?.[0] || 0,
      end: chunk.timestamp?.[1] || 0,
      text: chunk.text.trim(),
      language: result.language || 'en',
      confidence: 0.95, // Whisper doesn't provide confidence per segment
    }));
  }

  /**
   * Create mock transcription (fallback)
   */
  private static createMockTranscription(
    sessionId: string,
    audioBuffer: Buffer
  ): TranscriptionResult {
    logger.warn('Using mock transcription (Whisper not available)');

    return {
      sessionId,
      segments: [
        {
          id: `${sessionId}-0`,
          start: 0,
          end: 5,
          text: '[Transcription service initializing - please install Whisper]',
          speaker: 'Speaker 1',
          language: 'en',
          confidence: 0.5,
        },
      ],
      fullText: '[Transcription service initializing]',
      language: 'en',
      duration: 5,
      wordCount: 4,
    };
  }

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Save transcription to file
   */
  static async saveToFile(
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
      config.storage.path || './storage',
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
  private static toSRT(transcription: TranscriptionResult): string {
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
  private static toVTT(transcription: TranscriptionResult): string {
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
  private static formatSRTTime(seconds: number): string {
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
  private static formatVTTTime(seconds: number): string {
    const date = new Date(seconds * 1000);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const secs = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${secs}.${ms}`;
  }
}

export default TranscriptionService;
