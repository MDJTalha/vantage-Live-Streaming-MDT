'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
// @ts-ignore - socket.io-client types not available
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  type?: 'text' | 'emoji' | 'system';
  reactions?: Array<{ emoji: string; count: number }>;
}

interface UseChatOptions {
  roomId: string;
  userId?: string;
  userName?: string;
  apiBaseUrl?: string;
  wsUrl?: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  sendMessage: (content: string, type?: 'text' | 'emoji') => void;
  addReaction: (messageId: string, emoji: string) => void;
  clearMessages: () => void;
}

/**
 * React Hook for Real-time Chat
 */
export function useChat(options: UseChatOptions): UseChatReturn {
  const {
    roomId,
    userId: _userId,
    userName = 'Anonymous',
    apiBaseUrl = process.env.NEXT_PUBLIC_API_URL,
    wsUrl = process.env.NEXT_PUBLIC_WS_URL,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new message arrives
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!roomId) return;

    const socket = io(wsUrl || 'ws://localhost:4000', {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('accessToken'),
      },
    });

    socket.on('connect', () => {
      console.log('Chat connected');
      setIsConnected(true);
      setIsLoading(false);

      // Join room
      socket.emit('join-room', { roomId });
    });

    socket.on('disconnect', () => {
      console.log('Chat disconnected');
      setIsConnected(false);
    });

    // Receive message
    socket.on('receive-message', (data: {
      id: string;
      sender: string;
      content: string;
      timestamp: string;
      type?: string;
    }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          sender: data.sender,
          content: data.content,
          timestamp: new Date(data.timestamp),
          type: (data.type as any) || 'text',
        },
      ]);
    });

    // Load chat history
    async function loadHistory() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/chat/${roomId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.data || []);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }

    loadHistory();

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [roomId, apiBaseUrl, wsUrl]);

  // Send message
  const sendMessage = useCallback((content: string, type: 'text' | 'emoji' = 'text') => {
    if (!socketRef.current || !content.trim()) return;

    const message = {
      id: Date.now().toString(),
      sender: userName,
      content,
      timestamp: new Date(),
      type,
    };

    // Optimistic update
    setMessages((prev) => [...prev, message]);

    // Send via WebSocket
    socketRef.current.emit('send-message', {
      roomId,
      content,
      type,
    });

    // Also save to database
    fetch(`${apiBaseUrl}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({
        roomId,
        content,
        messageType: type === 'emoji' ? 'EMOJI' : 'TEXT',
      }),
    }).catch(console.error);
  }, [roomId, userName, apiBaseUrl]);

  // Add reaction
  const addReaction = useCallback((messageId: string, emoji: string) => {
    fetch(`${apiBaseUrl}/api/v1/chat/${messageId}/reaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ emoji }),
    }).catch(console.error);
  }, [apiBaseUrl]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isConnected,
    isLoading,
    sendMessage,
    addReaction,
    clearMessages,
  };
}

export default useChat;
