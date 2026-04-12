/**
 * Podcast Service - Production Ready
 * Handles podcast and episode creation, management, and publishing via API
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Podcast {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  isPublished: boolean;
  episodeCount?: number;
  episodes?: PodcastEpisode[];
  createdAt: string;
  updatedAt: string;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  description?: string;
  audioUrl?: string;
  videoUrl?: string;
  duration?: number;
  episodeNumber: number;
  seasonNumber: number;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...getAuthHeaders(), ...(options.headers as Record<string, string>) };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

class PodcastServiceClass {
  /**
   * Get all podcasts for the authenticated user
   */
  async getAll(): Promise<Podcast[]> {
    const response = await fetchAPI<{ podcasts: Podcast[] }>('/api/v1/podcasts');
    return response.podcasts;
  }

  /**
   * Create a new podcast
   */
  async create(data: {
    title: string;
    description?: string;
    coverImageUrl?: string;
  }): Promise<Podcast> {
    return fetchAPI<Podcast>('/api/v1/podcasts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get a podcast by ID with episodes
   */
  async getById(id: string): Promise<Podcast> {
    return fetchAPI<Podcast>(`/api/v1/podcasts/${id}`);
  }

  /**
   * Update a podcast
   */
  async update(id: string, data: Partial<Podcast>): Promise<Podcast> {
    return fetchAPI<Podcast>(`/api/v1/podcasts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a podcast
   */
  async delete(id: string): Promise<void> {
    return fetchAPI<void>(`/api/v1/podcasts/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get episodes for a podcast
   */
  async getEpisodes(podcastId: string): Promise<PodcastEpisode[]> {
    const response = await fetchAPI<{ episodes: PodcastEpisode[] }>(`/api/v1/podcasts/${podcastId}/episodes`);
    return response.episodes;
  }

  /**
   * Create an episode for a podcast
   */
  async createEpisode(podcastId: string, data: {
    title: string;
    description?: string;
    episodeNumber?: number;
    seasonNumber?: number;
  }): Promise<PodcastEpisode> {
    return fetchAPI<PodcastEpisode>(`/api/v1/podcasts/${podcastId}/episodes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const podcastService = new PodcastServiceClass();
export default podcastService;
