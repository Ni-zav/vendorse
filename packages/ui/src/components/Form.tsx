import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ className = '', error, ...props }: InputProps) {
  return (
    <input
      className={`
        block w-full rounded-md shadow-sm sm:text-sm
        ${error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }
        ${className}
      `}
      {...props}
    />
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export function TextArea({ className = '', error, ...props }: TextAreaProps) {
  return (
    <textarea
      className={`
        block w-full rounded-md shadow-sm sm:text-sm
        ${error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }
        ${className}
      `}
      {...props}
    />
  );
}

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  value?: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  error?: string;
}

export function RadioGroup({ name, value, onChange, options, error }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center space-x-3 cursor-pointer"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className={`
              h-4 w-4
              ${error
                ? 'border-red-300 text-red-600 focus:ring-red-500'
                : 'border-gray-300 text-blue-600 focus:ring-blue-500'
              }
            `}
          />
          <span className="text-sm text-gray-900">{option.label}</span>
        </label>
      ))}
    </div>
  );
}