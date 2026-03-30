# VANTAGE Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         VANTAGE Platform                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │   Web App    │     │  Mobile App  │     │  Desktop App │   │
│  │  (Next.js)   │     │  (Flutter)   │     │  (Electron)  │   │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘   │
│         │                    │                    │           │
│         └────────────────────┼────────────────────┘           │
│                              │                                 │
│                    ┌─────────▼─────────┐                      │
│                    │   Load Balancer   │                      │
│                    │   (nginx/ALB)     │                      │
│                    └─────────┬─────────┘                      │
│                              │                                 │
│         ┌────────────────────┼────────────────────┐           │
│         │                    │                    │           │
│  ┌──────▼───────┐     ┌──────▼───────┐     ┌──────▼───────┐  │
│  │  API Server  │     │ Media Server │     │  WebSocket   │  │
│  │  (Node.js)   │     │ (Mediasoup)  │     │   Server     │  │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘  │
│         │                    │                    │           │
│         └────────────────────┼────────────────────┘           │
│                              │                                 │
│                    ┌─────────▼─────────┐                      │
│                    │      Redis        │                      │
│                    │   (Cache/PubSub)  │                      │
│                    └─────────┬─────────┘                      │
│                              │                                 │
│                    ┌─────────▼─────────┐                      │
│                    │   PostgreSQL      │                      │
│                    │    (Database)     │                      │
│                    └───────────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend Applications

#### Web (Next.js)
- **Path**: `apps/web`
- **Tech**: Next.js 14, React, TypeScript, TailwindCSS
- **Features**:
  - Server-side rendering for SEO
  - Real-time video grid
  - Screen sharing
  - Chat interface
  - Polls & Q&A

#### Mobile (Flutter)
- **Path**: `apps/mobile`
- **Tech**: Flutter, Dart
- **Features**:
  - Cross-platform (iOS/Android)
  - Native WebRTC integration
  - Push notifications
  - Offline support

### 2. Backend Services

#### API Server
- **Path**: `apps/api`
- **Tech**: Node.js, Express, TypeScript
- **Responsibilities**:
  - User authentication
  - Room management
  - Chat persistence
  - Analytics

#### Media Server (SFU)
- **Path**: `apps/media-server`
- **Tech**: Mediasoup, WebRTC
- **Responsibilities**:
  - Video routing
  - Audio mixing
  - Simulcast
  - Recording

### 3. Data Layer

#### PostgreSQL
- **Primary database**
- **Tables**: users, rooms, messages, polls, recordings, analytics

#### Redis
- **Caching**: Session data, room state
- **Pub/Sub**: Real-time events
- **Rate limiting**: API throttling

### 4. Infrastructure

#### Docker
- All services containerized
- Docker Compose for local development

#### Kubernetes
- Production orchestration
- Auto-scaling
- Health checks

## Data Flow

### Joining a Room

```
User → API (authenticate) → WebSocket (connect) → Media Server (join)
```

### Sending a Message

```
User → WebSocket → Redis Pub/Sub → All users in room → Database (persist)
```

### Video Streaming

```
User → WebRTC → Media Server (SFU) → Other participants
```

## Security

- **E2EE**: Optional end-to-end encryption
- **JWT**: Authentication tokens
- **Rate Limiting**: DDoS protection
- **CORS**: Origin validation
- **HTTPS/TLS**: Encrypted transport

## Scalability

- **Horizontal**: Multiple media servers
- **Load Balancing**: nginx/ALB
- **CDN**: Global edge caching
- **Database**: Read replicas, connection pooling
