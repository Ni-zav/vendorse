import { Tender, Bid, Document, Evaluation } from '@vendorse/shared';

// Convert dates to string format for the API response
type StringDates<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K];
};

export interface TenderDetail {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  deadline: string; // Date as string
  createdAt: string; // Date as string
  updatedAt: string; // Date as string
  createdBy: {
    id: string;
    name: string;
    email: string;
    organization: {
      name: string;
    };
  };
  bids: Array<{
    id: string;
    status: string;
    createdAt: string; // Date as string
    updatedAt: string; // Date as string
    documents: Array<Pick<Document, 'id' | 'filePath'>>;
    evaluations: Array<{
      id: string;
      criteria: string;
      score: number;
      notes?: string;
      reviewer: {
        name: string;
      };
    }>;
    submittedBy: {
      id: string;
      name: string;
      organization: {
        name: string;
      };
    };
  }>;
}