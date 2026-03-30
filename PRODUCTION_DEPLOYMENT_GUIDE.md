# VANTAGE Production Deployment Guide

## **Pre-Deployment Checklist**

### **Step 1: Environment Configuration** ✅
- [ ] Copy `.env.example` to `.env.prod`
- [ ] Generate strong secrets:
  ```bash
  # JWT Secret (32 bytes)
  openssl rand -base64 32
  
  # Encryption Key (32 bytes)
  openssl rand -hex 16
  
  # TURN Server Password
  openssl rand -hex 16
  
  # Redis Password
  openssl rand -hex 16
  ```
- [ ] Set all required environment variables
- [ ] Never commit `.env.prod` to Git
- [ ] Use secrets manager (AWS Secrets, Vault, etc.)

### **Step 2: Infrastructure Setup**

#### **Option A: Kubernetes (Recommended for Production)**

```bash
# Create namespace
kubectl create namespace vantage

# Create secrets
kubectl create secret generic vantage-secrets \
  --from-literal=database-url="postgresql://vantage:PASSWORD@postgres:5432/vantage" \
  --from-literal=redis-url="redis://:PASSWORD@redis:6379" \
  --from-literal=jwt-secret="YOUR_JWT_SECRET" \
  --from-literal=encryption-key="YOUR_ENCRYPTION_KEY" \
  -n vantage

# Deploy infrastructure
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/secrets.yaml
kubectl apply -f infra/k8s/api-deployment.yaml
kubectl apply -f infra/k8s/web-deployment.yaml
kubectl apply -f infra/k8s/ingress.yaml
kubectl apply -f infra/k8s/database-backup-cronjob.yaml

# Verify deployments
kubectl get all -n vantage
kubectl logs -n vantage deployment/api
```

#### **Option B: Docker Compose (Staging/Small Scale)**

```bash
# Set environment variables
export NODE_ENV=production
export DATABASE_URL="postgresql://vantage:PASSWORD@postgres:5432/vantage"
export REDIS_URL="redis://:PASSWORD@redis:6379"
export JWT_SECRET="YOUR_JWT_SECRET"
export ENCRYPTION_KEY="YOUR_ENCRYPTION_KEY"

# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Verify services
docker-compose -f docker-compose.prod.yml ps
```

### **Step 3: Database Setup**

```bash
# Connect to PostgreSQL
psql -h postgres.vantage.svc.cluster.local -U vantage -d vantage

# Run migrations
npm run db:migrate:deploy

# Verify schema
\dt
```

### **Step 4: SSL/TLS Certificates**

#### **Using Let's Encrypt (Recommended)**

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@vantage.example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Update Ingress with cert-manager annotation
kubectl patch ingress vantage-ingress -n vantage -p '{"metadata":{"annotations":{"cert-manager.io/cluster-issuer":"letsencrypt-prod"}}}'
```

#### **Using Self-Signed (Development Only)**

```bash
# Generate certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Create Kubernetes secret
kubectl create secret tls vantage-tls \
  --cert=cert.pem \
  --key=key.pem \
  -n vantage
```

### **Step 5: Load Testing & Performance Baseline**

```bash
# Install load testing tool
npm install -g artillery

# Create load test config (load-test.yml)
cat <<EOF > load-test.yml
config:
  target: 'https://api.vantage.example.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: 'Warm up'
    - duration: 120
      arrivalRate: 50
      name: 'Ramp up'
    - duration: 60
      arrivalRate: 100
      name: 'Stress'

scenarios:
  - name: 'API Health Check'
    flow:
      - get:
          url: '/health'
      - think: 1
      - post:
          url: '/api/v1/auth/login'
          json:
            email: 'test@vantage.example.com'
            password: 'test_password'
EOF

# Run load test
artillery run load-test.yml
```

### **Step 6: Monitoring & Alerting Setup**

```bash
# Deploy Prometheus
kubectl apply -f infra/k8s/monitoring/prometheus.yaml

# Deploy Grafana
kubectl apply -f infra/k8s/monitoring/grafana.yaml

# Setup Sentry
# 1. Create Sentry project for your organization
# 2. Get DSN and set SENTRY_DSN environment variable
# 3. Configure error tracking in applications

# Setup health check monitoring
curl -X GET https://api.vantage.example.com/health
curl -X GET https://vantage.example.com/api/health
```

### **Step 7: Backup Configuration**

```bash
# Create backup schedule
kubectl apply -f infra/k8s/database-backup-cronjob.yaml

# Test backup manually
kubectl create job --from=cronjob/database-backup test-backup -n vantage

