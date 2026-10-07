'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Input, TextArea } from '@vendorse/ui';
import { formatCurrency, formatDate } from '@vendorse/shared';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';

type AnyRecord = Record<string, any>;

function Badge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700">
      {value.replaceAll('_', ' ')}
    </span>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ReviewerScorecard({
  assignment,
  criteria,
  busy,
  act,
}: {
  assignment: AnyRecord;
  criteria: AnyRecord[];
  busy: string | null;
  act: (key: string, fn: () => Promise<void>) => Promise<void>;
}) {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(criteria.map((criterion) => [criterion.id, criterion.minScore ?? 0])),
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rationale, setRationale] = useState('');
  const [recommendation, setRecommendation] = useState('ACCEPT');

  if (assignment.status === 'ASSIGNED' && assignment.conflictStatus === 'PENDING') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-bold text-amber-950">Conflict declaration required</p>
        <p className="mt-1 text-xs leading-5 text-amber-900/80">
          Confirm that you can evaluate independently before proposal evidence becomes part of your scorecard.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() =>
              act('coi-clear-' + assignment.id, async () => {
                const response = await fetch('/api/procurement/assignments/' + assignment.id + '/conflict', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ conflict: false }),
                });
                const payload = await response.json().catch(() => null);
                if (!response.ok) throw new Error(payload?.message || payload?.error || 'Could not declare conflict status');
              })
            }
            isLoading={busy === 'coi-clear-' + assignment.id}
          >
            No conflict
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              act('coi-conflict-' + assignment.id, async () => {
                const note = window.prompt('Describe the conflict requiring recusal');
                if (!note) return;
                const response = await fetch('/api/procurement/assignments/' + assignment.id + '/conflict', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ conflict: true, note }),
                });
                const payload = await response.json().catch(() => null);
                if (!response.ok) throw new Error(payload?.message || payload?.error || 'Could not record conflict');
              })
            }
          >
            Declare conflict / recuse
          </Button>
        </div>
      </div>
    );
  }

  if (assignment.status === 'RECUSED') {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        You are recused from this response. {assignment.conflictNote || ''}
      </div>
    );
  }

  if (assignment.scorecard || assignment.status === 'SUBMITTED') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-bold text-emerald-950">Scorecard submitted and locked</p>
        <p className="mt-1 text-xs text-emerald-800">
          Recommendation: {assignment.scorecard?.recommendation?.replaceAll('_', ' ') || 'submitted'}
        </p>
      </div>
    );
  }

  if (assignment.status !== 'READY') return null;

  return (
    <div className="space-y-4">
      {criteria.map((criterion) => (
        <div key={criterion.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-bold text-slate-950">{criterion.name}</p>
              {criterion.description && <p className="mt-1 text-xs leading-5 text-slate-500">{criterion.description}</p>}
              <p className="mt-1 text-xs font-semibold text-blue-700">Weight {Number(criterion.weight)}%</p>
            </div>
            <div className="w-28">
              <Input
                type="number"
                min={criterion.minScore}
                max={criterion.maxScore}
                value={scores[criterion.id] ?? criterion.minScore}
                onChange={(event) =>
                  setScores((current) => ({ ...current, [criterion.id]: Number(event.target.value) }))
                }
              />
            </div>
          </div>
          <TextArea
            className="mt-3"
            rows={2}
            placeholder="Evidence-based criterion note"
            value={notes[criterion.id] || ''}
            onChange={(event) =>
              setNotes((current) => ({ ...current, [criterion.id]: event.target.value }))
            }
          />
        </div>
      ))}

      <div className="grid gap-3 sm:grid-cols-[14rem_1fr]">
        <select
          value={recommendation}
          onChange={(event) => setRecommendation(event.target.value)}
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold"
        >
          <option value="ACCEPT">Accept</option>
          <option value="REJECT">Reject</option>
          <option value="REQUEST_CLARIFICATION">Request clarification</option>
        </select>
        <TextArea
          rows={3}
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
          placeholder="Overall rationale for your independent recommendation"
        />
      </div>

      <Button
        onClick={() =>
          act('score-' + assignment.id, async () => {
            const response = await fetch('/api/procurement/assignments/' + assignment.id + '/scorecard', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recommendation,
                rationale,
                scores: criteria.map((criterion) => ({
                  criterionId: criterion.id,
                  score: scores[criterion.id],
                  notes: notes[criterion.id] || undefined,
                })),
              }),
            });
            const payload = await response.json().catch(() => null);
            if (!response.ok) throw new Error(payload?.message || payload?.error || 'Could not submit scorecard');
          })
        }
        isLoading={busy === 'score-' + assignment.id}
      >
        Submit and lock scorecard
      </Button>
    </div>
  );
}

