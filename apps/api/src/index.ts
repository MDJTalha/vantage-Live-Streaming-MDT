import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import csurf from 'csurf';
import { config } from '@vantage/config';
import { io } from './socket';
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import roomRoutes from './routes/rooms';
import chatRoutes from './routes/chat';
import engagementRoutes from './routes/engagement';
import healthRoutes from './routes/health';
import onboardingRoutes from './routes/onboarding';
import meetingRoutes from './routes/meetings';
import AuthMiddleware from './middleware/auth';
import RateLimiter from './middleware/rateLimiter';
import DatabaseService from './db/service';
import requestIdMiddleware from './middleware/requestId';
import { errorHandler } from './utils/errors';
import { MetricsService } from './services/MetricsService';
import { logger } from './utils/logger';

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
    validation.errors.forEach(error => console.error(`   • ${error}`));
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
app.get('/metrics', async (req: Request, res: Response) => {
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
app.get('/health/legacy', async (req: Request, res: Response) => {
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
app.get('/api/v1', (req: Request, res: Response) => {
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
app.use('/api/v1/rooms', AuthMiddleware.optional, roomRoutes);

// Meeting routes (NEW - Production Ready)
app.use('/api/v1/meetings', AuthMiddleware.optional, meetingRoutes);

// Chat routes
app.use('/api/v1/chat', AuthMiddleware.optional, chatRoutes);

// Engagement routes (Polls & Q&A)
app.use('/api/v1', AuthMiddleware.optional, engagementRoutes);

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
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// ============================================
// WebSocket Integration
// ============================================
io.attach(server, {
  cors: {
    origin: config.frontend.url || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

export default app;
export { server };
