import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { stripeSubscriptionId, salonId } = req.body;

    if (!stripeSubscriptionId || !salonId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end as number;
    const cancelAt = periodEnd ? new Date(periodEnd * 1000) : null;

    // Update Firestore with cancellation date
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
