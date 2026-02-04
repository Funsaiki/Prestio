import { useState } from 'react';
import { Modal } from '../Modal';

interface EditableStringListProps {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function EditableStringList({ title, items, onChange, placeholder = 'Nouvelle valeur' }: EditableStringListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    setAddingNew(true);
    setEditValue('');
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(items[index]);
  };

  const handleSave = () => {
    const value = editValue.trim();
    if (!value) return;

    // Check for duplicates
    const isDuplicate = items.some((item, idx) => idx !== editingIndex && item === value);
    if (isDuplicate) return;

    if (addingNew) {
      onChange([...items, value]);
    } else if (editingIndex !== null) {
      const newItems = [...items];
      newItems[editingIndex] = value;
      onChange(newItems);
    }

    handleCancel();
  };

  const handleDelete = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onChange(newItems);
  };

  const handleCancel = () => {
    setAddingNew(false);
    setEditingIndex(null);
    setEditValue('');
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

      {items.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
          Aucune option. Cliquez sur "Ajouter" pour en créer une.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg group"
            >
              {/* Reorder buttons */}
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === items.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Value */}
              <span className="text-gray-800 dark:text-white font-medium">{item}</span>

              {/* Action buttons */}
              <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(index)}
                  className="p-1 text-gray-500 hover:text-gold rounded transition-colors cursor-pointer"
                  title="Modifier"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="p-1 text-gray-500 hover:text-red-500 rounded transition-colors cursor-pointer"
                  title="Supprimer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
        title={addingNew ? 'Ajouter une valeur' : 'Modifier la valeur'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Valeur *
            </label>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={placeholder}
              autoFocus
            />
          </div>

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
              disabled={!editValue.trim()}
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
