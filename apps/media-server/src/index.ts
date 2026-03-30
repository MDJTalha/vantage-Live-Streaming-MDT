import express, { Express, Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '@vantage/config';
import MediasoupServer, { mediasoupConfig } from './mediasoupServer';

const app: Express = express();
const PORT = config.mediaServer.port || 443;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'media-server',
    timestamp: new Date().toISOString(),
  });
});

// Get server stats
app.get('/stats', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mediasoup: mediasoupServer.getStats(),
  });
});

// Create HTTPS server
const server = http.createServer(app);

// Create Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: config.frontend.url || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Initialize Mediasoup
const mediasoupServer = new MediasoupServer();

// Room management
interface Room {
  id: string;
  name: string;
  peers: Map<string, Peer>;
  router?: any;
}

interface Peer {
  id: string;
  socket: Socket;
  userId?: string;
  name?: string;
  transport?: any;
  producers: Map<string, any>;
  consumers: Map<string, any>;
  canSend: boolean;
  canReceive: boolean;
}

const rooms: Map<string, Room> = new Map();

/**
 * Initialize media server
 */
async function initialize() {
  try {
    await mediasoupServer.initialize();
    console.log('✅ Mediasoup server initialized');

    // Setup WebSocket handlers
    setupWebSocketHandlers(io);

    // Start server
    server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎬 VANTAGE Media Server (SFU)                           ║
║                                                           ║
║   Status: Running                                         ║
║   Port: ${PORT}                                              ║
║   Min Port: ${mediasoupConfig.worker.rtcMinPort}                                    ║
║   Max Port: ${mediasoupConfig.worker.rtcMaxPort}                                    ║
║                                                           ║
║   WebSocket: ws://localhost:${PORT}                         ║
║   Health:  http://localhost:${PORT}/health                  ║
║   Stats:   http://localhost:${PORT}/stats                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to initialize media server:', error);
    process.exit(1);
  }
}

/**
 * Setup WebSocket event handlers
 */
function setupWebSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Peer connected: ${socket.id}`);

    // Get router capabilities
    socket.on('get-router-rtp-capabilities', async (callback) => {
      try {
        const rtpCapabilities = mediasoupServer.getRtpCapabilities();
        callback({ success: true, rtpCapabilities });
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });

    // Create transport for sending media
    socket.on('create-send-transport', async (data: { roomId: string }, callback) => {
      try {
        const { transport, parameters } = await mediasoupServer.createWebRtcTransport(true);
        
        // Store transport info temporarily (will be associated with peer on connect)
        socket.data.sendTransportId = transport.id;
        socket.data.roomId = data.roomId;
        
        callback({ success: true, ...parameters });
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });

    // Create transport for receiving media
    socket.on('create-recv-transport', async (data: { roomId: string }, callback) => {
      try {
        const { transport, parameters } = await mediasoupServer.createWebRtcTransport(false);
        
        socket.data.recvTransportId = transport.id;
        socket.data.roomId = data.roomId;
        
        callback({ success: true, ...parameters });
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });

    // Connect transport
    socket.on('connect-transport', async (data: {
      transportId: string;
      dtlsParameters: any;
    }, callback) => {
      try {
        await mediasoupServer.connectTransport(data.transportId, data.dtlsParameters);
        callback({ success: true });
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });

    // Produce (publish media)
    socket.on('produce', async (data: {
      transportId: string;
      kind: 'audio' | 'video';
      rtpParameters: any;
      appData?: any;
    }, callback) => {
      try {
        const { producer, id } = await mediasoupServer.createProducer(
          data.transportId,
          data.kind,
          data.rtpParameters,
          { ...data.appData, peerId: socket.id }
        );

        // Notify others in room
        const roomId = socket.data.roomId;
        if (roomId) {
          socket.to(roomId).emit('new-producer', {
            peerId: socket.id,
            producerId: id,
            kind: data.kind,
            appData: data.appData,
          });
        }

        callback({ success: true, id });
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });

    // Consume (subscribe to media)
    socket.on('consume', async (data: {
      transportId: string;
      producerId: string;
      rtpCapabilities: any;
    }, callback) => {
      try {
        const { consumer, parameters } = await mediasoupServer.createConsumer(
          data.transportId,
          data.producerId,
          data.rtpCapabilities
        );

        callback({ success: true, ...parameters });
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });

    // Resume consumer
    socket.on('resume-consumer', async (data: { consumerId: string }, callback) => {
      try {
        await mediasoupServer.resumeConsumer(data.consumerId);
        callback({ success: true });
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });

    // Pause consumer
    socket.on('pause-consumer', async (data: { consumerId: string }, callback) => {
      try {
        await mediasoupServer.pauseConsumer(data.consumerId);
        callback({ success: true });
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });

    // Set consumer priority
    socket.on('set-consumer-priority', async (data: {
      consumerId: string;
      priority: number;
    }, callback) => {
      try {
        await mediasoupServer.setConsumerPriority(data.consumerId, data.priority);
        callback({ success: true });
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });

    // Request keyframe
    socket.on('request-keyframe', async (data: { consumerIds: string[] }, callback) => {
      try {
        await mediasoupServer.requestKeyframe(data.consumerIds);
        callback({ success: true });
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });

    // Join room
    socket.on('join-room', async (data: {
      roomId: string;
      name: string;
      userId?: string;
    }) => {
      const { roomId, name, userId } = data;

      // Create room if doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          name,
          peers: new Map(),
        });
      }

      const room = rooms.get(roomId)!;

      // Add peer to room
      const peer: Peer = {
        id: socket.id,
        socket,
        userId,
        name,
        producers: new Map(),
        consumers: new Map(),
        canSend: true,
        canReceive: true,
      };

      room.peers.set(socket.id, peer);
      socket.join(roomId);

      console.log(`👤 Peer ${socket.id} (${name}) joined room ${roomId}`);

      // Send existing peers info
      const existingPeers = Array.from(room.peers.values())
        .filter((p) => p.id !== socket.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          userId: p.userId,
        }));

      socket.emit('room-info', {
        roomId,
        peers: existingPeers,
      });

      // Notify others
      socket.to(roomId).emit('peer-joined', {
        peerId: socket.id,
        name,
        userId,
      });
    });

    // Leave room
    socket.on('leave-room', async (data: { roomId: string }) => {
      const { roomId } = data;
      const room = rooms.get(roomId);

      if (room) {
        room.peers.delete(socket.id);
        socket.leave(roomId);

        console.log(`👤 Peer ${socket.id} left room ${roomId}`);

        // Notify others
        socket.to(roomId).emit('peer-left', {
          peerId: socket.id,
        });

        // Clean up empty rooms
        if (room.peers.size === 0) {
          rooms.delete(roomId);
          console.log(`🗑️ Room ${roomId} deleted`);
        }
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Peer disconnected: ${socket.id}`);

      // Remove from all rooms
      for (const [roomId, room] of rooms) {
        if (room.peers.has(socket.id)) {
          room.peers.delete(socket.id);
          socket.to(roomId).emit('peer-left', {
            peerId: socket.id,
          });

          if (room.peers.size === 0) {
            rooms.delete(roomId);
          }
        }
      }
    });

    // Error handler
    socket.on('error', (error: Error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await mediasoupServer.cleanup();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await mediasoupServer.cleanup();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Initialize server
initialize();

export default app;
export { io, server, mediasoupServer };
