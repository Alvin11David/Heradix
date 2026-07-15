import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
  HostListener, OnInit, OnDestroy, ElementRef, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VectorsService, TRENDING_TAGS, TRENDING_COLORS, SEASONAL_COLLECTIONS } from './vectors.service';
import {
  VectorAsset, VectorFormat, VectorStyle, VectorLicense,
  VectorOrientation, VectorComplexity, VectorSortMode, VectorViewMode,
  VectorColorMode,
} from '../../core/models/vector.model';
import { AuthService } from '../../core/auth/auth.service';

const PAGE_SIZE = 32;

export const FORMAT_OPTIONS: { key: VectorFormat; label: string }[] = [
  { key: 'svg', label: 'SVG' },
  { key: 'eps', label: 'EPS' },
  { key: 'ai',  label: 'AI'  },
  { key: 'pdf', label: 'PDF' },
  { key: 'cdr', label: 'CDR' },
  { key: 'dxf', label: 'DXF' },
  { key: 'png', label: 'PNG' },
];

export const STYLE_OPTIONS: { key: VectorStyle; label: string; icon: string }[] = [
  { key: 'flat',          label: 'Flat',           icon: '◼' },
  { key: 'outline',       label: 'Outline',        icon: '◻' },
  { key: 'filled',        label: 'Filled',         icon: '●' },
  { key: 'cartoon',       label: 'Cartoon',        icon: '😄' },
  { key: 'minimal',       label: 'Minimal',        icon: '▫' },
  { key: 'isometric',     label: 'Isometric',      icon: '⬡' },
  { key: 'hand-drawn',    label: 'Hand Drawn',     icon: '✏️' },
  { key: 'watercolor',    label: 'Watercolor',     icon: '🎨' },
  { key: 'clay',          label: 'Clay 3D',        icon: '🟤' },
  { key: 'glassmorphism', label: 'Glassmorphism',  icon: '🔷' },
  { key: 'neumorphism',   label: 'Neumorphism',    icon: '⬜' },
  { key: 'gradient',      label: 'Gradient',       icon: '🌈' },
  { key: '3d',            label: '3D Render',      icon: '🎲' },
];

export const LICENSE_OPTIONS: { key: VectorLicense; label: string }[] = [
  { key: 'free',          label: 'Free'          },
  { key: 'premium',       label: 'Premium'       },
  { key: 'commercial',    label: 'Commercial'    },
  { key: 'editorial',     label: 'Editorial'     },
  { key: 'public-domain', label: 'Public Domain' },
];

export const ORIENTATION_OPTIONS: { key: VectorOrientation; label: string; icon: string }[] = [
  { key: 'landscape', label: 'Landscape', icon: '⬛' },
  { key: 'portrait',  label: 'Portrait',  icon: '▬' },
  { key: 'square',    label: 'Square',    icon: '■'  },
];

export const SORT_OPTIONS: { key: VectorSortMode; label: string }[] = [
  { key: 'popular',   label: 'Most Popular'    },
  { key: 'newest',    label: 'Newest First'    },
  { key: 'downloads', label: 'Most Downloaded' },
  { key: 'views',     label: 'Most Viewed'     },
  { key: 'likes',     label: 'Most Liked'      },
  { key: 'rating',    label: 'Top Rated'       },
];

export const COLOR_SWATCHES = [
  { key: 'black',  hex: '#111111', label: 'Black'  },
  { key: 'white',  hex: '#e5e7eb', label: 'White'  },
  { key: 'gray',   hex: '#9ca3af', label: 'Gray'   },
  { key: 'red',    hex: '#ef4444', label: 'Red'    },
  { key: 'orange', hex: '#f97316', label: 'Orange' },
  { key: 'yellow', hex: '#eab308', label: 'Yellow' },
  { key: 'green',  hex: '#22c55e', label: 'Green'  },
  { key: 'blue',   hex: '#3b82f6', label: 'Blue'   },
  { key: 'purple', hex: '#a855f7', label: 'Purple' },
  { key: 'pink',   hex: '#ec4899', label: 'Pink'   },
  { key: 'brown',  hex: '#92400e', label: 'Brown'  },
  { key: 'gold',   hex: '#f59e0b', label: 'Gold'   },
] as const;

