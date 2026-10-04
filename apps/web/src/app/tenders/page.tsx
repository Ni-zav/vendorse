'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, TenderCard } from '@vendorse/ui';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

interface TenderListItem {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  createdBy: {
    organization: {
      name: string;
    };
  };
  _count?: {
    bids: number;
  };
}

const statuses = [
  'DRAFT',
  'PUBLISHED',
  'UNDER_REVIEW',
  'AWARDED',
  'COMPLETED',
  'CANCELLED',
];

export default function TendersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tenders, setTenders] = useState<TenderListItem[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setError('');
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/tenders?limit=100', {
          headers: {
            Authorization: 'Bearer ' + token,
          },
        });

        if (!response.ok) {
          throw new Error('Could not load tenders.');
        }

        const data = await response.json();
        setTenders(Array.isArray(data.tenders) ? data.tenders : []);
      } catch (loadError) {
        console.error('Error fetching tenders:', loadError);
        setError(
          loadError instanceof Error ? loadError.message : 'Could not load tenders.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTenders();
    }
  }, [user, router]);

  const visibleTenders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tenders.filter((tender) => {
      const matchesStatus = status === 'ALL' || tender.status === status;
      const matchesQuery =
        !normalizedQuery ||
        tender.title.toLowerCase().includes(normalizedQuery) ||
        tender.description.toLowerCase().includes(normalizedQuery) ||
        tender.createdBy.organization.name
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [query, status, tenders]);

  const canCreate = user?.role === 'ADMIN' || user?.role === 'BUYER';

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              Sourcing register
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Tenders
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {user?.role === 'VENDOR'
                ? 'Browse currently published opportunities and open a tender to prepare your proposal.'
                : user?.role === 'REVIEWER'
                  ? 'See sourcing events that currently contain bids awaiting your evaluation.'
                  : 'Search your sourcing portfolio, inspect lifecycle state, and move each event to its next controlled step.'}
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => router.push('/tenders/new')}
              className="w-full sm:w-auto"
            >
              Create tender
            </Button>
          )}
        </header>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem]">
            <div>
              <label
                htmlFor="tender-search"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500"
              >
                Search
              </label>
              <Input
                id="tender-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tender title, description, or buyer organization"
              />
            </div>

            {user?.role !== 'VENDOR' && (
              <div>
                <label
                  htmlFor="status-filter"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500"
                >
                  Lifecycle
                </label>
                <select
                  id="status-filter"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="ALL">All visible states</option>
                  {statuses.map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900">{visibleTenders.length}</strong>{' '}
              of {tenders.length} visible tenders
            </span>
            {(query || status !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setStatus('ALL');
                }}
                className="font-bold text-blue-700 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-6 grid animate-pulse gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-64 rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : visibleTenders.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleTenders.map((tender) => (
              <TenderCard
                key={tender.id}
                id={tender.id}
                title={tender.title}
                description={tender.description}
                budget={tender.budget}
                deadline={tender.deadline}
                status={tender.status}
                createdBy={tender.createdBy}
                bidCount={tender._count?.bids || 0}
                onClick={() => router.push('/tenders/' + tender.id)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="text-sm font-bold text-slate-950">
              No tenders match this view
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              {tenders.length === 0
                ? user?.role === 'VENDOR'
                  ? 'There are no published opportunities available right now.'
                  : user?.role === 'REVIEWER'
                    ? 'There is currently no evaluation work assigned by the available workflow.'
                    : 'Create the first tender to start a sourcing event.'
                : 'Try a broader search or clear the lifecycle filter.'}
            </p>
            {canCreate && tenders.length === 0 && (
              <Button
                onClick={() => router.push('/tenders/new')}
                className="mt-5"
              >
                Create first tender
              </Button>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
