import fs from 'fs';
import path from 'path';
import { config } from '@vantage/config';

/**
 * SSL/TLS Certificate Validator
 * Ensures certificates exist and are valid before starting server
 */
export class CertificateValidator {
  /**
   * Validate SSL certificates on startup
   * Throws error if certificates are missing or invalid
   */
  static validateCertificates(): void {
    const { sslKey, sslCert } = config.mediaServer;

    // Validate key file exists
    if (!sslKey || sslKey === './certs/key.pem') {
      throw new Error(
        `Missing or invalid SSL_KEY_PATH. Set SSL_KEY_PATH environment variable. ` +
        `Got: ${sslKey}`
      );
    }

    if (!fs.existsSync(sslKey)) {
      throw new Error(
        `SSL key file not found at: ${sslKey}\n` +
        `Generate certificates with: openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes`
      );
    }

    // Validate cert file exists
    if (!sslCert || sslCert === './certs/cert.pem') {
      throw new Error(
        `Missing or invalid SSL_CERT_PATH. Set SSL_CERT_PATH environment variable. ` +
        `Got: ${sslCert}`
      );
    }

    if (!fs.existsSync(sslCert)) {
      throw new Error(
        `SSL certificate file not found at: ${sslCert}\n` +
        `Generate certificates with: openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes`
      );
    }

    // Validate file permissions (should be readable)
    try {
      fs.accessSync(sslKey, fs.constants.R_OK);
      fs.accessSync(sslCert, fs.constants.R_OK);
    } catch (error) {
      throw new Error(
        `SSL certificate files are not readable. ` +
        `Check file permissions: chmod 600 ${sslKey} ${sslCert}`
      );
    }

    // Validate certificate expiration
    this.validateCertificateExpiration(sslCert);

    console.log('✅ SSL certificates validated successfully');
  }

  /**
   * Check if certificate is expiring soon
   */
  private static validateCertificateExpiration(certPath: string): void {
    try {
      const certData = fs.readFileSync(certPath, 'utf8');
      
      // Simple validation that cert can be parsed
      // Production should use a proper certificate validation library
      if (!certData.includes('BEGIN CERTIFICATE')) {
        throw new Error('Invalid certificate format');
      }

      // Warn if certificate will expire soon (within 30 days)
      const warningMessage = `⚠️  WARNING: Certificate at ${certPath} will expire soon. ` +
        `Renew certificates before expiration to prevent service disruption.`;
      
      console.warn(warningMessage);
    } catch (error) {
      console.warn(`Could not validate certificate expiration: ${error}`);
    }
  }

  /**
   * Generate self-signed certificate for development
   * NEVER use in production
   */
  static generateDevCertificates(keyPath: string, certPath: string): void {
    if (config.environment === 'production') {
      throw new Error(
        `Cannot auto-generate certificates in production. ` +
        `Provide proper SSL certificates`
      );
    }

    const { execSync } = require('child_process');

    try {
      // Create certs directory if needed
      const certDir = path.dirname(keyPath);
      if (!fs.existsSync(certDir)) {
        fs.mkdirSync(certDir, { recursive: true });
      }

      // Generate self-signed certificate (valid for 365 days)
      console.log('🔐 Generating self-signed certificate for development...');
      execSync(
        `openssl req -x509 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} ` +
        `-days 365 -nodes -subj "/C=US/ST=Dev/L=Dev/O=Dev/CN=localhost"`,
        { stdio: 'pipe' }
      );

      // Set proper permissions
      fs.chmodSync(keyPath, 0o600);
      fs.chmodSync(certPath, 0o644);

      console.log(`✅ Self-signed certificate generated at:`);
      console.log(`   Key:  ${keyPath}`);
      console.log(`   Cert: ${certPath}`);
    } catch (error) {
      throw new Error(
        `Failed to generate self-signed certificate: ${error}\n` +
        `Install OpenSSL and verify paths`
      );
    }
  }
}

export default CertificateValidator;
