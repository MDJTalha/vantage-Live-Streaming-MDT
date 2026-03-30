/**
 * Centralized Error Handler & Logging System
 * Provides structured error handling, audit logging, and monitoring hooks
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '@vantage/config';

// ============================================
// Error Types
// ============================================

export enum ErrorCode {
  // Auth errors (4000-4099)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  USER_EXISTS = 'USER_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // Validation errors (4100-4199)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource errors (4200-4299)
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Business logic errors (4300-4399)
  INVALID_OPERATION = 'INVALID_OPERATION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  ROOM_FULL = 'ROOM_FULL',
  ROOM_NOT_ACTIVE = 'ROOM_NOT_ACTIVE',

  // Rate limiting & abuse (4400-4499)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  SUSPECTED_ABUSE = 'SUSPECTED_ABUSE',

  // External service errors (5000-5099)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',

  // Internal errors (5100-5199)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
  requestId?: string;
  timestamp?: string;
  path?: string;
  method?: string;
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// Error Factory Functions
// ============================================

export const Errors = {
  // Auth errors
  unauthorized: (message = 'Unauthorized') =>
    new AppError(ErrorCode.UNAUTHORIZED, 401, message),

  forbidden: (message = 'Forbidden') =>
    new AppError(ErrorCode.FORBIDDEN, 403, message),

  invalidToken: (message = 'Invalid or expired token') =>
    new AppError(ErrorCode.INVALID_TOKEN, 401, message),

  sessionExpired: (message = 'Session has expired') =>
    new AppError(ErrorCode.SESSION_EXPIRED, 401, message),

  weakPassword: (errors: string[]) =>
    new AppError(ErrorCode.WEAK_PASSWORD, 400, 'Password does not meet requirements', { errors }),

  userExists: (email: string) =>
    new AppError(ErrorCode.USER_EXISTS, 409, `User with email ${email} already exists`),

  userNotFound: (identifier: string) =>
    new AppError(ErrorCode.USER_NOT_FOUND, 404, `User not found: ${identifier}`),

  // Validation errors
  validationError: (details: any) =>
    new AppError(ErrorCode.VALIDATION_ERROR, 400, 'Invalid request data', { details }),

  invalidInput: (field: string, reason: string) =>
    new AppError(ErrorCode.INVALID_INPUT, 400, `Invalid ${field}: ${reason}`),

  missingRequiredField: (field: string) =>
    new AppError(ErrorCode.MISSING_REQUIRED_FIELD, 400, `Missing required field: ${field}`),

  // Resource errors
  notFound: (resource: string) =>
    new AppError(ErrorCode.NOT_FOUND, 404, `${resource} not found`),

  duplicateResource: (resource: string) =>
    new AppError(ErrorCode.DUPLICATE_RESOURCE, 409, `${resource} already exists`),

  resourceConflict: (message: string) =>
    new AppError(ErrorCode.RESOURCE_CONFLICT, 409, message),

  // Business logic errors
  invalidOperation: (message: string) =>
    new AppError(ErrorCode.INVALID_OPERATION, 400, message),

  operationNotAllowed: (message: string) =>
    new AppError(ErrorCode.OPERATION_NOT_ALLOWED, 403, message),

  roomFull: (roomCode: string) =>
    new AppError(ErrorCode.ROOM_FULL, 400, `Room ${roomCode} is full`),

  roomNotActive: (roomCode: string) =>
    new AppError(ErrorCode.ROOM_NOT_ACTIVE, 400, `Room ${roomCode} is not active`),

  // Rate limiting
  rateLimitExceeded: (retryAfter?: number) =>
    new AppError(ErrorCode.RATE_LIMIT_EXCEEDED, 429, 'Rate limit exceeded', { retryAfter }),

  tooManyRequests: (message = 'Too many requests') =>
    new AppError(ErrorCode.TOO_MANY_REQUESTS, 429, message),

  suspectedAbuse: () =>
    new AppError(ErrorCode.SUSPECTED_ABUSE, 429, 'Suspected abuse detected'),

  // External service errors
  externalServiceError: (service: string) =>
    new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, 502, `${service} is temporarily unavailable`),

  databaseError: (err?: any) =>
    new AppError(ErrorCode.DATABASE_ERROR, 500, 'Database error occurred', { error: err?.message }),

  cacheError: (err?: any) =>
    new AppError(ErrorCode.CACHE_ERROR, 500, 'Cache error occurred', { error: err?.message }),

  emailServiceError: () =>
    new AppError(ErrorCode.EMAIL_SERVICE_ERROR, 500, 'Failed to send email'),

  // Internal errors
  internalError: (message = 'Internal server error') =>
    new AppError(ErrorCode.INTERNAL_ERROR, 500, message),

  unexpectedError: (err?: any) =>
    new AppError(ErrorCode.UNEXPECTED_ERROR, 500, 'An unexpected error occurred', {
      error: err?.message,
    }),

  dataCorruption: (details: string) =>
    new AppError(ErrorCode.DATA_CORRUPTION, 500, 'Data corruption detected', { details }),
};

// ============================================
// Error Middleware
// ============================================

/**
 * Express error handling middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = (req as any).id || 'unknown';

  // Log error
  logError(err, {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: config.environment === 'development' ? err.details : undefined,
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Handle validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: err.errors,
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: 'Invalid token',
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: ErrorCode.SESSION_EXPIRED,
        message: 'Token expired',
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    // Unique constraint violation
    return res.status(409).json({
      success: false,
      error: {
        code: ErrorCode.DUPLICATE_RESOURCE,
        message: 'A resource with this value already exists',
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (err.code === 'P2025') {
    // Record not found
    return res.status(404).json({
      success: false,
      error: {
        code: ErrorCode.NOT_FOUND,
        message: 'Resource not found',
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Default error response
  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message:
        config.environment === 'production'
          ? 'Internal server error'
          : err.message,
      requestId,
      timestamp: new Date().toISOString(),
      ...(config.environment === 'development' && { stack: err.stack }),
    },
  });
};

// ============================================
// Logging System
// ============================================

export interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  data?: Record<string, any>;
  error?: {
    code?: string;
    message: string;
    stack?: string;
  };
}

/**
 * Structured logger
 */
