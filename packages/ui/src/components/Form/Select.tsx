'use client';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  name: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function Select({
  name,
  options,
  value,
  onChange,
  required,
  placeholder,
  error,
  className = '',
}: SelectProps) {
  return (
    <select
      name={name}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      required={required}
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
        error ? 'border-red-300' : ''
      } ${className}`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}