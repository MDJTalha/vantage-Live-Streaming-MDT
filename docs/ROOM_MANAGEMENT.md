# VANTAGE Room Management Guide

## Overview

VANTAGE provides comprehensive room management features including access control, role-based permissions, waiting rooms, and breakout rooms.

---

## Room Lifecycle

```
SCHEDULED → ACTIVE → ENDED → RECORDED
```

### States

| State | Description |
|-------|-------------|
| **SCHEDULED** | Room created but not started |
| **ACTIVE** | Room is live, participants can join |
| **ENDED** | Room ended, no new joins allowed |
| **RECORDED** | Recording has been processed |

---

## Room Creation

### API

```typescript
POST /api/v1/rooms
Authorization: Bearer <token>

{
  "name": "Team Standup",
  "description": "Daily team sync",
  "settings": {
    "maxParticipants": 50,
    "allowChat": true,
    "allowScreenShare": true,
    "allowRecording": true,
    "requirePassword": true,
    "requireApproval": false,
    "enableBreakoutRooms": true,
    "enableWaitingRoom": false
  },
  "password": "secure123"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roomCode": "swift-eagle-123",
    "name": "Team Standup",
    "hostId": "uuid",
    "status": "SCHEDULED",
    "settings": { ... },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## Room Access Control

### Password Protection

```typescript
// Create room with password
await createRoom({
  name: 'Private Meeting',
  password: 'meeting123',
});

// Join with password
await joinRoom('swift-eagle-123', {
  password: 'meeting123',
});
```

### Approval Required

When `requireApproval` is enabled:
1. Participants request to join
2. Host receives waiting room notification
3. Host admits or denies each participant

### Waiting Room Flow

```
Participant → Request Join → Waiting Room → Host Admits → Room
                                          ↓
                                      Host Denies → Redirected
```

---

## Participant Roles

| Role | Permissions |
|------|-------------|
| **Host** | Full control: start/end room, promote/demote, remove participants, modify settings |
| **Co-host** | Most host controls except ending room and transferring host |
| **Participant** | Share screen, chat, raise hand, react |
| **Viewer** | Read-only, no audio/video |

### Role Management

```typescript
// Promote to co-host
POST /api/v1/rooms/:roomId/participants/:participantId/promote

// Demote to participant
POST /api/v1/rooms/:roomId/participants/:participantId/demote

// Remove participant
DELETE /api/v1/rooms/:roomId/participants/:participantId
```

---

## Room Settings

### Default Settings

```typescript
{
  maxParticipants: 100,
  allowChat: true,
  allowScreenShare: true,
  allowRecording: true,
  requirePassword: false,
  requireApproval: false,
  enableBreakoutRooms: true,
  enableWaitingRoom: false
}
```

### Update Settings

```typescript
PATCH /api/v1/rooms/:roomId/settings

{
  "maxParticipants": 50,
  "requirePassword": true,
  "enableWaitingRoom": true
}
```

---

## Host Controls

### Start Meeting

```typescript
POST /api/v1/rooms/:roomId/start
```

### End Meeting

```typescript
POST /api/v1/rooms/:roomId/end
```

### Mute Participant

```typescript
// Via WebSocket
socket.emit('mute-participant', {
  roomId,
  participantId,
  mute: true
});
```

### Stop Participant Video

```typescript
socket.emit('stop-video', {
  roomId,
  participantId
});
```

---

## Waiting Room

### Host View

```typescript
import { WaitingRoom } from '@/components/WaitingRoom';

<WaitingRoom
  participants={waitingParticipants}
  onAdmit={(id) => admitParticipant(id)}
  onDeny={(id) => denyParticipant(id)}
  onAdmitAll={() => admitAllParticipants()}
/>
```

### Admit Participant

```typescript
socket.emit('admit-participant', {
  roomId,
  participantId
});
```

---

## Breakout Rooms

### Create Breakout Rooms

```typescript
POST /api/v1/rooms/:roomId/breakout

