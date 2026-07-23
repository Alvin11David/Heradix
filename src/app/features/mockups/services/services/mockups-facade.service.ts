import { Injectable, inject, signal, computed } from '@angular/core';
import {
  MockupAsset, MockupCategory, MockupCategoryMeta,
} from '../../../core/models/mockup.model';
import {
  MockupsRepository,
} from '../../../core/repositories/mockups.repository';
import { MockupsFilterService } from './mockups-filter.service';
import { MockupsPersistenceService } from './mockups-persistence.service';
import { MockupsEditorService } from './mockups-editor.service';
import { isSuccess } from '../../../core/lib/result';
import { Subscription } from 'rxjs';

const CATEGORY_LABELS: Record<MockupCategory, { label: string; icon: string }> = {
  devices: { label: 'Devices', icon: '📱' },
  apparel: { label: 'Apparel', icon: '👕' },
  branding: { label: 'Branding', icon: '🏢' },
  packaging: { label: 'Packaging', icon: '📦' },
  print: { label: 'Print', icon: '📄' },
  outdoor: { label: 'Outdoor', icon: '🏙️' },
  'home-office': { label: 'Home & Office', icon: '🖼️' },
  digital: { label: 'Digital', icon: '💻' },
  merchandise: { label: 'Merchandise', icon: '🎁' },
};

@Injectable({ providedIn: 'root' })
export class MockupsFacade {
  private readonly repository = inject(MockupsRepository);
  readonly filterService = inject(MockupsFilterService);
  readonly persistence = inject(MockupsPersistenceService);
  readonly editor = inject(MockupsEditorService);

  readonly assets = signal<MockupAsset[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly loaded = signal(false);

  readonly filteredAssets = computed(() => {
    return this.filterService.filterAssets(this.assets(), this.persistence.favorites());
  });

  readonly featuredAssets    = computed(() => this.assets().filter(a => a.isFeatured).slice(0, 8));
  readonly trendingAssets    = computed(() => this.assets().filter(a => a.isTrending).slice(0, 8));
  readonly editorsPickAssets = computed(() => this.assets().filter(a => a.isEditorsChoice).slice(0, 6));
  readonly staffPickAssets   = computed(() => this.assets().filter(a => a.isStaffPick).slice(0, 6));
  readonly newAssets         = computed(() => this.assets().filter(a => a.isNew).slice(0, 8));
  readonly freeAssets        = computed(() => this.assets().filter(a => a.isFree).slice(0, 8));
  readonly premiumAssets     = computed(() => this.assets().filter(a => a.isPremium).slice(0, 8));
  readonly aiAssets          = computed(() => this.assets().filter(a => a.isAiGenerated).slice(0, 6));
  readonly deviceAssets      = computed(() => this.assets().filter(a => a.category === 'devices').slice(0, 6));
  readonly apparelAssets     = computed(() => this.assets().filter(a => a.category === 'apparel').slice(0, 6));
  readonly packagingAssets   = computed(() => this.assets().filter(a => a.category === 'packaging').slice(0, 6));
  readonly brandingAssets    = computed(() => this.assets().filter(a => a.category === 'branding').slice(0, 6));
  readonly mostDownloaded    = computed(() => [...this.assets()].sort((a, b) => b.downloads - a.downloads).slice(0, 6));

  readonly trendingTags = computed(() => {
    const freq: Record<string, number> = {};
    this.assets().forEach(a => a.tags.forEach(t => { freq[t] = (freq[t] ?? 0) + 1; }));
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(e => e[0]);
  });

  readonly categories = computed<MockupCategoryMeta[]>(() => {
    const counts: Record<string, number> = {};
    this.assets().forEach(a => {
      const cat = a.category;
      counts[cat] = (counts[cat] ?? 0) + 1;
    });

    return (Object.keys(CATEGORY_LABELS) as MockupCategory[])
      .filter(cat => counts[cat] && counts[cat] > 0)
      .map(cat => ({
        id: cat,
        label: CATEGORY_LABELS[cat].label,
        icon: CATEGORY_LABELS[cat].icon,
        count: counts[cat],
        subcategories: [],
      }));
  });

  private sub: Subscription | null = null;

  loadMockups(): void {
    if (this.loaded() && this.assets().length > 0) return;
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    this.sub = this.repository.fetchAll().subscribe({
      next: (result) => {
        if (isSuccess(result)) {
          this.assets.set(result.value);
          this.loaded.set(true);
        } else {
          this.error.set(result.error.message);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Failed to load mockups');
        this.loading.set(false);
      },
    });
  }

  reload(): void {
    this.loaded.set(false);
    this.loadMockups();
  }

  refresh(): void {
    this.sub?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    this.sub = this.repository.refresh().subscribe({
      next: (result) => {
        if (isSuccess(result)) {
          this.assets.set(result.value);
          this.loaded.set(true);
        } else {
          this.error.set(result.error.message);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Failed to refresh mockups');
        this.loading.set(false);
      },
    });
  }

  getById(id: string): MockupAsset | undefined {
    return this.assets().find(a => a.id === id);
  }

  getBySlug(slug: string): MockupAsset | undefined {
    return this.assets().find(a => a.slug === slug);
  }

  getSimilar(asset: MockupAsset, limit = 6): MockupAsset[] {
    return this.assets().filter(
      a => a.id !== asset.id && (a.category === asset.category || a.sceneType === asset.sceneType),
    ).slice(0, limit);
  }

  getRecentlyViewed(): MockupAsset[] {
    return this.persistence.recentlyViewed()
      .map(id => this.getById(id))
      .filter((a): a is MockupAsset => a !== undefined);
  }
}
