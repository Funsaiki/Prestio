import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { Salon } from '../../types/multi-tenant';
import { SUBSCRIPTION_PRICE } from '../../types/multi-tenant';

interface SubscriptionTabProps {
  salon: Salon;
}

export function SubscriptionTab({ salon }: SubscriptionTabProps) {
  const { refreshSalon } = useAuth();
  const [canceling, setCanceling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const isActive = salon.subscriptionStatus === 'active';
  const isPending = salon.subscriptionStatus === 'pending';

  const getStatusLabel = () => {
    switch (salon.subscriptionStatus) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente de paiement';
      case 'past_due': return 'Paiement en retard';
      case 'canceled': return 'Annulé';
      case 'expired': return 'Expiré';
      default: return salon.subscriptionStatus;
    }
  };

  const getStatusColor = () => {
    switch (salon.subscriptionStatus) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'pending': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'past_due': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      default: return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    }
  };

  const handleCancel = async () => {
    if (!salon.stripeSubscriptionId) {
      setMessage({ type: 'error', text: 'Aucun abonnement Stripe trouvé' });
      return;
    }

    setCanceling(true);
    setMessage(null);

    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeSubscriptionId: salon.stripeSubscriptionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation');
      }

      await refreshSalon();
      setShowConfirm(false);
      setMessage({
        type: 'success',
        text: data.cancelAt
          ? `Votre abonnement sera annulé le ${new Date(data.cancelAt).toLocaleDateString('fr-FR')}`
          : 'Votre abonnement a été annulé',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de l\'annulation',
      });
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Votre abonnement</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <p className="font-medium text-gray-800 dark:text-white">Abonnement mensuel</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{SUBSCRIPTION_PRICE}€ / mois</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>

          {salon.subscriptionEndsAt && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isActive ? 'Prochaine facturation' : 'Expire'} le {salon.subscriptionEndsAt.toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </div>

      {/* Cancel Section */}
      {isActive && salon.stripeSubscriptionId && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Annuler l'abonnement</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Votre abonnement restera actif jusqu'à la fin de la période de facturation en cours. Vos données seront conservées.
          </p>

          {message && (
            <div className={`mb-4 p-3 rounded-xl text-sm ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer text-sm font-medium"
            >
              Annuler mon abonnement
            </button>
          ) : (
            <div className="p-4 border border-red-300 dark:border-red-700 rounded-xl bg-red-50/50 dark:bg-red-900/10">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3 font-medium">
                Êtes-vous sûr de vouloir annuler votre abonnement ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors cursor-pointer text-sm font-medium disabled:opacity-50"
                >
                  {canceling ? 'Annulation...' : 'Confirmer l\'annulation'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer text-sm"
                >
                  Garder mon abonnement
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resubscribe hint */}
      {!isActive && !isPending && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Votre abonnement n'est plus actif. Contactez le support pour réactiver votre compte.
          </p>
        </div>
      )}
    </div>
  );
}
