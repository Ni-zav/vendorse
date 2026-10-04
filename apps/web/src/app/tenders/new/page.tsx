'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, FormField, Input, TextArea } from '@vendorse/ui';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export default function NewTenderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const minimumDeadline = useMemo(() => {
    const localNow = new Date(Date.now() + 5 * 60 * 1000);
    const localValue = new Date(
      localNow.getTime() - localNow.getTimezoneOffset() * 60 * 1000,
    );
    return localValue.toISOString().slice(0, 16);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const deadlineValue = formData.get('deadline') as string;

    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      budget: Number(formData.get('budget')),
      deadline: new Date(deadlineValue).toISOString(),
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tenders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(data),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.error || 'Failed to create tender draft.',
        );
      }

      router.push('/tenders/' + payload.id);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to create tender draft.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'BUYER']}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-bold text-slate-600 hover:text-slate-950"
          >
            ← Back
          </button>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
            New sourcing event
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Create tender draft
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Start with the commercial scope, buyer budget ceiling, and response
            deadline. The tender remains a draft until you review and publish it.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField
                label="Tender title"
                required
                hint="5–200 characters"
              >
                <Input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Office fit-out and furniture supply"
                  minLength={5}
                  maxLength={200}
                />
              </FormField>

              <FormField
                label="Scope and requirements"
                required
                hint="Be specific enough to compare responses"
              >
                <TextArea
                  name="description"
                  required
                  placeholder="Describe the scope, deliverables, constraints, required evidence, commercial assumptions, and acceptance expectations."
                  rows={9}
                />
              </FormField>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Budget ceiling"
                  required
                  hint="Used as buyer reference"
                >
                  <Input
                    type="number"
                    name="budget"
                    required
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Enter budget"
                  />
                </FormField>

                <FormField
                  label="Submission deadline"
                  required
                  hint="Local browser time"
                >
                  <Input
                    type="datetime-local"
                    name="deadline"
                    required
                    min={minimumDeadline}
                  />
                </FormField>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Save draft
                </Button>
              </div>
            </form>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-300">
                Publication gate
              </p>
              <h2 className="mt-2 text-lg font-black">Draft first, publish second</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Saving this form does not expose the tender to suppliers. Review the
                tender detail page before publication.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold text-slate-900">MVP scope to watch</p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                <li>• Tender-specific evaluation criteria are not yet persisted.</li>
                <li>• Required document schedules are not yet configurable.</li>
                <li>• Formal approval chains and amendments need a schema migration.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </ProtectedRoute>
  );
}
