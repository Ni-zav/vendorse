'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TenderCard, Button } from '@vendorse/ui';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Tender, TenderStatus } from '@vendorse/shared';

interface DashboardStats {
  totalTenders: number;
  activeTenders: number;
  submittedBids: number;
  pendingEvaluations: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        // Fetch data in parallel
        const [tendersResponse, statsResponse] = await Promise.all([
          fetch('/api/tenders?limit=6', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        if (!tendersResponse.ok || !statsResponse.ok) {
          const tendersError = !tendersResponse.ok ? await tendersResponse.text() : '';
          const statsError = !statsResponse.ok ? await statsResponse.text() : '';
          throw new Error(
            'Failed to load dashboard data: ' + 
            [tendersError, statsError].filter(Boolean).join(', ')
          );
        }
        
        const [tendersData, statsData] = await Promise.all([
          tendersResponse.json(),
          statsResponse.json()
        ]);

        setTenders(tendersData.tenders);
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const renderRoleSpecificActions = () => {
    if (!user) return null;

    switch (user.role) {
      case 'ADMIN':
      case 'BUYER':
        return (
          <div className="flex space-x-4">
            <Button onClick={() => router.push('/tenders/new')}>
              Create New Tender
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/tenders')}
            >
              View All Tenders
            </Button>
          </div>
        );
      
      case 'VENDOR':
        return (
          <div className="flex space-x-4">
            <Button onClick={() => router.push('/bids')}>
              View My Bids
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/tenders')}
            >
              Browse Tenders
            </Button>
          </div>
        );
      
      case 'REVIEWER':
        return (
          <Button onClick={() => router.push('/evaluations')}>
            View Pending Evaluations
          </Button>
        );

      default:
        return null;
    }
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {user?.role === 'BUYER' && (
          <>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Tenders
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.totalTenders}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Tenders
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.activeTenders}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {user?.role === 'VENDOR' && (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Submitted Bids
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats.submittedBids}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'REVIEWER' && (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Evaluations
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats.pendingEvaluations}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Welcome, {user?.name || user?.email}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {user?.organization?.name && `${user.organization.name} - `}{user?.role}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            {renderRoleSpecificActions()}
          </div>
        </div>

        {renderStats()}

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {user?.role === 'VENDOR' ? 'Available Tenders' : 'Recent Tenders'}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tenders.map((tender) => (
              <TenderCard
                key={tender.id}
                {...tender}
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
      </div>
    </ProtectedRoute>
  );
}