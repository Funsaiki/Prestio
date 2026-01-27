interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
}

export function NumberInput({ value, onChange, min = 0, max, placeholder }: NumberInputProps) {
  const numValue = value === '' ? null : parseInt(value, 10);

  const handleDecrement = () => {
    if (numValue === null) {
      onChange(min.toString());
    } else if (numValue > min) {
      onChange((numValue - 1).toString());
    }
  };

  const handleIncrement = () => {
    if (numValue === null) {
      onChange(min.toString());
    } else if (max === undefined || numValue < max) {
      onChange((numValue + 1).toString());
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (max !== undefined && num > max) {
        onChange(max.toString());
      } else if (num < min) {
        onChange(min.toString());
      } else {
        onChange(num.toString());
      }
    }
  };

  const canDecrement = numValue !== null && numValue > min;
  const canIncrement = numValue === null || max === undefined || numValue < max;

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={!canDecrement}
        className="px-3 py-2.5 border border-r-0 border-gray-200 dark:border-gray-600 rounded-l-xl bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border-y border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-gold focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center transition-all duration-200 outline-none"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={!canIncrement}
        className="px-3 py-2.5 border border-l-0 border-gray-200 dark:border-gray-600 rounded-r-xl bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
