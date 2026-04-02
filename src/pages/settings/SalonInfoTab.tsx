import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { Salon } from '../../types/multi-tenant';

interface SalonInfoTabProps {
  salon: Salon;
}

export function SalonInfoTab({ salon }: SalonInfoTabProps) {
  const { t } = useTranslation();
  const { refreshSalon } = useAuth();
  const [formData, setFormData] = useState({
    name: salon.name,
    address: salon.address,
    phone: salon.phone,
    email: salon.email,
    primaryColor: salon.primaryColor,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200";
  const labelClass = "block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const salonRef = doc(db, 'salons', salon.id);
      await updateDoc(salonRef, formData);
      await refreshSalon();
      setMessage({ type: 'success', text: t('salonInfo.updated') });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating salon:', error);
      setMessage({ type: 'error', text: t('salonInfo.updateError') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('salonInfo.info')}</h3>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>{t('salonInfo.nameLabel')} *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t('salonInfo.addressLabel')}</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('salonInfo.phoneLabel')}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('salonInfo.emailLabel')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('salonInfo.primaryColor')}</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-12 h-12 rounded-xl cursor-pointer border-0"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className={`${inputClass} w-32 font-mono`}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Submit */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gold text-white rounded-xl hover:bg-gold-light transition-all duration-200 disabled:opacity-50 cursor-pointer font-medium"
          >
            {saving ? t('salonInfo.saving') : t('salonInfo.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
