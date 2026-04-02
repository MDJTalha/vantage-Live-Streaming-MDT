import { prisma } from '../db';

/**
 * 🔒 SECURITY FIX H-06: Audit Logging Service
 * Logs all security-critical events for compliance and forensics
 * Required for SOC 2, HIPAA, and FedRAMP compliance
 */
export interface AuditEvent {
  action: AuditAction;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export type AuditAction =
  // Authentication Events
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'SESSION_CREATED'
  | 'SESSION_INVALIDATED'
  | 'SESSION_EXPIRED'
  
  // Authorization Events
  | 'PERMISSION_DENIED'
  | 'ROLE_CHANGED'
  | 'ACCESS_GRANTED'
  
  // User Management
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_LOCKED'
  | 'USER_UNLOCKED'
  
  // Room/Meeting Events
  | 'ROOM_CREATED'
  | 'ROOM_UPDATED'
  | 'ROOM_DELETED'
  | 'ROOM_JOINED'
  | 'ROOM_LEFT'
  | 'ROOM_PASSWORD_CHANGED'
  | 'PARTICIPANT_PROMOTED'
  | 'PARTICIPANT_DEMOTED'
  | 'PARTICIPANT_REMOVED'
  
  // Data Access
  | 'DATA_EXPORT_REQUESTED'
  | 'DATA_ACCESSED'
  | 'DATA_MODIFIED'
  | 'DATA_DELETED'
  
  // Security Events
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_TOKEN_ATTEMPT'
  | 'SUSPICIOUS_ACTIVITY'
  | 'BRUTE_FORCE_DETECTED'
  | 'SQL_INJECTION_ATTEMPT'
  | 'XSS_ATTEMPT'
  
  // System Events
  | 'CONFIG_CHANGED'
  | 'SYSTEM_ERROR'
  | 'BACKUP_COMPLETED'
  | 'SECURITY_SCAN_COMPLETED';

export class AuditService {
  /**
   * Log a security event
   */
  static async log(event: AuditEvent): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: event.userId || null,
          action: event.action,
          resource: event.resourceType ? `${event.resourceType}:${event.resourceId || '*'}` : null,
          resourceId: event.resourceId || null,
          metadata: event.metadata || {},
          ipAddress: event.ipAddress || null,
          userAgent: event.userAgent || null,
          createdAt: new Date(),
        },
      });

      // Log critical events to console for immediate visibility
      if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
        const severityEmoji = event.severity === 'CRITICAL' ? '🚨' : '⚠️';
        console.log(`${severityEmoji} AUDIT [${event.action}]: ${JSON.stringify({
          userId: event.userId,
          resourceId: event.resourceId,
          ipAddress: event.ipAddress,
          timestamp: new Date().toISOString(),
        })}`);
      }
    } catch (error) {
      // Never let audit logging failures disrupt the main flow
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log authentication success
   */
  static async logLoginSuccess(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await this.log({
      action: 'LOGIN_SUCCESS',
      userId,
      ipAddress,
      userAgent,
      severity: 'LOW',
    });
  }

  /**
   * Log authentication failure
   */
  static async logLoginFailed(
    email: string,
    ipAddress: string,
    userAgent: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      action: 'LOGIN_FAILED',
      ipAddress,
      userAgent,
      metadata: { email, reason },
      severity: 'MEDIUM',
    });
  }

  /**
   * Log permission denied
   */
  static async logPermissionDenied(
    userId: string,
    resource: string,
    action: string,
    ipAddress: string
  ): Promise<void> {
    await this.log({
      action: 'PERMISSION_DENIED',
      userId,
      resourceId: resource,
      ipAddress,
      metadata: { requestedAction: action },
      severity: 'MEDIUM',
    });
  }

  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(
    userId: string | undefined,
    activity: string,
    ipAddress: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: 'SUSPICIOUS_ACTIVITY',
      userId,
      ipAddress,
      metadata: { activity, ...details },
      severity: 'HIGH',
    });
  }

  /**
   * Log rate limit exceeded
   */
  static async logRateLimitExceeded(
    identifier: string,
    endpoint: string,
    ipAddress: string,
    attemptCount: number
  ): Promise<void> {
    await this.log({
      action: 'RATE_LIMIT_EXCEEDED',
      ipAddress,
      metadata: { identifier, endpoint, attemptCount },
      severity: 'MEDIUM',
    });
  }

  /**
   * Log data export request (GDPR/CCPA compliance)
   */
  static async logDataExport(
    userId: string,
    dataType: string,
    ipAddress: string
  ): Promise<void> {
    await this.log({
      action: 'DATA_EXPORT_REQUESTED',
      userId,
      ipAddress,
      metadata: { dataType },
      severity: 'LOW',
    });
  }

  /**
   * Get audit logs for a user
   */
  static async getUserAuditLogs(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get audit logs for a resource
   */
  static async getResourceAuditLogs(
    resourceType: string,
    resourceId: string,
    limit: number = 100
  ): Promise<any[]> {
    return prisma.auditLog.findMany({
      where: {
        resource: {
          startsWith: `${resourceType}:${resourceId}`,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get security events for monitoring dashboard
   */
  static async getSecurityEvents(
    startTime: Date,
    endTime: Date,
    severity?: string[]
  ): Promise<any[]> {
    const where: any = {
      createdAt: {
        gte: startTime,
        lte: endTime,
      },
    };

    if (severity && severity.length > 0) {
      where.action = {
        in: ['LOGIN_FAILED', 'PERMISSION_DENIED', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED'],
      };
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  /**
   * Detect brute force attempts
   */
  static async detectBruteForce(
    identifier: string,
    windowMs: number = 15 * 60 * 1000, // 15 minutes
    threshold: number = 5
  ): Promise<boolean> {
    const windowStart = new Date(Date.now() - windowMs);

    const failedAttempts = await prisma.auditLog.count({
      where: {
        action: 'LOGIN_FAILED',
        createdAt: { gte: windowStart },
        metadata: {
          path: ['email'],
          equals: identifier,
        },
      },
    });

    return failedAttempts >= threshold;
  }
}

export default AuditService;
