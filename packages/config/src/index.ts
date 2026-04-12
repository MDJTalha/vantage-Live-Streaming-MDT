/**
 * VANTAGE Configuration
 * Validates all required environment variables at startup
 */

// Load environment variables from .env.local file
import * as dotenv from 'dotenv';
import * as path from 'path';

// Try to load .env.local from various possible locations
const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '..', '.env.local'),
  path.resolve(process.cwd(), '..', '..', '.env.local'),
];

for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (result.parsed) {
      console.log(`✅ Loaded environment variables from ${envPath}`);
      break;
    }
  } catch (error) {
    // Continue to next path
  }
}

const isProd = process.env.NODE_ENV === 'production';

/**
 * Validate required environment variables
 * Throws error if any required var is missing
 */
function validateRequiredEnv(): void {
  const required: string[] = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
  ];

  // Only require these in production
  if (isProd) {
    required.push(
      'NODE_ENV',
      'TURN_SERVER_URL',
      'TURN_SERVER_USERNAME',
      'TURN_SERVER_PASSWORD',
      'SSL_KEY_PATH',
      'SSL_CERT_PATH'
    );
  }

  const missing: string[] = [];
  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    const envVars = missing.join(', ');
    throw new Error(
      `Missing required environment variables: ${envVars}\n` +
      `Copy .env.example to .env.local and fill in all required values.`
    );
  }

  // Validate encryption key length
  const encKey = process.env.ENCRYPTION_KEY || '';
  if (encKey.length < 32) {
    throw new Error(
      `ENCRYPTION_KEY must be at least 32 characters (got ${encKey.length})`
    );
  }
}

// Run validation at module load time
try {
  validateRequiredEnv();
} catch (error) {
  console.error('Configuration Error:', error instanceof Error ? error.message : error);
  process.exit(1);
}

export const config = {
  // Application
  appName: 'VANTAGE',
  appVersion: '0.0.1',
  environment: process.env.NODE_ENV || 'development',
  isProd: isProd,

  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // API Server
  api: {
    port: parseInt(process.env.API_PORT || '4000', 10),
    wsPort: parseInt(process.env.WS_PORT || '4000', 10),
    host: process.env.API_HOST || '0.0.0.0',
  },

  // Media Server
  mediaServer: {
    port: parseInt(process.env.MEDIA_SERVER_PORT || '443', 10),
    host: process.env.MEDIA_SERVER_HOST || '0.0.0.0',
    minPort: parseInt(process.env.MEDIA_SERVER_MIN_PORT || '10000', 10),
    maxPort: parseInt(process.env.MEDIA_SERVER_MAX_PORT || '60000', 10),
    sslKey: process.env.SSL_KEY_PATH || './certs/key.pem',
    sslCert: process.env.SSL_CERT_PATH || './certs/cert.pem',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://vantage:dev_password_change_me@localhost:5432/vantage',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || '',
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET!,  // Required - validated above
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  },

  // WebRTC
  webrtc: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
    turnServer: {
      url: process.env.TURN_SERVER_URL || 'turn:localhost:3478',
      username: process.env.TURN_SERVER_USERNAME || 'vantage_user',
      password: process.env.TURN_SERVER_PASSWORD || 'vantage_turn_password',
    },
  },

  // Storage (S3)
  storage: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'vantage-recordings',
  },

  // AI Services
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    whisperModel: process.env.WHISPER_MODEL || 'base',
  },

  // Email
  email: {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
  },

  // Security
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY!,  // Required - validated above
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

export type Config = typeof config;
