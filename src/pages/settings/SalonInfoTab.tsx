import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { compressImage } from '../../utils/imageCompression';
import type { Salon } from '../../types/multi-tenant';

interface SalonInfoTabProps {
  salon: Salon;
}

export function SalonInfoTab({ salon }: SalonInfoTabProps) {
  const { refreshSalon } = useAuth();
  const [formData, setFormData] = useState({
    name: salon.name,
    address: salon.address,
    phone: salon.phone,
    email: salon.email,
    primaryColor: salon.primaryColor,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
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
      setMessage({ type: 'success', text: 'Informations mises à jour' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating salon:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Le fichier doit être une image' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'L\'image ne doit pas dépasser 10 Mo' });
      return;
    }

    setUploadingLogo(true);
    setMessage(null);

    try {
      // Compresser l'image avant upload (max 400x400 pour un logo)
      const compressedBlob = await compressImage(file, 400, 400, 0.85);

      const storageRef = ref(storage, `salons/${salon.id}/logo`);
      await uploadBytes(storageRef, compressedBlob);
      const downloadURL = await getDownloadURL(storageRef);

      const salonRef = doc(db, 'salons', salon.id);
      await updateDoc(salonRef, { logo: downloadURL });
      await refreshSalon();
      setMessage({ type: 'success', text: 'Logo mis à jour' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Erreur lors du téléchargement' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const salonRef = doc(db, 'salons', salon.id);
      await updateDoc(salonRef, { logo: null });
      await refreshSalon();
      setMessage({ type: 'success', text: 'Logo supprimé' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error removing logo:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Logo</h3>

        <div className="flex items-center gap-6">
          {/* Current Logo */}
          <div className="relative">
            {salon.logo ? (
              <img
                src={salon.logo}
                alt={salon.name}
                className="w-24 h-24 rounded-2xl object-cover shadow-md"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-semibold shadow-md"
                style={{ backgroundColor: salon.primaryColor }}
              >
                {salon.name.charAt(0).toUpperCase()}
              </div>
            )}
            {uploadingLogo && (
              <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                <span className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></span>
              </div>
            )}
          </div>

          {/* Upload / Remove buttons */}
          <div className="flex flex-col gap-2">
            <label className="px-4 py-2 bg-gold text-white rounded-xl hover:bg-gold-light transition-colors cursor-pointer text-sm font-medium text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={uploadingLogo}
              />
              {uploadingLogo ? 'Téléchargement...' : 'Changer le logo'}
            </label>
            {salon.logo && (
              <button
                onClick={handleRemoveLogo}
                disabled={saving}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-sm font-medium cursor-pointer"
              >
                Supprimer
              </button>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              JPG, PNG ou GIF. Max 10 Mo (compressé automatiquement).
            </p>
          </div>
        </div>
      </div>

      {/* Info Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Informations</h3>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nom de l'établissement *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Adresse</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Couleur principale</label>
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
            {saving ? 'Enregistrement...' : 'Enregistrer les informations'}
          </button>
        </div>
      </form>
    </div>
  );
}
