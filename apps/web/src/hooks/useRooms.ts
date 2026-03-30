'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Room {
  id: string;
  roomCode: string;
  name: string;
  description?: string;
  hostId: string;
  status: 'scheduled' | 'active' | 'ended' | 'recorded';
  settings: RoomSettings;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  host?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  participants?: Participant[];
  _count?: {
    participants: number;
  };
}

export interface RoomSettings {
  maxParticipants: number;
  allowChat: boolean;
  allowScreenShare: boolean;
  allowRecording: boolean;
  requirePassword: boolean;
  requireApproval: boolean;
  enableBreakoutRooms: boolean;
  enableWaitingRoom: boolean;
}

export interface Participant {
  id: string;
  userId?: string;
  guestName?: string;
  role: 'host' | 'cohost' | 'participant' | 'viewer';
  joinedAt: Date;
  isSpeaking: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface UseRoomsOptions {
  apiBaseUrl?: string;
}

interface UseRoomsReturn {
  rooms: Room[];
  activeRooms: Room[];
  isLoading: boolean;
  createRoom: (data: CreateRoomData) => Promise<Room>;
  joinRoom: (roomCode: string, data?: JoinRoomData) => Promise<{ room: Room; participant: Participant }>;
  startRoom: (roomId: string) => Promise<Room>;
  endRoom: (roomId: string) => Promise<Room>;
  updateSettings: (roomId: string, settings: Partial<RoomSettings>) => Promise<Room>;
  promoteToCohost: (participantId: string) => Promise<Participant>;
  removeParticipant: (participantId: string) => Promise<void>;
  getRoomByCode: (roomCode: string) => Promise<Room | null>;
  refreshRooms: () => Promise<void>;
}

interface CreateRoomData {
  name: string;
  description?: string;
  settings?: Partial<RoomSettings>;
  password?: string;
}

interface JoinRoomData {
  password?: string;
  guestName?: string;
}

/**
 * React Hook for Room Management
 */
export function useRooms(options: UseRoomsOptions = {}): UseRoomsReturn {
  const { apiBaseUrl = process.env.NEXT_PUBLIC_API_URL } = options;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRooms, setActiveRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's rooms
  const refreshRooms = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/rooms`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data.data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }, [apiBaseUrl]);

  // Load active rooms
  const refreshActiveRooms = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/rooms/active`);

      if (response.ok) {
        const data = await response.json();
        setActiveRooms(data.data);
      }
    } catch (error) {
      console.error('Error fetching active rooms:', error);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    Promise.all([refreshRooms(), refreshActiveRooms()]).finally(() => {
      setIsLoading(false);
    });
  }, [refreshRooms, refreshActiveRooms]);

  // Create room
  const createRoom = useCallback(async (data: CreateRoomData): Promise<Room> => {
    const response = await fetch(`${apiBaseUrl}/api/v1/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create room');
    }

    const result = await response.json();
    await refreshRooms();
    return result.data;
  }, [apiBaseUrl, refreshRooms]);

  // Join room
  const joinRoom = useCallback(async (
    roomCode: string,
    data: JoinRoomData = {}
  ): Promise<{ room: Room; participant: Participant }> => {
    const response = await fetch(`${apiBaseUrl}/api/v1/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to join room');
    }

    const result = await response.json();
    return result.data;
  }, [apiBaseUrl]);

  // Start room
  const startRoom = useCallback(async (roomId: string): Promise<Room> => {
    const response = await fetch(`${apiBaseUrl}/api/v1/rooms/${roomId}/start`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to start room');
    }

    const result = await response.json();
    await refreshRooms();
    return result.data;
  }, [apiBaseUrl, refreshRooms]);

  // End room
  const endRoom = useCallback(async (roomId: string): Promise<Room> => {
    const response = await fetch(`${apiBaseUrl}/api/v1/rooms/${roomId}/end`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to end room');
    }

    const result = await response.json();
    await refreshRooms();
    return result.data;
  }, [apiBaseUrl, refreshRooms]);

  // Update settings
  const updateSettings = useCallback(async (
    roomId: string,
    settings: Partial<RoomSettings>
  ): Promise<Room> => {
    const response = await fetch(`${apiBaseUrl}/api/v1/rooms/${roomId}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update settings');
    }

    const result = await response.json();
    await refreshRooms();
    return result.data;
  }, [apiBaseUrl, refreshRooms]);

  // Promote to co-host
  const promoteToCohost = useCallback(async (participantId: string): Promise<Participant> => {
    const response = await fetch(`${apiBaseUrl}/api/v1/rooms/participants/${participantId}/promote`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to promote participant');
    }

    const result = await response.json();
    return result.data;
  }, [apiBaseUrl]);

  // Remove participant
  const removeParticipant = useCallback(async (participantId: string): Promise<void> => {
    const response = await fetch(`${apiBaseUrl}/api/v1/rooms/participants/${participantId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to remove participant');
    }
  }, [apiBaseUrl]);

  // Get room by code
  const getRoomByCode = useCallback(async (roomCode: string): Promise<Room | null> => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/rooms/${roomCode}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching room:', error);
      return null;
    }
  }, [apiBaseUrl]);

  return {
    rooms,
    activeRooms,
    isLoading,
    createRoom,
    joinRoom,
    startRoom,
    endRoom,
    updateSettings,
    promoteToCohost,
    removeParticipant,
    getRoomByCode,
    refreshRooms,
  };
}

export default useRooms;
