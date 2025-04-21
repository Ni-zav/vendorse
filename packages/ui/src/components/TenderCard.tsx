import * as React from 'react';
import { CalendarIcon, CurrencyDollarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '@vendorse/shared';

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
  bids?: Array<any>;
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
  bids,
  onClick,
  className = '',
}: TenderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'AWARDED':
        return 'bg-blue-100 text-blue-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={`bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {title}
          </h3>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              status
            )}`}
          >
            {status}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-600 truncate">{description}</p>
        <dl className="mt-4 space-y-2">
          <div className="flex justify-between">
            <dt className="text-sm font-medium text-gray-500">Budget</dt>
            <dd className="text-sm text-gray-900">{formatCurrency(budget)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm font-medium text-gray-500">Deadline</dt>
            <dd className="text-sm text-gray-900">
              {formatDate(new Date(deadline))}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm font-medium text-gray-500">Posted by</dt>
            <dd className="text-sm text-gray-900">{createdBy.organization.name}</dd>
          </div>
          {bids && (
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Bids</dt>
              <dd className="text-sm text-gray-900">{bids.length}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}