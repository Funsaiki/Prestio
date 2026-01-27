import { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { TYPE_POSE_LABELS, COURBE_OPTIONS } from '../types';
import type { Prestation, TypePose, Courbe } from '../types';

registerLocale('fr', fr);

interface PrestationFormProps {
  initialData?: Prestation;
  onSubmit: (data: Omit<Prestation, 'id' | 'clientId'>) => Promise<void>;
  onCancel: () => void;
}

const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200";
const labelClass = "block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5";

export function PrestationForm({ initialData, onSubmit, onCancel }: PrestationFormProps) {
  const [formData, setFormData] = useState({
    typePose: initialData?.typePose || ('cil_a_cil' as TypePose),
    date: initialData?.date || new Date(),
    courbe: (initialData?.courbe || '') as Courbe | '',
    longueur: initialData?.longueur || '',
    mapping: initialData?.mapping || '',
    modePaiement: initialData?.modePaiement || '',
    prix: initialData?.prix || 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [mapGuideVisible, setMapGuideVisible] = useState(false);
  const [mapGuideClosing, setMapGuideClosing] = useState(false);
  const [datePickerClosing, setDatePickerClosing] = useState(false);

  const handleDatePickerClose = () => {
    setDatePickerClosing(true);
    setTimeout(() => setDatePickerClosing(false), 200);
  };

  const toggleMapGuide = () => {
    if (mapGuideVisible) {
      setMapGuideClosing(true);
      setTimeout(() => {
        setMapGuideVisible(false);
        setMapGuideClosing(false);
      }, 250);
    } else {
      setMapGuideVisible(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        typePose: formData.typePose,
        date: formData.date,
        courbe: formData.courbe,
        longueur: formData.longueur,
        mapping: formData.mapping,
        modePaiement: formData.modePaiement,
        prix: formData.prix,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <label className={labelClass}>Type de pose *</label>
          <select
            required
            value={formData.typePose}
            onChange={(e) =>
              setFormData({ ...formData, typePose: e.target.value as TypePose })
            }
            className={inputClass}
          >
            {Object.entries(TYPE_POSE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Courbure</label>
          <select
            value={formData.courbe}
            onChange={(e) =>
              setFormData({ ...formData, courbe: e.target.value as Courbe | '' })
            }
            className={inputClass}
          >
            <option value="">-</option>
            {COURBE_OPTIONS.map((courbe) => (
              <option key={courbe} value={courbe}>
                {courbe}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Longueur</label>
          <input
            type="text"
            value={formData.longueur}
            onChange={(e) => setFormData({ ...formData, longueur: e.target.value })}
            className={inputClass}
            placeholder="ex: 10-12mm"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Mapping</label>
          <button
            type="button"
            onClick={toggleMapGuide}
            className="text-xs text-gold hover:text-gold-light transition-colors duration-200 flex items-center gap-1"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${mapGuideVisible && !mapGuideClosing ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {mapGuideVisible && !mapGuideClosing ? 'Masquer le guide' : 'Voir le guide'}
          </button>
        </div>

        {mapGuideVisible && (
          <div className={`mb-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 ${mapGuideClosing ? 'animate-scale-out' : 'animate-scale-in'}`}>
            <img
              src="/map-bg.png"
              alt="Guide de mapping"
              className="w-full max-w-md mx-auto rounded-lg"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              Poupée • Œil de chat • Écureuil
            </p>
          </div>
        )}

        <input
          type="text"
          value={formData.mapping}
          onChange={(e) => setFormData({ ...formData, mapping: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Mode de paiement</label>
          <input
            type="text"
            value={formData.modePaiement}
            onChange={(e) => setFormData({ ...formData, modePaiement: e.target.value })}
            className={inputClass}
            placeholder="Carte, espèces, etc."
          />
        </div>
        <div>
          <label className={labelClass}>Prix (€) *</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.prix}
            onChange={(e) => setFormData({ ...formData, prix: parseFloat(e.target.value) })}
            className={inputClass}
          />
        </div>
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
