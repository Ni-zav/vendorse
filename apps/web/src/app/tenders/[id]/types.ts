export interface TenderDetail {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  documents: Array<{
    id: string;
    filePath: string;
    fileType: string;
    uploadedAt: string;
  }>;
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
    submittedAt: string;
    updatedAt: string;
    documents: Array<{
      id: string;
      filePath: string;
      signatureHash: string;
      uploadedAt: string;
    }>;
    evaluations: Array<{
      id: string;
      criteria: string;
      score: number;
      notes?: string;
      recommendation?: string;
      reviewer: {
        id: string;
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
