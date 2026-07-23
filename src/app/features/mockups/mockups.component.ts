import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
  HostListener, OnInit, OnDestroy,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  MockupAsset, MockupCategory, MockupCategoryMeta, MockupSceneType, MockupOrientation,
  MockupLicense, MockupSortMode, MockupViewMode, MockupFormat,
} from '../../core/models/mockup.model';
import { AuthService } from '../../core/auth/auth.service';
import { MockuuupsApiService } from '../../core/services/mockuuups-api.service';
import { MockAnythingApiService, MockProductBrief, MockProductDetail, MockStyle } from '../../core/services/mock-anything-api.service';
import { MockupsFacade } from './services/mockups-facade.service';
import { EditorState as EditorStateI, DEFAULT_EDITOR } from './services/mockups-editor.service';

export type DownloadQuality = 'png' | 'jpg' | 'pdf' | 'psd' | 'svg' | 'webp';

export const FORMAT_LABELS: Record<DownloadQuality, string> = {
  png: 'PNG', jpg: 'JPG', pdf: 'PDF', psd: 'PSD', svg: 'SVG', webp: 'WebP',
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
  { key: 'png', label: 'PNG' }, { key: 'jpg', label: 'JPG' },
  { key: 'psd', label: 'PSD' }, { key: 'pdf', label: 'PDF' },
  { key: 'svg', label: 'SVG' }, { key: 'webp', label: 'WebP' },
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

const PAGE_SIZE = 24;

@Component({
  selector: 'amx-mockups',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mockups.component.html',
  styleUrl: './mockups.component.scss',
})
export class MockupsComponent implements OnInit, OnDestroy {
  readonly facade   = inject(MockupsFacade);
  private router   = inject(Router);
  private location = inject(Location);
  readonly auth    = inject(AuthService);
  private mkuApi   = inject(MockuuupsApiService);
  private mockApi  = inject(MockAnythingApiService);

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
  editorState     = signal<EditorStateI>({ ...DEFAULT_EDITOR });
  dragOver        = signal(false);
  aiPrompt        = signal('');
  aiGenerating    = signal(false);
  aiFeature       = signal<'generate' | 'products'>('generate');
  lightboxOpen    = signal(false);

  aiProducts      = signal<MockProductBrief[]>([]);
  aiProductDetail = signal<MockProductDetail | null>(null);
  aiStyles        = signal<MockStyle[]>([]);
  aiSelectedStyle = signal<string>('baseline');
  aiSearchQuery   = signal('');
  aiSearching     = signal(false);
  aiResultUrl     = signal<string | null>(null);
  aiTaskId        = signal<string | null>(null);
  aiPollTimer: ReturnType<typeof setInterval> | null = null;

  readonly loading        = this.facade.loading;
  readonly apiLoading     = this.facade.loading;
  readonly apiLoaded      = this.facade.loaded;
  readonly apiError       = this.facade.error;
  readonly filterState    = this.facade.filterService.filter;
  readonly favorites      = this.facade.persistence.favorites;
  readonly collections    = this.facade.persistence.collections;
  readonly recentSearches = this.facade.persistence.recentSearches;
  readonly assets         = this.facade.assets;

  readonly allCategories  = this.facade.categories;
  readonly trendingTags   = this.facade.trendingTags;

  readonly featuredAssets    = this.facade.featuredAssets;
  readonly trendingAssets    = this.facade.trendingAssets;
  readonly editorsPickAssets = this.facade.editorsPickAssets;
  readonly staffPickAssets   = this.facade.staffPickAssets;
  readonly newAssets         = this.facade.newAssets;
  readonly freeAssets        = this.facade.freeAssets;
  readonly premiumAssets     = this.facade.premiumAssets;
  readonly aiAssets          = this.facade.aiAssets;
  readonly deviceAssets      = this.facade.deviceAssets;
  readonly apparelAssets     = this.facade.apparelAssets;
  readonly packagingAssets   = this.facade.packagingAssets;
  readonly brandingAssets    = this.facade.brandingAssets;
  readonly mostDownloaded    = this.facade.mostDownloaded;

  readonly filteredAssets = this.facade.filteredAssets;
  readonly displayedCount = signal(PAGE_SIZE);
  readonly displayedAssets = computed(() => this.filteredAssets().slice(0, this.displayedCount()));
  readonly hasMore = computed(() => this.filteredAssets().length > this.displayedCount());

  readonly similarAssets = computed(() => {
    const a = this.selectedAsset();
    return a ? this.facade.getSimilar(a) : [];
  });

  readonly recentlyViewed = computed(() => this.facade.getRecentlyViewed());

  readonly sceneOptions       = SCENE_OPTIONS;
  readonly orientationOptions = ORIENTATION_OPTIONS;
  readonly sortOptions        = SORT_OPTIONS;
  readonly licenseOptions     = LICENSE_OPTIONS;
  readonly formatOptions      = FORMAT_OPTIONS;
  readonly bgColors           = BG_COLORS;

  readonly activeFilterCount = computed(() => {
    const f = this.filterState();
    return [
      !!f.categoryId, !!f.subcategoryId, !!f.sceneType, !!f.orientation,
      !!f.license, f.formats.length > 0, f.isAiGenerated !== null,
      !!f.bgColor, f.dateAdded !== 'all', f.favoritesOnly, !!f.creatorId,
    ].filter(Boolean).length;
  });

  renderLoading   = signal(false);
  renderError     = signal<string | null>(null);
  renderResultUrl = signal<string | null>(null);
  private _designFile: File | null = null;

  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private _searchVal = '';

  ngOnInit(): void {
    if (this.collections().length === 0) {
      this.facade.persistence.createCollection('Favorites');
      this.facade.persistence.createCollection('Brand Mockups');
    }
    this.facade.loadMockups();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.aiPollTimer) clearInterval(this.aiPollTimer);
  }

  goHome(): void {
    this.view.set('home');
    this.selectedAsset.set(null);
    this.facade.filterService.resetFilter();
  }

  goBrowse(categoryId?: MockupCategory): void {
    if (categoryId) this.facade.filterService.setFilter({ categoryId, subcategoryId: null });
    this.view.set('browse');
    this.selectedAsset.set(null);
    this.displayedCount.set(PAGE_SIZE);
  }

  openAsset(asset: MockupAsset): void {
    this.selectedAsset.set(asset);
    this.detailTab.set('info');
    this.selectedPreview.set(0);
    this.facade.persistence.addRecentlyViewed(asset.id);
  }

  closeAsset(): void { this.selectedAsset.set(null); }

  openEditor(asset?: MockupAsset): void {
    if (asset) this.selectedAsset.set(asset);
    this.editorState.set({ ...DEFAULT_EDITOR });
    this.showEditor.set(true);
  }

  closeEditor(): void { this.showEditor.set(false); }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this._searchVal = val;
    this.facade.filterService.setFilter({ query: val });
    if (!val) return;
    this.view.set('browse');
    this.displayedCount.set(PAGE_SIZE);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this._searchVal.trim()) {
      this.facade.persistence.addRecentSearch(this._searchVal.trim());
      this.searchFocused.set(false);
      this.view.set('browse');
    }
  }

  applyRecentSearch(q: string): void {
    this._searchVal = q;
    this.facade.filterService.setFilter({ query: q });
    this.facade.persistence.addRecentSearch(q);
    this.searchFocused.set(false);
    this.view.set('browse');
    this.displayedCount.set(PAGE_SIZE);
  }

  applyTag(tag: string): void {
    this._searchVal = tag;
    this.facade.filterService.setFilter({ query: tag });
    this.view.set('browse');
    this.displayedCount.set(PAGE_SIZE);
  }

  setSort(s: MockupSortMode): void { this.facade.filterService.setFilter({ sort: s }); }
  setCategory(id: MockupCategory | null): void { this.facade.filterService.setFilter({ categoryId: id, subcategoryId: null }); this.displayedCount.set(PAGE_SIZE); }
  setSubcategory(id: string | null): void { this.facade.filterService.setFilter({ subcategoryId: id }); this.displayedCount.set(PAGE_SIZE); }
  setScene(s: MockupSceneType | null): void { this.facade.filterService.setFilter({ sceneType: s }); }
  setOrientation(o: MockupOrientation | null): void { this.facade.filterService.setFilter({ orientation: o }); }
  setLicense(l: MockupLicense | null): void { this.facade.filterService.setFilter({ license: l }); }
  setDateAdded(d: 'all' | 'today' | 'week' | 'month'): void { this.facade.filterService.setFilter({ dateAdded: d }); }
  setAiFilter(v: boolean | null): void { this.facade.filterService.setFilter({ isAiGenerated: v }); }
  setBgColor(hex: string | null): void { this.facade.filterService.setFilter({ bgColor: hex }); }
  toggleFormat(fmt: MockupFormat): void {
    const cur = this.filterState().formats;
    this.facade.filterService.setFilter({ formats: cur.includes(fmt) ? cur.filter(f => f !== fmt) : [...cur, fmt] });
  }
  toggleFavoritesOnly(): void { this.facade.filterService.setFilter({ favoritesOnly: !this.filterState().favoritesOnly }); }
  resetFilters(): void { this.facade.filterService.resetFilter(); this.displayedCount.set(PAGE_SIZE); }

  loadMore(): void { this.displayedCount.update(n => n + PAGE_SIZE); }

  toggleFav(asset: MockupAsset, event?: MouseEvent): void {
    event?.stopPropagation();
    this.facade.persistence.toggleFavorite(asset.id);
    this.showToast(this.facade.persistence.isFavorite(asset.id) ? 'Added to favorites' : 'Removed from favorites');
  }
  isFav(id: string): boolean { return this.facade.persistence.isFavorite(id); }

  openCollModal(event?: MouseEvent): void { event?.stopPropagation(); this.showCollModal.set(true); }
  closeCollModal(): void { this.showCollModal.set(false); this.newCollName.set(''); }

  addToCollection(colId: string): void {
    const a = this.selectedAsset();
    if (a) { this.facade.persistence.addToCollection(colId, a.id); this.showToast('Added to collection'); }
    this.closeCollModal();
  }

  createCollection(): void {
    const name = this.newCollName().trim();
    if (!name) return;
    this.facade.persistence.createCollection(name);
    this.newCollName.set('');
    this.showToast('Collection created');
  }

  downloadAsset(asset: MockupAsset, fmt = 'png', event?: MouseEvent): void {
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
    const assets = ids.map(id => this.facade.getById(id)).filter(Boolean) as MockupAsset[];
    const locked = assets.find(a => a.isPremium && !this.auth.isPremium());
    if (locked) { this.showToast('Unlock Premium to bulk download premium mockups'); return; }
    assets.forEach(a => this.downloadAsset(a));
    this.showToast(`Downloading ${assets.length} mockups…`);
  }

  toggleBulk(): void { this.bulkMode.update(v => !v); this.selectedBulk.set(new Set()); }
  toggleBulkSelect(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedBulk.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  isSelected(id: string): boolean { return this.selectedBulk().has(id); }

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

  patchEditor(patch: Partial<EditorStateI>): void { this.editorState.update(s => ({ ...s, ...patch })); }
  resetEditor(): void { this.editorState.set({ ...DEFAULT_EDITOR }); }

  autoFit(): void {
    this.editorState.update(s => ({ ...s, scaleX: 100, scaleY: 100, posX: 50, posY: 50, rotation: 0 }));
    this.showToast('Design auto-fitted to smart object area');
  }

  applyToEditor(): void { this.showEditor.set(false); this.showToast('Mockup customized — ready to download!'); }

  async renderWithApi(): Promise<void> {
    const asset = this.selectedAsset() as any;
    if (!asset) return;
    const file = this._designFile;
    if (!file) { this.showToast('Please upload a design image first'); return; }
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
      const designUrl = await this.mkuApi.uploadDesignToTemp(file);
      this.showToast('Rendering your mockup via Mockuuups API…');
      const placements: any[] = asset.placements ?? [];
      this.mkuApi.renderMockup({
        mockup: mockuuupsId,
        format: 'image/webp',
        destination: 'cdn',
        cdn: { expiration: '1 day' },
        contents: placements.length > 0
          ? placements.map(() => ({ type: 'image' as const, url: designUrl }))
          : [{ type: 'image' as const, url: designUrl }],
      }).subscribe({
        next: (res: any) => {
          const url = res?.url ?? res?.result?.url;
          if (url) { this.renderResultUrl.set(url); this.showToast('Mockup rendered — scroll down to download!'); }
          else { this.renderError.set('Render succeeded but no URL was returned'); }
          this.renderLoading.set(false);
        },
        error: (err) => {
          const msg = err?.error?.message ?? err?.message ?? 'Render failed';
          this.renderError.set(msg); this.showToast(`Render error: ${msg}`); this.renderLoading.set(false);
        },
      });
    } catch (err: any) {
      const msg = err?.message ?? 'Upload failed';
      this.renderError.set(msg); this.showToast(`Upload error: ${msg}`); this.renderLoading.set(false);
    }
  }

  downloadAiResult(): void {
    const url = this.aiResultUrl();
    if (!url) return;
    const link = document.createElement('a');
    link.href = url; link.download = `ai-mockup-${Date.now()}.png`; link.target = '_blank'; link.click();
  }

  openAiPanel(): void { this.showAiPanel.set(true); this.loadAiStyles(); }

  closeAiPanel(): void {
    this.showAiPanel.set(false);
    this.aiProducts.set([]); this.aiProductDetail.set(null);
    this.aiResultUrl.set(null); this.aiTaskId.set(null);
    if (this.aiPollTimer) { clearInterval(this.aiPollTimer); this.aiPollTimer = null; }
  }

  downloadRendered(): void {
    const url = this.renderResultUrl();
    if (!url) return;
    const link = document.createElement('a');
    link.href = url; link.download = `${this.selectedAsset()?.slug ?? 'mockup'}-rendered.webp`; link.target = '_blank'; link.click();
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

  generateAiMockup(): void {
    const prompt = this.aiPrompt().trim();
    if (!prompt) { this.showToast('Please describe the mockup you need'); return; }
    if (!this.aiProductDetail()) { this.showToast('Please select a product first'); return; }
    this.aiGenerating.set(true); this.aiResultUrl.set(null); this.aiTaskId.set(null);
    this.showToast('AI is generating your mockup…');
    this.mockApi.createMockup({
      product_id: this.aiProductDetail()!.uuid,
      style_id: this.aiSelectedStyle(),
      prompt, format: 'png', width: 1024, height: 1024,
    }).subscribe({
      next: (res) => { this.aiTaskId.set(res.task_id); this.pollAiStatus(res.task_id); },
      error: (err) => { this.aiGenerating.set(false); this.showToast(err?.error?.message ?? err?.message ?? 'AI generation failed'); },
    });
  }

  private pollAiStatus(taskId: string): void {
    this.aiPollTimer = setInterval(() => {
      this.mockApi.getStatus(taskId).subscribe({
        next: (data) => {
          if (data.state === 'SUCCESS') { this.aiResultUrl.set(data.image_url); this.aiGenerating.set(false); this.showToast('AI mockup ready!'); if (this.aiPollTimer) { clearInterval(this.aiPollTimer); this.aiPollTimer = null; } }
          else if (data.state === 'FAILURE') { this.aiGenerating.set(false); this.showToast('AI generation failed'); if (this.aiPollTimer) { clearInterval(this.aiPollTimer); this.aiPollTimer = null; } }
        },
        error: () => { if (this.aiPollTimer) { clearInterval(this.aiPollTimer); this.aiPollTimer = null; } },
      });
    }, 3000);
  }

  searchAiProducts(): void {
    const q = this.aiSearchQuery().trim();
    if (!q) return;
    this.aiSearching.set(true);
    this.mockApi.searchProducts(q).subscribe({
      next: (products) => { this.aiProducts.set(products); this.aiSearching.set(false); },
      error: () => { this.aiSearching.set(false); this.showToast('Product search failed'); },
    });
  }

  selectAiProduct(uuid: string): void {
    this.aiProductDetail.set(null);
    this.mockApi.getProduct(uuid).subscribe({
      next: (detail) => { this.aiProductDetail.set(detail); this.aiResultUrl.set(null); },
      error: () => this.showToast('Failed to load product details'),
    });
  }

  loadAiStyles(): void {
    if (this.aiStyles().length) return;
    this.mockApi.getStyles().subscribe({
      next: (styles) => this.aiStyles.set(styles),
      error: () => {},
    });
  }

  toggleAiSearch(): void { this.aiSearchMode.update(v => !v); }
  setViewMode(m: MockupViewMode): void { this.viewMode.set(m); }
  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }

  showToast(msg: string): void {
    this.toastMsg.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMsg.set(null), 3000);
  }

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
    if (d < 7) return `${d} days ago`;
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
    return this.allCategories().find((c: MockupCategoryMeta) => c.id === catId)?.subcategories ?? [];
  }

  getCategoryCount(id: MockupCategory): number {
    return this.allCategories().find((c: MockupCategoryMeta) => c.id === id)?.count ?? 0;
  }

  getCategoryLabel(id: MockupCategory): string {
    return this.allCategories().find((c: MockupCategoryMeta) => c.id === id)?.label ?? id;
  }

  getRelatedTags(): string[] {
    const freq: Record<string, number> = {};
    this.filteredAssets().forEach((a: MockupAsset) => a.tags.forEach((t: string) => { freq[t] = (freq[t] ?? 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 16).map(e => e[0]);
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

  clearRecentSearches(): void {
    this.facade.persistence.clearRecentSearches();
  }

  setFilter(patch: Record<string, unknown>): void {
    this.facade.filterService.setFilter(patch as any);
  }

  goBack(): void { this.location.back(); }
}
