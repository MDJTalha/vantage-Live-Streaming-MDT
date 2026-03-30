/**
 * Streaming Service - Frontend API Client
 * Handles live streaming to external platforms (YouTube, Twitch, etc.)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface StreamConfig {
  roomId: string;
  platform: 'youtube' | 'twitch' | 'facebook' | 'custom';
  streamKey: string;
  rtmpUrl: string;
}

export interface StreamStatus {
  streamId: string;
  roomId: string;
  platform: string;
  status: 'live' | 'ending' | 'failed';
  startedAt: string;
  viewerCount?: number;
  bitrate?: number;
}

export interface StartStreamResponse {
  streamId: string;
}

class StreamingService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Start streaming to external platform
   */
  async startStream(config: StreamConfig): Promise<StartStreamResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/stream/start`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to start stream');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Stop streaming
   */
  async stopStream(streamId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/stream/stop`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ streamId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to stop stream');
    }
  }

  /**
   * Get stream status
   */
  async getStreamStatus(): Promise<{
    recordings: Array<{ recordingId: string; roomId: string; startedAt: string }>;
    streams: StreamStatus[];
  }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/stream/status`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get stream status');
    }

    const result = await response.json();
    return result.data;
  }
}

export const streamingService = new StreamingService();
export default streamingService;
