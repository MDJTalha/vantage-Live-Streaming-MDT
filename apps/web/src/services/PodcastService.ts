/**
 * Podcast Service - Production Ready
 * Handles podcast episode creation, management, and publishing
 */

export interface PodcastEpisode {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'recording' | 'published' | 'scheduled';
  recordingType: 'video' | 'audio';
  guests?: string[];
  duration?: number;
  recordingUrl?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
  hostId: string;
  hostName: string;
  analytics?: {
    plays: number;
    likes: number;
    shares: number;
    avgListenDuration?: number;
  };
}

export interface PodcastRecording {
  url: string;
  duration: number;
  size: number;
  type: 'video' | 'audio';
}

class PodcastServiceClass {
  private storage = {
    episodes: 'podcast_episodes',
    recordings: 'podcast_recordings',
  };

  /**
   * Get all episodes for a host
   */
  async getEpisodes(hostId: string): Promise<PodcastEpisode[]> {
    const episodes = JSON.parse(localStorage.getItem(this.storage.episodes) || '[]') as PodcastEpisode[];
    return episodes.filter(ep => ep.hostId === hostId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get a single episode by ID
   */
  async getEpisode(episodeId: string): Promise<PodcastEpisode | null> {
    const episodes = JSON.parse(localStorage.getItem(this.storage.episodes) || '[]') as PodcastEpisode[];
    return episodes.find(ep => ep.id === episodeId) || null;
  }

  /**
   * Create a new episode
   */
  async createEpisode(data: {
    title: string;
    description?: string;
    recordingType: 'video' | 'audio';
    guests?: string[];
    hostId: string;
    hostName: string;
  }): Promise<PodcastEpisode> {
    const episodes = JSON.parse(localStorage.getItem(this.storage.episodes) || '[]') as PodcastEpisode[];
    
    const episode: PodcastEpisode = {
      id: `ep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: data.title,
      description: data.description,
      status: 'draft',
      recordingType: data.recordingType,
      guests: data.guests || [],
      hostId: data.hostId,
      hostName: data.hostName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    episodes.push(episode);
    localStorage.setItem(this.storage.episodes, JSON.stringify(episodes));
    
    return episode;
  }

  /**
   * Update episode details
   */
  async updateEpisode(episodeId: string, updates: Partial<PodcastEpisode>): Promise<PodcastEpisode> {
    const episodes = JSON.parse(localStorage.getItem(this.storage.episodes) || '[]') as PodcastEpisode[];
    const index = episodes.findIndex(ep => ep.id === episodeId);
    
    if (index === -1) {
      throw new Error('Episode not found');
    }

    episodes[index] = {
      ...episodes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(this.storage.episodes, JSON.stringify(episodes));
    return episodes[index];
  }

  /**
   * Start recording an episode
   */
  async startRecording(episodeId: string): Promise<void> {
    await this.updateEpisode(episodeId, { status: 'recording' });
  }

  /**
   * Stop recording and save the recording
   */
  async stopRecording(episodeId: string, recording: PodcastRecording): Promise<PodcastEpisode> {
    const episode = await this.updateEpisode(episodeId, {
      status: 'draft',
      recordingUrl: recording.url,
      duration: recording.duration,
    });

    // Save recording metadata
    const recordings = JSON.parse(localStorage.getItem(this.storage.recordings) || '[]');
    recordings.push({
      episodeId,
      ...recording,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(this.storage.recordings, JSON.stringify(recordings));

    return episode;
  }

  /**
   * Publish an episode
   */
  async publishEpisode(episodeId: string): Promise<PodcastEpisode> {
    const episode = await this.getEpisode(episodeId);
    
    if (!episode) {
      throw new Error('Episode not found');
    }

    if (episode.status === 'recording') {
      throw new Error('Cannot publish while recording is in progress');
    }

    return await this.updateEpisode(episodeId, {
      status: 'published',
      publishedAt: new Date().toISOString(),
      analytics: {
        plays: 0,
        likes: 0,
        shares: 0,
      },
    });
  }

  /**
   * Schedule an episode for publishing
   */
  async scheduleEpisode(episodeId: string, scheduledFor: string): Promise<PodcastEpisode> {
    return await this.updateEpisode(episodeId, {
      status: 'scheduled',
      scheduledFor,
    });
  }

  /**
   * Delete an episode
   */
  async deleteEpisode(episodeId: string): Promise<void> {
    const episodes = JSON.parse(localStorage.getItem(this.storage.episodes) || '[]') as PodcastEpisode[];
    const filtered = episodes.filter(ep => ep.id !== episodeId);
    localStorage.setItem(this.storage.episodes, JSON.stringify(filtered));

    // Also remove associated recordings
    const recordings = JSON.parse(localStorage.getItem(this.storage.recordings) || '[]');
    const filteredRecordings = recordings.filter((r: any) => r.episodeId !== episodeId);
    localStorage.setItem(this.storage.recordings, JSON.stringify(filteredRecordings));
  }

  /**
   * Get episode analytics
   */
  async getEpisodeAnalytics(episodeId: string): Promise<PodcastEpisode['analytics'] | null> {
    const episode = await this.getEpisode(episodeId);
    return episode?.analytics || null;
  }

  /**
   * Get all podcast statistics for a host
   */
  async getStatistics(hostId: string): Promise<{
    totalEpisodes: number;
    publishedEpisodes: number;
    draftEpisodes: number;
    totalPlays: number;
    totalLikes: number;
    totalDuration: number;
  }> {
    const episodes = await this.getEpisodes(hostId);
    
    return {
      totalEpisodes: episodes.length,
      publishedEpisodes: episodes.filter(ep => ep.status === 'published').length,
      draftEpisodes: episodes.filter(ep => ep.status === 'draft').length,
      totalPlays: episodes.reduce((sum, ep) => sum + (ep.analytics?.plays || 0), 0),
      totalLikes: episodes.reduce((sum, ep) => sum + (ep.analytics?.likes || 0), 0),
      totalDuration: episodes.reduce((sum, ep) => sum + (ep.duration || 0), 0),
    };
  }

  /**
   * Export recording for download
   */
  async exportRecording(recording: PodcastRecording, filename: string): Promise<void> {
    // Create a download link for the recording
    const link = document.createElement('a');
    link.href = recording.url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const podcastService = new PodcastServiceClass();
export default podcastService;
