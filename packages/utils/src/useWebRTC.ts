import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebRTCClient } from './WebRTCClient';

export interface UseWebRTCHookOptions {
  roomId?: string;
  userId?: string;
  name?: string;
  iceServers?: RTCIceServer[];
  onPeerJoined?: (peerId: string) => void;
  onPeerLeft?: (peerId: string) => void;
  onStreamAdded?: (stream: MediaStream, peerId: string) => void;
  onStreamRemoved?: (peerId: string) => void;
}

export interface UseWebRTCReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Local media
  localStream: MediaStream | null;
  localVideoRef: React.RefObject<HTMLVideoElement>;

  // Remote streams
  remoteStreams: Map<string, MediaStream>;

  // Media controls
  toggleAudio: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;

  // Room controls
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;

  // Peer info
  peers: Array<{ id: string; name?: string }>;

  // Cleanup
  disconnect: () => void;
}

/**
 * React Hook for WebRTC video conferencing
 */
export function useWebRTC(options: UseWebRTCHookOptions = {}): UseWebRTCReturn {
  const {
    roomId: initialRoomId,
    userId,
    name,
    onPeerJoined,
    onPeerLeft,
    onStreamAdded,
    onStreamRemoved,
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peers, setPeers] = useState<Array<{ id: string; name?: string }>>([]);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const webrtcClientRef = useRef<WebRTCClient | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const roomIdRef = useRef<string | undefined>(initialRoomId);

  // Initialize WebRTC client
  useEffect(() => {
    const client = new WebRTCClient();

    client.initialize({
      onStreamAdded: (stream, peerId) => {
        console.log('Stream added from peer:', peerId);
        setRemoteStreams((prev) => new Map(prev).set(peerId, stream));
        onStreamAdded?.(stream, peerId);
      },
      onStreamRemoved: (peerId) => {
        console.log('Stream removed from peer:', peerId);
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
        onStreamRemoved?.(peerId);
      },
      onIceCandidate: (candidate) => {
        if (socketRef.current && roomIdRef.current) {
          socketRef.current.emit('ice-candidate', {
            roomId: roomIdRef.current,
            candidate,
            to: '', // Will be filled by signaling
          });
        }
      },
      onConnectionStateChange: (state) => {
        console.log('Connection state:', state);
        setIsConnected(state === 'connected');
      },
    });

    webrtcClientRef.current = client;

    return () => {
      client.close();
    };
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000', {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('accessToken'),
      },
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnecting(false);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnecting(false);
    });

    // Peer events
    socket.on('peer-joined', (data: { peerId: string; name?: string }) => {
      console.log('Peer joined:', data.peerId);
      onPeerJoined?.(data.peerId);
      setPeers((prev) => [...prev, { id: data.peerId, name: data.name }]);
    });

    socket.on('peer-left', (data: { peerId: string }) => {
      console.log('Peer left:', data.peerId);
      onPeerLeft?.(data.peerId);
      setPeers((prev) => prev.filter((p) => p.id !== data.peerId));
    });

    socket.on('room-info', (data: { peers: Array<{ id: string; name?: string }> }) => {
      setPeers(data.peers);
    });

    // WebRTC signaling events
    socket.on('offer', async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      console.log('Received offer from:', data.from);
      
      if (!webrtcClientRef.current) return;

      try {
        const answer = await webrtcClientRef.current.createAnswer(data.offer);
        
        socket.emit('answer', {
          roomId: roomIdRef.current,
          answer,
          to: data.from,
        });
      } catch (error) {
        console.error('Error creating answer:', error);
      }
    });

    socket.on('answer', async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      console.log('Received answer from:', data.from);
      
      if (!webrtcClientRef.current) return;

      try {
        await webrtcClientRef.current.setRemoteDescription(data.answer);
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    });

    socket.on('ice-candidate', async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      if (!webrtcClientRef.current) return;

      try {
        await webrtcClientRef.current.addIceCandidate(data.candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Update local video when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Join room
  const joinRoom = useCallback(async (roomId: string) => {
    setIsConnecting(true);
    setConnectionError(null);
    roomIdRef.current = roomId;

    try {
      // Start local media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });

      setLocalStream(stream);

      // Add tracks to peer connection via method
      if (webrtcClientRef.current) {
        await webrtcClientRef.current.startLocalMedia();
      }

      // Join room via socket
      socketRef.current?.emit('join-room', {
        roomId,
        name: name || userId || 'Anonymous',
        userId,
      });

      setIsConnected(true);
      setIsConnecting(false);
    } catch (error: any) {
      console.error('Error joining room:', error);
      setConnectionError(error.message);
      setIsConnecting(false);
    }
  }, [userId, name]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (roomIdRef.current) {
      socketRef.current?.emit('leave-room', { roomId: roomIdRef.current });
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    setRemoteStreams(new Map());
    setPeers([]);
    setIsConnected(false);
  }, [localStream]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, [localStream]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (!webrtcClientRef.current) return;
    await webrtcClientRef.current.switchCamera();
  }, []);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    if (!webrtcClientRef.current) return;
    const screenStream = await webrtcClientRef.current.startScreenShare();
    setLocalStream(screenStream);
  }, []);

  // Stop screen share
  const stopScreenShare = useCallback(async () => {
    if (!webrtcClientRef.current) return;
    await webrtcClientRef.current.stopScreenShare();
    
    // Restart camera
    const cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    });
    
    setLocalStream(cameraStream);
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    leaveRoom();
    socketRef.current?.disconnect();
    webrtcClientRef.current?.close();
  }, [leaveRoom]);

  return {
    isConnected,
    isConnecting,
    connectionError,
    localStream,
    localVideoRef,
    remoteStreams,
    toggleAudio,
    toggleVideo,
    switchCamera,
    startScreenShare,
    stopScreenShare,
    joinRoom,
    leaveRoom,
    peers,
    disconnect,
  };
}

export default useWebRTC;
