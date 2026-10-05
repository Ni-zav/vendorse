'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, FormField, Input } from '@vendorse/ui';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email.trim(), password);
    } catch {
      setError('We could not sign you in with those credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:min-h-[720px] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-sm font-black tracking-tight"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950">
                V
              </span>
              Vendorse
            </Link>

            <div className="mt-20 max-w-md">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Procurement workspace
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">
                Keep sourcing decisions structured, reviewable, and moving.
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-300">
                Manage tender publication, supplier submissions, independent
                scorecards, and award decisions from one role-aware workspace.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {['Sealed submissions', 'Role-aware access', 'Auditable scoring'].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <p className="text-sm font-semibold text-slate-200">{item}</p>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="flex items-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-sm font-black tracking-tight text-slate-950 lg:hidden"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                V
              </span>
              Vendorse
            </Link>

            <div className="mt-10 lg:mt-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                Welcome back
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Sign in to your workspace
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Use the account assigned to your buyer, supplier, reviewer, or
                administrator role.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <FormField label="Email address" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                />
              </FormField>

              <FormField label="Password" required>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
              </FormField>

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Sign in
              </Button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="text-sm leading-6 text-slate-600">
                Joining as a supplier?{' '}
                <Link
                  href="/register"
                  className="font-bold text-blue-700 hover:text-blue-800"
                >
                  Create a vendor account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
