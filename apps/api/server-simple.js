// Simple API server for development
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API root
app.get('/api/v1', (req, res) => {
  res.json({
    name: 'VANTAGE API',
    version: '0.0.1',
    status: 'running',
  });
});

// Mock auth endpoints
app.post('/api/v1/auth/login', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'demo-user',
        email: req.body.email,
        name: 'Demo User',
        role: 'PARTICIPANT',
      },
      tokens: {
        accessToken: 'demo-token-' + Date.now(),
        refreshToken: 'demo-refresh-' + Date.now(),
        expiresIn: 604800,
      },
    },
  });
});

app.post('/api/v1/auth/register', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 'demo-user',
        email: req.body.email,
        name: req.body.name,
        role: 'PARTICIPANT',
      },
      tokens: {
        accessToken: 'demo-token-' + Date.now(),
        refreshToken: 'demo-refresh-' + Date.now(),
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
      name: 'Demo User',
      role: 'PARTICIPANT',
    },
  });
});

// Mock rooms endpoint
app.get('/api/v1/rooms', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'demo-room-001',
        roomCode: 'demo-room-001',
        name: 'Demo Meeting Room',
        status: 'scheduled',
        participants: 0,
      },
    ],
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎬 VANTAGE API Server (Development Mode)                ║
║                                                           ║
║   Status: Running                                         ║
║   Port: ${PORT}                                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
