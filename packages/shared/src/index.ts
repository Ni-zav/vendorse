import { UserRole } from './types';
export * from './types';

export const isValidRole = (role: unknown): role is UserRole => {
  return ['ADMIN', 'VENDOR', 'BUYER', 'REVIEWER'].includes(role as string);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateFileKey = (fileName: string, userId: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
  return `${userId}/${timestamp}-${randomString}-${sanitizedFileName}`;
};

export const getFileTypeFromName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
};

export const generateBidId = (tenderId: string, orgId: string): string => {
  return `BID-${tenderId.slice(0, 8)}-${orgId.slice(0, 8)}-${Date.now().toString(36)}`;
};

export const calculateBidScore = (scores: Array<{ score: number, weight?: number }>): number => {
  const totalWeight = scores.reduce((sum, { weight }) => sum + (weight ?? 1), 0);
  return scores.reduce((sum, { score, weight }) => sum + score * (weight ?? 1), 0) / totalWeight;
};