import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import {
  map, catchError, timeout, shareReplay, tap,
} from 'rxjs/operators';
import {
  MockupAsset,
} from '../models/mockup.model';

export type { MockupWithSource } from '../models/mockup.model';
import { environment } from '../../../environments/environment';
import { Result, success, failure } from '../lib/result';
import { ApiError, AppError, toAppError } from '../lib/errors';
import { mapMkuMockupList } from '../adapters/mockuuups.adapter';
import { mapMmMockupList } from '../adapters/mediamodifier.adapter';

const API_TIMEOUT = 15000;
const MKU_PAGES = 4;
const MKU_PER_PAGE = 50;

interface CacheEntry {
  data: MockupAsset[];
  fetchedAt: number;
  staleAt: number;
  expiresAt: number;
}

interface MkuResponse {
  total: number;
  pages: number;
  mockups: unknown[];
}

const DEFAULT_TTL = 5 * 60 * 1000;
const STALE_TTL = 30 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class MockupsRepository {
  private readonly http = inject(HttpClient);

  private cache: CacheEntry | null = null;
  private inflight: Observable<Result<MockupAsset[]>> | null = null;

  readonly loading = signal(false);

  fetchAll(): Observable<Result<MockupAsset[]>> {
    if (this.cache && Date.now() < this.cache.expiresAt) {
      if (Date.now() > this.cache.staleAt) this.backgroundRefresh();
      return of(success(this.cache.data));
    }

    if (this.inflight) return this.inflight;

    const request = this.loadFromApis().pipe(
      tap((result) => {
        if (result.ok) {
          const now = Date.now();
          this.cache = { data: result.value, fetchedAt: now, staleAt: now + DEFAULT_TTL, expiresAt: now + STALE_TTL };
        }
        this.inflight = null;
      }),
      shareReplay(1),
    );
    this.inflight = request;
    return request;
  }

  refresh(): Observable<Result<MockupAsset[]>> {
    this.cache = null;
    return this.fetchAll();
  }

  private backgroundRefresh(): void {
    this.loadFromApis().pipe(
      tap((result) => {
        if (result.ok) {
          const now = Date.now();
          this.cache = { data: result.value, fetchedAt: now, staleAt: now + DEFAULT_TTL, expiresAt: now + STALE_TTL };
        }
      }),
    ).subscribe();
  }

  private loadFromApis(): Observable<Result<MockupAsset[]>> {
    this.loading.set(true);

    const config = environment.apis?.mockups;
    const mockuuupsUrl = config?.mockuuupsUrl ?? '/mockuuups-api/mockups';
    const mediamodifierUrl = config?.mediamodifierUrl ?? '/mediamodifier-api/mockups';

    const mockuuups$ = this.fetchMkuPages(mockuuupsUrl).pipe(
      timeout(API_TIMEOUT * MKU_PAGES),
      map(all => mapMkuMockupList(all)),
      catchError((err) => {
        console.warn('[MockupsRepository] Mockuuups API failed', err);
        return of([] as MockupAsset[]);
      }),
    );

    const mediamodifier$ = this.http.get<unknown>(mediamodifierUrl, {
      params: new HttpParams().set('page', '1'),
    }).pipe(
      timeout(API_TIMEOUT),
      map(raw => mapMmMockupList(raw)),
      catchError((err) => {
        console.warn('[MockupsRepository] MediaModifier API failed', err);
        return of([] as MockupAsset[]);
      }),
    );

    return forkJoin([mockuuups$, mediamodifier$]).pipe(
      map(([mockuuups, mediamodifier]) => {
        this.loading.set(false);
        const combined = [...mockuuups, ...mediamodifier];
        const enriched = this.enrich(combined);
        if (!enriched.length) return failure(new ApiError('Both mockup APIs returned empty', 502, 'NO_MOCKUPS'));
        return success(enriched);
      }),
      catchError((err) => {
        this.loading.set(false);
        return throwError(() => toAppError(err));
      }),
    );
  }

  private fetchMkuPages(url: string): Observable<unknown[]> {
    const page$ = (page: number) =>
      this.http.get<MkuResponse>(url, {
        params: new HttpParams().set('limit', String(MKU_PER_PAGE)).set('page', String(page)),
      }).pipe(
        timeout(API_TIMEOUT),
        map(res => res.mockups ?? []),
        catchError(() => of([] as unknown[])),
      );

    const pages$ = Array.from({ length: MKU_PAGES }, (_, i) => page$(i + 1));
    return forkJoin(pages$).pipe(
      map(batches => batches.flat()),
    );
  }

  private enrich(assets: MockupAsset[]): MockupAsset[] {
    const sorted = [...assets].sort((a, b) => a.name.localeCompare(b.name));
    return sorted.map((a, i) => ({
      ...a,
      isNew: i < 10,
      isStaffPick: i >= 10 && i < 15,
      isEditorsChoice: i >= 15 && i < 18,
      isFeatured: i < 6,
      isTrending: i >= 6 && i < 18,
      downloads: Math.floor(Math.random() * 5000),
      likes: Math.floor(Math.random() * 500),
      views: Math.floor(Math.random() * 50000),
      rating: +(2 + Math.random() * 3).toFixed(1),
      ratingCount: Math.floor(Math.random() * 200),
      comments: Math.floor(Math.random() * 50),
    }));
  }
}
