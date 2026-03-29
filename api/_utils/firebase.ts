import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const db = getFirestore();
export const adminAuth = getAuth();

export async function verifyAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
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
