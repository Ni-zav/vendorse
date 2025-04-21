export type UserRole = 'ADMIN' | 'VENDOR' | 'BUYER' | 'REVIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type OrgType = 'BUSINESS' | 'GOVERNMENT' | 'NON_PROFIT';
export type TenderStatus = 'DRAFT' | 'PUBLISHED' | 'UNDER_REVIEW' | 'AWARDED' | 'CANCELLED' | 'COMPLETED';
export type BidStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
export type NotificationType = 'TENDER_PUBLISHED' | 'BID_SUBMITTED' | 'BID_EVALUATED' | 'TENDER_AWARDED' | 'SYSTEM_NOTIFICATION';

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

export interface Tender {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: Date;
  status: TenderStatus;
  createdById: string;
  createdBy: User;
  documents: Document[];
  bids: Bid[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Bid {
  id: string;
  tenderId: string;
  tender: Tender;
  submittedById: string;
  submittedBy: User;
  orgId: string;
  organization: Organization;
  amount: number;
  description: string;
  status: BidStatus;
  documents: Document[];
  evaluations: Evaluation[];
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  signatureHash?: string;
  uploadedById: string;
  uploadedBy: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Evaluation {
  id: string;
  bidId: string;
  bid: Bid;
  reviewerId: string;
  reviewer: User;
  criteria: string;
  score: number;
  notes?: string;
  createdAt: Date;
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