export class Logger {
  private static formatEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    data?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error: error
        ? {
            code: (error as any).code,
            message: error.message,
            stack: config.environment === 'development' ? error.stack : undefined,
          }
        : undefined,
    };
  }

  static debug(message: string, context?: LogContext, data?: Record<string, any>) {
    const entry = this.formatEntry(LogLevel.DEBUG, message, context, data);
    if (config.environment === 'development') {
      console.log('[DEBUG]', JSON.stringify(entry, null, 2));
    }
  }

  static info(message: string, context?: LogContext, data?: Record<string, any>) {
    const entry = this.formatEntry(LogLevel.INFO, message, context, data);
    console.log('[INFO]', JSON.stringify(entry));
  }

  static warn(message: string, context?: LogContext, data?: Record<string, any>) {
    const entry = this.formatEntry(LogLevel.WARN, message, context, data);
    console.warn('[WARN]', JSON.stringify(entry));
  }

  static error(message: string, error?: Error, context?: LogContext, data?: Record<string, any>) {
    const entry = this.formatEntry(LogLevel.ERROR, message, context, data, error);
    console.error('[ERROR]', JSON.stringify(entry));
  }

  static critical(message: string, error?: Error, context?: LogContext, data?: Record<string, any>) {
    const entry = this.formatEntry(LogLevel.CRITICAL, message, context, data, error);
    console.error('[CRITICAL]', JSON.stringify(entry));
    // TODO: Send to incident tracking service
  }
}

/**
 * Log errors with context
 */
export function logError(
  error: any,
  context: LogContext = {}
) {
  if (error instanceof AppError) {
    Logger.warn(error.message, context, {
      code: error.code,
      details: error.details,
    });
  } else if (error instanceof Error) {
    Logger.error(error.message, error, context);
  } else {
    Logger.error('Unknown error occurred', undefined, context, { error });
  }
}

/**
 * Log successful operations (audit trail)
 */
export function logAudit(
  action: string,
  userId: string,
  resourceType: string,
  resourceId: string,
  changes?: Record<string, any>
) {
  Logger.info(`Audit: ${action}`, { userId }, {
    action,
    resourceType,
    resourceId,
    changes,
  });
}
