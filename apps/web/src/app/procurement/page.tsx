'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@vendorse/ui';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '@vendorse/shared';

type AnyRecord = Record<string, any>;

function Badge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700">
      {value.replaceAll('_', ' ')}
    </span>
  );
}

export default function ProcurementWorkspacePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [work, setWork] = useState<AnyRecord>({});
  const [events, setEvents] = useState<AnyRecord[]>([]);
  const [requests, setRequests] = useState<AnyRecord[]>([]);
  const [suppliers, setSuppliers] = useState<AnyRecord[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setError('');
    try {
      const calls: Promise<Response>[] = [
        fetch('/api/procurement/work', { cache: 'no-store' }),
        fetch('/api/procurement/events', { cache: 'no-store' }),
      ];
      if (user.role === 'BUYER' || user.role === 'ADMIN') {
        calls.push(fetch('/api/procurement/requests', { cache: 'no-store' }));
        calls.push(fetch('/api/procurement/suppliers', { cache: 'no-store' }));
      }
      const responses = await Promise.all(calls);
      for (const response of responses) {
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || payload?.error || 'Workspace could not be loaded');
        }
      }
      setWork(await responses[0].json());
      setEvents(await responses[1].json());
      if (responses[2]) setRequests(await responses[2].json());
      if (responses[3]) setSuppliers(await responses[3].json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Workspace could not be loaded');
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (path: string, body: AnyRecord = {}) => {
    const response = await fetch('/api/procurement/' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message || payload?.error || 'Action failed');
    return payload;
  };

  const act = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const roleCopy = useMemo(() => {
    switch (user?.role) {
      case 'ADMIN':
        return ['Govern procurement decisions', 'Approve intake, supplier qualification, and award recommendations without losing the underlying evidence trail.'];
      case 'BUYER':
        return ['Run sourcing from need to contract', 'Turn approved requests into governed events, sealed submissions, evaluations, awards, and contracts.'];
      case 'VENDOR':
        return ['Supplier workspace', 'See invited events, ask clarifications, submit verified response packages, and keep immutable receipts.'];
      case 'REVIEWER':
        return ['Independent evaluation room', 'Declare conflicts first, then score only the responses explicitly assigned to you after opening.'];
      default:
        return ['Procurement workspace', 'Work from the next action instead of a generic dashboard.'];
    }
  }, [user?.role]);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="rounded-3xl bg-slate-950 px-6 py-7 text-white sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">Source-to-Contract</p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{roleCopy[0]}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{roleCopy[1]}</p>
            </div>
            {(user?.role === 'BUYER' || user?.role === 'ADMIN') && (
              <Button
                onClick={() => router.push('/procurement/requests/new')}
                className="w-full bg-white text-slate-950 hover:bg-slate-100 sm:w-auto"
              >
                New procurement request
              </Button>
            )}
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {user?.role === 'ADMIN' && (
          <section className="mt-7 grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Approval queue</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Submitted requests</h2>
              <div className="mt-4 space-y-3">
                {(work.requests || []).map((request: AnyRecord) => (
                  <div key={request.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-950">{request.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {request.category} · {formatCurrency(request.estimatedAmount, request.currency)}
                        </p>
                      </div>
                      <Badge value={request.status} />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={() => act('request-' + request.id, async () => {
                          await post('requests/' + request.id + '/decision', { approved: true });
                        })}
                        isLoading={busy === 'request-' + request.id}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => act('reject-' + request.id, async () => {
                          const reason = window.prompt('Rejection reason');
                          if (!reason) return;
                          await post('requests/' + request.id + '/decision', { approved: false, reason });
                        })}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
                {!(work.requests || []).length && <p className="text-sm text-slate-500">No request approvals waiting.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Award governance</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Award recommendations</h2>
              <div className="mt-4 space-y-3">
                {(work.awards || []).map((award: AnyRecord) => (
                  <div key={award.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="font-bold text-slate-950">{award.event?.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{award.supplierOrg?.name}</p>
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={() => act('award-' + award.id, async () => {
                          await post('awards/' + award.id + '/decision', { approved: true });
                        })}
                        isLoading={busy === 'award-' + award.id}
                      >
                        Approve award
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => act('award-reject-' + award.id, async () => {
                          await post('awards/' + award.id + '/decision', { approved: false });
                        })}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
                {!(work.awards || []).length && <p className="text-sm text-slate-500">No award approvals waiting.</p>}
              </div>
            </div>
          </section>
        )}

        {(user?.role === 'BUYER' || user?.role === 'ADMIN') && (
          <section className="mt-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Intake</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Procurement requests</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {requests.map((request) => (
                <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{request.category}</p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">{request.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{request.description}</p>
                    </div>
                    <Badge value={request.status} />
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-900">
                    {formatCurrency(request.estimatedAmount, request.currency)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {request.status === 'DRAFT' && request.createdById === user.id && (
                      <Button
                        onClick={() => act('submit-' + request.id, async () => {
                          await post('requests/' + request.id + '/submit');
                        })}
                        isLoading={busy === 'submit-' + request.id}
                      >
                        Submit for approval
                      </Button>
                    )}
                    {request.status === 'APPROVED' && !request.project && (
                      <Button
                        onClick={() => act('source-' + request.id, async () => {
                          const project = await post('requests/' + request.id + '/source', { method: 'RFP' });
                          router.push('/procurement/projects/' + project.id + '/events/new');
                        })}
                        isLoading={busy === 'source-' + request.id}
                      >
                        Start RFP sourcing
                      </Button>
                    )}
                    {request.project?.id && (
                      <Button
                        variant="outline"
                        onClick={() => router.push('/procurement/projects/' + request.project.id + '/events/new')}
                      >
                        Add sourcing event
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {user?.role === 'ADMIN' && (
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Supplier lifecycle</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Supplier qualification</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-950">{supplier.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{supplier.registrationNumber || 'Registration not provided'}</p>
                    </div>
                    <Badge value={supplier.supplierStatus} />
                  </div>
                  {!['QUALIFIED', 'CONDITIONALLY_QUALIFIED'].includes(supplier.supplierStatus) && (
                    <Button
                      className="mt-4 w-full"
                      onClick={() => act('qualify-' + supplier.id, async () => {
                        await post('suppliers/' + supplier.id + '/qualifications', {
                          status: 'QUALIFIED',
                          notes: 'Qualified through administrator review.',
                        });
                      })}
                      isLoading={busy === 'qualify-' + supplier.id}
                    >
                      Qualify supplier
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Active workspace</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Sourcing events</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => router.push('/procurement/events/' + event.id)}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{event.type} · v{event.version}</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">{event.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{event.project?.title}</p>
                  </div>
                  <Badge value={event.status} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <div>
                    <p>Closes</p>
                    <p className="mt-1 font-bold text-slate-900">{formatDate(new Date(event.closeAt))}</p>
                  </div>
                  <div>
                    <p>Responses</p>
                    <p className="mt-1 font-bold text-slate-900">{event._count?.responses ?? 0}</p>
                  </div>
                </div>
              </button>
            ))}
            {!events.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
                No sourcing events are currently in your access scope.
              </div>
            )}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
