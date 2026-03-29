import ReactSelect from 'react-select';
import type { StylesConfig } from 'react-select';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function Select({ options, value, onChange, placeholder = 'Sélectionner...', required }: SelectProps) {
  const selectedOption = options.find(opt => opt.value === value) || null;

  const customStyles: StylesConfig<Option, false> = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'var(--select-bg, #f9fafb)',
      borderColor: state.isFocused ? 'var(--color-gold)' : 'var(--select-border, #e5e7eb)',
      borderRadius: '0.75rem',
      padding: '0.125rem 0',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(201, 168, 108, 0.3)' : 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': {
        borderColor: 'var(--color-gold)',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--select-bg, #ffffff)',
      borderRadius: '0.75rem',
      border: '1px solid var(--select-border, #e5e7eb)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      zIndex: 9999,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menuList: (base) => ({
      ...base,
      padding: '0.25rem',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'var(--color-gold)'
        : state.isFocused
        ? 'rgba(201, 168, 108, 0.15)'
        : 'transparent',
      color: state.isSelected ? 'white' : 'var(--select-text, #374151)',
      borderRadius: '0.5rem',
      padding: '0.5rem 0.75rem',
      cursor: 'pointer',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      '&:active': {
        backgroundColor: state.isSelected ? 'var(--color-gold)' : 'rgba(201, 168, 108, 0.25)',
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: 'var(--select-text, #1f2937)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: '#9ca3af',
      transition: 'transform 0.2s',
      transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      '&:hover': {
        color: 'var(--color-gold)',
      },
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
  };

  return (
    <ReactSelect
      options={options}
      value={selectedOption}
      onChange={(option) => onChange(option?.value || '')}
      placeholder={placeholder}
      styles={customStyles}
      isSearchable={false}
      required={required}
      menuPortalTarget={document.body}
      menuPosition="fixed"
      getOptionLabel={(option) => option.label}
      formatOptionLabel={(option) => (
        <span title={option.label}>{option.label}</span>
      )}
      classNames={{
        control: () => 'dark:!bg-gray-700 dark:!border-gray-600',
        menu: () => 'dark:!bg-gray-700 dark:!border-gray-600',
        option: () => 'dark:!text-gray-100',
        singleValue: () => 'dark:!text-white',
      }}
    />
  );
}
