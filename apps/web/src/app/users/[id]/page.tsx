'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, FormField, Input, Select } from '@vendorse/ui';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { UserRole, UserStatus } from '@vendorse/shared';

interface UserDetails {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  organization: {
    id: string;
    name: string;
    type: string;
    address: string;
  };
}

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    password: '',
  });

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(\`/api/users/\${params.id}\`, {
          headers: { Authorization: \`Bearer \${token}\` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const data = await response.json();
        setUserDetails(data);
        setFormData({
          name: data.name,
          email: data.email,
          role: data.role,
          status: data.status,
          password: '',
        });
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setIsSaving(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const updateData = {
        ...formData,
        password: formData.password || undefined,
      };

      const response = await fetch(\`/api/users/\${params.id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${token}\`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }

      router.push('/users');
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">User not found</h3>
                <div className="mt-4">
                  <Button onClick={() => router.push('/users')}>
                    Back to Users
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Edit User
              </h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button
                variant="outline"
                onClick={() => router.push('/users')}
              >
                Cancel
              </Button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error updating user</h3>
                      <p className="mt-2 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <FormField label="Name">
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </FormField>

                <FormField label="Email">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </FormField>

                <FormField label="Role">
                  <Select
                    value={formData.role}
                    onChange={(value) => handleInputChange('role', value)}
                    options={[
                      { value: 'ADMIN', label: 'Admin' },
                      { value: 'BUYER', label: 'Buyer' },
                      { value: 'VENDOR', label: 'Vendor' },
                      { value: 'REVIEWER', label: 'Reviewer' },
                    ]}
                    required
                  />
                </FormField>

                <FormField label="Status">
                  <Select
                    value={formData.status}
                    onChange={(value) => handleInputChange('status', value)}
                    options={[
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'INACTIVE', label: 'Inactive' },
                      { value: 'SUSPENDED', label: 'Suspended' },
                    ]}
                    required
                  />
                </FormField>

                <FormField label="New Password" className="sm:col-span-2">
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Leave blank to keep current password"
                    minLength={8}
                  />
                </FormField>
              </div>

              <div className="flex items-center justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/users')}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900">Organization Details</h3>
              </div>
              <div className="border-t border-gray-200 px-6 py-5">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Organization Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{userDetails.organization.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Organization Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{userDetails.organization.type}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">{userDetails.organization.address}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}