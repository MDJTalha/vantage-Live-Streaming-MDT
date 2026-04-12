import winston from 'winston';
import { config } from '@vantage/config';

/**
 * 🔒 Winston Logger Configuration
 * Comprehensive logging for application events, errors, and audit trails
 */

// Define log levels
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

winston.addColors(logLevels.colors);

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.environment === 'development' ? 'debug' : 'info',
  levels: logLevels.levels,
  defaultMeta: {
    service: 'vantage-api',
    environment: config.environment,
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      level: 'info',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // HTTP request log file
    new winston.transports.File({
      filename: 'logs/http.log',
      level: 'http',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    }),

    // Console transport for development
    ...(config.environment === 'development'
      ? [
          new winston.transports.Console({
            format: consoleFormat,
          }),
        ]
      : []),

    // Console transport for production (JSON for container log collection)
    ...(config.environment === 'production'
      ? [
          new winston.transports.Console({
            format: logFormat, // JSON format
            stderrLevels: ['error'],
          }),
        ]
      : []),
  ],
});

// Create HTTP request logger middleware
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.log('http', `${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.userId,
    });
  });

  next();
};

// Security event logger
export const logSecurityEvent = (
  event: string,
  details: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    [key: string]: any;
  }
) => {
  const level = details.severity === 'CRITICAL' ? 'error' :
                details.severity === 'HIGH' ? 'warn' : 'info';

  logger.log(level, `[SECURITY] ${event}`, {
    ...details,
    category: 'security',
  });
};

// Error logger
export const logError = (
  error: Error,
  context: {
    userId?: string;
    operation?: string;
    [key: string]: any;
  } = {}
) => {
  logger.error(`[ERROR] ${error.message}`, {
    stack: error.stack,
    ...context,
    category: 'error',
  });
};

export { logger };
export default logger;
