import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SUBSCRIPTION_PRICE } from '../types/multi-tenant';

export function Subscription() {
  const { currentSalon, firebaseUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!currentSalon) return null;

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salonId: currentSalon.id,
          salonName: currentSalon.name,
          customerEmail: firebaseUser?.email || currentSalon.email,
          returnUrl: window.location.origin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du paiement');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center px-4 py-8 transition-colors duration-500">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="font-elegant text-2xl font-semibold text-gray-800 dark:text-cream">
              Activez votre abonnement
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Finalisez votre inscription pour accéder à toutes les fonctionnalités
            </p>
          </div>

          {/* Salon info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl mb-6">
            <div className="flex items-center gap-3">
              {currentSalon.logo ? (
                <img src={currentSalon.logo} alt={currentSalon.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: currentSalon.primaryColor }}
                >
                  {currentSalon.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{currentSalon.name}</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">En attente de paiement</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-6 border-2 border-gold rounded-xl bg-gold/5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-lg">Abonnement mensuel</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Accès complet et illimité</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-gold">{SUBSCRIPTION_PRICE}€</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">/mois</p>
              </div>
            </div>

            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Gestion illimitée de clients
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Suivi complet des prestations
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Statistiques détaillées
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Support prioritaire
              </li>
            </ul>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3 bg-gold text-white rounded-xl hover:bg-gold-light transition-all duration-200 font-medium shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                Redirection...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Payer {SUBSCRIPTION_PRICE}€ / mois
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            Paiement sécurisé par Stripe. Annulation possible à tout moment.
          </p>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={logout}
              className="w-full py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-sm cursor-pointer"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
