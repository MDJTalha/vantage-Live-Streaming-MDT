# VANTAGE Infrastructure Guide

## Overview

VANTAGE uses a microservices architecture deployed with Docker and Kubernetes.

## Services

| Service | Port | Description |
|---------|------|-------------|
| **Web** | 3000 | Next.js frontend |
| **API** | 4000 | Express backend |
| **Media Server** | 443 | Mediasoup SFU |
| **AI Services** | 5000 | Transcription & summaries |
| **PostgreSQL** | 5432 | Primary database |
| **Redis** | 6379 | Cache & pub/sub |
| **Coturn** | 3478 | TURN/STUN server |
| **Nginx** | 80/443 | Reverse proxy |
| **Prometheus** | 9090 | Metrics collection |
| **Grafana** | 3001 | Monitoring dashboard |

---

## Docker Setup

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Production

```bash
# Start with production config
docker-compose -f docker-compose.prod.yml up -d

# With monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d
```

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (v1.25+)
- kubectl configured
- Helm (optional)
- cert-manager (for SSL)
- nginx-ingress controller

### Deploy

```bash
# Create namespace
kubectl apply -f infra/k8s/namespace.yaml

# Create secrets
kubectl apply -f infra/k8s/secrets.yaml

# Deploy all resources
kubectl apply -f infra/k8s/

# Check status
kubectl get pods -n vantage
kubectl get services -n vantage
kubectl get ingress -n vantage
```

### Scale

```bash
# Manual scaling
kubectl scale deployment/api -n vantage --replicas=5

# Auto-scaling is configured via HPA
kubectl get hpa -n vantage
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

1. **Push to main/develop** → Trigger CI
2. **Lint & Test** → Code quality checks
3. **Build Docker Images** → Multi-arch builds
4. **Push to Registry** → GitHub Container Registry
5. **Deploy** → Kubernetes or Docker Swarm

### Environment Variables

Set these secrets in GitHub:

```bash
# Kubernetes
KUBE_CONFIG=<base64-encoded-kubeconfig>

# Docker Swarm
SWARM_HOST=<swarm-manager-ip>
SWARM_USERNAME=<username>
SWARM_PASSWORD=<password>

# Application
JWT_SECRET=<random-string>
ENCRYPTION_KEY=<32-char-hex>
OPENAI_API_KEY=<key>
```

---

## Monitoring

### Prometheus Metrics

- API response times
- Request rates
- Error rates
- Database connections
- Redis memory
- Node resources

### Grafana Dashboards

Access at http://localhost:3001

Default credentials:
- Username: admin
- Password: admin (change in production!)

### Alerts

Configure alerts in Grafana for:
- High error rates (>5%)
- High latency (>1s)
- Low disk space (<10%)
- High memory usage (>80%)
- Pod restarts

---

## Logging

### Centralized Logging (Optional)

Add ELK stack or Loki:

```yaml
# docker-compose.override.yml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
  
  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
```

---

## Backup & Recovery

### Database Backup

```bash
# Backup
docker exec vantage-postgres pg_dump -U vantage vantage > backup.sql

# Restore
docker exec -i vantage-postgres psql -U vantage vantage < backup.sql
```

### Redis Backup

```bash
# Backup
docker exec vantage-redis redis-cli BGSAVE

# Copy RDB file
docker cp vantage-redis:/data/dump.rdb ./backup.rdb
```

---

## Security

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-network-policy
  namespace: vantage
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web
    - podSelector:
        matchLabels:
          app: nginx
    ports:
    - protocol: TCP
      port: 4000
```

### SSL/TLS

Use cert-manager for automatic SSL:

```yaml
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
```

---

## Troubleshooting

### Check Pod Status

```bash
kubectl describe pod <pod-name> -n vantage
kubectl logs <pod-name> -n vantage
```

### Port Forwarding

```bash
# API
kubectl port-forward svc/api 4000:4000 -n vantage

# Database
kubectl port-forward svc/postgres 5432:5432 -n vantage
```

### Debug Mode

```bash
# Enable debug logging
kubectl set env deployment/api DEBUG=true -n vantage

# Restart deployment
kubectl rollout restart deployment/api -n vantage
```

---

## Performance Tuning

### API Server

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

### Database

```yaml
# PostgreSQL tuning
shared_buffers: 256MB
effective_cache_size: 768MB
work_mem: 16MB
```

### Redis

```yaml
# Redis tuning
maxmemory: 512mb
maxmemory-policy: allkeys-lru
```

---

## Cost Optimization

1. Use spot instances for non-critical workloads
2. Enable cluster autoscaler
3. Use resource quotas
4. Implement pod disruption budgets
5. Schedule jobs during off-peak hours

---

## Disaster Recovery

### RTO (Recovery Time Objective): 1 hour
### RPO (Recovery Point Objective): 15 minutes

### Steps

1. Restore database from backup
2. Redeploy Kubernetes manifests
3. Verify health checks
4. Update DNS if needed
5. Notify users of status
