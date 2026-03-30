import E2EEncryptionService from '../../apps/api/src/services/E2EEncryptionService';

describe('E2EEncryptionService', () => {
  let service: E2EEncryptionService;

  beforeEach(() => {
    service = new E2EEncryptionService();
  });

  describe('generateEncryptionKey', () => {
    it('should generate a 64-character hex key (256 bits)', () => {
      const key = service.generateEncryptionKey();
      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique keys each time', () => {
      const key1 = service.generateEncryptionKey();
      const key2 = service.generateEncryptionKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt data correctly', () => {
      const key = service.generateEncryptionKey();
      const plaintext = 'Hello, VANTAGE!';

      const encrypted = service.encrypt(plaintext, key);
      
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();

      const decrypted = service.decrypt(
        encrypted.ciphertext,
        key,
        encrypted.iv,
        encrypted.authTag
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should fail to decrypt with wrong key', () => {
      const key1 = service.generateEncryptionKey();
      const key2 = service.generateEncryptionKey();
      const plaintext = 'Secret message';

      const encrypted = service.encrypt(plaintext, key1);
      const decrypted = service.decrypt(
        encrypted.ciphertext,
        key2,
        encrypted.iv,
        encrypted.authTag
      );

      expect(decrypted).toBeNull();
    });

    it('should fail to decrypt with tampered ciphertext', () => {
      const key = service.generateEncryptionKey();
      const plaintext = 'Secret message';

      const encrypted = service.encrypt(plaintext, key);
      const tamperedCiphertext = encrypted.ciphertext + 'tampered';
      
      const decrypted = service.decrypt(
        tamperedCiphertext,
        key,
        encrypted.iv,
        encrypted.authTag
      );

      expect(decrypted).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should generate hash and salt', () => {
      const password = 'SecurePassword123!';
      const { hash, salt } = service.hashPassword(password);

      expect(hash).toHaveLength(128);
      expect(salt).toHaveLength(32);
    });

    it('should generate different salts for same password', () => {
      const password = 'SecurePassword123!';
      const { salt: salt1 } = service.hashPassword(password);
      const { salt: salt2 } = service.hashPassword(password);

      expect(salt1).not.toBe(salt2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', () => {
      const password = 'SecurePassword123!';
      const { hash, salt } = service.hashPassword(password);

      const isValid = service.verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', () => {
      const password = 'SecurePassword123!';
      const { hash, salt } = service.hashPassword(password);

      const isValid = service.verifyPassword('WrongPassword', hash, salt);
      expect(isValid).toBe(false);
    });
  });

  describe('generateAccessCode', () => {
    it('should generate code of specified length', () => {
      const code = service.generateAccessCode(8);
      expect(code).toHaveLength(8);
    });

    it('should only contain uppercase letters and numbers', () => {
      const code = service.generateAccessCode(10);
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });

    it('should exclude confusing characters', () => {
      const code = service.generateAccessCode(20);
      expect(code).not.toMatch(/[IO1L0]/);
    });
  });

  describe('signMessage/verifySignature', () => {
    it('should create and verify signature', () => {
      const key = service.generateEncryptionKey();
      const message = 'Important message';

      const signature = service.signMessage(message, key);
      const isValid = service.verifySignature(message, signature, key);

      expect(isValid).toBe(true);
    });

    it('should fail verification for tampered message', () => {
      const key = service.generateEncryptionKey();
      const message = 'Important message';
      const tamperedMessage = 'Tampered message';

      const signature = service.signMessage(message, key);
      const isValid = service.verifySignature(tamperedMessage, signature, key);

      expect(isValid).toBe(false);
    });
  });
});
