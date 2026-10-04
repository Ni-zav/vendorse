'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BidForm,
  Button,
  StatusBadge,
  TenderEvaluation,
} from '@vendorse/ui';
import { formatCurrency, formatDate } from '@vendorse/shared';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { TenderDetail } from './types';

const evaluationCriteria = [
  {
    id: 'technical_capability',
    name: 'Technical capability',
    description: 'Evidence, methodology, technical fit, and delivery approach.',
    weight: 40,
  },
  {
    id: 'commercial_value',
    name: 'Commercial value',
    description: 'Commercial competitiveness and value against the stated scope.',
    weight: 30,
  },
  {
    id: 'delivery_confidence',
    name: 'Delivery confidence',
    description: 'Schedule realism, dependencies, and confidence in execution.',
    weight: 30,
  },
];

const lifecycle = ['DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'AWARDED', 'COMPLETED'];

export default function TenderDetailClient({
  params,
}: {
  params: { id: string };
}): JSX.Element {
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTenderDetails = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/tenders/' + id, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.error || 'Could not load this tender.',
        );
      }

      setTender(payload);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load this tender.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id && user) {
      fetchTenderDetails();
    }
  }, [id, user]);

  const handlePublishTender = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tenders/' + id + '/publish', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.error || 'Failed to publish tender.',
        );
      }

      setTender(payload);
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : 'Failed to publish tender.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitBid = async (data: {
    documents: Array<{ filePath: string; signatureHash: string }>;
  }) => {
    try {
      setIsSubmitting(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tenders/' + id + '/bids', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.error || 'Failed to submit bid.',
        );
      }

      await fetchTenderDetails();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEvaluation = async (
    bidId: string,
    evaluationData: {
      scores: Record<string, number>;
      comments: string;
      recommendation: 'ACCEPT' | 'REJECT' | 'REQUEST_CLARIFICATION';
    },
  ) => {
    try {
      setIsSubmitting(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tenders/bids/' + bidId + '/evaluate', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationData),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.error || 'Failed to submit scorecard.',
        );
      }

      await fetchTenderDetails();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAwardTender = async (bidId: string) => {
    try {
      setIsSubmitting(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(
        '/api/tenders/' + id + '/award/' + bidId,
        {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + token,
          },
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.error || 'Failed to award tender.',
        );
      }

      setTender(payload);
    } catch (awardError) {
      setError(
        awardError instanceof Error
          ? awardError.message
          : 'Failed to award tender.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const lifecycleIndex = useMemo(
    () => (tender ? lifecycle.indexOf(tender.status) : -1),
    [tender],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-5">
          <div className="h-28 rounded-3xl bg-slate-200" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="h-96 rounded-2xl bg-slate-200" />
            <div className="h-80 rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-black text-slate-950">
          Tender unavailable
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {error || 'This tender could not be found or is outside your access scope.'}
        </p>
        <Button
          variant="outline"
          onClick={() => router.push('/tenders')}
          className="mt-5"
        >
          Back to tenders
        </Button>
      </div>
    );
  }

  const isBuyer = user?.role === 'BUYER' || user?.role === 'ADMIN';
  const isVendor = user?.role === 'VENDOR';
  const isReviewer = user?.role === 'REVIEWER';
  const vendorHasBid = isVendor && tender.bids.length > 0;
  const deadlinePassed = new Date(tender.deadline).getTime() <= Date.now();

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <button
          type="button"
          onClick={() => router.push('/tenders')}
          className="text-sm font-bold text-slate-600 hover:text-slate-950"
        >
          ← Tender register
        </button>

        <header className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                {tender.createdBy.organization.name}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {tender.title}
              </h1>
              <p className="mt-3 text-sm text-slate-500">
                Owner: {tender.createdBy.name}
              </p>
            </div>
            <StatusBadge status={tender.status} />
          </div>

          <div className="mt-6 flex flex-wrap gap-x-2 gap-y-3">
            {lifecycle.map((stage, index) => {
              const reached = lifecycleIndex >= index;
              return (
                <div key={stage} className="flex items-center gap-2">
                  <span
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-black',
                      reached
                        ? 'bg-slate-950 text-white'
                        : 'border border-slate-300 bg-white text-slate-400',
                    ].join(' ')}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={[
                      'text-xs font-bold',
                      reached ? 'text-slate-800' : 'text-slate-400',
                    ].join(' ')}
                  >
                    {stage.replaceAll('_', ' ').toLowerCase()}
                  </span>
                  {index < lifecycle.length - 1 && (
                    <span className="mx-1 h-px w-5 bg-slate-200" />
                  )}
                </div>
              );
            })}
          </div>
        </header>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <main className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Scope
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {tender.description}
              </p>
              {tender.documents?.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-sm font-bold text-slate-900">
                    Buyer attachments
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {tender.documents.length} attachment
                    {tender.documents.length === 1 ? '' : 's'} registered with this
                    tender.
                  </p>
                </div>
              )}
            </section>

            {isVendor && tender.status === 'PUBLISHED' && !vendorHasBid && (
              <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                  Supplier response
                </p>
                <h2 className="mt-2 text-xl font-black text-slate-950">
                  Submit proposal package
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The current MVP stores signed proposal documents as the bid record.
                  Your organization can submit one active response per tender.
                </p>
                <div className="mt-5">
                  <BidForm
                    onSubmit={handleSubmitBid}
                    isLoading={isSubmitting}
                  />
                </div>
              </section>
            )}

            {isVendor && vendorHasBid && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                      Your response
                    </p>
                    <h2 className="mt-2 text-lg font-black text-emerald-950">
                      Proposal submitted
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-emerald-900/80">
                      Submitted {formatDate(new Date(tender.bids[0].submittedAt))}.
                      Working reviewer scores and identities remain private.
                    </p>
                  </div>
                  <StatusBadge status={tender.bids[0].status} />
                </div>
              </section>
            )}

            {isReviewer && (
              <section className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                    Independent evaluation
                  </p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">
                    Pending proposal scorecards
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Supplier identity is intentionally omitted from this scoring
                    surface to reduce avoidable reviewer bias.
                  </p>
                </div>

                {!deadlinePassed && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Scoring opens after the submission deadline.
                  </div>
                )}

                {deadlinePassed &&
                  tender.bids.map((bid, index) => (
                    <article
                      key={bid.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                            Proposal {String(index + 1).padStart(2, '0')}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {bid.documents.length} proposal document
                            {bid.documents.length === 1 ? '' : 's'}
                          </p>
                        </div>
                        <StatusBadge status={bid.status} />
                      </div>
                      <div className="mt-5">
                        <TenderEvaluation
                          bidId={bid.id}
                          criteria={evaluationCriteria}
                          onSubmit={(data) =>
                            handleSubmitEvaluation(bid.id, data)
                          }
                          isSubmitting={isSubmitting}
                        />
                      </div>
                    </article>
                  ))}

                {deadlinePassed && tender.bids.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    No remaining proposal requires your scorecard.
                  </div>
                )}
              </section>
            )}

            {isBuyer && tender.bids.length > 0 && (
              <section>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                      Response review
                    </p>
                    <h2 className="mt-2 text-xl font-black text-slate-950">
                      Submitted bids
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500">
                    {tender.bids.length} response
                    {tender.bids.length === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="mt-4 space-y-4">
                  {tender.bids.map((bid) => (
                    <article
                      key={bid.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                            {bid.submittedBy.organization.name}
                          </p>
                          <h3 className="mt-1 text-lg font-black text-slate-950">
                            {bid.submittedBy.name}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Submitted {formatDate(new Date(bid.submittedAt))} ·{' '}
                            {bid.documents.length} document
                            {bid.documents.length === 1 ? '' : 's'}
                          </p>
                        </div>
                        <StatusBadge status={bid.status} />
                      </div>

                      {bid.evaluations.length > 0 ? (
                        <div className="mt-5 border-t border-slate-100 pt-4">
                          <p className="text-sm font-bold text-slate-900">
                            Evaluation record
                          </p>
                          <div className="mt-3 grid gap-2">
                            {bid.evaluations.map((evaluation) => (
                              <div
                                key={evaluation.id}
                                className="rounded-xl bg-slate-50 px-3 py-3"
                              >
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                  <span className="text-xs font-bold text-slate-700">
                                    {evaluation.criteria
                                      .replaceAll('_', ' ')
                                      .replace(/\b\w/g, (letter) =>
                                        letter.toUpperCase(),
                                      )}
                                  </span>
                                  <span className="text-sm font-black text-slate-950">
                                    {evaluation.score}/100
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                  Reviewer: {evaluation.reviewer.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                          Awaiting at least one reviewer scorecard.
                        </p>
                      )}

                      {tender.status === 'UNDER_REVIEW' &&
                        bid.evaluations.length > 0 && (
                          <div className="mt-5 flex justify-end">
                            <Button
                              onClick={() => handleAwardTender(bid.id)}
                              isLoading={isSubmitting}
                              className="w-full sm:w-auto"
                            >
                              Award this bid
                            </Button>
                          </div>
                        )}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Commercial frame
              </p>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-xs text-slate-500">Budget ceiling</dt>
                  <dd className="mt-1 text-lg font-black text-slate-950">
                    {formatCurrency(tender.budget)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Submission deadline</dt>
                  <dd className="mt-1 text-sm font-bold leading-5 text-slate-900">
                    {formatDate(new Date(tender.deadline))}
                  </dd>
                  <p
                    className={[
                      'mt-1 text-xs font-semibold',
                      deadlinePassed ? 'text-red-700' : 'text-emerald-700',
                    ].join(' ')}
                  >
                    {deadlinePassed ? 'Submission window closed' : 'Submission window open'}
                  </p>
                </div>
              </dl>
            </section>

            {isBuyer && tender.status === 'DRAFT' && (
              <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="text-sm font-black text-blue-950">
                  Ready to publish?
                </p>
                <p className="mt-2 text-xs leading-5 text-blue-900/80">
                  Publication makes this sourcing event visible to suppliers.
                  Confirm scope, budget, and deadline first.
                </p>
                <Button
                  onClick={handlePublishTender}
                  isLoading={isSubmitting}
                  className="mt-4 w-full"
                >
                  Publish tender
                </Button>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-black text-slate-950">
                Current MVP controls
              </p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                <li>• One active bid per supplier organization.</li>
                <li>• Evaluation starts after the response deadline.</li>
                <li>• Award requires at least one submitted scorecard.</li>
                <li>• Evaluation criteria are still a default set, not tender-frozen data.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </ProtectedRoute>
  );
}
