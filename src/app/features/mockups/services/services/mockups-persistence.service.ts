import { Injectable, signal } from '@angular/core';
import { MockupCollection } from '../../../core/models/mockup.model';
import { Result, success, failure } from '../../../core/lib/result';
import { AppError } from '../../../core/lib/errors';

const FAVS_KEY = 'amx_mockup_favs';
const COLLECTIONS_KEY = 'amx_mockup_collections';
const SEARCHES_KEY = 'amx_mockup_recent_searches';

@Injectable({ providedIn: 'root' })
export class MockupsPersistenceService {
  readonly favorites = signal<Set<string>>(this.loadFavorites());
  readonly collections = signal<MockupCollection[]>(this.loadCollections());
  readonly recentSearches = signal<string[]>(this.loadRecentSearches());
  readonly recentlyViewed = signal<string[]>([]);

  toggleFavorite(id: string): void {
    this.favorites.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      this.persistFavorites(next);
      return next;
    });
  }

  isFavorite(id: string): boolean {
    return this.favorites().has(id);
  }

  addRecentSearch(q: string): void {
    if (!q.trim()) return;
    this.recentSearches.update(list => {
      const next = [q, ...list.filter(x => x !== q)].slice(0, 10);
      this.persistRecentSearches(next);
      return next;
    });
  }

  clearRecentSearches(): void {
    this.recentSearches.set([]);
    try { localStorage.removeItem(SEARCHES_KEY); } catch {}
  }

  addRecentlyViewed(id: string): void {
    this.recentlyViewed.update(list => [id, ...list.filter(x => x !== id)].slice(0, 20));
  }

  createCollection(name: string): Result<MockupCollection> {
    const col: MockupCollection = {
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      name,
      assetIds: [],
      isPublic: false,
      createdAt: new Date().toISOString(),
    };
    this.collections.update(list => {
      const next = [...list, col];
      this.persistCollections(next);
      return next;
    });
    return success(col);
  }

  addToCollection(colId: string, assetId: string): void {
    this.collections.update(list => {
      const next = list.map(c =>
        c.id === colId && !c.assetIds.includes(assetId)
          ? { ...c, assetIds: [...c.assetIds, assetId] }
          : c,
      );
      this.persistCollections(next);
      return next;
    });
  }

  removeFromCollection(colId: string, assetId: string): void {
    this.collections.update(list => {
      const next = list.map(c =>
        c.id === colId
          ? { ...c, assetIds: c.assetIds.filter(a => a !== assetId) }
          : c,
      );
      this.persistCollections(next);
      return next;
    });
  }

  deleteCollection(colId: string): void {
    this.collections.update(list => {
      const next = list.filter(c => c.id !== colId);
      this.persistCollections(next);
      return next;
    });
  }

  private loadFavorites(): Set<string> {
    try {
      return new Set(JSON.parse(localStorage.getItem(FAVS_KEY) ?? '[]'));
    } catch {
      return new Set();
    }
  }

  private persistFavorites(set: Set<string>): void {
    try {
      localStorage.setItem(FAVS_KEY, JSON.stringify([...set]));
    } catch {}
  }

  private loadCollections(): MockupCollection[] {
    try {
      return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  private persistCollections(list: MockupCollection[]): void {
    try {
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(list));
    } catch {}
  }

  private loadRecentSearches(): string[] {
    try {
      return JSON.parse(localStorage.getItem(SEARCHES_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  private persistRecentSearches(list: string[]): void {
    try {
      localStorage.setItem(SEARCHES_KEY, JSON.stringify(list));
    } catch {}
  }
}
