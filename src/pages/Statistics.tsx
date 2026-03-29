import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import { useClients } from '../hooks/useClients';
import { usePrestations } from '../hooks/usePrestations';
import { useAuth } from '../contexts/AuthContext';
import { Select } from '../components/Select';
import { DEFAULT_SALON_CONFIG } from '../types/multi-tenant';

registerLocale('fr', fr);

const COLORS = ['#c9a86c', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

type FilterPreset = 'thisMonth' | 'last3Months' | 'last6Months' | 'thisYear' | 'all' | 'custom';

export function Statistics() {
  const { clients, loading: loadingClients } = useClients();
  const { prestations, loading: loadingPrestations } = usePrestations();
  const { salonConfig } = useAuth();

  const [filterPreset, setFilterPreset] = useState<FilterPreset>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Champs de prestation configurés
  const prestationFields = useMemo(() => {
    return salonConfig?.prestationFields ?? DEFAULT_SALON_CONFIG.prestationFields;
  }, [salonConfig?.prestationFields]);

  // Tous les champs select (pour la répartition dynamique)
  const selectFields = useMemo(() => {
    return prestationFields.filter(f => f.type === 'select' && f.options && f.options.length > 0);
  }, [prestationFields]);

  const [selectedFieldIndex, setSelectedFieldIndex] = useState(0);

  const activeSelectField = selectFields[selectedFieldIndex] || null;

  const getPresetDates = (preset: FilterPreset): { start: Date | null; end: Date | null } => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    switch (preset) {
      case 'thisMonth':
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
      case 'last3Months':
        return { start: new Date(now.getFullYear(), now.getMonth() - 2, 1), end: now };
      case 'last6Months':
        return { start: new Date(now.getFullYear(), now.getMonth() - 5, 1), end: now };
      case 'thisYear':
        return { start: new Date(now.getFullYear(), 0, 1), end: now };
      case 'all':
        return { start: null, end: null };
      case 'custom':
        return { start: startDate, end: endDate };
      default:
        return { start: null, end: null };
    }
  };

  const handlePresetChange = (preset: FilterPreset) => {
    setFilterPreset(preset);
    if (preset !== 'custom') {
      const { start, end } = getPresetDates(preset);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const filteredPrestations = useMemo(() => {
    const { start, end } = filterPreset === 'custom'
      ? { start: startDate, end: endDate }
      : getPresetDates(filterPreset);

    return prestations.filter(p => {
      if (start && p.date < start) return false;
      if (end) {
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        if (p.date > endOfDay) return false;
      }
      return true;
    });
  }, [prestations, filterPreset, startDate, endDate]);

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // CA sur la période
    const totalRevenue = filteredPrestations.reduce((sum, p) => sum + p.prix, 0);

    // Répartition par le champ select actif
    let fieldDistribution: { name: string; value: number; percentage: number }[] = [];

    if (activeSelectField && activeSelectField.options) {
      const knownValues = activeSelectField.options.map(opt => opt.value);

      fieldDistribution = activeSelectField.options.map(opt => {
        const count = filteredPrestations.filter(p => p.values[activeSelectField.name] === opt.value).length;
        return {
          name: opt.label,
          value: count,
          percentage: filteredPrestations.length > 0 ? Math.round((count / filteredPrestations.length) * 100) : 0,
        };
      }).filter(t => t.value > 0);

      const otherCount = filteredPrestations.filter(p => {
        const value = p.values[activeSelectField.name];
        return !value || !knownValues.includes(value as string);
      }).length;

      if (otherCount > 0) {
        fieldDistribution.push({
          name: 'Autre',
          value: otherCount,
          percentage: filteredPrestations.length > 0 ? Math.round((otherCount / filteredPrestations.length) * 100) : 0,
        });
      }
    }

    // Top clients
    const clientPrestationCount: Record<string, { count: number; revenue: number; clientId: string }> = {};
    filteredPrestations.forEach(p => {
      if (!clientPrestationCount[p.clientId]) {
        clientPrestationCount[p.clientId] = { count: 0, revenue: 0, clientId: p.clientId };
      }
      clientPrestationCount[p.clientId].count++;
      clientPrestationCount[p.clientId].revenue += p.prix;
    });

    const topClients = Object.values(clientPrestationCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => {
        const client = clients.find(c => c.id === item.clientId);
        return {
          name: client ? `${client.prenom} ${client.nom}` : 'Client inconnu',
          prestations: item.count,
          revenue: item.revenue,
        };
      });

    // Clients à relancer (pas de prestation depuis 30 jours)
    const clientsToFollowUp = clients.filter(client => {
      const clientPrestations = prestations.filter(p => p.clientId === client.id);
      if (clientPrestations.length === 0) return true;
      const lastPrestation = clientPrestations.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      return lastPrestation.date < thirtyDaysAgo;
    }).map(client => {
      const clientPrestations = prestations.filter(p => p.clientId === client.id);
      const lastPrestation = clientPrestations.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      return {
        id: client.id,
        name: `${client.prenom} ${client.nom}`,
        lastVisit: lastPrestation?.date || null,
        totalPrestations: clientPrestations.length,
      };
    }).slice(0, 5);

    // CA par mois (6 derniers mois)
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthPrestations = filteredPrestations.filter(p => p.date >= monthStart && p.date <= monthEnd);
      const revenue = monthPrestations.reduce((sum, p) => sum + p.prix, 0);
      revenueByMonth.push({
        name: monthStart.toLocaleDateString('fr-FR', { month: 'short' }),
        revenue,
      });
    }

    return {
      totalClients: clients.length,
      totalPrestations: filteredPrestations.length,
      totalRevenue,
      fieldDistribution,
      topClients,
      clientsToFollowUp,
      revenueByMonth,
    };
  }, [clients, prestations, filteredPrestations, activeSelectField]);

  if (loadingClients || loadingPrestations) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400 animate-pulse">Chargement...</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="font-elegant text-2xl font-semibold text-gray-800 dark:text-white">Statistiques</h1>
        <Link
          to="/"
          className="text-gray-600 dark:text-gray-400 hover:text-gold transition-colors duration-200 cursor-pointer"
        >
          Retour aux clients
        </Link>
      </div>

      <div className="overflow-y-auto flex-1 space-y-4 pr-1">
        {/* Filtre de période */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 animate-scale-in">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Période :</span>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'thisMonth', label: 'Ce mois' },
                { key: 'last3Months', label: '3 mois' },
                { key: 'last6Months', label: '6 mois' },
                { key: 'thisYear', label: 'Cette année' },
                { key: 'all', label: 'Tout' },
                { key: 'custom', label: 'Personnalisé' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetChange(key as FilterPreset)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filterPreset === key
                      ? 'bg-gold text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {filterPreset === 'custom' && (
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                <DatePicker
                  selected={startDate}
                  onChange={(dates: [Date | null, Date | null]) => {
                    const [start, end] = dates;
                    setStartDate(start);
                    setEndDate(end);
                  }}
                  startDate={startDate}
                  endDate={endDate}
                  selectsRange
                  placeholderText="Sélectionner une période"
                  locale="fr"
                  dateFormat="dd/MM/yyyy"
                  portalId="root"
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-48 focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Cartes principales */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 animate-scale-in">
            <div className="text-sm text-gray-500 dark:text-gray-400">Clients total</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalClients}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 animate-scale-in" style={{ animationDelay: '0.05s' }}>
            <div className="text-sm text-gray-500 dark:text-gray-400">Prestations</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalPrestations}</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-sm text-gray-500 dark:text-gray-400">Chiffre d'affaires</div>
            <div className="text-2xl font-bold text-gold mt-1">{formatCurrency(stats.totalRevenue)}</div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* CA par mois */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Chiffre d'affaires (6 derniers mois)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.revenueByMonth}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="revenue" fill="#c9a86c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition dynamique par champ select */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 animate-scale-in" style={{ animationDelay: '0.25s' }}>
            {selectFields.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">Répartition</h3>
                  {selectFields.length > 1 ? (
                    <div className="w-48">
                      <Select
                        options={selectFields.map((field, index) => ({
                          value: String(index),
                          label: field.label,
                        }))}
                        value={String(selectedFieldIndex)}
                        onChange={(v) => setSelectedFieldIndex(Number(v))}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">{selectFields[0].label}</span>
                  )}
                </div>
                {stats.fieldDistribution.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={150}>
                      <PieChart>
                        <Pie
                          data={stats.fieldDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          dataKey="value"
                        >
                          {stats.fieldDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {stats.fieldDistribution.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-gray-600 dark:text-gray-300 flex-1 truncate">{item.name}</span>
                          <span className="text-gray-900 dark:text-white font-medium">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune donnée</p>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Répartition</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Ajoutez des champs de type "Liste déroulante" dans les paramètres pour voir la répartition ici</p>
              </div>
            )}
          </div>
        </div>

        {/* Listes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top clients */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Top clients</h3>
            {stats.topClients.length > 0 ? (
              <ul className="space-y-2">
                {stats.topClients.map((client, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{client.name}</span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">{client.prestations} visites</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Aucune donnée</p>
            )}
          </div>

          {/* Clients à relancer */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 animate-scale-in" style={{ animationDelay: '0.35s' }}>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Clients à relancer</h3>
            {stats.clientsToFollowUp.length > 0 ? (
              <ul className="space-y-2">
                {stats.clientsToFollowUp.map((client) => (
                  <li key={client.id}>
                    <Link
                      to={`/clients/${client.id}`}
                      className="flex items-center justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 py-1 rounded-lg transition-colors duration-200"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{client.name}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {client.lastVisit
                          ? `${Math.floor((Date.now() - client.lastVisit.getTime()) / (1000 * 60 * 60 * 24))}j`
                          : 'Jamais'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">Tous les clients sont à jour</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
