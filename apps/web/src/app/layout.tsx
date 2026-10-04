import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientShell from './components/ClientShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Vendorse | Procurement Workspace',
    template: '%s | Vendorse',
  },
  description:
    'Role-aware tender, bid, and evaluation workspace for auditable procurement.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
