import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { SalonConfig } from '../types/multi-tenant';
import { DEFAULT_SALON_CONFIG } from '../types/multi-tenant';
import { FieldsConfigTab } from './settings/FieldsConfigTab';
import { SalonInfoTab } from './settings/SalonInfoTab';
import { SubscriptionTab } from './settings/SubscriptionTab';

type SettingsTab = 'info' | 'prestations' | 'clients' | 'subscription';

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'info',
    label: 'Établissement',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'prestations',
    label: 'Prestations',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'subscription',
    label: 'Abonnement',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

export function Settings() {
  const { canManageSettings, currentSalon, salonConfig, refreshSalon } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('info');
  const [localConfig, setLocalConfig] = useState<SalonConfig | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize local config from context
  useEffect(() => {
    if (salonConfig) {
      setLocalConfig(structuredClone(salonConfig));
    } else if (currentSalon?.id) {
      // Create default config if none exists
      setLocalConfig({
        salonId: currentSalon.id,
        ...DEFAULT_SALON_CONFIG,
      });
    }
  }, [salonConfig, currentSalon?.id]);

  // Access control
  if (!canManageSettings) {
    return <Navigate to="/" replace />;
  }

  if (!currentSalon) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Aucun établissement sélectionné</p>
      </div>
    );
  }

  const updateConfig = (updates: Partial<SalonConfig>) => {
    setLocalConfig(prev => prev ? { ...prev, ...updates } : null);
    setIsDirty(true);
    setSaveMessage(null);
  };

  // Nettoyer les valeurs undefined pour Firestore
  const cleanForFirestore = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(cleanForFirestore);
    }
    if (typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (value !== undefined) {
          cleaned[key] = cleanForFirestore(value);
        }
      }
      return cleaned;
    }
    return obj;
  };

  const handleSave = async () => {
    if (!localConfig || !currentSalon?.id) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const configRef = doc(db, 'salonConfigs', currentSalon.id);
      const cleanedConfig = cleanForFirestore(localConfig) as SalonConfig;
      await setDoc(configRef, cleanedConfig, { merge: true });
      await refreshSalon();
      setIsDirty(false);
      setSaveMessage({ type: 'success', text: 'Paramètres enregistrés' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setSaveMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (salonConfig) {
      setLocalConfig(structuredClone(salonConfig));
    }
    setIsDirty(false);
    setSaveMessage(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-elegant text-2xl font-semibold text-gray-800 dark:text-white">
            Paramètres
          </h1>
        </div>

        {/* Save / Reset buttons */}
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={`text-sm ${saveMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {saveMessage.text}
            </span>
          )}
          {isDirty && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              Annuler
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="px-4 py-2 bg-gold text-white rounded-xl hover:bg-gold-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gold shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {localConfig && (
          <>
            {activeTab === 'info' && (
              <SalonInfoTab salon={currentSalon} />
            )}
            {activeTab === 'prestations' && (
              <FieldsConfigTab
                title="Champs des prestations"
                description="Configurez les champs qui apparaissent dans le formulaire de prestation. Les champs Date et Prix sont toujours présents."
                fields={localConfig.prestationFields}
                onChange={(fields) => updateConfig({ prestationFields: fields })}
                showDefaultPrices
              />
            )}
            {activeTab === 'clients' && (
              <FieldsConfigTab
                title="Champs des clients"
                description="Ajoutez des champs personnalisés aux fiches clients. Les champs Nom, Prénom, Téléphone, Email et Notes sont toujours présents."
                fields={localConfig.clientFields}
                onChange={(fields) => updateConfig({ clientFields: fields })}
              />
            )}
          </>
        )}
        {activeTab === 'subscription' && currentSalon && (
          <SubscriptionTab salon={currentSalon} />
        )}
      </div>
    </div>
  );
}
