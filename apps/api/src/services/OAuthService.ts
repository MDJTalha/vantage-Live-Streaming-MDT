import crypto from 'crypto';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface OAuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: string;
}

/**
 * OAuth Service
 * Handles Google and Microsoft authentication
 */
export class OAuthService {
  private static readonly GOOGLE_CONFIG: OAuthConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/oauth/google/callback',
  };

  private static readonly MICROSOFT_CONFIG: OAuthConfig = {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    callbackUrl: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/oauth/microsoft/callback',
  };

  /**
   * Generate PKCE code verifier
   */
  static generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge
   */
  static generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  /**
   * Generate state parameter for CSRF protection
   */
  static generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get Google OAuth authorization URL
   */
  static getGoogleAuthUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.GOOGLE_CONFIG.clientId,
      redirect_uri: this.GOOGLE_CONFIG.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Get Microsoft OAuth authorization URL
   */
  static getMicrosoftAuthUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.MICROSOFT_CONFIG.clientId,
      redirect_uri: this.MICROSOFT_CONFIG.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile offline_access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange code for tokens (Google)
   */
  static async exchangeGoogleCode(code: string, verifier: string): Promise<{
    idToken: string;
    accessToken: string;
    refreshToken?: string;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.GOOGLE_CONFIG.clientId,
        client_secret: this.GOOGLE_CONFIG.clientSecret,
        code,
        redirect_uri: this.GOOGLE_CONFIG.callbackUrl,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange Google code');
    }

    const data = await response.json();
    return {
      idToken: data.id_token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  /**
   * Exchange code for tokens (Microsoft)
   */
  static async exchangeMicrosoftCode(code: string, verifier: string): Promise<{
    idToken: string;
    accessToken: string;
    refreshToken?: string;
  }> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.MICROSOFT_CONFIG.clientId,
        client_secret: this.MICROSOFT_CONFIG.clientSecret,
        code,
        redirect_uri: this.MICROSOFT_CONFIG.callbackUrl,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange Microsoft code');
    }

    const data = await response.json();
    return {
      idToken: data.id_token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  /**
   * Decode and verify ID token
   */
  static async verifyIdToken(idToken: string, provider: string): Promise<OAuthUser> {
    try {
      // Decode JWT (base64url encoded)
      const parts = idToken.split('.');
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf8')
      );

      // Verify issuer
      if (provider === 'google') {
        if (payload.iss !== 'https://accounts.google.com' && 
            payload.iss !== 'accounts.google.com') {
          throw new Error('Invalid Google token issuer');
        }
      } else if (provider === 'microsoft') {
        if (!payload.iss.includes('login.microsoftonline.com')) {
          throw new Error('Invalid Microsoft token issuer');
        }
      }

      // Verify expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('Token has expired');
      }

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatar: payload.picture || payload.photo,
        provider,
      };
    } catch (error) {
      throw new Error('Invalid ID token');
    }
  }

  /**
   * Get user info from access token (Google)
   */
  static async getGoogleUserInfo(accessToken: string): Promise<OAuthUser> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Google user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatar: data.picture,
      provider: 'google',
    };
  }

  /**
   * Get user info from access token (Microsoft)
   */
  static async getMicrosoftUserInfo(accessToken: string): Promise<OAuthUser> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Microsoft user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.mail || data.userPrincipalName,
      name: data.displayName,
      avatar: undefined,
      provider: 'microsoft',
    };
  }

  /**
   * Check if OAuth is configured
   */
  static isGoogleConfigured(): boolean {
    return !!(this.GOOGLE_CONFIG.clientId && this.GOOGLE_CONFIG.clientSecret);
  }

  static isMicrosoftConfigured(): boolean {
    return !!(this.MICROSOFT_CONFIG.clientId && this.MICROSOFT_CONFIG.clientSecret);
  }
}

export default OAuthService;
