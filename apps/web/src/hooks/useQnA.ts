'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Question {
  id: string;
  roomId: string;
  userId?: string;
  guestName?: string;
  content: string;
  upvotes: number;
  answered: boolean;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface UseQnAOptions {
  roomId: string;
  apiBaseUrl?: string;
}

interface UseQnAReturn {
  questions: Question[];
  isLoading: boolean;
  askQuestion: (content: string) => Promise<void>;
  upvoteQuestion: (questionId: string) => Promise<void>;
  markAnswered: (questionId: string) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  refreshQuestions: () => Promise<void>;
}

/**
 * React Hook for Q&A
 */
export function useQnA(options: UseQnAOptions): UseQnAReturn {
  const { roomId, apiBaseUrl = process.env.NEXT_PUBLIC_API_URL } = options;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load questions
  const refreshQuestions = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/questions/room/${roomId}`);
      
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.data);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, apiBaseUrl]);

  useEffect(() => {
    refreshQuestions();
  }, [refreshQuestions]);

  // Ask question
  const askQuestion = useCallback(async (content: string) => {
    const response = await fetch(`${apiBaseUrl}/api/v1/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({
        roomId,
        content,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to ask question');
    }

    await refreshQuestions();
  }, [roomId, apiBaseUrl, refreshQuestions]);

  // Upvote question
  const upvoteQuestion = useCallback(async (questionId: string) => {
    const response = await fetch(`${apiBaseUrl}/api/v1/questions/${questionId}/upvote`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upvote');
    }

    await refreshQuestions();
  }, [apiBaseUrl, refreshQuestions]);

  // Mark as answered
  const markAnswered = useCallback(async (questionId: string) => {
    const response = await fetch(`${apiBaseUrl}/api/v1/questions/${questionId}/answer`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark answered');
    }

    await refreshQuestions();
  }, [apiBaseUrl, refreshQuestions]);

  // Delete question
  const deleteQuestion = useCallback(async (questionId: string) => {
    const response = await fetch(`${apiBaseUrl}/api/v1/questions/${questionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete question');
    }

    await refreshQuestions();
  }, [apiBaseUrl, refreshQuestions]);

  return {
    questions,
    isLoading,
    askQuestion,
    upvoteQuestion,
    markAnswered,
    deleteQuestion,
    refreshQuestions,
  };
}

export default useQnA;
