import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  Asset,
  AssetListParams,
  PaginatedResponse,
  Category,
  Tag,
} from '../../core/models/asset.model';

@Injectable({ providedIn: 'root' })
export class MarketplaceService {
  private readonly api = inject(ApiService);

  getAssets(params?: AssetListParams): Observable<PaginatedResponse<Asset>> {
    return this.api.get<PaginatedResponse<Asset>>('/assets', params as Record<string, string | number | boolean | undefined>);
  }

  getAssetBySlug(slug: string): Observable<Asset> {
    return this.api.get<Asset>(`/assets/${slug}`);
  }

  getSimilarAssets(id: string): Observable<Asset[]> {
    return this.api.get<Asset[]>(`/assets/${id}/similar`);
  }

  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('/categories');
  }

  getTags(): Observable<Tag[]> {
    return this.api.get<Tag[]>('/tags');
  }

  requestDownload(assetId: string): Observable<{ signedUrl: string }> {
    return this.api.post<{ signedUrl: string }>(`/downloads/${assetId}`);
  }

  getDownloadHistory(page = 1): Observable<PaginatedResponse<{ assetId: string; downloadedAt: string }>> {
    return this.api.get(`/downloads/history`, { page });
  }

  getDownloadQuota(): Observable<{ dailyFreeUsed: number; dailyFreeLimit: number; dailyPremiumUsed: number; dailyPremiumLimit: number }> {
    return this.api.get('/downloads/quota');
  }
}
