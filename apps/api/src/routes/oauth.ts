import { Router, Request, Response } from 'express';
import OAuthService from '../services/OAuthService';
import AuthService from '../services/AuthService';
import { prisma } from '../db';

const router = Router();

/**
 * GET /api/v1/auth/oauth/google
 * Initiate Google OAuth flow
 */
router.get('/google', (_req: Request, res: Response) => {
  if (!OAuthService.isGoogleConfigured()) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Google OAuth is not configured',
      },
    });
    return;
  }

  // Generate PKCE parameters
  const codeVerifier = OAuthService.generateCodeVerifier();
  const codeChallenge = OAuthService.generateCodeChallenge(codeVerifier);
  const state = OAuthService.generateState();

  // Store code verifier in session (or Redis in production)
  // For now, we'll pass it via state parameter (not recommended for production)
  const stateWithVerifier = Buffer.from(
    JSON.stringify({ state, codeVerifier })
  ).toString('base64');

  const authUrl = OAuthService.getGoogleAuthUrl(stateWithVerifier, codeChallenge);
  
  res.redirect(authUrl);
});

/**
 * GET /api/v1/auth/oauth/google/callback
 * Google OAuth callback
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing code or state parameter',
        },
      });
      return;
    }

    // Decode state to get code verifier
    const decodedState = JSON.parse(
      Buffer.from(state as string, 'base64').toString('utf8')
    );
    const { codeVerifier } = decodedState;

    // Exchange code for tokens
    const tokens = await OAuthService.exchangeGoogleCode(
      code as string,
      codeVerifier
    );

    // Verify ID token and get user info
    const oauthUser = await OAuthService.verifyIdToken(tokens.idToken, 'google');

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: oauthUser.email },
    });

    if (!user) {
      // Create new user
      const passwordHash = await AuthService.hashPassword(
        AuthService.generateRefreshToken() // Random password
      );

      user = await prisma.user.create({
        data: {
          email: oauthUser.email,
          passwordHash,
          name: oauthUser.name,
          role: 'PARTICIPANT',
        },
      });

      if (!user) throw new Error('User creation failed');
    }

    // Generate VANTAGE tokens
    const vantageTokens = AuthService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store session
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: AuthService.hashToken(vantageTokens.accessToken),
        refreshToken: crypto.randomUUID(),
        refreshTokenHash: AuthService.hashToken(vantageTokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    });

    // Redirect to frontend with tokens
    const redirectUrl = new URL(
      process.env.FRONTEND_URL || 'http://localhost:3000'
    );
    redirectUrl.pathname = '/auth/callback';
    redirectUrl.searchParams.set('accessToken', vantageTokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', vantageTokens.refreshToken);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google OAuth error:', error);
    
    const redirectUrl = new URL(
      process.env.FRONTEND_URL || 'http://localhost:3000'
    );
    redirectUrl.pathname = '/auth/error';
    redirectUrl.searchParams.set('error', 'OAuth failed');

    res.redirect(redirectUrl.toString());
  }
});

/**
 * GET /api/v1/auth/oauth/microsoft
 * Initiate Microsoft OAuth flow
 */
router.get('/microsoft', (_req: Request, res: Response) => {
  if (!OAuthService.isMicrosoftConfigured()) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Microsoft OAuth is not configured',
      },
    });
    return;
  }

  const codeVerifier = OAuthService.generateCodeVerifier();
  const codeChallenge = OAuthService.generateCodeChallenge(codeVerifier);
  const state = OAuthService.generateState();

  const stateWithVerifier = Buffer.from(
    JSON.stringify({ state, codeVerifier })
  ).toString('base64');

  const authUrl = OAuthService.getMicrosoftAuthUrl(stateWithVerifier, codeChallenge);
  
  res.redirect(authUrl);
});

/**
 * GET /api/v1/auth/oauth/microsoft/callback
 * Microsoft OAuth callback
 */
router.get('/microsoft/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing code or state parameter',
        },
      });
      return;
    }

    const decodedState = JSON.parse(
      Buffer.from(state as string, 'base64').toString('utf8')
    );
    const { codeVerifier } = decodedState;

    const tokens = await OAuthService.exchangeMicrosoftCode(
      code as string,
      codeVerifier
    );

    const oauthUser = await OAuthService.verifyIdToken(tokens.idToken, 'microsoft');

    let user = await prisma.user.findUnique({
      where: { email: oauthUser.email },
    });

    if (!user) {
      const passwordHash = await AuthService.hashPassword(
        AuthService.generateRefreshToken()
      );

      user = await prisma.user.create({
        data: {
          email: oauthUser.email,
          passwordHash,
          name: oauthUser.name,
          role: 'PARTICIPANT',
        },
      });

      if (!user) throw new Error('User creation failed');
    }

    const vantageTokens = AuthService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: AuthService.hashToken(vantageTokens.accessToken),
        refreshToken: crypto.randomUUID(),
        refreshTokenHash: AuthService.hashToken(vantageTokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
    });

    const redirectUrl = new URL(
      process.env.FRONTEND_URL || 'http://localhost:3000'
    );
    redirectUrl.pathname = '/auth/callback';
    redirectUrl.searchParams.set('accessToken', vantageTokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', vantageTokens.refreshToken);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Microsoft OAuth error:', error);
    
    const redirectUrl = new URL(
      process.env.FRONTEND_URL || 'http://localhost:3000'
    );
    redirectUrl.pathname = '/auth/error';
    redirectUrl.searchParams.set('error', 'OAuth failed');

    res.redirect(redirectUrl.toString());
  }
});

export default router;
