import crypto from 'crypto';

/**
 * End-to-End Encryption Service
 * Implements E2EE for WebRTC media streams using DTLS-SRTP
 */
export class E2EEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16;
  private readonly authTagLength = 16;

  /**
   * Generate encryption key pair for room
   */
  generateRoomKeys(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'P-256',
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Generate shared secret from key exchange
   */
  deriveSharedSecret(privateKey: string, publicKey: string): Buffer {
    const derivedKey = crypto.diffieHellman({
      privateKey,
      publicKey,
    });

    return crypto.createHash('sha256').update(derivedKey).digest();
  }

  /**
   * Generate random encryption key
   */
  generateEncryptionKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(plaintext: string, key: string): {
    ciphertext: string;
    iv: string;
    authTag: string;
  } {
    const keyBuffer = Buffer.from(key, 'hex');
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv, {
      authTagLength: this.authTagLength,
    });

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
      ciphertext,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(
    ciphertext: string,
    key: string,
    iv: string,
    authTag: string
  ): string | null {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      const authTagBuffer = Buffer.from(authTag, 'hex');
      const ciphertextBuffer = Buffer.from(ciphertext, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, ivBuffer, {
        authTagLength: this.authTagLength,
      });

      decipher.setAuthTag(authTagBuffer);

      let plaintext = decipher.update(ciphertextBuffer);
      plaintext = Buffer.concat([plaintext, decipher.final()]);

      return plaintext.toString('utf8');
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Generate E2EE key for room participants
   * Keys are exchanged via secure signaling channel
   */
  async generateParticipantKeys(
    participantCount: number
  ): Promise<Array<{ participantId: string; key: string }>> {
    const keys = [];

    for (let i = 0; i < participantCount; i++) {
      keys.push({
        participantId: `participant-${crypto.randomBytes(8).toString('hex')}`,
        key: this.generateEncryptionKey(),
      });
    }

    return keys;
  }

  /**
   * Encrypt media frame (for insertable streams)
   */
  encryptFrame(frame: Uint8Array, key: string): Uint8Array {
    const keyBuffer = Buffer.from(key, 'hex');
    const iv = crypto.randomBytes(12); // 96-bit IV for SRTP

    const cipher = crypto.createCipheriv('aes-128-gcm', keyBuffer.slice(0, 16), iv);

    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(frame)),
      cipher.final(),
      cipher.getAuthTag(),
      iv,
    ]);

    return new Uint8Array(encrypted);
  }

  /**
   * Decrypt media frame (for insertable streams)
   */
  decryptFrame(encryptedFrame: Uint8Array, key: string): Uint8Array | null {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      
      // Extract IV from end of frame (last 12 bytes)
      const iv = Buffer.from(encryptedFrame.slice(-12));
      // Extract auth tag (16 bytes before IV)
      const authTag = Buffer.from(encryptedFrame.slice(-28, -12));
      // Extract ciphertext (everything before auth tag)
      const ciphertext = Buffer.from(encryptedFrame.slice(0, -28));

      const decipher = crypto.createDecipheriv('aes-128-gcm', keyBuffer.slice(0, 16), iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return new Uint8Array(decrypted);
    } catch (error) {
      console.error('Frame decryption failed:', error);
      return null;
    }
  }

  /**
   * Hash password for secure room access
   */
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const saltValue = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, saltValue, 100000, 64, 'sha512').toString('hex');
    
    return { hash, salt: saltValue };
  }

  /**
   * Verify password hash
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hashPassword(password, salt);
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(computedHash, 'hex')
    );
  }

  /**
   * Generate secure room access code
   */
  generateAccessCode(length: number = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    let code = '';
    const randomValues = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      code += chars[randomValues[i] % chars.length];
    }
    
    return code;
  }

  /**
   * Create HMAC signature for message integrity
   */
  signMessage(message: string, key: string): string {
    return crypto
      .createHmac('sha256', key)
      .update(message)
      .digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifySignature(message: string, signature: string, key: string): boolean {
    const expectedSignature = this.signMessage(message, key);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

export default E2EEncryptionService;
