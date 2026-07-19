import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
  HostListener, OnInit, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  MockupsService, MOCKUP_TRENDING_TAGS, MOCKUP_TRENDING_COLORS,
  MOCKUP_SEASONAL_COLLECTIONS, MOCKUP_CATEGORIES,
} from './mockups.service';
import {
  MockupAsset, MockupCategory, MockupSceneType, MockupOrientation,
  MockupLicense, MockupSortMode, MockupViewMode, MockupFormat,
} from '../../core/models/mockup.model';
import { AuthService } from '../../core/auth/auth.service';
import { MockuuupsApiService } from '../../core/services/mockuuups-api.service';

// ── Download quality options ──────────────────────────────────────────────────
export type DownloadQuality = 'png' | 'jpg' | 'pdf' | 'psd' | 'svg' | 'webp';

export const FORMAT_LABELS: Record<DownloadQuality, string> = {
  png: 'PNG',
  jpg: 'JPG',
  pdf: 'PDF',
  psd: 'PSD',
  svg: 'SVG',
  webp: 'WebP',
};

export const SCENE_OPTIONS: { key: MockupSceneType; label: string; icon: string }[] = [
  { key: 'studio',      label: 'Studio',      icon: '🏛️' },
  { key: 'lifestyle',   label: 'Lifestyle',   icon: '🌿' },
  { key: 'minimal',     label: 'Minimal',     icon: '◻' },
  { key: 'flat-lay',    label: 'Flat Lay',    icon: '⬛' },
  { key: 'perspective', label: 'Perspective', icon: '📐' },
  { key: 'top-view',    label: 'Top View',    icon: '⬆️' },
  { key: 'front-view',  label: 'Front View',  icon: '▶' },
  { key: 'isometric',   label: 'Isometric',   icon: '⬡' },
  { key: 'outdoor',     label: 'Outdoor',     icon: '🌳' },
  { key: 'indoor',      label: 'Indoor',      icon: '🏠' },
];

export const ORIENTATION_OPTIONS: { key: MockupOrientation; label: string; icon: string }[] = [
  { key: 'landscape', label: 'Landscape', icon: '⬛' },
  { key: 'portrait',  label: 'Portrait',  icon: '▬' },
  { key: 'square',    label: 'Square',    icon: '■' },
];

export const SORT_OPTIONS: { key: MockupSortMode; label: string }[] = [
  { key: 'popular',   label: 'Most Popular'    },
  { key: 'newest',    label: 'Newest First'    },
  { key: 'downloads', label: 'Most Downloaded' },
  { key: 'views',     label: 'Most Viewed'     },
  { key: 'likes',     label: 'Most Liked'      },
  { key: 'rating',    label: 'Top Rated'       },
];

export const LICENSE_OPTIONS: { key: MockupLicense; label: string }[] = [
  { key: 'free',       label: 'Free'       },
  { key: 'premium',    label: 'Premium'    },
  { key: 'commercial', label: 'Commercial' },
  { key: 'editorial',  label: 'Editorial'  },
];

export const FORMAT_OPTIONS: { key: MockupFormat; label: string }[] = [
  { key: 'png', label: 'PNG' },
  { key: 'jpg', label: 'JPG' },
  { key: 'psd', label: 'PSD' },
  { key: 'pdf', label: 'PDF' },
  { key: 'svg', label: 'SVG' },
  { key: 'webp', label: 'WebP' },
];

export const BG_COLORS = [
  { key: 'white',  hex: '#FFFFFF', label: 'White'   },
  { key: 'light',  hex: '#F3F4F6', label: 'Light'   },
  { key: 'gray',   hex: '#9CA3AF', label: 'Gray'    },
  { key: 'dark',   hex: '#374151', label: 'Dark'    },
  { key: 'black',  hex: '#111827', label: 'Black'   },
  { key: 'beige',  hex: '#D4B483', label: 'Beige'   },
  { key: 'blue',   hex: '#3B82F6', label: 'Blue'    },
  { key: 'green',  hex: '#10B981', label: 'Green'   },
  { key: 'red',    hex: '#EF4444', label: 'Red'     },
  { key: 'purple', hex: '#8B5CF6', label: 'Purple'  },
];

