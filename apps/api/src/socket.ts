import { Server, Socket } from 'socket.io';
import http from 'http';
import prisma from './db/prisma';

export let io: Server | null = null;

interface SocketData {
  userId: string;
  email: string;
  name: string;
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

  io.on('connection', (socket: Socket<SocketData>) => {
    console.log(`✅ User connected: ${socket.data.userId} (${socket.data.name})`);

    // ==================== JOIN ROOM ====================
    socket.on('join', async (data: { userId: string; meetingId?: string }) => {
      const { userId, meetingId } = data;

      // Store user data in socket
      socket.data.userId = userId;

      try {
        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, name: true, avatarUrl: true }
        });

        if (user) {
          socket.data.email = user.email;
          socket.data.name = user.name;
        }

        // Join meeting room if provided
        if (meetingId) {
          socket.join(meetingId);
          console.log(`User ${userId} joined meeting ${meetingId}`);

          // Notify others in the meeting
          socket.to(meetingId).emit('user:joined', {
            userId,
            name: user?.name || 'Unknown',
            timestamp: new Date().toISOString(),
          });
        }

        // Send list of online users
        const onlineUsers = await getOnlineUsers();
        socket.emit('users', onlineUsers);

      } catch (error) {
        console.error('Error joining room:', error);
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

        // Save message to database
        const message = await prisma.message.create({
          data: {
            meetingId: 'direct', // Direct messages don't belong to a meeting
            senderId: from,
            receiverId: to,
            content,
            messageType: 'TEXT',
            isBroadcast: false,
          },
          include: {
            sender: {
              select: { id: true, name: true, email: true }
            }
          }
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
          id: message.id,
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

        // Save message to database
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
              select: { id: true, name: true, email: true }
            }
          }
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
          // Broadcast to all connected users
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

    // ==================== MEETING EVENTS ====================
    
    // User joined meeting
    socket.on('meeting:join', async (data: { meetingId: string }) => {
      const { meetingId } = data;
      socket.join(meetingId);

      // Create participant record
      try {
        await prisma.participant.create({
          data: {
            meetingId,
            userId: socket.data.userId,
            name: socket.data.name || 'Anonymous',
            joinedAt: new Date(),
          }
        });

        // Notify others
        socket.to(meetingId).emit('user:joined', {
          userId: socket.data.userId,
          name: socket.data.name,
          timestamp: new Date().toISOString(),
        });

        // Update participant count
        const participantCount = await prisma.participant.count({
          where: { meetingId }
        });

        io?.to(meetingId).emit('meeting:participants:update', {
          meetingId,
          count: participantCount,
        });

      } catch (error) {
        console.error('Error joining meeting:', error);
      }
    });

    // User left meeting
    socket.on('meeting:leave', async (data: { meetingId: string }) => {
      const { meetingId } = data;
      socket.leave(meetingId);

      try {
        await prisma.participant.updateMany({
          where: {
            meetingId,
            userId: socket.data.userId,
            leftAt: null,
          },
          data: {
            leftAt: new Date(),
          }
        });

        // Notify others
        socket.to(meetingId).emit('user:left', {
          userId: socket.data.userId,
          timestamp: new Date().toISOString(),
        });

        // Update participant count
        const participantCount = await prisma.participant.count({
          where: { meetingId }
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

        // Save reaction to database
        const reaction = await prisma.reaction.create({
          data: {
            meetingId,
            userId: socket.data.userId,
            type,
            expiresAt: new Date(Date.now() + 5000), // 5 seconds
          }
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
        // Update all active participations
        await prisma.participant.updateMany({
          where: {
            userId: socket.data.userId,
            leftAt: null,
          },
          data: {
            leftAt: new Date(),
          }
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

  console.log('✅ Socket.IO initialized');
  return io;
}

// ==================== HELPER FUNCTIONS ====================

async function getOnlineUsers() {
  if (!io) return [];

  const sockets = await io?.fetchSockets() || [];
  const users = sockets.map(socket => ({
    id: socket.data.userId,
    name: socket.data.name,
    email: socket.data.email,
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
