/**
 * MFA Service - Frontend API Client
 * Handles Multi-Factor Authentication setup and management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface MFAStatus {
  enabled: boolean;
  enabledAt?: string;
  method: 'totp' | 'sms' | 'email';
  backupCodesRemaining?: number;
}

export interface MFASecret {
  secret: string;
  qrCode: string;
  otpauthUrl: string;
  instructions: string;
}

export interface MFAEnableResponse {
  message: string;
  backupCodes: string[];
  warning: string;
}

class MFAService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Generate MFA secret and QR code
   */
  async generateSecret(): Promise<MFASecret> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/mfa/generate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate MFA secret');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Enable MFA with verification token
   */
  async enableMFA(token: string): Promise<MFAEnableResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/mfa/enable`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to enable MFA');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Disable MFA
   */
  async disableMFA(token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/mfa/disable`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to disable MFA');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get MFA status
   */
  async getStatus(): Promise<MFAStatus> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/mfa/status`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get MFA status');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Verify MFA token (for login flow)
   */
  async verifyToken(userId: string, token: string): Promise<{ valid: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/mfa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to verify MFA token');
    }

    const result = await response.json();
    return result.data;
  }
}

export const mfaService = new MFAService();
export default mfaService;
