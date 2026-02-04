import type { CustomField } from '../types/multi-tenant';
import { Select } from './Select';
import { Checkbox } from './Checkbox';

interface CustomFieldInputProps {
  field: CustomField;
  value: unknown;
  onChange: (value: unknown) => void;
}

const inputClass = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200";
const labelClass = "block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5";

export function CustomFieldInput({ field, value, onChange }: CustomFieldInputProps) {
  const renderInput = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        );

      case 'number':
        return (
          <div className="relative">
            <input
              type="number"
              value={(value as number) ?? ''}
              onChange={(e) => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
              className={field.unit ? `${inputClass} pr-12` : inputClass}
              placeholder={field.placeholder}
              required={field.required}
            />
            {field.unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                {field.unit}
              </span>
            )}
          </div>
        );

      case 'select':
        return (
          <Select
            options={[
              { value: '', label: '-' },
              ...(field.options || []),
            ]}
            value={(value as string) || ''}
            onChange={(v) => onChange(v)}
            placeholder="Sélectionner..."
          />
        );

      case 'checkbox':
        return (
          <Checkbox
            id={`custom-${field.id}`}
            checked={!!value}
            onChange={(checked) => onChange(checked)}
            label={field.label}
            required={field.required}
            className="py-2"
          />
        );

      default:
        return null;
    }
  };

  // Checkbox has its own label rendering
  if (field.type === 'checkbox') {
    return <div>{renderInput()}</div>;
  }

  return (
    <div>
      <label className={labelClass}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
    </div>
  );
}
