# VANTAGE WebRTC & Media Server Guide

## Overview

VANTAGE uses **WebRTC** for real-time communication with a **Mediasoup SFU** (Selective Forwarding Unit) architecture for scalable multi-party video conferencing.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VANTAGE Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Peer 1  │  │  Peer 2  │  │  Peer 3  │  │  Peer N  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │              │
│       └─────────────┴──────┬──────┴─────────────┘              │
│                            │                                    │
│                   ┌────────▼────────┐                          │
│                   │   WebSocket     │                          │
│                   │   Signaling     │                          │
│                   └────────┬────────┘                          │
│                            │                                    │
│                   ┌────────▼────────┐                          │
│                   │  Mediasoup SFU  │                          │
│                   │  (Media Server) │                          │
│                   └────────┬────────┘                          │
│                            │                                    │
│       ┌────────────────────┼────────────────────┐              │
│       │                    │                    │              │
│  ┌────▼────┐        ┌─────▼─────┐       ┌──────▼─────┐        │
│  │ Router  │        │ Transports│       │ Producers  │        │
│  │         │        │  (WebRTC) │       │ Consumers  │        │
│  └─────────┘        └───────────┘       └────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Signaling Server (WebSocket)

**Path**: `apps/api/src/services/SignalingService.ts`

Handles:
- Peer discovery
- SDP offer/answer exchange
- ICE candidate exchange
- Room management

### 2. Media Server (Mediasoup SFU)

**Path**: `apps/media-server/src/index.ts`

Handles:
- Media routing
- Simulcast
- Adaptive bitrate
- Active speaker detection

### 3. WebRTC Client

**Path**: `packages/utils/src/WebRTCClient.ts`

Provides:
- Peer connection management
- Media stream handling
- Screen sharing
- Camera switching

---

## Simulcast

### Configuration

```typescript
const simulcastLayers = [
  { rid: 'h', scaleResolutionDownBy: 1, maxBitrate: 1500000 }, // High (1080p)
  { rid: 'm', scaleResolutionDownBy: 2, maxBitrate: 500000 },  // Medium (540p)
  { rid: 'l', scaleResolutionDownBy: 4, maxBitrate: 150000 },  // Low (270p)
];
```

### How It Works

1. **Publisher** sends 3 quality layers simultaneously
2. **SFU** receives all layers
3. **Subscribers** receive optimal layer based on:
   - Available bandwidth
   - CPU capacity
   - Screen size

### Adaptive Switching

```typescript
// Automatic layer selection based on bandwidth
if (bandwidth >= 1000kbps) → High layer
if (bandwidth >= 400kbps)  → Medium layer
else                        → Low layer
```

---

## Audio Processing

### Features

| Feature | Description |
|---------|-------------|
| **Echo Cancellation** | Removes echo from speakers |
| **Noise Suppression** | Reduces background noise |
| **Auto Gain Control** | Normalizes volume levels |
| **Voice Isolation** | Focuses on voice frequencies |
| **High-Pass Filter** | Removes low-frequency rumble |

### Usage

```typescript
import { AudioProcessor } from '@vantage/utils';

const processor = new AudioProcessor();

// Initialize with stream
const processedStream = await processor.initialize(localStream, {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  voiceIsolation: true,
  noiseReductionLevel: 'medium',
});

// Get audio level (0-1)
const level = processor.getAudioLevel();

// Detect speaking
const isSpeaking = processor.isSpeaking(0.1);

// Mute/unmute
processor.mute();
processor.unmute();

// Cleanup
await processor.cleanup();
```

---

## React Hook Usage

### Basic Video Call

```typescript
import { useWebRTC } from '@vantage/utils';

function VideoRoom({ roomId }: { roomId: string }) {
  const {
    isConnected,
    localStream,
    remoteStreams,
    localVideoRef,
    toggleAudio,
    toggleVideo,
    joinRoom,
    leaveRoom,
  } = useWebRTC({
    roomId,
    name: 'John Doe',
    onPeerJoined: (peerId) => console.log('Peer joined:', peerId),
    onStreamAdded: (stream, peerId) => {
      // Add remote video element
    },
  });

  useEffect(() => {
    joinRoom(roomId);
    return () => leaveRoom();
  }, [roomId]);

  return (
    <div>
      {/* Local video */}
      <video ref={localVideoRef} autoPlay muted />

      {/* Remote videos */}
      {Array.from(remoteStreams).map(([peerId, stream]) => (
        <video
          key={peerId}
          srcObject={stream}
          autoPlay
          playsInline
        />
      ))}

      {/* Controls */}
      <button onClick={toggleAudio}>Toggle Audio</button>
      <button onClick={toggleVideo}>Toggle Video</button>
      <button onClick={leaveRoom}>Leave</button>
    </div>
  );
}
```

---

## API Reference

### WebRTCClient

