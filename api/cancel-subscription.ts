import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { verifyAuth, db } from './_utils/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await verifyAuth(req, res);
  if (!uid) return;

  try {
    const { stripeSubscriptionId, salonId } = req.body;

    if (!stripeSubscriptionId || !salonId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify the user owns this salon
    const salonDoc = await db.collection('salons').doc(salonId).get();
    if (!salonDoc.exists || salonDoc.data()?.createdBy !== uid) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end as number;
    const cancelAt = periodEnd ? new Date(periodEnd * 1000) : null;

    await db.collection('salons').doc(salonId).update({
      subscriptionEndsAt: cancelAt,
      cancelAtPeriodEnd: true,
    });

    return res.status(200).json({
      status: 'canceled',
      cancelAt: cancelAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}
