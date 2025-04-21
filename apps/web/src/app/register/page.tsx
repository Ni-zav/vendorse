'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, FormField, Input, Select } from '@vendorse/ui';
import { OrgType } from '@vendorse/shared';

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      organization: {
        name: formData.get('orgName'),
        type: formData.get('orgType'),
        address: formData.get('address'),
      },
      user: {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: 'VENDOR', // Default role for self-registration
      },
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const result = await response.json();
      localStorage.setItem('token', result.accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Register as a Vendor
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create an account to start participating in tenders
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Details</h3>
              <div className="space-y-4">
                <FormField label="Organization Name" required>
                  <Input
                    type="text"
                    name="orgName"
                    required
                    placeholder="Enter organization name"
                  />
                </FormField>

                <FormField label="Organization Type" required>
                  <Select
                    name="orgType"
                    required
                    options={[
                      { value: 'BUSINESS', label: 'Business' },
                      { value: 'GOVERNMENT', label: 'Government' },
                      { value: 'NON_PROFIT', label: 'Non-Profit' },
                    ]}
                  />
                </FormField>

                <FormField label="Address" required>
                  <Input
                    type="text"
                    name="address"
                    required
                    placeholder="Enter organization address"
                  />
                </FormField>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Details</h3>
              <div className="space-y-4">
                <FormField label="Full Name" required>
                  <Input
                    type="text"
                    name="name"
                    required
                    placeholder="Enter your full name"
                  />
                </FormField>

                <FormField label="Email Address" required>
                  <Input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="Enter your email"
                  />
                </FormField>

                <FormField label="Password" required>
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
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              isLoading={isSubmitting}
            >
              Register
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}