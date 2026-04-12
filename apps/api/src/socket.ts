import { Server, Socket } from 'socket.io';
import http from 'http';
import prisma from './db/prisma';
import { AuthService } from './services/AuthService';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { config } from '@vantage/config';

export let io: Server | null = null;

interface SocketData {
  userId: string;
  email: string;
  name: string;
  role: string;
}

interface AuthSocket extends Socket {
  data: SocketData;
}

export function initializeSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ============================================
  // C-07 FIX: Redis Adapter for multi-instance support
  // ============================================
  try {
    const pubClient = new Redis(config.redis.url);
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => console.error('Redis pubClient error:', err));
    subClient.on('error', (err) => console.error('Redis subClient error:', err));

    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Socket.IO Redis adapter initialized (multi-instance support)');
  } catch (error) {
    console.warn('⚠️  Socket.IO Redis adapter failed — falling back to in-memory (multi-instance will NOT work):', error);
  }

  // ============================================
  // C-04 FIX: Authentication Middleware for ALL WebSocket connections
  // ============================================
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = AuthService.verifyToken(token);
      if (!payload) {
        return next(new Error('Invalid token'));
      }

      // Verify session exists
      const session = await prisma.session.findFirst({
        where: {
          refreshToken: token,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        const tokenHash = AuthService.hashToken(token);
        const sessionByHash = await prisma.session.findFirst({
          where: { tokenHash, expiresAt: { gt: new Date() } },
        });
        if (!sessionByHash) {
          return next(new Error('Session expired'));
        }
      }

      // Fetch user for name/email
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, name: true, role: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.userId = user.id;
      socket.data.email = user.email;
      socket.data.name = user.name;
      socket.data.role = user.role;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`✅ User connected: ${socket.data.userId} (${socket.data.name})`);

    // ==================== JOIN MEETING ====================
    socket.on('join', async (data: { meetingId?: string }) => {
      const { meetingId } = data;

      try {
        // Join meeting room if provided
        if (meetingId) {
          socket.join(meetingId);
          console.log(`User ${socket.data.userId} joined meeting ${meetingId}`);

          // Create participation record using correct model name
          await prisma.participation.create({
            data: {
              meetingId,
              userId: socket.data.userId,
              joinedAt: new Date(),
              status: 'JOINED',
            },
          });

          // Notify others in the meeting
          socket.to(meetingId).emit('user:joined', {
            userId: socket.data.userId,
            name: socket.data.name,
            timestamp: new Date().toISOString(),
          });

          // Update participant count
          const participantCount = await prisma.participation.count({
            where: { meetingId, leftAt: null },
          });

          io?.to(meetingId).emit('meeting:participants:update', {
            meetingId,
            count: participantCount,
          });
        }

        // Send list of online users
        const onlineUsers = await getOnlineUsers();
        socket.emit('users', onlineUsers);
      } catch (error) {
        console.error('Error joining meeting:', error);
        socket.emit('error', { message: 'Failed to join meeting' });
      }
    });

    // ==================== DIRECT MESSAGE ====================
    socket.on('message:direct', async (data: { to: string; content: string }) => {
      try {
        const { to, content } = data;
        const from = socket.data.userId;

        if (!from || !to) {
          socket.emit('error', { message: 'Invalid user data' });
          return;
        }

        // Save message using correct model fields (Message has senderId, receiverId)
        const message = await prisma.message.create({
          data: {
            meetingId: 'direct',
            senderId: from,
            receiverId: to,
            content,
            messageType: 'TEXT',
            isBroadcast: false,
          },
          include: {
            sender: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        // Send to recipient
        io?.to(to).emit('message', {
          id: message.id,
          senderId: message.senderId,
          senderName: message.sender.name,
          receiverId: message.receiverId,
          content: message.content,
          timestamp: message.createdAt.toISOString(),
          type: 'direct',
          read: false,
        });

        // Confirm to sender
        socket.emit('message:sent', {
          ...message,
        });
      } catch (error: any) {
        console.error('Error sending direct message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ==================== BROADCAST MESSAGE ====================
    socket.on('message:broadcast', async (data: { meetingId?: string; content: string }) => {
      try {
        const { meetingId, content } = data;
        const from = socket.data.userId;

        if (!from) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Save message using correct model fields
        const message = await prisma.message.create({
          data: {
            meetingId: meetingId || 'general',
            senderId: from,
            content,
            messageType: 'TEXT',
            isBroadcast: true,
          },
          include: {
            sender: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        // Broadcast to meeting room or all users
        if (meetingId) {
          io?.to(meetingId).emit('message', {
            id: message.id,
            senderId: message.senderId,
            senderName: message.sender.name,
            content: message.content,
            timestamp: message.createdAt.toISOString(),
            type: 'broadcast',
            read: false,
          });
        } else {
          io?.emit('message', {
            id: message.id,
            senderId: message.senderId,
            senderName: message.sender.name,
            content: message.content,
            timestamp: message.createdAt.toISOString(),
            type: 'broadcast',
            read: false,
          });
        }
      } catch (error: any) {
        console.error('Error sending broadcast message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ==================== MEETING JOIN ====================
    socket.on('meeting:join', async (data: { meetingId: string }) => {
      const { meetingId } = data;
      socket.join(meetingId);

      try {
        // Create participation record (correct model name)
        await prisma.participation.create({
          data: {
            meetingId,
            userId: socket.data.userId,
            joinedAt: new Date(),
            status: 'JOINED',
          },
        });

        // Notify others
        socket.to(meetingId).emit('user:joined', {
          userId: socket.data.userId,
          name: socket.data.name,
          timestamp: new Date().toISOString(),
        });

        // Update participant count
        const participantCount = await prisma.participation.count({
          where: { meetingId, leftAt: null },
        });

        io?.to(meetingId).emit('meeting:participants:update', {
          meetingId,
          count: participantCount,
        });
      } catch (error) {
        console.error('Error joining meeting:', error);
        socket.emit('error', { message: 'Failed to join meeting' });
      }
    });

    // ==================== MEETING LEAVE ====================
    socket.on('meeting:leave', async (data: { meetingId: string }) => {
      const { meetingId } = data;
      socket.leave(meetingId);

      try {
        // Update participation record (correct model name)
        await prisma.participation.updateMany({
          where: {
            meetingId,
            userId: socket.data.userId,
            leftAt: null,
          },
          data: {
            leftAt: new Date(),
            status: 'LEFT',
          },
        });

        // Notify others
        socket.to(meetingId).emit('user:left', {
          userId: socket.data.userId,
          timestamp: new Date().toISOString(),
        });

        // Update participant count
        const participantCount = await prisma.participation.count({
          where: { meetingId, leftAt: null },
        });

        io?.to(meetingId).emit('meeting:participants:update', {
          meetingId,
          count: participantCount,
        });
      } catch (error) {
        console.error('Error leaving meeting:', error);
      }
    });

    // ==================== REACTIONS ====================
    socket.on('reaction', async (data: { meetingId: string; type: string }) => {
      try {
        const { meetingId, type } = data;

        // Save reaction (Reaction model exists in consolidated schema)
        const reaction = await prisma.reaction.create({
          data: {
            meetingId,
            userId: socket.data.userId,
            type,
            expiresAt: new Date(Date.now() + 5000), // 5 seconds
          },
        });

        // Broadcast to meeting
        socket.to(meetingId).emit('reaction', {
          id: reaction.id,
          userId: socket.data.userId,
          userName: socket.data.name,
          type,
          timestamp: reaction.createdAt.toISOString(),
        });
      } catch (error) {
        console.error('Error sending reaction:', error);
      }
    });

    // ==================== SCREEN SHARE ====================
    socket.on('screen:share', (data: { meetingId: string }) => {
      const { meetingId } = data;

      socket.to(meetingId).emit('screen:shared', {
        userId: socket.data.userId,
        userName: socket.data.name,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('screen:stop', (data: { meetingId: string }) => {
      const { meetingId } = data;

      socket.to(meetingId).emit('screen:stopped', {
        userId: socket.data.userId,
        timestamp: new Date().toISOString(),
      });
    });

    // ==================== DISCONNECT ====================
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.data.userId}`);

      try {
        // Update all active participations using correct model name
        await prisma.participation.updateMany({
          where: {
            userId: socket.data.userId,
            leftAt: null,
          },
          data: {
            leftAt: new Date(),
            status: 'LEFT',
          },
        });

        // Notify all rooms user was in
        const rooms = Array.from(socket.rooms);
        rooms.forEach(roomId => {
          if (roomId !== socket.id) {
            socket.to(roomId).emit('user:left', {
              userId: socket.data.userId,
              timestamp: new Date().toISOString(),
            });
          }
        });

        // Update online users list
        const onlineUsers = await getOnlineUsers();
        io?.emit('users', onlineUsers);
      } catch (error) {
        console.error('Error on disconnect:', error);
      }
    });

    // ==================== ERROR HANDLING ====================
    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  });

  console.log('✅ Socket.IO initialized with authentication middleware');
  return io;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getOnlineUsers() {
  if (!io) return [];

  const sockets = await io?.fetchSockets() || [];
  const users = sockets.map(socket => ({
    id: (socket.data as SocketData).userId,
    name: (socket.data as SocketData).name,
    email: (socket.data as SocketData).email,
    online: true,
  }));

  // Remove duplicates
  const uniqueUsers = Array.from(
    new Map(users.map(user => [user.id, user])).values()
  );

  return uniqueUsers;
}

export async function getConnectedUsers() {
  if (!io) return [];
  return await getOnlineUsers();
}
