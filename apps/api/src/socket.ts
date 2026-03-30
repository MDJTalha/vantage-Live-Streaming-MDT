// import http from 'http'; // Server is created by SocketIO
import { Server, Socket } from 'socket.io';
import { config } from '@vantage/config';
import AuthService from './services/AuthService';
import DatabaseService from './db/service';
import { createRequire } from 'module';

// 🔒 SECURITY FIX H-02: Import DOMPurify for XSS prevention
const require = createRequire(import.meta.url);
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

interface AuthSocket extends Socket {
  userId?: string;
  email?: string;
  role?: string;
}

// const _server = http.createServer(); // Not used - Server is created by SocketIO

const io = new Server({
  cors: {
    origin: config.frontend.url || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ============================================
// Authentication Middleware for WebSocket
// SECURITY FIX C-01: Require authentication for ALL connections
// ============================================
io.use(async (socket: AuthSocket, next) => {
  try {
    const token = socket.handshake.auth.token ||
                  socket.handshake.headers.authorization?.replace('Bearer ', '');

    // 🔒 SECURITY FIX: Reject unauthenticated connections
    if (!token) {
      console.warn(`🚫 WebSocket connection rejected: No token provided from ${socket.handshake.address}`);
      return next(new Error('Authentication required. No token provided.'));
    }

    // Verify token validity
    const payload = AuthService.verifyToken(token);

    if (!payload) {
      console.warn(`🚫 WebSocket connection rejected: Invalid token from ${socket.handshake.address}`);
      return next(new Error('Authentication failed. Invalid or expired token.'));
    }

    // 🔒 SECURITY FIX: Verify session exists in database and is not expired
    const session = await DatabaseService.getSessionByToken(
      AuthService.hashToken(token)
    );

    if (!session) {
      console.warn(`🚫 WebSocket connection rejected: Session not found for user ${payload.userId}`);
      return next(new Error('Session not found. Please login again.'));
    }

    if (session.expiresAt < new Date()) {
      console.warn(`🚫 WebSocket connection rejected: Session expired for user ${payload.userId}`);
      // Clean up expired session
      await DatabaseService.deleteExpiredSessions();
      return next(new Error('Session has expired. Please login again.'));
    }

    // Attach authenticated user info to socket
    socket.userId = payload.userId;
    socket.email = payload.email;
    socket.role = payload.role;

    console.log(`✅ WebSocket authenticated: ${payload.email} (${socket.id})`);
    next();
  } catch (error) {
    console.error(`❌ WebSocket authentication error: ${(error as Error).message}`);
    next(new Error('Authentication failed. Please login again.'));
  }
});

// ============================================
// Connection Handler
// ============================================
io.on('connection', (socket: AuthSocket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // ============================================
  // Authentication Events
  // ============================================
  
  socket.on('authenticate', (data: { token: string }) => {
    try {
      const payload = AuthService.verifyToken(data.token);
      
      if (payload) {
        socket.userId = payload.userId;
        socket.email = payload.email;
        socket.role = payload.role;
        
        socket.emit('authenticated', {
          success: true,
          user: {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
          },
        });
        
        console.log(`✅ User authenticated: ${payload.email}`);
      } else {
        socket.emit('authenticated', {
          success: false,
          error: 'Invalid token',
        });
      }
    } catch (error) {
      socket.emit('authenticated', {
        success: false,
        error: 'Authentication failed',
      });
    }
  });

  // ============================================
  // Room Events
  // ============================================

  socket.on('join-room', async (data: { roomId: string }) => {
    try {
      socket.join(data.roomId);
      
      // Update participant status in database
      if (socket.userId) {
        // TODO: Implement participant status tracking
        // const participant = await DatabaseService.getParticipantByUserAndRoom(
        //   data.roomId,
        //   socket.userId
        // );
        // 
        // if (participant) {
        //   await DatabaseService.updateParticipantMedia(participant.id, {
        //     isVideoEnabled: true,
        //     isAudioEnabled: true,
        //   });
        // }
      }
      
      // Notify others in the room
      socket.to(data.roomId).emit('user-joined', {
        roomId: data.roomId,
        userId: socket.userId,
        email: socket.email,
        socketId: socket.id,
      });
      
      console.log(`🚪 User ${socket.userId || 'guest'} joined room ${data.roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  socket.on('leave-room', async (data: { roomId: string }) => {
    try {
      socket.leave(data.roomId);
      
      // Update participant status in database
      if (socket.userId) {
        // TODO: Implement participant status tracking
        // const participant = await DatabaseService.getParticipantByUserAndRoom(
        //   data.roomId,
        //   socket.userId
        // );
        // 
        // if (participant) {
        //   await DatabaseService.updateParticipantMedia(participant.id, {
        //     isVideoEnabled: false,
        //     isAudioEnabled: false,
        //   });
        // }
      }
      
      // Notify others in the room
      socket.to(data.roomId).emit('user-left', {
        roomId: data.roomId,
        userId: socket.userId,
        socketId: socket.id,
      });
      
      console.log(`🚪 User ${socket.userId || 'guest'} left room ${data.roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // ============================================
  // WebRTC Signaling Events
  // ============================================

  socket.on('offer', (data: { roomId: string; offer: any; to: string }) => {
    socket.to(data.to).emit('offer', {
      from: socket.id,
      offer: data.offer,
    });
  });

  socket.on('answer', (data: { roomId: string; answer: any; to: string }) => {
    socket.to(data.to).emit('answer', {
      from: socket.id,
      answer: data.answer,
    });
  });

  socket.on('ice-candidate', (data: { roomId: string; candidate: any; to: string }) => {
    socket.to(data.to).emit('ice-candidate', {
      from: socket.id,
      candidate: data.candidate,
    });
  });

  // ============================================
  // Chat Events
  // ============================================

  socket.on('send-message', async (data: { roomId: string; content: string; type?: string }) => {
    try {
      // 🔒 SECURITY FIX H-02: Sanitize content to prevent XSS attacks
      const sanitizedContent = DOMPurify.sanitize(data.content, {
        ALLOWED_TAGS: [], // No HTML tags allowed in chat
        ALLOWED_ATTR: [],
      });

      // Truncate to prevent DoS (max 10,000 characters)
      const truncatedContent = sanitizedContent.slice(0, 10000);

      // Validate content is not empty after sanitization
      if (!truncatedContent.trim()) {
        socket.emit('error', { message: 'Message content is invalid' });
        return;
      }

      // Save message to database
      const message = await DatabaseService.createMessage({
        roomId: data.roomId,
        userId: socket.userId,
        guestName: socket.email?.split('@')[0],
        content: truncatedContent,
        messageType: (data.type as any) || 'TEXT',
      });

      // Broadcast to room
      io.to(data.roomId).emit('receive-message', {
        id: message.id,
        roomId: data.roomId,
        userId: socket.userId,
        email: socket.email,
        content: truncatedContent, // Use sanitized content
        type: data.type || 'text',
        timestamp: message.createdAt,
      });

      // Update analytics
      await DatabaseService.incrementAnalytics(data.roomId, 'chatMessages');
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // ============================================
  // Media State Events
  // ============================================

  socket.on('toggle-video', async (data: { roomId: string; enabled: boolean }) => {
    if (socket.userId) {
      // TODO: Implement participant status tracking
      // const participant = await DatabaseService.getParticipantByUserAndRoom(
      //   data.roomId,
      //   socket.userId
      // );
      // 
      // if (participant) {
      //   await DatabaseService.updateParticipantMedia(participant.id, {
      //     isVideoEnabled: data.enabled,
      //   });
      //   
      //   socket.to(data.roomId).emit('user-video-toggle', {
      //     userId: socket.userId,
      //     enabled: data.enabled,
      //   });
      // }
      socket.to(data.roomId).emit('user-video-toggle', {
        userId: socket.userId,
        enabled: data.enabled,
      });
    }
  });

  socket.on('toggle-audio', async (data: { roomId: string; enabled: boolean }) => {
    if (socket.userId) {
      // TODO: Implement participant status tracking
      // const participant = await DatabaseService.getParticipantByUserAndRoom(
      //   data.roomId,
      //   socket.userId
      // );
      // 
      // if (participant) {
      //   await DatabaseService.updateParticipantMedia(participant.id, {
      //     isAudioEnabled: data.enabled,
      //   });
      //   
      //   socket.to(data.roomId).emit('user-audio-toggle', {
      //     userId: socket.userId,
      //     enabled: data.enabled,
      //   });
      // }
      socket.to(data.roomId).emit('user-audio-toggle', {
        userId: socket.userId,
        enabled: data.enabled,
      });
    }
  });

  // ============================================
  // Disconnection Handler
  // ============================================

  socket.on('disconnect', async () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    
    // Update all participant records for this user
    if (socket.userId) {
      try {
        // Get all active sessions for this user and clean up
        await DatabaseService.deleteExpiredSessions();
      } catch (error) {
        console.error('Error on disconnect:', error);
      }
    }
  });

  // ============================================
  // Error Handler
  // ============================================

  socket.on('error', (error: Error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Note: WebSocket server is attached to main HTTP server in index.ts
// No separate server startup needed here

export { io };
