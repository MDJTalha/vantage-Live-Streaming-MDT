# VANTAGE AI Features Guide

## Overview

VANTAGE includes powerful AI-driven features to enhance your meetings:

- **Real-time Transcription** - Speech-to-text using Whisper
- **Virtual Backgrounds** - Background blur and replacement
- **Speaker Detection** - Active speaker identification
- **Meeting Summaries** - AI-generated summaries and highlights
- **Action Items** - Automatic task extraction

---

## Real-time Transcription

### Setup

```typescript
import { LiveTranscript } from '@/components/LiveTranscript';

<LiveTranscript
  roomId={roomId}
  isRecording={isRecording}
/>
```

### API

```typescript
// Start transcription
POST /api/v1/ai/transcribe/stream
{
  "roomId": "room-123",
  "language": "en"
}

// Send audio chunk
POST /api/v1/ai/transcribe/stream/:streamId
{
  "audioChunk": "base64-encoded-audio"
}

// Get final transcript
POST /api/v1/ai/transcribe/stream/:streamId/end
```

### Supported Languages

| Code | Language |
|------|----------|
| en | English |
| es | Spanish |
| fr | French |
| de | German |
| zh | Chinese |
| ja | Japanese |
| ko | Korean |
| pt | Portuguese |
| it | Italian |
| ru | Russian |

---

## Virtual Backgrounds

### Usage

```typescript
import { useVirtualBackground } from '@/hooks/useVirtualBackground';
import { VirtualBackgroundSelector } from '@/components/VirtualBackgroundSelector';

function VideoComponent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { isProcessing, error } = useVirtualBackground(
    videoRef.current,
    canvasRef.current,
    {
      enabled: true,
      type: 'blur',
      blurStrength: 10,
    }
  );

  return (
    <>
      <video ref={videoRef} />
      <canvas ref={canvasRef} />
      <VirtualBackgroundSelector
        onSelect={(bg) => setBackground(bg)}
      />
    </>
  );
}
```

### Background Types

| Type | Description | Options |
|------|-------------|---------|
| none | No effect | - |
| blur | Gaussian blur | blurStrength: 1-20 |
| image | Static image | imageUrl: string |
| video | Animated video | videoUrl: string |

### Preset Backgrounds

- Blur Light
- Blur Strong
- Office
- Home
- Nature
- Beach
- Space
- Custom Upload

---

## Speaker Detection

### Usage

```typescript
import { useSpeakerDetection } from '@/hooks/useSpeakerDetection';

function MeetingRoom() {
  const { speakers, activeSpeaker, registerSpeaker } = useSpeakerDetection(
    localAudioStream,
    { threshold: 0.01, interval: 100 }
  );

  // Register remote speakers
  useEffect(() => {
    remoteParticipants.forEach(p => {
      registerSpeaker(p.id, p.name);
    });
  }, [remoteParticipants]);

  return (
    <div>
      {activeSpeaker && (
        <div>Speaking: {activeSpeaker.name}</div>
      )}
    </div>
  );
}
```

### WebSocket Events

```typescript
// Receive speaker volume updates
socket.on('speaker-volume', ({ participantId, volume, isSpeaking }) => {
  updateSpeakerVolume(participantId, volume, isSpeaking);
});

// Emit local speaker detection
socket.emit('speaker-update', {
  roomId,
  isSpeaking: true,
  volume: 0.5,
});
```

---

## Meeting Summaries

### Generate Summary

```typescript
const response = await fetch('/api/v1/ai/summarize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    transcript: fullTranscript,
    type: 'full', // 'full' | 'brief' | 'executive'
  }),
});

const { summary, keyPoints, decisions } = await response.json();
```

### Summary Types

| Type | Description | Length |
|------|-------------|--------|
| full | Comprehensive summary | 500-1000 words |
| brief | Brief overview | 100-200 words |
| executive | Key decisions only | 50-100 words |

### Response Format

```json
{
  "type": "full",
  "summary": "Meeting summary text...",
  "keyPoints": [
    "Point 1",
    "Point 2",
    "Point 3"
  ],
  "decisions": [
    "Decision 1",
    "Decision 2"
  ],
  "generatedAt": "2024-01-01T12:00:00Z"
}
```

---

## Highlights Extraction

### Extract Highlights

```typescript
const response = await fetch('/api/v1/ai/highlights', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    transcript: fullTranscript,
    transcriptWithTimestamps: timestampedSegments,
  }),
});

const { highlights } = await response.json();
```

### Highlight Types

| Type | Description |
|------|-------------|
| important | Key statements |
| decision | Decisions made |
| action | Action items |
| question | Important questions |

### Response Format

```json
{
  "highlights": [
    {
      "timestamp": "00:05:30",
      "text": "We decided to launch next month",
      "type": "decision",
      "speakers": ["Alice", "Bob"]
    }
  ],
  "totalHighlights": 5,
  "generatedAt": "2024-01-01T12:00:00Z"
}
```

---

## Action Items

### Extract Action Items

```typescript
const response = await fetch('/api/v1/ai/action-items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    transcript: fullTranscript,
  }),
});

const { actionItems } = await response.json();
```

### Response Format

```json
{
  "actionItems": [
    {
      "id": 1,
      "description": "Follow up with design team",
      "assignee": "Alice",
      "status": "pending",
      "dueDate": null
    }
  ],
  "totalItems": 3,
  "pendingItems": 2,
  "generatedAt": "2024-01-01T12:00:00Z"
}
```

---

## AI Service Configuration

### Environment Variables

```env
# OpenAI API (for Whisper and summaries)
OPENAI_API_KEY=sk-...

# AI Service
AI_SERVICE_PORT=5000

# Local Whisper (optional)
WHISPER_MODEL=base
WHISPER_DEVICE=cpu
```

### Docker Setup

```yaml
services:
  ai-services:
    build: ./apps/ai-services
    ports:
      - "5000:5000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - WHISPER_MODEL=base
    volumes:
      - ./models:/app/models
```

---

## Performance Considerations

### Transcription

- **Latency**: ~500ms for real-time segments
- **Accuracy**: 95%+ for clear audio
- **Bandwidth**: ~64kbps audio stream

### Virtual Backgrounds

- **CPU**: Moderate (uses WebGL)
- **Memory**: ~100MB for segmentation model
- **FPS**: 30fps target

### Speaker Detection

- **Latency**: <100ms
- **Update Interval**: 100ms default
- **Threshold**: Adjustable (0.01 default)

---

## Best Practices

1. **Transcription**
   - Use good quality microphones
   - Minimize background noise
   - Enable noise suppression

2. **Virtual Backgrounds**
   - Use good lighting
   - Position camera at eye level
   - Avoid busy patterns

3. **Speaker Detection**
   - Calibrate threshold per environment
   - Combine with visual indicators
   - Update on participant changes

4. **Summaries**
   - Wait for meeting end
   - Review before sharing
   - Edit action items as needed

---

## Troubleshooting

### Transcription Not Working

1. Check microphone permissions
2. Verify audio stream is active
3. Check API key configuration
4. Review service logs

### Virtual Background Lag

1. Reduce video resolution
2. Lower blur strength
3. Use static images instead of video
4. Check GPU acceleration

### Speaker Detection Inaccurate

1. Adjust threshold
2. Check audio levels
3. Verify audio context is running
4. Test with different audio source

---

## Next Steps

1. ✅ **Transcription** - Complete
2. ✅ **Virtual Backgrounds** - Complete
3. ✅ **Speaker Detection** - Complete
4. ✅ **Summaries** - Complete
5. 📋 **Translation** - Future
6. 📋 **Sentiment Analysis** - Future
