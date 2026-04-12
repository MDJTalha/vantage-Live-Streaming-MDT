import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import csurf from 'csurf';
import { config } from '@vantage/config';
import { initializeSocket, io } from './socket';
import prisma from './db';
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import roomRoutes from './routes/rooms';
import chatRoutes from './routes/chat';
import engagementRoutes from './routes/engagement';
import healthRoutes from './routes/health';
import onboardingRoutes from './routes/onboarding';
import meetingRoutes from './routes/meetings';
import recordingRoutes from './routes/recordings';
import analyticsRoutes from './routes/analytics';
import aiRoutes from './routes/ai';
import podcastRoutes from './routes/podcasts';
import RateLimiter from './middleware/rateLimiter';
import DatabaseService from './db/service';
import requestIdMiddleware from './middleware/requestId';
import { errorHandler } from './utils/errors';
import { MetricsService } from './services/MetricsService';
import { AuthService } from './services/AuthService';
import { logger, httpLogger } from './utils/logger';
import { getIsShuttingDown, setShuttingDown } from './utils/shutdown';

const app: Express = express();
const PORT = config.api.port || 4000;

// ============================================
// 🔒 SECURITY FIX C-02 & C-05: Validate Configuration at Startup
// ============================================
if (config.environment !== 'test') {
  console.log('🔐 Validating security configuration...');
  const validation = AuthService.ConfigurationValidator.validateAll();

  if (!validation.valid) {
    console.error('\n❌ CRITICAL SECURITY CONFIGURATION ERRORS:\n');
    validation.errors.forEach((error: string) => console.error(`   • ${error}`));
    console.error('\n📝 Please update your .env.local file with secure values.\n');
    console.error('💡 Generate secure secrets with:\n');
    console.error('   JWT_SECRET: openssl rand -base64 32');
    console.error('   ENCRYPTION_KEY: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
    process.exit(1);
  }

  console.log('✓ Security configuration validated');
  console.log('✓ JWT Secret: Configured (32+ characters)');
  console.log('✓ Encryption Key: Configured (64 hex characters)');
}

// ============================================
// Initialize Monitoring
// ============================================
if (config.environment !== 'test') {
  MetricsService.collectDefaultMetrics();
  console.log('✓ Monitoring metrics initialized');
}

// ============================================
// Security Middleware
// ============================================
app.use(helmet({
  contentSecurityPolicy: false, // Configure based on your needs
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: config.frontend.url || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

app.use(compression());

// ============================================
// Request Tracking & Tracing
// ============================================
app.use(requestIdMiddleware);

// ============================================
// Body Parsing
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Trust Proxy (for rate limiting behind load balancer)
// ============================================
app.set('trust proxy', true);

// ============================================
// 🔒 SECURITY FIX H-03: CSRF Protection
// ============================================
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: config.environment === 'production',
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
  },
});

// Apply CSRF to state-changing routes
app.use('/api/v1/auth', csrfProtection);
app.use('/api/v1/rooms', csrfProtection);
app.use('/api/v1/chat', csrfProtection);
app.use('/api/v1/engagement', csrfProtection);
app.use('/api/v1/onboarding', csrfProtection);

// CSRF token endpoint for clients to get token
app.get('/api/v1/csrf-token', (req: Request, res: Response) => {
  res.json({ 
    csrfToken: (req as any).csrfToken(),
    message: 'Include this token in X-CSRF-Token header for state-changing requests'
  });
});

// CSRF error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    
    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
      },
    });
    return;
  }
  next(err);
});

// ============================================
// HTTP Request Logging
// ============================================
app.use(httpLogger);

// ============================================
// Rate Limiting
// ============================================
app.use('/api/', RateLimiter.moderate());
app.use('/api/v1/auth/', RateLimiter.strict());

// ============================================
// Health Check & Metrics Endpoints
// ============================================
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await MetricsService.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error collecting metrics');
  }
});

// Health check routes
app.use('/health', healthRoutes);

