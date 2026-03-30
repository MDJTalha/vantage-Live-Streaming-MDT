# VANTAGE Advanced Features Guide

## Overview

VANTAGE includes advanced features for professional use:

- **Recording** - Cloud storage with S3
- **Live Streaming** - Multi-platform RTMP streaming
- **Analytics** - Dashboard with insights
- **Monetization** - Subscription plans

---

## Recording

### Start Recording

```typescript
POST /api/v1/recordings/start
Authorization: Bearer <token>

{
  "roomId": "room-123",
  "title": "Team Meeting",
  "outputFormat": "mp4"
}
```

### Stop Recording

```typescript
POST /api/v1/recordings/stop

{
  "recordingId": "room-123-1234567890"
}
```

### List Recordings

```typescript
GET /api/v1/recordings/:roomId
```

### Get Playback URL

```typescript
GET /api/v1/recordings/:roomId/:key/url
```

Response:
```json
{
  "success": true,
  "data": {
    "url": "https://s3.amazonaws.com/...?X-Amz-..."
  }
}
```

### Delete Recording

```typescript
DELETE /api/v1/recordings/:key
```

---

## Live Streaming

### Start Streaming

```typescript
POST /api/v1/stream/start

{
  "roomId": "room-123",
  "platform": "youtube",
  "streamKey": "xxxx-xxxx-xxxx",
  "rtmpUrl": "rtmp://a.rtmp.youtube.com/live2"
}
```

Supported platforms:
- YouTube
- Twitch
- Facebook Live
- Custom RTMP

### Stop Streaming

```typescript
POST /api/v1/stream/stop

{
  "streamId": "room-123-youtube-1234567890"
}
```

### Get Stream Status

```typescript
GET /api/v1/stream/status
```

Response:
```json
{
  "success": true,
  "data": {
    "recordings": ["recording-1", "recording-2"],
    "streams": ["stream-1"]
  }
}
```

---

## Analytics

### Room Analytics

```typescript
GET /api/v1/analytics/room/:roomId
```

Response:
```json
{
  "success": true,
  "data": {
    "roomId": "room-123",
    "totalParticipants": 50,
    "peakConcurrent": 35,
    "totalDuration": 3600,
    "chatMessages": 150,
    "engagement": {
      "averageWatchTime": 2700,
      "pollParticipation": 0.8,
      "questionCount": 12,
      "reactionCount": 45
    }
  }
}
```

### Dashboard Metrics

```typescript
GET /api/v1/analytics/dashboard?days=30
```

Response:
```json
{
  "success": true,
  "data": {
    "totalMeetings": 25,
    "totalParticipants": 500,
    "totalDuration": 72000,
    "storageUsed": 1073741824,
    "meetingsByDay": [
      { "date": "2024-01-01", "count": 3 },
      { "date": "2024-01-02", "count": 5 }
    ],
    "topRooms": [
      { "id": "1", "name": "All Hands", "participants": 100 }
    ]
  }
}
```

### User Activity

```typescript
GET /api/v1/analytics/activity
```

Response:
```json
{
  "success": true,
  "data": {
    "meetingsHosted": 15,
    "meetingsJoined": 30,
    "totalDuration": 43200,
    "lastActive": "2024-01-15T10:00:00Z"
  }
}
```

---

## Monetization

### Pricing Plans

| Plan | Price | Participants | Features |
|------|-------|--------------|----------|
| **Free** | $0 | 100 | 45 min limit, HD video |
| **Pro** | $12/mo | 500 | 30 hr limit, Recording, Transcripts |
| **Business** | $24/mo | 1000 | No limit, 4K, AI features, Analytics |
| **Enterprise** | $49/mo | Unlimited | Dedicated infra, SLA, On-premise |

### Subscription Flow

1. User selects plan
2. Redirect to Stripe checkout
3. Webhook confirms payment
4. Update user subscription in database
5. Grant features

### Stripe Integration

```typescript
// Create checkout session
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [{
    price: plan.stripePriceId,
    quantity: 1,
  }],
  success_url: `${FRONTEND_URL}/billing?success=true`,
  cancel_url: `${FRONTEND_URL}/billing?canceled=true`,
});
```

### Webhook Handler

```typescript
// Handle subscription events
stripe.webhooks.constructEvent(
  payload,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);

// Events to handle:
// - checkout.session.completed
// - customer.subscription.updated
// - customer.subscription.deleted
// - invoice.payment_failed
```

---

## Storage Management

### S3 Configuration

```env
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET=vantage-recordings
```

### Storage Quotas

| Plan | Storage |
|------|---------|
| Free | 1 GB |
| Pro | 50 GB |
| Business | 500 GB |
| Enterprise | Unlimited |

### Cleanup Policy

- Free plan: Recordings deleted after 7 days
- Pro plan: Recordings kept for 30 days
- Business+: Recordings kept indefinitely

---

## Multi-Stream Configuration

### YouTube

```
RTMP URL: rtmp://a.rtmp.youtube.com/live2
Get stream key from: YouTube Studio → Live → Stream
```

### Twitch

```
RTMP URL: rtmp://live.twitch.tv/app
Get stream key from: Creator Dashboard → Settings → Stream
```

### Facebook

```
RTMP URL: rtmps://live-api-s.facebook.com:443/rtmp/
Get stream key from: Creator Studio → Live → Get Stream Key
```

### Custom RTMP

```
Enter custom RTMP URL and stream key for other platforms
```

---

## Recording Formats

| Format | Use Case | Size |
|--------|----------|------|
| MP4 | General use | Medium |
| WebM | Web playback | Small |
| MKV | Archival | Large |

---

## Best Practices

### Recording

1. Inform participants about recording
2. Get consent where required
3. Store recordings securely
4. Set retention policies
5. Compress for long-term storage

### Streaming

1. Test stream before going live
2. Have backup internet connection
3. Monitor stream health
4. Use wired connection
5. Close unnecessary applications

### Analytics

1. Review metrics weekly
2. Track engagement trends
3. Identify popular meeting times
4. Monitor storage usage
5. Set up alerts for anomalies

---

## Troubleshooting

### Recording Failed

1. Check S3 credentials
2. Verify bucket permissions
3. Check disk space
4. Review ffmpeg logs

### Stream Dropped

1. Check internet connection
2. Verify stream key
3. Reduce bitrate
4. Check platform status

### Analytics Not Updating

1. Check database connection
2. Verify cron jobs running
3. Check analytics service logs
4. Clear cache

---

## API Rate Limits

| Endpoint | Limit |
|----------|-------|
| Recording | 100/hour |
| Streaming | 10 concurrent |
| Analytics | 60/minute |

---

## Next Steps

1. ✅ **Recording** - Complete
2. ✅ **Live Streaming** - Complete
3. ✅ **Analytics** - Complete
4. ✅ **Monetization** - Complete
5. 📋 **Team Management** - Future
6. 📋 **API Marketplace** - Future
