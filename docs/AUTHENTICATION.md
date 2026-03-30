# VANTAGE Authentication Guide

## Overview

VANTAGE implements a comprehensive authentication system with:
- **JWT-based** stateless authentication
- **Session management** with refresh tokens
- **OAuth 2.0** support (Google, Microsoft)
- **End-to-End Encryption** (E2EE) for sensitive data
- **Rate limiting** for brute force protection

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  API Server  │────▶│  Database   │
│             │◀────│  (Express)   │◀────│ (PostgreSQL)│
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌─────────────┐     ┌──────────────┐
│  WebSocket  │     │   OAuth      │
│   Server    │     │  (Google/MS) │
└─────────────┘     └──────────────┘
```

---

## Authentication Flow

### 1. Registration

```
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "PARTICIPANT"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "uuid",
      "expiresIn": 604800
    }
  }
}
```

### 2. Login

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

### 3. Token Refresh

```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "uuid"
}

Response:
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "new_eyJhbG...",
      "refreshToken": "new_uuid",
      "expiresIn": 604800
    }
  }
}
```

### 4. Logout

```
POST /api/v1/auth/logout
Authorization: Bearer eyJhbG...

Response:
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Password Requirements

| Requirement | Description |
|-------------|-------------|
| Minimum length | 8 characters |
| Maximum length | 128 characters |
| Uppercase | At least 1 (A-Z) |
| Lowercase | At least 1 (a-z) |
| Numbers | At least 1 (0-9) |
| Special chars | At least 1 (!@#$%^&*) |

---

## JWT Token Structure

### Access Token (7 days)

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "PARTICIPANT",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Refresh Token (30 days)

- Stored as hash in database
- Used to obtain new access tokens
- Can be revoked anytime

---

## OAuth 2.0 Integration

### Google OAuth

1. **Configure in Google Cloud Console:**
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add redirect URI: `http://localhost:4000/api/v1/auth/oauth/google/callback`

2. **Environment Variables:**
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/oauth/google/callback
```

3. **Authorization Flow:**
```
Client → GET /api/v1/auth/oauth/google
       ↓
Redirect to Google
       ↓
User authorizes
       ↓
Callback with code
       ↓
Exchange code for tokens
       ↓
Create/update user
       ↓
Return VANTAGE tokens
```

### Microsoft OAuth

1. **Configure in Azure Portal:**
   - Register application
   - Add redirect URI
   - Configure API permissions

2. **Environment Variables:**
```env
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:4000/api/v1/auth/oauth/microsoft/callback
```

---

## End-to-End Encryption (E2EE)

### Encryption Service

```typescript
import AuthService from './services/AuthService';

// Encrypt sensitive data
const encrypted = AuthService.encrypt('sensitive message');
// Returns: "iv_hex:encrypted_hex"

// Decrypt data
const decrypted = AuthService.decrypt(encrypted);
// Returns: "sensitive message"
```

### Room Key Exchange

```typescript
// Generate room encryption key
const roomKey = AuthService.generateRoomKey();
// Returns: 64-character hex string

// Share key via secure channel (WebRTC data channel)
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| /auth/* | 5 req/min | 1 minute |
| /api/* | 100 req/min | 1 minute |
| General | 1000 req/min | 1 minute |

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1647360000
```

### 429 Response

```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Too many requests, please try again later",
    "retryAfter": 45
  }
}
```

---

## Session Management

### Active Sessions

```
GET /api/v1/auth/sessions
Authorization: Bearer eyJhbG...

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "createdAt": "2024-01-01T00:00:00Z",
      "expiresAt": "2024-01-08T00:00:00Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

### Revoke Session

```
DELETE /api/v1/auth/sessions/:sessionId
Authorization: Bearer eyJhbG...
```

### Revoke All Sessions

```
POST /api/v1/auth/revoke-all
Authorization: Bearer eyJhbG...
```

---

## Security Best Practices

### 1. Token Storage (Client)

```typescript
// ✅ DO: Use httpOnly cookies for tokens
document.cookie = `accessToken=${token}; HttpOnly; Secure; SameSite=Strict`;

// ❌ DON'T: Store tokens in localStorage
localStorage.setItem('token', token); // Vulnerable to XSS
```

### 2. Token Refresh Strategy

```typescript
// Refresh token before expiry (e.g., at 80% of lifetime)
const refreshThreshold = expiresIn * 0.8;
setTimeout(refreshToken, refreshThreshold * 1000);
```

### 3. WebSocket Authentication

```typescript
// Include token in handshake
const socket = io('ws://localhost:4000', {
  auth: {
    token: accessToken,
  },
});
```

### 4. Password Hashing

- Algorithm: bcrypt
- Salt rounds: 12
- Time per hash: ~250ms

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | No token provided |
| INVALID_TOKEN | 401 | Token expired or invalid |
| SESSION_EXPIRED | 401 | Session no longer valid |
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| USER_EXISTS | 409 | Email already registered |
| WEAK_PASSWORD | 400 | Password doesn't meet requirements |
| FORBIDDEN | 403 | Insufficient permissions |
| TOO_MANY_REQUESTS | 429 | Rate limit exceeded |

---

## Testing

### Using cURL

```bash
# Register
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test User"}'

# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Get Profile
curl -X GET http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using JavaScript

```typescript
// Login helper
async function login(email: string, password: string) {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Store tokens securely
    localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    // Use httpOnly cookie for access token (set by server)
  }
  
  return data;
}

// Refresh token helper
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
  }
  
  return data;
}
```

---

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Encryption
ENCRYPTION_KEY=your-32-character-hex-encryption-key

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/oauth/google/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_CALLBACK_URL=http://localhost:4000/api/v1/auth/oauth/microsoft/callback

# Security
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

---

## Database Schema

### Sessions Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| token_hash | VARCHAR(255) | Hashed access token |
| refresh_token_hash | VARCHAR(255) | Hashed refresh token |
| expires_at | TIMESTAMP | Session expiry |
| created_at | TIMESTAMP | Session creation |
| user_agent | VARCHAR | Client user agent |
| ip_address | VARCHAR | Client IP address |

---

## Next Steps

1. ✅ **Authentication Complete**
2. 🔐 Implement 2FA (TOTP)
3. 📧 Email verification
4. 🔑 Password reset flow
5. 🛡️ CAPTCHA for login
6. 📱 Device fingerprinting