type HomepageSection = 'home' | 'browse';

@Component({
  selector: 'amx-vectors',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vectors.component.html',
  styleUrl: './vectors.component.scss',
})
export class VectorsComponent implements OnInit, OnDestroy {
  readonly svc  = inject(VectorsService);
  private router = inject(Router);
  readonly auth  = inject(AuthService);

  // ── View mode ─────────────────────────────────────────────────────────────
  readonly section = signal<HomepageSection>('home');
  readonly viewMode = signal<VectorViewMode>('masonry');

  // ── Search ────────────────────────────────────────────────────────────────
  readonly searchQuery     = signal('');
  readonly searchFocused   = signal(false);
  readonly aiSearch        = signal(false);

  // ── Sidebar ───────────────────────────────────────────────────────────────
  readonly sidebarOpen     = signal(true);
  readonly openSections    = signal(new Set<string>(['format','style','license','orientation']));

  // ── Asset detail panel ────────────────────────────────────────────────────
  readonly selectedAsset   = signal<VectorAsset | null>(null);
  readonly detailTab       = signal<'info' | 'similar' | 'creator'>('info');
  readonly reportOpen      = signal(false);
  readonly reportReason    = signal('');
  readonly collectionOpen  = signal(false);
  readonly newColName      = signal('');

  // ── Bulk select ───────────────────────────────────────────────────────────
  readonly bulkMode        = signal(false);
  readonly bulkSelected    = signal(new Set<string>());

  // ── Pagination ────────────────────────────────────────────────────────────
  readonly visibleCount = signal(PAGE_SIZE);
  readonly results      = this.svc.filtered;
  readonly visibleResults = computed(() => this.results().slice(0, this.visibleCount()));
  readonly hasMore      = computed(() => this.results().length > this.visibleCount());

  // ── Sort dropdown ─────────────────────────────────────────────────────────
  readonly sortOpen = signal(false);

  // ── Hover card ────────────────────────────────────────────────────────────
  readonly hoveredId = signal<string | null>(null);

  // ── Quick download format picker ─────────────────────────────────────────
  readonly downloadPickerFor = signal<string | null>(null);

  // ── Exposed constants ─────────────────────────────────────────────────────
  readonly formatOptions      = FORMAT_OPTIONS;
  readonly styleOptions       = STYLE_OPTIONS;
  readonly licenseOptions     = LICENSE_OPTIONS;
  readonly orientationOptions = ORIENTATION_OPTIONS;
  readonly sortOptions        = SORT_OPTIONS;
  readonly colorSwatches      = COLOR_SWATCHES;
  readonly trendingTags       = TRENDING_TAGS;
  readonly trendingColors     = TRENDING_COLORS;
  readonly seasonalCollections = SEASONAL_COLLECTIONS;
  readonly categories         = this.svc.categories;

  // ── Home sections ─────────────────────────────────────────────────────────
  readonly featuredVectors  = this.svc.featuredVectors;
  readonly trendingToday    = this.svc.trendingToday;
  readonly newArrivals      = this.svc.newArrivals;
  readonly mostDownloaded   = this.svc.mostDownloaded;
  readonly mostLiked        = this.svc.mostLiked;
  readonly staffPicks       = this.svc.staffPicks;
  readonly aiGenerated      = this.svc.aiGenerated;
  readonly freeVectors      = this.svc.freeVectors;
  readonly premiumVectors   = this.svc.premiumVectors;
  readonly recentlyViewed   = this.svc.recentlyViewedAssets;
  readonly relatedTags      = this.svc.relatedTags;
  readonly recentSearches   = this.svc.recentSearches;

  // ── Derived ───────────────────────────────────────────────────────────────
  readonly currentSort = computed(() => {
    const f = this.svc.filters();
    return SORT_OPTIONS.find(s => s.key === f.sort) || SORT_OPTIONS[0];
  });

