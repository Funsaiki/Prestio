import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatedFetch } from '../../utils/api';
import type { Salon } from '../../types/multi-tenant';
import { SUBSCRIPTION_PRICE } from '../../types/multi-tenant';

interface SubscriptionTabProps {
  salon: Salon;
}

export function SubscriptionTab({ salon }: SubscriptionTabProps) {
  const { t } = useTranslation();
  const { refreshSalon } = useAuth();
  const [canceling, setCanceling] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const isActive = salon.subscriptionStatus === 'active';
  const isPending = salon.subscriptionStatus === 'pending';
  const isCancelPending = isActive && salon.cancelAtPeriodEnd === true;

  const getStatusLabel = () => {
    switch (salon.subscriptionStatus) {
      case 'active': return t('subscriptionTab.active');
      case 'pending': return t('subscriptionTab.pending');
      case 'past_due': return t('subscriptionTab.pastDue');
      case 'canceled': return t('subscriptionTab.canceled');
      case 'expired': return t('subscriptionTab.expired');
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
      setMessage({ type: 'error', text: t('subscriptionTab.noSubscription') });
      return;
    }

    setCanceling(true);
    setMessage(null);

    try {
      const response = await authenticatedFetch('/api/cancel-subscription', {
        method: 'POST',
        body: JSON.stringify({
          stripeSubscriptionId: salon.stripeSubscriptionId,
          salonId: salon.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('subscriptionTab.cancelError'));
      }

      await refreshSalon();
      setShowConfirm(false);
      setMessage({
        type: 'success',
        text: data.cancelAt
          ? `${t('subscriptionTab.willCancel')} ${new Date(data.cancelAt).toLocaleDateString('fr-FR')}`
          : t('subscriptionTab.canceledMsg'),
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t('subscriptionTab.cancelError'),
      });
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('subscriptionTab.yourSubscription')}</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <p className="font-medium text-gray-800 dark:text-white">{t('subscriptionTab.monthly')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{SUBSCRIPTION_PRICE}€ {t('subscriptionTab.perMonth')}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
          </div>

          {salon.subscriptionEndsAt && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isCancelPending ? t('subscriptionTab.activeUntil') : isActive ? t('subscriptionTab.nextBilling') : t('subscriptionTab.expiresOn')} {salon.subscriptionEndsAt.toLocaleDateString('fr-FR')}
            </p>
          )}
          {isCancelPending && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              {t('subscriptionTab.cancelPending')}
            </p>
          )}
        </div>
      </div>

      {/* Payment Method */}
      {salon.stripeCustomerId && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t('subscriptionTab.paymentMethod')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t('subscriptionTab.paymentMethodDesc')}
          </p>
          <button
            onClick={async () => {
              setLoadingPortal(true);
              try {
                const response = await authenticatedFetch('/api/create-portal-session', {
                  method: 'POST',
                  body: JSON.stringify({
                    stripeCustomerId: salon.stripeCustomerId,
                    returnUrl: window.location.href,
                  }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);
                window.location.href = data.url;
              } catch (error) {
                setMessage({
                  type: 'error',
                  text: error instanceof Error ? error.message : t('common.error'),
                });
              } finally {
                setLoadingPortal(false);
              }
            }}
            disabled={loadingPortal}
            className="px-4 py-2 bg-gold text-white rounded-xl hover:bg-gold-light transition-all duration-200 cursor-pointer text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {loadingPortal ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                {t('subscriptionTab.managingPayment')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {t('subscriptionTab.managePayment')}
              </>
            )}
          </button>
        </div>
      )}

      {/* Cancel Section */}
      {isActive && salon.stripeSubscriptionId && !isCancelPending && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t('subscriptionTab.cancelTitle')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t('subscriptionTab.cancelDesc')}
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
              {t('subscriptionTab.cancelButton')}
            </button>
          ) : (
            <div className="p-4 border border-red-300 dark:border-red-700 rounded-xl bg-red-50/50 dark:bg-red-900/10">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3 font-medium">
                {t('subscriptionTab.cancelConfirm')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors cursor-pointer text-sm font-medium disabled:opacity-50"
                >
                  {canceling ? t('subscriptionTab.canceling') : t('subscriptionTab.confirmCancel')}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer text-sm"
                >
                  {t('subscriptionTab.keepSubscription')}
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
            {t('subscriptionTab.inactive')}.
            {salon.subscriptionEndsAt && (
              <> {t('subscriptionTab.endedOn')} {salon.subscriptionEndsAt.toLocaleDateString('fr-FR')}.</>
            )}
            {' '}{t('subscriptionTab.contactSupport')}.
          </p>
        </div>
      )}
    </div>
  );
}
