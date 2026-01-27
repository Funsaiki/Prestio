import { useState } from 'react';
import type { Client } from '../types';

interface ClientFormProps {
  initialData?: Client;
  onSubmit: (data: Omit<Client, 'id' | 'dateCreation'>) => Promise<void>;
  onCancel: () => void;
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

export function ClientForm({ initialData, onSubmit, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState({
    nom: initialData?.nom || '',
    prenom: initialData?.prenom || '',
    telephone: initialData?.telephone || '',
    email: initialData?.email || '',
    lunettes: initialData?.lunettes || false,
    notes: initialData?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ telephone?: string; email?: string }>({});

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData({ ...formData, telephone: formatted });
    // Effacer l'erreur quand l'utilisateur modifie le champ
    if (errors.telephone) {
      setErrors({ ...errors, telephone: undefined });
    }
  };

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    // Effacer l'erreur quand l'utilisateur modifie le champ
    if (errors.email) {
      setErrors({ ...errors, email: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation au moment du submit
    const phoneValid = isValidFrenchPhone(formData.telephone);
    const emailValid = isValidEmail(formData.email);

    if (!phoneValid || !emailValid) {
      setErrors({
        telephone: !phoneValid ? 'Format: 06 12 34 56 78' : undefined,
        email: !emailValid ? 'Email invalide' : undefined,
      });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Prénom *</label>
          <input
            type="text"
            required
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Nom *</label>
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
        <label className={labelClass}>Téléphone</label>
        <input
          type="tel"
          value={formData.telephone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          className={errors.telephone ? inputErrorClass : inputClass}
          placeholder="06 12 34 56 78"
        />
        {errors.telephone && (
          <p className="mt-1 text-sm text-red-500">{errors.telephone}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleEmailChange(e.target.value)}
          className={errors.email ? inputErrorClass : inputClass}
          placeholder="exemple@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="lunettes"
          checked={formData.lunettes}
          onChange={(e) => setFormData({ ...formData, lunettes: e.target.checked })}
          className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 bg-white dark:bg-gray-700"
        />
        <label htmlFor="lunettes" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Porte des lunettes
        </label>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className={inputClass}
          placeholder="Allergies, préférences, etc."
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-white rounded-xl disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
          style={{ backgroundColor: 'var(--color-gold)' }}
        >
          {submitting ? 'Enregistrement...' : initialData ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
}