  readonly activeFilterCount = computed(() => {
    const f = this.svc.filters();
    let n = 0;
    if (f.formats.length) n += f.formats.length;
    if (f.style) n++;
    if (f.license) n++;
    if (f.orientation) n++;
    if (f.complexity) n++;
    if (f.colorMode) n++;
    if (f.color) n++;
    if (f.isAiGenerated !== null) n++;
    if (f.isAnimated !== null) n++;
    if (f.dateAdded !== 'all') n++;
    return n;
  });

  readonly similar = computed(() => {
    const a = this.selectedAsset();
    return a ? this.svc.getSimilar(a) : [];
  });

  readonly creatorOther = computed(() => {
    const a = this.selectedAsset();
    return a ? this.svc.getByCreator(a.creator.id, a.id) : [];
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {}
  ngOnDestroy(): void {
    // Always restore body scroll on route change, even if panel was open
    document.body.style.overflow = '';
  }

  // ── Search ────────────────────────────────────────────────────────────────
  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (!value) this.svc.setFilter('query', '');
  }

  onSearchSubmit(): void {
    const q = this.searchQuery().trim();
    if (q) {
      this.svc.addRecentSearch(q);
      this.svc.setFilter('query', q);
      this.section.set('browse');
      this.visibleCount.set(PAGE_SIZE);
    }
  }

  onSearchKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') this.onSearchSubmit();
    if (e.key === 'Escape') this.searchFocused.set(false);
  }

