/**
 * Request ID Middleware
 * Adds a unique request ID to every request for tracing and logging
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
    }
  }
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Generate or use existing request ID
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  req.id = requestId;
  req.startTime = Date.now();

  // Add to response headers
  res.setHeader('X-Request-ID', requestId);

  // Log request
  console.log(`[${requestId}] ${req.method} ${req.path}`);

  // Calculate duration on response
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    console.log(`[${requestId}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
}

export default requestIdMiddleware;
