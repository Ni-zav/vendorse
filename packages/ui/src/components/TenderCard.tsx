import * as React from 'react';
import { formatCurrency, formatDate } from '@vendorse/shared';
import { StatusBadge } from './StatusBadge';

interface TenderCardProps {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string | Date;
  status: string;
  createdBy: {
    organization: {
      name: string;
    };
  };
  bidCount?: number;
  onClick?: () => void;
  className?: string;
}

export function TenderCard({
  title,
  description,
  budget,
  deadline,
  status,
  createdBy,
  bidCount,
  onClick,
  className = '',
}: TenderCardProps) {
  const deadlineDate = new Date(deadline);
  const hoursRemaining = Math.ceil(
    (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60),
  );
  const urgency =
    status === 'PUBLISHED' && hoursRemaining > 0 && hoursRemaining <= 72
      ? hoursRemaining <= 24
        ? 'Closes within 24 hours'
        : 'Closes within 3 days'
      : null;

  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {createdBy.organization.name}
          </p>
          <h3 className="mt-2 text-lg font-bold leading-6 text-slate-950">
            {title}
          </h3>
        </div>
        <StatusBadge status={status} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
        <div>
          <dt className="text-xs font-medium text-slate-500">Budget ceiling</dt>
          <dd className="mt-1 truncate text-sm font-semibold text-slate-900">
            {formatCurrency(budget)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Submission deadline</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {formatDate(deadlineDate)}
          </dd>
        </div>
        {typeof bidCount === 'number' && (
          <div className="col-span-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <dt className="text-xs font-medium text-slate-500">Responses received</dt>
            <dd className="text-sm font-bold text-slate-900">{bidCount}</dd>
          </div>
        )}
      </dl>

      {urgency && (
        <p className="mt-4 text-xs font-semibold text-amber-700">{urgency}</p>
      )}
    </>
  );

  const classes = [
    'h-full w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition',
    onClick
      ? 'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
      : '',
    className,
  ].join(' ');

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {body}
      </button>
    );
  }

  return <div className={classes}>{body}</div>;
}
