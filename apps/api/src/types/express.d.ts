/**
 * Express type augmentation for custom User interface
 * This resolves the TS2769 "No overload matches this call" errors
 * across all route files that use AuthMiddleware.
 */

import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      role: string;
    }
  }
}
