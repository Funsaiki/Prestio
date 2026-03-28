import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { stripeSubscriptionId } = req.body;

    if (!stripeSubscriptionId) {
      return res.status(400).json({ error: 'Missing subscription ID' });
    }

    // Cancel at end of current billing period
    const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end as number;

    return res.status(200).json({
      status: 'canceled',
      cancelAt: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
