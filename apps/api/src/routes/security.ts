import { Router, Response } from 'express';
import { z } from 'zod';
import E2EEncryptionService from '../services/E2EEncryptionService';
import GDPRRepository from '../repositories/GDPRRepository';
import AuthMiddleware from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();
const e2eService = new E2EEncryptionService();

// Validation schemas
const exportDataSchema = z.object({
  email: z.string().email(),
});

const consentSchema = z.object({
  consentType: z.enum([
    'marketing',
    'analytics',
    'recording',
    'transcription',
    'data_processing',
  ]),
  granted: z.boolean(),
});

/**
 * ============================================
 * E2EE Routes
 * ============================================
 */

/**
 * POST /api/v1/security/e2ee/keys
 * Generate E2EE keys for room
 */
router.post('/e2ee/keys', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { participantCount = 2 } = req.body;

    const keys = await e2eService.generateParticipantKeys(participantCount);

    res.json({
      success: true,
      data: { keys },
    });
  } catch (error: any) {
    console.error('Error generating keys:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate keys' },
    });
  }
});

/**
 * POST /api/v1/security/e2ee/encrypt
 * Encrypt data
 */
router.post('/e2ee/encrypt', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { plaintext, key } = req.body;

    if (!plaintext || !key) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'plaintext and key are required' },
      });
      return;
    }

    const encrypted = e2eService.encrypt(plaintext, key);

    res.json({
      success: true,
      data: encrypted,
    });
  } catch (error: any) {
    console.error('Error encrypting:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to encrypt' },
    });
  }
});

/**
 * POST /api/v1/security/e2ee/decrypt
 * Decrypt data
 */
router.post('/e2ee/decrypt', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { ciphertext, key, iv, authTag } = req.body;

    if (!ciphertext || !key || !iv || !authTag) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'All fields are required' },
      });
      return;
    }

    const decrypted = e2eService.decrypt(ciphertext, key, iv, authTag);

    if (decrypted === null) {
      res.status(400).json({
        success: false,
        error: { code: 'DECRYPTION_FAILED', message: 'Failed to decrypt' },
      });
      return;
    }

    res.json({
      success: true,
      data: { plaintext: decrypted },
    });
  } catch (error: any) {
    console.error('Error decrypting:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to decrypt' },
    });
  }
});

/**
 * POST /api/v1/security/e2ee/room-key
 * Generate secure room access code
 */
router.post('/e2ee/room-key', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { length = 8 } = req.body;
    const accessCode = e2eService.generateAccessCode(length);

    res.json({
      success: true,
      data: { accessCode },
    });
  } catch (error: any) {
    console.error('Error generating access code:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate access code' },
    });
  }
});

/**
 * ============================================
 * GDPR Routes
 * ============================================
 */

/**
 * POST /api/v1/gdpr/export
 * Request data export
 */
router.post('/export', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    exportDataSchema.parse(req.body);
    const requestId = await GDPRRepository.createExportRequest(req.user.userId);

    // Process export asynchronously
    GDPRRepository.processExport(requestId).catch(console.error);

    res.json({
      success: true,
      data: {
        requestId,
        message: 'Export request created. You will be notified when ready.',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.errors },
      });
      return;
    }

    console.error('Error creating export request:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create export request' },
    });
  }
});

/**
 * GET /api/v1/gdpr/export/:requestId
 * Get export data
 */
router.get('/export/:requestId', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;

    const request = await prisma.dataExportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Export request not found' },
      });
      return;
    }

    if (request.status !== 'READY') {
      res.json({
        success: true,
        data: {
          requestId,
          status: request.status,
          message: 'Export is being processed. Please try again later.',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        exportUrl: request.exportUrl,
        expiresAt: request.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Error getting export data:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * DELETE /api/v1/gdpr/account
 * Delete user account (Right to be Forgotten)
 */
router.delete('/account', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    await GDPRRepository.deleteUser(req.user.userId);

    res.json({
      success: true,
      data: { message: 'Account deleted successfully' },
    });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * POST /api/v1/gdpr/consent
 * Record user consent
 */
router.post('/consent', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const { consentType, granted } = consentSchema.parse(req.body);

    const consent = await GDPRRepository.recordConsent({
      userId: req.user.userId,
      consentType,
      granted,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: consent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.errors },
      });
      return;
    }

    console.error('Error recording consent:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to record consent' },
    });
  }
});

/**
 * GET /api/v1/gdpr/consent
 * Get user consents
 */
router.get('/consent', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const consents = await GDPRRepository.getUserConsents(req.user.userId);

    res.json({
      success: true,
      data: consents,
    });
  } catch (error: any) {
    console.error('Error getting consents:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * DELETE /api/v1/gdpr/consent/:consentType
 * Withdraw consent
 */
router.delete('/consent/:consentType', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const { consentType } = req.params;

    await GDPRRepository.withdrawConsent(req.user.userId, consentType);

    res.json({
      success: true,
      data: { message: 'Consent withdrawn successfully' },
    });
  } catch (error: any) {
    console.error('Error withdrawing consent:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

/**
 * GET /api/v1/gdpr/audit
 * Get consent audit log
 */
router.get('/audit', AuthMiddleware.protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const auditLog = await GDPRRepository.getConsentAuditLog(req.user.userId);

    res.json({
      success: true,
      data: auditLog,
    });
  } catch (error: any) {
    console.error('Error getting audit log:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

// Import prisma for the export route
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default router;
