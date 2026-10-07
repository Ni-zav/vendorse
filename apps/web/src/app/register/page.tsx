'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, FormField, Input, Select } from '@vendorse/ui';

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData(event.currentTarget);
      const organization = {
        name: String(formData.get('orgName') || '').trim(),
        type: String(formData.get('orgType') || '') as
          | 'BUSINESS'
          | 'GOVERNMENT'
          | 'NON_PROFIT',
        address: String(formData.get('address') || '').trim(),
      };
      const user = {
        name: String(formData.get('name') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || ''),
      };

      if (!organization.name || !organization.type || !organization.address) {
        throw new Error('Complete all organization fields.');
      }

      if (!user.name || !user.email || !user.password) {
        throw new Error('Complete all account fields.');
      }

      if (user.password.length < 8) {
        throw new Error('Password must be at least 8 characters.');
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organization, user }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || result?.error || 'Registration failed.',
        );
      }

      if (!result?.ok) {
        throw new Error('Registration succeeded but no session was returned.');
      }

      localStorage.setItem('token', 'cookie-session');
      router.push('/dashboard');
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : 'Registration failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.85fr_1.15fr]">
        <section className="bg-slate-950 p-7 text-white sm:p-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-sm font-black tracking-tight"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-950">
              V
            </span>
            Vendorse
          </Link>

          <div className="mt-14 max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Supplier onboarding
            </p>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Create a vendor workspace for your organization.
            </h1>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              Public signup creates a supplier account. Buyer, reviewer, and
              administrator access should be provisioned through controlled
              organization administration rather than self-selected at signup.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {[
              'Track open sourcing opportunities',
              'Submit proposal documents through controlled uploads',
              'Follow bid status without seeing confidential scorecards',
            ].map((item, index) => (
              <div
                key={item}
                className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-black text-slate-200">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 py-9 sm:px-10 sm:py-12 lg:px-14">
          <div className="mx-auto max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Vendor registration
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Set up your supplier account
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Organization details are kept separate from the first user account
              so additional team access can be added later without duplicating
              the supplier record.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
              <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                <legend className="px-2 text-sm font-black text-slate-950">
                  Organization
                </legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Organization name"
                    required
                    className="sm:col-span-2"
                  >
                    <Input
                      type="text"
                      name="orgName"
                      required
                      autoComplete="organization"
                      placeholder="Acme Engineering"
                    />
                  </FormField>

                  <FormField label="Organization type" required>
                    <Select
                      name="orgType"
                      required
                      options={[
                        { value: 'BUSINESS', label: 'Business' },
                        { value: 'GOVERNMENT', label: 'Government' },
                        { value: 'NON_PROFIT', label: 'Non-profit' },
                      ]}
                    />
                  </FormField>

                  <FormField label="Registered address" required>
                    <Input
                      type="text"
                      name="address"
                      required
                      autoComplete="street-address"
                      placeholder="City / registered address"
                    />
                  </FormField>
                </div>
              </fieldset>

              <fieldset className="rounded-2xl border border-slate-200 p-5 sm:p-6">
                <legend className="px-2 text-sm font-black text-slate-950">
                  First user
                </legend>
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Full name" required>
                    <Input
                      type="text"
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Your name"
                    />
                  </FormField>

                  <FormField label="Work email" required>
                    <Input
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      placeholder="name@company.com"
                    />
                  </FormField>

                  <FormField
                    label="Password"
                    hint="8+ characters"
                    required
                    className="sm:col-span-2"
                  >
                    <Input
                      type="password"
                      name="password"
                      required
                      autoComplete="new-password"
                      placeholder="Create a password"
                      minLength={8}
                    />
                  </FormField>
                </div>
              </fieldset>

              <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-slate-600">
                  Already registered?{' '}
                  <Link
                    href="/login"
                    className="font-bold text-blue-700 hover:text-blue-800"
                  >
                    Sign in
                  </Link>
                </p>

                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Create vendor account
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
