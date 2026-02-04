import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { usePrestations } from '../hooks/usePrestations';
import { ClientForm } from '../components/ClientForm';
import { Modal } from '../components/Modal';
import type { Client } from '../types';

type ClientWithPrestation = Client & { lastPrestationDate: Date | null };

export function ClientList() {
  const { clients, loading, addClient } = useClients();
  const { prestations } = usePrestations();
  const [formVisible, setFormVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    today: true,
    future: true,
    past: true,
  });

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const openForm = useCallback(() => setFormVisible(true), []);
  const closeForm = useCallback(() => setFormVisible(false), []);

  // Memoize les fonctions de date
  const { isToday, isFuture } = useMemo(() => ({
    isToday: (date: Date): boolean => {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    },
    isFuture: (date: Date): boolean => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      return compareDate > today;
    }
  }), []);

  // Memoize les clients catégorisés
  const { todayClients, futureClients, pastClients, filteredClients } = useMemo(() => {
    const searchLower = search.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.nom.toLowerCase().includes(searchLower) ||
        client.prenom.toLowerCase().includes(searchLower) ||
        client.telephone.includes(search)
    );

    const getClientCategory = (clientId: string): { category: 'today' | 'future' | 'past'; date: Date | null } => {
      const clientPrestations = prestations.filter(p => p.clientId === clientId);
      if (clientPrestations.length === 0) return { category: 'past', date: null };

      const todayPrestation = clientPrestations.find(p => isToday(p.date));
      if (todayPrestation) {
        return { category: 'today', date: todayPrestation.date };
      }

      const futurePrestations = clientPrestations.filter(p => isFuture(p.date));
      if (futurePrestations.length > 0) {
        futurePrestations.sort((a, b) => a.date.getTime() - b.date.getTime());
        return { category: 'future', date: futurePrestations[0].date };
      }

      clientPrestations.sort((a, b) => b.date.getTime() - a.date.getTime());
      return { category: 'past', date: clientPrestations[0].date };
    };

    const clientsWithPrestation: (ClientWithPrestation & { category: 'today' | 'future' | 'past' })[] = filtered.map(client => {
      const { category, date } = getClientCategory(client.id);
      return {
        ...client,
        lastPrestationDate: date,
        category,
      };
    });

    // Tri par date décroissante (plus récent en premier)
    const sortByDateDesc = (a: ClientWithPrestation, b: ClientWithPrestation) => {
      if (!a.lastPrestationDate && !b.lastPrestationDate) return 0;
      if (!a.lastPrestationDate) return 1;
      if (!b.lastPrestationDate) return -1;
      return b.lastPrestationDate.getTime() - a.lastPrestationDate.getTime();
    };

    return {
      filteredClients: filtered,
      todayClients: clientsWithPrestation.filter(c => c.category === 'today').sort(sortByDateDesc),
      futureClients: clientsWithPrestation.filter(c => c.category === 'future').sort(sortByDateDesc),
      pastClients: clientsWithPrestation.filter(c => c.category === 'past').sort(sortByDateDesc),
    };
  }, [clients, prestations, search, isToday, isFuture]);

  const handleSubmit = useCallback(async (data: Omit<Client, 'id' | 'dateCreation' | 'salonId' | 'createdBy'>) => {
    await addClient(data);
    closeForm();
  }, [addClient, closeForm]);

  const renderClientItem = (client: ClientWithPrestation, index: number) => (
    <li
      key={client.id}
      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 animate-slide-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <Link
        to={`/clients/${client.id}`}
        className="flex items-center justify-between p-4"
      >
        <div>
          <div className="font-medium text-gray-800 dark:text-white">
            {client.prenom} {client.nom}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {client.telephone}
            {client.lastPrestationDate && (
              <span className="ml-2 text-gold">
                • {client.lastPrestationDate.toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </div>
        <svg
          className="w-5 h-5 text-gray-400 transition-transform duration-200 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    </li>
  );

  const renderSection = (title: string, sectionKey: string, clients: ClientWithPrestation[], bgColor: string) => {
    if (clients.length === 0) return null;
    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="animate-fade-in">
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className={`${bgColor} px-4 py-2.5 font-medium text-sm uppercase tracking-wider w-full flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity duration-200`}
        >
          <span>{title} ({clients.length})</span>
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {clients.map((client, index) => renderClientItem(client, index))}
          </ul>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400 animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="font-elegant text-2xl font-semibold text-gray-800 dark:text-white">Clients</h1>
        <button
          onClick={openForm}
          className="text-white px-4 py-2 rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
          style={{ backgroundColor: 'var(--color-gold)' }}
        >
          + Nouveau client
        </button>
      </div>

      <div className="mb-4 flex-shrink-0">
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200"
        />
      </div>

      <Modal
        isOpen={formVisible}
        title="Nouveau client"
        onClose={closeForm}
        footer={
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="client-form"
              disabled={submitting}
              className="px-4 py-2 text-white rounded-xl disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
              style={{ backgroundColor: 'var(--color-gold)' }}
            >
              {submitting ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>
        }
      >
        <ClientForm
          formId="client-form"
          onSubmit={handleSubmit}
          onCancel={closeForm}
          onSubmittingChange={setSubmitting}
        />
      </Modal>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex-1 flex flex-col min-h-0">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {search ? 'Aucun client trouvé' : 'Aucun client enregistré'}
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {renderSection('Aujourd\'hui', 'today', todayClients, 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300')}
            {renderSection('À venir', 'future', futureClients, 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300')}
            {renderSection('Passé', 'past', pastClients, 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400')}
          </div>
        )}
      </div>
    </div>
  );
}
