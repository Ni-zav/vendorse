'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, BidForm, TenderEvaluation } from '@vendorse/ui';
import { useAuth } from '@/app/contexts/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { formatCurrency, formatDate } from '@vendorse/shared';
import { TenderDetail } from './types';

export default function TenderDetailClient({ params }: { params: { id: string } }) {
  // ...rest of the component code...
}