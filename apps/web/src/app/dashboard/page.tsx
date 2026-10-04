'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TenderCard } from '@vendorse/ui';
import { Tender } from '@vendorse/shared';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

interface DashboardStats {
  totalTenders: number;
  activeTenders: number;
  submittedBids: number;
  pendingEvaluations: number;
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('Your session has expired.');
        }

        const [tendersResponse, statsResponse] = await Promise.all([
          fetch('/api/tenders?limit=6', {
            headers: { Authorization: 'Bearer ' + token },
          }),
          fetch('/api/dashboard/stats', {
            headers: { Authorization: 'Bearer ' + token },
          }),
        ]);

        if (!tendersResponse.ok || !statsResponse.ok) {
          throw new Error('The procurement workspace could not be loaded.');
        }

        const [tendersData, statsData] = await Promise.all([
          tendersResponse.json(),
          statsResponse.json(),
        ]);

        setTenders(Array.isArray(tendersData.tenders) ? tendersData.tenders : []);
        setStats(statsData);
      } catch (loadError) {
        console.error('Error fetching dashboard data:', loadError);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'The procurement workspace could not be loaded.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const closingSoon = useMemo(
    () =>
      tenders.filter((tender) => {
        if (tender.status !== 'PUBLISHED') return false;
        const hours =
          (new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
        return hours > 0 && hours <= 72;
      }).length,
    [tenders],
  );

  const roleContext = useMemo(() => {
    switch (user?.role) {
      case 'BUYER':
        return {
          eyebrow: 'Buyer workspace',
          title: 'Move sourcing work forward',
          description:
            'Create controlled tenders, monitor live response windows, and move evaluated bids toward award.',
        };
      case 'VENDOR':
        return {
          eyebrow: 'Supplier workspace',
          title: 'Find opportunities and track submissions',
          description:
            'Prioritize open tenders, submit proposal packages, and follow your bid status without exposing evaluation internals.',
        };
      case 'REVIEWER':
        return {
          eyebrow: 'Evaluation workspace',
          title: 'Work the evaluation queue',
          description:
            'Score eligible proposals after the bidding window closes and leave a defensible rationale for every recommendation.',
        };
      case 'ADMIN':
        return {
          eyebrow: 'Platform administration',
          title: 'Keep procurement moving',
          description:
            'Monitor sourcing activity, manage users, and support buyers through the tender lifecycle.',
        };
      default:
        return {
          eyebrow: 'Procurement workspace',
          title: 'Welcome to Vendorse',
          description: 'Your role-aware sourcing workspace.',
        };
    }
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-3xl bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-28 rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-sm sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
                {roleContext.eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {roleContext.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                {roleContext.description}
              </p>
              <p className="mt-4 text-xs text-slate-400">
                Signed in as {user?.name || user?.email}
                {user?.organization?.name ? ' · ' + user.organization.name : ''}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              {(user?.role === 'BUYER' || user?.role === 'ADMIN') && (
                <Button
                  onClick={() => router.push('/tenders/new')}
                  className="w-full bg-white text-slate-950 hover:bg-slate-100 sm:w-auto"
                >
                  Create tender
                </Button>
              )}
              {user?.role === 'VENDOR' && (
                <Button
                  onClick={() => router.push('/tenders')}
                  className="w-full bg-white text-slate-950 hover:bg-slate-100 sm:w-auto"
                >
                  Browse tenders
                </Button>
              )}
              {user?.role === 'REVIEWER' && (
                <Button
                  onClick={() => router.push('/evaluations')}
                  className="w-full bg-white text-slate-950 hover:bg-slate-100 sm:w-auto"
                >
                  Open evaluation queue
                </Button>
              )}
              {user?.role === 'ADMIN' && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/users')}
                  className="w-full border-slate-700 bg-slate-900 text-white hover:bg-slate-800 sm:w-auto"
                >
                  Manage users
                </Button>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-2 font-bold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {stats && (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(user?.role === 'BUYER' || user?.role === 'ADMIN') && (
              <>
                <StatCard
                  label="Tender portfolio"
                  value={stats.totalTenders}
                  detail="Total sourcing events in your current scope."
                />
                <StatCard
                  label="Active sourcing"
                  value={stats.activeTenders}
                  detail="Published or under-review tenders."
                />
              </>
            )}
            {user?.role === 'VENDOR' && (
              <StatCard
                label="Submitted bids"
                value={stats.submittedBids}
                detail="Proposal packages submitted from this account."
              />
            )}
            {user?.role === 'REVIEWER' && (
              <StatCard
                label="Pending scorecards"
                value={stats.pendingEvaluations}
                detail="Bids still requiring your independent evaluation."
              />
            )}
            <StatCard
              label="Closing soon"
              value={closingSoon}
              detail="Visible open tenders closing within 72 hours."
            />
          </section>
        )}

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Work queue
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-950">
                {user?.role === 'VENDOR'
                  ? 'Open opportunities'
                  : user?.role === 'REVIEWER'
                    ? 'Tenders needing review'
                    : 'Recent tenders'}
              </h2>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                router.push(user?.role === 'REVIEWER' ? '/evaluations' : '/tenders')
              }
              className="w-full sm:w-auto"
            >
              View full queue
            </Button>
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

          {tenders.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
              <p className="text-sm font-bold text-slate-900">Queue is clear</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {user?.role === 'VENDOR'
                  ? 'No published opportunities are available right now.'
                  : user?.role === 'REVIEWER'
                    ? 'There are no bids awaiting your scorecard.'
                    : 'No tenders are in scope yet.'}
              </p>
            </div>
          )}
        </section>
      </div>
    </ProtectedRoute>
  );
}
