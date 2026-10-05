import * as React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  DRAFT: 'border-slate-200 bg-slate-100 text-slate-700',
  PUBLISHED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  SUBMITTED: 'border-blue-200 bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'border-amber-200 bg-amber-50 text-amber-800',
  AWARDED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  ACCEPTED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-red-200 bg-red-50 text-red-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
  COMPLETED: 'border-slate-200 bg-slate-100 text-slate-700',
  WITHDRAWN: 'border-slate-200 bg-slate-100 text-slate-600',
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  INACTIVE: 'border-slate-200 bg-slate-100 text-slate-600',
  SUSPENDED: 'border-red-200 bg-red-50 text-red-700',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const label = status.replaceAll('_', ' ').toLowerCase();

  return (
    <span
      className={[
        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]',
        statusStyles[status] || 'border-slate-200 bg-slate-100 text-slate-700',
        className,
      ].join(' ')}
    >
      {label}
    </span>
  );
}