# Monitor backup job
kubectl logs -n vantage job/test-backup database-backup
```

### **Step 8: Security Hardening**

```bash
# Enable Pod Security Policy
kubectl apply -f infra/k8s/pod-security-policy.yaml

# Setup Network Policies
kubectl apply -f infra/k8s/network-policy.yaml

# Enable RBAC
kubectl apply -f infra/k8s/rbac.yaml
```

### **Step 9: Verify All Services**

```bash
# Check Kubernetes deployment
kubectl get all -n vantage

# Verify API health
curl -v https://api.vantage.example.com/health

# Verify Web health
curl -v https://vantage.example.com/api/health

# Check database connection
kubectl exec -it deployment/api -n vantage -- psql $DATABASE_URL -c "SELECT NOW();"

# Check Redis connection
kubectl exec -it deployment/api -n vantage -- redis-cli -u $REDIS_URL ping

# Check log output
kubectl logs -n vantage -l app=api --tail=100 -f
kubectl logs -n vantage -l app=web --tail=100 -f
```

---

## **Post-Deployment Verification**

### **Health Checks** ✅

```bash
# API Health
curl https://api.vantage.example.com/health

# Web Health  
curl https://vantage.example.com/api/health

# Metrics
curl https://api.vantage.example.com/metrics

# Response should include:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "services": {
    "database": true,
    "redis": true,
    "mediaServer": true
  }
}
```

### **Performance Baseline** ⚠️

- **API Response Time (p95):** < 200ms
- **Web Load Time:** < 2s
- **Database Query Time (p95):** < 100ms
- **Cache Hit Rate:** > 70%
- **Error Rate:** < 0.1%

### **Monitoring Dashboards** 📊

- Prometheus: `http://prometheus.vantage.example.com`
- Grafana: `http://grafana.vantage.example.com`
- Sentry: `https://sentry.io`

---

## **Troubleshooting**

### **API Not Starting**
```bash
# Check logs
kubectl logs -n vantage deployment/api

# Check configuration
kubectl exec -it deployment/api -n vantage -- env | grep DATABASE_URL

# Test database connection
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- \
  psql postgresql://vantage:PASSWORD@postgres:5432/vantage -c "SELECT NOW();"
```

### **High Memory Usage**
```bash
# Check memory
kubectl top pod -n vantage

# Increase limits in deployment
kubectl patch deployment api -n vantage -p '{"spec":{"template":{"spec":{"containers":[{"name":"api","resources":{"limits":{"memory":"1Gi"}}}]}}}}'
```

### **Certificate Errors**
```bash
# Check certificate status
kubectl get certificate -n vantage

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Manually renew
kubectl delete secret vantage-tls -n vantage
kubectl delete certificate vantage-cert -n vantage
```

---

## **Ongoing Operations**

### **Daily Tasks**
- [ ] Monitor error rates in Sentry
- [ ] Check backup completion logs
- [ ] Review Grafana dashboards
- [ ] Check certificate expiration dates

### **Weekly Tasks**
- [ ] Review performance metrics
- [ ] Audit security logs
- [ ] Update dependencies
- [ ] Test disaster recovery

### **Monthly Tasks**
- [ ] Full system backup verification
- [ ] Security audit
- [ ] Capacity planning
- [ ] Update documentation

### **Emergency Procedures**

**Service Down:**
```bash
# Check service status
kubectl describe deployment api -n vantage

# Restart service
kubectl rollout restart deployment/api -n vantage

# Check logs
kubectl logs -n vantage deployment/api --tail=100
```

**Database Issue:**
```bash
# Backup database immediately
./scripts/backup-database.sh

# Check database size
kubectl exec -it deployment/api -n vantage -- psql $DATABASE_URL -c "SELECT sum(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname='public';"
```

**Cache Issue:**
```bash
# Flush Redis cache (careful!)
kubectl exec -it deployment/api -n vantage -- redis-cli FLUSHALL
```

---

## **Rollback Procedures**

```bash
# View deployment history
kubectl rollout history deployment/api -n vantage

# Rollback to previous version
kubectl rollout undo deployment/api -n vantage

# Rollback to specific revision
kubectl rollout undo deployment/api -n vantage --to-revision=2
```

---

## **Success Criteria**

✅ All health checks passing
✅ API response time < 200ms
✅ Zero critical errors in Sentry
✅ Database backups completing successfully
✅ Certificates valid and auto-renewing
✅ Monitoring and alerting working
✅ Load test passing (100+ concurrent users)
✅ Documentation up to date

---

**Contact:** DevOps Team | Slack: #prod-alerts | On-call: +1-XXX-XXX-XXXX
