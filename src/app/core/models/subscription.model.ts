export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  dailyFreeDl: number | null;
  dailyPremiumDl: number | null;
  editorAccess: 'LIMITED' | 'FULL';
  academyAccess: 'PREVIEW' | 'FULL';
  collectionsAccess: boolean;
  workspaceSeats: number;
  stripePriceId?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan?: Plan;
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
}

export interface DownloadQuota {
  dailyFreeUsed: number;
  dailyFreeLimit: number | null;
  dailyPremiumUsed: number;
  dailyPremiumLimit: number | null;
  monthlyTotal: number;
  resetDate: string;
}

export interface CheckoutPayload {
  planId: string;
  provider: 'stripe' | 'paypal';
  successUrl?: string;
  cancelUrl?: string;
}

export interface MobileMoneyPayload {
  amount: number;
  currency: string;
  provider: 'mtn' | 'airtel';
  phoneNumber: string;
  orderId: string;
}
