'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, FormField, Input, TextArea } from '@vendorse/ui';
import { ProtectedRoute } from '../../../components/ProtectedRoute';

export default function NewProcurementRequestPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch('/api/procurement/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: String(form.get('title') || ''),
          description: String(form.get('description') || ''),
          category: String(form.get('category') || ''),
          estimatedAmount: String(form.get('estimatedAmount') || ''),
          currency: String(form.get('currency') || 'IDR'),
          desiredDate: form.get('desiredDate')
            ? new Date(String(form.get('desiredDate'))).toISOString()
            : undefined,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || payload?.error || 'Could not create request');
      router.push('/procurement');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create request');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['BUYER', 'ADMIN']}>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <button className="text-sm font-bold text-slate-600" onClick={() => router.back()} type="button">← Procurement workspace</button>
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Procurement intake</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Describe the business need</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            This is intentionally not a tender form. Capture the need, budget context, and desired timing first; sourcing starts only after approval.
          </p>
        </div>

        {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <form onSubmit={submit} className="mt-7 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <FormField label="Business need" required>
            <Input name="title" required minLength={5} placeholder="e.g. Architectural visualization partner for 2027 launch" />
          </FormField>
          <FormField label="What outcome do you need?" required>
            <TextArea name="description" required rows={8} placeholder="Describe the business outcome, deliverables, constraints, incumbent context, and anything procurement should know." />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Category" required>
              <Input name="category" required placeholder="e.g. Professional Services" />
            </FormField>
            <FormField label="Desired completion date">
              <Input name="desiredDate" type="date" />
            </FormField>
            <FormField label="Estimated amount" required>
              <Input name="estimatedAmount" required type="number" min="0.01" step="0.01" />
            </FormField>
            <FormField label="Currency" required>
              <Input name="currency" required defaultValue="IDR" maxLength={3} />
            </FormField>
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-6">
            <Button type="submit" isLoading={busy}>Save request draft</Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
