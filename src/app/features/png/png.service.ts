import { Injectable, computed, inject, signal } from '@angular/core';
import {
  PngAsset, PngCategory, PngCollection, PngFilterState,
  PngOrientation, PngViewMode,
} from '../../core/models/png.model';
import { PNG_CATEGORIES, PNG_LIBRARY } from './png-data';
import { PixabayService } from '../../core/api/pixabay.service';
import { PexelsService } from '../../core/api/pexels.service';
import { OpenverseService } from '../../core/api/openverse.service';

const FAVORITES_KEY   = 'amx_png_favorites';
const COLLECTIONS_KEY = 'amx_png_collections';
const RECENT_KEY      = 'amx_png_recent';
const QUOTA_KEY        = 'amx_png_daily_quota';
const CONTRIBUTOR_KEY  = 'amx_png_contributions';
const SEARCH_HISTORY_KEY = 'amx_png_search_history';
const MAX_SEARCH_HISTORY = 10;

export const DAILY_FREE_DOWNLOAD_LIMIT = 15;

interface QuotaState { date: string; count: number; }

export interface ContributorSubmission {
  id: string;
  title: string;
  category: string;
  tags: string[];
  previewUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

function todayKey(): string { return new Date().toISOString().slice(0, 10); }

export const DEFAULT_PNG_FILTERS: PngFilterState = {
  query:        '',
  categoryId:   null,
  license:      'all',
  sort:         'popular',
  favoritesOnly: false,
  style:        null,
  hasPeople:    'all',
  colorTone:    null,
  resolution:   'all',
  dateAdded:    'all',
  orientation:  'all',
};

function getOrientation(w: number, h: number): PngOrientation {
  const ratio = w / h;
  if (ratio > 1.15) return 'landscape';
  if (ratio < 0.87) return 'portrait';
  return 'square';
}

function matchesDateFilter(createdAt: string, dateAdded: string): boolean {
  if (dateAdded === 'all') return true;
  const now    = Date.now();
  const ts     = new Date(createdAt).getTime();
  const diff   = now - ts;
  const DAY    = 86400000;
  if (dateAdded === 'today')  return diff < DAY;
  if (dateAdded === 'week')   return diff < 7  * DAY;
  if (dateAdded === 'month')  return diff < 30 * DAY;
  return true;
}

@Injectable({ providedIn: 'root' })
export class PngService {
  readonly categories: PngCategory[] = PNG_CATEGORIES;

  private readonly pixabay = inject(PixabayService);
  private readonly pexels = inject(PexelsService);
  private readonly openverse = inject(OpenverseService);

  private readonly curatedPicks = signal<PngAsset[]>([]);

  constructor() {
    this.fetchCuratedPicks();
  }

  readonly apiResults   = signal<PngAsset[]>([]);
  readonly apiTotal     = signal(0);
  readonly apiPage      = signal(1);
  readonly apiPageCount = signal(0);
  readonly loading      = signal(false);
  readonly error        = signal<string | null>(null);

  readonly filters     = signal<PngFilterState>({ ...DEFAULT_PNG_FILTERS });
  readonly favorites   = signal<Set<string>>(this.loadFavorites());
  readonly collections = signal<PngCollection[]>(this.loadCollections());
  readonly recentIds   = signal<string[]>(this.loadRecent());

  readonly searchHistory = signal<string[]>(this.loadSearchHistory());
  readonly viewMode    = signal<PngViewMode>('masonry');
  readonly quota        = signal<QuotaState>(this.loadQuota());
  readonly contributions = signal<ContributorSubmission[]>(this.loadContributions());

  readonly freeDownloadsRemaining = computed(() => {
    const q = this.quota();
    const usedToday = q.date === todayKey() ? q.count : 0;
    return Math.max(0, DAILY_FREE_DOWNLOAD_LIMIT - usedToday);
  });

  readonly editorsPicks = computed<PngAsset[]>(() => {
    const curated = this.curatedPicks();
    if (curated.length > 0) return curated;

    const local = PNG_LIBRARY;
    const byCategory = new Map<string, PngAsset>();
    for (const p of local) {
      const score = p.likes * 3 + p.downloads;
      const cur = byCategory.get(p.category);
      if (!cur || score > (cur.likes * 3 + cur.downloads)) byCategory.set(p.category, p);
    }
    return [...byCategory.values()].sort((a, b) => (b.likes * 3 + b.downloads) - (a.likes * 3 + a.downloads));
  });

