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
      onChange={(event) => onChange?.(event.target.value)}
      required={required}
      aria-invalid={error ? true : undefined}
      className={[
        'block min-h-11 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition',
        'focus:border-blue-500 focus:ring-4 focus:ring-blue-100',
        error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300',
        className,
      ].join(' ')}
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
