import { useState, useRef } from 'react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { compressImage } from '../utils/imageCompression';
import { DEFAULT_SALON_CONFIG, SUBSCRIPTION_PRICE } from '../types/multi-tenant';

type Step = 'salon' | 'confirm';

interface SalonFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export function Onboarding() {
  const { firebaseUser, userProfile, refreshSalon } = useAuth();
  const [step, setStep] = useState<Step>('salon');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Salon form data
  const [salonData, setSalonData] = useState<SalonFormData>({
    name: '',
    address: '',
    phone: '',
    email: firebaseUser?.email || '',
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 10 Mo');
        return;
      }

      setLogoFile(file);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSalonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonData.name.trim()) {
      setError('Le nom du salon est requis');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const uploadLogo = async (salonId: string): Promise<string | null> => {
    if (!logoFile) return null;

    try {
      // Compresser l'image avant upload (max 400x400 pour un logo)
      const compressedBlob = await compressImage(logoFile, 400, 400, 0.85);

      const logoRef = ref(storage, `salons/${salonId}/logo`);
      await uploadBytes(logoRef, compressedBlob);
      const downloadURL = await getDownloadURL(logoRef);
      return downloadURL;
    } catch (err) {
      console.error('Error uploading logo:', err);
      return null;
    }
  };

  const handleCreateSalon = async () => {
    if (!firebaseUser || !userProfile) return;

    setLoading(true);
    setError('');

    try {
      const salonId = firebaseUser.uid;

      // Upload logo if provided
      const logoUrl = await uploadLogo(salonId);

      // Create salon document with pending payment status
      await setDoc(doc(db, 'salons', salonId), {
        name: salonData.name,
        address: salonData.address,
        phone: salonData.phone,
        email: salonData.email,
        logo: logoUrl,
        primaryColor: '#c9a86c',
        createdAt: Timestamp.now(),
        createdBy: firebaseUser.uid,
        status: 'pending_payment',
        subscriptionStatus: 'pending',
        subscriptionEndsAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      });

      // Create salon config
      await setDoc(doc(db, 'salonConfigs', salonId), {
        salonId,
        ...DEFAULT_SALON_CONFIG,
      });

      // Update user profile with salonId
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        salonId,
      }, { merge: true });

      // Refresh to load new salon data
      await refreshSalon();

      // Redirect to subscription/payment page
      window.location.reload();
    } catch (err) {
      console.error('Error creating salon:', err);
      setError('Une erreur est survenue lors de la création du salon');
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
                  Créez votre salon
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Commençons par les informations de base
                </p>
              </div>

              <form onSubmit={handleSalonSubmit} className="space-y-4">
                {/* Logo upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Logo du salon
                  </label>
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed transition-colors ${
                        logoPreview
                          ? 'border-gold'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gold'
                      }`}
                    >
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer text-sm font-medium"
                      >
                        {logoPreview ? 'Changer' : 'Choisir une image'}
                      </label>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Format JPG, PNG ou GIF. Max 10 Mo (compressé automatiquement).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Nom du salon *
                  </label>
                  <input
                    type="text"
                    required
                    value={salonData.name}
                    onChange={(e) => setSalonData({ ...salonData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder="Ex: Institut Beauté"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={salonData.address}
                    onChange={(e) => setSalonData({ ...salonData, address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder="123 rue de la Beauté, 75001 Paris"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={salonData.phone}
                    onChange={(e) => setSalonData({ ...salonData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder="01 23 45 67 89"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Email du salon
                  </label>
                  <input
                    type="email"
                    value={salonData.email}
                    onChange={(e) => setSalonData({ ...salonData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                    placeholder="contact@salon.com"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gold text-white rounded-xl hover:bg-gold-light transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer mt-6"
                >
                  Continuer
                </button>
              </form>
            </>
          )}

          {/* Step 2: Confirmation & Payment Info */}
          {step === 'confirm' && (
            <>
              <div className="text-center mb-6">
                <h2 className="font-elegant text-2xl font-semibold text-gray-800 dark:text-cream">
                  Confirmez votre inscription
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Récapitulatif avant paiement
                </p>
              </div>

              <div className="space-y-4">
                {/* Salon summary */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center text-white font-semibold">
                        {salonData.name.charAt(0).toUpperCase()}
                      </div>
                    )}
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
                      <h3 className="font-semibold text-gray-800 dark:text-white text-lg">Abonnement mensuel</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Accès complet à l'application</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-gold">{SUBSCRIPTION_PRICE}€</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">/mois</p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Gestion illimitée de clients
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Suivi des prestations
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Statistiques détaillées
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Support prioritaire
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  En cliquant sur "Créer mon salon", vous serez redirigé vers la page de paiement sécurisé.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('salon')}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium cursor-pointer"
                >
                  Retour
                </button>
                <button
                  onClick={handleCreateSalon}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gold text-white rounded-xl hover:bg-gold-light disabled:opacity-50 transition-all duration-200 font-medium shadow-md hover:shadow-lg cursor-pointer"
                >
                  {loading ? 'Création...' : 'Créer mon salon'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
