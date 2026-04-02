import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import AuthMiddleware from '../middleware/auth';
// import BillingService from '../services/BillingService';
import { sendEmail } from '../utils/email';
import { validateEmail, normalizeSlug } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();
// const billingService = new BillingService();
const requireAuth = AuthMiddleware.requireAuth;

/**
 * POST /api/v1/onboarding/create-organization
 * Create a new organization (triggered on first signup)
 */
router.post('/create-organization', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { organizationName } = req.body;

    if (!organizationName || organizationName.trim().length < 2) {
      return res.status(400).json({
        error: { code: 'INVALID_NAME', message: 'Organization name must be at least 2 characters' },
      });
    }

    // Generate slug from organization name
    const baseSlug = normalizeSlug(organizationName);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug uniqueness
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create organization with current user as owner
    const org = await prisma.organization.create({
      data: {
        name: organizationName.trim(),
        slug,
        billingEmail: user.email,
        subscriptionTier: 'FREE',
        users: {
          connect: { id: user.id },
        },
      },
      include: {
        subscription: true,
        users: { select: { id: true, email: true, role: true } },
      },
    });

    // Send welcome email
    await sendEmail({
      to: user.email,
      subject: `Welcome to VANTAGE - ${organizationName}!`,
      template: 'onboarding-welcome',
      data: {
        organizationName: org.name,
        userName: user.name,
        dashboardUrl: `${process.env.APP_URL}/dashboard`,
        upgradeUrl: `${process.env.APP_URL}/account/upgrade`,
      },
    });

    res.status(201).json({ data: org });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create organization' } });
  }
});

/**
 * GET /api/v1/onboarding/my-organization
 * Get current user's organization
 */
router.get('/my-organization', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const org = await prisma.organization.findFirst({
      where: {
        users: { some: { id: user.id } },
      },
      include: {
        subscription: true,
        users: { select: { id: true, email: true, role: true, createdAt: true } },
        _count: { select: { rooms: true, apiKeys: true } },
      },
    });

    if (!org) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Organization not found' } });
    }

    res.json({ data: org });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch organization' } });
  }
});

/**
 * PATCH /api/v1/onboarding/my-organization
 * Update organization details
 */
router.patch('/my-organization', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, website, logo } = req.body;

    // Get user's organization
    const org = await prisma.organization.findFirst({
      where: { users: { some: { id: user.id } } },
    });

    if (!org) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Organization not found' } });
    }

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: {
        ...(name && { name }),
        ...(website && { website }),
        ...(logo && { logo }),
      },
      include: {
        subscription: true,
        users: { select: { id: true, email: true, role: true } },
      },
    });

    res.json({ data: updated });
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update organization' } });
  }
});

/**
 * POST /api/v1/onboarding/invite-team-member
 * Invite a user to the organization
 */
router.post('/invite-team-member', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { email, role = 'HOST' } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: { code: 'INVALID_EMAIL', message: 'Invalid email address' } });
    }

    if (!['PARTICIPANT', 'HOST', 'COHOST'].includes(role)) {
      return res.status(400).json({ error: { code: 'INVALID_ROLE', message: 'Invalid role' } });
    }

    // Get user's organization
    const org = await prisma.organization.findFirst({
      where: { users: { some: { id: user.id } } },
    });

    if (!org) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Organization not found' } });
    }

    // Check if user already exists
    let member = await prisma.user.findUnique({ where: { email } });

    if (!member) {
      // Create new user (they'll set password on first login)
      member = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          passwordHash: '', // Will be set on first login
          role,
          organizationId: org.id,
          emailVerified: false,
        },
      });
    } else {
      // Add to organization if not already
      if (member.organizationId !== org.id) {
        member = await prisma.user.update({
          where: { id: member.id },
          data: { organizationId: org.id, role },
        });
      }
    }

    // Send invitation email
    await sendEmail({
      to: email,
      subject: `Join ${org.name} on VANTAGE`,
      template: 'team-invitation',
      data: {
        organizationName: org.name,
        inviterName: user.name,
        joinUrl: `${process.env.APP_URL}/join?org=${org.slug}`,
        role,
      },
    });

    res.status(201).json({
      data: {
        id: member.id,
        email: member.email,
        name: member.name,
        role: member.role,
        inviteSent: !member.emailVerified,
      },
    });
  } catch (error) {
    console.error('Error inviting team member:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to invite team member' } });
  }
});

