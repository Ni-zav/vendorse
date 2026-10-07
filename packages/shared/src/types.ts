export type UserRole = 'ADMIN' | 'VENDOR' | 'BUYER' | 'REVIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type OrgType = 'BUSINESS' | 'GOVERNMENT' | 'NON_PROFIT';
export type TenderStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'UNDER_REVIEW'
  | 'AWARDED'
  | 'CANCELLED'
  | 'COMPLETED';
export type BidStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';
export type NotificationType =
  | 'TENDER_PUBLISHED'
  | 'BID_SUBMITTED'
  | 'BID_EVALUATED'
  | 'TENDER_AWARDED'
  | 'SYSTEM_NOTIFICATION';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orgId: string;
  organization: Organization;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  address: string;
  users: User[];
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenderDocument {
  id: string;
  tenderId: string;
  filePath: string;
  fileType: string;
  uploadedAt: Date;
}

export interface BidDocument {
  id: string;
  bidId: string;
  filePath: string;
  signatureHash: string;
  uploadedAt: Date;
}

export type Document = TenderDocument | BidDocument;

export interface Evaluation {
  id: string;
  bidId: string;
  bid: Bid;
  reviewerId: string;
  reviewer: User;
  criteria: string;
  score: number;
  notes?: string;
  recommendation?: 'ACCEPT' | 'REJECT' | 'REQUEST_CLARIFICATION';
  createdAt: Date;
  updatedAt: Date;
}

export type ProcurementRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_SOURCING'
  | 'CONTRACTED';

export type SourcingEventStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'CLOSED'
  | 'OPENED'
  | 'EVALUATING'
  | 'AWARDED'
  | 'CANCELLED';

export interface ProcurementRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedAmount: number | string;
  currency: string;
  desiredDate?: Date | string | null;
  status: ProcurementRequestStatus;
  submittedAt?: Date | string | null;
  approvedAt?: Date | string | null;
  project?: { id: string; status: string } | null;
}

export interface SourcingEventSummary {
  id: string;
  title: string;
  type: 'RFI' | 'RFQ' | 'RFP' | 'TENDER' | 'BAFO';
  status: SourcingEventStatus;
  version: number;
  closeAt: Date | string;
  project: { id: string; title: string; workspaceOrgId: string; currency: string };
  _count?: { invitations: number; responses: number; assignments: number };
  award?: { id: string; status: string } | null;
}

export interface Tender {
  id: string;
  title: string;
  description: string;
  budget: number | string;
  currency?: string;
  deadline: Date;
  status: TenderStatus;
  createdById: string;
  createdBy: User;
  documents: TenderDocument[];
  bids: Bid[];
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    bids: number;
  };
}

export interface Bid {
  id: string;
  tenderId: string;
  tender: Tender;
  submittedById: string;
  submittedBy: User;
  orgId: string;
  organization: Organization;
  status: BidStatus;
  documents: BidDocument[];
  evaluations: Evaluation[];
  submittedAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actionType: string;
  targetId: string;
  targetType: string;
  ipAddress: string;
  timestamp: Date;
}
