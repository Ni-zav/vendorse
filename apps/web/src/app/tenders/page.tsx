'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TenderCard } from '@vendorse/ui';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

interface Tender {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  createdBy: {
    organization: {
      name: string;
    };
  };
  _count: {
    bids: number;
  };
}

export default function TendersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/tenders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to fetch tenders');
        }

        const data = await response.json();
        setTenders(data.tenders);
      } catch (err) {
        console.error('Error fetching tenders:', err);
        if (err instanceof Error && err.message === 'No authentication token found') {
          router.push('/login');
        } else {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTenders();
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tenders</h1>
            <p className="mt-2 text-sm text-gray-600">
              Browse and manage available tenders
            </p>
          </div>
          {user && (user.role === 'ADMIN' || user.role === 'BUYER') && (
            <button
              onClick={() => router.push('/tenders/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create New Tender
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tenders.map((tender) => (
            <TenderCard
              key={tender.id}
              id={tender.id}
              title={tender.title}
              description={tender.description}
              budget={tender.budget}
              deadline={tender.deadline}
              status={tender.status}
              createdBy={tender.createdBy}
              bidCount={tender._count?.bids || 0}
              onClick={() => router.push(`/tenders/${tender.id}`)}
            />
          ))}
          {tenders.length === 0 && (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No tenders found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {user?.role === 'VENDOR'
                  ? 'Check back later for new tender opportunities'
                  : 'Create a new tender to get started'}
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}