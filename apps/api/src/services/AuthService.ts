import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { config } from '@vantage/config';

const JWT_SECRET = config.auth.jwtSecret;
const JWT_EXPIRES_IN = config.auth.jwtExpiresIn;
const ENCRYPTION_KEY = config.security.encryptionKey;

/**
 * 🔒 SECURITY FIX C-02 & C-05: Configuration Validation
 * Validates all authentication and encryption secrets at startup
 */
export class ConfigurationValidator {
  private static readonly WEAK_SECRETS = [
    'secret', 'password', 'jwt_secret', 'your_jwt_secret', 
    'change_this', 'your_secret', 'encryption_key', 'your-encryption-key',
    'your-openai-api-key', 'your_secure_password_here', 'your_secure_redis_password_here',
    'your_secure_turn_password', 'your-aws-access-key', 'your-aws-secret-key',
    'your-openai-api-key', 'your-email-password', 'your-email@gmail.com',
    'your-access-key', 'your-secret-key', 'your-32-character-encryption-key-here-change-this'
  ];

  /**
   * Validate all configuration at application startup
   */
  static validateAll(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate JWT Secret
    const jwtResult = this.validateJwtSecret();
    if (!jwtResult.valid) {
      errors.push(...jwtResult.errors);
    }

    // Validate Encryption Key
    const encryptionResult = this.validateEncryptionKey();
    if (!encryptionResult.valid) {
      errors.push(...encryptionResult.errors);
    }

    // Validate Redis Password
    const redisResult = this.validateRedisPassword();
    if (!redisResult.valid) {
      errors.push(...redisResult.errors);
    }

    // Validate Database URL
    const dbResult = this.validateDatabaseUrl();
    if (!dbResult.valid) {
      errors.push(...dbResult.errors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 🔒 SECURITY FIX C-02: Validate JWT Secret
   */
  static validateJwtSecret(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!JWT_SECRET) {
      errors.push('JWT_SECRET is not configured. Set JWT_SECRET environment variable.');
      return { valid: false, errors };
    }

    if (JWT_SECRET.length < 32) {
      errors.push(`JWT_SECRET must be at least 32 characters (current: ${JWT_SECRET.length}). Use: openssl rand -base64 32`);
    }

    // Check for weak/common secrets
    if (this.WEAK_SECRETS.some(weak => JWT_SECRET.toLowerCase().includes(weak))) {
      errors.push('JWT_SECRET is too weak. Do not use example values. Generate a random 32+ character string.');
    }

    // Check entropy (simplified)
    const uniqueChars = new Set(JWT_SECRET).size;
    if (uniqueChars < 10) {
      errors.push(`JWT_SECRET lacks complexity (only ${uniqueChars} unique characters). Use mixed case, numbers, and symbols.`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 🔒 SECURITY FIX C-05: Validate Encryption Key
   */
  static validateEncryptionKey(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!ENCRYPTION_KEY) {
      errors.push('ENCRYPTION_KEY is not configured. Set ENCRYPTION_KEY environment variable.');
      return { valid: false, errors };
    }

    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');

    if (keyBuffer.length !== 32) {
      errors.push(
        `ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). ` +
        `Current length: ${keyBuffer.length} bytes. ` +
        `Generate with: crypto.randomBytes(32).toString('hex')`
      );
    }

    // Validate it's valid hex
    if (!/^[0-9a-fA-F]{64}$/.test(ENCRYPTION_KEY)) {
      errors.push('ENCRYPTION_KEY must be a valid 64-character hex string (0-9, a-f).');
    }

    // Check for weak keys
    if (this.WEAK_SECRETS.some(weak => ENCRYPTION_KEY.toLowerCase().includes(weak))) {
      errors.push('ENCRYPTION_KEY is too weak. Generate a random 64-character hex string.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate Redis Password
   */
  static validateRedisPassword(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const redisPassword = config.redis.password;

    if (!redisPassword || redisPassword.includes('your_secure_redis')) {
      errors.push('REDIS_PASSWORD is not configured or uses default value. Set a strong password.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate Database URL
   */
  static validateDatabaseUrl(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const dbUrl = config.database.url;

    if (!dbUrl || dbUrl.includes('your_secure_password')) {
      errors.push('DATABASE_URL is not configured or uses placeholder value. Set actual database credentials.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate secure JWT secret
   */
  static generateJwtSecret(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Generate secure encryption key
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Authentication Service
 * Handles JWT, password hashing, and session management
 */
export class AuthService {
  // Expose ConfigurationValidator as static property
  static ConfigurationValidator = ConfigurationValidator;

  /**
   * Generate JWT access token
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(): string {
    return uuidv4();
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken();
    
    // Calculate expiry in seconds
    const expiresIn = this.parseExpiresIn(JWT_EXPIRES_IN);
    
    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode token without verification
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Hash refresh token for storage
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Encrypt sensitive data (E2EE)
   */
  static encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data (E2EE)
   */
  static decrypt(encryptedData: string): string | null {
    try {
      const parts = encryptedData.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(ENCRYPTION_KEY, 'hex'),
        iv
      );
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate room access code (E2EE key exchange)
   */
  static generateRoomKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Parse expires_in string to seconds
   */
  private static parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60; // Default 7 days
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return value * 24 * 60 * 60;
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Generate session fingerprint
   */
  static generateSessionFingerprint(userAgent: string, ipAddress: string): string {
    return crypto
      .createHash('sha256')
      .update(`${userAgent}:${ipAddress}`)
      .digest('hex')
      .substring(0, 16);
  }
}

export default AuthService;
