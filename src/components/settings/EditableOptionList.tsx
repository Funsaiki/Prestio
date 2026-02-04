import { useState } from 'react';
import { Modal } from '../Modal';

interface SelectOption {
  value: string;
  label: string;
}

interface EditableOptionListProps {
  title: string;
  options: SelectOption[];
  onChange: (options: SelectOption[]) => void;
  valueEditable?: boolean; // If false, value is auto-generated from label
}

export function EditableOptionList({ title, options, onChange, valueEditable = false }: EditableOptionListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editLabel, setEditLabel] = useState('');

  const generateValue = (label: string) => {
    return label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleAdd = () => {
    setAddingNew(true);
    setEditValue('');
    setEditLabel('');
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(options[index].value);
    setEditLabel(options[index].label);
  };

  const handleSave = () => {
    const label = editLabel.trim();
    if (!label) return;

    const value = valueEditable ? editValue.trim() : generateValue(label);
    if (!value) return;

    // Check for duplicates
    const isDuplicate = options.some((opt, idx) =>
      idx !== editingIndex && (opt.value === value || opt.label === label)
    );
    if (isDuplicate) return;

    if (addingNew) {
      onChange([...options, { value, label }]);
    } else if (editingIndex !== null) {
      const newOptions = [...options];
      newOptions[editingIndex] = { value, label };
      onChange(newOptions);
    }

    handleCancel();
  };

  const handleDelete = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOptions = [...options];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    onChange(newOptions);
  };

  const handleMoveDown = (index: number) => {
    if (index === options.length - 1) return;
    const newOptions = [...options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    onChange(newOptions);
  };

  const handleCancel = () => {
    setAddingNew(false);
    setEditingIndex(null);
    setEditValue('');
    setEditLabel('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 bg-gold/10 text-gold rounded-lg hover:bg-gold/20 transition-colors cursor-pointer text-sm font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter
        </button>
      </div>

      {options.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
          Aucune option. Cliquez sur "Ajouter" pour en créer une.
        </p>
      ) : (
        <div className="space-y-2">
          {options.map((option, index) => (
            <div
              key={option.value}
              className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl group"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === options.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Option info */}
              <div className="flex-1 min-w-0">
                <span className="text-gray-800 dark:text-white font-medium">{option.label}</span>
                {valueEditable && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                    ({option.value})
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(index)}
                  className="p-1.5 text-gray-500 hover:text-gold rounded-lg hover:bg-gold/10 transition-colors cursor-pointer"
                  title="Modifier"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="p-1.5 text-gray-500 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  title="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={addingNew || editingIndex !== null}
        onClose={handleCancel}
        title={addingNew ? 'Ajouter une option' : 'Modifier l\'option'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Libellé *
            </label>
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: Volume russe"
              autoFocus
            />
          </div>

          {valueEditable && (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Valeur technique *
              </label>
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                placeholder="Ex: volume_russe"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Identifiant unique utilisé en interne
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!editLabel.trim() || (valueEditable && !editValue.trim())}
              className="px-4 py-2 bg-gold text-white rounded-xl hover:bg-gold-light transition-colors disabled:opacity-50 cursor-pointer"
            >
              {addingNew ? 'Ajouter' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
