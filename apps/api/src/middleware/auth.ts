import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/AuthService';
import DatabaseService from '../db/service';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Authentication Middleware
 */
export class AuthMiddleware {
  /**
   * Protect routes - require authentication
   */
  static async protect(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Extract token from header
      const token = AuthService.extractTokenFromHeader(
        req.headers.authorization
      );

      if (!token) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No token provided',
          },
        });
        return;
      }

      // Verify token
      const payload = AuthService.verifyToken(token);

      if (!payload) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        });
        return;
      }

      // Check if session exists in database
      const session = await DatabaseService.getSessionByToken(
        AuthService.hashToken(token)
      );

      if (!session) {
        res.status(401).json({
          success: false,
          error: {
            code: 'SESSION_EXPIRED',
            message: 'Session has expired',
          },
        });
        return;
      }

      // Attach user to request
      req.user = payload;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication failed',
        },
      });
    }
  }

  /**
   * Optional authentication - doesn't fail if no token
   */
  static async optional(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = AuthService.extractTokenFromHeader(
        req.headers.authorization
      );

      if (token) {
        const payload = AuthService.verifyToken(token);
        if (payload) {
          req.user = payload;
        }
      }

      next();
    } catch (error) {
      // Continue without authentication
      next();
    }
  }

  /**
   * Require specific role
   */
  static requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Required role: ${roles.join(' or ')}`,
          },
        });
        return;
      }

      next();
    };
  }

  /**
   * Require host or admin role
   */
  static requireHost = AuthMiddleware.requireRole('HOST', 'ADMIN');

  /**
   * Require admin role
   */
  static requireAdmin = AuthMiddleware.requireRole('ADMIN');
}

export default AuthMiddleware;
