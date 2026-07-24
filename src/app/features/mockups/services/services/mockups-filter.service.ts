import { Injectable, signal, computed } from '@angular/core';
import {
  MockupAsset, MockupCategory, MockupFilterState,
  MockupSceneType, MockupOrientation, MockupLicense, MockupSortMode,
} from '../../../../core/models/mockup.model';
import { MockupWithSource } from '../../../../core/repositories/mockups.repository';

const DEFAULT_FILTER: MockupFilterState = {
  query: '',
  categoryId: null,
  subcategoryId: null,
  sceneType: null,
  orientation: null,
  license: null,
  formats: [],
  isAiGenerated: null,
  bgColor: null,
  sort: 'popular',
  dateAdded: 'all',
  favoritesOnly: false,
  creatorId: null,
};

@Injectable({ providedIn: 'root' })
export class MockupsFilterService {
  readonly filter = signal<MockupFilterState>({ ...DEFAULT_FILTER });
  readonly favorites = signal<Set<string>>(new Set());

  filterAssets(assets: MockupWithSource[], favSet: Set<string>): MockupWithSource[] {
    const f = this.filter();
    let list = [...assets];

    if (f.query) {
      const q = f.query.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some(t => t.includes(q)) ||
        a.categoryLabel.toLowerCase().includes(q),
      );
    }
    if (f.categoryId)   list = list.filter(a => a.category === f.categoryId);
    if (f.subcategoryId) list = list.filter(a => a.subcategory === f.subcategoryId);
    if (f.sceneType)    list = list.filter(a => a.sceneType === f.sceneType);
    if (f.orientation)  list = list.filter(a => a.orientation === f.orientation);
    if (f.license)      list = list.filter(a => a.license === f.license);
    if (f.isAiGenerated !== null) list = list.filter(a => a.isAiGenerated === f.isAiGenerated);
    if (f.formats.length) list = list.filter(a => f.formats.every(fmt => a.formats.includes(fmt)));
    if (f.favoritesOnly) list = list.filter(a => favSet.has(a.id));
    if (f.creatorId)    list = list.filter(a => a.creator.id === f.creatorId);
    if (f.dateAdded !== 'all') {
      const days = f.dateAdded === 'today' ? 1 : f.dateAdded === 'week' ? 7 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      list = list.filter(a => new Date(a.uploadedAt) >= cutoff);
    }

    switch (f.sort) {
      case 'newest':    list.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)); break;
      case 'downloads': list.sort((a, b) => b.downloads - a.downloads); break;
      case 'views':     list.sort((a, b) => b.views - a.views); break;
      case 'likes':     list.sort((a, b) => b.likes - a.likes); break;
      case 'rating':    list.sort((a, b) => b.rating - a.rating); break;
      default:          list.sort((a, b) => (b.downloads + b.likes * 3) - (a.downloads + a.likes * 3));
    }
    return list;
  }

  setFilter(patch: Partial<MockupFilterState>): void {
    this.filter.update(f => ({ ...f, ...patch }));
  }

  resetFilter(): void {
    this.filter.set({ ...DEFAULT_FILTER });
  }
}
