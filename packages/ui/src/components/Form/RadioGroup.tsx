'use client';

interface RadioGroupProps {
  name: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  error,
}: RadioGroupProps) {
  return (
    <div className="space-y-4">
      {options.map((option) => (
        <div key={option.value} className="flex items-center">
          <input
            type="radio"
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className={`h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 ${
              error ? 'border-red-300' : ''
            }`}
          />
          <label
            htmlFor={`${name}-${option.value}`}
            className="ml-3 block text-sm font-medium text-gray-700"
          >
            {option.label}
          </label>
        </div>
      ))}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}