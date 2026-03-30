# Monitoring & Observability Configuration

## Quick Setup (Production)

### 1. Deploy Prometheus for Metrics Collection

```yaml
# infra/k8s/monitoring/prometheus.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: vantage
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    scrape_configs:
      - job_name: 'api'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - vantage
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            action: keep
            regex: api

      - job_name: 'web'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - vantage
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            action: keep
            regex: web

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: vantage
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:v2.48.0
        args:
          - '--config.file=/etc/prometheus/prometheus.yml'
          - '--storage.tsdb.path=/prometheus'
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: storage
          mountPath: /prometheus
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: storage
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: vantage
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
  type: ClusterIP
```

### 2. Add Sentry Error Tracking

```bash
# In apps/api package.json
npm install @sentry/node @sentry/tracing

# In apps/web package.json
npm install @sentry/react @sentry/tracing
```

**API Setup (apps/api/src/index.ts):**
```typescript
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

// Initialize Sentry
if (config.isProd) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    maxBreadcrumbs: 50,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Express({
        app: true,
        request: true,
      }),
    ],
  });
}

// Use Sentry middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Error handler
app.use(Sentry.Handlers.errorHandler());
```

### 3. Add Application Monitoring Metrics

**Create apps/api/src/services/MetricsService.ts:**
```typescript
import prometheus from 'prom-client';

export class MetricsService {
  static register = new prometheus.Registry();

  // Counter: Total API requests
  static httpDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.register],
  });

  // Counter: Total errors
  static errorCounter = new prometheus.Counter({
    name: 'errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'route'],
    registers: [this.register],
  });

  // Gauge: Active connections
  static activeConnections = new prometheus.Gauge({
    name: 'active_connections',
    help: 'Number of active WebSocket connections',
    registers: [this.register],
  });

  // Gauge: Database query latency
  static dbQueryDuration = new prometheus.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries',
    labelNames: ['query', 'status'],
    registers: [this.register],
  });
}
```

**Add metrics endpoint to API:**
```typescript
import { MetricsService } from './services/MetricsService';

app.get('/metrics', (req, res) => {
  res.set('Content-Type', MetricsService.register.contentType);
  res.end(MetricsService.register.metrics());
});
```

### 4. Setup Grafana Dashboards

```yaml
# infra/k8s/monitoring/grafana.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: vantage
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:10.2.0
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: vantage-secrets
              key: grafana-password
        - name: GF_INSTALL_PLUGINS
          value: "grafana-piechart-panel"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
        volumeMounts:
        - name: storage
          mountPath: /var/lib/grafana
      volumes:
      - name: storage
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: vantage
spec:
  selector:
    app: grafana
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer
```

### 5. Add Datadog Integration (Alternative to Prometheus)

```bash
# .env.example additions
DATADOG_API_KEY=your-datadog-api-key
DATADOG_APP_KEY=your-datadog-app-key
DATADOG_ENV=production
SENTRY_DSN=your-sentry-dsn
```

**Helm deployment:**
```bash
helm repo add datadog https://helm.datadoghq.com
helm repo update

helm install datadog datadog/datadog \
  --namespace vantage \
  --set datadog.apiKey=$DATADOG_API_KEY \
  --set datadog.appKey=$DATADOG_APP_KEY \
  --set datadog.site=datadoghq.com \
  --set datadog.kubeStateMetricsEnabled=true \
  --set datadog.kubelet.enabled=true
```

### 6. Health Check Endpoints

**Add to apps/api/src/routes/health.ts:**
```typescript
import express from 'express';
import { config } from '@vantage/config';

export const router = express.Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: boolean;
    redis: boolean;
    mediaServer: boolean;
  };
}

router.get('/health', async (req, res) => {
  try {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: await checkDatabase(),
        redis: await checkRedis(),
        mediaServer: await checkMediaServer(),
      },
    };

    // Mark as degraded if any service is down
    if (!health.services.database || !health.services.redis) {
      health.status = 'degraded';
    }

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/health/ready', async (req, res) => {
  // Detailed readiness check for load balancers
  const ready = await checkDatabase() && await checkRedis();
  res.status(ready ? 200 : 503).json({ ready });
});

router.get('/health/live', (req, res) => {
  // Liveness check - just verify process is running
  res.json({ live: true });
});
```

### 7. Alerting Rules

```yaml
# infra/monitoring/alerting-rules.yaml
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: vantage-alerts
  namespace: vantage
spec:
  groups:
  - name: vantage.rules
    interval: 30s
    rules:
    - alert: HighErrorRate
      expr: rate(errors_total[5m]) > 0.05
      for: 5m
      annotations:
        summary: "High error rate detected"

    - alert: APIDown
      expr: up{job="api"} == 0
      for: 2m
      annotations:
        summary: "API service is down"

    - alert: DatabaseConnectionPoolExhausted
      expr: db_connections_total >= 95
      for: 5m
      annotations:
        summary: "Database connection pool is nearly exhausted"

    - alert: HighLatency
      expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
      for: 5m
      annotations:
        summary: "API response time is high (p95 > 1s)"

    - alert: CacheHitRateLow
      expr: redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total) < 0.7
      for: 10m
      annotations:
        summary: "Cache hit rate is below 70%"
```

### 8. Log Aggregation with ELK Stack

```yaml
# docker-compose.prod.yml additions
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
  ports:
    - "9200:9200"
  volumes:
    - elasticsearch_data:/usr/share/elasticsearch/data

logstash:
  image: docker.elastic.co/logstash/logstash:8.10.0
  volumes:
    - ./infra/logstash/pipeline:/usr/share/logstash/pipeline
  ports:
    - "9600:9600"
  depends_on:
    - elasticsearch

kibana:
  image: docker.elastic.co/kibana/kibana:8.10.0
  ports:
    - "5601:5601"
  environment:
    - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
  depends_on:
    - elasticsearch
```

### Quick Deploy All Monitoring

```bash
# Deploy monitoring stack
kubectl apply -f infra/k8s/monitoring/

# Access endpoints
kubectl port-forward -n vantage svc/prometheus 9090 &
kubectl port-forward -n vantage svc/grafana 3000 &

# Verify metrics available
curl http://localhost:9090/metrics
```

### Environment Variables to Add

```bash
# .env.example additions
SENTRY_DSN=https://your-sentry-key@sentry.io/project-id
DATADOG_API_KEY=your-datadog-api-key
DATADOG_APP_KEY=your-datadog-app-key
PROMETHEUS_SCRAPE_INTERVAL=15s
GRAFANA_ADMIN_PASSWORD=secure_password_here
ELASTICSEARCH_URL=http://elasticsearch:9200
```

### Monitoring Checklist

- [ ] Prometheus scraping metrics
- [ ] Grafana dashboards configured
- [ ] Sentry error tracking active
- [ ] Health check endpoints responding
- [ ] Alert rules configured
- [ ] Log aggregation working
- [ ] Database backups scheduled
- [ ] Performance baseline established
