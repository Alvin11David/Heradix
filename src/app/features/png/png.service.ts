import { Injectable, computed, signal } from '@angular/core';
import {
  PngAsset, PngCategory, PngCollection, PngFilterState,
  PngOrientation, PngViewMode,
} from '../../core/models/png.model';
import { PNG_CATEGORIES, PNG_LIBRARY } from './png-data';

const FAVORITES_KEY   = 'amx_png_favorites';
const COLLECTIONS_KEY = 'amx_png_collections';
const RECENT_KEY      = 'amx_png_recent';
const QUOTA_KEY        = 'amx_png_daily_quota';
const CONTRIBUTOR_KEY  = 'amx_png_contributions';
/** Pixabay/PNGTree-style "recent searches" history, distinct from recently *viewed assets* above. */
const SEARCH_HISTORY_KEY = 'amx_png_search_history';
const MAX_SEARCH_HISTORY = 10;

/** Freepik/PNGWing-style daily free-download cap for non-subscribers. Premium members bypass this entirely. */
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
  readonly library: PngAsset[]       = PNG_LIBRARY;

  readonly filters     = signal<PngFilterState>({ ...DEFAULT_PNG_FILTERS });
  readonly favorites   = signal<Set<string>>(this.loadFavorites());
  readonly collections = signal<PngCollection[]>(this.loadCollections());
  readonly recentIds   = signal<string[]>(this.loadRecent());
  /** Past search terms the user typed — Pixabay/PNGTree "recent searches" dropdown, separate from recently *viewed* assets. */
  readonly searchHistory = signal<string[]>(this.loadSearchHistory());
  readonly viewMode    = signal<PngViewMode>('masonry');
  readonly quota        = signal<QuotaState>(this.loadQuota());
  readonly contributions = signal<ContributorSubmission[]>(this.loadContributions());

  /** Remaining free downloads today for non-premium users (Freepik-style daily cap). */
  readonly freeDownloadsRemaining = computed(() => {
    const q = this.quota();
    const usedToday = q.date === todayKey() ? q.count : 0;
    return Math.max(0, DAILY_FREE_DOWNLOAD_LIMIT - usedToday);
  });

  /** One standout pick per category, sorted by engagement — Freepik/Envato Elements "Editor's Picks" style curation (distinct from plain "most popular" sort, which would just repeat the top category). */
  readonly editorsPicks = computed<PngAsset[]>(() => {
    const byCategory = new Map<string, PngAsset>();
    for (const p of this.library) {
      const score = p.likes * 3 + p.downloads;
      const cur = byCategory.get(p.category);
      if (!cur || score > (cur.likes * 3 + cur.downloads)) byCategory.set(p.category, p);
    }
    return [...byCategory.values()].sort((a, b) => (b.likes * 3 + b.downloads) - (a.likes * 3 + a.downloads));
  });

  readonly totalCount = computed(() => this.library.length);

  readonly filtered = computed<PngAsset[]>(() => {
    const f    = this.filters();
    const favs = this.favorites();
    const q    = f.query.trim().toLowerCase();

    let list = this.library.filter((png) => {
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
      if (q) {
        const haystack = `${png.name} ${png.tags.join(' ')} ${png.categoryLabel}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (f.sort === 'newest')    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (f.sort === 'downloads') return b.downloads - a.downloads;
      if (f.sort === 'views')     return b.views - a.views;
      // 'popular' — weighted blend
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

  /** Assets the user recently viewed (most recent first). */
  readonly recentAssets = computed<PngAsset[]>(() =>
    this.recentIds()
      .map((id) => this.library.find((p) => p.id === id))
      .filter((p): p is PngAsset => !!p)
  );

  updateFilters(patch: Partial<PngFilterState>): void {
    this.filters.update((f) => ({ ...f, ...patch }));
  }

  clearFilters(): void {
    this.filters.set({ ...DEFAULT_PNG_FILTERS });
  }

  setQuery(query: string):             void { this.updateFilters({ query }); }
  setCategory(categoryId: string | null): void {
    this.updateFilters({ categoryId: this.filters().categoryId === categoryId ? null : categoryId });
  }
  setLicense(license: PngFilterState['license']): void { this.updateFilters({ license }); }
  setSort(sort: PngFilterState['sort']):           void { this.updateFilters({ sort }); }
  setStyle(style: PngFilterState['style']):        void {
    this.updateFilters({ style: this.filters().style === style ? null : style });
  }
  setColorTone(colorTone: PngFilterState['colorTone']): void {
    this.updateFilters({ colorTone: this.filters().colorTone === colorTone ? null : colorTone });
  }
  setResolution(resolution: PngFilterState['resolution']): void { this.updateFilters({ resolution }); }
  setHasPeople(hasPeople: PngFilterState['hasPeople']):    void { this.updateFilters({ hasPeople }); }
  setDateAdded(dateAdded: PngFilterState['dateAdded']):    void { this.updateFilters({ dateAdded }); }
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
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* quota */ }
  }

  /** Records a submitted search term in the "recent searches" history (deduped, most-recent-first, capped). */
  trackSearch(query: string): void {
    const term = query.trim();
    if (term.length < 2) return;
    const next = [term, ...this.searchHistory().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, MAX_SEARCH_HISTORY);
    this.searchHistory.set(next);
    try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)); } catch { /* quota */ }
  }

  removeSearchHistoryItem(term: string): void {
    const next = this.searchHistory().filter((t) => t !== term);
    this.searchHistory.set(next);
    try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)); } catch { /* quota */ }
  }

  clearSearchHistory(): void {
    this.searchHistory.set([]);
    try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch { /* quota */ }
  }

  /** Top co-occurring tags across the current result set, for a PNGWing/CleanPNG/KissPNG-style related-search tag cloud below the grid. */
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

  /** Records one free download against today's quota. Call only for non-premium users downloading free assets. */
  registerFreeDownload(): void {
    const today = todayKey();
    const cur   = this.quota();
    const next: QuotaState = cur.date === today ? { date: today, count: cur.count + 1 } : { date: today, count: 1 };
    this.quota.set(next);
    try { localStorage.setItem(QUOTA_KEY, JSON.stringify(next)); } catch { /* quota */ }
  }

  // ── Contributor submissions (Shutterstock/Adobe Stock/iStock/Depositphotos/123RF-style upload-to-sell flow) ──
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
    try { localStorage.setItem(CONTRIBUTOR_KEY, JSON.stringify(next)); } catch { /* quota */ }
    return sub;
  }

  related(png: PngAsset, limit = 8): PngAsset[] {
    const sameCategory = this.library.filter((p) => p.id !== png.id && p.category === png.category);
    if (sameCategory.length >= limit) return sameCategory.slice(0, limit);
    const similar     = this.library.filter((p) => p.id !== png.id && p.category !== png.category &&
      p.tags.some((t) => png.tags.includes(t)));
    return [...sameCategory, ...similar].slice(0, limit);
  }

  byId(id: string): PngAsset | undefined {
    return this.library.find((p) => p.id === id);
  }

  // ── Collections ──────────────────────────────────────────────────────────────
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
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set])); } catch { /* quota */ }
  }

  private loadCollections(): PngCollection[] {
    try { const raw = localStorage.getItem(COLLECTIONS_KEY); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  }
  private saveCollections(cols: PngCollection[]): void {
    try { localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols)); } catch { /* quota */ }
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
