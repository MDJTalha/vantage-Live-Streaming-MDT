/**
 * VANTAGE AI Services - Sentiment Analysis Service
 * Real-time emotion and sentiment detection from audio and text
 */

import { logger } from '../utils/logger';

export interface SentimentResult {
  sessionId: string;
  overall: {
    positive: number;
    neutral: number;
    negative: number;
    compound: number; // -1 to 1
    label: 'positive' | 'neutral' | 'negative';
  };
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
    confusion: number;
    engagement: number;
  };
  timeline: SentimentPoint[];
  speakerSentiment: Record<string, SpeakerSentiment>;
  meetingHealth: MeetingHealthScore;
}

export interface SentimentPoint {
  timestamp: number; // seconds
  positive: number;
  neutral: number;
  negative: number;
  dominant_emotion: string;
}

export interface SpeakerSentiment {
  speakerId: string;
  averageSentiment: number;
  dominantEmotion: string;
  engagementLevel: 'low' | 'medium' | 'high';
  talkTimePercentage: number;
}

export interface MeetingHealthScore {
  score: number; // 0-100
  label: 'poor' | 'fair' | 'good' | 'excellent';
  factors: {
    engagement: number;
    positivity: number;
    participation: number;
    clarity: number;
  };
  recommendations: string[];
  warnings: string[];
}

export interface SentimentOptions {
  analyzeEmotions?: boolean;
  analyzePerSpeaker?: boolean;
  timelineInterval?: number; // seconds
  language?: string;
}

export class SentimentService {
  private static model: any = null;
  private static initialized = false;

