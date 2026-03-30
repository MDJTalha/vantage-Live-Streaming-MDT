# VANTAGE API Documentation

## Base URL

```
Production: https://api.vantage.live
Development: http://localhost:4000
```

## Authentication

All authenticated endpoints require a Bearer token:

```bash
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### Register User

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response:**
```json
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

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "uuid"
}
```

### Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

### Get Profile

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

---

## Room Endpoints

### Create Room

```http
POST /api/v1/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Team Meeting",
  "description": "Weekly sync",
  "settings": {
    "maxParticipants": 50,
    "requirePassword": true
  },
  "password": "meeting123"
}
```

### Get Room by Code

```http
GET /api/v1/rooms/:roomCode
```

### Join Room

```http
POST /api/v1/rooms/:roomCode/join
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "meeting123"
}
```

### Start Room (Host Only)

```http
POST /api/v1/rooms/:roomId/start
Authorization: Bearer <token>
```

### End Room (Host Only)

```http
POST /api/v1/rooms/:roomId/end
Authorization: Bearer <token>
```

### Update Room Settings

```http
PATCH /api/v1/rooms/:roomId/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "maxParticipants": 100,
  "enableWaitingRoom": true
}
```

---

## Chat Endpoints

### Get Messages

```http
GET /api/v1/chat/:roomId?limit=50
Authorization: Bearer <token>
```

### Send Message

```http
POST /api/v1/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "room-uuid",
  "content": "Hello everyone!",
  "messageType": "TEXT"
}
```

### Add Reaction

```http
POST /api/v1/chat/:messageId/reaction
Authorization: Bearer <token>
Content-Type: application/json

{
  "emoji": "👍"
}
```

---

## Poll Endpoints

### Create Poll

```http
POST /api/v1/polls
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "room-uuid",
  "question": "Favorite feature?",
  "options": [
    { "id": "1", "text": "Video" },
    { "id": "2", "text": "Chat" }
  ],
  "multipleChoice": false
}
```

### Vote on Poll

```http
POST /api/v1/polls/:id/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "optionId": "1"
}
```

### Get Poll Results

```http
GET /api/v1/polls/:id/results
```

---

## Recording Endpoints

### Start Recording

```http
POST /api/v1/recordings/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "room-uuid",
  "title": "Team Meeting",
  "outputFormat": "mp4"
}
```

### Stop Recording

```http
POST /api/v1/recordings/stop
Authorization: Bearer <token>
Content-Type: application/json

{
  "recordingId": "room-uuid-1234567890"
}
```

### List Recordings

```http
GET /api/v1/recordings/:roomId
Authorization: Bearer <token>
```

### Get Recording URL

```http
GET /api/v1/recordings/:roomId/:key/url
Authorization: Bearer <token>
```

---

## Streaming Endpoints

### Start Stream

```http
POST /api/v1/stream/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "room-uuid",
  "platform": "youtube",
  "streamKey": "xxxx-xxxx-xxxx",
  "rtmpUrl": "rtmp://a.rtmp.youtube.com/live2"
}
```

### Stop Stream

```http
POST /api/v1/stream/stop
Authorization: Bearer <token>
Content-Type: application/json

{
  "streamId": "room-uuid-youtube-1234567890"
}
```

---

## Analytics Endpoints

### Get Room Analytics

```http
GET /api/v1/analytics/room/:roomId
```

### Get Dashboard Metrics

```http
GET /api/v1/analytics/dashboard?days=30
Authorization: Bearer <token>
```

### Get User Activity

```http
GET /api/v1/analytics/activity
Authorization: Bearer <token>
```

---

## Security Endpoints

### Generate E2EE Keys

```http
POST /api/v1/security/e2ee/keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "participantCount": 2
}
```

### Encrypt Data

```http
POST /api/v1/security/e2ee/encrypt
Authorization: Bearer <token>
Content-Type: application/json

{
  "plaintext": "sensitive message",
  "key": "encryption-key"
}
```

### Decrypt Data

```http
POST /api/v1/security/e2ee/decrypt
Authorization: Bearer <token>
Content-Type: application/json

{
  "ciphertext": "...",
  "key": "encryption-key",
  "iv": "...",
  "authTag": "..."
}
```

---

## GDPR Endpoints

### Request Data Export

```http
POST /api/v1/gdpr/export
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Get Export Data

```http
GET /api/v1/gdpr/export/:requestId
Authorization: Bearer <token>
```

### Delete Account

```http
DELETE /api/v1/gdpr/account
Authorization: Bearer <token>
```

### Record Consent

```http
POST /api/v1/gdpr/consent
Authorization: Bearer <token>
Content-Type: application/json

{
  "consentType": "recording",
  "granted": true
}
```

### Withdraw Consent

```http
DELETE /api/v1/gdpr/consent/:consentType
Authorization: Bearer <token>
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | No/invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth | 5 requests | 1 minute |
| General API | 100 requests | 1 minute |
| Recording | 10 requests | 1 hour |
| Export | 5 requests | 1 hour |

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1647360000
```

---

## WebSocket Events

### Connect

```javascript
const socket = io('ws://localhost:4000', {
  auth: { token: 'Bearer <token>' }
});
```

### Room Events

```javascript
// Join room
socket.emit('join-room', { roomId: 'room-uuid' });

// Leave room
socket.emit('leave-room', { roomId: 'room-uuid' });

// User joined
socket.on('user-joined', (data) => {});

// User left
socket.on('user-left', (data) => {});
```

### Chat Events

```javascript
// Send message
socket.emit('send-message', {
  roomId: 'room-uuid',
  content: 'Hello!',
  type: 'text'
});

// Receive message
socket.on('receive-message', (data) => {});
```

### WebRTC Signaling

```javascript
// Send offer
socket.emit('offer', {
  roomId: 'room-uuid',
  offer: sdpOffer,
  to: 'peer-id'
});

// Receive offer
socket.on('offer', (data) => {});

// Send answer
socket.emit('answer', {
  roomId: 'room-uuid',
  answer: sdpAnswer,
  to: 'peer-id'
});

// ICE candidate
socket.emit('ice-candidate', {
  roomId: 'room-uuid',
  candidate: iceCandidate,
  to: 'peer-id'
});
```

---

## SDKs

### JavaScript/TypeScript

```bash
npm install @vantage/sdk
```

```typescript
import { VantageClient } from '@vantage/sdk';

const client = new VantageClient({
  apiKey: 'your-api-key',
});

// Create room
const room = await client.rooms.create({
  name: 'My Meeting',
});

// Join room
await client.rooms.join(room.code);
```

### Python

```bash
pip install vantage-python
```

```python
from vantage import VantageClient

client = VantageClient(api_key='your-api-key')

# Create room
room = client.rooms.create(name='My Meeting')

# Join room
client.rooms.join(room.code)
```

---

## Changelog

### v1.0.0 (2024-01-01)
- Initial release
- Video conferencing
- Chat & reactions
- Polls & Q&A
- Recording
- Live streaming
- Analytics
- E2EE
- GDPR compliance