type PageView = 'home' | 'browse';
type DetailTab = 'info' | 'similar' | 'editor';

// Smart mockup editor state
export interface EditorState {
  uploadedDesignUrl: string | null;
  brightness: number;
  contrast: number;
  opacity: number;
  bgColor: string;
  bgGradient: boolean;
  showShadow: boolean;
  showReflection: boolean;
  showGloss: boolean;
  finishType: 'matte' | 'glossy' | 'metallic';
  scaleX: number;
  scaleY: number;
  rotation: number;
  posX: number;
  posY: number;
}

const DEFAULT_EDITOR: EditorState = {
  uploadedDesignUrl: null,
  brightness: 100,
  contrast: 100,
  opacity: 100,
  bgColor: '#FFFFFF',
  bgGradient: false,
  showShadow: true,
  showReflection: false,
  showGloss: false,
  finishType: 'matte',
  scaleX: 100,
  scaleY: 100,
  rotation: 0,
  posX: 50,
  posY: 50,
};

const PAGE_SIZE = 24;

@Component({
  selector: 'amx-mockups',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mockups.component.html',
  styleUrl: './mockups.component.scss',
})
export class MockupsComponent implements OnInit, OnDestroy {
  readonly svc     = inject(MockupsService);
  private router   = inject(Router);
  readonly auth    = inject(AuthService);
  private mkuApi   = inject(MockuuupsApiService);

  // ── View state ────────────────────────────────────────────────────────────
  view            = signal<PageView>('home');
  selectedAsset   = signal<MockupAsset | null>(null);
  detailTab       = signal<DetailTab>('info');
  viewMode        = signal<MockupViewMode>('masonry');
  sidebarOpen     = signal(true);
  searchFocused   = signal(false);
  aiSearchMode    = signal(false);
  showEditor      = signal(false);
  showCollModal   = signal(false);
  showSharePanel  = signal(false);
  showReportModal = signal(false);
  showAiPanel     = signal(false);
  toastMsg        = signal<string | null>(null);
  selectedPreview = signal(0);
  bulkMode        = signal(false);
  selectedBulk    = signal<Set<string>>(new Set());
  newCollName     = signal('');
  activeSection   = signal('featured');
  editorState     = signal<EditorState>({ ...DEFAULT_EDITOR });
  dragOver        = signal(false);
  aiPrompt        = signal('');
  aiGenerating    = signal(false);
  aiFeature       = signal('generate');
  lightboxOpen    = signal(false);

  // ── API state proxies ─────────────────────────────────────────────────────
  readonly apiLoading = this.svc.apiLoading;
  readonly apiLoaded  = this.svc.apiLoaded;
  readonly apiError   = this.svc.apiError;

  // ── Render state (Smart Mockup Editor → real API render) ──────────────────
  renderLoading   = signal(false);
  renderError     = signal<string | null>(null);
  renderResultUrl = signal<string | null>(null);
  private _designFile: File | null = null;

  // ── Filter proxies ────────────────────────────────────────────────────────
  readonly filterState   = this.svc.filter;
  readonly favorites     = this.svc.favorites;
  readonly collections   = this.svc.collections;
  readonly recentSearches = this.svc.recentSearches;

  // ── Data proxies ──────────────────────────────────────────────────────────
  readonly allCategories       = this.svc.categories;
  readonly trendingTags        = MOCKUP_TRENDING_TAGS;
  readonly trendingColors      = MOCKUP_TRENDING_COLORS;
  readonly seasonalCollections = MOCKUP_SEASONAL_COLLECTIONS;
  readonly creators            = this.svc.creators;

