import express from 'express';
import { config } from '@vantage/config';
import { getIsShuttingDown } from '../utils/shutdown';

export const router = express.Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: boolean;
    redis: boolean;
    mediaServer: boolean;
  };
}

async function checkDatabase(): Promise<boolean> {
  try {
    // TODO: Replace with actual Prisma health check
    // await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    // TODO: Replace with actual Redis health check
    // await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

async function checkMediaServer(): Promise<boolean> {
  try {
    const response = await fetch(`http://${config.mediaServer.host}:${config.mediaServer.port}/health`, {
      method: 'GET',
    } as RequestInit);
    return response.ok;
  } catch (error) {
    console.error('Media server health check failed:', error);
    return false;
  }
}

router.get('/health', async (_req, res) => {
  try {
    // Return 503 if server is shutting down
    if (getIsShuttingDown()) {
      return res.status(503).json({
        status: 'shutting_down',
        message: 'Server is shutting down',
        timestamp: new Date().toISOString(),
      });
    }

    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.0.1',
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

    // Mark as unhealthy if critical services are down
    if (!health.services.database && !health.services.redis) {
      health.status = 'unhealthy';
    }

    const httpStatus = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    return res.status(httpStatus).json(health);
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/health/ready', async (_req, res) => {
  // Detailed readiness check for load balancers
  const [dbReady, redisReady] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);
  
  const ready = dbReady && redisReady;
  res.status(ready ? 200 : 503).json({ 
    ready,
    checks: {
      database: dbReady,
      redis: redisReady,
    }
  });
});

router.get('/health/live', (_req, res) => {
  // Liveness check - just verify process is running
  res.json({ live: true, uptime: process.uptime() });
});

router.get('/health/info', (_req, res) => {
  // Detailed service information
  res.json({
    name: 'Vantage API',
    version: process.env.npm_package_version || '0.0.1',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  });
});

export default router;
