import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Affiliate, Submission, Payout, AffiliateApplicationPayload } from '../../core/models/affiliate.model';

@Injectable({ providedIn: 'root' })
export class AffiliateService {
  private readonly api = inject(ApiService);

  apply(payload: AffiliateApplicationPayload): Observable<Affiliate> {
    return this.api.post<Affiliate>('/affiliate/apply', payload);
  }

  getProfile(): Observable<Affiliate> {
    return this.api.get<Affiliate>('/affiliate/me');
  }

  submitAsset(form: FormData): Observable<Submission> {
    return this.api.postFormData<Submission>('/affiliate/submissions', form);
  }

  getSubmissions(): Observable<Submission[]> {
    return this.api.get<Submission[]>('/affiliate/submissions');
  }

  getPayouts(): Observable<Payout[]> {
    return this.api.get<Payout[]>('/affiliate/payouts');
  }
}
