// Simple API server for development
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Demo users database
const demoUsers = {
  'admin@vantage.live': {
    id: 'user-admin-001',
    email: 'admin@vantage.live',
    name: 'Admin User',
    role: 'ADMIN',
    password: '@admin@123#',
    emailVerified: true,
    mfaEnabled: false,
    avatarUrl: null,
  },
  'host@vantage.live': {
    id: 'user-host-001',
    email: 'host@vantage.live',
    name: 'Host User',
    role: 'HOST',
    password: '@host@123#',
    emailVerified: true,
    mfaEnabled: false,
    avatarUrl: null,
  },
  'user@vantage.live': {
    id: 'user-participant-001',
    email: 'user@vantage.live',
    name: 'Demo User',
    role: 'PARTICIPANT',
    password: '@user@123#',
    emailVerified: true,
    mfaEnabled: false,
    avatarUrl: null,
  },
};

// Registered users from signup
let registeredUsers = [];

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

// Login endpoint
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Check demo users
  const demoUser = demoUsers[email];
  if (demoUser && demoUser.password === password) {
    const { password: _, ...userWithoutPassword } = demoUser;
    return res.json({
      success: true,
      user: userWithoutPassword,
      accessToken: 'demo-access-token-' + Date.now(),
      refreshToken: 'demo-refresh-token-' + Date.now(),
      expiresIn: 604800,
    });
  }

  // Check registered users
  const registeredUser = registeredUsers.find(u => u.email === email && u.password === password);
  if (registeredUser) {
    const { password: _, ...userWithoutPassword } = registeredUser;
    return res.json({
      success: true,
      user: userWithoutPassword,
      accessToken: 'demo-access-token-' + Date.now(),
      refreshToken: 'demo-refresh-token-' + Date.now(),
      expiresIn: 604800,
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid email or password',
  });
});

// Register endpoint
app.post('/api/v1/auth/register', (req, res) => {
  const { email, password, name } = req.body;

  // Check if user already exists
  if (demoUsers[email] || registeredUsers.find(u => u.email === email)) {
    return res.status(400).json({
      success: false,
      error: 'An account with this email already exists',
    });
  }

  // Create new user
  const newUser = {
    id: 'user-' + Date.now(),
    email,
    name,
    role: 'PARTICIPANT',
    password,
    emailVerified: false,
    mfaEnabled: false,
    avatarUrl: null,
  };
  registeredUsers.push(newUser);

  const { password: _, ...userWithoutPassword } = newUser;

  return res.status(201).json({
    success: true,
    user: userWithoutPassword,
    accessToken: 'demo-access-token-' + Date.now(),
    refreshToken: 'demo-refresh-token-' + Date.now(),
    expiresIn: 604800,
  });
});

// Get current user
app.get('/api/v1/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  // For demo, return a default user
  return res.json({
    id: 'demo-user',
    email: 'demo@vantage.live',
    name: 'Demo User',
    role: 'ADMIN',
    emailVerified: true,
    mfaEnabled: false,
    avatarUrl: null,
    lastLoginAt: new Date().toISOString(),
  });
});

// Logout endpoint
app.post('/api/v1/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Rooms endpoints
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

// In-memory meetings store
let meetings = [];

// Meetings endpoints
app.get('/api/v1/meetings', (req, res) => {
  res.json({
    success: true,
    data: meetings,
  });
});

app.post('/api/v1/meetings', (req, res) => {
  const { name, type, description, settings } = req.body;
  const adjectives = ['swift', 'calm', 'bright', 'wise', 'bold', 'keen', 'free', 'true', 'rapid', 'sharp'];
  const nouns = ['eagle', 'tiger', 'wolf', 'hawk', 'lion', 'bear', 'fox', 'owl', 'dragon', 'phoenix'];
  const roomCode = `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}-${Math.floor(Math.random() * 1000)}`;
  
  const newMeeting = {
    id: 'meeting-' + Date.now(),
    name: name || 'Untitled Meeting',
    code: roomCode,
    description: description || '',
    status: 'active',
    participants: 1,
    type: type || 'team',
    settings: settings || {},
    createdAt: new Date().toISOString(),
    hostId: 'demo-user',
  };
  
  meetings.push(newMeeting);
  
  res.status(201).json({
    success: true,
    data: newMeeting,
  });
});

app.get('/api/v1/meetings/:id', (req, res) => {
  const meeting = meetings.find(m => m.id === req.params.id || m.code === req.params.id);
  if (!meeting) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }
  res.json({ success: true, data: meeting });
});

app.patch('/api/v1/meetings/:id', (req, res) => {
  const idx = meetings.findIndex(m => m.id === req.params.id || m.code === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }
  meetings[idx] = { ...meetings[idx], ...req.body };
  res.json({ success: true, data: meetings[idx] });
});

app.delete('/api/v1/meetings/:id', (req, res) => {
  const idx = meetings.findIndex(m => m.id === req.params.id || m.code === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Meeting not found' });
  }
  meetings.splice(idx, 1);
  res.json({ success: true, message: 'Meeting deleted' });
});

app.get('/api/v1/meetings/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalMeetings: meetings.length,
      activeMeetings: meetings.filter(m => m.status === 'active').length,
      scheduledMeetings: meetings.filter(m => m.status === 'scheduled').length,
      totalParticipants: meetings.reduce((sum, m) => sum + (m.participants || 0), 0),
      totalRecordings: 0,
      storageUsed: 0,
    },
  });
});

// Update user profile
app.patch('/api/v1/auth/me', (req, res) => {
  res.json({
    id: 'demo-user',
    email: 'demo@vantage.live',
    name: req.body.name || 'Demo User',
    role: 'ADMIN',
    emailVerified: true,
    mfaEnabled: false,
    avatarUrl: null,
    lastLoginAt: new Date().toISOString(),
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
