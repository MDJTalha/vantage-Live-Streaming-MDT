'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Poll {
  id: string;
  roomId: string;
  question: string;
  options: PollOption[];
  multipleChoice: boolean;
  createdBy: string;
  status: 'draft' | 'active' | 'ended';
  createdAt: Date;
  endsAt?: Date;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface UsePollOptions {
  roomId: string;
  apiBaseUrl?: string;
}

interface UsePollReturn {
  polls: Poll[];
  isLoading: boolean;
  createPoll: (question: string, options: string[], multipleChoice?: boolean) => Promise<void>;
  activatePoll: (pollId: string, durationMinutes?: number) => Promise<void>;
  endPoll: (pollId: string) => Promise<void>;
  vote: (pollId: string, optionId: string) => Promise<void>;
  deletePoll: (pollId: string) => Promise<void>;
  refreshPolls: () => Promise<void>;
}

/**
 * React Hook for Polls
 */
export function usePoll(options: UsePollOptions): UsePollReturn {
  const { roomId, apiBaseUrl = process.env.NEXT_PUBLIC_API_URL } = options;
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load polls
  const refreshPolls = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/polls/room/${roomId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPolls(data.data.map((poll: any) => ({
          ...poll,
          options: typeof poll.options === 'string' 
            ? JSON.parse(poll.options) 
            : poll.options,
        })));
      }
    } catch (error) {
      console.error('Error loading polls:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, apiBaseUrl]);

  useEffect(() => {
    refreshPolls();
  }, [refreshPolls]);

  // Create poll
  const createPoll = useCallback(async (
    question: string,
    options: string[],
    multipleChoice: boolean = false
  ) => {
    const response = await fetch(`${apiBaseUrl}/api/v1/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({
        roomId,
        question,
        options: options.map((text, index) => ({
          id: `option-${index + 1}`,
          text,
        })),
        multipleChoice,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create poll');
    }

    await refreshPolls();
  }, [roomId, apiBaseUrl, refreshPolls]);

  // Activate poll
  const activatePoll = useCallback(async (pollId: string, durationMinutes: number = 30) => {
    const response = await fetch(`${apiBaseUrl}/api/v1/polls/${pollId}/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ durationMinutes }),
    });

    if (!response.ok) {
      throw new Error('Failed to activate poll');
    }

    await refreshPolls();
  }, [apiBaseUrl, refreshPolls]);

  // End poll
  const endPoll = useCallback(async (pollId: string) => {
    const response = await fetch(`${apiBaseUrl}/api/v1/polls/${pollId}/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to end poll');
    }

    await refreshPolls();
  }, [apiBaseUrl, refreshPolls]);

  // Vote
  const vote = useCallback(async (pollId: string, optionId: string) => {
    const response = await fetch(`${apiBaseUrl}/api/v1/polls/${pollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ optionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to vote');
    }

    await refreshPolls();
  }, [apiBaseUrl, refreshPolls]);

  // Delete poll
  const deletePoll = useCallback(async (pollId: string) => {
    const response = await fetch(`${apiBaseUrl}/api/v1/polls/${pollId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete poll');
    }

    await refreshPolls();
  }, [apiBaseUrl, refreshPolls]);

  return {
    polls,
    isLoading,
    createPoll,
    activatePoll,
    endPoll,
    vote,
    deletePoll,
    refreshPolls,
  };
}

export default usePoll;
