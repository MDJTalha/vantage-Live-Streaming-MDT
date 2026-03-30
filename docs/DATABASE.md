# VANTAGE Database Documentation

## Overview

VANTAGE uses **PostgreSQL 15+** as the primary database with **Prisma ORM** for type-safe database access.

---

## Database Schema

### Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | User accounts & authentication | id, email, password_hash, role |
| `rooms` | Virtual meeting rooms | id, room_code, host_id, status |
| `room_participants` | Room membership tracking | id, room_id, user_id, role |
| `chat_messages` | Real-time chat history | id, room_id, content, message_type |
| `polls` | Live polling system | id, room_id, question, options |
| `poll_votes` | Poll vote tracking | id, poll_id, option_id, user_id |
| `questions` | Q&A system | id, room_id, content, upvotes |
| `recordings` | Meeting recordings | id, room_id, url, duration |
| `sessions` | Auth session management | id, user_id, token_hash, expires_at |
| `room_analytics` | Room metrics & analytics | id, room_id, total_participants |
| `breakout_rooms` | Breakout room management | id, parent_room_id, name |
| `producers` | WebRTC media producers | id, participant_id, kind |
| `consumers` | WebRTC media consumers | id, participant_id, producer_id |
| `notifications` | User notifications | id, user_id, type, message |

---

## Entity Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐  ┌──────────────┐
│    rooms    │  │  sessions    │
└──────┬──────┘  └──────────────┘
       │
       ├────────────┬────────────┬────────────┬─────────────┐
       │            │            │            │             │
       ▼            ▼            ▼            ▼             ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│participants │ │ messages │ │  polls   │ │questions │ │recordings│
└──────┬──────┘ └──────────┘ └────┬─────┘ └──────────┘ └──────────┘
       │                          │
       ├────────────┐             │
       │            │             │
       ▼            ▼             ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐
│  producers  │ │ consumers│ │poll_votes│
└─────────────┘ └──────────┘ └──────────┘
```

---

## Key Relationships

### Users → Rooms
- **One-to-Many**: A user can host multiple rooms
- **Foreign Key**: `rooms.host_id` → `users.id`

### Rooms → Participants
- **One-to-Many**: A room can have many participants
- **Foreign Key**: `room_participants.room_id` → `rooms.id`

### Rooms → Messages
- **One-to-Many**: A room can have many chat messages
- **Foreign Key**: `chat_messages.room_id` → `rooms.id`

### Polls → Votes
- **One-to-Many**: A poll can have many votes
- **Unique Constraint**: One vote per user/poll
- **Foreign Key**: `poll_votes.poll_id` → `polls.id`

---

## Indexes

### Performance Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `users` | `idx_users_email` | Fast email lookup |
| `rooms` | `idx_rooms_code` | Room code lookup |
| `rooms` | `idx_rooms_host` | Host's rooms query |
| `rooms` | `idx_rooms_status` | Filter by status |
| `room_participants` | `idx_participants_room` | Room participants |
| `room_participants` | `idx_participants_user` | User's rooms |
| `chat_messages` | `idx_messages_room` | Room messages |
| `chat_messages` | `idx_messages_created` | Time-based queries |
| `polls` | `idx_polls_room` | Room polls |
| `poll_votes` | `idx_votes_poll` | Poll results |
| `sessions` | `idx_sessions_user` | User sessions |
| `sessions` | `idx_sessions_token` | Token validation |
| `recordings` | `idx_recordings_room` | Room recordings |

---

## Common Queries

### Get Active Room with Participants

```sql
SELECT 
  r.*,
  u.name as host_name,
  u.email as host_email,
  COUNT(rp.id) as participant_count
FROM rooms r
JOIN users u ON r.host_id = u.id
LEFT JOIN room_participants rp ON r.id = rp.room_id AND rp.left_at IS NULL
WHERE r.room_code = 'swift-eagle-123'
  AND r.status = 'ACTIVE'
GROUP BY r.id, u.id;
```

### Get Chat Messages with User Info

```sql
SELECT 
  m.*,
  u.name,
  u.avatar_url
FROM chat_messages m
LEFT JOIN users u ON m.user_id = u.id
WHERE m.room_id = $1
ORDER BY m.created_at ASC
LIMIT 50;
```

### Get Poll Results

```sql
SELECT 
  p.id,
  p.question,
  p.options,
  COUNT(pv.id) as total_votes,
  pv.option_id,
  COUNT(pv.option_id) as option_votes
FROM polls p
LEFT JOIN poll_votes pv ON p.id = pv.poll_id
WHERE p.id = $1
GROUP BY p.id, pv.option_id;
```

### Get User's Active Sessions

```sql
SELECT 
  id,
  expires_at,
  created_at,
  ip_address,
  user_agent
FROM sessions
WHERE user_id = $1
  AND expires_at > NOW()
ORDER BY created_at DESC;
```

---

## Data Models (TypeScript)

### User
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Room
```typescript
interface Room {
  id: string;
  roomCode: string;
  name: string;
  description?: string;
  hostId: string;
  status: RoomStatus;
  settings: RoomSettings;
  passwordHash?: string;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### RoomSettings
```typescript
interface RoomSettings {
  maxParticipants: number;
  allowChat: boolean;
  allowScreenShare: boolean;
  allowRecording: boolean;
  requirePassword: boolean;
  requireApproval: boolean;
  enableBreakoutRooms: boolean;
  enableWaitingRoom: boolean;
}
```

---

## Migrations

### Running Migrations

```bash
# Development (auto-generates migrations)
npx prisma migrate dev

# Production (apply existing migrations)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Creating a New Migration

```bash
npx prisma migrate dev --name add_new_feature
```

---

## Seeding

### Run Seed Script

```bash
npm run db:seed
```

### Default Seed Data

| User Type | Email | Password |
|-----------|-------|----------|
| Admin | admin@vantage.live | admin123 |
| Host | host@vantage.live | host123 |
| User | user@vantage.live | user123 |

---

## Best Practices

1. **Always use transactions** for multi-step operations
2. **Include indexes** on frequently queried fields
3. **Use soft deletes** where possible (e.g., `left_at` instead of DELETE)
4. **Batch operations** for bulk inserts/updates
5. **Connection pooling** is handled by Prisma (default: 10 connections)
6. **Regular backups** using pg_dump or cloud provider tools

---

## Backup & Restore

### Backup

```bash
pg_dump -U vantage -h localhost vantage > backup.sql
```

### Restore

```bash
psql -U vantage -h localhost vantage < backup.sql
```

---

## Monitoring

### Connection Count

```sql
SELECT count(*) FROM pg_stat_activity;
```

### Slow Queries

```sql
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Table Sizes

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```