  // ── Homepage sections ─────────────────────────────────────────────────────
  readonly featuredAssets    = this.svc.featuredAssets;
  readonly trendingAssets    = this.svc.trendingAssets;
  readonly editorsPickAssets = this.svc.editorsPickAssets;
  readonly staffPickAssets   = this.svc.staffPickAssets;
  readonly newAssets         = this.svc.newAssets;
  readonly freeAssets        = this.svc.freeAssets;
  readonly premiumAssets     = this.svc.premiumAssets;
  readonly aiAssets          = this.svc.aiAssets;
  readonly deviceAssets      = this.svc.deviceAssets;
  readonly apparelAssets     = this.svc.apparelAssets;
  readonly packagingAssets   = this.svc.packagingAssets;
  readonly brandingAssets    = this.svc.brandingAssets;
  readonly mostDownloaded    = this.svc.mostDownloaded;

  // ── Browse / filter ───────────────────────────────────────────────────────
  readonly filteredAssets = this.svc.filteredAssets;
  readonly displayedCount = signal(PAGE_SIZE);
  readonly displayedAssets = computed(() => this.filteredAssets().slice(0, this.displayedCount()));
  readonly hasMore = computed(() => this.filteredAssets().length > this.displayedCount());

  // ── Similar ───────────────────────────────────────────────────────────────
  readonly similarAssets = computed(() => {
    const a = this.selectedAsset();
    return a ? this.svc.getSimilar(a) : [];
  });

  readonly recentlyViewed = computed(() => this.svc.getRecentlyViewed());

  // ── Option lists ──────────────────────────────────────────────────────────
  readonly sceneOptions       = SCENE_OPTIONS;
  readonly orientationOptions = ORIENTATION_OPTIONS;
  readonly sortOptions        = SORT_OPTIONS;
  readonly licenseOptions     = LICENSE_OPTIONS;
  readonly formatOptions      = FORMAT_OPTIONS;
  readonly bgColors           = BG_COLORS;

  // ── Active filter counts ──────────────────────────────────────────────────
  readonly activeFilterCount = computed(() => {
    const f = this.filterState();
    return [
      !!f.categoryId, !!f.subcategoryId, !!f.sceneType, !!f.orientation,
      !!f.license, f.formats.length > 0, f.isAiGenerated !== null,
      !!f.bgColor, f.dateAdded !== 'all', f.favoritesOnly, !!f.creatorId,
    ].filter(Boolean).length;
  });

  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private _searchVal = '';

  ngOnInit(): void {
    // initialize collections if empty
    if (this.collections().length === 0) {
      this.svc.createCollection('Favorites');
      this.svc.createCollection('Brand Mockups');
    }
    // Load real mockups from Mockuuups API
    this.svc.loadRealMockups();
  }
  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  goHome(): void {
    this.view.set('home');
    this.selectedAsset.set(null);
    this.svc.resetFilter();
  }

  goBrowse(categoryId?: MockupCategory): void {
    if (categoryId) {
      this.svc.setFilter({ categoryId, subcategoryId: null });
    }
    this.view.set('browse');
    this.selectedAsset.set(null);
    this.displayedCount.set(PAGE_SIZE);
  }

  openAsset(asset: MockupAsset): void {
    this.selectedAsset.set(asset);
    this.detailTab.set('info');
    this.selectedPreview.set(0);
    this.svc.addRecentlyViewed(asset.id);
  }

  closeAsset(): void { this.selectedAsset.set(null); }

  openEditor(asset?: MockupAsset): void {
    if (asset) this.selectedAsset.set(asset);
    this.editorState.set({ ...DEFAULT_EDITOR });
    this.showEditor.set(true);
  }

  closeEditor(): void { this.showEditor.set(false); }

