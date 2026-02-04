import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Salon } from '../types/multi-tenant';

export function SalonSelector() {
  const { currentSalon, switchSalon, isSuperAdmin, userProfile, isViewingOtherSalon } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only show for super admin
  if (!isSuperAdmin) return null;

  useEffect(() => {
    if (isOpen && salons.length === 0) {
      loadSalons();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSalons = async () => {
    setLoading(true);
    try {
      const salonsQuery = query(collection(db, 'salons'), orderBy('name'));
      const salonsSnapshot = await getDocs(salonsQuery);

      const salonsData = salonsSnapshot.docs.map((doc) => {
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
          subscriptionStatus: data.subscriptionStatus || 'trialing',
          subscriptionPlan: data.subscriptionPlan || 'free',
          trialEndsAt: data.trialEndsAt?.toDate() || null,
          subscriptionEndsAt: data.subscriptionEndsAt?.toDate() || null,
          stripeCustomerId: data.stripeCustomerId || null,
          stripeSubscriptionId: data.stripeSubscriptionId || null,
        } as Salon;
      });

      setSalons(salonsData);
    } catch (error) {
      console.error('Error loading salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSalon = async (salonId: string | null) => {
    await switchSalon(salonId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
          isViewingOtherSalon
            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
        <span className="max-w-[120px] truncate">
          {currentSalon?.name || 'Sélectionner'}
        </span>
        {isViewingOtherSalon && (
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-scale-in origin-top-right">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
              Changer de salon
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {loading ? (
              <div className="px-2 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                Chargement...
              </div>
            ) : salons.length === 0 ? (
              <div className="px-2 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                Aucun salon
              </div>
            ) : (
              <>
                {/* Return to own salon option */}
                {isViewingOtherSalon && userProfile?.salonId && (
                  <button
                    onClick={() => handleSelectSalon(null)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer mb-1"
                  >
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gold">Mon salon</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Revenir à mon espace</div>
                    </div>
                  </button>
                )}

                {salons.map((salon) => (
                  <button
                    key={salon.id}
                    onClick={() => handleSelectSalon(salon.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      currentSalon?.id === salon.id
                        ? 'bg-gold/10'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: salon.primaryColor }}
                    >
                      {salon.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {salon.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {salon.subscriptionStatus === 'active' ? 'Actif' :
                         salon.subscriptionStatus === 'pending' ? 'En attente' : 'Expiré'}
                      </div>
                    </div>
                    {currentSalon?.id === salon.id && (
                      <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
