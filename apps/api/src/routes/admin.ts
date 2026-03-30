import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { AuthMiddleware } from '../middleware/auth';
import { BillingService } from '../services/BillingService';
// import { sendEmail, generatePasswordResetEmail } from '../utils/email';
import { sendEmail } from '../utils/email';

const router = Router();
const billingService = new BillingService();

// ============================================
// Organization Management
// ============================================

/**
 * GET /api/v1/admin/organizations
 * List all organizations with subscription info
 */
router.get('/organizations', AuthMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, search, tier } = req.query;
    const skip = ((Number(page) || 1) - 1) * (Number(limit) || 50);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { slug: { contains: String(search), mode: 'insensitive' } },
        { billingEmail: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (tier) {
      where.subscriptionTier = String(tier);
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          subscription: true,
          users: { select: { id: true, email: true, role: true, createdAt: true } },
          _count: { select: { rooms: true } },
        },
        skip,
        take: Number(limit) || 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.organization.count({ where }),
    ]);

    res.json({
      data: organizations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / (Number(limit) || 50)),
      },
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch organizations' } });
  }
});

/**
 * GET /api/v1/admin/organizations/:id
 * Get single organization details
 */
router.get('/organizations/:id', AuthMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: {
        subscription: true,
        users: { select: { id: true, email: true, role: true, createdAt: true } },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
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
 * PATCH /api/v1/admin/organizations/:id/tier
 * Change organization subscription tier
 */
router.patch('/organizations/:id/tier', AuthMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const { tier } = req.body;

    if (!['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(tier)) {
      return res.status(400).json({ error: { code: 'INVALID_TIER', message: 'Invalid subscription tier' } });
    }

    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
      include: { subscription: true },
    });

    if (!org) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Organization not found' } });
    }

    let result: any;

    if (tier === 'FREE') {
      // Cancel existing subscription
      if (org.subscription?.stripeSubscriptionId) {
        await billingService.cancelSubscription(org.id);
      }
      result = await prisma.organization.update({
        where: { id: req.params.id },
        data: { subscriptionTier: 'FREE' },
        include: { subscription: true },
      });
    } else if (org.subscription) {
      // Upgrade existing subscription
      result = await billingService.upgradeSubscription(org.id, tier);
    } else {
      // Create new subscription
      result = await billingService.createSubscription(org.id, tier);
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Error updating tier:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update tier' } });
  }
});

/**
 * DELETE /api/v1/admin/organizations/:id
 * Delete organization (soft delete)
 */
router.delete('/organizations/:id', AuthMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id },
    });

    if (!org) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Organization not found' } });
    }

    // Check if should actually delete or if we should keep it for audit
    // For now, we'll just remove it
    await prisma.organization.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to delete organization' } });
  }
});

// ============================================
// Invoices & Billing
// ============================================

/**
 * GET /api/v1/admin/invoices
 * List all invoices
 */
router.get('/invoices', AuthMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, status, organizationId } = req.query;
    const skip = ((Number(page) || 1) - 1) * (Number(limit) || 50);

    const where: any = {};

    if (status) {
      where.status = String(status);
    }

    if (organizationId) {
      where.organizationId = String(organizationId);
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { organization: { select: { name: true, slug: true } } },
        skip,
        take: Number(limit) || 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      data: invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / (Number(limit) || 50)),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch invoices' } });
  }
});

/**
 * POST /api/v1/admin/invoices/:id/send
 * Send invoice to client
 */
router.post('/invoices/:id/send', AuthMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { organization: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    }

    if (!invoice.pdfUrl) {
      return res.status(400).json({ error: { code: 'NO_PDF', message: 'Invoice PDF not available' } });
    }

    // Send email
    await sendEmail({
      to: invoice.organization.billingEmail,
      subject: `Invoice ${invoice.invoiceNumber}`,
      template: 'invoice',
      data: {
        organizationName: invoice.organization.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: `${invoice.currency} ${(invoice.amount).toFixed(2)}`,
        dueDate: invoice.dueDate.toISOString().split('T')[0],
        pdfUrl: invoice.pdfUrl,
      },
    });

    // Update status
    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'SENT' },
    });

    res.json({ data: updated });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to send invoice' } });
  }
});

// ============================================
// Usage & Analytics
// ============================================

/**
 * GET /api/v1/admin/usage
 * Get system-wide usage analytics
 */
router.get('/usage', AuthMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    const date = month ? new Date(String(month)) : new Date();
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const [totalOrgs, activeOrgs, rooms, recordings, messages] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({
        where: {
          rooms: {
            some: {
              createdAt: { gte: startOfMonth, lte: endOfMonth },
            },
          },
        },
      }),
      prisma.room.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.recording.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.chatMessage.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
    ]);

    const usageByTier = await prisma.organization.groupBy({
      by: ['subscriptionTier'],
      _count: { id: true },
    });

    res.json({
      data: {
        period: { start: startOfMonth, end: endOfMonth },
        totalOrganizations: totalOrgs,
        activeOrganizations: activeOrgs,
        roomsCreated: rooms,
        recordingsCreated: recordings,
        chatMessages: messages,
        usageByTier: Object.fromEntries(usageByTier.map((ut) => [ut.subscriptionTier, ut._count.id])),
      },
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch usage data' } });
  }
});

/**
 * GET /api/v1/admin/revenue
 * Get revenue analytics
 */
router.get('/revenue', AuthMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    const date = month ? new Date(String(month)) : new Date();
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const invoices = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
      _count: { id: true },
      _avg: { amount: true },
    });

    const mrr = await prisma.subscription.aggregate({
      where: {
        status: 'ACTIVE',
        tier: { not: 'FREE' },
      },
      _count: { id: true },
    });

    res.json({
      data: {
        period: { start: startOfMonth, end: endOfMonth },
        totalRevenue: invoices._sum.amount || 0,
        totalInvoices: invoices._count || 0,
        averageInvoice: invoices._avg.amount || 0,
        activeSubscriptions: mrr._count,
        // MRR calculation (assuming different prices per tier)
        estimatedMRR: (mrr._count || 0) * 200, // Placeholder
      },
    });
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch revenue data' } });
  }
});

// ============================================
// System Health
// ============================================

/**
 * GET /api/v1/admin/health
 * System health check
 */
router.get('/health', AuthMiddleware.requireAdmin, async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Check database
    const dbHealthy = await prisma.user.count().catch(() => false);

    const responseTime = Date.now() - startTime;

    res.json({
      data: {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        database: dbHealthy ? 'connected' : 'disconnected',
        responseTime,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ error: { code: 'UNHEALTHY', message: 'System health check failed' } });
  }
});

export default router;
