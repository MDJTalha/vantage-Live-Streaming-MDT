# VANTAGE Deployment Checklist
## Production Deployment Guide

**Version:** 1.0  
**Date:** March 29, 2026  
**Environment:** Production

---

## Pre-Deployment Checklist

### Infrastructure

- [ ] **Domain Configuration**
  - [ ] DNS records configured (A, CNAME, MX)
  - [ ] SSL certificates installed (Let's Encrypt or commercial)
  - [ ] CDN configured (Cloudflare)
  - [ ] GeoDNS routing setup (if multi-region)

- [ ] **Database**
  - [ ] PostgreSQL cluster provisioned
  - [ ] Read replicas configured (if applicable)
  - [ ] Connection pooling (PgBouncer)
  - [ ] Automated backups enabled
  - [ ] Point-in-time recovery tested
  - [ ] Database migrations tested on staging

- [ ] **Redis**
  - [ ] Redis cluster provisioned
  - [ ] Password authentication enabled
  - [ ] Persistence configured (RDB/AOF)
  - [ ] Memory limits set

- [ ] **Application Servers**
  - [ ] Auto-scaling configured
  - [ ] Load balancer configured
  - [ ] Health checks passing
  - [ ] Log aggregation enabled

- [ ] **Monitoring**
  - [ ] Prometheus running
  - [ ] Grafana dashboards imported
  - [ ] Alertmanager configured
  - [ ] Alert channels tested (email, PagerDuty, Slack)

- [ ] **Security**
  - [ ] Firewall rules configured
  - [ ] WAF rules enabled
  - [ ] DDoS protection enabled
  - [ ] Rate limiting configured
  - [ ] Penetration testing completed

---

### Environment Variables

Create `.env.production`:

```bash
# ============================================
# Environment
# ============================================
NODE_ENV=production
APP_ENV=production

# ============================================
# Database
# ============================================
DATABASE_URL=postgresql://vantage:SECURE_PASSWORD@db.vantage.live:5432/vantage?schema=public

# ============================================
# Redis
# ============================================
REDIS_URL=redis://:SECURE_PASSWORD@redis.vantage.live:6379

# ============================================
# Authentication
# ============================================
JWT_SECRET=GENERATE_32_CHAR_RANDOM_STRING
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
ENCRYPTION_KEY=GENERATE_64_CHAR_HEX_STRING

# ============================================
# SAML SSO
# ============================================
SAML_ENTRY_POINT=https://your-org.okta.com/app/saml/sso
SAML_ISSUER=vantage-production
SAML_CERT="MIIDpTCCAo2gAwIBAgIGAX..."
SAML_CALLBACK_URL=https://api.vantage.live/api/v1/auth/oauth/saml/callback

# ============================================
# WebRTC / Media
# ============================================
TURN_SERVER_URL=turn:turn.vantage.live:3478
TURN_SERVER_USERNAME=vantage
TURN_SERVER_PASSWORD=SECURE_TURN_PASSWORD
STUN_SERVER=stun:stun.l.google.com:19302

# ============================================
# Media Server
# ============================================
MEDIA_SERVER_HOST=0.0.0.0
MEDIA_SERVER_PORT=443
MEDIA_SERVER_MIN_PORT=10000
MEDIA_SERVER_MAX_PORT=60000
SSL_KEY_PATH=/etc/certs/vantage.live.key
SSL_CERT_PATH=/etc/certs/vantage.live.crt

# ============================================
# Storage (S3)
# ============================================
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=SECRET_KEY
AWS_REGION=us-east-1
S3_BUCKET=vantage-recordings

# ============================================
# AI Services
# ============================================
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXX
WHISPER_MODEL=large-v3

# ============================================
# Email
# ============================================
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SENDGRID_API_KEY

# ============================================
# API Configuration
# ============================================
API_HOST=0.0.0.0
API_PORT=4000
FRONTEND_URL=https://app.vantage.live

# ============================================
# Security
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# ============================================
# Monitoring
# ============================================
SENTRY_DSN=https://XXXXXXXX@sentry.io/XXXXXXX
SENTRY_ENVIRONMENT=production
PROMETHEUS_ENABLED=true
GRAFANA_URL=https://grafana.vantage.live
```

---

### Application Configuration

- [ ] **API Service**
  - [ ] `.env.production` configured
  - [ ] Database migrations applied
  - [ ] Prisma Client generated
  - [ ] Rate limiting tested
  - [ ] Authentication tested

- [ ] **Media Server**
  - [ ] SSL certificates installed
  - [ ] TURN server configured
  - [ ] Port range opened in firewall
  - [ ] Load testing completed

- [ ] **Frontend**
  - [ ] Environment variables configured
  - [ ] Build completed without errors
  - [ ] Static assets uploaded to CDN
  - [ ] Error tracking configured (Sentry)

- [ ] **AI Services**
  - [ ] GPU drivers installed
  - [ ] Models downloaded
  - [ ] Inference tested
  - [ ] Rate limits configured

---

## Deployment Steps

### Step 1: Database Migration

```bash
cd apps/api

# Backup current database
pg_dump -h db.vantage.live -U vantage vantage > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Verify migration
npx prisma studio
```

**Checklist:**
- [ ] Database backup completed
- [ ] Migrations applied successfully
- [ ] Prisma Client generated
- [ ] No errors in migration log

---

### Step 2: Deploy API Service

```bash
# Build application
npm run build

# Start with PM2 (process manager)
pm2 start ecosystem.config.js --env production

# Check status
pm2 status

# View logs
pm2 logs api --lines 100
```

**Checklist:**
- [ ] Build completed without errors
- [ ] All processes running
- [ ] Health endpoint responding
- [ ] No errors in logs

---

### Step 3: Deploy Media Server

```bash
# Install system dependencies
sudo apt-get install -y libsctp-dev lksctp-tools

# Build media server
cd apps/media-server
npm run build

# Start with PM2
pm2 start media-server

# Verify WebRTC connectivity
# Open browser to https://app.vantage.live and test video
```

**Checklist:**
- [ ] System dependencies installed
- [ ] Media server running
- [ ] WebRTC connectivity working
- [ ] TURN server reachable

---

### Step 4: Deploy Frontend

```bash
cd apps/web

# Build
npm run build

# Deploy to CDN / hosting
# Option 1: Vercel
vercel --prod

# Option 2: S3 + CloudFront
aws s3 sync out/ s3://vantage-app --delete
aws cloudfront create-invalidation --distribution-id XXXXXXXX --paths "/*"
```

**Checklist:**
- [ ] Build successful
- [ ] Deployed to production URL
- [ ] CDN cache invalidated
- [ ] No console errors in browser

---

### Step 5: Deploy AI Services

```bash
cd apps/ai-services

# Build Docker image
docker build -t vantage-ai:latest .

# Deploy to GPU cluster
docker-compose -f docker-compose.ai.yml up -d

# Check GPU utilization
nvidia-smi

# Test transcription endpoint
curl -X POST http://localhost:8001/transcribe \
  -F "audio=@test.wav"
```

**Checklist:**
- [ ] Docker images built
- [ ] Containers running
- [ ] GPU utilization <80%
- [ ] AI endpoints responding

---

### Step 6: Configure Monitoring

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Import Grafana dashboards
curl -X POST 'http://localhost:3001/api/dashboards/import' \
  -H "Content-Type: application/json" \
  -d @monitoring/grafana/dashboards/vantage-platform.json

# Test alerts
# Trigger a test alert and verify notification received
```

**Checklist:**
- [ ] All monitoring services running
- [ ] Dashboards imported
- [ ] Alerts configured
- [ ] Test notification received

---

### Step 7: Smoke Tests

```bash
# Health check
curl https://api.vantage.live/health

# Expected: {"status":"ok",...}

# Authentication test
curl -X POST https://api.vantage.live/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@vantage.live","password":"TestPassword123!"}'

# Expected: {"success":true,"data":{"user":...,"tokens":...}}

# Room creation test
curl -X POST https://api.vantage.live/api/v1/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Test Room"}'

# Expected: {"success":true,"data":{...}}

# WebSocket test
# Open browser console and verify WebSocket connection established
```

**Checklist:**
- [ ] Health endpoint responding
- [ ] Login working
- [ ] Room creation working
- [ ] WebSocket connecting

---

### Step 8: Performance Verification

```bash
# Run load test
k6 run tests/load-test.js

# Check response times
# P95 < 500ms for all endpoints

# Check error rate
# Should be < 1%

# Check resource utilization
# CPU < 70%
# Memory < 80%
# GPU < 80% (for AI services)
```

**Checklist:**
- [ ] P95 latency < 500ms
- [ ] Error rate < 1%
- [ ] CPU utilization < 70%
- [ ] Memory utilization < 80%

---

## Post-Deployment

### Immediate (First Hour)

- [ ] Monitor error rates (Sentry, logs)
- [ ] Monitor performance metrics
- [ ] Verify all health checks passing
- [ ] Test critical user flows
- [ ] Verify alerts working

### First 24 Hours

- [ ] Review error logs
- [ ] Review performance metrics
- [ ] Check database query performance
- [ ] Verify backup jobs running
- [ ] Monitor user feedback

### First Week

- [ ] Daily metrics review
- [ ] Weekly performance report
- [ ] Address any issues found
- [ ] Update documentation
- [ ] Plan next deployment

---

## Rollback Plan

### If Deployment Fails

**Step 1: Stop New Deployment**
```bash
pm2 stop api
pm2 stop media-server
```

**Step 2: Restore Previous Version**
```bash
# Checkout previous version
git checkout <previous-commit>

# Rebuild
npm run build

# Restart
pm2 restart all
```

**Step 3: Rollback Database (if needed)**
```bash
# Restore from backup
psql -h db.vantage.live -U vantage vantage < backup_YYYYMMDD_HHMMSS.sql

# Or rollback migration
npx prisma migrate resolve --rolled-back <migration-name>
```

**Step 4: Verify Rollback**
- [ ] All services running
- [ ] Health checks passing
- [ ] No errors in logs
- [ ] User flows working

---

## Success Criteria

Deployment is considered successful when:

- [ ] All health checks passing for 1 hour
- [ ] Error rate < 1%
- [ ] P95 latency < 500ms
- [ ] No critical errors in logs
- [ ] All smoke tests passing
- [ ] Monitoring alerts configured
- [ ] Backups running successfully
- [ ] User flows verified

---

## Contact Information

**On-Call Engineer:** [Name] - [Phone]  
**DevOps Lead:** [Name] - [Phone]  
**Security Lead:** [Name] - [Phone]  
**CTO:** [Name] - [Phone]

**Escalation Path:**
1. On-Call Engineer
2. DevOps Lead
3. CTO

---

*This checklist should be reviewed and updated before each production deployment.*
