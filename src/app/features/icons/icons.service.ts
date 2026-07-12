import { Injectable, signal, computed } from '@angular/core';
import {
  IconAsset, IconAesthetic, IconTrend, IconPlatform,
  IconFilterState, IconStyleState, IconLibraryId, IconCollection,
} from '../../core/models/icon.model';
import { ICON_LIBRARY, ICON_CATEGORIES } from './icons-legacy.data';
import { ICON_LIBRARIES, LibraryMeta } from './data/index';

export { ICON_CATEGORIES } from './icons-legacy.data';
export type { IconCategory } from './icons-legacy.data';

const FAVORITES_KEY = 'amx_icon_favorites';
const COLLECTIONS_KEY = 'amx_icon_collections';

export const DEFAULT_ICON_STYLE: IconStyleState = {
  technique: 'line',
  colorMode: 'mono',
  corners: 'round',
  strokeWidth: 2,
  animatedOn: false,
  recolorHue: '#f5820a',
  density: 'medium',
};

export const DEFAULT_ICON_FILTERS: IconFilterState = {
  query: '',
  platforms: [],
  aesthetic: [],
  trend: [],
  author: [],
  categoryId: null,
  favoritesOnly: false,
  libraryId: null,
};

@Injectable({ providedIn: 'root' })
export class IconsService {
  readonly categories = ICON_CATEGORIES;
  readonly libraryMeta: LibraryMeta[] = ICON_LIBRARIES;

  readonly style = signal<IconStyleState>({ ...DEFAULT_ICON_STYLE });
  readonly filters = signal<IconFilterState>({ ...DEFAULT_ICON_FILTERS });
  readonly favorites = signal<Set<string>>(this.loadFavorites());
  readonly collections = signal<IconCollection[]>(this.loadCollections());

  /** Map from library ID → loaded icon array. amarapix starts pre-loaded. */
  private readonly _libraries = signal<Map<IconLibraryId, IconAsset[]>>(
    new Map([['amarapix', ICON_LIBRARY as IconAsset[]]])
  );
  /** Set of library IDs currently being loaded */
  private readonly _loading = signal<Set<IconLibraryId>>(new Set());

  /** Whether a specific library is currently loading */
  isLoading(id: IconLibraryId): boolean {
    return this._loading().has(id);
  }

  /** Whether a specific library has been loaded */
  isLoaded(id: IconLibraryId): boolean {
    return this._libraries().has(id);
  }

  /** All icons currently loaded across all libraries */
  private readonly _allIcons = computed<IconAsset[]>(() => {
    const libs = this._libraries();
    const result: IconAsset[] = [];
    for (const icons of libs.values()) {
      result.push(...icons);
    }
    return result;
  });

