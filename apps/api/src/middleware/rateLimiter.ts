import { Request, Response, NextFunction } from 'express';
import { config } from '@vantage/config';
import Redis from 'ioredis';

/**
 * Production-ready Rate Limiting Middleware
 * Uses Redis to persist rate limit state across restarts
 * Prevents brute force and DDoS attacks
 */

const redis = new Redis(config.redis.url);

export class RateLimiter {
  private static readonly WINDOW_MS = config.security.rateLimitWindow;
  private static readonly MAX_REQUESTS = config.security.rateLimitMax;

  /**
   * General rate limiter
   */
  static limit(maxRequests?: number, windowMs?: number) {
    const limit = maxRequests || this.MAX_REQUESTS;
    const window = windowMs || this.WINDOW_MS;

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
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
        // If Redis fails, allow request to prevent outage
        console.error('Rate limiter Redis error:', error);
        next();
      }
    };
  }

  /**
   * Strict rate limiter (blocks more aggressively)
   */
  static strict() {
    return this.limit(this.MAX_REQUESTS / 2, this.WINDOW_MS);
  }

  /**
   * Moderate rate limiter (default)
   */
  static moderate() {
    return this.limit(this.MAX_REQUESTS, this.WINDOW_MS);
  }

  /**
   * Lenient rate limiter (for non-critical endpoints)
   */
  static lenient() {
    return this.limit(this.MAX_REQUESTS * 2, this.WINDOW_MS);
  }

  /**
   * Custom rate limiter
   */
  static custom(maxRequests: number, windowMs: number) {
    return this.limit(maxRequests, windowMs);
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
