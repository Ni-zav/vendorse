'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TenderCard } from '@vendorse/ui';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

interface EvaluationTender {
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

export default function EvaluationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tenders, setTenders] = useState<EvaluationTender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setError(null);
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
          throw new Error('Could not load the evaluation queue.');
        }

        const data = await response.json();
        setTenders(Array.isArray(data.tenders) ? data.tenders : []);
      } catch (loadError) {
        console.error('Error fetching evaluation queue:', loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load the evaluation queue.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'REVIEWER') {
      fetchEvaluations();
    }
  }, [user, router]);

  return (
    <ProtectedRoute allowedRoles={['REVIEWER']}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
            Evaluation workspace
          </p>
          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                Evaluation queue
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Only tenders with at least one bid that still requires your
                scorecard appear here. Scoring becomes available after the
                submission deadline and each reviewer submits one atomic scorecard
                per bid.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Tenders in queue
              </p>
              <p className="mt-1 text-3xl font-black">{tenders.length}</p>
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-6 grid animate-pulse gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-64 rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : tenders.length > 0 ? (
          <>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
              Keep scoring evidence-based and independent. Vendor-facing screens do
              not expose your identity, working score, or evaluation notes.
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tenders.map((tender) => (
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
          </>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="text-sm font-bold text-slate-950">
              No scorecards waiting
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              The queue is clear. A sourcing event appears here when a submitted
              bid is eligible for your evaluation and you have not already scored
              it.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="mt-5"
            >
              Back to dashboard
            </Button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
