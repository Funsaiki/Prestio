import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CustomField, CustomFieldType, SelectOption } from '../../types/multi-tenant';
import { Modal } from '../../components/Modal';
import { Checkbox } from '../../components/Checkbox';

interface FieldsConfigTabProps {
  title: string;
  description: string;
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  showDefaultPrices?: boolean; // Pour les prestations uniquement
}

const FIELD_TYPE_KEYS: { value: CustomFieldType; labelKey: string }[] = [
  { value: 'text', labelKey: 'fields.text' },
  { value: 'textarea', labelKey: 'fields.longText' },
  { value: 'number', labelKey: 'fields.number' },
  { value: 'select', labelKey: 'fields.dropdown' },
  { value: 'checkbox', labelKey: 'fields.checkbox' },
];

const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200";
const labelClass = "block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5";

function generateId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateName(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function FieldsConfigTab({ title, description, fields, onChange, showDefaultPrices = false }: FieldsConfigTabProps) {
  const { t } = useTranslation();
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  const handleAddField = () => {
    const newField: CustomField = {
      id: generateId(),
      name: '',
      label: '',
      type: 'text',
      required: false,
      order: fields.length,
    };
    setEditingField(newField);
    setIsModalOpen(true);
  };

  const handleEditField = (field: CustomField) => {
    setEditingField({ ...field });
    setIsModalOpen(true);
  };

  const handleSaveField = (field: CustomField) => {
    // Generate name from label if empty
    if (!field.name && field.label) {
      field.name = generateName(field.label);
    }

    const existingIndex = fields.findIndex(f => f.id === field.id);
    let newFields: CustomField[];

    if (existingIndex >= 0) {
      // Update existing
      newFields = fields.map(f => f.id === field.id ? field : f);
    } else {
      // Add new
      newFields = [...fields, field];
    }

    onChange(newFields);
    setIsModalOpen(false);
    setEditingField(null);
  };

  const handleDeleteField = (fieldId: string) => {
    const newFields = fields
      .filter(f => f.id !== fieldId)
      .map((f, index) => ({ ...f, order: index }));
    onChange(newFields);
    setDeleteConfirm(null);
  };

  const handleMoveUp = (fieldId: string) => {
    const index = sortedFields.findIndex(f => f.id === fieldId);
    if (index <= 0) return;

    const newFields = fields.map(f => {
      if (f.id === fieldId) return { ...f, order: f.order - 1 };
      if (f.id === sortedFields[index - 1].id) return { ...f, order: f.order + 1 };
      return f;
    });
    onChange(newFields);
  };

  const handleMoveDown = (fieldId: string) => {
    const index = sortedFields.findIndex(f => f.id === fieldId);
    if (index >= sortedFields.length - 1) return;

    const newFields = fields.map(f => {
      if (f.id === fieldId) return { ...f, order: f.order + 1 };
      if (f.id === sortedFields[index + 1].id) return { ...f, order: f.order - 1 };
      return f;
    });
    onChange(newFields);
  };

  const getTypeLabel = (type: CustomFieldType) => {
    const found = FIELD_TYPE_KEYS.find(ft => ft.value === type);
    return found ? t(found.labelKey) : type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          </div>
          <button
            onClick={handleAddField}
            className="px-4 py-2 bg-gold text-white rounded-xl hover:bg-gold-light transition-all duration-200 cursor-pointer flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('fields.addField')}
          </button>
        </div>

        {/* Fields List */}
        {sortedFields.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>{t('fields.noFields')}</p>
            <p className="text-sm mt-1">{t('fields.noFieldsHint')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedFields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl group"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMoveUp(field.id)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title={t('fields.moveUp')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveDown(field.id)}
                    disabled={index === sortedFields.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title={t('fields.moveDown')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Field info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 dark:text-white truncate">
                      {field.label}
                    </span>
                    {field.required && (
                      <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                        {t('fields.required')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{getTypeLabel(field.type)}</span>
                    {field.type === 'select' && field.options && (
                      <span>({field.options.length} options)</span>
                    )}
                    {field.type === 'number' && field.unit && (
                      <span>({field.unit})</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditField(field)}
                    className="p-2 text-gray-500 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors cursor-pointer"
                    title={t('fields.modify')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(field.id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                    title={t('fields.delete')}
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
      </div>

      {/* Edit Modal */}
      {editingField && (
        <FieldEditModal
          isOpen={isModalOpen}
          field={editingField}
          showDefaultPrices={showDefaultPrices}
          onSave={handleSaveField}
          onClose={() => {
            setIsModalOpen(false);
            setEditingField(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        title={t('fields.deleteField')}
        onClose={() => setDeleteConfirm(null)}
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => deleteConfirm && handleDeleteField(deleteConfirm)}
              className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors cursor-pointer"
            >
              {t('fields.deleteButton')}
            </button>
          </div>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">
          {t('fields.deleteConfirm')}
        </p>
      </Modal>
    </div>
  );
}

// ===== Field Edit Modal =====

interface FieldEditModalProps {
  isOpen: boolean;
  field: CustomField;
  showDefaultPrices: boolean;
  onSave: (field: CustomField) => void;
  onClose: () => void;
}

function FieldEditModal({ isOpen, field, showDefaultPrices, onSave, onClose }: FieldEditModalProps) {
  const { t } = useTranslation();
  const [localField, setLocalField] = useState<CustomField>(field);
  const [errors, setErrors] = useState<{ label?: string }>({});

  const isNew = !field.label;

  const handleTypeChange = (type: CustomFieldType) => {
    const updates: Partial<CustomField> = { type };

    // Reset type-specific fields
    if (type !== 'select') {
      updates.options = undefined;
      updates.defaultPrices = undefined;
    } else if (!localField.options) {
      updates.options = [];
    }

    if (type !== 'number') {
      updates.unit = undefined;
    }

    setLocalField({ ...localField, ...updates });
  };

  const handleAddOption = () => {
    const options = localField.options || [];
    setLocalField({
      ...localField,
      options: [...options, { value: '', label: '' }],
    });
  };

  const handleUpdateOption = (index: number, updates: Partial<SelectOption>) => {
    const options = [...(localField.options || [])];
    const oldOption = options[index];
    options[index] = { ...oldOption, ...updates };

    // Auto-generate value from label (keep in sync while user types)
    if (updates.label !== undefined) {
      const oldValue = oldOption.value;
      const wasAutoGenerated = !oldValue || oldValue === generateName(oldOption.label);
      if (wasAutoGenerated) {
        options[index].value = generateName(updates.label);
      }
    }

    setLocalField({ ...localField, options });
  };

  const handleRemoveOption = (index: number) => {
    const options = [...(localField.options || [])];
    const removedOption = options[index];
    options.splice(index, 1);

    // Also remove from defaultPrices if exists
    if (localField.defaultPrices && removedOption.value) {
      const newPrices = { ...localField.defaultPrices };
      delete newPrices[removedOption.value];
      setLocalField({ ...localField, options, defaultPrices: newPrices });
    } else {
      setLocalField({ ...localField, options });
    }
  };

  const handleDefaultPriceChange = (optionValue: string, price: number | null) => {
    const defaultPrices = { ...(localField.defaultPrices || {}) };
    if (price === null) {
      delete defaultPrices[optionValue];
    } else {
      defaultPrices[optionValue] = price;
    }
    setLocalField({ ...localField, defaultPrices });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!localField.label.trim()) {
      setErrors({ label: t('fields.labelRequired') });
      return;
    }

    // Clean up options - remove empty ones, generate values, ensure uniqueness
    if (localField.type === 'select' && localField.options) {
      const usedValues = new Set<string>();
      const cleanedOptions = localField.options
        .filter(opt => opt.label.trim())
        .map(opt => {
          let value = opt.value || generateName(opt.label);
          // Ensure unique values
          const baseValue = value;
          let counter = 2;
          while (usedValues.has(value)) {
            value = `${baseValue}_${counter}`;
            counter++;
          }
          usedValues.add(value);
          return { ...opt, value };
        });
      localField.options = cleanedOptions;
    }

    onSave(localField);
  };

  return (
    <Modal
      isOpen={isOpen}
      title={isNew ? t('fields.newField') : t('fields.editField')}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-gold text-white rounded-xl hover:bg-gold-light transition-colors cursor-pointer"
          >
            {isNew ? t('common.add') : t('common.save')}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Label */}
        <div>
          <label className={labelClass}>{t('fields.label')} *</label>
          <input
            type="text"
            value={localField.label}
            onChange={(e) => {
              setLocalField({ ...localField, label: e.target.value });
              if (errors.label) setErrors({});
            }}
            className={errors.label ? `${inputClass} border-red-400` : inputClass}
            placeholder={t('fields.labelPlaceholder')}
          />
          {errors.label && (
            <p className="mt-1 text-sm text-red-500">{errors.label}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className={labelClass}>{t('fields.fieldType')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FIELD_TYPE_KEYS.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTypeChange(type.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  localField.type === type.value
                    ? 'bg-gold text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t(type.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Required */}
        <Checkbox
          id="field-required"
          checked={localField.required}
          onChange={(checked) => setLocalField({ ...localField, required: checked })}
          label={t('fields.requiredField')}
        />

        {/* Placeholder (for text/textarea) */}
        {(localField.type === 'text' || localField.type === 'textarea') && (
          <div>
            <label className={labelClass}>{t('fields.placeholder')}</label>
            <input
              type="text"
              value={localField.placeholder || ''}
              onChange={(e) => setLocalField({ ...localField, placeholder: e.target.value })}
              className={inputClass}
              placeholder={t('fields.placeholderHint')}
            />
          </div>
        )}

        {/* Unit (for number) */}
        {localField.type === 'number' && (
          <div>
            <label className={labelClass}>{t('fields.unit')}</label>
            <input
              type="text"
              value={localField.unit || ''}
              onChange={(e) => setLocalField({ ...localField, unit: e.target.value })}
              className={inputClass}
              placeholder={t('fields.unitPlaceholder')}
            />
          </div>
        )}

        {/* Options (for select) */}
        {localField.type === 'select' && (
          <div>
            <label className={labelClass}>{t('fields.options')}</label>
            <div className="space-y-2">
              {(localField.options || []).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => handleUpdateOption(index, { label: e.target.value })}
                    className={`${inputClass} flex-1`}
                    placeholder={t('fields.optionPlaceholder')}
                  />
                  {showDefaultPrices && option.value && (
                    <div className="relative w-28">
                      <input
                        type="number"
                        value={localField.defaultPrices?.[option.value] ?? ''}
                        onChange={(e) => handleDefaultPriceChange(
                          option.value,
                          e.target.value === '' ? null : parseFloat(e.target.value)
                        )}
                        className={`${inputClass} pr-8 text-right`}
                        placeholder={t('fields.price')}
                        step="0.01"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                        €
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-gold hover:text-gold transition-colors cursor-pointer text-sm"
              >
                + {t('fields.addOption')}
              </button>
            </div>
            {showDefaultPrices && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t('fields.defaultPriceHint')}
              </p>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
