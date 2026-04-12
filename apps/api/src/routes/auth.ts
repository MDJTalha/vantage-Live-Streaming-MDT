import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../db/prisma';
import { config } from '@vantage/config';
import { AuthService } from '../services/AuthService';

const router = Router();

// Token generation helper
const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign(
    { userId, email },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn || '7d' } as SignOptions
  );

  const refreshToken = jwt.sign(
    { userId },
    config.auth.jwtSecret,
    { expiresIn: '30d' } as SignOptions
  );

  return { accessToken, refreshToken };
};

// Create a session record in the database
async function createSession(userId: string, refreshToken: string, req: Request) {
  const tokenHash = AuthService.hashToken(refreshToken);
  const refreshTokenHash = AuthService.hashToken(refreshToken + '-refresh');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  return prisma.session.create({
    data: {
      userId,
      tokenHash,
      refreshToken,
      refreshTokenHash,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || req.socket.remoteAddress || null,
      expiresAt,
    },
  });
}

// Delete session by refresh token
async function deleteSession(refreshToken: string) {
  const tokenHash = AuthService.hashToken(refreshToken);
  await prisma.session.deleteMany({
    where: { tokenHash },
  });
}

// Find session by refresh token
async function findSession(refreshToken: string) {
  const tokenHash = AuthService.hashToken(refreshToken);
  return prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
}

// Strip password hash from user object
function sanitizeUser(user: any) {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

// ==================== REGISTER ====================
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Email, password, and name are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters'
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user — use PARTICIPANT (valid enum), not 'USER'
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        name,
        role: 'PARTICIPANT',
        emailVerified: false,
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    // Create session record
    await createSession(user.id, refreshToken, req);

    // Return user data (without passwordHash)
    return res.status(201).json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    throw error;
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    // Create new session (don't overwrite user — sessions are separate)
    await createSession(user.id, refreshToken, req);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Return user data (without passwordHash)
    return res.json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    throw error;
  }
});

// ==================== REFRESH TOKEN ====================
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Find session in database
    const session = await findSession(refreshToken);

    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check session expiry
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ error: 'Session has expired' });
    }

    // Verify JWT on stored refresh token
    try {
      jwt.verify(refreshToken, config.auth.jwtSecret);
    } catch {
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const { accessToken } = generateTokens(session.user.id, session.user.email);

    return res.json({ accessToken });
  } catch (error) {
    throw error;
  }
});

// ==================== LOGOUT ====================
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await deleteSession(refreshToken);
    }

    return res.json({ success: true });
  } catch (error) {
    throw error;
  }
});

// ==================== GET CURRENT USER ====================
router.get('/me', async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        mfaEnabled: true,
        createdAt: true,
        lastLoginAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    throw error;
  }
});

// ==================== UPDATE PROFILE ====================
router.patch('/me', async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, avatarUrl } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(avatarUrl && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
      }
    });

    return res.json(user);
  } catch (error) {
    throw error;
  }
});

// ==================== CHANGE PASSWORD ====================
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    });

    return res.json({ success: true });
  } catch (error) {
    throw error;
  }
});

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Don't reveal if user exists — always return success
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token (JWT with short expiry)
    const resetToken = jwt.sign({ userId: user.id, type: 'password-reset' }, config.auth.jwtSecret, { expiresIn: '1h' });

    // TODO: Send email with reset token
    // await sendPasswordResetEmail(user.email, resetToken);

    return res.json({ success: true, message: 'If the email exists, a reset link has been sent', resetToken });
  } catch (error) {
    throw error;
  }
});

// ==================== RESET PASSWORD ====================
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Verify reset token
    const decoded: any = jwt.verify(token, config.auth.jwtSecret);
    if (decoded.type !== 'password-reset') {
      return res.status(401).json({ error: 'Invalid reset token' });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { passwordHash: hashedPassword },
    });

    // Invalidate all sessions (force re-login)
    await prisma.session.deleteMany({ where: { userId: decoded.userId } });

    return res.json({ success: true, message: 'Password updated successfully. Please log in again.' });
  } catch (error) {
    if ((error as any).name === 'JsonWebTokenError' || (error as any).name === 'TokenExpiredError') {
      throw error;
    }
    throw error;
  }
});

// ==================== VERIFY RESET TOKEN ====================
router.post('/verify-reset-token', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const decoded: any = jwt.verify(token, config.auth.jwtSecret);
    if (decoded.type !== 'password-reset') {
      return res.status(401).json({ valid: false, error: 'Invalid token type' });
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({ valid: false, error: 'User not found' });
    }

    return res.json({ valid: true, email: user.email });
  } catch (error) {
    throw error;
  }
});

export default router;
