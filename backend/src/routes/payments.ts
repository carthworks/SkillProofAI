import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'razorpay_secret_placeholder';

// Tier pricing in paise
const TIER_PRICING: Record<string, number> = {
  basic: 19900,    // ₹199
  advanced: 49900, // ₹499
};

// ─── POST /api/payments/create-order ─────────────────────────────────────────
// Creates a Razorpay order for tier unlock
router.post('/create-order', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId!;
    const { tier } = req.body as { tier: 'basic' | 'advanced' };

    if (!['basic', 'advanced'].includes(tier)) {
      return res.status(400).json({ error: 'tier must be basic or advanced' });
    }

    const amount = TIER_PRICING[tier];

    // Create Razorpay order via REST API
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `tf_${userId}_${tier}_${Date.now()}`,
        notes: { userId, tier },
      }),
    });

    if (!razorpayRes.ok) {
      const errBody = await razorpayRes.text();
      console.error('[Payments] Razorpay order creation failed:', errBody);
      // For demo/dev without real Razorpay creds, return a mock order
      const mockOrder = {
        id: `order_mock_${Date.now()}`,
        amount,
        currency: 'INR',
        receipt: `tf_${userId}_${tier}`,
      };
      await prisma.paymentOrder.create({
        data: { userId, razorpayId: mockOrder.id, amount, tier, status: 'created' },
      });
      return res.json({
        orderId: mockOrder.id,
        amount,
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID,
        tier,
        mock: true,
      });
    }

    const order = await razorpayRes.json() as { id: string; amount: number; currency: string };

    // Save order to DB
    await prisma.paymentOrder.create({
      data: { userId, razorpayId: order.id, amount, tier, status: 'created' },
    });

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
      tier,
    });
  } catch (err) {
    console.error('[Payments] create-order error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/payments/verify ───────────────────────────────────────────────
// Verifies Razorpay payment signature and unlocks tier
router.post('/verify', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId!;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tier, mock } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // For mock orders (dev/demo without real Razorpay creds), skip signature check
    if (!mock) {
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment signature verification failed' });
      }
    }

    // Update payment order status
    await prisma.paymentOrder.updateMany({
      where: { razorpayId: razorpay_order_id, userId },
      data: { status: 'paid' },
    });

    // Unlock tier on user
    await prisma.user.update({
      where: { id: userId },
      data: { unlockedTier: tier || 'basic' },
    });

    // Send in-app notification
    await prisma.notification.create({
      data: {
        userId,
        title: `🎉 ${tier === 'advanced' ? 'Advanced' : 'Basic'} Tier Unlocked!`,
        message: `You now have access to ${tier === 'advanced' ? 'all Architect-level problems + Expert Human Review' : 'all Explorer & Builder problems'}. Start solving!`,
        type: 'TIER_UNLOCK',
      },
    });

    return res.json({
      ok: true,
      unlockedTier: tier || 'basic',
      message: `${tier === 'advanced' ? 'Advanced' : 'Basic'} tier unlocked successfully`,
    });
  } catch (err) {
    console.error('[Payments] verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/payments/status ─────────────────────────────────────────────────
// Returns current user's unlocked tier and payment history
router.get('/status', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { unlockedTier: true, freeChallengesUsed: true },
    });
    const orders = await prisma.paymentOrder.findMany({
      where: { userId, status: 'paid' },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ unlockedTier: user?.unlockedTier || 'free', orders });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
