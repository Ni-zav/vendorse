'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  FormField,
  Input,
  Select,
  StatusBadge,
} from '@vendorse/ui';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'BUYER' | 'VENDOR' | 'REVIEWER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  organization?: {
    id: string;
    name: string;
    type: string;
    address: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function UserDetailClient({
  params,
}: {
  params: { id: string };
}): JSX.Element {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { id } = params;
  const [record, setRecord] = useState<UserRecord | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'VENDOR',
    status: 'ACTIVE',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isSelf = currentUser?.id === id;

  const loadUser = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Your session has expired.');
      }

      const response = await fetch('/api/users/' + id, {
        headers: { Authorization: 'Bearer ' + token },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.message || payload?.error || 'Could not load this account.',
        );
      }

      setRecord(payload);
      setForm({
        name: payload.name || '',
        email: payload.email || '',
        role: payload.role || 'VENDOR',
        status: payload.status || 'ACTIVE',
        password: '',
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load this account.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUser();
  }, [id]);

  const hasChanges = useMemo(() => {
    if (!record) return false;

    return (
      form.name.trim() !== record.name ||
      form.email.trim().toLowerCase() !== record.email.toLowerCase() ||
      form.role !== record.role ||
      form.status !== record.status ||
      Boolean(form.password)
    );
  }, [form, record]);

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!record || !hasChanges) return;

    setError('');
    setNotice('');
    setIsSaving(true);

    try {
      if (!form.name.trim() || !form.email.trim()) {
        throw new Error('Name and email are required.');
      }

      if (form.password && form.password.length < 8) {
        throw new Error('A replacement password must be at least 8 characters.');
      }

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Your session has expired.');
      }

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        status: form.status,
        ...(form.password ? { password: form.password } : {}),
      };

      const response = await fetch('/api/users/' + id, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const updated = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          updated?.message || updated?.error || 'Could not update this account.',
        );
      }

      setRecord(updated);
      setForm({
        name: updated.name,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        password: '',
      });
      setNotice('Account changes saved and written to the audit log.');
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not update this account.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-5">
          <div className="h-28 rounded-3xl bg-slate-200" />
          <div className="h-96 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push('/users')}
              className="text-sm font-bold text-slate-500 transition hover:text-slate-900"
            >
              ← Back to user management
            </button>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                Account administration
              </h1>
              {record && <StatusBadge status={record.status} />}
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Update account identity, platform role, access status, or set a
              replacement password. Role and status changes affect authorization
              immediately after the next authenticated request.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {notice}
          </div>
        )}

        {record && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <form
              onSubmit={saveUser}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Full name" required>
                  <Input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    autoComplete="name"
                    required
                  />
                </FormField>

                <FormField label="Email address" required>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    autoComplete="email"
                    required
                  />
                </FormField>

                <FormField
                  label="Platform role"
                  hint={isSelf ? 'Self-demotion is blocked' : undefined}
                  required
                >
                  <Select
                    name="role"
                    value={form.role}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, role: value }))
                    }
                    options={[
                      { value: 'ADMIN', label: 'Administrator' },
                      { value: 'BUYER', label: 'Buyer' },
                      { value: 'VENDOR', label: 'Vendor' },
                      { value: 'REVIEWER', label: 'Reviewer' },
                    ]}
                  />
                </FormField>

                <FormField
                  label="Account status"
                  hint={isSelf ? 'Self-suspension is blocked' : undefined}
                  required
                >
                  <Select
                    name="status"
                    value={form.status}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, status: value }))
                    }
                    options={[
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'INACTIVE', label: 'Inactive' },
                      { value: 'SUSPENDED', label: 'Suspended' },
                    ]}
                  />
                </FormField>

                <FormField
                  label="Replacement password"
                  hint="Leave blank to keep current password"
                  className="sm:col-span-2"
                >
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="8+ characters"
                  />
                </FormField>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm({
                      name: record.name,
                      email: record.email,
                      role: record.role,
                      status: record.status,
                      password: '',
                    });
                    setError('');
                    setNotice('');
                  }}
                  disabled={!hasChanges || isSaving}
                  className="w-full sm:w-auto"
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  isLoading={isSaving}
                  disabled={!hasChanges || isSaving}
                  className="w-full sm:w-auto"
                >
                  Save account
                </Button>
              </div>
            </form>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Organization
                </p>
                <p className="mt-3 text-base font-black">
                  {record.organization?.name || 'No organization'}
                </p>
                {record.organization && (
                  <>
                    <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-400">
                      {record.organization.type.replaceAll('_', ' ')}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-slate-300">
                      {record.organization.address}
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Account record
                </p>
                <dl className="mt-4 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Created</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Last updated</dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {new Date(record.updatedAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Account ID</dt>
                    <dd className="mt-1 break-all font-mono text-xs text-slate-700">
                      {record.id}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
