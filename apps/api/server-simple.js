// Simple API server for development
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Load .env.local if it exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !key.startsWith('#')) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
  console.log('✓ Loaded .env.local configuration');
}

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

// AI Chat endpoint - uses OpenAI for intelligent responses
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Chat history per user (in-memory)
const chatHistories = {};

app.post('/api/v1/chat', async (req, res) => {
  const { message, userId = 'demo-user', conversationId = 'default' } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  if (!OPENAI_API_KEY) {
    return res.status(503).json({
      success: false,
      error: 'OpenAI API key not configured',
      fallback: 'AI services are not available. Please configure OPENAI_API_KEY.',
    });
  }

  try {
    // Initialize conversation history
    const key = `${userId}-${conversationId}`;
    if (!chatHistories[key]) {
      chatHistories[key] = [
        {
          role: 'system',
          content: `You are VANTAGE AI, an intelligent meeting assistant for VANTAGE Executive - an enterprise meeting platform. You help users with meeting scheduling, collaboration, and productivity. Be helpful, professional, and concise. You can discuss meetings, scheduling, team collaboration, video conferencing, and general productivity topics.`,
        },
      ];
    }

    // Add user message to history
    chatHistories[key].push({ role: 'user', content: message.trim() });

    // Keep only last 10 messages to manage context
    if (chatHistories[key].length > 11) {
      chatHistories[key] = [chatHistories[key][0], ...chatHistories[key].slice(-10)];
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: chatHistories[key],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'I apologize, I could not generate a response.';

    // Add AI response to history
    chatHistories[key].push({ role: 'assistant', content: aiResponse });

    res.json({
      success: true,
      message: aiResponse,
      conversationId,
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AI response',
    });
  }
});

// Clear chat history endpoint
app.delete('/api/v1/chat/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const userId = req.query.userId || 'demo-user';
  const key = `${userId}-${conversationId}`;
  delete chatHistories[key];
  res.json({ success: true, message: 'Chat history cleared' });
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
