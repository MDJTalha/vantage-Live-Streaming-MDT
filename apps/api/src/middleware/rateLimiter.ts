import { Request, Response, NextFunction } from 'express';
import { config } from '@vantage/config';
import Redis from 'ioredis';

/**
 * Production-ready Rate Limiting Middleware
 * Uses Redis to persist rate limit state across restarts
 * Prevents brute force and DDoS attacks
 *
 * H-01 FIX: Fail CLOSED for auth endpoints (security-critical),
 * fail OPEN with warning for non-critical endpoints.
 */

const redis = new Redis(config.redis.url);

// H-01 FIX: Circuit breaker for Redis failures
let redisFailureCount = 0;
let redisCircuitBreakerOpen = false;
let circuitBreakerResetAt = 0;

function isRedisAvailable(): boolean {
  if (redisCircuitBreakerOpen) {
    if (Date.now() > circuitBreakerResetAt) {
      // Try again after cooldown
      redisCircuitBreakerOpen = false;
      redisFailureCount = 0;
      return true;
    }
    return false;
  }
  return true;
}

function recordRedisFailure() {
  redisFailureCount++;
  if (redisFailureCount >= 3) {
    redisCircuitBreakerOpen = true;
    circuitBreakerResetAt = Date.now() + 60_000; // 60s cooldown
    console.error('⚠️ Rate limiter: Redis circuit breaker OPEN — failing closed for auth endpoints');
  }
}

// Auth endpoint patterns that must fail closed
const AUTH_ENDPOINT_PATTERNS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/change-password',
];

function isAuthEndpoint(req: Request): boolean {
  return AUTH_ENDPOINT_PATTERNS.some(pattern => req.path.startsWith(pattern));
}

export class RateLimiter {
  private static readonly WINDOW_MS = config.security.rateLimitWindow;
  private static readonly MAX_REQUESTS = config.security.rateLimitMax;

  /**
   * General rate limiter
   * H-01 FIX: Fail closed for auth endpoints, fail open for others
   */
  static limit(maxRequests?: number, windowMs?: number, failClosedOnRedisFailure = false) {
    const limit = maxRequests || this.MAX_REQUESTS;
    const window = windowMs || this.WINDOW_MS;

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // H-01 FIX: Check circuit breaker
        if (!isRedisAvailable()) {
          const isAuth = isAuthEndpoint(req);
          const shouldFailClosed = failClosedOnRedisFailure || isAuth;

          if (shouldFailClosed) {
            console.warn(`Rate limiter: Failing CLOSED for ${req.method} ${req.path} (Redis unavailable)`);
            res.status(503).json({
              success: false,
              error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Rate limiting service unavailable. Please try again later.',
                retryAfter: 30,
              },
            });
            return;
          }

          // Non-critical endpoint — fail open with warning
          console.warn(`Rate limiter: Failing OPEN for ${req.method} ${req.path} (Redis unavailable)`);
          next();
          return;
        }

        const key = this.getKey(req);
        const now = Date.now();
        const windowStart = now - window;

        // Remove old entries outside window
        await redis.zremrangebyscore(key, 0, windowStart);

        // Get current count
        const count = await redis.zcard(key);

        // Add current request
        await redis.zadd(key, now, `${now}-${Math.random()}`);

        // Set expiry on key (cleanup)
        await redis.expire(key, Math.ceil(window / 1000));

        // Set rate limit headers
        const remaining = Math.max(0, limit - count - 1);
        const resetTime = new Date(now + window).toISOString();

        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', resetTime);

        // Check limit
        if (count >= limit) {
          res.status(429).json({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: `Rate limit exceeded. Max ${limit} requests per ${window / 1000}s`,
              retryAfter: Math.ceil(window / 1000),
            },
          });
          return;
        }

        next();
      } catch (error) {
        recordRedisFailure();

        const isAuth = isAuthEndpoint(req);
        const shouldFailClosed = failClosedOnRedisFailure || isAuth;

        if (shouldFailClosed) {
          console.error('Rate limiter Redis error (failing closed):', error);
          res.status(503).json({
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Rate limiting service unavailable. Please try again later.',
              retryAfter: 30,
            },
          });
          return;
        }

        // Non-critical endpoint — fail open with warning
        console.error('Rate limiter Redis error (failing open):', error);
        next();
      }
    };
  }

  /**
   * Strict rate limiter (blocks more aggressively)
   * H-01 FIX: Always fails closed on Redis failure
   */
  static strict() {
    return this.limit(this.MAX_REQUESTS / 2, this.WINDOW_MS, true);
  }

  /**
   * Moderate rate limiter (default)
   * H-01 FIX: Fails closed for auth endpoints, open for others
   */
  static moderate() {
    return this.limit(this.MAX_REQUESTS, this.WINDOW_MS, false);
  }

  /**
   * Lenient rate limiter (for non-critical endpoints)
   * H-01 FIX: Always fails open
   */
  static lenient() {
    return this.limit(this.MAX_REQUESTS * 2, this.WINDOW_MS, false);
  }

  /**
   * Custom rate limiter
   */
  static custom(maxRequests: number, windowMs: number, failClosed = false) {
    return this.limit(maxRequests, windowMs, failClosed);
  }

  /**
   * Get rate limit key from request
   */
  private static getKey(req: Request): string {
    // Use API key if available
    const apiKey = req.headers['x-api-key'];
    if (apiKey) {
      return `api:${apiKey}`;
    }

    // Use user ID if authenticated
    const userId = (req as any).user?.userId;
    if (userId) {
      return `user:${userId}`;
    }

    // Fall back to IP
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }
}

export default RateLimiter;
