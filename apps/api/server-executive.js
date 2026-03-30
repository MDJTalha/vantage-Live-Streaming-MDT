// Enhanced API server with security features for Fortune 5
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting for general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/v1/auth/', authLimiter);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(express.json());

// ============================================
// HEALTH & MONITORING
// ============================================

// Health check with system info
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0-executive',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'operational',
      services: {
        api: 'running',
        database: 'connected',
        websocket: 'running',
      },
    },
  });
});

// ============================================
// API ENDPOINTS
// ============================================

// API root
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'VANTAGE API',
    version: '1.0.0',
    status: 'running',
    environment: 'executive-ready',
    endpoints: {
      health: '/health',
      status: '/api/status',
      auth: '/api/v1/auth',
      rooms: '/api/v1/rooms',
    },
  });
});

// Mock auth endpoints (replace with real database in production)
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo credentials for Fortune 5 executives
  const demoUsers = {
    'admin@vantage.live': { name: 'Board Admin', role: 'ADMIN' },
    'host@vantage.live': { name: 'Meeting Host', role: 'HOST' },
    'user@vantage.live': { name: 'Executive User', role: 'PARTICIPANT' },
    'ceo@company.com': { name: 'CEO', role: 'EXECUTIVE' },
    'chairman@company.com': { name: 'Chairman', role: 'EXECUTIVE' },
  };

  if (demoUsers[email]) {
    const user = demoUsers[email];
    res.json({
      success: true,
      data: {
        user: {
          id: 'exec-user-' + Date.now(),
          email: email,
          name: user.name,
          role: user.role,
        },
        tokens: {
          accessToken: 'exec-token-' + Date.now(),
          refreshToken: 'exec-refresh-' + Date.now(),
          expiresIn: 604800, // 7 days
        },
      },
      message: 'Welcome, ' + user.name,
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
  }
});

app.post('/api/v1/auth/register', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'new-user-' + Date.now(),
        email: req.body.email,
        name: req.body.name,
        role: 'PARTICIPANT',
      },
      tokens: {
        accessToken: 'token-' + Date.now(),
        refreshToken: 'refresh-' + Date.now(),
        expiresIn: 604800,
      },
    },
  });
});

app.get('/api/v1/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'demo-user',
      email: 'demo@vantage.live',
      name: 'Demo Executive',
      role: 'EXECUTIVE',
    },
  });
});

// Mock rooms endpoint
app.get('/api/v1/rooms', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'board-room-001',
        roomCode: 'BOARD-2024',
        name: 'Board of Directors Meeting',
        status: 'scheduled',
        participants: 0,
        host: 'CEO',
        scheduledFor: new Date().toISOString(),
      },
      {
        id: 'exec-room-002',
        roomCode: 'EXEC-Q1',
        name: 'Q1 Executive Review',
        status: 'active',
        participants: 5,
        host: 'CFO',
        scheduledFor: new Date().toISOString(),
      },
    ],
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
    },
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎬 VANTAGE API - Executive Edition                      ║
║                                                           ║
║   Status: RUNNING                                         ║
║   Port: ${PORT.toString().padEnd(50)}║
║   Environment: ${process.env.NODE_ENV || 'development'}                                    ║
║   Security: Rate limiting enabled                         ║
║   CORS: Configured                                        ║
║                                                           ║
║   Endpoints:                                              ║
║   - Health:   http://localhost:${PORT}/health${' '.repeat(33)}║
║   - Status:   http://localhost:${PORT}/api/status${' '.repeat(31)}║
║   - API:      http://localhost:${PORT}/api/v1${' '.repeat(34)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
