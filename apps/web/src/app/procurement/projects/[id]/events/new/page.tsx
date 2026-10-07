'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, FormField, Input, TextArea } from '@vendorse/ui';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';

type Criterion = { key: string; name: string; weight: number };
type LineItem = { code: string; description: string; quantity: number; unit: string };

export default function NewSourcingEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([
    { key: 'technical', name: 'Technical capability', weight: 50 },
    { key: 'commercial', name: 'Commercial value', weight: 30 },
    { key: 'delivery', name: 'Delivery and implementation', weight: 20 },
  ]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const form = new FormData(event.currentTarget);
      const activeLines = lineItems.filter((item) => item.code.trim() && item.description.trim());
      const response = await fetch('/api/procurement/projects/' + id + '/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: String(form.get('type') || 'RFP'),
          title: String(form.get('title') || ''),
          instructions: String(form.get('instructions') || ''),
          closeAt: new Date(String(form.get('closeAt'))).toISOString(),
          criteria: criteria.map((criterion) => ({
            ...criterion,
            minScore: 0,
            maxScore: 100,
          })),
          lineItems: activeLines,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || payload?.error || 'Could not create event');
      router.push('/procurement/events/' + payload.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create event');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <button type="button" onClick={() => router.push('/procurement')} className="text-sm font-bold text-slate-600">← Procurement workspace</button>
        <header className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Sourcing design</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Create a governed sourcing event</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Criteria and line items are persisted before publication. Once published, changes are represented as explicit amendments rather than silent edits.
          </p>
        </header>

        {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <form onSubmit={submit} className="mt-7 space-y-7">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Event type" required>
                <select name="type" defaultValue="RFP" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold">
                  <option value="RFI">RFI</option>
                  <option value="RFQ">RFQ</option>
                  <option value="RFP">RFP</option>
                  <option value="TENDER">Tender</option>
                  <option value="BAFO">BAFO / final offer</option>
                </select>
              </FormField>
              <FormField label="Submission deadline" required>
                <Input name="closeAt" type="datetime-local" required />
              </FormField>
            </div>
            <div className="mt-5 space-y-5">
              <FormField label="Event title" required>
                <Input name="title" required placeholder="e.g. Visualization services — 2027 campaign" />
              </FormField>
              <FormField label="Supplier instructions" required>
                <TextArea name="instructions" required rows={8} placeholder="Scope, response instructions, assumptions, mandatory evidence, commercial conditions, and key dates." />
              </FormField>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Published evaluation plan</p>
            <div className="mt-4 space-y-3">
              {criteria.map((criterion, index) => (
                <div key={criterion.key} className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_8rem]">
                  <Input
                    value={criterion.name}
                    onChange={(e) => setCriteria((current) => current.map((item, i) => i === index ? { ...item, name: e.target.value } : item))}
                  />
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={criterion.weight}
                    onChange={(e) => setCriteria((current) => current.map((item, i) => i === index ? { ...item, weight: Number(e.target.value) } : item))}
                  />
                </div>
              ))}
              <p className="text-xs text-slate-500">Weights must total 100. Current total: <strong>{criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0)}</strong>.</p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Commercial structure</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">Line items</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLineItems((current) => [...current, { code: 'ITEM-' + (current.length + 1), description: '', quantity: 1, unit: 'lot' }])}
              >
                Add line
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 lg:grid-cols-[8rem_1fr_7rem_8rem_auto]">
                  <Input value={item.code} onChange={(e) => setLineItems((c) => c.map((x, i) => i === index ? { ...x, code: e.target.value } : x))} placeholder="Code" />
                  <Input value={item.description} onChange={(e) => setLineItems((c) => c.map((x, i) => i === index ? { ...x, description: e.target.value } : x))} placeholder="Description" />
                  <Input type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(e) => setLineItems((c) => c.map((x, i) => i === index ? { ...x, quantity: Number(e.target.value) } : x))} />
                  <Input value={item.unit} onChange={(e) => setLineItems((c) => c.map((x, i) => i === index ? { ...x, unit: e.target.value } : x))} placeholder="Unit" />
                  <button type="button" onClick={() => setLineItems((c) => c.filter((_, i) => i !== index))} className="text-sm font-bold text-red-700">Remove</button>
                </div>
              ))}
              {!lineItems.length && <p className="text-sm text-slate-500">Optional. Add line items when structured commercial comparison is useful.</p>}
            </div>
          </section>

          <div className="flex justify-end">
            <Button type="submit" isLoading={busy}>Create event draft</Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
