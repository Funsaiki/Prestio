import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { previewPaymentMigration, migratePayments } from '../utils/migratePayments';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

interface MigrationResult {
  total: number;
  toUpdate?: number;
  updated?: number;
  changes: Array<{ id: string; before: string; after: string }>;
}

export function Admin() {
  const { user } = useAuth();
  const [preview, setPreview] = useState<MigrationResult | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérification admin
  if (!user || user.email !== ADMIN_EMAIL) {
    return <Navigate to="/" replace />;
  }

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
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 'Prévisualiser les changements'}
            </button>

            {preview && preview.toUpdate! > 0 && (
              <button
                onClick={handleMigrate}
                disabled={loading}
                className="px-4 py-2 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
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
