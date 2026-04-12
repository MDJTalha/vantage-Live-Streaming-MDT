import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '../db';

/**
 * 🔐 Multi-Factor Authentication (MFA) Service
 * Implements TOTP (Time-based One-Time Password) for 2FA
 */

export interface MFASecret {
  userId: string;
  secret: string;
  qrCode: string; // Data URL
  otpauthUrl: string;
}

export interface MFAVerification {
  valid: boolean;
  userId?: string;
  error?: string;
}

export class MFAService {
  /**
   * Generate MFA secret and QR code for user
   */
  static async generateSecret(
    userId: string,
    email: string
  ): Promise<MFASecret> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `VANTAGE (${email})`,
      issuer: 'VANTAGE',
      length: 32,
      symbols: false,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    // Store secret in database (not yet enabled)
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret.base32,
        mfaEnabled: false, // Will be enabled after verification
      },
    });

    return {
      userId,
      secret: secret.base32,
      qrCode,
      otpauthUrl: secret.otpauth_url!,
    };
  }

  /**
   * Verify TOTP token
   */
  static verifyToken(secret: string, token: string): boolean {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps before/after (30 sec each)
      });

      return verified;
    } catch (error) {
      return false;
    }
  }

  /**
   * Enable MFA for user after verification
   */
  static async enableMFA(userId: string, token: string): Promise<MFAVerification> {
    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { mfaSecret: true, mfaEnabled: true },
      });

      if (!user) {
        return { valid: false, error: 'User not found' };
      }

      if (user.mfaEnabled) {
        return { valid: false, error: 'MFA already enabled' };
      }

      if (!user.mfaSecret) {
        return { valid: false, error: 'MFA secret not found. Please generate secret first.' };
      }

      // Verify token
      const isValid = this.verifyToken(user.mfaSecret, token);

      if (!isValid) {
        return { valid: false, error: 'Invalid verification code' };
      }

      // Enable MFA
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
          mfaBackupCodes: this.generateBackupCodes(),
        },
      });

      return { valid: true, userId };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Failed to enable MFA' 
      };
    }
  }

  /**
   * Disable MFA for user
   */
  static async disableMFA(userId: string, token: string): Promise<MFAVerification> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { mfaSecret: true, mfaEnabled: true },
      });

      if (!user) {
        return { valid: false, error: 'User not found' };
      }

      if (!user.mfaEnabled) {
        return { valid: false, error: 'MFA not enabled' };
      }

      // Verify token
      const isValid = this.verifyToken(user.mfaSecret!, token);

      if (!isValid) {
        return { valid: false, error: 'Invalid verification code' };
      }

      // Disable MFA
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: { set: [] },
        },
      });

      return { valid: true, userId };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Failed to disable MFA' 
      };
    }
  }

  /**
   * Verify MFA during login
   */
  static async verifyLoginMFA(userId: string, token: string): Promise<MFAVerification> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { mfaSecret: true, mfaEnabled: true, mfaBackupCodes: true },
      });

      if (!user) {
        return { valid: false, error: 'User not found' };
      }

      if (!user.mfaEnabled) {
        // MFA not enabled, skip verification
        return { valid: true, userId };
      }

      if (!user.mfaSecret) {
        return { valid: false, error: 'MFA secret not found' };
      }

      // Check if token is a backup code
      const backupCodes = user.mfaBackupCodes as string[] | null;
      if (backupCodes) {
        const isBackupCode = backupCodes.some(
          (code) => code === token.replace(/-/g, '')
        );

        if (isBackupCode) {
          // Remove used backup code
          const remainingCodes = backupCodes.filter(
            (code) => code !== token.replace(/-/g, '')
          );

          await prisma.user.update({
            where: { id: userId },
            data: {
              mfaBackupCodes: remainingCodes,
            },
          });

          return { valid: true, userId };
        }
      }

      // Verify TOTP
      const isValid = this.verifyToken(user.mfaSecret, token);

      if (!isValid) {
        return { valid: false, error: 'Invalid verification code' };
      }

      return { valid: true, userId };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'MFA verification failed' 
      };
    }
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase() +
        Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();

      // Format as XXXX-XXXX
      codes.push(`${code.substring(0, 4)}-${code.substring(4)}`);
    }

    return codes;
  }

  /**
   * Check if user has MFA enabled
   */
  static async isMFAEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    });

    return user?.mfaEnabled ?? false;
  }

  /**
   * Get MFA status for user
   */
  static async getMFAStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesRemaining: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true, mfaBackupCodes: true },
    });

    const backupCodes = user?.mfaBackupCodes as string[] | null;

    return {
      enabled: user?.mfaEnabled ?? false,
      backupCodesRemaining: backupCodes?.length ?? 0,
    };
  }
}

export default MFAService;
