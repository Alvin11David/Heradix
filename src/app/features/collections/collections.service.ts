import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/api/api.service';
import { Collection, CreateCollectionPayload } from '../../core/models/collection.model';
import { Asset } from '../../core/models/asset.model';

const MOCK_COLLECTIONS: Collection[] = [
  { id: 'safe-birth', userId: 'u1', name: 'Safe Birth Campaign', description: 'Campaign materials for safe birth awareness', isPublic: false, assetCount: 5, coverThumbnailUrl: '/assets/images/thumbnails/safebirth-1080.jpg', createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-06-20T14:30:00Z' },
  { id: 'easter-resources', userId: 'u1', name: 'Easter Resources', description: 'Easter-themed designs and resources', isPublic: true, assetCount: 8, coverThumbnailUrl: '/assets/images/thumbnails/5bab3098d48598d96d159989a821062d.jpg', createdAt: '2025-03-01T08:00:00Z', updatedAt: '2025-06-18T11:00:00Z' },
  { id: 'african-day', userId: 'u1', name: 'African Day', description: 'African heritage and culture designs', isPublic: true, assetCount: 4, coverThumbnailUrl: '/assets/images/thumbnails/African-Day.jpg', createdAt: '2025-02-20T12:00:00Z', updatedAt: '2025-06-15T09:00:00Z' },
  { id: 'education-schools', userId: 'u1', name: 'Education & Schools', description: 'Educational content and school materials', isPublic: false, assetCount: 4, coverThumbnailUrl: '/assets/images/thumbnails/P.7-Candidates.jpg', createdAt: '2025-04-10T07:00:00Z', updatedAt: '2025-06-10T16:00:00Z' },
  { id: 'business-cards', userId: 'u1', name: 'Business Cards', description: 'Professional business card templates', isPublic: true, assetCount: 4, coverThumbnailUrl: '/assets/images/thumbnails/Dr-JP-Business-cards.jpg', createdAt: '2025-01-05T09:00:00Z', updatedAt: '2025-06-22T13:00:00Z' },
  { id: 'motivational-quotes', userId: 'u1', name: 'Motivational Quotes', description: 'Inspirational quote designs', isPublic: true, assetCount: 4, coverThumbnailUrl: '/assets/images/thumbnails/Inspirations-Be-Sincere.jpg', createdAt: '2025-05-01T10:00:00Z', updatedAt: '2025-06-21T08:00:00Z' },
  { id: 'portraits-people', userId: 'u1', name: 'Portraits & People', description: 'Portrait photography and illustrations', isPublic: false, assetCount: 3, coverThumbnailUrl: '/assets/images/thumbnails/Coach-Paul.jpg', createdAt: '2025-02-14T11:00:00Z', updatedAt: '2025-06-19T15:00:00Z' },
  { id: 'apparel-merchandise', userId: 'u1', name: 'Apparel & Merchandise', description: 'T-shirt and merchandise designs', isPublic: true, assetCount: 2, coverThumbnailUrl: '/assets/images/thumbnails/T-shirt-both-sides-2.png', createdAt: '2025-06-01T06:00:00Z', updatedAt: '2025-06-23T10:00:00Z' },
];

const MOCK_ITEMS: Record<string, { id: string; name: string; thumbnail: string; slug: string }[]> = {
  'safe-birth': [
    { id: 'sb-1', name: 'Safe Birth - Main', thumbnail: '/assets/images/thumbnails/safebirth-1080.jpg', slug: 'safe-birth-main' },
    { id: 'sb-2', name: 'Safe Birth - Breathe', thumbnail: '/assets/images/thumbnails/safebirth-1080-breathe.jpg', slug: 'safe-birth-breathe' },
    { id: 'sb-3', name: 'Safe Birth - Left Side', thumbnail: '/assets/images/thumbnails/safebirth-1080-Left-side.jpg', slug: 'safe-birth-left' },
    { id: 'sb-4', name: 'Safe Birth - Campaign', thumbnail: '/assets/images/thumbnails/Safe-Birth-Awareness-CampaignArtboard-1-copy-2.png', slug: 'safe-birth-campaign' },
    { id: 'sb-5', name: 'Safe Birth - Alternative', thumbnail: '/assets/images/thumbnails/Safe-Birth-Awareness-CampaignArtboard-1-copy-3.png', slug: 'safe-birth-alt' },
  ],
  'easter-resources': [
    { id: 'er-1', name: 'Easter - Design 1', thumbnail: '/assets/images/thumbnails/5bab3098d48598d96d159989a821062d.jpg', slug: 'easter-design-1' },
    { id: 'er-2', name: 'Easter - Design 2', thumbnail: '/assets/images/thumbnails/916d081a3838f5ae2c67906d7c7ab7b9.jpg', slug: 'easter-design-2' },
    { id: 'er-3', name: 'Soar Away Easter', thumbnail: '/assets/images/thumbnails/SoarAway-Easter.jpg', slug: 'soar-away-easter' },
    { id: 'er-4', name: 'Image Gen 4', thumbnail: '/assets/images/thumbnails/image-gen-4.jpg', slug: 'image-gen-4' },
    { id: 'er-5', name: 'Easter - Theme 1', thumbnail: '/assets/images/thumbnails/5bab3098d48598d96d159989a821062d.jpg', slug: 'easter-theme-1' },
    { id: 'er-6', name: 'Easter - Theme 2', thumbnail: '/assets/images/thumbnails/916d081a3838f5ae2c67906d7c7ab7b9.jpg', slug: 'easter-theme-2' },
    { id: 'er-7', name: 'Easter - Theme 3', thumbnail: '/assets/images/thumbnails/SoarAway-Easter.jpg', slug: 'easter-theme-3' },
    { id: 'er-8', name: 'Easter - Theme 4', thumbnail: '/assets/images/thumbnails/image-gen-4.jpg', slug: 'easter-theme-4' },
  ],
  'african-day': [
    { id: 'ad-1', name: 'African Day', thumbnail: '/assets/images/thumbnails/African-Day.jpg', slug: 'african-day' },
    { id: 'ad-2', name: 'African Leaders', thumbnail: '/assets/images/thumbnails/african-Leaders.png', slug: 'african-leaders' },
    { id: 'ad-3', name: 'International Day 5', thumbnail: '/assets/images/thumbnails/International-Day5.png', slug: 'intl-day-5' },
    { id: 'ad-4', name: 'Soar Away Quotes', thumbnail: '/assets/images/thumbnails/SoarAway-quotes-4.png', slug: 'soar-away-quotes-4' },
  ],
  'education-schools': [
    { id: 'es-1', name: 'P.7 Candidates', thumbnail: '/assets/images/thumbnails/P.7-Candidates.jpg', slug: 'p7-candidates' },
    { id: 'es-2', name: 'S.6 Candidates', thumbnail: '/assets/images/thumbnails/S.6.Candidates-2.jpg', slug: 's6-candidates' },
    { id: 'es-3', name: 'Kisoro School', thumbnail: '/assets/images/thumbnails/Kisoro-2.jpg', slug: 'kisoro-school' },
    { id: 'es-4', name: 'Bombo Secondary', thumbnail: '/assets/images/thumbnails/Bombo-Sec-Thumbnail.png', slug: 'bombo-secondary' },
  ],
  'business-cards': [
    { id: 'bc-1', name: 'Dr. JP Business Cards', thumbnail: '/assets/images/thumbnails/Dr-JP-Business-cards.jpg', slug: 'dr-jp-cards' },
    { id: 'bc-2', name: 'Be Sincere Cards', thumbnail: '/assets/images/thumbnails/Inspirations-Be-Sincere.jpg', slug: 'be-sincere-cards' },
    { id: 'bc-3', name: 'Creative Design 2', thumbnail: '/assets/images/thumbnails/Inspirations-creative2.jpg', slug: 'creative-design-2' },
    { id: 'bc-4', name: 'Denis Cards', thumbnail: '/assets/images/thumbnails/Denis.jpg', slug: 'denis-cards' },
  ],
  'motivational-quotes': [
    { id: 'mq-1', name: 'Be Sincere Quote', thumbnail: '/assets/images/thumbnails/Inspirations-Be-Sincere.jpg', slug: 'be-sincere-quote' },
    { id: 'mq-2', name: 'Soar Away Quote 4', thumbnail: '/assets/images/thumbnails/SoarAway-quotes-4.png', slug: 'soar-away-quote-4' },
    { id: 'mq-3', name: 'Happy New Month', thumbnail: '/assets/images/thumbnails/Happy-new-month.png', slug: 'happy-new-month' },
    { id: 'mq-4', name: 'Creative Quote', thumbnail: '/assets/images/thumbnails/Inspirations-creative2.jpg', slug: 'creative-quote' },
  ],
  'portraits-people': [
    { id: 'pp-1', name: 'Coach Paul', thumbnail: '/assets/images/thumbnails/Coach-Paul.jpg', slug: 'coach-paul' },
    { id: 'pp-2', name: 'Denis Portrait', thumbnail: '/assets/images/thumbnails/Denis.jpg', slug: 'denis-portrait' },
    { id: 'pp-3', name: 'Kisoro Portrait', thumbnail: '/assets/images/thumbnails/Kisoro-2.jpg', slug: 'kisoro-portrait' },
  ],
  'apparel-merchandise': [
    { id: 'am-1', name: 'T-Shirt Design', thumbnail: '/assets/images/thumbnails/T-shirt-both-sides-2.png', slug: 'tshirt-design' },
    { id: 'am-2', name: 'Apparel Variant', thumbnail: '/assets/images/thumbnails/Safe-Birth-Awareness-CampaignArtboard-1-copy-3.png', slug: 'apparel-variant' },
  ],
};

const MOCK_COLLECTION_ASSETS: Record<string, string[]> = {
  'safe-birth': ['sb-1', 'sb-2', 'sb-3', 'sb-4', 'sb-5'],
  'easter-resources': ['er-1', 'er-2', 'er-3', 'er-4', 'er-5', 'er-6', 'er-7', 'er-8'],
  'african-day': ['ad-1', 'ad-2', 'ad-3', 'ad-4'],
  'education-schools': ['es-1', 'es-2', 'es-3', 'es-4'],
  'business-cards': ['bc-1', 'bc-2', 'bc-3', 'bc-4'],
  'motivational-quotes': ['mq-1', 'mq-2', 'mq-3', 'mq-4'],
  'portraits-people': ['pp-1', 'pp-2', 'pp-3'],
  'apparel-merchandise': ['am-1', 'am-2'],
};

function buildAssetToCollections(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const [colId, assetIds] of Object.entries(MOCK_COLLECTION_ASSETS)) {
    for (const assetId of assetIds) {
      const existing = map.get(assetId) ?? [];
      existing.push(colId);
      map.set(assetId, existing);
    }
  }
  return map;
}

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private readonly api = inject(ApiService);

  readonly collections = signal<Collection[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private _nextCollectionId = 100;
  private _assetCollections = buildAssetToCollections();
  private _collectionItems = new Map<string, { id: string; name: string; thumbnail: string; slug: string }[]>(
    Object.entries(MOCK_ITEMS).map(([k, v]) => [k, [...v]])
  );

  loadCollections(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<Collection[]>('/collections').pipe(
      catchError(() => {
        this.collections.set(MOCK_COLLECTIONS);
        this.loading.set(false);
        return of(MOCK_COLLECTIONS);
      })
    ).subscribe({
      next: (cols) => { this.collections.set(cols); this.loading.set(false); },
      error: () => { this.collections.set(MOCK_COLLECTIONS); this.loading.set(false); },
    });
  }

  createCollection(payload: CreateCollectionPayload): Observable<Collection> {
    const newCol: Collection = {
      id: `col-${++this._nextCollectionId}`,
      userId: 'u1',
      name: payload.name,
      description: payload.description,
      isPublic: payload.isPublic ?? false,
      assetCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.api.post<Collection>('/collections', payload).pipe(
      catchError(() => {
        this.collections.update(list => [newCol, ...list]);
        this._collectionItems.set(newCol.id, []);
        return of(newCol);
      })
    );
  }

  addAsset(collectionId: string, assetId: string): Observable<void> {
    return this.api.post<void>(`/collections/${collectionId}/assets`, { assetId }).pipe(
      catchError(() => {
        const existing = this._assetCollections.get(assetId) ?? [];
        if (!existing.includes(collectionId)) {
          this._assetCollections.set(assetId, [...existing, collectionId]);
          this.collections.update(list =>
            list.map(c => c.id === collectionId ? { ...c, assetCount: c.assetCount + 1 } : c)
          );
        }
        return of(void 0);
      })
    );
  }

  removeAsset(collectionId: string, assetId: string): Observable<void> {
    return this.api.delete<void>(`/collections/${collectionId}/assets/${assetId}`).pipe(
      catchError(() => {
        const existing = this._assetCollections.get(assetId) ?? [];
        this._assetCollections.set(assetId, existing.filter(id => id !== collectionId));
        this.collections.update(list =>
          list.map(c => c.id === collectionId ? { ...c, assetCount: Math.max(0, c.assetCount - 1) } : c)
        );
        return of(void 0);
      })
    );
  }

  collectionIdsForAsset(assetId: string): string[] {
    return this._assetCollections.get(assetId) ?? [];
  }

  isAssetInCollection(collectionId: string, assetId: string): boolean {
    return (this._assetCollections.get(assetId) ?? []).includes(collectionId);
  }

  getCollection(id: string): Collection | undefined {
    return this.collections().find(c => c.id === id);
  }

  getCollectionItems(id: string): Observable<{ id: string; name: string; thumbnail: string; slug: string }[]> {
    return this.api.get<{ id: string; name: string; thumbnail: string; slug: string }[]>(`/collections/${id}`).pipe(
      catchError(() => of(this._collectionItems.get(id) ?? []))
    );
  }

  deleteCollection(id: string): Observable<void> {
    return this.api.delete<void>(`/collections/${id}`).pipe(
      catchError(() => {
        this.collections.update(list => list.filter(c => c.id !== id));
        this._collectionItems.delete(id);
        return of(void 0);
      })
    );
  }
}
