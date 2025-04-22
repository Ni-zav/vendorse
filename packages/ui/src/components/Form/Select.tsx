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
      className={`block w-full rounded-md shadow-sm text-gray-800 bg-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
        error ? 'border-red-300' : 'border-gray-300'
      } ${className}`}
    >
      {placeholder && (
        <option value="" disabled className="text-gray-500">
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value} className="text-gray-800">
          {option.label}
        </option>
      ))}
    </select>
  );
}