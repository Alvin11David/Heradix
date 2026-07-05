import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Asset } from '../../core/models/asset.model';
import { User } from '../../core/models/user.model';
import { Submission } from '../../core/models/affiliate.model';
import { PaginatedResponse } from '../../core/models/asset.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  getUsers(page = 1): Observable<PaginatedResponse<User>> {
    return this.api.get<PaginatedResponse<User>>('/admin/users', { page });
  }

  createAsset(form: FormData): Observable<Asset> {
    return this.api.postFormData<Asset>('/assets', form);
  }

  updateAsset(id: string, payload: Partial<Asset>): Observable<Asset> {
    return this.api.patch<Asset>(`/assets/${id}`, payload);
  }

  deleteAsset(id: string): Observable<void> {
    return this.api.delete<void>(`/assets/${id}`);
  }

  reviewSubmission(id: string, action: 'APPROVED' | 'REJECTED', note?: string): Observable<Submission> {
    return this.api.patch<Submission>(`/admin/submissions/${id}`, { action, note });
  }

  getPendingSubmissions(): Observable<Submission[]> {
    return this.api.get<Submission[]>('/admin/submissions?status=UNDER_REVIEW');
  }
}
