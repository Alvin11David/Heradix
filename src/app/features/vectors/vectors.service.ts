import { Injectable, signal, computed, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  VectorAsset, VectorCategory, VectorCollection, VectorFilterState,
  VectorFormat, VectorStyle, VectorLicense, VectorOrientation,
  VectorComplexity, VectorColorMode, VectorSortMode, VectorCreator,
} from '../../core/models/vector.model';

export const TRENDING_TAGS = [
  'flat design','isometric','gradient','minimal','3d render',
  'cartoon','abstract','geometric','watercolor','neon','glassmorphism',
  'retro','clay','hand-drawn','vintage',
];

export const TRENDING_COLORS = [
  { name: 'Electric Blue',  hex: '#3B82F6' },
  { name: 'Coral Sunset',   hex: '#F97316' },
  { name: 'Emerald',        hex: '#10B981' },
  { name: 'Violet Dream',   hex: '#8B5CF6' },
  { name: 'Rose Gold',      hex: '#F43F5E' },
  { name: 'Midnight',       hex: '#111827' },
  { name: 'Amber',          hex: '#F59E0B' },
  { name: 'Teal',           hex: '#14B8A6' },
];

export const SEASONAL_COLLECTIONS = [
  { id: 'summer',    label: 'Summer Vibes',    emoji: '☀️', count: 840 },
  { id: 'christmas', label: 'Holiday Season',  emoji: '🎄', count: 620 },
  { id: 'business',  label: 'Back to Business',emoji: '💼', count: 1240 },
  { id: 'nature',    label: 'Earth Day',        emoji: '🌍', count: 380 },
  { id: 'gradient',  label: 'Gradient Mania',  emoji: '🌈', count: 990 },
  { id: 'minimalist',label: 'Less is More',    emoji: '◽', count: 760 },
];

const DEFAULT_FILTERS: VectorFilterState = {
  query:        '',
  categoryId:   null,
  formats:      [],
  style:        null,
  license:      null,
  orientation:  null,
  complexity:   null,
  colorMode:    null,
  color:        null,
  isAiGenerated:null,
  isAnimated:   null,
  dateAdded:    'all',
  sort:         'popular',
  favoritesOnly:false,
  creatorId:    null,
};

const FAVORITES_KEY = 'amx_vector_favorites';
const COLLECTIONS_KEY = 'amx_vector_collections';
const RECENT_KEY = 'amx_vector_recent';
const RECENT_SEARCHES_KEY = 'amx_vector_recent_searches';

@Injectable({ providedIn: 'root' })
export class VectorsService {
  private readonly api = inject(ApiService);

  // ── State ─────────────────────────────────────────────────────────────────
  readonly loading = signal(true);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  readonly allAssets = signal<VectorAsset[]>([]);
  readonly creators = signal<VectorCreator[]>([]);

  // ── Filter state ──────────────────────────────────────────────────────────
  readonly filters = signal<VectorFilterState>({ ...DEFAULT_FILTERS });

  // ── Favorites ─────────────────────────────────────────────────────────────
  readonly favorites = signal<Set<string>>(this._loadFavorites());

  // ── Collections ───────────────────────────────────────────────────────────
  readonly collections = signal<VectorCollection[]>(this._loadCollections());

  // ── Recently viewed ───────────────────────────────────────────────────────
  readonly recentlyViewed = signal<string[]>(this._loadRecent());

  // ── Recent searches ───────────────────────────────────────────────────────
  readonly recentSearches = signal<string[]>(this._loadRecentSearches());

