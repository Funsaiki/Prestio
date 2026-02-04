import { useId } from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  id: providedId,
  required,
  disabled,
  className = ''
}: CheckboxProps) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <label
          htmlFor={id}
          className={`
            flex items-center justify-center
            w-5 h-5
            rounded-md
            border-2
            transition-all duration-200
            cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${checked
              ? 'bg-gold border-gold'
              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 hover:border-gold'
            }
          `}
        >
          {/* Checkmark icon */}
          <svg
            className={`w-3 h-3 text-white transition-all duration-200 ${checked ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </label>
        {/* Focus ring */}
        <div className="absolute inset-0 rounded-md peer-focus-visible:ring-2 peer-focus-visible:ring-gold peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-gray-800 pointer-events-none" />
      </div>

      {label && (
        <label
          htmlFor={id}
          className={`
            text-gray-700 dark:text-gray-300
            cursor-pointer select-none
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
    </div>
  );
}
