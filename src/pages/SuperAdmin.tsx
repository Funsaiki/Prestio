import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, updateDoc, where, writeBatch, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Salon } from '../types/multi-tenant';
import { DEFAULT_SALON_CONFIG } from '../types/multi-tenant';

interface ClientForMigration {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  salonId: string;
}

interface OrphanedBySalonDeletion {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  salonId: string; // ID of deleted salon
}

interface UnverifiedUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

interface SalonWithStats extends Salon {
  clientCount?: number;
  prestationCount?: number;
}

export function SuperAdmin() {
  const { isSuperAdmin, switchSalon, currentSalon } = useAuth();
  const [salons, setSalons] = useState<SalonWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Migration state
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [sourceSalonId, setSourceSalonId] = useState<string>('');
  const [destSalonId, setDestSalonId] = useState<string>('');
  const [clientsToMigrate, setClientsToMigrate] = useState<ClientForMigration[]>([]);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [loadingClients, setLoadingClients] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ clients: number; prestations: number } | null>(null);

  // Orphaned clients (salon deleted) state
  const [orphanedClients, setOrphanedClients] = useState<OrphanedBySalonDeletion[]>([]);
  const [loadingOrphaned, setLoadingOrphaned] = useState(false);
  const [showOrphanedSection, setShowOrphanedSection] = useState(false);
  const [selectedOrphaned, setSelectedOrphaned] = useState<Set<string>>(new Set());
  const [orphanedDestSalonId, setOrphanedDestSalonId] = useState<string>('');

  // Missing salonConfigs state
  const [salonsWithoutConfig, setSalonsWithoutConfig] = useState<SalonWithStats[]>([]);
  const [checkingConfigs, setCheckingConfigs] = useState(false);
  const [creatingConfig, setCreatingConfig] = useState<string | null>(null);

  // Unverified users state
  const [unverifiedUsers, setUnverifiedUsers] = useState<UnverifiedUser[]>([]);
  const [loadingUnverified, setLoadingUnverified] = useState(false);
  const [verifyingUser, setVerifyingUser] = useState<string | null>(null);

  // Delete salon state
  const [deletingSalonId, setDeletingSalonId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin) loadSalons();
  }, [isSuperAdmin]);

  // Guard after hooks
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const loadSalons = async () => {
    setLoading(true);
    try {
      const [salonsSnapshot, clientsSnapshot, prestationsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'salons'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'clients')),
        getDocs(collection(db, 'prestations')),
      ]);

      // Count per salon in one pass
      const clientCounts: Record<string, number> = {};
      const prestationCounts: Record<string, number> = {};
      clientsSnapshot.docs.forEach((d) => {
        const sid = d.data().salonId;
        if (sid) clientCounts[sid] = (clientCounts[sid] || 0) + 1;
      });
      prestationsSnapshot.docs.forEach((d) => {
        const sid = d.data().salonId;
        if (sid) prestationCounts[sid] = (prestationCounts[sid] || 0) + 1;
      });

      const salonsData: SalonWithStats[] = salonsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          logo: data.logo || null,
          primaryColor: data.primaryColor || '#c9a86c',
          createdAt: data.createdAt?.toDate() || new Date(),
          createdBy: data.createdBy || '',
          status: data.status || 'active',
          subscriptionStatus: data.subscriptionStatus || 'pending',
          subscriptionEndsAt: data.subscriptionEndsAt?.toDate() || null,
          stripeCustomerId: data.stripeCustomerId || null,
          stripeSubscriptionId: data.stripeSubscriptionId || null,
          clientCount: clientCounts[doc.id] || 0,
          prestationCount: prestationCounts[doc.id] || 0,
        };
      });

      setSalons(salonsData);
    } catch (error) {
      console.error('Error loading salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSalon = async (salonId: string) => {
    await switchSalon(salonId);
  };

  const handleDeleteSalon = async (salonId: string) => {
    setDeletingSalonId(salonId);
    try {
      // Delete all clients of this salon
      const clientsSnapshot = await getDocs(
        query(collection(db, 'clients'), where('salonId', '==', salonId))
      );
      for (const clientDoc of clientsSnapshot.docs) {
        // Delete all prestations of this client
        const prestationsSnapshot = await getDocs(
          query(collection(db, 'prestations'), where('client_id', '==', clientDoc.id))
        );
        const batch = writeBatch(db);
        prestationsSnapshot.docs.forEach((prestDoc) => batch.delete(prestDoc.ref));
        if (prestationsSnapshot.docs.length > 0) await batch.commit();

        await deleteDoc(clientDoc.ref);
      }

      // Delete remaining prestations with this salonId
      const remainingPrestations = await getDocs(
        query(collection(db, 'prestations'), where('salonId', '==', salonId))
      );
      if (remainingPrestations.docs.length > 0) {
        const batch = writeBatch(db);
        remainingPrestations.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }

      // Delete salon config
      await deleteDoc(doc(db, 'salonConfigs', salonId)).catch(() => {});

      // Unlink users from this salon
      const usersSnapshot = await getDocs(
        query(collection(db, 'users'), where('salonId', '==', salonId))
      );
      for (const userDoc of usersSnapshot.docs) {
        await updateDoc(userDoc.ref, { salonId: null });
      }

      // Delete the salon
      await deleteDoc(doc(db, 'salons', salonId));

      // If we were viewing this salon, switch away
      if (currentSalon?.id === salonId) {
        await switchSalon(null);
      }

      setDeleteConfirmId(null);
      await loadSalons();
    } catch (error) {
      console.error('Error deleting salon:', error);
      alert('Erreur lors de la suppression : ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setDeletingSalonId(null);
    }
  };

  // Load clients from source salon
  const loadClientsFromSalon = async (salonId: string) => {
    if (!salonId) {
      setClientsToMigrate([]);
      return;
    }

    setLoadingClients(true);
    try {
      const clientsQuery = query(
        collection(db, 'clients'),
        where('salonId', '==', salonId)
      );
      const snapshot = await getDocs(clientsQuery);
      const clients: ClientForMigration[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          nom: data.last_name || '',
          prenom: data.first_name || '',
          email: data.mail || '',
          salonId: data.salonId,
        };
      });
      clients.sort((a, b) => a.nom.localeCompare(b.nom));
      setClientsToMigrate(clients);
      setSelectedClients(new Set(clients.map((c) => c.id))); // Select all by default
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  // Handle source salon change
  const handleSourceSalonChange = (salonId: string) => {
    setSourceSalonId(salonId);
    setMigrationResult(null);
    loadClientsFromSalon(salonId);
  };

  // Toggle client selection
  const toggleClientSelection = (clientId: string) => {
    const newSelection = new Set(selectedClients);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
    } else {
      newSelection.add(clientId);
    }
    setSelectedClients(newSelection);
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedClients.size === clientsToMigrate.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(clientsToMigrate.map((c) => c.id)));
    }
  };

  // Migrate selected clients
  const migrateClients = async () => {
    if (!destSalonId || selectedClients.size === 0) return;

    setMigrating(true);
    try {
      let clientsMigrated = 0;
      let prestationsMigrated = 0;

      // Use batched writes for better performance
      const batch = writeBatch(db);

      // Update clients
      for (const clientId of selectedClients) {
        const clientRef = doc(db, 'clients', clientId);
        batch.update(clientRef, { salonId: destSalonId });
        clientsMigrated++;
      }

      await batch.commit();

      // Migrate prestations for these clients
      for (const clientId of selectedClients) {
        const prestationsQuery = query(
          collection(db, 'prestations'),
          where('client_id', '==', clientId)
        );
        const prestationsSnapshot = await getDocs(prestationsQuery);

        for (const prestDoc of prestationsSnapshot.docs) {
          await updateDoc(doc(db, 'prestations', prestDoc.id), {
            salonId: destSalonId,
          });
          prestationsMigrated++;
        }
      }

      setMigrationResult({ clients: clientsMigrated, prestations: prestationsMigrated });

      // Refresh data
      await loadSalons();
      await loadClientsFromSalon(sourceSalonId);
    } catch (error) {
      console.error('Error migrating clients:', error);
      alert('Erreur lors de la migration');
    } finally {
      setMigrating(false);
    }
  };

  // Close migration modal and reset
  const closeMigrationModal = () => {
    setShowMigrationModal(false);
    setSourceSalonId('');
    setDestSalonId('');
    setClientsToMigrate([]);
    setSelectedClients(new Set());
    setMigrationResult(null);
  };

  // Load clients whose salon no longer exists
  const loadOrphanedClients = async () => {
    setLoadingOrphaned(true);
    try {
      // Get all existing salon IDs
      const salonsSnapshot = await getDocs(collection(db, 'salons'));
      const existingSalonIds = new Set(salonsSnapshot.docs.map((doc) => doc.id));

      // Get all clients
      const clientsSnapshot = await getDocs(collection(db, 'clients'));
      const orphaned: OrphanedBySalonDeletion[] = [];

      clientsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        // Client has a salonId but the salon doesn't exist
        if (data.salonId && !existingSalonIds.has(data.salonId)) {
          orphaned.push({
            id: doc.id,
            nom: data.last_name || '',
            prenom: data.first_name || '',
            email: data.mail || '',
            salonId: data.salonId,
          });
        }
      });

      orphaned.sort((a, b) => a.nom.localeCompare(b.nom));
      setOrphanedClients(orphaned);
      setSelectedOrphaned(new Set(orphaned.map((c) => c.id)));
      setShowOrphanedSection(true);
    } catch (error) {
      console.error('Error loading orphaned clients:', error);
    } finally {
      setLoadingOrphaned(false);
    }
  };

  // Toggle orphaned client selection
  const toggleOrphanedSelection = (clientId: string) => {
    const newSelection = new Set(selectedOrphaned);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
    } else {
      newSelection.add(clientId);
    }
    setSelectedOrphaned(newSelection);
  };

  // Select/deselect all orphaned
  const toggleSelectAllOrphaned = () => {
    if (selectedOrphaned.size === orphanedClients.length) {
      setSelectedOrphaned(new Set());
    } else {
      setSelectedOrphaned(new Set(orphanedClients.map((c) => c.id)));
    }
  };

  // Migrate orphaned clients
  const migrateOrphanedClients = async () => {
    if (!orphanedDestSalonId || selectedOrphaned.size === 0) return;

    setMigrating(true);
    try {
      let clientsMigrated = 0;
      let prestationsMigrated = 0;

      const batch = writeBatch(db);

      for (const clientId of selectedOrphaned) {
        const clientRef = doc(db, 'clients', clientId);
        batch.update(clientRef, { salonId: orphanedDestSalonId });
        clientsMigrated++;
      }

      await batch.commit();

      // Migrate prestations
      for (const clientId of selectedOrphaned) {
        const prestationsQuery = query(
          collection(db, 'prestations'),
          where('client_id', '==', clientId)
        );
        const prestationsSnapshot = await getDocs(prestationsQuery);

        for (const prestDoc of prestationsSnapshot.docs) {
          await updateDoc(doc(db, 'prestations', prestDoc.id), {
            salonId: orphanedDestSalonId,
          });
          prestationsMigrated++;
        }
      }

      alert(`Migration réussie ! ${clientsMigrated} client(s) et ${prestationsMigrated} prestation(s) migrés.`);

      // Refresh
      await loadSalons();
      await loadOrphanedClients();
    } catch (error) {
      console.error('Error migrating orphaned clients:', error);
      alert('Erreur lors de la migration');
    } finally {
      setMigrating(false);
    }
  };

  // Check for salons without salonConfig
  const checkMissingSalonConfigs = async () => {
    setCheckingConfigs(true);
    try {
      const missing: SalonWithStats[] = [];

      for (const salon of salons) {
        const configRef = doc(db, 'salonConfigs', salon.id);
        const configDoc = await getDoc(configRef);

        if (!configDoc.exists()) {
          missing.push(salon);
        }
      }

      setSalonsWithoutConfig(missing);
    } catch (error) {
      console.error('Error checking salon configs:', error);
    } finally {
      setCheckingConfigs(false);
    }
  };

  // Create missing salonConfig
  const createSalonConfig = async (salonId: string) => {
    setCreatingConfig(salonId);
    try {
      const configRef = doc(db, 'salonConfigs', salonId);
      await setDoc(configRef, {
        ...DEFAULT_SALON_CONFIG,
        salonId: salonId,
      });

      // Remove from missing list
      setSalonsWithoutConfig((prev) => prev.filter((s) => s.id !== salonId));

      alert('Configuration créée avec succès !');
    } catch (error) {
      console.error('Error creating salon config:', error);
      alert('Erreur lors de la création de la configuration');
    } finally {
      setCreatingConfig(null);
    }
  };

  // Create all missing configs
  const createAllMissingConfigs = async () => {
    for (const salon of salonsWithoutConfig) {
      await createSalonConfig(salon.id);
    }
  };

  // Load unverified users
  const loadUnverifiedUsers = async () => {
    setLoadingUnverified(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const unverified: UnverifiedUser[] = [];

      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        // User is not verified and is not super_admin
        if (!data.emailVerified && data.role !== 'super_admin') {
          unverified.push({
            id: doc.id,
            email: data.email || '',
            displayName: data.displayName || '',
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        }
      });

      unverified.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setUnverifiedUsers(unverified);
    } catch (error) {
      console.error('Error loading unverified users:', error);
    } finally {
      setLoadingUnverified(false);
    }
  };

  // Manually verify a user
  const verifyUser = async (userId: string) => {
    setVerifyingUser(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });

      // Remove from list
      setUnverifiedUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error('Error verifying user:', error);
      alert('Erreur lors de la vérification');
    } finally {
      setVerifyingUser(null);
    }
  };

  // Verify all unverified users
  const verifyAllUsers = async () => {
    for (const user of unverifiedUsers) {
      await verifyUser(user.id);
    }
  };

  const getStatusBadge = (salon: Salon) => {
    const status = salon.subscriptionStatus;

    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
            Actif
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs rounded-full">
            En attente de paiement
          </span>
        );
      case 'past_due':
        return (
          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs rounded-full">
            Paiement en retard
          </span>
        );
      case 'canceled':
      case 'expired':
        return (
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs rounded-full">
            Expiré
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h1 className="font-elegant text-2xl font-semibold text-gray-800 dark:text-white">
            Super Admin
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestion de tous les établissements
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMigrationModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 cursor-pointer text-sm"
          >
            Migrer des clients
          </button>
          <Link
            to="/admin"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer text-sm"
          >
            Outils admin
          </Link>
          <Link
            to="/"
            className="px-4 py-2 bg-gold text-white rounded-xl hover:bg-gold-light transition-all duration-200 cursor-pointer text-sm"
          >
            Retour à l'app
          </Link>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4 mb-6 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total établissements</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{salons.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
          <div className="text-sm text-gray-500 dark:text-gray-400">Abonnements actifs</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {salons.filter((s) => s.subscriptionStatus === 'active').length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
          <div className="text-sm text-gray-500 dark:text-gray-400">En attente</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {salons.filter((s) => s.subscriptionStatus === 'pending').length}
          </div>
        </div>
      </div>

      {/* Orphaned clients section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Clients orphelins (établissement supprimé)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Clients dont l'établissement n'existe plus
            </p>
          </div>
          <button
            onClick={loadOrphanedClients}
            disabled={loadingOrphaned}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all duration-200 cursor-pointer text-sm disabled:opacity-50"
          >
            {loadingOrphaned ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {showOrphanedSection && (
          <div className="space-y-4">
            {orphanedClients.length === 0 ? (
              <p className="text-emerald-600 dark:text-emerald-400 text-sm">
                Aucun client orphelin trouvé
              </p>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <select
                    value={orphanedDestSalonId}
                    onChange={(e) => setOrphanedDestSalonId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Sélectionner l'établissement destination</option>
                    {salons.map((salon) => (
                      <option key={salon.id} value={salon.id}>
                        {salon.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={migrateOrphanedClients}
                    disabled={!orphanedDestSalonId || selectedOrphaned.size === 0 || migrating}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all duration-200 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {migrating ? 'Migration...' : `Migrer ${selectedOrphaned.size} client(s)`}
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {orphanedClients.length} client(s) trouvé(s)
                  </span>
                  <button
                    onClick={toggleSelectAllOrphaned}
                    className="text-sm text-gold hover:text-gold-light cursor-pointer"
                  >
                    {selectedOrphaned.size === orphanedClients.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                  {orphanedClients.map((client) => (
                    <label
                      key={client.id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrphaned.has(client.id)}
                        onChange={() => toggleOrphanedSelection(client.id)}
                        className="checkbox-gold"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {client.nom} {client.prenom}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {client.email || 'Pas d\'email'} • Ancien établissement: {client.salonId.slice(0, 8)}...
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Missing salonConfigs section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Configurations manquantes
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Établissements sans configuration associée
            </p>
          </div>
          <button
            onClick={checkMissingSalonConfigs}
            disabled={checkingConfigs || salons.length === 0}
            className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all duration-200 cursor-pointer text-sm disabled:opacity-50"
          >
            {checkingConfigs ? 'Vérification...' : 'Vérifier'}
          </button>
        </div>

        {salonsWithoutConfig.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-amber-600 dark:text-amber-400">
                {salonsWithoutConfig.length} établissement(s) sans configuration
              </span>
              <button
                onClick={createAllMissingConfigs}
                disabled={creatingConfig !== null}
                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer"
              >
                Créer toutes les configs
              </button>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
              {salonsWithoutConfig.map((salon) => (
                <div
                  key={salon.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: salon.primaryColor }}
                    >
                      {salon.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {salon.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {salon.id}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => createSalonConfig(salon.id)}
                    disabled={creatingConfig === salon.id}
                    className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {creatingConfig === salon.id ? 'Création...' : 'Créer config'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {salonsWithoutConfig.length === 0 && checkingConfigs === false && salons.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cliquez sur "Vérifier" pour détecter les configurations manquantes
          </p>
        )}
      </div>

      {/* Unverified users section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Utilisateurs non vérifiés
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Utilisateurs n'ayant pas vérifié leur email
            </p>
          </div>
          <button
            onClick={loadUnverifiedUsers}
            disabled={loadingUnverified}
            className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all duration-200 cursor-pointer text-sm disabled:opacity-50"
          >
            {loadingUnverified ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {unverifiedUsers.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-amber-600 dark:text-amber-400">
                {unverifiedUsers.length} utilisateur(s) non vérifié(s)
              </span>
              <button
                onClick={verifyAllUsers}
                disabled={verifyingUser !== null}
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
              >
                Tout vérifier
              </button>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto">
              {unverifiedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {user.email}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.displayName || 'Sans nom'} • Inscrit le {user.createdAt.toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <button
                    onClick={() => verifyUser(user.id)}
                    disabled={verifyingUser === user.id}
                    className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {verifyingUser === user.id ? 'Vérification...' : 'Marquer vérifié'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {unverifiedUsers.length === 0 && !loadingUnverified && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cliquez sur "Rechercher" pour trouver les utilisateurs non vérifiés
          </p>
        )}
      </div>

      {/* Salons list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex-1 flex flex-col min-h-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Chargement des établissements...
          </div>
        ) : salons.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Aucun établissement enregistré
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Établissement
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Clients
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prestations
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {salons.map((salon) => (
                  <tr
                    key={salon.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      currentSalon?.id === salon.id ? 'bg-gold/10' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: salon.primaryColor }}
                        >
                          {salon.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {salon.name}
                            {currentSalon?.id === salon.id && (
                              <span className="ml-2 text-xs text-gold">(actuel)</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {salon.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(salon)}</td>
                    <td className="px-4 py-4 text-gray-900 dark:text-white">
                      {salon.clientCount ?? '-'}
                    </td>
                    <td className="px-4 py-4 text-gray-900 dark:text-white">
                      {salon.prestationCount ?? '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {salon.createdAt.toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSelectSalon(salon.id)}
                          disabled={currentSalon?.id === salon.id}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                            currentSalon?.id === salon.id
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-gold/10 text-gold hover:bg-gold/20'
                          }`}
                        >
                          {currentSalon?.id === salon.id ? 'Sélectionné' : 'Accéder'}
                        </button>
                        {deleteConfirmId === salon.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteSalon(salon.id)}
                              disabled={deletingSalonId === salon.id}
                              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {deletingSalonId === salon.id ? 'Suppression...' : 'Confirmer'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(salon.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer l'établissement"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Migration Modal */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Migrer des clients
                </h2>
                <button
                  onClick={closeMigrationModal}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Salon selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Établissement source
                  </label>
                  <select
                    value={sourceSalonId}
                    onChange={(e) => handleSourceSalonChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="">Sélectionner un établissement</option>
                    {salons.map((salon) => (
                      <option key={salon.id} value={salon.id}>
                        {salon.name} ({salon.clientCount} clients)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Établissement destination
                  </label>
                  <select
                    value={destSalonId}
                    onChange={(e) => {
                      setDestSalonId(e.target.value);
                      setMigrationResult(null);
                    }}
                    disabled={!sourceSalonId}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">Sélectionner un établissement</option>
                    {salons
                      .filter((s) => s.id !== sourceSalonId)
                      .map((salon) => (
                        <option key={salon.id} value={salon.id}>
                          {salon.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Migration result */}
              {migrationResult && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                    Migration réussie !
                  </p>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm">
                    {migrationResult.clients} client(s) et {migrationResult.prestations} prestation(s) migrés
                  </p>
                </div>
              )}

              {/* Clients list */}
              {sourceSalonId && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Clients à migrer ({selectedClients.size}/{clientsToMigrate.length})
                    </label>
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm text-gold hover:text-gold-light cursor-pointer"
                    >
                      {selectedClients.size === clientsToMigrate.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>

                  {loadingClients ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Chargement des clients...
                    </div>
                  ) : clientsToMigrate.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Aucun client dans cet établissement
                    </div>
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                      {clientsToMigrate.map((client) => (
                        <label
                          key={client.id}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedClients.has(client.id)}
                            onChange={() => toggleClientSelection(client.id)}
                            className="checkbox-gold"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {client.nom} {client.prenom}
                            </div>
                            {client.email && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {client.email}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={closeMigrationModal}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={migrateClients}
                disabled={!destSalonId || selectedClients.size === 0 || migrating}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {migrating ? 'Migration en cours...' : `Migrer ${selectedClients.size} client(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