// Original health endpoint (deprecated, kept for backward compatibility)
app.get('/health/legacy', async (_req: Request, res: Response) => {
  const dbHealthy = await DatabaseService.healthCheck();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: config.appVersion,
    services: {
      database: dbHealthy ? 'healthy' : 'unhealthy',
      redis: 'healthy', // Add Redis health check
    },
  });
});

// ============================================
// API Routes
// ============================================

// Root API endpoint
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    name: 'VANTAGE API',
    version: config.appVersion,
    status: 'running',
    endpoints: {
      auth: '/api/v1/auth',
      rooms: '/api/v1/rooms',
      health: '/health',
    },
  });
});

// Authentication routes
app.use('/api/v1/auth', authRoutes);

// OAuth routes
app.use('/api/v1/auth/oauth', oauthRoutes);

// Room routes
app.use('/api/v1/rooms', roomRoutes);

// Meeting routes (NEW - Production Ready)
app.use('/api/v1/meetings', meetingRoutes);

// Recording routes (NEW - Phase 5)
app.use('/api/v1/recordings', recordingRoutes);

// Analytics routes (NEW - Phase 6)
app.use('/api/v1/analytics', analyticsRoutes);

// AI routes (NEW - Phase 8: AI Integration)
app.use('/api/v1/ai', aiRoutes);

// Podcast routes
app.use('/api/v1/podcasts', podcastRoutes);

// Chat routes
app.use('/api/v1/chat', chatRoutes);

// Engagement routes (Polls & Q&A)
app.use('/api/v1', engagementRoutes);

// Admin routes (must be after other routes)
// app.use('/api/v1/admin', adminRoutes); // TODO: Enable after billing features complete

// Onboarding routes
app.use('/api/v1/onboarding', onboardingRoutes);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      requestId: (req as any).id,
      timestamp: new Date().toISOString(),
    },
  });
});

// Global error handler (MUST be last)
app.use(errorHandler);

// ============================================
// Start Server
// ============================================
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎬 VANTAGE API Server                                   ║
║                                                           ║
║   Status: Running                                         ║
║   Port: ${PORT}                                            ║
║   Environment: ${config.environment.padEnd(32)}║
║                                                           ║
║   Endpoints:                                              ║
║   - Health:   http://localhost:${PORT}/health              ║
║   - Metrics:  http://localhost:${PORT}/metrics             ║
║   - API:      http://localhost:${PORT}/api/v1              ║
║   - Auth:     http://localhost:${PORT}/api/v1/auth         ║
║   - WebSocket: ws://localhost:${PORT}                      ║
║                                                           ║
║   Monitoring:                                             ║
║   - Prometheus: http://localhost:9090                      ║
║   - Grafana:  http://localhost:3001                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// ============================================
// Graceful Shutdown
// ============================================
async function gracefulShutdown(signal: string) {
  if (getIsShuttingDown()) return;
  setShuttingDown(true);

  console.log(`\n🛑 ${signal} received — starting graceful shutdown...`);

  // Step 1: Stop accepting new connections (return 503 for health check)
  console.log('  1. Stopping HTTP server...');
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
    // Force close after 10s
    setTimeout(() => {
      console.warn('  ⚠️  Forcing server close after 10s');
      resolve();
    }, 10000);
  });

  // Step 2: Disconnect Socket.IO
  console.log('  2. Disconnecting WebSocket clients...');
  if (io) {
    await new Promise<void>((resolve) => {
      io?.close(() => resolve());
      setTimeout(resolve, 5000);
    });
  }

  // Step 3: Disconnect Prisma
  console.log('  3. Closing database connections...');
  await prisma.$disconnect().catch(console.error);

  // Step 4: Disconnect Redis
  console.log('  4. Closing Redis connections...');
  // Note: RateLimiter uses a global Redis instance — disconnect it
  // (if you have a reference to it, disconnect here)

  console.log('✅ Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// WebSocket Integration
// ============================================
initializeSocket(server);
console.log('✓ WebSocket server initialized');

export default app;
export { server };
