export type SubmissionStatus = 'SUBMISSION_PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type AffiliateApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Affiliate {
  id: string;
  userId: string;
  portfolioUrl?: string;
  bio?: string;
  applicationStatus: AffiliateApplicationStatus;
  totalEarnings: number;
  pendingPayout: number;
  stripeConnectAccountId?: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  affiliateId: string;
  title: string;
  description?: string;
  format: string;
  fileUrl: string;
  previewUrl: string;
  status: SubmissionStatus;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  affiliateId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  paidAt?: string;
  createdAt: string;
}

export interface AffiliateApplicationPayload {
  portfolioUrl?: string;
  bio?: string;
}
