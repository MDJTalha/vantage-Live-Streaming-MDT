import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
// import crypto from 'crypto'; // Not currently used

interface Room {
  id: string;
  name: string;
  peers: Map<string, Peer>;
  createdAt: Date;
}

interface Peer {
  id: string;
  socket: Socket;
  userId?: string;
  email?: string;
  name?: string;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  joinedAt: Date;
}

interface Producer {
  id: string;
  kind: 'audio' | 'video';
  track: string;
  rtpParameters: any;
}

interface Consumer {
  id: string;
  producerId: string;
  rtpParameters: any;
}

/**
 * WebRTC Signaling Service
 * Handles peer connection signaling through WebSocket
 */
export class SignalingService {
  private rooms: Map<string, Room> = new Map();

  constructor(private io: Server) {
    this.setupEventHandlers();
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`📡 Peer connected: ${socket.id}`);

      // Join room
      socket.on('join-room', (data: { roomId: string; name?: string }) => {
        this.handleJoinRoom(socket, data);
      });

      // Leave room
      socket.on('leave-room', (data: { roomId: string }) => {
        this.handleLeaveRoom(socket, data.roomId);
      });

      // WebRTC Offer
      socket.on(
        'offer',
        (data: { roomId: string; offer: any; to: string }) => {
          this.handleOffer(socket, data);
        }
      );

      // WebRTC Answer
      socket.on(
        'answer',
        (data: { roomId: string; answer: any; to: string }) => {
          this.handleAnswer(socket, data);
        }
      );

      // ICE Candidate
      socket.on(
        'ice-candidate',
        (data: { roomId: string; candidate: any; to: string }) => {
          this.handleIceCandidate(socket, data);
        }
      );

      // Producer created
      socket.on(
        'produce',
        (data: { roomId: string; kind: 'audio' | 'video'; rtpParameters: any }) => {
          this.handleProduce(socket, data);
        }
      );

      // Disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Handle peer joining a room
   */
  private handleJoinRoom(
    socket: Socket,
    data: { roomId: string; name?: string }
  ) {
    const { roomId, name } = data;

    // Create room if doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        name: name || `Room ${roomId}`,
        peers: new Map(),
        createdAt: new Date(),
      });
    }

    const room = this.rooms.get(roomId)!;

    // Add peer to room
    const peer: Peer = {
      id: socket.id,
      socket,
      producers: new Map(),
      consumers: new Map(),
      joinedAt: new Date(),
    };

    room.peers.set(socket.id, peer);
    socket.join(roomId);

    console.log(`👤 Peer ${socket.id} joined room ${roomId}`);

    // Send existing peers info to new peer
    const existingPeers = Array.from(room.peers.values())
      .filter((p) => p.id !== socket.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        producers: Array.from(p.producers.values()).map((prod) => ({
          id: prod.id,
          kind: prod.kind,
        })),
      }));

    socket.emit('room-info', {
      roomId,
      peers: existingPeers,
    });

    // Notify others about new peer
    socket.to(roomId).emit('peer-joined', {
      peerId: socket.id,
      name: peer.name,
    });
  }

  /**
   * Handle peer leaving a room
   */
  private handleLeaveRoom(socket: Socket, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.peers.delete(socket.id);
    socket.leave(roomId);

    console.log(`👤 Peer ${socket.id} left room ${roomId}`);

    // Notify others
    socket.to(roomId).emit('peer-left', {
      peerId: socket.id,
    });

    // Clean up empty rooms
    if (room.peers.size === 0) {
      this.rooms.delete(roomId);
      console.log(`🗑️ Room ${roomId} deleted (no peers)`);
    }
  }

  /**
   * Handle WebRTC offer
   */
  private handleOffer(
    socket: Socket,
    data: { roomId: string; offer: any; to: string }
  ) {
    const { offer, to } = data;

    socket.to(to).emit('offer', {
      from: socket.id,
      offer,
    });

    console.log(`📤 Offer sent from ${socket.id} to ${to}`);
  }

  /**
   * Handle WebRTC answer
   */
  private handleAnswer(
    socket: Socket,
    data: { roomId: string; answer: any; to: string }
  ) {
    const { answer, to } = data;

    socket.to(to).emit('answer', {
      from: socket.id,
      answer,
    });

    console.log(`📥 Answer sent from ${socket.id} to ${to}`);
  }

  /**
   * Handle ICE candidate
   */
  private handleIceCandidate(
    socket: Socket,
    data: { roomId: string; candidate: any; to: string }
  ) {
    const { candidate, to } = data;

    socket.to(to).emit('ice-candidate', {
      from: socket.id,
      candidate,
    });
  }

  /**
   * Handle producer creation
   */
  private handleProduce(
    socket: Socket,
    data: { roomId: string; kind: 'audio' | 'video'; rtpParameters: any }
  ) {
    const { roomId, kind, rtpParameters } = data;
    const room = this.rooms.get(roomId);
    const peer = room?.peers.get(socket.id);

    if (!room || !peer) return;

    const producerId = uuidv4();
    const producer: Producer = {
      id: producerId,
      kind,
      track: rtpParameters.encodings?.[0]?.rid || kind,
      rtpParameters,
    };

    peer.producers.set(producerId, producer);

    // Notify others about new producer
    socket.to(roomId).emit('new-producer', {
      peerId: socket.id,
      producerId,
      kind,
      rtpParameters,
    });

    console.log(`🎬 Producer created: ${producerId} (${kind}) by ${socket.id}`);
  }

  /**
   * Handle peer disconnect
   */
  private handleDisconnect(socket: Socket) {
    // Find and remove from all rooms
    for (const [roomId, room] of this.rooms) {
      if (room.peers.has(socket.id)) {
        this.handleLeaveRoom(socket, roomId);
      }
    }

    console.log(`❌ Peer disconnected: ${socket.id}`);
  }

  /**
   * Get room info
   */
  getRoomInfo(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      id: room.id,
      name: room.name,
      peerCount: room.peers.size,
      peers: Array.from(room.peers.values()).map((p) => ({
        id: p.id,
        name: p.name,
        producerCount: p.producers.size,
      })),
      createdAt: room.createdAt,
    };
  }

  /**
   * Get all rooms
   */
  getAllRooms() {
    return Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      peerCount: room.peers.size,
      createdAt: room.createdAt,
    }));
  }

  /**
   * Get peer count in room
   */
  getPeerCount(roomId: string): number {
    const room = this.rooms.get(roomId);
    return room?.peers.size || 0;
  }
}

export default SignalingService;
