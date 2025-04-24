'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TenderCard } from '@vendorse/ui';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Tender } from '@vendorse/shared';

interface EvaluationTender extends Tender {
  _count: {
    bids: number;
    evaluations: number;
  };
}

export default function EvaluationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tenders, setTenders] = useState<EvaluationTender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user || user.role !== 'REVIEWER') {
        setError('Unauthorized access');
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/tenders?status=UNDER_REVIEW', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch evaluations: ${response.statusText}`);
        }

        const data = await response.json();
        setTenders(data.tenders || []);
      } catch (error) {
        console.error('Error fetching evaluations:', error);
        setError('Failed to load evaluations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, [user]);

  const handleTenderClick = (tenderId: string) => {
    router.push(`/tenders/${tenderId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['REVIEWER']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Pending Evaluations</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review and evaluate submitted bids for the following tenders
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(tenders) && tenders.length > 0 ? (
            tenders.map((tender) => (
              <div key={tender.id} className="flex flex-col">
                <TenderCard
                  {...tender}
                  onClick={() => handleTenderClick(tender.id)}
                />
                <div className="mt-2 flex justify-between text-sm text-gray-500">
                  <span>{tender._count?.bids || 0} bids submitted</span>
                  <span>{tender._count?.evaluations || 0} evaluations completed</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No pending evaluations</h3>
              <p className="mt-2 text-sm text-gray-500">
                There are currently no tenders that require your evaluation
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}