/**
 * POST /api/v1/onboarding/upgrade-plan
 * Upgrade organization to premium tier
 */
router.post('/upgrade-plan', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { tier } = req.body;

    if (!['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(tier)) {
      return res.status(400).json({ error: { code: 'INVALID_TIER', message: 'Invalid tier' } });
    }

    // Get user's organization
    const org = await prisma.organization.findFirst({
      where: { users: { some: { id: user.id } } },
    });

    if (!org) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Organization not found' } });
    }

    // For ENTERPRISE, return contact sales link
    if (tier === 'ENTERPRISE') {
      return res.json({
        data: {
          tier: 'ENTERPRISE',
          message: 'Please contact our sales team for enterprise pricing',
          contactUrl: `${process.env.APP_URL}/contact-sales?org=${org.slug}`,
        },
      });
    }

    // Create/upgrade Stripe subscription
    const subscription = await billingService.createSubscription(org.id, tier);

    // Send upgrade confirmation
    await sendEmail({
      to: org.billingEmail,
      subject: `Welcome to VANTAGE ${tier}!`,
      template: 'upgrade-confirmation',
      data: {
        organizationName: org.name,
        tier,
        features: getTierFeatures(tier),
        billingUrl: `${process.env.APP_URL}/account/billing`,
      },
    });

    res.json({ data: subscription });
  } catch (error) {
    console.error('Error upgrading plan:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to upgrade plan' } });
  }
});

/**
 * GET /api/v1/onboarding/setup-progress
 * Get setup progress for onboarding wizard
 */
router.get('/setup-progress', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const org = await prisma.organization.findFirst({
      where: { users: { some: { id: user.id } } },
      include: {
        users: true,
        subscription: true,
        rooms: true,
      },
    });

    if (!org) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Organization not found' } });
    }

    const progress = {
      organizationCreated: !!org.id,
      profileComplete: !!(org.name && org.website),
      teamInvited: org.users.length > 1,
      billingSetup: !!org.subscription?.stripeCustomerId,
      firstMeetingScheduled: org.rooms.length > 0,
    };

    const completionPercent = Object.values(progress).filter(Boolean).length * 20;

    res.json({
      data: {
        progress,
        completionPercent,
        nextSteps: getNextSteps(progress),
      },
    });
  } catch (error) {
    console.error('Error fetching setup progress:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch setup progress' } });
  }
});

/**
 * POST /api/v1/onboarding/complete-setup
 * Mark onboarding as complete
 */
router.post('/complete-setup', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const org = await prisma.organization.findFirst({
      where: { users: { some: { id: user.id } } },
    });

    if (!org) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Organization not found' } });
    }

    // Send "setup complete" email
    await sendEmail({
      to: org.billingEmail,
      subject: 'Your VANTAGE Setup is Complete!',
      template: 'setup-complete',
      data: {
        organizationName: org.name,
        dashboardUrl: `${process.env.APP_URL}/dashboard`,
        supportUrl: `${process.env.APP_URL}/support`,
      },
    });

    res.json({ success: true, message: 'Setup completed successfully' });
  } catch (error) {
    console.error('Error completing setup:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to complete setup' } });
  }
});

// ============================================
// Helper Functions
// ============================================

function getTierFeatures(tier: string): string[] {
  const features = {
    STARTER: [
      'Up to 50 participants',
      'Recording & playback',
      'Polls & Q&A',
      'Screen sharing',
      'Email support',
    ],
    PROFESSIONAL: [
      'Up to 500 participants',
      'All STARTER features',
      'Live transcription',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Priority chat support',
    ],
    ENTERPRISE: [
      'Unlimited participants',
      'All PROFESSIONAL features',
      'Custom integrations',
      'White-label support',
      '24/7 phone support',
      'Dedicated account manager',
    ],
  };

  return features[tier as keyof typeof features] || [];
}

function getNextSteps(progress: any): string[] {
  const steps: string[] = [];

  if (!progress.profileComplete) steps.push('Complete organization profile');
  if (!progress.teamInvited) steps.push('Invite team members');
  if (!progress.billingSetup) steps.push('Set up billing information');
  if (!progress.firstMeetingScheduled) steps.push('Schedule your first meeting');

  return steps.length ? steps : ['Enjoy your VANTAGE experience!'];
}

export default router;