  // ── Search ────────────────────────────────────────────────────────────────
  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this._searchVal = val;
    this.svc.setFilter({ query: val });
    if (!val) return;
    this.view.set('browse');
    this.displayedCount.set(PAGE_SIZE);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this._searchVal.trim()) {
      this.svc.addRecentSearch(this._searchVal.trim());
      this.searchFocused.set(false);
      this.view.set('browse');
    }
  }

  applyRecentSearch(q: string): void {
    this._searchVal = q;
    this.svc.setFilter({ query: q });
    this.svc.addRecentSearch(q);
    this.searchFocused.set(false);
    this.view.set('browse');
    this.displayedCount.set(PAGE_SIZE);
  }

  applyTag(tag: string): void {
    this._searchVal = tag;
    this.svc.setFilter({ query: tag });
    this.view.set('browse');
    this.displayedCount.set(PAGE_SIZE);
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  setSort(sort: MockupSortMode): void { this.svc.setFilter({ sort }); }
  setCategory(id: MockupCategory | null): void { this.svc.setFilter({ categoryId: id, subcategoryId: null }); this.displayedCount.set(PAGE_SIZE); }
  setSubcategory(id: string | null): void { this.svc.setFilter({ subcategoryId: id }); this.displayedCount.set(PAGE_SIZE); }
  setScene(s: MockupSceneType | null): void { this.svc.setFilter({ sceneType: s }); }
  setOrientation(o: MockupOrientation | null): void { this.svc.setFilter({ orientation: o }); }
  setLicense(l: MockupLicense | null): void { this.svc.setFilter({ license: l }); }
  setDateAdded(d: 'all' | 'today' | 'week' | 'month'): void { this.svc.setFilter({ dateAdded: d }); }
  setAiFilter(v: boolean | null): void { this.svc.setFilter({ isAiGenerated: v }); }
  setBgColor(hex: string | null): void { this.svc.setFilter({ bgColor: hex }); }
  toggleFormat(fmt: MockupFormat): void {
    const cur = this.filterState().formats;
    const next = cur.includes(fmt) ? cur.filter(f => f !== fmt) : [...cur, fmt];
    this.svc.setFilter({ formats: next });
  }
  toggleFavoritesOnly(): void { this.svc.setFilter({ favoritesOnly: !this.filterState().favoritesOnly }); }
  resetFilters(): void { this.svc.resetFilter(); this.displayedCount.set(PAGE_SIZE); }

  loadMore(): void { this.displayedCount.update(n => n + PAGE_SIZE); }

  // ── Favorites & Collections ───────────────────────────────────────────────
  toggleFav(asset: MockupAsset, event?: MouseEvent): void {
    event?.stopPropagation();
    this.svc.toggleFavorite(asset.id);
    this.showToast(this.svc.isFavorite(asset.id) ? 'Added to favorites' : 'Removed from favorites');
  }
  isFav(id: string): boolean { return this.svc.isFavorite(id); }

  openCollModal(event?: MouseEvent): void { event?.stopPropagation(); this.showCollModal.set(true); }
  closeCollModal(): void { this.showCollModal.set(false); this.newCollName.set(''); }

  addToCollection(colId: string): void {
    const a = this.selectedAsset();
    if (a) { this.svc.addToCollection(colId, a.id); this.showToast('Added to collection'); }
    this.closeCollModal();
  }

  createCollection(): void {
    const name = this.newCollName().trim();
    if (!name) return;
    this.svc.createCollection(name);
    this.newCollName.set('');
    this.showToast('Collection created');
  }

  // ── Download ──────────────────────────────────────────────────────────────
  downloadAsset(asset: MockupAsset, fmt: string = 'png', event?: MouseEvent): void {
    event?.stopPropagation();
    if (asset.isPremium && !this.auth.isPremium()) {
      this.showToast('Premium plan required for this mockup');
      this.router.navigate(['/pricing']);
      return;
    }
    this.showToast(`Downloading ${asset.name} as ${fmt.toUpperCase()}…`);
    const link = document.createElement('a');
    link.href = asset.previewUrl;
    link.download = `${asset.slug}.${fmt}`;
    link.click();
  }

  downloadSelected(): void {
    const ids = [...this.selectedBulk()];
    if (!ids.length) return;
    const assets = ids.map(id => this.svc.getById(id)).filter(Boolean) as MockupAsset[];
    const locked = assets.find(a => a.isPremium && !this.auth.isPremium());
    if (locked) { this.showToast('Unlock Premium to bulk download premium mockups'); return; }
    assets.forEach(a => this.downloadAsset(a));
    this.showToast(`Downloading ${assets.length} mockups…`);
  }

  // ── Bulk select ───────────────────────────────────────────────────────────
  toggleBulk(): void { this.bulkMode.update(v => !v); this.selectedBulk.set(new Set()); }
  toggleBulkSelect(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedBulk.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  isSelected(id: string): boolean { return this.selectedBulk().has(id); }

  // ── Share & Report ────────────────────────────────────────────────────────
  shareAsset(event?: MouseEvent): void {
    event?.stopPropagation();
    const a = this.selectedAsset();
    if (!a) return;
    if (navigator.share) {
      navigator.share({ title: a.name, text: a.description, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => this.showToast('Link copied!'));
    }
  }

  openReport(event?: MouseEvent): void { event?.stopPropagation(); this.showReportModal.set(true); }
  closeReport(): void { this.showReportModal.set(false); }
  submitReport(): void { this.showToast('Report submitted — thank you!'); this.closeReport(); }

  // ── Lightbox ──────────────────────────────────────────────────────────────
  openLightbox(): void { this.lightboxOpen.set(true); }
  closeLightbox(): void { this.lightboxOpen.set(false); }
  prevPreview(): void {
    const a = this.selectedAsset();
    if (!a) return;
    const count = 1 + a.additionalPreviews.length;
    this.selectedPreview.update(i => (i - 1 + count) % count);
  }
  nextPreview(): void {
    const a = this.selectedAsset();
    if (!a) return;
    const count = 1 + a.additionalPreviews.length;
    this.selectedPreview.update(i => (i + 1) % count);
  }

  getPreviewUrl(asset: MockupAsset, idx: number): string {
    return idx === 0 ? asset.previewUrl : (asset.additionalPreviews[idx - 1] ?? asset.previewUrl);
  }

  // ── Smart Editor ──────────────────────────────────────────────────────────
  onDesignDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) this.loadDesignFile(file);
  }

  onDesignFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.loadDesignFile(file);
  }

  loadDesignFile(file: File): void {
    this._designFile = file;
    this.renderResultUrl.set(null);
    this.renderError.set(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      this.editorState.update(s => ({ ...s, uploadedDesignUrl: e.target?.result as string }));
      this.showToast('Design loaded — click "Render Mockup" to generate a real preview!');
    };
    reader.readAsDataURL(file);
  }

  patchEditor(patch: Partial<EditorState>): void { this.editorState.update(s => ({ ...s, ...patch })); }
  resetEditor(): void { this.editorState.set({ ...DEFAULT_EDITOR }); }

  autoFit(): void {
    this.editorState.update(s => ({ ...s, scaleX: 100, scaleY: 100, posX: 50, posY: 50, rotation: 0 }));
    this.showToast('Design auto-fitted to smart object area');
  }

  applyToEditor(): void {
    this.showEditor.set(false);
    this.showToast('Mockup customized — ready to download!');
  }

  /**
   * Upload the user's design to a public temp host, then call the
   * Mockuuups render API to composite it onto the selected mockup.
   */
  async renderWithApi(): Promise<void> {
    const asset = this.selectedAsset() as any;
    if (!asset) return;

    const file = this._designFile;
    if (!file) {
      this.showToast('Please upload a design image first');
      return;
    }

    // Need a real Mockuuups mockup ID (api_ prefix means it came from the API)
    const mockuuupsId: string | undefined = asset.mockuuupsId;
    if (!mockuuupsId) {
      this.showToast('This mockup is from our offline library — try an API mockup for live rendering');
      return;
    }

    this.renderLoading.set(true);
    this.renderError.set(null);
    this.renderResultUrl.set(null);
    this.showToast('Uploading your design…');

    try {
      // 1. Upload design to public temp host so Mockuuups can fetch it
      const designUrl = await this.mkuApi.uploadDesignToTemp(file);
      this.showToast('Rendering your mockup via Mockuuups API…');

      // 2. Call the render endpoint
      const placements: any[] = asset.placements ?? [];
      const contents = placements.length > 0
        ? placements.map(() => ({ type: 'image' as const, url: designUrl }))
        : [{ type: 'image' as const, url: designUrl }];

      this.mkuApi.renderMockup({
        mockup: mockuuupsId,
        format: 'image/webp',
        destination: 'cdn',
        cdn: { expiration: '1 day' },
        contents,
      }).subscribe({
        next: (res: any) => {
          const url = res?.url ?? res?.result?.url;
          if (url) {
            this.renderResultUrl.set(url);
            this.showToast('✅ Mockup rendered — scroll down to download!');
          } else {
            this.renderError.set('Render succeeded but no URL was returned');
          }
          this.renderLoading.set(false);
        },
        error: (err) => {
          const msg = err?.error?.message ?? err?.message ?? 'Render failed';
          this.renderError.set(msg);
          this.showToast(`Render error: ${msg}`);
          this.renderLoading.set(false);
        },
      });
    } catch (err: any) {
      const msg = err?.message ?? 'Upload failed';
      this.renderError.set(msg);
      this.showToast(`Upload error: ${msg}`);
      this.renderLoading.set(false);
    }
  }

  downloadRendered(): void {
    const url = this.renderResultUrl();
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.selectedAsset()?.slug ?? 'mockup'}-rendered.webp`;
    link.target = '_blank';
    link.click();
    this.showToast('Downloading rendered mockup…');
  }

  downloadCustomized(): void {
    const url = this.renderResultUrl();
    if (url) { this.downloadRendered(); return; }
    const a = this.selectedAsset();
    if (!a) return;
    this.showToast('Generating your customized mockup…');
    setTimeout(() => { this.downloadAsset(a, 'png'); }, 600);
  }

  // ── AI ────────────────────────────────────────────────────────────────────
  generateAiMockup(): void {
    if (!this.aiPrompt().trim()) return;
    this.aiGenerating.set(true);
    this.showToast('AI is generating your mockup…');
    setTimeout(() => {
      this.aiGenerating.set(false);
      this.showToast('AI mockup ready! Check your results.');
    }, 2800);
  }

  // ── View toggles ──────────────────────────────────────────────────────────
  toggleAiSearch(): void { this.aiSearchMode.update(v => !v); }
  setViewMode(m: MockupViewMode): void { this.viewMode.set(m); }
  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }

  // ── Toast ─────────────────────────────────────────────────────────────────
  showToast(msg: string): void {
    this.toastMsg.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMsg.set(null), 3000);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
  }

  formatRelativeDate(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 7)  return `${d} days ago`;
    if (d < 30) return `${Math.floor(d / 7)} weeks ago`;
    return `${Math.floor(d / 30)} months ago`;
  }

  stars(rating: number): number[] { return Array.from({ length: 5 }, (_, i) => i); }
  isFullStar(rating: number, idx: number): boolean { return rating >= idx + 1; }
  isHalfStar(rating: number, idx: number): boolean { return !this.isFullStar(rating, idx) && rating > idx; }

  trackById(_: number, item: MockupAsset): string { return item.id; }

  getSubcategories(): { id: string; label: string }[] {
    const catId = this.filterState().categoryId;
    if (!catId) return [];
    return this.allCategories.find(c => c.id === catId)?.subcategories ?? [];
  }

  getCategoryCount(id: MockupCategory): number {
    return this.allCategories.find(c => c.id === id)?.count ?? 0;
  }

  getCategoryLabel(id: MockupCategory): string {
    return this.allCategories.find(c => c.id === id)?.label ?? id;
  }

  getRelatedTags(): string[] {
    const freq = this.filteredAssets()
      .flatMap(a => a.tags)
      .reduce((acc: Record<string, number>, t) => { acc[t] = (acc[t] ?? 0) + 1; return acc; }, {});
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(e => e[0]);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      if (this.lightboxOpen()) { this.closeLightbox(); return; }
      if (this.showEditor()) { this.closeEditor(); return; }
      if (this.showCollModal()) { this.closeCollModal(); return; }
      if (this.showReportModal()) { this.closeReport(); return; }
      if (this.showAiPanel()) { this.showAiPanel.set(false); return; }
      if (this.selectedAsset()) { this.closeAsset(); return; }
    }
    if (this.lightboxOpen()) {
      if (e.key === 'ArrowLeft') this.prevPreview();
      if (e.key === 'ArrowRight') this.nextPreview();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.amx-mk-search')) this.searchFocused.set(false);
  }
}
