import { Injectable, computed, signal } from '@angular/core';
import { PngAsset, PngCategory, PngFilterState } from '../../core/models/png.model';
import { PNG_CATEGORIES, PNG_LIBRARY } from './png-data';

const FAVORITES_KEY = 'amx_png_favorites';

export const DEFAULT_PNG_FILTERS: PngFilterState = {
  query: '',
  categoryId: null,
  license: 'all',
  sort: 'popular',
  favoritesOnly: false,
};

@Injectable({ providedIn: 'root' })
export class PngService {
  readonly categories: PngCategory[] = PNG_CATEGORIES;
  readonly library: PngAsset[] = PNG_LIBRARY;

  readonly filters = signal<PngFilterState>({ ...DEFAULT_PNG_FILTERS });
  readonly favorites = signal<Set<string>>(this.loadFavorites());

  readonly totalCount = computed(() => this.library.length);

  readonly filtered = computed<PngAsset[]>(() => {
    const f = this.filters();
    const favs = this.favorites();
    const q = f.query.trim().toLowerCase();

    let list = this.library.filter((png) => {
      if (f.favoritesOnly && !favs.has(png.id)) return false;
      if (f.categoryId && png.category !== f.categoryId) return false;
      if (f.license === 'free' && png.isPremium) return false;
      if (f.license === 'premium' && !png.isPremium) return false;
      if (q) {
        const haystack = `${png.name} ${png.tags.join(' ')} ${png.categoryLabel}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (f.sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (f.sort === 'downloads') return b.downloads - a.downloads;
      // 'popular' — blend of likes and downloads
      return (b.likes * 3 + b.downloads) - (a.likes * 3 + a.downloads);
    });

    return list;
  });

  updateFilters(patch: Partial<PngFilterState>): void {
    this.filters.update((f) => ({ ...f, ...patch }));
  }

  clearFilters(): void {
    this.filters.set({ ...DEFAULT_PNG_FILTERS });
  }

  setQuery(query: string): void {
    this.updateFilters({ query });
  }

  setCategory(categoryId: string | null): void {
    this.updateFilters({ categoryId: this.filters().categoryId === categoryId ? null : categoryId });
  }

  setLicense(license: PngFilterState['license']): void {
    this.updateFilters({ license });
  }

  setSort(sort: PngFilterState['sort']): void {
    this.updateFilters({ sort });
  }

  toggleFavoritesOnly(): void {
    this.updateFilters({ favoritesOnly: !this.filters().favoritesOnly });
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

  related(png: PngAsset, limit = 8): PngAsset[] {
    return this.library
      .filter((p) => p.id !== png.id && p.category === png.category)
      .slice(0, limit);
  }

  byId(id: string): PngAsset | undefined {
    return this.library.find((p) => p.id === id);
  }

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
    } catch { /* quota */ }
  }
}
