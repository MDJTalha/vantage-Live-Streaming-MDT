/**
 * VANTAGE AI Services - Meeting Summarization
 * Generate executive summaries, action items, and decision logs
 */

import { config } from '@vantage/config';
import { logger } from '../utils/logger';

export interface MeetingSummary {
  id: string;
  meetingId: string;
  type: 'executive' | 'detailed' | 'actions' | 'decisions';
  title: string;
  content: string;
  bulletPoints: string[];
  actionItems: ActionItem[];
  decisions: Decision[];
  highlights: string[];
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  createdAt: Date;
}

export interface ActionItem {
  id: string;
  description: string;
  owner?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
}

export interface Decision {
  id: string;
  description: string;
  participants: string[];
  timestamp?: number;
}

export interface SummaryOptions {
  type?: 'executive' | 'detailed' | 'actions';
  maxLength?: number;
  includeActionItems?: boolean;
  includeDecisions?: boolean;
  tone?: 'formal' | 'casual' | 'executive';
}

export class SummarizationService {
  private static model: any = null;
  private static initialized = false;

  /**
   * Initialize summarization model
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Dynamic import for optional dependency
      const { pipeline } = await import('@xenova/transformers');

      this.model = await pipeline(
        'summarization',
        'Xenova/distilbart-cnn-12-6'
      );

      this.initialized = true;
      logger.info('✓ Summarization model initialized');
    } catch (error) {
      logger.warn('Summarization model not available, using fallback', { error });
      this.initialized = true;
    }
  }

  /**
   * Generate meeting summary
   */
  static async summarize(
    transcript: string,
    options: SummaryOptions = {}
  ): Promise<MeetingSummary> {
    await this.initialize();

    const summaryId = this.generateId();
    const meetingId = options.type || 'executive';

    try {
      // Extract sections from transcript
      const sections = await this.extractSections(transcript);

      // Generate summary based on type
      let content: string;
      let bulletPoints: string[];

      if (this.model) {
        const result = await this.model(transcript, {
          max_length: options.maxLength || 150,
          min_length: 50,
          do_sample: false,
        });

        content = result[0]?.summary_text || this.generateFallbackSummary(transcript, options);
      } else {
        content = this.generateFallbackSummary(transcript, options);
      }

      bulletPoints = this.extractBulletPoints(content);

      // Extract action items
      const actionItems = options.includeActionItems !== false
        ? await this.extractActionItems(transcript)
        : [];

      // Extract decisions
      const decisions = options.includeDecisions !== false
        ? await this.extractDecisions(transcript)
        : [];

      // Extract highlights
      const highlights = this.extractHighlights(transcript);

      // Calculate sentiment
      const sentiment = await this.analyzeSentiment(transcript);

      logger.info('Summary generated', {
        summaryId,
        type: options.type,
        wordCount: transcript.split(' ').length,
      });

      return {
        id: summaryId,
        meetingId,
        type: options.type || 'executive',
        title: this.generateTitle(content),
        content,
        bulletPoints,
        actionItems,
        decisions,
        highlights,
        sentiment,
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error('Summarization failed', { summaryId, error });
      throw new Error(`Summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract sections from transcript
   */
  private static async extractSections(transcript: string): Promise<{
    introduction?: string;
    discussion: string[];
    conclusion?: string;
  }> {
    // Simple heuristic: first 10% is intro, last 10% is conclusion
    const words = transcript.split(' ');
    const introLength = Math.floor(words.length * 0.1);
    const conclusionLength = Math.floor(words.length * 0.1);

    return {
      introduction: words.slice(0, introLength).join(' '),
      discussion: [words.slice(introLength, -conclusionLength).join(' ')],
      conclusion: words.slice(-conclusionLength).join(' '),
    };
  }

  /**
   * Extract action items from transcript
   */
  private static async extractActionItems(transcript: string): Promise<ActionItem[]> {
    const actionPatterns = [
      /\b(should|must|need to|have to|will)\s+(I|we|you|they|he|she)\s+(do|complete|finish|send|create|make|follow up)\b/gi,
      /\b(action item|task|to-do|todo)\b/gi,
      /\b(I'll|We'll|You'll|They'll)\s+\w+\b/gi,
      /\b(let's|please)\s+\w+\b/gi,
    ];

    const actionItems: ActionItem[] = [];
    let itemId = 1;

    // Split into sentences
    const sentences = transcript.split(/[.!?]+/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length < 20 || trimmed.length > 300) continue;

      for (const pattern of actionPatterns) {
        if (pattern.test(trimmed)) {
          actionItems.push({
            id: `action-${itemId++}`,
            description: trimmed,
            priority: this.detectPriority(trimmed),
            status: 'pending',
          });
          break;
        }
      }
    }

    return actionItems.slice(0, 10); // Limit to 10 action items
  }

  /**
   * Extract decisions from transcript
   */
  private static async extractDecisions(transcript: string): Promise<Decision[]> {
    const decisionPatterns = [
      /\b(decided|agreed|approved|confirmed|resolved)\b/gi,
      /\b(we'll go with|let's do|I think we should)\b/gi,
      /\b(final decision|conclusion|outcome)\b/gi,
    ];

    const decisions: Decision[] = [];
    let decisionId = 1;

    const sentences = transcript.split(/[.!?]+/);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length < 20 || trimmed.length > 300) continue;

      for (const pattern of decisionPatterns) {
        if (pattern.test(trimmed)) {
          decisions.push({
            id: `decision-${decisionId++}`,
            description: trimmed,
            participants: [],
          });
          break;
        }
      }
    }

    return decisions.slice(0, 5); // Limit to 5 key decisions
  }

  /**
   * Extract highlights from transcript
   */
  private static extractHighlights(transcript: string): string[] {
    // Find important sentences based on keywords
    const importanceKeywords = [
      'important', 'critical', 'key', 'main', 'essential',
      'remember', 'note', 'highlight', 'significant',
      'major', 'primary', 'crucial', 'vital',
    ];

    const sentences = transcript.split(/[.!?]+/);
    const highlights: string[] = [];

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (importanceKeywords.some(keyword => lower.includes(keyword))) {
        const trimmed = sentence.trim();
        if (trimmed.length > 30 && trimmed.length < 200) {
          highlights.push(trimmed);
        }
      }
    }

    return highlights.slice(0, 5);
  }

  /**
   * Analyze sentiment of transcript
   */
  private static async analyzeSentiment(transcript: string): Promise<{
    positive: number;
    neutral: number;
    negative: number;
  }> {
    // Simple keyword-based sentiment
    const positiveWords = [
      'good', 'great', 'excellent', 'awesome', 'perfect',
      'happy', 'pleased', 'satisfied', 'wonderful', 'fantastic',
      'agree', 'yes', 'approve', 'support', 'love',
    ];

    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'wrong',
      'sad', 'angry', 'frustrated', 'disappointed', 'hate',
      'disagree', 'no', 'reject', 'oppose', 'problem',
    ];

    const words = transcript.toLowerCase().split(/\s+/);
    const totalWords = words.length;

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of words) {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    }

    const positive = Math.round((positiveCount / totalWords) * 100);
    const negative = Math.round((negativeCount / totalWords) * 100);
    const neutral = 100 - positive - negative;

    return { positive, neutral, negative };
  }

  /**
   * Generate fallback summary (when model not available)
   */
  private static generateFallbackSummary(
    transcript: string,
    options: SummaryOptions
  ): string {
    const words = transcript.split(' ');
    const maxLength = options.maxLength || 150;
    const targetLength = Math.min(words.length * 0.2, maxLength);

    // Extract first N words as simple summary
    const summary = words.slice(0, Math.floor(targetLength)).join(' ') + '...';

    return summary;
  }

  /**
   * Extract bullet points from summary
   */
  private static extractBulletPoints(content: string): string[] {
    // Split by common bullet point indicators
    const sentences = content.split(/[.!?]+/);
    return sentences
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200)
      .slice(0, 5);
  }

  /**
   * Generate title from content
   */
  private static generateTitle(content: string): string {
    const firstSentence = content.split('.')[0];
    const words = firstSentence.split(' ').slice(0, 8);
    return words.join(' ') + (words.length < 8 ? '' : '...');
  }

  /**
   * Detect action item priority
   */
  private static detectPriority(text: string): 'low' | 'medium' | 'high' {
    const lower = text.toLowerCase();

    if (/\b(urgent|asap|immediate|critical|high priority)\b/i.test(lower)) {
      return 'high';
    }

    if (/\b(soon|next week|important|should)\b/i.test(lower)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `sum_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Export summary to different formats
   */
  static async export(
    summary: MeetingSummary,
    format: 'markdown' | 'html' | 'pdf' | 'json'
  ): Promise<string> {
    switch (format) {
      case 'markdown':
        return this.toMarkdown(summary);
      case 'html':
        return this.toHTML(summary);
      case 'json':
        return JSON.stringify(summary, null, 2);
      case 'pdf':
        // Would require additional library like pdfkit
        throw new Error('PDF export not implemented');
      default:
        return this.toMarkdown(summary);
    }
  }

  /**
   * Convert to Markdown format
   */
  private static toMarkdown(summary: MeetingSummary): string {
    let md = `# ${summary.title}\n\n`;
    md += `**Type:** ${summary.type}\n`;
    md += `**Generated:** ${summary.createdAt.toISOString()}\n\n`;

    md += `## Summary\n\n${summary.content}\n\n`;

    if (summary.bulletPoints.length > 0) {
      md += `## Key Points\n\n`;
      for (const point of summary.bulletPoints) {
        md += `- ${point}\n`;
      }
      md += '\n';
    }

    if (summary.actionItems.length > 0) {
      md += `## Action Items\n\n`;
      for (const item of summary.actionItems) {
        md += `- [ ] ${item.description}`;
        if (item.owner) md += ` (@${item.owner})`;
        md += `\n`;
      }
      md += '\n';
    }

    if (summary.decisions.length > 0) {
      md += `## Decisions\n\n`;
      for (const decision of summary.decisions) {
        md += `- ✅ ${decision.description}\n`;
      }
      md += '\n';
    }

    if (summary.highlights.length > 0) {
      md += `## Highlights\n\n`;
      for (const highlight of summary.highlights) {
        md += `> ${highlight}\n`;
      }
    }

    return md;
  }

  /**
   * Convert to HTML format
   */
  private static toHTML(summary: MeetingSummary): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${summary.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; }
    h1 { color: #3B82F6; }
    h2 { color: #1e40af; margin-top: 30px; }
    .meta { color: #666; font-size: 14px; }
    .action-item { background: #fef3c7; padding: 10px; margin: 10px 0; border-left: 4px solid #f59e0b; }
    .decision { background: #d1fae5; padding: 10px; margin: 10px 0; border-left: 4px solid #10b981; }
    .highlight { background: #f3f4f6; padding: 10px; margin: 10px 0; font-style: italic; }
    .sentiment { display: flex; gap: 20px; margin: 20px 0; }
    .sentiment-bar { height: 10px; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>${summary.title}</h1>
  <p class="meta">Type: ${summary.type} | Generated: ${summary.createdAt.toISOString()}</p>
  
  <h2>Summary</h2>
  <p>${summary.content}</p>
  
  ${summary.bulletPoints.length > 0 ? `
    <h2>Key Points</h2>
    <ul>${summary.bulletPoints.map(p => `<li>${p}</li>`).join('')}</ul>
  ` : ''}
  
  ${summary.actionItems.length > 0 ? `
    <h2>Action Items</h2>
    ${summary.actionItems.map(item => `
      <div class="action-item">⬜ ${item.description}</div>
    `).join('')}
  ` : ''}
  
  ${summary.decisions.length > 0 ? `
    <h2>Decisions</h2>
    ${summary.decisions.map(decision => `
      <div class="decision">✅ ${decision.description}</div>
    `).join('')}
  ` : ''}
  
  ${summary.highlights.length > 0 ? `
    <h2>Highlights</h2>
    ${summary.highlights.map(h => `<div class="highlight">${h}</div>`).join('')}
  ` : ''}
  
  <h2>Sentiment</h2>
  <div class="sentiment">
    <div style="flex: ${summary.sentiment.positive}">
      <div class="sentiment-bar" style="background: #10b981; width: ${summary.sentiment.positive}%"></div>
      <small>Positive: ${summary.sentiment.positive}%</small>
    </div>
    <div style="flex: ${summary.sentiment.neutral}">
      <div class="sentiment-bar" style="background: #6b7280; width: ${summary.sentiment.neutral}%"></div>
      <small>Neutral: ${summary.sentiment.neutral}%</small>
    </div>
    <div style="flex: ${summary.sentiment.negative}">
      <div class="sentiment-bar" style="background: #ef4444; width: ${summary.sentiment.negative}%"></div>
      <small>Negative: ${summary.sentiment.negative}%</small>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

export default SummarizationService;
