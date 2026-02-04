import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { previewPaymentMigration, migratePayments } from '../utils/migratePayments';
import {
  previewOrphanData,
  migrateOrphanDataToSalon,
  getOrphanUsers,
  linkUserToSalon,
  type OrphanUser,
} from '../utils/migrateTenancy';

interface MigrationResult {
  total: number;
  toUpdate?: number;
  updated?: number;
  changes: Array<{ id: string; before: string; after: string }>;
}

interface TenancyMigrationResult {
  clients: { total: number; orphans: number; migrated: number };
  prestations: { total: number; orphans: number; migrated: number };
}

export function Admin() {
  const { firebaseUser, isSuperAdmin, currentSalon } = useAuth();

  // Payment migration state
  const [preview, setPreview] = useState<MigrationResult | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tenancy migration state
  const [tenancyPreview, setTenancyPreview] = useState<TenancyMigrationResult | null>(null);
  const [tenancyResult, setTenancyResult] = useState<TenancyMigrationResult | null>(null);
  const [tenancyLoading, setTenancyLoading] = useState(false);
  const [tenancyError, setTenancyError] = useState<string | null>(null);

  // User management state
  const [orphanUsers, setOrphanUsers] = useState<OrphanUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);

  // Vérification admin
  if (!firebaseUser || !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  // Payment migration handlers
  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await previewPaymentMigration();
      setPreview(data);
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la prévisualisation');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir appliquer ces modifications ?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await migratePayments();
      setResult(data);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la migration');
    } finally {
      setLoading(false);
    }
  };

  // Tenancy migration handlers
  const handleTenancyPreview = async () => {
    setTenancyLoading(true);
    setTenancyError(null);
    try {
      const data = await previewOrphanData();
      setTenancyPreview(data);
      setTenancyResult(null);
    } catch (err) {
      setTenancyError(err instanceof Error ? err.message : 'Erreur lors de la prévisualisation');
    } finally {
      setTenancyLoading(false);
    }
  };

  const handleTenancyMigrate = async () => {
    if (!currentSalon?.id) {
      setTenancyError('Aucun salon sélectionné');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir migrer toutes les données orphelines vers "${currentSalon.name}" ?`)) {
      return;
    }

    setTenancyLoading(true);
    setTenancyError(null);
    try {
      const data = await migrateOrphanDataToSalon(currentSalon.id);
      setTenancyResult(data);
      setTenancyPreview(null);
    } catch (err) {
      setTenancyError(err instanceof Error ? err.message : 'Erreur lors de la migration');
    } finally {
      setTenancyLoading(false);
    }
  };

  // User management handlers
  const handleLoadOrphanUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const users = await getOrphanUsers();
      setOrphanUsers(users);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleLinkUser = async (userId: string) => {
    if (!currentSalon?.id) {
      setUsersError('Aucun salon sélectionné');
      return;
    }

    if (!window.confirm(`Lier cet utilisateur au salon "${currentSalon.name}" ?`)) {
      return;
    }

    setLinkingUserId(userId);
    setUsersError(null);
    try {
      await linkUserToSalon(userId, currentSalon.id);
      // Remove from list
      setOrphanUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Erreur lors de la liaison');
    } finally {
      setLinkingUserId(null);
    }
  };

  const hasOrphans = tenancyPreview && (tenancyPreview.clients.orphans > 0 || tenancyPreview.prestations.orphans > 0);

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="font-elegant text-2xl font-semibold text-gray-800 dark:text-white">Administration</h1>
        <Link
          to="/"
          className="text-gray-600 dark:text-gray-400 hover:text-gold transition-colors duration-200 cursor-pointer"
        >
          Retour aux clients
        </Link>
      </div>

      <div className="overflow-y-auto flex-1 space-y-4">
        {/* Gestion des utilisateurs orphelins */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Gestion des utilisateurs
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Gérez les utilisateurs qui ne sont pas encore liés à un salon.
            {currentSalon && (
              <span className="block mt-2 text-gold font-medium">
                Salon cible : {currentSalon.name}
              </span>
            )}
          </p>

          <div className="flex gap-3 mb-6">
            <button
              onClick={handleLoadOrphanUsers}
              disabled={usersLoading}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {usersLoading ? 'Chargement...' : 'Charger les utilisateurs orphelins'}
            </button>
          </div>

          {usersError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl mb-4">
              {usersError}
            </div>
          )}

          {orphanUsers.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">
                Utilisateurs sans salon ({orphanUsers.length})
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg divide-y divide-gray-200 dark:divide-gray-600">
                {orphanUsers.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.email}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.displayName || 'Sans nom'} • {user.role} • Créé le {user.createdAt.toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleLinkUser(user.id)}
                      disabled={linkingUserId === user.id || !currentSalon}
                      className="px-3 py-1.5 bg-gold/10 text-gold hover:bg-gold/20 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer"
                    >
                      {linkingUserId === user.id ? 'Liaison...' : 'Lier au salon'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orphanUsers.length === 0 && !usersLoading && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Cliquez sur le bouton ci-dessus pour rechercher les utilisateurs orphelins.
            </p>
          )}
        </div>

        {/* Migration Multi-tenant */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Migration des données vers un salon
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Cet outil permet de migrer les clients et prestations existants (sans salonId) vers votre salon actuel.
            {currentSalon && (
              <span className="block mt-2 text-gold font-medium">
                Salon cible : {currentSalon.name}
              </span>
            )}
          </p>

          <div className="flex gap-3 mb-6">
            <button
              onClick={handleTenancyPreview}
              disabled={tenancyLoading}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {tenancyLoading ? 'Analyse...' : 'Analyser les données orphelines'}
            </button>

            {hasOrphans && (
              <button
                onClick={handleTenancyMigrate}
                disabled={tenancyLoading || !currentSalon}
                className="px-4 py-2 text-white rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: 'var(--color-gold)' }}
              >
                Migrer vers mon salon
              </button>
            )}
          </div>

          {tenancyError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl mb-4">
              {tenancyError}
            </div>
          )}

          {tenancyPreview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <h3 className="font-medium text-gray-800 dark:text-white mb-2">Clients</h3>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{tenancyPreview.clients.total}</div>
                    </div>
                    <div>
                      <div className="text-sm text-amber-600 dark:text-amber-400">Sans salon</div>
                      <div className="text-xl font-bold text-amber-700 dark:text-amber-300">{tenancyPreview.clients.orphans}</div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <h3 className="font-medium text-gray-800 dark:text-white mb-2">Prestations</h3>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{tenancyPreview.prestations.total}</div>
                    </div>
                    <div>
                      <div className="text-sm text-amber-600 dark:text-amber-400">Sans salon</div>
                      <div className="text-xl font-bold text-amber-700 dark:text-amber-300">{tenancyPreview.prestations.orphans}</div>
                    </div>
                  </div>
                </div>
              </div>

              {!hasOrphans && (
                <p className="text-emerald-600 dark:text-emerald-400">
                  ✓ Toutes les données sont déjà associées à un salon !
                </p>
              )}
            </div>
          )}

          {tenancyResult && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl">
              ✓ Migration terminée !
              <ul className="mt-2 list-disc list-inside">
                <li>{tenancyResult.clients.migrated} client(s) migré(s)</li>
                <li>{tenancyResult.prestations.migrated} prestation(s) migrée(s)</li>
              </ul>
            </div>
          )}
        </div>

        {/* Migration modes de paiement */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Migration des modes de paiement
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Cet outil permet de normaliser les modes de paiement dans la base de données
            (ex: "espèce", "Espèces", "ESPECES" → "Espèces").
          </p>

          <div className="flex gap-3 mb-6">
            <button
              onClick={handlePreview}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Chargement...' : 'Prévisualiser les changements'}
            </button>

            {preview && preview.toUpdate! > 0 && (
              <button
                onClick={handleMigrate}
                disabled={loading}
                className="px-4 py-2 text-white rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: 'var(--color-gold)' }}
              >
                Appliquer la migration
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl mb-4">
              {error}
            </div>
          )}

          {preview && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total prestations</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">{preview.total}</div>
                </div>
                <div className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <div className="text-sm text-amber-600 dark:text-amber-400">À modifier</div>
                  <div className="text-xl font-bold text-amber-700 dark:text-amber-300">{preview.toUpdate}</div>
                </div>
              </div>

              {preview.changes.length > 0 ? (
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white mb-2">Changements prévus :</h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-400">
                          <th className="pb-2">Avant</th>
                          <th className="pb-2">Après</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {preview.changes.map((change, index) => (
                          <tr key={index}>
                            <td className="py-2 text-red-600 dark:text-red-400">{change.before}</td>
                            <td className="py-2 text-emerald-600 dark:text-emerald-400">{change.after}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-emerald-600 dark:text-emerald-400">
                  ✓ Toutes les données sont déjà normalisées !
                </p>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl">
                ✓ Migration terminée ! {result.updated} prestation(s) mise(s) à jour sur {result.total}.
              </div>

              {result.changes.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white mb-2">Changements effectués :</h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 dark:text-gray-400">
                          <th className="pb-2">Avant</th>
                          <th className="pb-2">Après</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {result.changes.map((change, index) => (
                          <tr key={index}>
                            <td className="py-2 text-gray-500 line-through">{change.before}</td>
                            <td className="py-2 text-emerald-600 dark:text-emerald-400">{change.after}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