  readonly filteredIcons = computed(() => {
    const f = this.filters();
    const favs = this.favorites();
    const q = f.query.trim().toLowerCase();
    const all = this._allIcons();

    return all.filter((icon) => {
      if (f.libraryId && (icon.library ?? 'amarapix') !== f.libraryId) return false;
      if (f.favoritesOnly && !favs.has(icon.id)) return false;
      if (f.categoryId && icon.category !== f.categoryId) return false;
      if (this.style().animatedOn && !icon.hasAnimatedVariant) return false;
      if (f.platforms.length && !f.platforms.some(p => icon.platforms.includes(p))) return false;
      if (f.aesthetic.length && !f.aesthetic.some(a => icon.aesthetic.includes(a))) return false;
      if (f.trend.length && !f.trend.includes(icon.trend)) return false;
      if (q) {
        const haystack = `${icon.name} ${icon.tags.join(' ')} ${icon.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  /** Total icons loaded so far */
  readonly totalLoaded = computed(() => this._allIcons().length);

  /** Expose all icons for collection icon lookups */
  readonly allIcons = this._allIcons;

  /** Lazy-load a library by ID via static JSON asset. No-op if already loaded/loading. */
  async loadLibrary(id: IconLibraryId): Promise<void> {
    if (id === 'amarapix') return;
    if (this._libraries().has(id)) return;
    if (this._loading().has(id)) return;

    this._loading.update(s => { const n = new Set(s); n.add(id); return n; });

    try {
      const res = await fetch(`/assets/icons/${id}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status} loading ${id}`);
      const icons: IconAsset[] = await res.json();
      this._libraries.update(m => {
        const n = new Map(m);
        n.set(id, icons);
        return n;
      });
    } catch (err) {
      console.error(`Failed to load icon library: ${id}`, err);
    } finally {
      this._loading.update(s => { const n = new Set(s); n.delete(id); return n; });
    }
  }

  updateStyle(patch: Partial<IconStyleState>): void {
    this.style.update(s => ({ ...s, ...patch }));
  }

  resetStyle(): void {
    this.style.set({ ...DEFAULT_ICON_STYLE });
  }

  updateFilters(patch: Partial<IconFilterState>): void {
    this.filters.update(f => ({ ...f, ...patch }));
  }

  clearFilters(): void {
    this.filters.set({ ...DEFAULT_ICON_FILTERS });
  }

  setLibrary(id: IconLibraryId | null): void {
    this.filters.update(f => ({ ...f, libraryId: id }));
    if (id && id !== 'amarapix') {
      this.loadLibrary(id);
    }
  }

  toggleArrayFilter<K extends 'platforms' | 'aesthetic' | 'trend'>(
    key: K, value: IconFilterState[K][number]
  ): void {
    this.filters.update((f) => {
      const list = (f[key] as any[]) ?? [];
      const next = list.includes(value) ? list.filter((v: any) => v !== value) : [...list, value];
      return { ...f, [key]: next };
    });
  }

  toggleFavorite(id: string): void {
    const next = new Set(this.favorites());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.favorites.set(next);
    this.saveFavorites(next);
  }

  isFavorite(id: string): boolean {
    return this.favorites().has(id);
  }

  // ── Collections ──────────────────────────────────────────────────────────

  createCollection(name: string): string {
    const id = `col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const col: IconCollection = {
      id, name: name.trim() || 'My Collection', iconIds: [], createdAt: new Date().toISOString(),
    };
    this.collections.update(cols => [...cols, col]);
    this.saveCollections(this.collections());
    return id;
  }

  deleteCollection(id: string): void {
    this.collections.update(cols => cols.filter(c => c.id !== id));
    this.saveCollections(this.collections());
  }

  renameCollection(id: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.collections.update(cols => cols.map(c => c.id === id ? { ...c, name: trimmed } : c));
    this.saveCollections(this.collections());
  }

  addToCollection(collectionId: string, iconId: string): void {
    this.collections.update(cols => cols.map(c =>
      c.id === collectionId && !c.iconIds.includes(iconId)
        ? { ...c, iconIds: [...c.iconIds, iconId] } : c
    ));
    this.saveCollections(this.collections());
  }

  removeFromCollection(collectionId: string, iconId: string): void {
    this.collections.update(cols => cols.map(c =>
      c.id === collectionId ? { ...c, iconIds: c.iconIds.filter(i => i !== iconId) } : c
    ));
    this.saveCollections(this.collections());
  }

  isInCollection(collectionId: string, iconId: string): boolean {
    return this.collections().find(c => c.id === collectionId)?.iconIds.includes(iconId) ?? false;
  }

  iconInAnyCollection(iconId: string): boolean {
    return this.collections().some(c => c.iconIds.includes(iconId));
  }

  private loadCollections(): IconCollection[] {
    try {
      const raw = localStorage.getItem(COLLECTIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private saveCollections(cols: IconCollection[]): void {
    try { localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols)); } catch { /* quota */ }
  }

  // ── Favorites ─────────────────────────────────────────────────────────────

  private loadFavorites(): Set<string> {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  private saveFavorites(set: Set<string>): void {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
    } catch { /* ignore quota errors */ }
  }
}
