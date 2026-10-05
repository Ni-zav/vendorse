'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, FormField, Select, StatusBadge } from '@vendorse/ui';
import { ProtectedRoute } from '../components/ProtectedRoute';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  organization: {
    name: string;
    type: string;
  };
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const roleLabel = (role: string) =>
  ({
    ADMIN: 'Administrator',
    BUYER: 'Buyer',
    VENDOR: 'Vendor',
    REVIEWER: 'Reviewer',
  })[role] || role;

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({ role: '', status: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchUsers = async () => {
      setIsLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('Your session has expired.');
        }

        const query = new URLSearchParams({
          page: String(pagination.page),
          limit: String(pagination.pageSize),
        });

        if (filters.role) query.set('role', filters.role);
        if (filters.status) query.set('status', filters.status);

        const response = await fetch('/api/users?' + query.toString(), {
          headers: { Authorization: 'Bearer ' + token },
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            payload?.message || payload?.error || 'Could not load user accounts.',
          );
        }

        if (!cancelled) {
          setUsers(Array.isArray(payload?.users) ? payload.users : []);
          setPagination((current) => ({
            ...current,
            ...(payload?.pagination || {}),
          }));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Could not load user accounts.',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [pagination.page, pagination.pageSize, filters.role, filters.status]);

  const changeFilter = (field: 'role' | 'status', value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const firstResult =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1;
  const lastResult = Math.min(
    pagination.page * pagination.pageSize,
    pagination.total,
  );

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="rounded-3xl bg-slate-950 px-5 py-6 text-white sm:px-8 sm:py-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">
            Platform administration
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                User access
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Review platform accounts, organization context, roles, and access
                state. Account edits are recorded in the procurement audit log.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Accounts in scope
              </p>
              <p className="mt-1 text-2xl font-black">{pagination.total}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
            <FormField label="Role">
              <Select
                name="role"
                value={filters.role}
                onChange={(value) => changeFilter('role', value)}
                options={[
                  { value: '', label: 'All roles' },
                  { value: 'ADMIN', label: 'Administrator' },
                  { value: 'BUYER', label: 'Buyer' },
                  { value: 'VENDOR', label: 'Vendor' },
                  { value: 'REVIEWER', label: 'Reviewer' },
                ]}
              />
            </FormField>

            <FormField label="Account status">
              <Select
                name="status"
                value={filters.status}
                onChange={(value) => changeFilter('status', value)}
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                  { value: 'SUSPENDED', label: 'Suspended' },
                ]}
              />
            </FormField>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-sm font-black text-slate-900">
                No accounts match these filters
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Change the role or status filter to broaden the account list.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 lg:hidden">
                {users.map((account) => (
                  <article key={account.id} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">
                          {account.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {account.email}
                        </p>
                      </div>
                      <StatusBadge status={account.status} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-500">Role</p>
                        <p className="mt-1 font-bold text-slate-900">
                          {roleLabel(account.role)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-slate-500">Organization</p>
                        <p className="mt-1 truncate font-bold text-slate-900">
                          {account.organization.name}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => router.push('/users/' + account.id)}
                      className="mt-4 w-full"
                    >
                      Manage account
                    </Button>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Account', 'Organization', 'Role', 'Status', ''].map(
                        (heading) => (
                          <th
                            key={heading || 'actions'}
                            className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-500"
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {users.map((account) => (
                      <tr key={account.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-950">
                            {account.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {account.email}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {account.organization.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {account.organization.type.replaceAll('_', ' ')}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {roleLabel(account.role)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={account.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/users/' + account.id)}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-slate-500">
              Showing {firstResult}–{lastResult} of {pagination.total}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((current) => ({
                    ...current,
                    page: Math.max(1, current.page - 1),
                  }))
                }
                disabled={pagination.page <= 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((current) => ({
                    ...current,
                    page: Math.min(current.totalPages, current.page + 1),
                  }))
                }
                disabled={
                  pagination.page >= pagination.totalPages || isLoading
                }
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
