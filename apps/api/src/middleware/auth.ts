import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import prisma from '../db/prisma';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
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

      // Verify JWT
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

      // Verify session exists in database
      const session = await prisma.session.findFirst({
        where: {
          refreshToken: token, // Check if this refresh token is still valid
          expiresAt: { gt: new Date() },
        },
      });

      // Also check by tokenHash for access token verification
      if (!session) {
        const tokenHash = AuthService.hashToken(token);
        const sessionByHash = await prisma.session.findFirst({
          where: {
            tokenHash,
            expiresAt: { gt: new Date() },
          },
        });

        if (!sessionByHash) {
          res.status(401).json({
            success: false,
            error: {
              code: 'SESSION_EXPIRED',
              message: 'Session has expired',
            },
          });
          return;
        }
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
    _res: Response,
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

  /**
   * Require authentication (alias for protect)
   */
  static requireAuth = AuthMiddleware.protect;
}

export default AuthMiddleware;
