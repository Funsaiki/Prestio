import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

interface TenancyMigrationResult {
  clients: {
    total: number;
    orphans: number;
    migrated: number;
  };
  prestations: {
    total: number;
    orphans: number;
    migrated: number;
  };
}

export interface OrphanUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: Date;
}

/**
 * Get users without a salonId (orphan users)
 */
export async function getOrphanUsers(): Promise<OrphanUser[]> {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const orphanUsers: OrphanUser[] = [];

  usersSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (!data.salonId && data.role !== 'super_admin') {
      orphanUsers.push({
        id: doc.id,
        email: data.email || '',
        displayName: data.displayName || '',
        role: data.role || 'owner',
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    }
  });

  return orphanUsers;
}

/**
 * Link a user to a salon
 */
export async function linkUserToSalon(userId: string, salonId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    salonId: salonId,
  });
}

/**
 * Preview orphan data (clients and prestations without salonId)
 */
export async function previewOrphanData(): Promise<TenancyMigrationResult> {
  // Count all clients
  const clientsSnapshot = await getDocs(collection(db, 'clients'));
  const totalClients = clientsSnapshot.size;

  // Count orphan clients (without salonId)
  let orphanClients = 0;
  clientsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (!data.salonId) {
      orphanClients++;
    }
  });

  // Count all prestations
  const prestationsSnapshot = await getDocs(collection(db, 'prestations'));
  const totalPrestations = prestationsSnapshot.size;

  // Count orphan prestations (without salonId)
  let orphanPrestations = 0;
  prestationsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (!data.salonId) {
      orphanPrestations++;
    }
  });

  return {
    clients: {
      total: totalClients,
      orphans: orphanClients,
      migrated: 0,
    },
    prestations: {
      total: totalPrestations,
      orphans: orphanPrestations,
      migrated: 0,
    },
  };
}

/**
 * Migrate orphan data to a specific salon
 */
export async function migrateOrphanDataToSalon(salonId: string): Promise<TenancyMigrationResult> {
  const result: TenancyMigrationResult = {
    clients: { total: 0, orphans: 0, migrated: 0 },
    prestations: { total: 0, orphans: 0, migrated: 0 },
  };

  // Get all clients
  const clientsSnapshot = await getDocs(collection(db, 'clients'));
  result.clients.total = clientsSnapshot.size;

  // Migrate orphan clients
  for (const clientDoc of clientsSnapshot.docs) {
    const data = clientDoc.data();
    if (!data.salonId) {
      result.clients.orphans++;
      await updateDoc(doc(db, 'clients', clientDoc.id), {
        salonId: salonId,
      });
      result.clients.migrated++;
    }
  }

  // Get all prestations
  const prestationsSnapshot = await getDocs(collection(db, 'prestations'));
  result.prestations.total = prestationsSnapshot.size;

  // Migrate orphan prestations
  for (const prestationDoc of prestationsSnapshot.docs) {
    const data = prestationDoc.data();
    if (!data.salonId) {
      result.prestations.orphans++;
      await updateDoc(doc(db, 'prestations', prestationDoc.id), {
        salonId: salonId,
      });
      result.prestations.migrated++;
    }
  }

  return result;
}
