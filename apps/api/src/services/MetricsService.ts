import prometheus from 'prom-client';

export class MetricsService {
  static register = new prometheus.Registry();

  // HTTP Request Duration Histogram
  static httpDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.register],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  });

  // Total Errors Counter
  static errorCounter = new prometheus.Counter({
    name: 'errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'route'],
    registers: [this.register],
  });

  // Active WebSocket Connections Gauge
  static activeConnections = new prometheus.Gauge({
    name: 'active_connections',
    help: 'Number of active WebSocket connections',
    registers: [this.register],
  });

  // Database Query Duration Histogram
  static dbQueryDuration = new prometheus.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries',
    labelNames: ['query', 'status'],
    registers: [this.register],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  });

  // Redis Operations Counter
  static redisOperations = new prometheus.Counter({
    name: 'redis_operations_total',
    help: 'Total number of Redis operations',
    labelNames: ['operation', 'status'],
    registers: [this.register],
  });

  // Room Events Counter
  static roomEvents = new prometheus.Counter({
    name: 'room_events_total',
    help: 'Total number of room events',
    labelNames: ['event_type', 'room_status'],
    registers: [this.register],
  });

  // User Activity Gauge
  static activeUsers = new prometheus.Gauge({
    name: 'active_users',
    help: 'Number of currently active users',
    labelNames: ['role'],
    registers: [this.register],
  });

  // API Request Counter by endpoint
  static apiRequests = new prometheus.Counter({
    name: 'api_requests_total',
    help: 'Total number of API requests',
    labelNames: ['endpoint', 'method', 'status'],
    registers: [this.register],
  });

  // Memory Usage Gauge
  static memoryUsage = new prometheus.Gauge({
    name: 'process_memory_bytes',
    help: 'Process memory usage in bytes',
    labelNames: ['type'],
    registers: [this.register],
  });

  // CPU Usage Gauge
  static cpuUsage = new prometheus.Gauge({
    name: 'process_cpu_usage',
    help: 'Process CPU usage percentage',
    registers: [this.register],
  });

  // Initialize default metrics collection
  static collectDefaultMetrics() {
    prometheus.collectDefaultMetrics({
      register: this.register,
      prefix: 'vantage_',
    });

    // Collect custom system metrics
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.memoryUsage.labels('heap_used').set(memUsage.heapUsed);
      this.memoryUsage.labels('heap_total').set(memUsage.heapTotal);
      this.memoryUsage.labels('rss').set(memUsage.rss);
      this.memoryUsage.labels('external').set(memUsage.external);
    }, 5000);

    // CPU usage collection
    let prevCpuUsage = process.cpuUsage();
    let prevTime = Date.now();

    setInterval(() => {
      const currCpuUsage = process.cpuUsage();
      const currTime = Date.now();
      const timeDiff = currTime - prevTime;
      const cpuDiff = currCpuUsage.user + currCpuUsage.system - prevCpuUsage.user - prevCpuUsage.system;
      this.cpuUsage.set((cpuDiff / timeDiff / 1000) * 100);
      prevCpuUsage = currCpuUsage;
      prevTime = currTime;
    }, 5000);
  }

  // Get metrics in Prometheus format
  static async getMetrics(): Promise<string> {
    return await this.register.metrics();
  }

  // Reset all metrics (useful for testing)
  static async reset() {
    this.register.clear();
  }
}