export default function ProcurementEventRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<AnyRecord | null>(null);
  const [suppliers, setSuppliers] = useState<AnyRecord[]>([]);
  const [reviewers, setReviewers] = useState<AnyRecord[]>([]);
  const [comparison, setComparison] = useState<AnyRecord | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState<Record<string, string>>({});
  const [clarification, setClarification] = useState('');
  const [narrative, setNarrative] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [manualTotal, setManualTotal] = useState('');
  const [linePrices, setLinePrices] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [receipt, setReceipt] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isBuyer = user?.role === 'BUYER' || user?.role === 'ADMIN';
  const isVendor = user?.role === 'VENDOR';
  const isReviewer = user?.role === 'REVIEWER';

  const load = useCallback(async () => {
    if (!user || !id) return;
    setError('');
    try {
      const eventResponse = await fetch('/api/procurement/events/' + id, { cache: 'no-store' });
      const eventPayload = await eventResponse.json().catch(() => null);
      if (!eventResponse.ok) throw new Error(eventPayload?.message || eventPayload?.error || 'Event could not be loaded');
      setEvent(eventPayload);

      if (user.role === 'BUYER' || user.role === 'ADMIN') {
        const [supplierResponse, reviewerResponse] = await Promise.all([
          fetch('/api/procurement/suppliers', { cache: 'no-store' }),
          fetch('/api/procurement/reviewers', { cache: 'no-store' }),
        ]);
        if (supplierResponse.ok) setSuppliers(await supplierResponse.json());
        if (reviewerResponse.ok) setReviewers(await reviewerResponse.json());

        if (['OPENED', 'EVALUATING', 'AWARDED'].includes(eventPayload.status)) {
          const comparisonResponse = await fetch(
            '/api/procurement/events/' + id + '/comparison',
            { cache: 'no-store' },
          );
          if (comparisonResponse.ok) {
            setComparison(await comparisonResponse.json());
          } else {
            setComparison(null);
          }
        } else {
          setComparison(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Event could not be loaded');
    }
  }, [id, user]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const downloadFile = async (fileId: string) => {
    try {
      const response = await fetch('/api/files/' + fileId + '/download-url');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.url) throw new Error(payload?.message || payload?.error || 'Could not authorize download');
      window.open(payload.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not download file');
    }
  };

  const uploadFiles = async () => {
    const ids: string[] = [];
    for (const file of files) {
      const intentResponse = await fetch('/api/files/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          fileSize: file.size,
          purpose: 'SOURCING_RESPONSE',
        }),
      });
      const intent = await intentResponse.json().catch(() => null);
      if (!intentResponse.ok || !intent?.url || !intent?.file?.id) {
        throw new Error(intent?.message || intent?.error || 'Could not create upload intent');
      }

      const uploadResponse = await fetch(intent.url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error('Object upload failed for ' + file.name);

      const finalizeResponse = await fetch('/api/files/' + intent.file.id + '/finalize', { method: 'POST' });
      const finalized = await finalizeResponse.json().catch(() => null);
      if (!finalizeResponse.ok || finalized?.verificationStatus !== 'VERIFIED') {
        throw new Error(finalized?.message || finalized?.error || 'File verification failed for ' + file.name);
      }
      ids.push(intent.file.id);
    }
    return ids;
  };

  const deadlinePassed = event ? new Date(event.closeAt).getTime() <= Date.now() : false;
  const latestOwnVersion = useMemo(() => {
    if (!event || !isVendor) return null;
    return event.responses?.[0]?.versions?.[0] || null;
  }, [event, isVendor]);

  if (!event) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="text-2xl font-black text-slate-950">Loading sourcing event</h1>
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <button type="button" onClick={() => router.push('/procurement')} className="text-sm font-bold text-slate-600 hover:text-slate-950">
          ← Procurement workspace
        </button>

        <header className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                {event.type} · version {event.version}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{event.title}</h1>
              <p className="mt-2 text-sm text-slate-500">{event.project?.title}</p>
            </div>
            <Badge value={event.status} />
          </div>
          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Submission deadline</p>
              <p className="mt-1 text-sm font-bold text-slate-950">{formatDate(new Date(event.closeAt))}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Evaluation criteria</p>
              <p className="mt-1 text-sm font-bold text-slate-950">{event.criteria?.length || 0} frozen criteria</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Responses</p>
              <p className="mt-1 text-sm font-bold text-slate-950">{event.responses?.length || 0} in current scope</p>
            </div>
          </div>
        </header>

        {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {receipt && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Submission receipt: <strong>{receipt}</strong></div>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <main className="space-y-6">
            <Section eyebrow="Published scope" title="Instructions and commercial structure">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{event.instructions}</p>
              {!!event.lineItems?.length && (
                <div className="mt-5 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <tr><th className="py-2 pr-4">Code</th><th className="py-2 pr-4">Requirement</th><th className="py-2">Qty</th></tr>
                    </thead>
                    <tbody>
                      {event.lineItems.map((item: AnyRecord) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="py-3 pr-4 font-bold text-slate-900">{item.code}</td>
                          <td className="py-3 pr-4 text-slate-700">{item.description}</td>
                          <td className="py-3 text-slate-700">{Number(item.quantity)} {item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            <Section eyebrow="Decision rules" title="Frozen evaluation plan">
              <div className="space-y-3">
                {event.criteria.map((criterion: AnyRecord) => (
                  <div key={criterion.id} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-slate-950">{criterion.name}</p>
                      {criterion.description && <p className="mt-1 text-xs leading-5 text-slate-500">{criterion.description}</p>}
                    </div>
                    <span className="text-sm font-black text-blue-700">{Number(criterion.weight)}%</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section eyebrow="Governed communication" title="Clarifications and amendments">
              <div className="space-y-3">
                {event.clarifications.map((item: AnyRecord) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-sm font-bold text-slate-950">{item.question}</p>
                    {item.answer ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
                    ) : isBuyer ? (
                      <Button
                        variant="outline"
                        className="mt-3"
                        onClick={() =>
                          act('answer-' + item.id, async () => {
                            const answer = window.prompt('Publish answer');
                            if (!answer) return;
                            await post('clarifications/' + item.id + '/answer', { answer });
                          })
                        }
                      >
                        Answer
                      </Button>
                    ) : (
                      <p className="mt-2 text-xs text-amber-700">Awaiting buyer response.</p>
                    )}
                  </div>
                ))}
                {!event.clarifications.length && <p className="text-sm text-slate-500">No clarifications yet.</p>}
              </div>

              {isVendor && event.status === 'PUBLISHED' && !deadlinePassed && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <TextArea rows={3} value={clarification} onChange={(e) => setClarification(e.target.value)} placeholder="Ask a question about scope, response format, or commercial assumptions" />
                  <Button
                    className="mt-3"
                    onClick={() =>
                      act('clarify', async () => {
                        await post('events/' + id + '/clarifications', { question: clarification });
                        setClarification('');
                      })
                    }
                    isLoading={busy === 'clarify'}
                  >
                    Submit clarification
                  </Button>
                </div>
              )}

              {!!event.amendments?.length && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-sm font-bold text-slate-950">Amendment history</p>
                  <div className="mt-3 space-y-2">
                    {event.amendments.map((amendment: AnyRecord) => (
                      <div key={amendment.id} className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
                        <strong>v{amendment.version}</strong> · {amendment.summary}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {isVendor && event.status === 'PUBLISHED' && !deadlinePassed && (
              <Section eyebrow="Sealed submission" title={latestOwnVersion ? 'Submit a superseding response version' : 'Prepare your response'}>
                {latestOwnVersion && (
                  <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    Latest receipt: <strong>{latestOwnVersion.receiptCode}</strong>. A new submission creates a new immutable version rather than overwriting it.
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Currency</label>
                    <Input maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
                  </div>
                  {!event.lineItems.length && (
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Total offer</label>
                      <Input type="number" min="0.01" step="0.01" value={manualTotal} onChange={(e) => setManualTotal(e.target.value)} />
                    </div>
                  )}
                </div>

                {!!event.lineItems.length && (
                  <div className="mt-5 space-y-3">
                    {event.lineItems.map((item: AnyRecord) => (
                      <div key={item.id} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_12rem] sm:items-center">
                        <div>
                          <p className="font-bold text-slate-950">{item.code} · {item.description}</p>
                          <p className="mt-1 text-xs text-slate-500">{Number(item.quantity)} {item.unit}</p>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Unit price"
                          value={linePrices[item.id] || ''}
                          onChange={(e) => setLinePrices((current) => ({ ...current, [item.id]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <TextArea className="mt-5" rows={5} value={narrative} onChange={(e) => setNarrative(e.target.value)} placeholder="Proposal narrative, assumptions, delivery approach, exclusions, or other response context" />

                <div className="mt-5">
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Supporting documents</label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="block w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
                  />
                  <p className="mt-2 text-xs text-slate-500">Each file is finalized and hashed server-side before it can be attached to the response.</p>
                </div>

                <Button
                  className="mt-5"
                  onClick={() =>
                    act('response', async () => {
                      const documentIds = await uploadFiles();
                      const version = await post('events/' + id + '/responses', {
                        currency,
                        totalAmount: manualTotal || undefined,
                        narrative,
                        lineItems: event.lineItems.map((item: AnyRecord) => ({
                          eventLineItemId: item.id,
                          unitPrice: linePrices[item.id] || '0',
                        })),
                        documentIds,
                      });
                      setReceipt(version.receiptCode);
                      setFiles([]);
                    })
                  }
                  isLoading={busy === 'response'}
                >
                  Finalize sealed response
                </Button>
              </Section>
            )}

            {isReviewer && (
              <Section eyebrow="Independent evaluation" title="Assigned response">
                {event.responses.map((response: AnyRecord, index: number) => {
                  const assignment = response.assignments?.[0];
                  const version = response.versions?.[0];
                  return (
                    <div key={response.id} className="mb-5 rounded-2xl border border-slate-200 p-5 last:mb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Proposal {String(index + 1).padStart(2, '0')}</p>
                          <p className="mt-1 text-sm text-slate-600">Supplier identity is intentionally hidden on the reviewer surface.</p>
                        </div>
                        <Badge value={assignment?.status || response.status} />
                      </div>

                      {version && assignment?.conflictStatus === 'CLEAR' && (
                        <div className="mt-4 rounded-xl bg-slate-50 p-4">
                          <p className="text-sm font-bold text-slate-950">Commercial offer</p>
                          <p className="mt-1 text-lg font-black text-slate-950">{formatCurrency(version.totalAmount, version.currency)}</p>
                          {version.narrative && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{version.narrative}</p>}
                          {!!version.documents?.length && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {version.documents.map((document: AnyRecord) => (
                                <button
                                  key={document.id}
                                  type="button"
                                  onClick={() => downloadFile(document.fileObject.id)}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                                >
                                  {document.fileObject.originalFileName}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {assignment && (
                        <div className="mt-5">
                          <ReviewerScorecard assignment={assignment} criteria={event.criteria} busy={busy} act={act} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </Section>
            )}

            {isBuyer && comparison && (
              <Section eyebrow="Decision support" title="Supplier comparison">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-950">
                  Vendorse calculates weighted scores from the frozen published criteria and locked evaluator scorecards. It does not auto-rank or select a supplier.
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="py-3 pr-4">Supplier</th>
                        <th className="py-3 pr-4">Commercial offer</th>
                        <th className="py-3 pr-4">Weighted score</th>
                        <th className="py-3 pr-4">Evaluation</th>
                        <th className="py-3">Recommendations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(comparison.responses || []).map((response: AnyRecord) => (
                        <tr key={response.responseId} className="border-b border-slate-100 align-top">
                          <td className="py-4 pr-4 font-bold text-slate-950">
                            {response.supplier?.name}
                          </td>
                          <td className="py-4 pr-4 text-slate-700">
                            {response.currentVersion
                              ? formatCurrency(
                                  response.currentVersion.totalAmount,
                                  response.currentVersion.currency,
                                )
                              : '—'}
                          </td>
                          <td className="py-4 pr-4">
                            {response.evaluation?.weightedScore == null ? (
                              <span className="text-slate-400">Incomplete</span>
                            ) : (
                              <span className="font-black text-slate-950">
                                {Number(response.evaluation.weightedScore).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="py-4 pr-4 text-slate-700">
                            {response.evaluation?.submitted || 0}/{response.evaluation?.assigned || 0} submitted
                            {(response.evaluation?.recusedOrConflict || 0) > 0 && (
                              <span className="ml-2 text-amber-700">
                                · {response.evaluation.recusedOrConflict} recused/conflict
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-slate-700">
                            {Object.entries(response.evaluation?.recommendationCounts || {})
                              .map(([key, value]) => key.replaceAll('_', ' ') + ' ' + value)
                              .join(' · ') || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          '/api/procurement/events/' + id + '/decision-package',
                          { cache: 'no-store' },
                        );
                        const payload = await response.json().catch(() => null);
                        if (!response.ok) {
                          throw new Error(
                            payload?.message ||
                              payload?.error ||
                              'Could not generate decision package',
                          );
                        }
                        const blob = new Blob(
                          [JSON.stringify(payload, null, 2)],
                          { type: 'application/json' },
                        );
                        const url = URL.createObjectURL(blob);
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.download = 'vendorse-decision-package-' + id + '.json';
                        anchor.click();
                        URL.revokeObjectURL(url);
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : 'Could not generate decision package',
                        );
                      }
                    }}
                  >
                    Export decision package
                  </Button>
                </div>
              </Section>
            )}

            {isBuyer && ['OPENED', 'EVALUATING', 'AWARDED'].includes(event.status) && (
              <Section eyebrow="Response review" title="Opened supplier responses">
                <div className="space-y-4">
                  {event.responses.map((response: AnyRecord) => {
                    const version = response.versions?.[0];
                    const assignedIds = new Set((response.assignments || []).map((assignment: AnyRecord) => assignment.reviewerId));
                    return (
                      <article key={response.id} className="rounded-2xl border border-slate-200 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{response.supplierOrg?.name}</p>
                            <p className="mt-1 text-lg font-black text-slate-950">
                              {version ? formatCurrency(version.totalAmount, version.currency) : 'Response opened'}
                            </p>
                            {version?.receiptCode && <p className="mt-1 text-xs text-slate-500">Receipt {version.receiptCode}</p>}
                          </div>
                          <Badge value={response.status} />
                        </div>

                        {version?.narrative && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{version.narrative}</p>}
                        {!!version?.documents?.length && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {version.documents.map((document: AnyRecord) => (
                              <button
                                key={document.id}
                                type="button"
                                onClick={() => downloadFile(document.fileObject.id)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                              >
                                {document.fileObject.originalFileName}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="mt-5 border-t border-slate-100 pt-4">
                          <p className="text-sm font-bold text-slate-950">Independent reviewers</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(response.assignments || []).map((assignment: AnyRecord) => (
                              <span key={assignment.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                {assignment.reviewer?.name} · {assignment.status.replaceAll('_', ' ')}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <select
                              value={selectedReviewer[response.id] || ''}
                              onChange={(e) => setSelectedReviewer((current) => ({ ...current, [response.id]: e.target.value }))}
                              className="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                            >
                              <option value="">Assign reviewer…</option>
                              {reviewers.filter((reviewer) => !assignedIds.has(reviewer.id)).map((reviewer) => (
                                <option key={reviewer.id} value={reviewer.id}>{reviewer.name} · {reviewer.organization?.name}</option>
                              ))}
                            </select>
                            <Button
                              variant="outline"
                              onClick={() =>
                                act('assign-' + response.id, async () => {
                                  const reviewerId = selectedReviewer[response.id];
                                  if (!reviewerId) throw new Error('Select a reviewer first');
                                  await post('events/' + id + '/assignments', { responseId: response.id, reviewerId });
                                  setSelectedReviewer((current) => ({ ...current, [response.id]: '' }));
                                })
                              }
                            >
                              Assign
                            </Button>
                          </div>
                        </div>

                        {!event.award && response.assignments?.length > 0 && response.assignments.every((assignment: AnyRecord) => assignment.status === 'SUBMITTED') && (
                          <Button
                            className="mt-5"
                            onClick={() =>
                              act('award-' + response.id, async () => {
                                const rationale = window.prompt('Award recommendation rationale');
                                if (!rationale) return;
                                await post('events/' + id + '/award', { responseId: response.id, rationale });
                              })
                            }
                            isLoading={busy === 'award-' + response.id}
                          >
                            Recommend for award
                          </Button>
                        )}
                      </article>
                    );
                  })}
                  {!event.responses.length && <p className="text-sm text-slate-500">No responses were submitted.</p>}
                </div>
              </Section>
            )}

            {event.award && isBuyer && (
              <Section eyebrow="Award and contract" title="Approved supplier commitment">
                <div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-950">{event.award.supplierOrg?.name}</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{formatCurrency(event.award.amount, event.award.currency)}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{event.award.rationale}</p>
                  </div>
                  <Badge value={event.award.status} />
                </div>

                {user?.role === 'ADMIN' && event.award.status === 'PENDING_APPROVAL' && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => act('approve-award', async () => { await post('awards/' + event.award.id + '/decision', { approved: true }); })}
                      isLoading={busy === 'approve-award'}
                    >
                      Approve award
                    </Button>
                    <Button variant="outline" onClick={() => act('reject-award', async () => { await post('awards/' + event.award.id + '/decision', { approved: false }); })}>
                      Reject
                    </Button>
                  </div>
                )}

                {event.award.status === 'APPROVED' && !event.award.contract && (
                  <ContractForm
                    busy={busy === 'contract'}
                    onCreate={(data) =>
                      act('contract', async () => {
                        await post('awards/' + event.award.id + '/contract', data);
                      })
                    }
                  />
                )}

                {event.award.contract && (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-emerald-950">{event.award.contract.title}</p>
                        <p className="mt-1 text-xs text-emerald-800">
                          {formatDate(new Date(event.award.contract.startDate))} → {formatDate(new Date(event.award.contract.endDate))}
                        </p>
                      </div>
                      <Badge value={event.award.contract.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/procurement/contracts/' + event.award.contract.id + '/export');
                            const payload = await response.json().catch(() => null);
                            if (!response.ok) throw new Error(payload?.message || payload?.error || 'Could not export contract');
                            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const anchor = document.createElement('a');
                            anchor.href = url;
                            anchor.download = 'vendorse-contract-' + event.award.contract.id + '.json';
                            anchor.click();
                            URL.revokeObjectURL(url);
                          } catch (e) {
                            setError(e instanceof Error ? e.message : 'Could not export contract');
                          }
                        }}
                      >
                        Export ERP/P2P handoff
                      </Button>
                      {!['EXECUTED', 'ACTIVE'].includes(event.award.contract.status) && (
                        <Button
                          onClick={() =>
                            act('execute-contract', async () => {
                              const signedDocumentKey = window.prompt('Signed contract storage key');
                              if (!signedDocumentKey) return;
                              await post('contracts/' + event.award.contract.id + '/execute', { signedDocumentKey });
                            })
                          }
                        >
                          Mark executed
                        </Button>
                      )}
                    </div>

                    {['EXECUTED', 'ACTIVE'].includes(event.award.contract.status) && (
                      <PerformanceForm
                        contract={event.award.contract}
                        busy={busy === 'performance'}
                        onSubmit={(data) =>
                          act('performance', async () => {
                            await post('contracts/' + event.award.contract.id + '/performance', data);
                          })
                        }
                      />
                    )}

                    {!!event.award.contract.performanceReviews?.length && (
                      <div className="mt-5 border-t border-emerald-200 pt-4">
                        <p className="text-sm font-bold text-emerald-950">Performance history</p>
                        <div className="mt-3 space-y-2">
                          {event.award.contract.performanceReviews.map((review: AnyRecord) => (
                            <div key={review.id} className="rounded-lg bg-white/70 px-3 py-3 text-xs text-emerald-950">
                              <div className="flex flex-wrap gap-x-3 gap-y-1 font-semibold">
                                <span>Quality {Number(review.quality)}/100</span>
                                <span>Delivery {Number(review.delivery)}/100</span>
                                <span>Responsiveness {Number(review.responsiveness)}/100</span>
                                <span>Commercial {Number(review.commercial)}/100</span>
                              </div>
                              {review.notes && <p className="mt-2 leading-5 text-emerald-900/80">{review.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Section>
            )}
          </main>

          <aside className="space-y-4 lg:sticky lg:top-24">
            {isBuyer && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black text-slate-950">Event controls</p>

                {event.status === 'DRAFT' && (
                  <Button
                    className="mt-4 w-full"
                    onClick={() => act('publish', async () => { await post('events/' + id + '/publish'); })}
                    isLoading={busy === 'publish'}
                  >
                    Publish frozen event
                  </Button>
                )}

                {['DRAFT', 'PUBLISHED'].includes(event.status) && (
                  <div className="mt-4">
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                    >
                      <option value="">Invite supplier…</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name} · {supplier.supplierStatus.replaceAll('_', ' ')}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() =>
                        act('invite', async () => {
                          if (!selectedSupplier) throw new Error('Select a supplier first');
                          await post('events/' + id + '/invitations', { supplierOrgId: selectedSupplier });
                          setSelectedSupplier('');
                        })
                      }
                    >
                      Invite supplier
                    </Button>
                  </div>
                )}

                {event.status === 'PUBLISHED' && (
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() =>
                      act('amend', async () => {
                        const summary = window.prompt('Describe the amendment');
                        if (!summary) return;
                        await post('events/' + id + '/amendments', { summary });
                      })
                    }
                  >
                    Publish amendment
                  </Button>
                )}

                {event.status === 'PUBLISHED' && deadlinePassed && (
                  <Button
                    className="mt-3 w-full"
                    onClick={() =>
                      act('open', async () => {
                        await post('events/' + id + '/open', { note: 'Opened from Vendorse event room.' });
                      })
                    }
                    isLoading={busy === 'open'}
                  >
                    Open sealed responses
                  </Button>
                )}
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-black text-slate-950">Supplier participation</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {event.invitations?.length || 0} invited · {event.responses?.length || 0} responses visible in your scope.
              </p>
              {isBuyer && !!event.invitations?.length && (
                <div className="mt-3 space-y-2">
                  {event.invitations.map((invitation: AnyRecord) => (
                    <div key={invitation.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                      <p className="font-bold text-slate-800">{invitation.supplierOrg?.name}</p>
                      <p className="text-slate-500">{invitation.status.replaceAll('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-300">Integrity state</p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-300">
                <li>• Published criteria are persisted with this event.</li>
                <li>• Response versions are immutable and receipted.</li>
                <li>• Buyer/reviewer proposal access is gated by explicit opening.</li>
                <li>• Evaluators require assignment and COI clearance.</li>
                <li>• Award and contract are separate governed records.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function ContractForm({
  busy,
  onCreate,
}: {
  busy: boolean;
  onCreate: (data: AnyRecord) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <p className="text-sm font-bold text-slate-950">Create contract record</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contract title" />
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <Button
        className="mt-3"
        isLoading={busy}
        onClick={() => onCreate({ title, startDate, endDate })}
      >
        Create contract
      </Button>
    </div>
  );
}

function PerformanceForm({
  contract,
  busy,
  onSubmit,
}: {
  contract: AnyRecord;
  busy: boolean;
  onSubmit: (data: AnyRecord) => Promise<void>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [periodStart, setPeriodStart] = useState(
    new Date(contract.startDate).toISOString().slice(0, 10),
  );
  const [periodEnd, setPeriodEnd] = useState(today);
  const [quality, setQuality] = useState('80');
  const [delivery, setDelivery] = useState('80');
  const [responsiveness, setResponsiveness] = useState('80');
  const [commercial, setCommercial] = useState('80');
  const [notes, setNotes] = useState('');

  return (
    <div className="mt-5 border-t border-emerald-200 pt-5">
      <p className="text-sm font-bold text-emerald-950">Record supplier performance</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        <Input type="number" min="0" max="100" value={quality} onChange={(e) => setQuality(e.target.value)} placeholder="Quality" />
        <Input type="number" min="0" max="100" value={delivery} onChange={(e) => setDelivery(e.target.value)} placeholder="Delivery" />
        <Input type="number" min="0" max="100" value={responsiveness} onChange={(e) => setResponsiveness(e.target.value)} placeholder="Responsiveness" />
        <Input type="number" min="0" max="100" value={commercial} onChange={(e) => setCommercial(e.target.value)} placeholder="Commercial" />
      </div>
      <TextArea className="mt-3" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Evidence, incidents, SLA observations, or remediation actions" />
      <Button
        className="mt-3"
        isLoading={busy}
        onClick={() =>
          onSubmit({
            periodStart,
            periodEnd,
            quality: Number(quality),
            delivery: Number(delivery),
            responsiveness: Number(responsiveness),
            commercial: Number(commercial),
            notes,
          })
        }
      >
        Save performance review
      </Button>
    </div>
  );
}
