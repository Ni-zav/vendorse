import { Suspense } from 'react';
import type { Metadata } from 'next';
import UserDetailClient from './UserDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'User Details',
  description: 'View and edit user details',
};

export default async function UserDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <UserDetailClient params={resolvedParams} />
    </Suspense>
  );
}