| Method | Description |
|--------|-------------|
| `initialize()` | Setup peer connection |
| `startLocalMedia()` | Get camera + mic |
| `startScreenShare()` | Share screen |
| `toggleAudio()` | Mute/unmute audio |
| `toggleVideo()` | Enable/disable video |
| `switchCamera()` | Front/back camera |
| `createOffer()` | Create SDP offer |
| `createAnswer()` | Create SDP answer |
| `addIceCandidate()` | Add ICE candidate |
| `close()` | Cleanup connection |

### AudioProcessor

| Method | Description |
|--------|-------------|
| `initialize()` | Setup audio chain |
| `getAudioLevel()` | Get volume (0-1) |
| `isSpeaking()` | Detect speech |
| `getFrequencyData()` | Get FFT data |
| `setVolume()` | Set gain |
| `mute()` | Mute output |
| `unmute()` | Unmute output |
| `cleanup()` | Close audio context |

### SimulcastHandler

| Method | Description |
|--------|-------------|
| `addSimulcastProducer()` | Create multi-layer producer |
| `createLayerConsumer()` | Subscribe to specific layer |
| `switchLayer()` | Change quality layer |
| `adaptToBandwidth()` | Auto-adjust quality |
| `getAvailableLayers()` | Get available qualities |
| `cleanupProducer()` | Remove producer layers |

---

## Network Requirements

### Bandwidth

| Quality | Upload | Download |
|---------|--------|----------|
| **Low (270p)** | 150 Kbps | 150 Kbps |
| **Medium (540p)** | 500 Kbps | 500 Kbps |
| **High (1080p)** | 1.5 Mbps | 1.5 Mbps |
| **Screen Share** | 2 Mbps | 2 Mbps |

### Ports

| Service | Port | Protocol |
|---------|------|----------|
| **Signaling** | 4000 | TCP/WS |
| **Media (SFU)** | 443 | TCP/WSS |
| **WebRTC UDP** | 10000-60000 | UDP |
| **TURN** | 3478 | UDP/TCP |
| **TURN TLS** | 5349 | TCP |

---

## TURN Server Setup

### Coturn Configuration

```bash
# Start TURN server
docker run -d --net=host \
  -e TURN_USERNAME=vantage_user \
  -e TURN_PASSWORD=vantage_password \
  coturn/coturn \
  -n --listening-port=3478 \
  --min-port=10000 --max-port=60000 \
  --realm=vantage.live \
  --lt-cred-mech
```

### Client Configuration

```typescript
const iceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'vantage_user',
    credential: 'vantage_password',
  },
];
```

---

## Performance Optimization

### 1. Simulcast

Always enable simulcast for video to allow adaptive quality.

### 2. SVC (Scalable Video Coding)

Use VP9 with SVC for better quality layering:

```typescript
const vp9SVC = {
  scalabilityMode: 'L3T3_KEY', // 3 spatial × 3 temporal
};
```

### 3. Bandwidth Estimation

Monitor REMB (Receiver Estimated Maximum Bitrate) packets:

```typescript
producer.on('trackrestarted', () => {
  const bitrate = producer.score.producerScore;
  console.log('Current bitrate:', bitrate);
});
```

### 4. Active Speaker Detection

```typescript
const observer = router.createActiveSpeakerObserver({
  interval: 500, // ms
});

observer.on('volumes', (volumes) => {
  volumes.forEach((volume) => {
    console.log(`Producer ${volume.producerId}: ${volume.volume}`);
  });
});
```

---

## Troubleshooting

### No Video/Audio

1. Check browser permissions
2. Verify media constraints
3. Check ICE connection state

### Poor Quality

1. Check available bandwidth
2. Verify simulcast layers
3. Monitor packet loss

### Connection Failed

1. Check firewall rules
2. Verify TURN server
3. Check ICE candidates

---

## Security

### DTLS Encryption

All WebRTC traffic is encrypted with DTLS 1.2+.

### SRTP

Media streams use SRTP with AES-128 encryption.

### Access Control

```typescript
// Verify user before joining room
socket.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const user = await verifyToken(token);
  
  if (!user) {
    return next(new Error('Unauthorized'));
  }
  
  socket.userId = user.id;
  next();
});
```

---

## Testing

### Local Testing

```bash
# Start signaling server
cd apps/api && npm run dev

# Start media server
cd apps/media-server && npm run dev

# Start frontend
cd apps/web && npm run dev
```

### Network Testing

```bash
# Test TURN server
turnutils_uclient -u vantage_user -P vantage_password turn:localhost:3478

# Check ports
netstat -an | grep 10000
```

---

## Next Steps

1. ✅ **WebRTC Signaling** - Complete
2. ✅ **SFU Media Server** - Complete
3. ✅ **Simulcast** - Complete
4. ✅ **Audio Processing** - Complete
5. 📱 **Mobile WebRTC** - Phase 7
6. 🎥 **Recording** - Phase 9
