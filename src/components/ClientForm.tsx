import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Client } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CustomFieldInput } from './CustomFieldInput';
import { DEFAULT_SALON_CONFIG } from '../types/multi-tenant';

// Form data excludes fields that are auto-populated (id, dateCreation, salonId, createdBy)
type ClientFormData = Omit<Client, 'id' | 'dateCreation' | 'salonId' | 'createdBy'>;

interface ClientFormProps {
  initialData?: Client;
  onSubmit: (data: ClientFormData) => Promise<void>;
  onCancel: () => void;
  formId?: string;
  onSubmittingChange?: (submitting: boolean) => void;
}

const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200";
const inputErrorClass = "w-full px-3 py-2.5 border border-red-400 dark:border-red-500 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200";
const labelClass = "block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5";

// Format: 10 chiffres, peut commencer par 0 ou +33
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }
  return digits.slice(0, 10).replace(/(\d{2})(?=\d)/g, '$1 ').trim();
};

const isValidFrenchPhone = (phone: string): boolean => {
  if (!phone) return true; // Optionnel
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 && /^0[1-9]/.test(digits);
};

const isValidEmail = (email: string): boolean => {
  if (!email) return true; // Optionnel
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export function ClientForm({ initialData, onSubmit, onCancel, formId, onSubmittingChange }: ClientFormProps) {
  const { t } = useTranslation();
  const { salonConfig } = useAuth();

  // Champs personnalisés pour les clients
  const clientFields = useMemo(() => {
    const fields = salonConfig?.clientFields ?? DEFAULT_SALON_CONFIG.clientFields;
    return [...fields].sort((a, b) => a.order - b.order);
  }, [salonConfig?.clientFields]);

  const [formData, setFormData] = useState({
    nom: initialData?.nom || '',
    prenom: initialData?.prenom || '',
    telephone: initialData?.telephone || '',
    email: initialData?.email || '',
    notes: initialData?.notes || '',
    values: initialData?.values || {} as Record<string, unknown>,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ telephone?: string; email?: string }>({});

  const setSubmittingState = (value: boolean) => {
    setSubmitting(value);
    onSubmittingChange?.(value);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData({ ...formData, telephone: formatted });
    if (errors.telephone) {
      setErrors({ ...errors, telephone: undefined });
    }
  };

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    if (errors.email) {
      setErrors({ ...errors, email: undefined });
    }
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData({
      ...formData,
      values: { ...formData.values, [fieldName]: value },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation au moment du submit
    const phoneValid = isValidFrenchPhone(formData.telephone);
    const emailValid = isValidEmail(formData.email);

    if (!phoneValid || !emailValid) {
      setErrors({
        telephone: !phoneValid ? t('clients.phoneFormat') : undefined,
        email: !emailValid ? t('clients.emailInvalid') : undefined,
      });
      return;
    }

    setSubmittingState(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmittingState(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {/* Champs fixes */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t('clients.firstName')} *</label>
          <input
            type="text"
            required
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t('clients.lastName')} *</label>
          <input
            type="text"
            required
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>{t('clients.phone')}</label>
        <input
          type="tel"
          value={formData.telephone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          className={errors.telephone ? inputErrorClass : inputClass}
          placeholder={t('clients.phonePlaceholder')}
        />
        {errors.telephone && (
          <p className="mt-1 text-sm text-red-500">{errors.telephone}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>{t('clients.email')}</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleEmailChange(e.target.value)}
          className={errors.email ? inputErrorClass : inputClass}
          placeholder={t('clients.emailPlaceholder')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>{t('clients.notes')}</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className={inputClass}
          placeholder={t('clients.notesPlaceholder')}
        />
      </div>

      {/* Champs personnalisés */}
      {clientFields.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          {clientFields.map(field => (
            <CustomFieldInput
              key={field.id}
              field={field}
              value={formData.values[field.name]}
              onChange={(value) => handleFieldChange(field.name, value)}
            />
          ))}
        </div>
      )}

      {!formId && (
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-white rounded-xl disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
            style={{ backgroundColor: 'var(--color-gold)' }}
          >
            {submitting ? t('common.saving') : initialData ? t('common.edit') : t('common.add')}
          </button>
        </div>
      )}
    </form>
  );
}