  // ── Derived: filtered & sorted ────────────────────────────────────────────
  readonly filtered = computed(() => {
    const f = this.filters();
    let list = this.allAssets();

    if (f.query) {
      const q = f.query.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.tags.some(t => t.includes(q)) ||
        a.categoryLabel.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }
    if (f.categoryId) list = list.filter(a => a.category === f.categoryId);
    if (f.formats.length) list = list.filter(a => f.formats.every(fmt => a.formats.includes(fmt)));
    if (f.style) list = list.filter(a => a.style === f.style);
    if (f.license) list = list.filter(a => a.license === f.license);
    if (f.orientation) list = list.filter(a => a.orientation === f.orientation);
    if (f.complexity) list = list.filter(a => a.complexity === f.complexity);
    if (f.colorMode) list = list.filter(a => a.colorMode === f.colorMode);
    if (f.color) {
      const target = f.color.toLowerCase();
      list = list.filter(a => a.dominantColors.some(c => c.toLowerCase() === target));
    }
    if (f.isAiGenerated !== null) list = list.filter(a => a.isAiGenerated === f.isAiGenerated);
    if (f.isAnimated !== null) list = list.filter(a => a.isAnimated === f.isAnimated);
    if (f.favoritesOnly) {
      const favs = this.favorites();
      list = list.filter(a => favs.has(a.id));
    }
    if (f.creatorId) list = list.filter(a => a.creator.id === f.creatorId);

    const now = Date.now();
    if (f.dateAdded === 'today') list = list.filter(a => now - new Date(a.uploadedAt).getTime() < 86400000);
    else if (f.dateAdded === 'week') list = list.filter(a => now - new Date(a.uploadedAt).getTime() < 7 * 86400000);
    else if (f.dateAdded === 'month') list = list.filter(a => now - new Date(a.uploadedAt).getTime() < 30 * 86400000);

    switch (f.sort) {
      case 'newest':    return [...list].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      case 'downloads': return [...list].sort((a, b) => b.downloads - a.downloads);
      case 'views':     return [...list].sort((a, b) => b.views - a.views);
      case 'likes':     return [...list].sort((a, b) => b.likes - a.likes);
      case 'rating':    return [...list].sort((a, b) => b.rating - a.rating);
      default:          return [...list].sort((a, b) => (b.downloads * 0.5 + b.views * 0.3 + b.likes * 0.2) - (a.downloads * 0.5 + a.views * 0.3 + a.likes * 0.2));
    }
  });

  // ── Followed creators ─────────────────────────────────────────────────────
  readonly followedCreators = signal<Set<string>>(this._loadFollowed());

