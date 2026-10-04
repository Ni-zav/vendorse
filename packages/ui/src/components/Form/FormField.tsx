'use client';

import { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  hint?: string;
}

export function FormField({
  label,
  children,
  error,
  required,
  className = '',
  hint,
}: FormFieldProps) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <label className="block text-sm font-semibold text-slate-800">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  );
}
