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

  // Verify caller is super_admin
  const callerDoc = await db.collection('users').doc(uid).get();
  if (!callerDoc.exists || callerDoc.data()?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const { salonId } = req.body;

    if (!salonId) {
      return res.status(400).json({ error: 'Missing salonId' });
    }

    const salonDoc = await db.collection('salons').doc(salonId).get();
    if (!salonDoc.exists) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salonData = salonDoc.data()!;

    // 1. Cancel Stripe subscription if active
    if (salonData.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(salonData.stripeSubscriptionId);
      } catch (err) {
        console.error('Error canceling Stripe subscription:', err);
      }
    }

    // 2. Delete Stripe customer if exists
    if (salonData.stripeCustomerId) {
      try {
        await stripe.customers.del(salonData.stripeCustomerId);
      } catch (err) {
        console.error('Error deleting Stripe customer:', err);
      }
    }

    // 3. Delete Firebase Auth accounts for users of this salon
    const usersSnapshot = await db.collection('users')
      .where('salonId', '==', salonId)
      .get();

    for (const userDoc of usersSnapshot.docs) {
      try {
        await adminAuth.deleteUser(userDoc.id);
      } catch (err) {
        console.error(`Error deleting auth user ${userDoc.id}:`, err);
      }
      await userDoc.ref.delete();
    }

    // 4. Delete all clients and prestations
    const clientsSnapshot = await db.collection('clients')
      .where('salonId', '==', salonId)
      .get();

    const batch1 = db.batch();
    clientsSnapshot.docs.forEach((d) => batch1.delete(d.ref));
    if (clientsSnapshot.docs.length > 0) await batch1.commit();

    const prestationsSnapshot = await db.collection('prestations')
      .where('salonId', '==', salonId)
      .get();

    const batch2 = db.batch();
    prestationsSnapshot.docs.forEach((d) => batch2.delete(d.ref));
    if (prestationsSnapshot.docs.length > 0) await batch2.commit();

    // 5. Delete salon config
    try {
      await db.collection('salonConfigs').doc(salonId).delete();
    } catch (err) {
      console.error('Error deleting salon config:', err);
    }

    // 6. Delete the salon itself
    await db.collection('salons').doc(salonId).delete();

    return res.status(200).json({
      deleted: {
        users: usersSnapshot.docs.length,
        clients: clientsSnapshot.docs.length,
        prestations: prestationsSnapshot.docs.length,
        stripeSubscription: !!salonData.stripeSubscriptionId,
        stripeCustomer: !!salonData.stripeCustomerId,
      },
    });
  } catch (error) {
    console.error('Error deleting salon:', error);
    return res.status(500).json({ error: 'Failed to delete salon' });
  }
}
