import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useClients } from '../hooks/useClients';
import { usePrestations } from '../hooks/usePrestations';
import { useAuth } from '../contexts/AuthContext';
import { ClientForm } from '../components/ClientForm';
import { PrestationForm } from '../components/PrestationForm';
import { ConfirmModal } from '../components/ConfirmModal';
import { Modal } from '../components/Modal';
import { DEFAULT_SALON_CONFIG } from '../types/multi-tenant';
import type { Client, Prestation } from '../types';

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { salonConfig } = useAuth();
  const { updateClient, deleteClient } = useClients();
  const { prestations, addPrestation, updatePrestation, deletePrestation } = usePrestations(id);

  // Champs de prestation configurés
  const prestationFields = useMemo(() => {
    return salonConfig?.prestationFields ?? DEFAULT_SALON_CONFIG.prestationFields;
  }, [salonConfig?.prestationFields]);

  // Helper pour obtenir le label d'une valeur de champ select
  const getFieldLabel = (fieldName: string, value: unknown): string => {
    if (!value) return '';
    const field = prestationFields.find(f => f.name === fieldName);
    if (field?.type === 'select' && field.options) {
      const option = field.options.find(opt => opt.value === value);
      return option?.label || String(value);
    }
    return String(value);
  };

  // Helper pour obtenir le titre de la prestation (premier champ select ou "Prestation")
  const getPrestationTitle = (prestation: Prestation): string => {
    // Chercher le premier champ select avec une valeur
    for (const field of prestationFields) {
      if (field.type === 'select') {
        const value = prestation.values[field.name];
        if (value) {
          return getFieldLabel(field.name, value);
        }
      }
    }
    return 'Prestation';
  };

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editFormVisible, setEditFormVisible] = useState(false);
  const [prestationFormVisible, setPrestationFormVisible] = useState(false);
  const [prestationToEdit, setPrestationToEdit] = useState<Prestation | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [prestationToDelete, setPrestationToDelete] = useState<string | null>(null);
  const [clientFormSubmitting, setClientFormSubmitting] = useState(false);
  const [prestationFormSubmitting, setPrestationFormSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    today: true,
    future: true,
    past: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isFuture = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate > today;
  };

  const todayPrestations = prestations.filter(p => isToday(p.date)).sort((a, b) => a.date.getTime() - b.date.getTime());
  const futurePrestations = prestations.filter(p => isFuture(p.date)).sort((a, b) => a.date.getTime() - b.date.getTime());
  const pastPrestations = prestations.filter(p => !isToday(p.date) && !isFuture(p.date)).sort((a, b) => b.date.getTime() - a.date.getTime());

  // Rendu des valeurs de champs personnalisés
  const renderFieldValues = (prestation: Prestation) => {
    const badges: React.ReactNode[] = [];
    const colors = [
      'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
      'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
      'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    ];

    let colorIndex = 0;

    for (const field of prestationFields) {
      const value = prestation.values[field.name];
      if (value === undefined || value === null || value === '') continue;

      // Skip le premier champ select (utilisé comme titre)
      if (field.type === 'select' && getPrestationTitle(prestation) === getFieldLabel(field.name, value)) {
        continue;
      }

      let displayValue: string;
      if (field.type === 'select') {
        displayValue = getFieldLabel(field.name, value);
      } else if (field.type === 'checkbox') {
        if (!value) continue; // Ne pas afficher si false
        displayValue = field.label;
      } else if (field.type === 'number' && field.unit) {
        displayValue = `${value} ${field.unit}`;
      } else {
        displayValue = String(value);
      }

      badges.push(
        <span
          key={field.id}
          className={`px-2.5 py-1 ${colors[colorIndex % colors.length]} text-sm rounded-lg font-medium`}
        >
          {field.type !== 'checkbox' && field.type !== 'select' && `${field.label}: `}
          {displayValue}
        </span>
      );
      colorIndex++;
    }

    return badges.length > 0 ? (
      <div className="flex flex-wrap gap-2 mb-3">{badges}</div>
    ) : null;
  };

  const renderPrestationCard = (prestation: Prestation, index: number) => (
    <div
      key={prestation.id}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-all duration-200 animate-slide-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Header: Type + Date */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-medium text-gray-900 dark:text-white text-lg">
              {getPrestationTitle(prestation)}
            </span>
            <span className="px-2.5 py-1 bg-gold/10 text-gold text-sm rounded-full font-medium">
              {prestation.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              {' '}&bull;{' '}
              {prestation.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Details: Champs personnalisés */}
          {renderFieldValues(prestation)}

          {/* Footer: Prix */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {prestation.prix.toFixed(2)} €
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <button
            onClick={() => openEditPrestation(prestation)}
            className="p-2 text-gray-500 hover:text-gold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 cursor-pointer"
            title="Modifier"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setPrestationToDelete(prestation.id)}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 cursor-pointer"
            title="Supprimer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  const openEditForm = () => setEditFormVisible(true);
  const closeEditForm = () => setEditFormVisible(false);

  const openPrestationForm = () => setPrestationFormVisible(true);
  const closePrestationForm = () => {
    setPrestationFormVisible(false);
    setPrestationToEdit(null);
  };

  const openEditPrestation = (prestation: Prestation) => {
    setPrestationToEdit(prestation);
    setPrestationFormVisible(true);
  };

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'clients', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Support ancien format et nouveau format
        let values: Record<string, unknown> = {};
        if (data.values) {
          values = data.values;
        } else if (data.glasses !== undefined) {
          values.lunettes = data.glasses;
        }

        setClient({
          id: docSnap.id,
          salonId: data.salonId || '',
          nom: data.last_name || '',
          prenom: data.first_name || '',
          telephone: data.phone || '',
          email: data.mail || '',
          notes: data.notes || '',
          dateCreation: data.created_at?.toDate() || new Date(),
          createdBy: data.createdBy,
          values,
        });
      } else {
        setClient(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleUpdate = async (data: Omit<Client, 'id' | 'dateCreation' | 'salonId' | 'createdBy'>) => {
    if (!id) return;
    await updateClient(id, data);
    closeEditForm();
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteClient(id);
    navigate('/');
  };

  const handleSubmitPrestation = async (data: Omit<Prestation, 'id' | 'clientId' | 'salonId' | 'createdBy' | 'createdAt'>) => {
    if (!id) return;
    if (prestationToEdit) {
      await updatePrestation(prestationToEdit.id, data);
    } else {
      await addPrestation({ ...data, clientId: id });
    }
    closePrestationForm();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400 animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Client non trouvé</p>
        <Link to="/" className="text-gold hover:text-gold-light transition-colors duration-200">
          Retour à la liste
        </Link>
      </div>
    );
  }

  // Champs personnalisés du client
  const clientFields = salonConfig?.clientFields ?? DEFAULT_SALON_CONFIG.clientFields;

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gold transition-colors duration-200 mb-4 group flex-shrink-0 cursor-pointer"
      >
        <svg className="w-5 h-5 mr-1 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <Modal
        isOpen={editFormVisible}
        title="Modifier le client"
        onClose={closeEditForm}
        footer={
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={closeEditForm}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="client-edit-form"
              disabled={clientFormSubmitting}
              className="px-4 py-2 text-white rounded-xl disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
              style={{ backgroundColor: 'var(--color-gold)' }}
            >
              {clientFormSubmitting ? 'Enregistrement...' : 'Modifier'}
            </button>
          </div>
        }
      >
        <ClientForm
          formId="client-edit-form"
          initialData={client}
          onSubmit={handleUpdate}
          onCancel={closeEditForm}
          onSubmittingChange={setClientFormSubmitting}
        />
      </Modal>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-4 animate-scale-in flex-shrink-0">
        {/* Header avec nom et actions */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
              <h1 className="font-elegant text-2xl font-semibold text-gray-900 dark:text-white">
                {client.prenom} {client.nom}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={openEditForm}
                  className="p-2 text-gray-500 hover:text-gold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 cursor-pointer"
                  title="Modifier"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 cursor-pointer"
                  title="Supprimer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Informations de contact */}
            <div className="py-4 space-y-3">
              {client.telephone && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{client.telephone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{client.email}</span>
                </div>
              )}
              {/* Champs personnalisés */}
              {clientFields.map(field => {
                const value = client.values?.[field.name];
                if (value === undefined || value === null || value === '') return null;

                let displayValue: React.ReactNode;
                if (field.type === 'checkbox') {
                  if (!value) return null;
                  displayValue = field.label;
                } else if (field.type === 'select' && field.options) {
                  const option = field.options.find(opt => opt.value === value);
                  displayValue = option?.label || String(value);
                } else {
                  displayValue = String(value) + (field.unit ? ` ${field.unit}` : '');
                }

                return (
                  <div key={field.id} className="flex items-center gap-3 text-gold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-sm font-medium">
                      {field.type === 'checkbox' ? displayValue : `${field.label}: ${displayValue}`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            {client.notes && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{client.notes}</p>
                </div>
              </div>
            )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="font-elegant text-xl font-medium text-gray-900 dark:text-white">Prestations</h2>
          <button
            onClick={openPrestationForm}
            className="text-white px-4 py-2 text-sm rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            style={{ backgroundColor: 'var(--color-gold)' }}
          >
            + Ajouter
          </button>
        </div>

        <Modal
          isOpen={prestationFormVisible}
          title={prestationToEdit ? "Modifier la prestation" : "Nouvelle prestation"}
          onClose={closePrestationForm}
          footer={
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={closePrestationForm}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="prestation-form"
                disabled={prestationFormSubmitting}
                className="px-4 py-2 text-white rounded-xl disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
                style={{ backgroundColor: 'var(--color-gold)' }}
              >
                {prestationFormSubmitting ? 'Enregistrement...' : prestationToEdit ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          }
        >
          <PrestationForm
            formId="prestation-form"
            initialData={prestationToEdit || undefined}
            onSubmit={handleSubmitPrestation}
            onCancel={closePrestationForm}
            onSubmittingChange={setPrestationFormSubmitting}
          />
        </Modal>

        {prestations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune prestation enregistrée</p>
        ) : (
          <div className="overflow-y-auto flex-1">
            {/* Aujourd'hui */}
            {todayPrestations.length > 0 && (
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleSection('today')}
                  className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 font-medium text-sm uppercase tracking-wider w-full flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity duration-200 rounded-t-lg"
                >
                  <span>Aujourd'hui ({todayPrestations.length})</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${expandedSections.today ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.today ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-3 p-3 bg-gray-50/50 dark:bg-gray-700/20 rounded-b-lg">
                    {todayPrestations.map((prestation, index) => renderPrestationCard(prestation, index))}
                  </div>
                </div>
              </div>
            )}

            {/* À venir */}
            {futurePrestations.length > 0 && (
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleSection('future')}
                  className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-4 py-2 font-medium text-sm uppercase tracking-wider w-full flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity duration-200 rounded-t-lg"
                >
                  <span>À venir ({futurePrestations.length})</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${expandedSections.future ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.future ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-3 p-3 bg-gray-50/50 dark:bg-gray-700/20 rounded-b-lg">
                    {futurePrestations.map((prestation, index) => renderPrestationCard(prestation, index))}
                  </div>
                </div>
              </div>
            )}

            {/* Passé */}
            {pastPrestations.length > 0 && (
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleSection('past')}
                  className="bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 px-4 py-2 font-medium text-sm uppercase tracking-wider w-full flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity duration-200 rounded-t-lg"
                >
                  <span>Passé ({pastPrestations.length})</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${expandedSections.past ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections.past ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-3 p-3 bg-gray-50/50 dark:bg-gray-700/20 rounded-b-lg">
                    {pastPrestations.map((prestation, index) => renderPrestationCard(prestation, index))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer le client"
        message={`Êtes-vous sûr de vouloir supprimer ${client.prenom} ${client.nom} et toutes ses prestations ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <ConfirmModal
        isOpen={prestationToDelete !== null}
        title="Supprimer la prestation"
        message="Êtes-vous sûr de vouloir supprimer cette prestation ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={() => {
          if (prestationToDelete) {
            deletePrestation(prestationToDelete);
            setPrestationToDelete(null);
          }
        }}
        onCancel={() => setPrestationToDelete(null)}
      />
    </div>
  );
}