  applyRecentSearch(q: string): void {
    this.searchQuery.set(q);
    this.svc.setFilter('query', q);
    this.section.set('browse');
    this.searchFocused.set(false);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.svc.setFilter('query', '');
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  browseCategory(catId: string): void {
    this.svc.resetFilters();
    this.svc.setFilter('categoryId', catId);
    this.section.set('browse');
    this.visibleCount.set(PAGE_SIZE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  browseTag(tag: string): void {
    this.svc.setFilter('query', tag);
    this.searchQuery.set(tag);
    this.section.set('browse');
    this.visibleCount.set(PAGE_SIZE);
  }

  browseColor(hex: string): void {
    this.svc.setFilter('color', hex);
    this.section.set('browse');
    this.visibleCount.set(PAGE_SIZE);
  }

  browseSeasonal(colId: string): void {
    this.svc.resetFilters();
    this.svc.setFilter('categoryId', colId);
    this.section.set('browse');
    this.visibleCount.set(PAGE_SIZE);
  }

  goHome(): void {
    this.svc.resetFilters();
    this.searchQuery.set('');
    this.section.set('home');
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  toggleFormat(fmt: VectorFormat): void {
    const f = this.svc.filters();
    const next = f.formats.includes(fmt)
      ? f.formats.filter(x => x !== fmt)
      : [...f.formats, fmt];
    this.svc.setFilter('formats', next);
  }

  setStyle(style: VectorStyle | null): void {
    this.svc.setFilter('style', style);
  }

  setLicense(lic: VectorLicense | null): void {
    this.svc.setFilter('license', lic);
  }

  setOrientation(o: VectorOrientation | null): void {
    this.svc.setFilter('orientation', o);
  }

  setSort(s: VectorSortMode): void {
    this.svc.setFilter('sort', s);
    this.sortOpen.set(false);
  }

  setComplexity(c: 'beginner' | 'medium' | 'advanced' | null): void {
    this.svc.setFilter('complexity', c);
  }

  toggleAiFilter(): void {
    const cur = this.svc.filters().isAiGenerated;
    this.svc.setFilter('isAiGenerated', cur === true ? null : true);
  }

  toggleAnimatedFilter(): void {
    const cur = this.svc.filters().isAnimated;
    this.svc.setFilter('isAnimated', cur === true ? null : true);
  }

  toggleFavoritesOnly(): void {
    this.svc.setFilter('favoritesOnly', !this.svc.filters().favoritesOnly);
  }

  setDateAdded(d: 'all' | 'today' | 'week' | 'month'): void {
    this.svc.setFilter('dateAdded', d);
  }

  resetFilters(): void {
    this.svc.resetFilters();
    this.searchQuery.set('');
    this.visibleCount.set(PAGE_SIZE);
  }

  toggleSection(sec: string): void {
    this.openSections.update(s => {
      const next = new Set(s);
      next.has(sec) ? next.delete(sec) : next.add(sec);
      return next;
    });
  }

  isSectionOpen(sec: string): boolean {
    return this.openSections().has(sec);
  }

  // ── Asset actions ─────────────────────────────────────────────────────────
  openDetail(asset: VectorAsset): void {
    this.selectedAsset.set(asset);
    this.detailTab.set('info');
    this.svc.trackView(asset.id);
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.selectedAsset.set(null);
    this.reportOpen.set(false);
    this.collectionOpen.set(false);
    document.body.style.overflow = '';
  }

  toggleFavorite(id: string, e: Event): void {
    e.stopPropagation();
    this.svc.toggleFavorite(id);
  }

  isFav(id: string): boolean {
    return this.svc.isFavorite(id);
  }

  downloadAsset(asset: VectorAsset, fmt: VectorFormat = 'svg', e?: Event): void {
    e?.stopPropagation();
    if (asset.isPremium && !this.auth.isPremium()) {
      this.router.navigate(['/pricing']);
      return;
    }
    // Client-side: create a placeholder SVG download
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${asset.width} ${asset.height}"><rect width="100%" height="100%" fill="${asset.dominantColors[0] || '#3B82F6'}" rx="12"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="32" fill="white">${asset.name}</text></svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${asset.slug}.${fmt}`; a.click();
    URL.revokeObjectURL(url);
    this.downloadPickerFor.set(null);
  }

  openInEditor(asset: VectorAsset, e?: Event): void {
    e?.stopPropagation();
    this.router.navigate(['/editor'], { queryParams: { vectorId: asset.id } });
  }

  // ── Bulk select ───────────────────────────────────────────────────────────
  toggleBulk(id: string, e: Event): void {
    e.stopPropagation();
    this.bulkSelected.update(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  bulkDownload(): void {
    const ids = [...this.bulkSelected()];
    ids.forEach(id => {
      const a = this.svc.allAssets().find(x => x.id === id);
      if (a) this.downloadAsset(a);
    });
    this.bulkSelected.set(new Set());
    this.bulkMode.set(false);
  }

  // ── Load more ─────────────────────────────────────────────────────────────
  loadMore(): void {
    this.visibleCount.update(n => n + PAGE_SIZE);
  }

  // ── Collections ───────────────────────────────────────────────────────────
  addToCollection(colId: string, assetId: string): void {
    this.svc.addToCollection(colId, assetId);
    this.collectionOpen.set(false);
  }

  createAndAddCollection(): void {
    const name = this.newColName().trim();
    if (!name) return;
    this.svc.createCollection(name);
    const col = this.svc.collections().at(-1);
    const asset = this.selectedAsset();
    if (col && asset) this.svc.addToCollection(col.id, asset.id);
    this.newColName.set('');
    this.collectionOpen.set(false);
  }

  // ── Report ────────────────────────────────────────────────────────────────
  submitReport(): void {
    this.reportOpen.set(false);
    this.reportReason.set('');
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      if (this.selectedAsset()) { this.closeDetail(); return; }
      if (this.sortOpen()) { this.sortOpen.set(false); return; }
    }
    if (e.key === 'ArrowRight' && this.selectedAsset()) this.navigateDetail(1);
    if (e.key === 'ArrowLeft'  && this.selectedAsset()) this.navigateDetail(-1);
  }

  navigateDetail(dir: 1 | -1): void {
    const cur = this.selectedAsset();
    if (!cur) return;
    const list = this.visibleResults();
    const idx = list.findIndex(a => a.id === cur.id);
    const next = list[idx + dir];
    if (next) this.openDetail(next);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  }

  formatBytes(kb: number): string {
    if (kb >= 1024) return (kb / 1024).toFixed(1) + ' MB';
    return kb + ' KB';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  stars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  trackById(_: number, a: VectorAsset): string { return a.id; }

  getCategoryLabel(catId: string): string {
    return this.categories().find(c => c.id === catId)?.label ?? catId;
  }

  clearBulkSelected(): void {
    this.bulkSelected.set(new Set());
  }
}
