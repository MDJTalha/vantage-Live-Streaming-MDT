# VANTAGE Security & Compliance Guide

## Overview

VANTAGE implements enterprise-grade security and compliance features:

- **End-to-End Encryption (E2EE)** - AES-256-GCM for media
- **GDPR Compliance** - Data export, deletion, consent management
- **Security Headers** - CSP, HSTS, X-Frame-Options
- **Audit Logging** - Complete audit trail
- **Rate Limiting** - DDoS protection

---

## End-to-End Encryption

### Key Exchange

```typescript
POST /api/v1/security/e2ee/keys
Authorization: Bearer <token>

{
  "participantCount": 2
}
```

Response:
```json
{
  "success": true,
  "data": {
    "keys": [
      {
        "participantId": "participant-abc123",
        "key": "a1b2c3d4..."
      }
    ]
  }
}
```

### Encrypt Data

```typescript
POST /api/v1/security/e2ee/encrypt

{
  "plaintext": "sensitive message",
  "key": "encryption-key"
}
```

### Decrypt Data

```typescript
POST /api/v1/security/e2ee/decrypt

{
  "ciphertext": "...",
  "key": "encryption-key",
  "iv": "...",
  "authTag": "..."
}
```

### Generate Room Access Code

```typescript
POST /api/v1/security/e2ee/room-key

{
  "length": 8
}
```

Response:
```json
{
  "success": true,
  "data": {
    "accessCode": "A7K9M2P4"
  }
}
```

---

## GDPR Compliance

### Data Export (Right to Access)

```typescript
POST /api/v1/gdpr/export
Authorization: Bearer <token>

{
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "requestId": "export-user-123-1234567890",
    "message": "Export request created. You will be notified when ready."
  }
}
```

### Get Export Data

```typescript
GET /api/v1/gdpr/export/:requestId
```

### Delete Account (Right to be Forgotten)

```typescript
DELETE /api/v1/gdpr/account
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "message": "Account deleted successfully"
  }
}
```

---

## Consent Management

### Record Consent

```typescript
POST /api/v1/gdpr/consent
Authorization: Bearer <token>

{
  "consentType": "recording",
  "granted": true
}
```

Consent types:
- `marketing` - Marketing communications
- `analytics` - Usage analytics
- `recording` - Meeting recording
- `transcription` - AI transcription
- `data_processing` - General data processing

### Get Consents

```typescript
GET /api/v1/gdpr/consent
```

### Withdraw Consent

```typescript
DELETE /api/v1/gdpr/consent/:consentType
```

### Get Audit Log

```typescript
GET /api/v1/gdpr/audit
```

---

## Security Headers

### Nginx Configuration

```nginx
# Security Headers
add_header Strict-Transport-Security "max-age=63072000" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss: https:; font-src 'self' data:; media-src 'self' blob:; object-src 'none';" always;
```

### Express Helmet

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"],
      fontSrc: ["'self'", "data:"],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

---

## Data Retention

### Default Retention Periods

| Data Type | Retention |
|-----------|-----------|
| Sessions | 30 days |
| Chat Messages | 1 year |
| Recordings | Based on plan |
| Analytics | 2 years |
| Export Requests | 30 days |
| Audit Logs | 7 years |

### Cleanup Job

```typescript
// Run daily
await GDPRRepository.cleanupOldData(365); // 365 days
```

---

## Encryption Standards

### Algorithm

| Purpose | Algorithm | Key Size |
|---------|-----------|----------|
| Data Encryption | AES-256-GCM | 256 bits |
| Key Exchange | ECDH (P-256) | 256 bits |
| Password Hashing | PBKDF2-SHA512 | 512 bits |
| Message Signing | HMAC-SHA256 | 256 bits |

### Key Management

1. Keys generated client-side when possible
2. Keys never stored in plaintext
3. Keys rotated every 90 days
4. Keys deleted on account deletion

---

## Audit Logging

### Logged Events

- User authentication (login/logout)
- Room creation/deletion
- Recording start/stop
- Data export requests
- Consent changes
- Account deletion
- Permission changes

### Log Format

```json
{
  "timestamp": "2024-01-15T10:00:00Z",
  "userId": "user-123",
  "action": "room.created",
  "resource": "room-456",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "metadata": {
    "roomName": "Team Meeting"
  }
}
```

---

## Compliance Certifications

### GDPR

✅ Data Processing Agreement available
✅ Data export functionality
✅ Right to deletion
✅ Consent management
✅ Data minimization
✅ Privacy by design

### SOC 2 (In Progress)

🔄 Access controls implemented
🔄 Audit logging enabled
🔄 Encryption at rest and in transit
🔄 Incident response plan

### HIPAA (Optional)

🔄 BAA available for enterprise
🔄 PHI encryption
🔄 Access logging
🔄 Audit controls

---

## Security Best Practices

### For Users

1. Enable 2FA when available
2. Use strong, unique passwords
3. Don't share meeting links publicly
4. Use waiting rooms for public meetings
5. Lock meetings after all participants join
6. Don't record without consent

### For Administrators

1. Review audit logs regularly
2. Set appropriate data retention
3. Enable security headers
4. Use HTTPS everywhere
5. Keep dependencies updated
6. Monitor for suspicious activity

---

## Incident Response

### Data Breach Procedure

1. **Detect** - Identify breach source
2. **Contain** - Isolate affected systems
3. **Assess** - Determine data exposure
4. **Notify** - Inform affected users within 72 hours
5. **Remediate** - Fix vulnerability
6. **Document** - Complete incident report

### Contact

Security team: security@vantage.live

---

## API Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth | 5 | 1 minute |
| General API | 100 | 1 minute |
| Export | 5 | 1 hour |
| Delete | 2 | 24 hours |

---

## Troubleshooting

### E2EE Not Working

1. Check browser supports insertable streams
2. Verify keys exchanged correctly
3. Check for CORS issues
4. Review browser console errors

### Export Failed

1. Check user has data
2. Verify database connection
3. Check storage space
4. Review export logs

### Consent Not Recording

1. Check database constraints
2. Verify consent type is valid
3. Check user is authenticated
4. Review audit logs

---

## Next Steps

1. ✅ **E2EE** - Complete
2. ✅ **GDPR** - Complete
3. ✅ **Security Headers** - Complete
4. ✅ **Audit Logging** - Complete
5. 📋 **2FA** - Future
6. 📋 **SSO** - Enterprise feature
