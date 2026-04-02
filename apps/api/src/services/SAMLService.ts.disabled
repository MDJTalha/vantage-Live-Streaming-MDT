import { SAML } from '@node-saml/passport-saml';
import { config } from '@vantage/config';
import { prisma } from '../db';
import AuthService from './AuthService';

/**
 * 🔐 SAML SSO Service
 * Enterprise Single Sign-On integration
 * Supports: Okta, Azure AD, OneLogin, PingIdentity, ADFS
 */

export interface SAMLConfig {
  callbackUrl: string;
  entryPoint: string;
  issuer: string;
  cert: string;
  privateKey?: string;
  decryptionPvk?: string;
  signatureAlgorithm?: string;
}

export interface SAMLProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  nameID: string;
  nameIDFormat: string;
  sessionIndex?: string;
  groups?: string[];
  [key: string]: any;
}

export interface SAMLResponse {
  success: boolean;
  profile?: SAMLProfile;
  error?: string;
  logout?: boolean;
}

export class SAMLService {
  private static samlInstance: SAML;
  private static config: SAMLConfig;

  /**
   * Initialize SAML configuration
   */
  static initialize(): void {
    this.config = {
      callbackUrl: config.saml.callbackUrl || `${config.api.url}/api/v1/auth/oauth/saml/callback`,
      entryPoint: config.saml.entryPoint || '',
      issuer: config.saml.issuer || 'vantage',
      cert: config.saml.cert || '',
      signatureAlgorithm: config.saml.signatureAlgorithm || 'sha256',
    };

    this.samlInstance = new SAML(this.config);
  }

  /**
   * Get SAML instance
   */
  static getSAML(): SAML {
    if (!this.samlInstance) {
      this.initialize();
    }
    return this.samlInstance;
  }

  /**
   * Get authorization URL for SSO redirect
   */
  static async getAuthorizeUrl(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.getSAML().getAuthorizeUrlAsync({}, (err: Error, url?: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(url || '');
        }
      });
    });
  }

  /**
   * Validate SAML response from IdP
   */
  static async validateResponse(
    samlResponse: string,
    relayState?: string
  ): Promise<SAMLResponse> {
    try {
      const result = await new Promise<{ profile?: SAMLProfile; loggedOut?: boolean }>(
        (resolve, reject) => {
          this.getSAML().validatePostResponseAsync(
            { SAMLResponse: samlResponse },
            (err: Error, result?: { profile?: SAMLProfile; loggedOut?: boolean }) => {
              if (err) {
                reject(err);
              } else {
                resolve(result || {});
              }
            }
          );
        }
      );

      if (result.loggedOut) {
        return {
          success: true,
          logout: true,
        };
      }

      if (!result.profile) {
        return {
          success: false,
          error: 'No profile received from SAML IdP',
        };
      }

      return {
        success: true,
        profile: result.profile,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SAML validation failed',
      };
    }
  }

  /**
   * Get logout URL
   */
  static async getLogoutUrl(user: { id: string; email: string }): Promise<string> {
    return new Promise((resolve, reject) => {
      this.getSAML().getLogoutUrlAsync(
        {
          nameID: user.email,
          nameIDFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        },
        (err: Error, url?: string) => {
          if (err) {
            reject(err);
          } else {
            resolve(url || '');
          }
        }
      );
    });
  }

  /**
   * Get logout response URL
   */
  static async getLogoutResponseUrl(
    samlResponse: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.getSAML().getLogoutResponseUrlAsync(
        { SAMLResponse: samlResponse },
        {},
        (err: Error, url?: string) => {
          if (err) {
            reject(err);
          } else {
            resolve(url || '');
          }
        }
      );
    });
  }

  /**
   * Find or create user from SAML profile
   */
  static async findOrCreateUser(profile: SAMLProfile): Promise<{
    user: any;
    isNew: boolean;
    tokens?: any;
  }> {
    try {
      // Find existing user by email
      let user = await prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        // Update SAML info
        await prisma.user.update({
          where: { id: user.id },
          data: {
            samlNameID: profile.nameID,
            samlNameIDFormat: profile.nameIDFormat,
            lastLoginAt: new Date(),
          },
        });

        // Generate tokens
        const tokens = AuthService.generateTokens({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        return {
          user,
          isNew: false,
          tokens,
        };
      }

      // Create new user
      user = await prisma.user.create({
        data: {
          email: profile.email,
          name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email.split('@')[0],
          passwordHash: await AuthService.hashPassword(crypto.randomUUID()), // Random password
          role: 'PARTICIPANT',
          emailVerified: true, // SAML IdP verified
          samlNameID: profile.nameID,
          samlNameIDFormat: profile.nameIDFormat,
          samlProvider: config.saml.provider || 'generic',
        },
      });

      // Generate tokens
      const tokens = AuthService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        user,
        isNew: true,
        tokens,
      };
    } catch (error) {
      throw new Error(
        `Failed to find or create user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get SAML metadata (for IdP configuration)
   */
  static async getMetadata(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.getSAML().generateServiceProviderMetadata(
        (err: Error, metadata?: string) => {
          if (err) {
            reject(err);
          } else {
            resolve(metadata || '');
          }
        }
      );
    });
  }

  /**
   * Verify SAML configuration
   */
  static verifyConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.entryPoint) {
      errors.push('SAML entryPoint (IdP SSO URL) is required');
    }

    if (!this.config.issuer) {
      errors.push('SAML issuer is required');
    }

    if (!this.config.cert) {
      errors.push('SAML certificate is required');
    }

    if (!this.config.callbackUrl) {
      errors.push('SAML callback URL is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Initialize on import
SAMLService.initialize();

export default SAMLService;
