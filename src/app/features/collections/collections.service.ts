import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Collection, CreateCollectionPayload } from '../../core/models/collection.model';
import { Asset } from '../../core/models/asset.model';

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private readonly api = inject(ApiService);

  createCollection(payload: CreateCollectionPayload): Observable<Collection> {
    return this.api.post<Collection>('/collections', payload);
  }

  getCollections(): Observable<Collection[]> {
    return this.api.get<Collection[]>('/collections');
  }

  getCollectionAssets(id: string): Observable<Asset[]> {
    return this.api.get<Asset[]>(`/collections/${id}`);
  }

  addAsset(collectionId: string, assetId: string): Observable<void> {
    return this.api.post<void>(`/collections/${collectionId}/assets`, { assetId });
  }

  removeAsset(collectionId: string, assetId: string): Observable<void> {
    return this.api.delete<void>(`/collections/${collectionId}/assets/${assetId}`);
  }

  deleteCollection(id: string): Observable<void> {
    return this.api.delete<void>(`/collections/${id}`);
  }
}