  // ── Derived sections ──────────────────────────────────────────────────────
  readonly featuredVectors  = computed(() => this.allAssets().filter(a => a.isEditorsChoice || a.isStaffPick).slice(0, 12));
  readonly trendingToday    = computed(() => [...this.allAssets()].sort((a, b) => b.views - a.views).slice(0, 20));
  readonly trendingWeek     = computed(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    return [...this.allAssets()]
      .filter(a => new Date(a.uploadedAt).getTime() > weekAgo || a.downloads > 5000)
      .sort((a, b) => (b.downloads + b.views) - (a.downloads + a.views))
      .slice(0, 20);
  });
  readonly trendingMonth    = computed(() => [...this.allAssets()].sort((a, b) => (b.downloads + b.likes) - (a.downloads + a.likes)).slice(0, 20));
  readonly mostViewed       = computed(() => [...this.allAssets()].sort((a, b) => b.views - a.views).slice(0, 20));
  readonly mostLiked        = computed(() => [...this.allAssets()].sort((a, b) => b.likes - a.likes).slice(0, 20));
  readonly editorChoice     = computed(() => this.allAssets().filter(a => a.isEditorsChoice).slice(0, 16));
  readonly newArrivals      = computed(() => [...this.allAssets()].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()).slice(0, 20));
  readonly mostDownloaded   = computed(() => [...this.allAssets()].sort((a, b) => b.downloads - a.downloads).slice(0, 20));
  readonly staffPicks       = computed(() => this.allAssets().filter(a => a.isStaffPick).slice(0, 12));
  readonly aiGenerated      = computed(() => this.allAssets().filter(a => a.isAiGenerated).slice(0, 16));
  readonly freeVectors      = computed(() => this.allAssets().filter(a => a.isFree).slice(0, 16));
  readonly premiumVectors   = computed(() => this.allAssets().filter(a => a.isPremium).slice(0, 16));
  readonly recentlyViewedAssets = computed(() => {
    const ids = this.recentlyViewed();
    return ids.map(id => this.allAssets().find(a => a.id === id)).filter(Boolean) as VectorAsset[];
  });
  readonly popularCreators  = computed(() => {
    return this.creators().map(creator => ({
      ...creator,
      topAssets: this.allAssets().filter(a => a.creator.id === creator.id)
        .sort((a, b) => b.downloads - a.downloads).slice(0, 3),
      totalDownloads: this.allAssets().filter(a => a.creator.id === creator.id)
        .reduce((sum, a) => sum + a.downloads, 0),
    })).sort((a, b) => b.totalDownloads - a.totalDownloads);
  });
  readonly featuredCollections = computed(() => {
    return SEASONAL_COLLECTIONS.map(col => ({
      ...col,
      assets: this.allAssets().filter(a => a.category === col.id || a.tags.some(t => col.label.toLowerCase().includes(t))).slice(0, 4),
    }));
  });

  // ── Categories ────────────────────────────────────────────────────────────
  readonly categories = signal<VectorCategory[]>([]);

  // ── Related tags (from current results) ──────────────────────────────────
  readonly relatedTags = computed(() => {
    const q = this.filters().query.toLowerCase();
    const tagCounts = new Map<string, number>();
    this.filtered().slice(0, 60).forEach(a =>
      a.tags.forEach(t => { if (t !== q) tagCounts.set(t, (tagCounts.get(t) || 0) + 1); })
    );
    return [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t]) => t);
  });

  constructor() {
    this._loadData();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  private _loadData(): void {
    forkJoin({
      vectors: this.api.get<VectorAsset[]>('/vectors'),
      creators: this.api.get<VectorCreator[]>('/vector-creators'),
      categories: this.api.get<VectorCategory[]>('/vector-categories'),
    }).subscribe({
      next: (result) => {
        this.allAssets.set(result.vectors);
        this.creators.set(result.creators);
        this.categories.set(result.categories);
        this.loading.set(false);
        this.loaded.set(true);
      },
      error: (err) => {
        this.error.set('Failed to load vectors. Please try again later.');
        this.loading.set(false);
      },
    });
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this._loadData();
  }

  // ── Methods ───────────────────────────────────────────────────────────────

  setFilter<K extends keyof VectorFilterState>(key: K, value: VectorFilterState[K]): void {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  resetFilters(): void {
    this.filters.set({ ...DEFAULT_FILTERS });
  }

  toggleFavorite(id: string): void {
    this.favorites.update(favs => {
      const next = new Set(favs);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  isFavorite(id: string): boolean {
    return this.favorites().has(id);
  }

  trackView(id: string): void {
    this.recentlyViewed.update(ids => {
      const next = [id, ...ids.filter(i => i !== id)].slice(0, 20);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  addRecentSearch(q: string): void {
    if (!q.trim()) return;
    this.recentSearches.update(prev => {
      const next = [q, ...prev.filter(s => s !== q)].slice(0, 12);
      try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  removeRecentSearch(q: string): void {
    this.recentSearches.update(prev => {
      const next = prev.filter(s => s !== q);
      try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  toggleFollowCreator(creatorId: string): void {
    this.followedCreators.update(s => {
      const next = new Set(s);
      next.has(creatorId) ? next.delete(creatorId) : next.add(creatorId);
      try { localStorage.setItem('amx_vec_followed', JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  isFollowing(creatorId: string): boolean {
    return this.followedCreators().has(creatorId);
  }

  createCollection(name: string): void {
    const col: VectorCollection = {
      id: `col-${Date.now()}`, name, assetIds: [], isPublic: false,
      createdAt: new Date().toISOString(),
    };
    this.collections.update(cols => {
      const next = [...cols, col];
      this._saveCollections(next);
      return next;
    });
  }

  renameCollection(colId: string, name: string): void {
    this.collections.update(cols => {
      const next = cols.map(c => c.id === colId ? { ...c, name } : c);
      this._saveCollections(next); return next;
    });
  }

  deleteCollection(colId: string): void {
    this.collections.update(cols => {
      const next = cols.filter(c => c.id !== colId);
      this._saveCollections(next); return next;
    });
  }

  toggleCollectionPublic(colId: string): void {
    this.collections.update(cols => {
      const next = cols.map(c => c.id === colId ? { ...c, isPublic: !c.isPublic } : c);
      this._saveCollections(next); return next;
    });
  }

  addToCollection(colId: string, assetId: string): void {
    this.collections.update(cols => {
      const next = cols.map(c =>
        c.id === colId && !c.assetIds.includes(assetId)
          ? { ...c, assetIds: [...c.assetIds, assetId] }
          : c
      );
      this._saveCollections(next);
      return next;
    });
  }

  getSimilar(asset: VectorAsset, limit = 8): VectorAsset[] {
    return this.allAssets()
      .filter(a => a.id !== asset.id && (a.category === asset.category || a.style === asset.style))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  getByCreator(creatorId: string, excludeId?: string): VectorAsset[] {
    return this.allAssets().filter(a => a.creator.id === creatorId && a.id !== excludeId).slice(0, 8);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _loadFollowed(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem('amx_vec_followed') || '[]')); } catch { return new Set(); }
  }

  private _loadFavorites(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')); } catch { return new Set(); }
  }

  private _loadCollections(): VectorCollection[] {
    try { return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || '[]'); } catch { return []; }
  }

  private _saveCollections(cols: VectorCollection[]): void {
    try { localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols)); } catch {}
  }

  private _loadRecent(): string[] {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  }

  private _loadRecentSearches(): string[] {
    try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'); } catch { return []; }
  }
}
