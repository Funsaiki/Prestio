import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { verifyAuth } from './_utils/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

function isAllowedReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (ALLOWED_ORIGINS.length > 0) {
      return ALLOWED_ORIGINS.includes(parsed.origin);
    }
    return parsed.protocol === 'https:' || parsed.hostname === 'localhost';
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await verifyAuth(req, res);
  if (!uid) return;

  try {
    const { salonId, salonName, customerEmail, returnUrl } = req.body;

    if (!salonId || !customerEmail || !returnUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isAllowedReturnUrl(returnUrl)) {
      return res.status(400).json({ error: 'Invalid return URL' });
    }

    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    let customerId: string;

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: salonName,
        metadata: { salonId },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      metadata: { salonId },
      subscription_data: {
        metadata: { salonId },
      },
      success_url: `${returnUrl}?payment=success`,
      cancel_url: `${returnUrl}?payment=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
