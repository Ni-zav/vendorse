'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, StatusBadge } from '@vendorse/ui';
import { formatCurrency, formatDate } from '@vendorse/shared';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

interface Bid {
  id: string;
  status: string;
  submittedAt: string;
  documents: Array<{
    id: string;
    filePath: string;
  }>;
  tender: {
    id: string;
    title: string;
    description: string;
    budget: number;
    deadline: string;
    status: string;
  };
}

function statusMessage(status: string) {
  switch (status) {
    case 'SUBMITTED':
      return 'Proposal received. It remains sealed from the supplier view while the sourcing window progresses.';
    case 'UNDER_REVIEW':
      return 'The proposal is in evaluation. Reviewer identities and working scores are intentionally not exposed here.';
    case 'ACCEPTED':
      return 'This bid was selected for award.';
    case 'REJECTED':
      return 'The tender was awarded to another response.';
    case 'WITHDRAWN':
      return 'This bid is no longer active.';
    default:
      return 'Track the sourcing result from this workspace.';
  }
}

export default function BidsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setError(null);
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/bids', {
          headers: {
            Authorization: 'Bearer ' + token,
          },
        });

        if (!response.ok) {
          throw new Error('Could not load your submitted bids.');
        }

        const data = await response.json();
        setBids(Array.isArray(data) ? data : []);
      } catch (loadError) {
        console.error('Error fetching bids:', loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load your submitted bids.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchBids();
    }
  }, [user, router]);

  return (
    <ProtectedRoute allowedRoles={['VENDOR']}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
            Supplier workspace
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                My bids
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Track submitted proposal packages and tender outcomes. Evaluation
                working notes, reviewer identities, and intermediate scores stay
                inside the evaluation workspace.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/tenders')}
              className="w-full sm:w-auto"
            >
              Browse opportunities
            </Button>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-6 space-y-4">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : bids.length > 0 ? (
          <div className="mt-6 space-y-4">
            {bids.map((bid) => (
              <article
                key={bid.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Submitted {formatDate(new Date(bid.submittedAt))}
                    </p>
                    <h2 className="mt-2 text-xl font-black leading-7 text-slate-950">
                      {bid.tender.title}
                    </h2>
                  </div>
                  <StatusBadge status={bid.status} />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {statusMessage(bid.status)}
                </p>

                <dl className="mt-5 grid gap-3 border-y border-slate-100 py-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-medium text-slate-500">
                      Buyer budget ceiling
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-slate-900">
                      {formatCurrency(bid.tender.budget)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">
                      Tender deadline
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-slate-900">
                      {formatDate(new Date(bid.tender.deadline))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">
                      Proposal documents
                    </dt>
                    <dd className="mt-1 text-sm font-bold text-slate-900">
                      {bid.documents?.length || 0} file
                      {(bid.documents?.length || 0) === 1 ? '' : 's'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/tenders/' + bid.tender.id)}
                    className="w-full sm:w-auto"
                  >
                    View tender
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="text-sm font-bold text-slate-950">
              No proposal packages submitted
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Browse published opportunities and open a tender when you are ready
              to prepare a response.
            </p>
            <Button onClick={() => router.push('/tenders')} className="mt-5">
              Browse tenders
            </Button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
