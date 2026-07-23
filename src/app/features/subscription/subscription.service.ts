import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Plan, Subscription, CheckoutPayload, MobileMoneyPayload } from '../../core/models/subscription.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly api = inject(ApiService);

  getPlans(): Observable<Plan[]> {
    return this.api.get<Plan[]>('/plans');
  }

  getMySubscription(): Observable<Subscription> {
    return this.api.get<Subscription>('/subscriptions/me');
  }

  checkout(payload: CheckoutPayload): Observable<{ checkoutUrl: string }> {
    const path = payload.provider === 'paypal'
      ? '/subscriptions/checkout/paypal'
      : '/subscriptions/checkout';
    return this.api.post<{ checkoutUrl: string }>(path, payload);
  }

  cancelSubscription(): Observable<void> {
    return this.api.post<void>('/subscriptions/cancel');
  }

  reactivateSubscription(): Observable<void> {
    return this.api.post<void>('/subscriptions/reactivate');
  }

  openCustomerPortal(): Observable<{ portalUrl: string }> {
    return this.api.post<{ portalUrl: string }>('/subscriptions/portal');
  }

  initiateMobileMoney(payload: MobileMoneyPayload): Observable<{ reference: string }> {
    return this.api.post<{ reference: string }>('/payments/mobile-money/initiate', payload);
  }

  pollMobileMoneyStatus(ref: string): Observable<{ status: string }> {
    return this.api.get<{ status: string }>(`/payments/mobile-money/${ref}`);
  }
}
