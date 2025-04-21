'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, FormField, Input, TextArea } from '@vendorse/ui';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export default function NewTenderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      budget: Number(formData.get('budget')),
      deadline: new Date(formData.get('deadline') as string).toISOString(),
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tenders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create tender');
      }

      const result = await response.json();
      router.push(`/tenders/${result.id}`);
    } catch (err) {
      setError('Failed to create tender. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'BUYER']}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create New Tender</h1>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Title" required>
              <Input
                type="text"
                name="title"
                required
                placeholder="Enter tender title"
                minLength={5}
                maxLength={200}
              />
            </FormField>

            <FormField label="Description" required>
              <TextArea
                name="description"
                required
                placeholder="Enter detailed tender description"
                rows={6}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Budget" required>
                <Input
                  type="number"
                  name="budget"
                  required
                  min="0"
                  step="0.01"
                  placeholder="Enter budget amount"
                />
              </FormField>

              <FormField label="Submission Deadline" required>
                <Input
                  type="datetime-local"
                  name="deadline"
                  required
                  min={new Date().toISOString().split('.')[0]}
                />
              </FormField>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
              >
                Create Tender
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}