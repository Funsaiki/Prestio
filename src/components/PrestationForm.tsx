import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DatePicker, { registerLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { CustomFieldInput } from './CustomFieldInput';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_SALON_CONFIG } from '../types/multi-tenant';
import type { Prestation } from '../types';

registerLocale('fr', fr);

// Form data: date, prix, and dynamic values
type PrestationFormData = Omit<Prestation, 'id' | 'clientId' | 'salonId' | 'createdBy' | 'createdAt'>;

interface PrestationFormProps {
  initialData?: Prestation;
  onSubmit: (data: PrestationFormData) => Promise<void>;
  onCancel: () => void;
  formId?: string;
  onSubmittingChange?: (submitting: boolean) => void;
}

const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200";
const labelClass = "block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5";

export function PrestationForm({ initialData, onSubmit, onCancel, formId, onSubmittingChange }: PrestationFormProps) {
  const { salonConfig, canManageSettings } = useAuth();

  // Champs dynamiques depuis salonConfig
  const prestationFields = useMemo(() => {
    const fields = salonConfig?.prestationFields ?? DEFAULT_SALON_CONFIG.prestationFields;
    return [...fields].sort((a, b) => a.order - b.order);
  }, [salonConfig?.prestationFields]);

  const hasCustomFields = useMemo(() => {
    return prestationFields.some(f => f.id !== 'mode_paiement');
  }, [prestationFields]);

  // Trouver le champ avec defaultPrices pour l'auto-remplissage
  const fieldWithDefaultPrices = useMemo(() => {
    return prestationFields.find(f => f.defaultPrices && Object.keys(f.defaultPrices).length > 0);
  }, [prestationFields]);

  // Calculer le prix initial basé sur les defaultPrices
  const getInitialPrice = () => {
    if (initialData?.prix !== undefined) return initialData.prix;
    if (fieldWithDefaultPrices && initialData?.values) {
      const fieldValue = initialData.values[fieldWithDefaultPrices.name] as string;
      if (fieldValue && fieldWithDefaultPrices.defaultPrices?.[fieldValue]) {
        return fieldWithDefaultPrices.defaultPrices[fieldValue];
      }
    }
    return 0;
  };

  const [formData, setFormData] = useState({
    date: initialData?.date || new Date(),
    prix: getInitialPrice(),
    values: initialData?.values || {} as Record<string, unknown>,
  });
  const [submitting, setSubmitting] = useState(false);
  const [datePickerClosing, setDatePickerClosing] = useState(false);

  const setSubmittingState = (value: boolean) => {
    setSubmitting(value);
    onSubmittingChange?.(value);
  };

  const handleDatePickerClose = () => {
    setDatePickerClosing(true);
    setTimeout(() => setDatePickerClosing(false), 200);
  };

  const handleFieldChange = (fieldName: string, value: unknown, field?: typeof prestationFields[0]) => {
    const newValues = { ...formData.values, [fieldName]: value };

    // Auto-remplissage du prix si le champ a des defaultPrices
    let newPrix = formData.prix;
    if (field?.defaultPrices && typeof value === 'string') {
      const defaultPrice = field.defaultPrices[value];
      if (defaultPrice !== undefined) {
        // Seulement si le prix actuel correspond à un ancien defaultPrice ou est 0
        const currentFieldValue = formData.values[fieldName] as string;
        const currentDefaultPrice = currentFieldValue ? field.defaultPrices[currentFieldValue] : undefined;
        if (formData.prix === 0 || formData.prix === currentDefaultPrice) {
          newPrix = defaultPrice;
        }
      }
    }

    setFormData({
      ...formData,
      values: newValues,
      prix: newPrix,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingState(true);
    try {
      await onSubmit({
        date: formData.date,
        prix: formData.prix,
        values: formData.values,
      });
    } finally {
      setSubmittingState(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {/* Date - Champ fixe */}
      <div>
        <label className={labelClass}>Date et heure *</label>
        <DatePicker
          selected={formData.date}
          onChange={(date: Date | null) => setFormData({ ...formData, date: date || new Date() })}
          onCalendarClose={handleDatePickerClose}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat="dd/MM/yyyy HH:mm"
          locale="fr"
          className={inputClass}
          wrapperClassName="w-full"
          calendarClassName="custom-datepicker"
          popperClassName={datePickerClosing ? 'datepicker-closing' : ''}
          required
        />
      </div>

      {/* Avertissement si pas de champs personnalisés */}
      {!hasCustomFields && canManageSettings && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
          <p className="text-amber-700 dark:text-amber-400">
            Vous n'avez pas encore configuré vos champs de prestation.{' '}
            <Link to="/settings" className="text-gold hover:underline font-medium">
              Configurer maintenant
            </Link>
          </p>
        </div>
      )}

      {/* Champs dynamiques */}
      {prestationFields.map(field => (
        <CustomFieldInput
          key={field.id}
          field={field}
          value={formData.values[field.name]}
          onChange={(value) => handleFieldChange(field.name, value, field)}
        />
      ))}

      {/* Prix - Champ fixe */}
      <div>
        <label className={labelClass}>Prix (€) *</label>
        <input
          type="number"
          required
          min="0"
          step="0.01"
          value={formData.prix}
          onChange={(e) => setFormData({ ...formData, prix: parseFloat(e.target.value) || 0 })}
          className={inputClass}
        />
      </div>

      {!formId && (
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-white rounded-xl disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
            style={{ backgroundColor: 'var(--color-gold)' }}
          >
            {submitting ? 'Enregistrement...' : initialData ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      )}
    </form>
  );
}