  /**
   * Initialize sentiment analysis model
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Dynamic import for optional dependency
      const { pipeline } = await import('@xenova/transformers');

      // Load sentiment analysis model
      this.model = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );

      this.initialized = true;
      logger.info('✓ Sentiment analysis model initialized');
    } catch (error) {
      logger.warn('Sentiment model not available, using keyword fallback', { error });
      this.initialized = true;
    }
  }

  /**
   * Analyze sentiment of text
   */
  static async analyzeText(
    text: string,
    options: SentimentOptions = {}
  ): Promise<SentimentResult> {
    await this.initialize();

    const sessionId = this.generateId();

    try {
      // Split into sentences for granular analysis
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

      let totalPositive = 0;
      let totalNegative = 0;
      const timeline: SentimentPoint[] = [];
      const speakerSentiment: Record<string, SpeakerSentiment> = {};

      // Analyze each sentence
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        if (sentence.length < 5) continue;

        let sentiment: any;

        if (this.model) {
          sentiment = await this.model(sentence);
        } else {
          sentiment = this.keywordAnalysis(sentence);
        }

        const result = sentiment[0];
        const isPositive = result.label === 'POSITIVE';

        if (isPositive) {
          totalPositive += result.score;
        } else {
          totalNegative += result.score;
        }

        // Add to timeline
        timeline.push({
          timestamp: i * 5, // Approximate 5 seconds per sentence
          positive: isPositive ? result.score : 1 - result.score,
          neutral: 0.1,
          negative: isPositive ? 1 - result.score : result.score,
          dominant_emotion: this.detectEmotion(sentence),
        });
      }

      // Calculate overall sentiment
      const avgPositive = sentences.length > 0 ? totalPositive / sentences.length : 0.5;
      const avgNegative = sentences.length > 0 ? totalNegative / sentences.length : 0.5;
      const compound = avgPositive - avgNegative;

      const overall = {
        positive: Math.round(avgPositive * 100),
        neutral: Math.round((1 - Math.abs(compound)) * 100),
        negative: Math.round(avgNegative * 100),
        compound: Math.round(compound * 100) / 100,
        label: compound > 0.1 ? 'positive' : compound < -0.1 ? 'negative' : 'neutral' as 'positive' | 'neutral' | 'negative',
      };

      // Analyze emotions
      const emotions = this.analyzeEmotions(text);

      // Calculate meeting health
      const meetingHealth = this.calculateMeetingHealth(overall, emotions, timeline);

      logger.info('Sentiment analysis completed', {
        sessionId,
        sentences: sentences.length,
        overall: overall.label,
      });

      return {
        sessionId,
        overall,
        emotions,
        timeline,
        speakerSentiment,
        meetingHealth,
      };
    } catch (error) {
      logger.error('Sentiment analysis failed', { sessionId, error });
      throw new Error(`Sentiment analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze sentiment from audio (prosody analysis)
   */
  static async analyzeAudio(audioBuffer: Buffer): Promise<{
    pitch: number;
    energy: number;
    speechRate: number;
    emotion: string;
  }> {
    // Simple audio feature extraction
    // In production, use openSMILE or similar

    const samples = new Float32Array(audioBuffer.length / 2);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = audioBuffer.readInt16LE(i * 2) / 32768.0;
    }

    // Calculate RMS energy
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    const energy = Math.sqrt(sum / samples.length);

    // Estimate pitch (zero-crossing rate method)
    let zeroCrossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0 && samples[i - 1] < 0) ||
          (samples[i] < 0 && samples[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const pitch = zeroCrossings / samples.length * 16000 / 2; // Approximate Hz

    // Detect emotion from audio features
    const emotion = this.detectAudioEmotion(pitch, energy);

    return {
      pitch,
      energy,
      speechRate: 0, // Would need proper speech detection
      emotion,
    };
  }

  /**
   * Multi-modal sentiment (text + audio)
   */
  static async analyzeMultiModal(
    transcript: string,
    audioFeatures: Array<{ timestamp: number; pitch: number; energy: number }>
  ): Promise<SentimentResult> {
    // Analyze text
    const textSentiment = await this.analyzeText(transcript);

    // Incorporate audio features
    if (audioFeatures.length > 0) {
      const avgEnergy = audioFeatures.reduce((sum, f) => sum + f.energy, 0) / audioFeatures.length;
      const avgPitch = audioFeatures.reduce((sum, f) => sum + f.pitch, 0) / audioFeatures.length;

      // Adjust sentiment based on audio
      const audioEmotion = this.detectAudioEmotion(avgPitch, avgEnergy);

      // Boost engagement if high energy
      if (avgEnergy > 0.3) {
        textSentiment.emotions.engagement = Math.min(1, textSentiment.emotions.engagement + 0.2);
      }

      // Detect stress from high pitch
      if (avgPitch > 200) {
        textSentiment.emotions.fear = Math.min(1, textSentiment.emotions.fear + 0.1);
      }
    }

    // Recalculate meeting health
    textSentiment.meetingHealth = this.calculateMeetingHealth(
      textSentiment.overall,
      textSentiment.emotions,
      textSentiment.timeline
    );

    return textSentiment;
  }

  /**
   * Analyze emotions in text
   */
  private static analyzeEmotions(text: string): SentimentResult['emotions'] {
    const emotionKeywords: Record<string, string[]> = {
      joy: ['happy', 'great', 'excellent', 'wonderful', 'fantastic', 'love', 'excited', 'amazing'],
      sadness: ['sad', 'disappointed', 'unfortunately', 'regret', 'sorry', 'unhappy'],
      anger: ['angry', 'frustrated', 'annoyed', 'furious', 'outraged', 'hate'],
      fear: ['worried', 'concerned', 'afraid', 'scared', 'anxious', 'nervous'],
      surprise: ['surprised', 'shocked', 'amazed', 'unexpected', 'wow'],
      disgust: ['disgusted', 'repulsed', 'gross', 'awful'],
      confusion: ['confused', 'unclear', 'uncertain', 'don\'t understand', 'what'],
      engagement: ['interesting', 'great point', 'agree', 'yes', 'exactly', 'important'],
    };

    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    const scores: Record<string, number> = {};

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      let count = 0;
      for (const word of words) {
        if (keywords.includes(word)) {
          count++;
        }
      }
      scores[emotion] = Math.min(1, count / words.length * 10);
    }

    return {
      joy: scores.joy || 0,
      sadness: scores.sadness || 0,
      anger: scores.anger || 0,
      fear: scores.fear || 0,
      surprise: scores.surprise || 0,
      disgust: scores.disgust || 0,
      confusion: scores.confusion || 0,
      engagement: scores.engagement || 0.5,
    };
  }

  /**
   * Detect emotion from single sentence
   */
  private static detectEmotion(sentence: string): string {
    const emotions = this.analyzeEmotions(sentence);
    const maxEmotion = Object.entries(emotions)
      .reduce((a, b) => (b[1] > a[1] ? b : a))[0];

    return maxEmotion;
  }

  /**
   * Detect emotion from audio features
   */
  private static detectAudioEmotion(pitch: number, energy: number): string {
    // Simple rule-based audio emotion detection
    if (energy > 0.5 && pitch > 200) {
      return 'excited';
    }
    if (energy < 0.2 && pitch < 100) {
      return 'sad';
    }
    if (energy > 0.4 && pitch > 250) {
      return 'angry';
    }
    if (pitch > 300) {
      return 'surprised';
    }
    return 'neutral';
  }

  /**
   * Keyword-based sentiment (fallback)
   */
  private static keywordAnalysis(text: string): Array<{ label: string; score: number }> {
    const positiveWords = [
      'good', 'great', 'excellent', 'awesome', 'perfect',
      'happy', 'pleased', 'satisfied', 'wonderful', 'fantastic',
      'agree', 'yes', 'approve', 'support', 'love',
      'best', 'amazing', 'brilliant', 'outstanding',
    ];

    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'wrong',
      'sad', 'angry', 'frustrated', 'disappointed', 'hate',
      'disagree', 'no', 'reject', 'oppose', 'problem',
      'worst', 'poor', 'weak', 'fail',
    ];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of words) {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    }

    const total = positiveCount + negativeCount || 1;
    const positiveScore = positiveCount / total;
    const negativeScore = negativeCount / total;

    return [{
      label: positiveScore >= negativeScore ? 'POSITIVE' : 'NEGATIVE',
      score: Math.max(positiveScore, negativeScore),
    }];
  }

  /**
   * Calculate meeting health score
   */
  private static calculateMeetingHealth(
    overall: SentimentResult['overall'],
    emotions: SentimentResult['emotions'],
    timeline: SentimentPoint[]
  ): MeetingHealthScore {
    // Calculate factor scores
    const engagement = emotions.engagement;
    const positivity = overall.positive / 100;
    const participation = this.calculateParticipation(timeline);
    const clarity = 1 - emotions.confusion;

    // Overall health score (0-100)
    const score = Math.round(
      (engagement * 25 + positivity * 30 + participation * 25 + clarity * 20)
    );

    // Determine label
    let label: MeetingHealthScore['label'];
    if (score >= 80) label = 'excellent';
    else if (score >= 60) label = 'good';
    else if (score >= 40) label = 'fair';
    else label = 'poor';

    // Generate recommendations
    const recommendations: string[] = [];
    const warnings: string[] = [];

    if (engagement < 0.5) {
      recommendations.push('Consider adding interactive elements to boost engagement');
    }

    if (positivity < 0.5) {
      recommendations.push('Address concerns raised to improve meeting sentiment');
    }

    if (emotions.confusion > 0.3) {
      recommendations.push('Clarify complex topics and check for understanding');
    }

    if (emotions.fear > 0.2 || emotions.anger > 0.2) {
      warnings.push('High negative emotions detected - consider de-escalation');
    }

    if (timeline.length > 0) {
      const trend = timeline[timeline.length - 1].positive - timeline[0].positive;
      if (trend < -0.3) {
        warnings.push('Sentiment declining throughout meeting - review content');
      }
    }

    return {
      score,
      label,
      factors: {
        engagement: Math.round(engagement * 100),
        positivity: Math.round(positivity * 100),
        participation: Math.round(participation * 100),
        clarity: Math.round(clarity * 100),
      },
      recommendations,
      warnings,
    };
  }

  /**
   * Calculate participation from timeline
   */
  private static calculateParticipation(timeline: SentimentPoint[]): number {
    if (timeline.length === 0) return 0.5;

    // Measure variance in sentiment (higher variance = more participation)
    const values = timeline.map(p => p.positive);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;

    // Normalize variance to 0-1 range
    return Math.min(1, Math.sqrt(variance) * 2);
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `sent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get real-time sentiment for active meeting
   */
  static async getLiveSentiment(
    roomId: string,
    recentTranscript: string
  ): Promise<{
    currentSentiment: string;
    engagementLevel: string;
    alert?: string;
  }> {
    const result = await this.analyzeText(recentTranscript);

    let alert: string | undefined;

    if (result.meetingHealth.warnings.length > 0) {
      alert = result.meetingHealth.warnings[0];
    }

    return {
      currentSentiment: result.overall.label,
      engagementLevel: result.emotions.engagement > 0.7 ? 'high' :
                       result.emotions.engagement > 0.4 ? 'medium' : 'low',
      alert,
    };
  }

  /**
   * Export sentiment report
   */
  static generateReport(result: SentimentResult, format: 'json' | 'markdown' | 'html'): string {
    switch (format) {
      case 'markdown':
        return this.toMarkdown(result);
      case 'html':
        return this.toHTML(result);
      default:
        return JSON.stringify(result, null, 2);
    }
  }

  /**
   * Convert to Markdown
   */
  private static toMarkdown(result: SentimentResult): string {
    let md = `# Sentiment Analysis Report\n\n`;
    md += `**Session:** ${result.sessionId}\n`;
    md += `**Overall:** ${result.overall.label.toUpperCase()}\n\n`;

    md += `## Sentiment Breakdown\n\n`;
    md += `- Positive: ${result.overall.positive}%\n`;
    md += `- Neutral: ${result.overall.neutral}%\n`;
    md += `- Negative: ${result.overall.negative}%\n\n`;

    md += `## Emotions\n\n`;
    for (const [emotion, score] of Object.entries(result.emotions)) {
      const bar = '█'.repeat(Math.round(score * 10));
      md += `- ${emotion}: ${bar} ${Math.round(score * 100)}%\n`;
    }

    md += `\n## Meeting Health\n\n`;
    md += `**Score:** ${result.meetingHealth.score}/100 (${result.meetingHealth.label})\n\n`;

    if (result.meetingHealth.recommendations.length > 0) {
      md += `### Recommendations\n\n`;
      for (const rec of result.meetingHealth.recommendations) {
        md += `- ${rec}\n`;
      }
    }

    if (result.meetingHealth.warnings.length > 0) {
      md += `\n### ⚠️ Warnings\n\n`;
      for (const warn of result.meetingHealth.warnings) {
        md += `- ${warn}\n`;
      }
    }

    return md;
  }

  /**
   * Convert to HTML
   */
  private static toHTML(result: SentimentResult): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Sentiment Report - ${result.sessionId}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 40px auto; }
    h1 { color: #3B82F6; }
    .sentiment-bars { display: flex; gap: 20px; margin: 20px 0; }
    .bar-container { flex: 1; }
    .bar { height: 30px; border-radius: 5px; margin: 5px 0; }
    .positive { background: linear-gradient(90deg, #10b981, #34d399); }
    .neutral { background: linear-gradient(90deg, #6b7280, #9ca3af); }
    .negative { background: linear-gradient(90deg, #ef4444, #f87171); }
    .emotion-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
    .emotion-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
    .health-score { font-size: 48px; font-weight: bold; color: ${this.scoreColor(result.meetingHealth.score)}; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 10px 0; }
    .recommendation { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 10px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Sentiment Analysis Report</h1>
  <p>Session: ${result.sessionId}</p>
  
  <h2>Overall Sentiment</h2>
  <div class="sentiment-bars">
    <div class="bar-container">
      <div class="bar positive" style="width: ${result.overall.positive}%"></div>
      <small>Positive: ${result.overall.positive}%</small>
    </div>
    <div class="bar-container">
      <div class="bar neutral" style="width: ${result.overall.neutral}%"></div>
      <small>Neutral: ${result.overall.neutral}%</small>
    </div>
    <div class="bar-container">
      <div class="bar negative" style="width: ${result.overall.negative}%"></div>
      <small>Negative: ${result.overall.negative}%</small>
    </div>
  </div>
  
  <h2>Emotions</h2>
  <div class="emotion-grid">
    ${Object.entries(result.emotions).map(([emotion, score]) => `
      <div class="emotion-card">
        <div style="font-size: 24px;">${this.emotionEmoji(emotion)}</div>
        <div>${emotion}</div>
        <div style="color: #666;">${Math.round(score * 100)}%</div>
      </div>
    `).join('')}
  </div>
  
  <h2>Meeting Health</h2>
  <div class="health-score">${result.meetingHealth.score}</div>
  <p>Label: <strong>${result.meetingHealth.label.toUpperCase()}</strong></p>
  
  ${result.meetingHealth.recommendations.length > 0 ? `
    <h3>Recommendations</h3>
    ${result.meetingHealth.recommendations.map(r => `<div class="recommendation">💡 ${r}</div>`).join('')}
  ` : ''}
  
  ${result.meetingHealth.warnings.length > 0 ? `
    <h3>⚠️ Warnings</h3>
    ${result.meetingHealth.warnings.map(w => `<div class="warning">${w}</div>`).join('')}
  ` : ''}
</body>
</html>
    `.trim();
  }

  private static scoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  private static emotionEmoji(emotion: string): string {
    const emojis: Record<string, string> = {
      joy: '😊',
      sadness: '😢',
      anger: '😠',
      fear: '😨',
      surprise: '😲',
      disgust: '🤢',
      confusion: '😕',
      engagement: '🎯',
    };
    return emojis[emotion] || '😐';
  }
}

export default SentimentService;
