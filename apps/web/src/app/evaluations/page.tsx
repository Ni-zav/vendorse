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

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/tenders?status=UNDER_REVIEW', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setTenders(data.tenders);
      } catch (error) {
        console.error('Error fetching evaluations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchEvaluations();
    }
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
          {tenders.map((tender) => (
            <div key={tender.id} className="flex flex-col">
              <TenderCard
                {...tender}
                onClick={() => handleTenderClick(tender.id)}
              />
              <div className="mt-2 flex justify-between text-sm text-gray-500">
                <span>{tender._count.bids} bids submitted</span>
                <span>{tender._count.evaluations} evaluations completed</span>
              </div>
            </div>
          ))}
          {tenders.length === 0 && (
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