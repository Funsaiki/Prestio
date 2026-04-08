import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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
const adminAuth = getAuth();

async function verifyAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return null;
  }
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    res.status(401).json({ error: 'Invalid authorization token' });
    return null;
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uid = await verifyAuth(req, res);
  if (!uid) return;

  try {
    const { stripeCustomerId, returnUrl } = req.body;

    if (!stripeCustomerId) {
      return res.status(400).json({ error: 'Missing customer ID' });
    }

    // Verify the user owns a salon with this Stripe customer
    const salonsSnapshot = await db.collection('salons')
      .where('stripeCustomerId', '==', stripeCustomerId)
      .where('createdBy', '==', uid)
      .limit(1)
      .get();

    if (salonsSnapshot.empty) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || '/',
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
}
