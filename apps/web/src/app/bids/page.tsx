'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@vendorse/ui';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { formatCurrency, formatDate } from '@vendorse/shared';

interface Bid {
  id: string;
  status: string;
  submittedAt: string;
  tender: {
    id: string;
    title: string;
    budget: number;
    deadline: string;
    status: string;
  };
  evaluations: Array<{
    id: string;
    score: number;
    criteria: string;
    notes: string;
    reviewer: {
      name: string;
    };
  }>;
}

export default function BidsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setError(null);
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/bids', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: errorText };
          }
          
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          
          throw new Error(errorData?.error || 'Failed to fetch bids');
        }

        const data = await response.json();
        setBids(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching bids:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchBids();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      <ProtectedRoute allowedRoles={['VENDOR']}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading bids</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <div className="mt-4">
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['VENDOR']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">My Bids</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track and manage your submitted bids
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {bids.map((bid) => (
              <li key={bid.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {bid.tender.title}
                      </h3>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            Budget: {formatCurrency(bid.tender.budget)}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            Deadline: {formatDate(new Date(bid.tender.deadline))}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>Submitted: {formatDate(new Date(bid.submittedAt))}</p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 flex-shrink-0">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(bid.status)}`}>
                        {bid.status}
                      </span>
                    </div>
                  </div>

                  {bid.evaluations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Evaluation Results</h4>
                      <div className="mt-2 space-y-2">
                        {bid.evaluations.map((evaluation) => (
                          <div key={evaluation.id} className="border-l-4 border-blue-400 pl-4">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {evaluation.criteria}
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                Score: {evaluation.score}
                              </p>
                            </div>
                            {evaluation.notes && (
                              <p className="mt-1 text-sm text-gray-600">
                                {evaluation.notes}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              Reviewed by {evaluation.reviewer.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/tenders/${bid.tender.id}`)}
                    >
                      View Tender Details
                    </Button>
                  </div>
                </div>
              </li>
            ))}
            {bids.length === 0 && (
              <li className="px-4 py-12 text-center">
                <h3 className="text-lg font-medium text-gray-900">No bids submitted</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Start participating in tenders to see your bids here
                </p>
                <div className="mt-6">
                  <Button onClick={() => router.push('/dashboard')}>
                    Browse Available Tenders
                  </Button>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </ProtectedRoute>
  );
}