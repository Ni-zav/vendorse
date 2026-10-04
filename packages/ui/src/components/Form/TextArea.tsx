'use client';

import { forwardRef } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className = '', error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={[
        'block w-full rounded-xl border bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400',
        'focus:border-blue-500 focus:ring-4 focus:ring-blue-100',
        error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-300',
        className,
      ].join(' ')}
      aria-invalid={error ? true : undefined}
      {...props}
    />
  ),
);

TextArea.displayName = 'TextArea';