{
  "count": 4,
  "method": "auto", // or "manual"
  "participants": [...] // for manual assignment
}
```

### Join Breakout Room

```typescript
socket.emit('join-breakout', {
  roomId,
  breakoutRoomId
});
```

### Return to Main Room

```typescript
socket.emit('leave-breakout', {
  breakoutRoomId
});
```

### Broadcast to All Breakout Rooms

```typescript
socket.emit('broadcast-to-breakouts', {
  message: 'Meeting ending in 5 minutes'
});
```

---

## Room Events (WebSocket)

### Room Lifecycle

```typescript
// Join room
socket.emit('join-room', { roomId });

// Leave room
socket.emit('leave-room', { roomId });

// Start room (host only)
socket.emit('start-room', { roomId });

// End room (host only)
socket.emit('end-room', { roomId });
```

### Participant Management

```typescript
// Admit from waiting room
socket.emit('admit-participant', { roomId, participantId });

// Deny from waiting room
socket.emit('deny-participant', { roomId, participantId });

// Promote to co-host
socket.emit('promote-cohost', { roomId, participantId });

// Remove participant
socket.emit('remove-participant', { roomId, participantId });
```

### Room Events Received

```typescript
socket.on('room-started', ({ roomId, startedAt }) => {});
socket.on('room-ended', ({ roomId, endedAt }) => {});
socket.on('participant-joined', ({ participant }) => {});
socket.on('participant-left', ({ participantId }) => {});
socket.on('waiting-participant', ({ participant }) => {});
socket.on('participant-admitted', ({ participantId }) => {});
socket.on('role-changed', ({ participantId, newRole }) => {});
```

---

## React Hook Usage

### Room Management

```typescript
import { useRooms } from '@/hooks/useRooms';

function Dashboard() {
  const {
    rooms,
    activeRooms,
    isLoading,
    createRoom,
    joinRoom,
    startRoom,
    endRoom,
    updateSettings,
  } = useRooms();

  const handleCreate = async () => {
    const room = await createRoom({
      name: 'My Meeting',
      settings: { maxParticipants: 50 },
    });
    router.push(`/room/${room.roomCode}`);
  };

  return (
    <div>
      {rooms.map(room => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
```

---

## Security

### Access Control Matrix

| Action | Host | Co-host | Participant | Viewer |
|--------|------|---------|-------------|--------|
| Start room | ✅ | ❌ | ❌ | ❌ |
| End room | ✅ | ❌ | ❌ | ❌ |
| Admit participants | ✅ | ✅ | ❌ | ❌ |
| Promote/demote | ✅ | ❌ | ❌ | ❌ |
| Remove participants | ✅ | ✅ | ❌ | ❌ |
| Share screen | ✅ | ✅ | ✅ | ❌ |
| Chat | ✅ | ✅ | ✅ | ❌ |
| Mute self | ✅ | ✅ | ✅ | ✅ |

### Room Lock

```typescript
// Lock room (no new participants)
await updateSettings(roomId, {
  requireApproval: true,
});
```

### Eject All Participants

```typescript
// End room ejects everyone
await endRoom(roomId);
```

---

## Best Practices

1. **Always verify host** before allowing room modifications
2. **Use waiting rooms** for public meetings
3. **Set max participants** based on expected attendance
4. **Enable recording** for important meetings
5. **Assign co-hosts** for large meetings
6. **Use breakout rooms** for workshops > 20 people

---

## Error Handling

### Common Errors

| Code | Message | Resolution |
|------|---------|------------|
| ROOM_NOT_FOUND | Room doesn't exist | Check room code |
| ROOM_NOT_ACTIVE | Room not started | Host must start room |
| INVALID_PASSWORD | Wrong password | Verify password |
| ROOM_FULL | Max participants reached | Increase limit or wait |
| FORBIDDEN | Insufficient permissions | Check role |

---

## Next Steps

1. ✅ **Room CRUD** - Complete
2. ✅ **Access Control** - Complete
3. ✅ **Role Management** - Complete
4. ✅ **Waiting Room** - Complete
5. 📋 **Breakout Rooms** - Phase 5.3
6. 📋 **Room Templates** - Future
