# VANTAGE 100% Production Deployment Guide

**Status:** 🟢 **COMPLETE & READY FOR LAUNCH** | Version 1.0 | March 28, 2026

---

## TABLE OF CONTENTS

1. [Pre-Deployment Requirements](#pre-deployment-requirements)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Stripe Integration](#stripe-integration)
6. [Email & Notifications](#email--notifications)
7. [SSL/TLS Certificates](#ssltls-certificates)
8. [Deployment Process](#deployment-process)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Monitoring & Alerting](#monitoring--alerting)
11. [Backup & Recovery](#backup--recovery)
12. [Troubleshooting](#troubleshooting)

---

## PRE-DEPLOYMENT REQUIREMENTS

### System Requirements

- **Kubernetes Cluster:** v1.24+
- **Docker:** v20.10+
- **PostgreSQL:** v15+
- **Redis:** v7+
- **Node.js:** v20.12.0+
- **Terraform:** v1.0+ (for IaC)

### Access & Credentials

```bash
# Required credentials
- AWS Access Keys (for ECR, S3, RDS)
- Stripe API Keys (secret and publishable)
- SendGrid API Key
- Cloudflare API Token (for DNS)
- GitHub Personal Access Token (for deployments)
- Docker Registry credentials
```

### DNS Configuration

```
Primary Domain: vantage.live
Subdomains:
  - api.vantage.live          (API backend)
  - app.vantage.live          (Web application)
  - admin.vantage.live        (Admin panel)
  - media.vantage.live        (Media server)
  - cdn.vantage.live          (CDN for static assets)
  - docs.vantage.live         (Documentation)
  - status.vantage.live       (Status page)
```

---

## INFRASTRUCTURE SETUP

### Option 1: AWS Infrastructure (Recommended)

#### Step 1: Create AWS Resources

```bash
# Initialize Terraform
cd infra/terraform
terraform init

# Plan deployment
terraform plan -var-file=prod.tfvars

# Apply configuration
terraform apply -var-file=prod.tfvars
```

**Resources Created:**
- EKS Cluster (3+ nodes)
- RDS PostgreSQL (Multi-AZ)
- ElastiCache Redis
- ALB (Application Load Balancer)
- S3 Buckets (recordings, backups, static assets)
- CloudFront Distribution
- CloudWatch Log Groups
- SNS Topics for alerts

#### Step 2: Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --region us-east-1 \
  --name vantage-prod

# Verify access
kubectl cluster-info
kubectl get nodes
```

### Option 2: GCP Infrastructure

```bash
# Create GKE cluster
gcloud container clusters create vantage-prod \
  --region us-central1 \
  --num-nodes 3 \
  --machine-type n1-standard-4 \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 10

# Get credentials
gcloud container clusters get-credentials vantage-prod --region us-central1
```

### Option 3: Azure Infrastructure

```bash
# Create AKS cluster
az aks create \
  --resource-group vantage \
  --name vantage-prod \
  --node-count 3 \
  --vm-set-type VirtualMachineScaleSets \
  --load-balancer-sku standard \
  --enable-managed-identity

# Get credentials
az aks get-credentials --resource-group vantage --name vantage-prod
```

---

## DATABASE CONFIGURATION

### PostgreSQL Setup

```bash
# Create database user and database
psql -h $DB_HOST -U postgres -c "
  CREATE ROLE vantage WITH LOGIN PASSWORD '${DB_PASSWORD}';
  CREATE DATABASE vantage OWNER vantage;
  GRANT ALL PRIVILEGES ON DATABASE vantage TO vantage;
"

# Enable required extensions
psql -h $DB_HOST -U postgres -d vantage -c "
  CREATE EXTENSION IF NOT EXISTS uuid-ossp;
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
"
```

### Database Backups

```bash
# Create backup S3 bucket
aws s3 mb s3://vantage-backups-prod

# Enable automated backups in RDS
aws rds modify-db-instance \
  --db-instance-identifier vantage \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00"
```

### Redis Configuration

```bash
# Create Redis instance
aws elasticache create-cache-cluster \
  --cache-cluster-id vantage-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --auth-token ${REDIS_AUTH_TOKEN} \
  --transit-encryption-enabled

# Test connection
redis-cli -h <endpoint> -p 6379 --tls ping
```

---

## ENVIRONMENT VARIABLES

### Required Variables

```bash
# API Configuration
NODE_ENV=production
API_PORT=4000
API_URL=https://api.vantage.live
APP_URL=https://app.vantage.live
ADMIN_URL=https://admin.vantage.live

# Database
DATABASE_URL=postgresql://vantage:${password}@${host}:5432/vantage?schema=public
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# Redis
REDIS_URL=rediss://:${auth_token}@${endpoint}:6379
REDIS_TLS_REJECTUNAUTHORIZED=true

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=${stripe_secret_key}
STRIPE_PUBLISHABLE_KEY=${stripe_publishable_key}
STRIPE_WEBHOOK_SECRET=${stripe_webhook_secret}
STRIPE_PRICE_STARTER=price_1234567890
STRIPE_PRICE_PROFESSIONAL=price_0987654321
STRIPE_PRICE_ENTERPRISE=custom

# Email
SENDGRID_API_KEY=${sendgrid_api_key}
SENDGRID_FROM_EMAIL=noreply@vantage.live
SENDGRID_FROM_NAME="VANTAGE"

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=${aws_access_key}
AWS_SECRET_ACCESS_KEY=${aws_secret_key}
AWS_S3_BUCKET_RECORDINGS=vantage-recordings-prod
AWS_S3_BUCKET_BACKUPS=vantage-backups-prod

# Cloudflare
CLOUDFLARE_API_TOKEN=${cloudflare_token}
CLOUDFLARE_ZONE_ID=${zone_id}

# Security
CORS_ORIGIN=https://app.vantage.live
CSRF_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Sentry
SENTRY_DSN=${sentry_dsn}
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Features
ENABLE_OAUTH=true
ENABLE_SSO=true
ENABLE_ANALYTICS=true
ENABLE_TRANSCRIPTION=true
ENABLE_WHITE_LABEL=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Create Kubernetes Secrets

```bash
# Create secret from .env file
kubectl create secret generic vantage-env \
  --from-env-file=.env.production \
  -n vantage

# Or create individually
kubectl create secret generic vantage-stripe \
  --from-literal=secret-key=$STRIPE_SECRET_KEY \
  --from-literal=webhook-secret=$STRIPE_WEBHOOK_SECRET \
  -n vantage

kubectl create secret generic vantage-postgres \
  --from-literal=url=$DATABASE_URL \
  -n vantage

kubectl create secret generic vantage-redis \
  --from-literal=url=$REDIS_URL \
  -n vantage
```

---

## STRIPE INTEGRATION

### Setup Steps

#### 1. Create Stripe Account

```bash
# Go to https://dashboard.stripe.com/register
# Create production account if not exists
```

#### 2. Create Products & Prices

```bash
# Create STARTER tier
curl https://api.stripe.com/v1/products \
  -u $STRIPE_SECRET_KEY: \
  -d name="VANTAGE STARTER" \
  -d type=service

# Create price for STARTER ($99/month)
curl https://api.stripe.com/v1/prices \
  -u $STRIPE_SECRET_KEY: \
  -d product=${STARTER_PRODUCT_ID} \
  -d unit_amount=9900 \
  -d currency=usd \
  -d recurring[interval]=month

# Repeat for PROFESSIONAL ($399/month) and ENTERPRISE (custom)
```

#### 3. Configure Webhooks

```bash
# Create webhook endpoint
curl https://api.stripe.com/v1/webhook_endpoints \
  -u $STRIPE_SECRET_KEY: \
  -d url=https://api.vantage.live/webhooks/stripe \
  -d enabled_events[0]=customer.subscription.created \
  -d enabled_events[1]=customer.subscription.updated \
  -d enabled_events[2]=customer.subscription.deleted \
  -d enabled_events[3]=invoice.payment_succeeded \
  -d enabled_events[4]=invoice.payment_failed
```

#### 4. Update Environment Variables

```bash
STRIPE_PRICE_STARTER=${starter_price_id}
STRIPE_PRICE_PROFESSIONAL=${professional_price_id}
STRIPE_PRICE_ENTERPRISE=custom_quote
STRIPE_WEBHOOK_SECRET=${webhook_secret}
```

---

## EMAIL & NOTIFICATIONS

### SendGrid Configuration

```bash
# Verify domain
# 1. Go to SendGrid Dashboard → Settings → Sender Authentication
# 2. Add domain vantage.live
# 3. Add DNS records to your DNS provider
# 4. Verify domain

# Create API key
# 1. Go to Settings → API Keys
# 2. Create key with Email Send permission
```

### Email Templates Setup

```bash
# Create SendGrid email templates

# Welcome email template
curl https://api.sendgrid.com/v3/templates \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "welcome",
    "generation": "dynamic"
  }'

# Repeat for other templates:
# - onboarding-welcome
# - team-invitation
# - upgrade-confirmation
# - invoice
# - subscription-expiring
# - setup-complete
```

### Test Email Delivery

```bash
# Test endpoint
curl -X POST http://localhost:4000/api/v1/admin/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "template": "welcome"
  }'
```

---

## SSL/TLS CERTIFICATES

### Option 1: Let's Encrypt (Recommended)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.11.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@vantage.live
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Certificates will be auto-generated for ingress
```

### Option 2: AWS Certificate Manager

```bash
# Request certificate
aws acm request-certificate \
  --domain-name vantage.live \
  --subject-alternative-names \
    "*.vantage.live" \
    "api.vantage.live" \
    "app.vantage.live" \
  --validation-method DNS \
  --certificate-transparency-logging-preference ENABLED

# Validate via DNS
# Add CNAME records provided by ACM
```

---

## DEPLOYMENT PROCESS

### Automated Deployment

```bash
# Make deployment script executable
chmod +x scripts/deploy-production.sh

# Run production deployment
./scripts/deploy-production.sh \
  --environment production \
  --version 1.0.0 \
  --registry vantage \
  --namespace vantage
```

### Manual Deployment Steps

```bash
# 1. Build Docker images
docker build -t vantage/api:prod-1.0 ./apps/api
docker build -t vantage/web:prod-1.0 ./apps/web
docker build -t vantage/media-server:prod-1.0 ./apps/media-server
docker build -t vantage/ai-services:prod-1.0 ./apps/ai-services

# 2. Push to registry
docker push vantage/api:prod-1.0
docker push vantage/web:prod-1.0
docker push vantage/media-server:prod-1.0
docker push vantage/ai-services:prod-1.0

# 3. Create namespace
kubectl create namespace vantage

# 4. Create secrets
kubectl create secret generic vantage-env \
  --from-env-file=.env.production \
  -n vantage

# 5. Apply configurations
kubectl apply -f infra/k8s/configmaps.yaml -n vantage
kubectl apply -f infra/k8s/rbac.yaml -n vantage
kubectl apply -f infra/k8s/network-policies.yaml -n vantage

# 6. Run migrations
kubectl run -it --image=vantage/api:prod-1.0 \
  --rm npm run migrate:deploy \
  -n vantage

# 7. Deploy services
kubectl apply -f infra/k8s/api-deployment.yaml -n vantage
kubectl apply -f infra/k8s/web-deployment.yaml -n vantage
kubectl apply -f infra/k8s/media-server-deployment.yaml -n vantage
kubectl apply -f infra/k8s/ai-services-deployment.yaml -n vantage

# 8. Configure ingress
kubectl apply -f infra/k8s/ingress.yaml -n vantage

# 9. Wait for rollout
kubectl rollout status deployment/api -n vantage
kubectl rollout status deployment/web -n vantage

# 10. Verify health
curl https://api.vantage.live/health
```

---

## POST-DEPLOYMENT VERIFICATION

### Health Checks

```bash
# API Health
curl https://api.vantage.live/health

# Web Application
curl -I https://app.vantage.live

# Database Connectivity
kubectl exec -n vantage deployment/api -- npm run db:check

# Redis Connectivity
kubectl exec -n vantage deployment/api -- npm run redis:check

# Stripe Connectivity
curl -X GET https://api.stripe.com/v1/charges \
  -u $STRIPE_SECRET_KEY:
```

### Smoke Tests

```bash
# Run smoke tests against production
npm run test:smoke \
  --env=production \
  --baseUrl=https://api.vantage.live
```

### Load Testing

```bash
# Generate baseline metrics
artillery run load-test-config.yml \
  --target https://api.vantage.live \
  --plugins graphite

# Expected results:
# - API p95 response time: < 200ms
# - 99th percentile: < 500ms
# - Error rate: < 0.1%
# - Throughput: > 1000 req/s
```

---

## MONITORING & ALERTING

### Prometheus Setup

```bash
# Deploy Prometheus
kubectl apply -f infra/k8s/monitoring/prometheus.yaml -n vantage

# Access Prometheus
kubectl port-forward -n vantage svc/prometheus 9090:9090
# Visit: http://localhost:9090
```

### Grafana Dashboards

```bash
# Deploy Grafana
kubectl apply -f infra/k8s/monitoring/grafana.yaml -n vantage

# Access Grafana
kubectl port-forward -n vantage svc/grafana 3000:3000
# Visit: http://localhost:3000

# Default credentials:
# Username: admin
# Password: (stored in secret)

# Import dashboards:
# - API Performance (ID: 3662)
# - Kubernetes Cluster (ID: 7249)
# - PostgreSQL (ID: 9628)
# - Redis (ID: 11835)
```

### Sentry Error Tracking

```bash
# Initialize Sentry project
curl https://install.sentry.io/releases/$VERSION/install.sh | bash

# Set environment variable
SENTRY_DSN=https://key@sentry.io/project-id

# Test error reporting
curl -X POST https://sentry.io/api/0/projects/org-slug/project-slug/events/ \
  -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test error from deploymentdocs",
    "environment": "production",
    "level": "error"
  }'
```

### Alert Rules

```yaml
# AlertManager configuration
groups:
  - name: vantage
    rules:
      - alert: APIHighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        annotations:
          summary: "High error rate on API"

      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
        annotations:
          summary: "Pod is crash looping"

      - alert: DatabaseConnectionErrors
        expr: postgres_connection_errors_total > 10
        annotations:
          summary: "Database connection errors"
```

---

## BACKUP & RECOVERY

### Database Backups

```bash
# Enable automated backups (already configured if using RDS)

# Manual backup
pg_dump -h $DB_HOST -U vantage vantage > vantage-backup-$(date +%Y%m%d).sql

# Backup to S3
pg_dump -h $DB_HOST -U vantage vantage | \
  aws s3 cp - s3://vantage-backups-prod/vantage-$(date +%Y%m%d_%H%M%S).sql.gz

# Test restoration
pg_restore -h $DB_TEST_HOST -U vantage -d vantage_test < vantage-backup.sql
```

### Recording Backups

```bash
# Configure S3 lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket vantage-recordings-prod \
  --lifecycle-configuration '{
    "Rules": [{
      "Id": "archive-old-recordings",
      "Status": "Enabled",
      "Transitions": [{
        "Days": 30,
        "StorageClass": "GLACIER"
      }],
      "Expiration": {
        "Days": 365
      }
    }]
  }'
```

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 1 hour
**RPO (Recovery Point Objective):** 15 minutes

```bash
# 1. Restore database from latest backup
# 2. Restore recordings from S3
# 3. Redeploy services to new cluster
# 4. Verify data integrity

# Test DR annually
./scripts/test-disaster-recovery.sh \
  --backup-date 2026-03-28 \
  --target-environment staging
```

---

## TROUBLESHOOTING

### Common Issues

#### Issue: High API latency

```bash
# Check database connection pool
kubectl exec -n vantage deployment/api -- \
  npm run db:pool-stats

# Check Redis connectivity
kubectl exec -n vantage deployment/api -- \
  npm run redis:check

# Check pod resources
kubectl top pods -n vantage

# Solution: Scale pod replicas
kubectl scale deployment api --replicas=5 -n vantage
```

#### Issue: Failed email delivery

```bash
# Check SendGrid API key
curl -X GET https://api.sendgrid.com/v3/mail/settings/dkim \
  -H "Authorization: Bearer $SENDGRID_API_KEY"

# Test sending email
kubectl exec -n vantage deployment/api -- \
  npm run test:email

# Check email logs
kubectl logs -n vantage deployment/api | grep -i email
```

#### Issue: Stripe webhook failures

```bash
# Check webhook endpoint
curl -X GET https://api.stripe.com/v1/webhook_endpoints \
  -u $STRIPE_SECRET_KEY:

# Resend failed events
stripe events resend evt_1234567890

# Check logs
kubectl logs -n vantage deployment/api | grep -i webhook
```

### Debugging Commands

```bash
# View pod logs
kubectl logs -n vantage deployment/api --tail=100

# Stream logs
kubectl logs -n vantage deployment/api -f

# Describe pod for events
kubectl describe pod -n vantage $(kubectl get pods -n vantage -l app=api -o jsonpath='{.items[0].metadata.name}')

# Execute commands in pod
kubectl exec -it -n vantage $(kubectl get pods -n vantage -l app=api -o jsonpath='{.items[0].metadata.name}') -- bash

# Check resource usage
kubectl top nodes
kubectl top pods -n vantage

# Verify persistent volumes
kubectl get pv

# Check ingress status
kubectl describe ingress -n vantage
```

---

## SECURITY CHECKLIST

- [ ] SSL/TLS certificates configured
- [ ] Database encryption at rest enabled
- [ ] Encryption in transit enabled (TLS 1.3)
- [ ] Network policies applied
- [ ] RBAC roles configured
- [ ] Secrets encrypted in etcd
- [ ] WAF (Web Application Firewall) rules configured
- [ ] DDoS protection enabled (CloudFlare)
- [ ] Intrusion detection configured
- [ ] Security scanning in CI/CD enabled
- [ ] Vulnerability scanning scheduled
- [ ] Penetration testing completed
- [ ] Security audit conducted
- [ ] Compliance certifications verified (ISO 27001, SOC 2)
- [ ] Incident response plan documented

---

## LAUNCH CHECKLIST

- [ ] All services deployed and healthy
- [ ] Database migrations successful
- [ ] Stripe integration tested
- [ ] Email delivery working
- [ ] SSL/TLS certificates valid
- [ ] Monitoring and alerting active
- [ ] Backup systems verified
- [ ] Load testing passed
- [ ] Smoke tests passed
- [ ] Security scanning passed
- [ ] Documentation complete
- [ ] Support team trained
- [ ] Client communication sent
- [ ] Launch announcement scheduled
- [ ] On-call rotation established

---

**For questions or support, contact:** devops@vantage.live
**Production Status:** https://status.vantage.live
**Documentation:** https://docs.vantage.live

Generated: March 28, 2026 | Version 1.0.0 | 🟢 PRODUCTION READY
