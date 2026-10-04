'use client';

import { AuthProvider } from '../contexts/AuthContext';
import AppLayout from './AppLayout';

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayout>{children}</AppLayout>
    </AuthProvider>
  );
}
