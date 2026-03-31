'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// ============================================
// Types
// ============================================

export interface ChatMessage {
  id: string;
  roomId?: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  content: string;
  timestamp: string;
  type: 'direct' | 'broadcast';
  read: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  online: boolean;
}

interface ChatContextType {
  // Connection
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;

  // Messages
  messages: ChatMessage[];
  rooms: ChatRoom[];
  selectedRoom: string | null;

  // Actions
  sendMessage: (content: string, receiverId?: string) => void;
  sendBroadcastMessage: (content: string) => void;
  selectRoom: (roomId: string | null) => void;
  markAsRead: (roomId: string) => void;
  getUnreadCount: () => number;

  // Users
  users: User[];
  currentUserId: string;
}

// ============================================
// Context
// ============================================

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Connect to Socket.IO
  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Get user from localStorage
    const token = localStorage.getItem('accessToken');
    let userId = '';
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId;
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }

    const newSocket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: `Bearer ${token}`,
      },
    });

    newSocket.on('connect', () => {
      console.log('✅ Chat connected to:', wsUrl);
      setIsConnected(true);
      
      // Join with user ID
      if (userId) {
        newSocket.emit('join', { userId });
        setCurrentUserId(userId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Chat disconnected');
      setIsConnected(false);
    });

    newSocket.on('message', (message: ChatMessage) => {
      console.log('📩 New message:', message);
      setMessages(prev => [...prev, message]);
      
      // Update room last message
      if (message.roomId) {
        setRooms(prev => prev.map(room => 
          room.id === message.roomId 
            ? { ...room, lastMessage: message, unreadCount: room.unreadCount + 1 }
            : room
        ));
      }
    });

    newSocket.on('users', (userList: User[]) => {
      console.log('👥 Users updated:', userList);
      setUsers(userList);
    });

    newSocket.on('user:joined', (data: { userId: string; name: string; timestamp: string }) => {
      console.log('👤 User joined:', data);
      // Add system message
      const systemMessage: ChatMessage = {
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        content: `${data.name} joined the meeting`,
        timestamp: data.timestamp,
        type: 'broadcast',
        read: true,
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    newSocket.on('user:left', (data: { userId: string; timestamp: string }) => {
      console.log('👤 User left:', data);
      // Add system message
      const systemMessage: ChatMessage = {
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        content: 'A user left the meeting',
        timestamp: data.timestamp,
        type: 'broadcast',
        read: true,
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    newSocket.on('reaction', (data: { userId: string; userName: string; type: string }) => {
      console.log('😊 Reaction:', data);
      // You can add reactions UI here
    });

    newSocket.on('error', (error: { message: string }) => {
      console.error('❌ Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Disconnect from Socket.IO
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // Send message to individual
  const sendMessage = useCallback((content: string, receiverId?: string) => {
    if (!socket || !content.trim()) return;

    if (receiverId) {
      // Direct message
      socket.emit('message:direct', {
        to: receiverId,
        content: content.trim(),
      });
    } else {
      // Broadcast to all
      socket.emit('message:broadcast', {
        content: content.trim(),
      });
    }
  }, [socket]);

  // Send broadcast message to all
  const sendBroadcastMessage = useCallback((content: string) => {
    sendMessage(content, undefined);
  }, [sendMessage]);

  // Select room
  const selectRoom = useCallback((roomId: string | null) => {
    setSelectedRoom(roomId);
    if (roomId) {
      // Mark messages as read
      setMessages(prev => prev.map(msg => 
        msg.roomId === roomId || msg.receiverId === roomId ? { ...msg, read: true } : msg
      ));
      setRooms(prev => prev.map(room =>
        room.id === roomId ? { ...room, unreadCount: 0 } : room
      ));
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback((roomId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.roomId === roomId ? { ...msg, read: true } : msg
    ));
    setRooms(prev => prev.map(room =>
      room.id === roomId ? { ...room, unreadCount: 0 } : room
    ));
  }, []);

  // Get total unread count
  const getUnreadCount = useCallback(() => {
    return rooms.reduce((total, room) => total + room.unreadCount, 0);
  }, [rooms]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Load initial rooms (mock data for now)
  useEffect(() => {
    const mockRooms: ChatRoom[] = [
      {
        id: 'general',
        name: 'General',
        participants: ['all'],
        lastMessage: undefined,
        unreadCount: 0,
      },
    ];
    setRooms(mockRooms);
  }, []);

  const value: ChatContextType = {
    isConnected,
    connect,
    disconnect,
    messages,
    rooms,
    selectedRoom,
    sendMessage,
    sendBroadcastMessage,
    selectRoom,
    markAsRead,
    getUnreadCount,
    users,
    currentUserId,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
