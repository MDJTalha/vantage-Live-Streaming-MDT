/**
 * Recording Service - Frontend API Client
 * Handles all recording-related API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Recording {
  id: string;
  key: string;
  roomId: string;
  title: string;
  duration: number;
  size: number;
  format: string;
  status: 'processing' | 'ready' | 'failed';
  createdAt: string;
  thumbnailUrl?: string;
}

export interface StartRecordingRequest {
  roomId: string;
  title: string;
  outputFormat?: 'mp4' | 'webm' | 'mkv';
}

export interface StartRecordingResponse {
  recordingId: string;
}

class RecordingService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Start recording a room
   */
  async startRecording(data: StartRecordingRequest): Promise<StartRecordingResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/recordings/start`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to start recording');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Stop recording
   */
  async stopRecording(recordingId: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/v1/recordings/stop`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ recordingId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to stop recording');
    }

    const result = await response.json();
    return result.data.recordingKey;
  }

  /**
   * Get all recordings for a room
   */
  async getRecordings(roomId: string): Promise<Recording[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/recordings/${roomId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch recordings');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get signed URL for recording playback
   */
  async getRecordingUrl(roomId: string, key: string): Promise<string> {
    const encodedKey = encodeURIComponent(key);
    const response = await fetch(
      `${API_BASE_URL}/api/v1/recordings/${roomId}/${encodedKey}/url`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get recording URL');
    }

    const result = await response.json();
    return result.data.url;
  }

  /**
   * Delete a recording
   */
  async deleteRecording(key: string): Promise<void> {
    const encodedKey = encodeURIComponent(key);
    const response = await fetch(`${API_BASE_URL}/api/v1/recordings/${encodedKey}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete recording');
    }
  }

  /**
   * Get active recordings/stream status
   */
  async getActiveStatus(): Promise<{
    recordings: Array<{ recordingId: string; roomId: string; startedAt: string }>;
    streams: Array<{ streamId: string; roomId: string; platform: string; startedAt: string }>;
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

export const recordingService = new RecordingService();
export default recordingService;
