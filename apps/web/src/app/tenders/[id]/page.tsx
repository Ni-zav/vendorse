import { Suspense } from 'react';
import type { Metadata } from 'next';
import TenderDetailClient from './TenderDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Tender Details',
  description: 'View tender details and submit bids',
};

export default async function TenderDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <TenderDetailClient params={resolvedParams} />
    </Suspense>
  );
}