  readonly totalCount = computed(() => Math.max(this.apiTotal(), PNG_LIBRARY.length));

  readonly library = computed<PngAsset[]>(() => {
    const api = this.apiResults();
    return api.length > 0 ? api : PNG_LIBRARY;
  });

  readonly filtered = computed<PngAsset[]>(() => {
    const f    = this.filters();
    const favs = this.favorites();
    const q    = f.query.trim().toLowerCase();
    const src  = this.library();

    let list = src.filter((png) => {
      if (f.favoritesOnly && !favs.has(png.id)) return false;
      if (f.categoryId && png.category !== f.categoryId) return false;
      if (f.license === 'free'    && png.isPremium)  return false;
      if (f.license === 'premium' && !png.isPremium) return false;
      if (f.style     && png.style     !== f.style)          return false;
      if (f.colorTone && png.colorTone !== f.colorTone)      return false;
      if (f.resolution !== 'all' && png.resolution !== f.resolution) return false;
      if (f.hasPeople === 'yes' && !png.hasPeople)  return false;
      if (f.hasPeople === 'no'  && png.hasPeople)   return false;
      if (f.orientation !== 'all') {
        const orient = getOrientation(png.width, png.height);
        if (orient !== f.orientation) return false;
      }
      if (!matchesDateFilter(png.createdAt, f.dateAdded)) return false;
      if (q && png.provider !== 'pixabay' && png.provider !== 'pexels' && png.provider !== 'openverse') {
        const haystack = `${png.name} ${png.tags.join(' ')} ${png.categoryLabel}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (f.sort === 'newest')    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (f.sort === 'downloads') return b.downloads - a.downloads;
      if (f.sort === 'views')     return b.views - a.views;
      return (b.likes * 3 + b.downloads) - (a.likes * 3 + a.downloads);
    });

    return list;
  });

  readonly activeFilterCount = computed(() => {
    const f = this.filters();
    return (
      (f.categoryId    ? 1 : 0) +
      (f.license !== 'all'  ? 1 : 0) +
      (f.favoritesOnly ? 1 : 0) +
      (f.style         ? 1 : 0) +
      (f.colorTone     ? 1 : 0) +
      (f.resolution !== 'all' ? 1 : 0) +
      (f.hasPeople !== 'all'  ? 1 : 0) +
      (f.dateAdded !== 'all'  ? 1 : 0) +
      (f.orientation !== 'all'? 1 : 0)
    );
  });

  readonly recentAssets = computed<PngAsset[]>(() =>
    this.recentIds()
      .map((id) => this.byIdForRecent(id))
      .filter((p): p is PngAsset => !!p)
  );

  private byIdForRecent(id: string): PngAsset | undefined {
    return this.library().find((p) => p.id === id);
  }

  private async fetchCuratedPicks(): Promise<void> {
    try {
      const [illustrations, objects] = await Promise.all([
        this.pixabay.search({
          q: 'clipart icon vector illustration isolated transparent',
          image_type: 'illustration',
          per_page: 16,
          safesearch: true,
          editors_choice: true,
        }),
        this.pixabay.search({
          q: 'isolated object cutout white background',
          per_page: 16,
          safesearch: true,
          editors_choice: true,
        }),
      ]);
      const merged = [...(illustrations.assets ?? []), ...(objects.assets ?? [])];
      if (merged.length > 0) this.curatedPicks.set(merged);
    } catch { }
  }

  private randomPage(max: number): number {
    return Math.max(1, Math.floor(Math.random() * max) + 1);
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async search(page?: number): Promise<void> {
    const f = this.filters();
    const pxParams = this.pixabay.buildSearchParams(f);
    const pxlParams = this.pexels.buildSearchParams(f);
    const ovParams = this.openverse.buildSearchParams(f);
    const pg = page ?? this.randomPage(15);

    this.loading.set(true);
    try {
      const [pixabayResult, pexelsResult, openverseResult] = await Promise.allSettled([
        this.pixabay.search({ ...pxParams, page: pg, per_page: 12, safesearch: true }),
        this.pexels.search({ ...pxlParams, page: pg, per_page: 12 }),
        this.openverse.search({ ...ovParams, page: pg, page_size: 12 }),
      ]);

      const all: PngAsset[] = [];
      let total = 0;
      const errors: string[] = [];

      if (pixabayResult.status === 'fulfilled') {
        all.push(...pixabayResult.value.assets);
        total += pixabayResult.value.total;
      } else {
        errors.push('Pixabay: ' + (pixabayResult.reason?.message ?? 'failed'));
      }

      if (pexelsResult.status === 'fulfilled') {
        all.push(...pexelsResult.value.assets);
        total += pexelsResult.value.total;
      } else {
        errors.push('Pexels: ' + (pexelsResult.reason?.message ?? 'failed'));
      }

      if (openverseResult.status === 'fulfilled') {
        all.push(...openverseResult.value.assets);
        total += openverseResult.value.total;
      } else {
        errors.push('Openverse: ' + (openverseResult.reason?.message ?? 'failed'));
      }

      this.apiResults.set(this.shuffle(all));
      this.apiTotal.set(total);
      this.apiPage.set(pg);
      this.error.set(errors.length > 0 ? errors.join('; ') : null);
    } catch {
      this.error.set('Failed to fetch images');
      this.apiResults.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  updateFilters(patch: Partial<PngFilterState>): void {
    this.filters.update((f) => ({ ...f, ...patch }));
  }

  clearFilters(): void {
    this.filters.set({ ...DEFAULT_PNG_FILTERS });
  }

  setQuery(query: string): void {
    const prev = this.filters().query;
    this.updateFilters({ query });
    if (query.trim() !== prev.trim()) this.search();
  }
  setCategory(categoryId: string | null): void {
    this.updateFilters({ categoryId: this.filters().categoryId === categoryId ? null : categoryId });
    this.search();
  }
  setLicense(license: PngFilterState['license']): void { this.updateFilters({ license }); }
  setSort(sort: PngFilterState['sort']): void { this.updateFilters({ sort }); }
  setStyle(style: PngFilterState['style']): void {
    this.updateFilters({ style: this.filters().style === style ? null : style });
  }
  setColorTone(colorTone: PngFilterState['colorTone']): void {
    this.updateFilters({ colorTone: this.filters().colorTone === colorTone ? null : colorTone });
  }
  setResolution(resolution: PngFilterState['resolution']): void { this.updateFilters({ resolution }); }
  setHasPeople(hasPeople: PngFilterState['hasPeople']): void { this.updateFilters({ hasPeople }); }
  setDateAdded(dateAdded: PngFilterState['dateAdded']): void { this.updateFilters({ dateAdded }); }
  setOrientation(orientation: PngFilterState['orientation']): void { this.updateFilters({ orientation }); }
  toggleFavoritesOnly(): void { this.updateFilters({ favoritesOnly: !this.filters().favoritesOnly }); }

  toggleFavorite(id: string): void {
    const next = new Set(this.favorites());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.favorites.set(next);
    this.saveFavorites(next);
  }
  isFavorite(id: string): boolean { return this.favorites().has(id); }

  setViewMode(mode: PngViewMode): void { this.viewMode.set(mode); }

  trackRecent(id: string): void {
    const next = [id, ...this.recentIds().filter((x) => x !== id)].slice(0, 20);
    this.recentIds.set(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { }
  }

  trackSearch(query: string): void {
    const term = query.trim();
    if (term.length < 2) return;
    const next = [term, ...this.searchHistory().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX_SEARCH_HISTORY);
    this.searchHistory.set(next);
    try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)); } catch { }
  }

  removeSearchHistoryItem(term: string): void {
    const next = this.searchHistory().filter((t) => t !== term);
    this.searchHistory.set(next);
    try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)); } catch { }
  }

  clearSearchHistory(): void {
    this.searchHistory.set([]);
    try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch { }
  }

  relatedTags(list: PngAsset[], excludeQuery: string, limit = 16): string[] {
    const excl = excludeQuery.trim().toLowerCase();
    const counts = new Map<string, number>();
    for (const png of list) {
      for (const tag of png.tags) {
        if (tag.toLowerCase() === excl) continue;
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  registerFreeDownload(): void {
    const today = todayKey();
    const cur   = this.quota();
    const next: QuotaState = cur.date === today ? { date: today, count: cur.count + 1 } : { date: today, count: 1 };
    this.quota.set(next);
    try { localStorage.setItem(QUOTA_KEY, JSON.stringify(next)); } catch { }
  }

  submitContribution(input: { title: string; category: string; tags: string[]; previewUrl: string }): ContributorSubmission {
    const sub: ContributorSubmission = {
      id: `sub-${Date.now()}`,
      title: input.title,
      category: input.category,
      tags: input.tags,
      previewUrl: input.previewUrl,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    const next = [sub, ...this.contributions()];
    this.contributions.set(next);
    try { localStorage.setItem(CONTRIBUTOR_KEY, JSON.stringify(next)); } catch { }
    return sub;
  }

  async related(png: PngAsset, limit = 8): Promise<PngAsset[]> {
    if (png.provider === 'pixabay') {
      const rawId = png.id.replace(/^px-/, '');
      const apiResult = await this.pixabay.search({ q: png.tags.slice(0, 3).join(' '), per_page: limit });
      if (apiResult.assets.length > 0) return apiResult.assets;
    }
    if (png.provider === 'pexels') {
      const apiResult = await this.pexels.search({ q: png.tags.slice(0, 3).join(' '), per_page: limit });
      if (apiResult.assets.length > 0) return apiResult.assets;
    }
    if (png.provider === 'openverse') {
      const apiResult = await this.openverse.search({ q: png.tags.slice(0, 3).join(' '), page_size: limit });
      if (apiResult.assets.length > 0) return apiResult.assets;
    }
    const src = this.library();
    const sameCategory = src.filter((p) => p.id !== png.id && p.category === png.category);
    if (sameCategory.length >= limit) return sameCategory.slice(0, limit);
    const similar = src.filter((p) => p.id !== png.id && p.category !== png.category &&
      p.tags.some((t) => png.tags.includes(t)));
    return [...sameCategory, ...similar].slice(0, limit);
  }

  byId(id: string): PngAsset | undefined {
    return this.library().find((p) => p.id === id);
  }

  createCollection(name: string): PngCollection {
    const col: PngCollection = { id: `col-${Date.now()}`, name: name.trim(), assetIds: [], createdAt: new Date().toISOString() };
    const next = [col, ...this.collections()];
    this.collections.set(next);
    this.saveCollections(next);
    return col;
  }

  addToCollection(colId: string, assetId: string): void {
    const next = this.collections().map((c) =>
      c.id === colId && !c.assetIds.includes(assetId)
        ? { ...c, assetIds: [...c.assetIds, assetId] }
        : c
    );
    this.collections.set(next);
    this.saveCollections(next);
  }

  removeFromCollection(colId: string, assetId: string): void {
    const next = this.collections().map((c) =>
      c.id === colId ? { ...c, assetIds: c.assetIds.filter((id) => id !== assetId) } : c
    );
    this.collections.set(next);
    this.saveCollections(next);
  }

  isInCollection(colId: string, assetId: string): boolean {
    return this.collections().find((c) => c.id === colId)?.assetIds.includes(assetId) ?? false;
  }

  deleteCollection(colId: string): void {
    const next = this.collections().filter((c) => c.id !== colId);
    this.collections.set(next);
    this.saveCollections(next);
  }

  private loadFavorites(): Set<string> {
    try { const raw = localStorage.getItem(FAVORITES_KEY); return raw ? new Set(JSON.parse(raw)) : new Set(); }
    catch { return new Set(); }
  }
  private saveFavorites(set: Set<string>): void {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set])); } catch { }
  }

  private loadCollections(): PngCollection[] {
    try { const raw = localStorage.getItem(COLLECTIONS_KEY); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  }
  private saveCollections(cols: PngCollection[]): void {
    try { localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols)); } catch { }
  }

  private loadRecent(): string[] {
    try { const raw = localStorage.getItem(RECENT_KEY); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  }

  private loadSearchHistory(): string[] {
    try { const raw = localStorage.getItem(SEARCH_HISTORY_KEY); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  }

  private loadQuota(): QuotaState {
    try {
      const raw = localStorage.getItem(QUOTA_KEY);
      return raw ? JSON.parse(raw) : { date: todayKey(), count: 0 };
    } catch { return { date: todayKey(), count: 0 }; }
  }

  private loadContributions(): ContributorSubmission[] {
    try { const raw = localStorage.getItem(CONTRIBUTOR_KEY); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  }
}
