'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, BidForm, TenderEvaluation } from '@vendorse/ui';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { formatCurrency, formatDate } from '@vendorse/shared';
import { TenderDetail } from './types';

export default function TenderDetailClient({ params }: { params: { id: string } }): JSX.Element {
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTenderDetails = async () => {
      try {
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        console.log('Fetching tender details:', { id });
        const response = await fetch(`/api/tenders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error;
            
            // Handle specific error cases
            if (response.status === 403) {
              if (errorMessage.includes('not yet published')) {
                throw new Error('This tender is in draft status and not yet available for viewing');
              } else if (errorMessage.includes('not available for review')) {
                throw new Error('This tender is not currently available for review');
              }
            }
          } catch (parseError) {
            errorMessage = errorText || 'Failed to fetch tender details';
          }
          console.error('Error response:', { status: response.status, errorMessage });
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Tender details received:', {
          id: data.id,
          status: data.status,
          bidsCount: data.bids?.length
        });
        setTender(data);
      } catch (err) {
        console.error('Error fetching tender details:', err);
        if (err instanceof Error && err.message === 'No authentication token found') {
          router.push('/login');
        } else {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTenderDetails();
    }
  }, [id, router]);

  const handlePublishTender = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      const token = localStorage.getItem('token');
      
      console.log('Starting publish tender request:', { tenderId: id });
      const response = await fetch(`/api/tenders/${id}/publish`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers.get('content-type');
      let errorMessage = 'Failed to publish tender';
      
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        console.error('Publish tender failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage
        });
        throw new Error(errorMessage);
      }

      const updatedTender = await response.json();
      console.log('Tender published successfully:', updatedTender);
      setTender(updatedTender);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish tender';
      console.error('Publish tender error:', err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitBid = async (data: any) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenders/${id}/bids`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit bid');
      }

      // Refresh tender data to show the new bid
      const updatedTender = await fetch(`/api/tenders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => res.json());
      
      setTender(updatedTender);
    } catch (err) {
      setError('Failed to submit bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEvaluation = async (bidId: string, evaluationData: any) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenders/bids/${bidId}/evaluate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evaluationData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit evaluation');
      }

      // Refresh tender data to show the new evaluation
      const updatedTender = await fetch(`/api/tenders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => res.json());
      
      setTender(updatedTender);
    } catch (err) {
      setError('Failed to submit evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAwardTender = async (bidId: string) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenders/${id}/award/${bidId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to award tender');
      }

      const updatedTender = await response.json();
      setTender(updatedTender);
    } catch (err) {
      setError('Failed to award tender');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Tender not found</h2>
          <p className="mt-2 text-gray-600">The tender you're looking for doesn't exist</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {tender && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold leading-6 text-gray-900">{tender.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Posted by {tender.createdBy.name} from {tender.createdBy.organization.name}
                  </p>
                </div>
                <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                  tender.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                  tender.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                  tender.status === 'AWARDED' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tender.status}
                </span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{tender.description}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Budget</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatCurrency(tender.budget)}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Deadline</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(new Date(tender.deadline))}</dd>
                </div>
              </dl>
            </div>

            {/* Action buttons based on user role and tender status */}
            {user && (user.role === 'BUYER' || user.role === 'ADMIN') && tender.status === 'DRAFT' && (
              <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
                <Button
                  onClick={handlePublishTender}
                  isLoading={isSubmitting}
                >
                  Publish Tender
                </Button>
              </div>
            )}

            {/* Bid submission form for vendors */}
            {user && user.role === 'VENDOR' && tender.status === 'PUBLISHED' && (
              <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Submit Your Bid</h4>
                <BidForm onSubmit={handleSubmitBid} isLoading={isSubmitting} />
              </div>
            )}

            {/* Bid evaluation section for reviewers */}
            {user && user.role === 'REVIEWER' && tender.bids && tender.bids.length > 0 && (
              <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Evaluations</h3>
                {tender.bids.map((bid) => {
                  // Check if the reviewer hasn't evaluated this bid yet
                  const hasEvaluated = bid.evaluations.some((evaluation) => evaluation.reviewer.id === user.id);
                  if (hasEvaluated) return null;

                  return (
                    <div key={bid.id} className="mb-8 last:mb-0 p-4 border rounded-lg">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Evaluate Bid from {bid.submittedBy.organization.name}
                      </h4>
                      <TenderEvaluation
                        bidId={bid.id}
                        criteria={[
                          { id: '1', name: 'Technical Capability', description: 'Evaluate technical approach and methodology', weight: 40 },
                          { id: '2', name: 'Price', description: 'Evaluate proposed budget and cost-effectiveness', weight: 30 },
                          { id: '3', name: 'Timeline', description: 'Evaluate proposed timeline and delivery schedule', weight: 30 },
                        ]}
                        onSubmit={(data) => handleSubmitEvaluation(bid.id, data)}
                        isSubmitting={isSubmitting}
                      />
                    </div>
                  );
                })}
                {tender.bids.every(bid => bid.evaluations.some(evaluation => evaluation.reviewer.id === user.id)) && (
                  <p className="text-sm text-gray-500">You have evaluated all available bids for this tender.</p>
                )}
              </div>
            )}

            {/* Bid list and award options for buyers */}
            {tender.bids.length > 0 && (user?.role === 'BUYER' || user?.role === 'ADMIN') && (
              <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Submitted Bids</h4>
                <div className="space-y-6">
                  {tender.bids.map((bid) => (
                    <div key={bid.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">
                            {bid.submittedBy.organization.name}
                          </h5>
                          <p className="text-sm text-gray-500">
                            Submitted by {bid.submittedBy.name}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          bid.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                          bid.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {bid.status}
                        </span>
                      </div>

                      {bid.evaluations.length > 0 && (
                        <div className="mt-4">
                          <h6 className="text-sm font-medium text-gray-900">Evaluations</h6>
                          <div className="mt-2 space-y-2">
                            {bid.evaluations.map((evaluation) => (
                              <div key={evaluation.id} className="bg-white rounded p-3">
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">{evaluation.criteria}</span>
                                  <span className="text-sm">{evaluation.score}/100</span>
                                </div>
                                {evaluation.notes && (
                                  <p className="mt-1 text-sm text-gray-600">{evaluation.notes}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                  By {evaluation.reviewer.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {tender.status === 'UNDER_REVIEW' && (user?.role === 'BUYER' || user?.role === 'ADMIN') && (
                        <div className="mt-4">
                          <Button
                            onClick={() => handleAwardTender(bid.id)}
                            isLoading={isSubmitting}
                          >
                            Award Tender to this Bid
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}