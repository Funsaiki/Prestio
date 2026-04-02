import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_SALON_CONFIG, SUBSCRIPTION_PRICE } from '../types/multi-tenant';

type Step = 'salon' | 'confirm';

interface SalonFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export function Onboarding() {
  const { firebaseUser, userProfile, refreshSalon, logout } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('salon');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Salon form data
  const [salonData, setSalonData] = useState<SalonFormData>({
    name: '',
    address: '',
    phone: '',
    email: firebaseUser?.email || '',
  });

  const handleSalonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonData.name.trim()) {
      setError(t('onboarding.errorName'));
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleCreateSalon = async () => {
    if (!firebaseUser || !userProfile) return;

    setLoading(true);
    setError('');

    try {
      const salonId = firebaseUser.uid;

      // 1. Create salon document
      await setDoc(doc(db, 'salons', salonId), {
        name: salonData.name,
        address: salonData.address,
        phone: salonData.phone,
        email: salonData.email,
        logo: null,
        primaryColor: '#c9a86c',
        createdAt: Timestamp.now(),
        createdBy: firebaseUser.uid,
        status: 'pending_payment',
        subscriptionStatus: 'pending',
        subscriptionEndsAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      });

      // 2. Link user to salon BEFORE creating config
      // (Firestore rules check belongsToSalon for salonConfigs)
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        salonId,
      }, { merge: true });

      // 3. Create salon config (now user has salonId, rules will pass)
      await setDoc(doc(db, 'salonConfigs', salonId), {
        salonId,
        ...DEFAULT_SALON_CONFIG,
      });

      // Refresh salon data - the real-time listener on userProfile
      // will detect the salonId change and update the app state
      await refreshSalon();
    } catch (err) {
      console.error('Error creating salon:', err);
      setError(t('onboarding.errorCreation'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900 flex items-center justify-center px-4 py-8 transition-colors duration-500">
      <div className="max-w-lg w-full">
        {/* Progress steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === 'salon' ? 'bg-gold text-white' : 'bg-green-500 text-white'
              }`}
            >
              {step === 'confirm' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                1
              )}
            </div>
            <div className={`w-12 h-1 mx-2 rounded ${step === 'confirm' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === 'confirm' ? 'bg-gold text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              2
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-scale-in">
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Step 1: Salon Info */}
          {step === 'salon' && (
            <>
              <div className="text-center mb-6">
                <h2 className="font-elegant text-2xl font-semibold text-gray-800 dark:text-cream">
                  {t('onboarding.createTitle')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {t('onboarding.startInfo')}
                </p>
              </div>

              <form onSubmit={handleSalonSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    {t('onboarding.nameLabel')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={salonData.name}
                    onChange={(e) => setSalonData({ ...salonData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder={t('onboarding.namePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    {t('onboarding.addressLabel')}
                  </label>
                  <input
                    type="text"
                    value={salonData.address}
                    onChange={(e) => setSalonData({ ...salonData, address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder={t('onboarding.addressPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    {t('onboarding.phoneLabel')}
                  </label>
                  <input
                    type="tel"
                    value={salonData.phone}
                    onChange={(e) => setSalonData({ ...salonData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder={t('onboarding.phonePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    {t('onboarding.emailLabel')}
                  </label>
                  <input
                    type="email"
                    value={salonData.email}
                    onChange={(e) => setSalonData({ ...salonData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder={t('onboarding.emailPlaceholder')}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gold text-white rounded-xl hover:bg-gold-light transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer mt-6"
                >
                  {t('onboarding.continue')}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Confirmation & Payment Info */}
          {step === 'confirm' && (
            <>
              <div className="text-center mb-6">
                <h2 className="font-elegant text-2xl font-semibold text-gray-800 dark:text-cream">
                  {t('onboarding.confirmTitle')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {t('onboarding.confirmSubtitle')}
                </p>
              </div>

              <div className="space-y-4">
                {/* Salon summary */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center text-white font-semibold">
                      {salonData.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">{salonData.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{salonData.email}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="p-6 border-2 border-gold rounded-xl bg-gold/5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white text-lg">{t('onboarding.subscription')}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('onboarding.fullAccess')}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-gold">{SUBSCRIPTION_PRICE}€</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('onboarding.perMonth')}</p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('onboarding.unlimitedClients')}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('onboarding.serviceTracking')}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('onboarding.detailedStats')}
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('onboarding.prioritySupport')}
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {t('onboarding.paymentRedirect')}
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('salon')}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium cursor-pointer"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={handleCreateSalon}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gold text-white rounded-xl hover:bg-gold-light disabled:opacity-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg cursor-pointer"
                >
                  {loading ? t('onboarding.creating') : t('onboarding.createButton')}
                </button>
              </div>
            </>
          )}

          {/* Bouton déconnexion / retour */}
          <div className="mt-6 text-center">
            <button
              onClick={logout}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              &larr; {t('onboarding.backToHome')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
