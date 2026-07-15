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
  readonly featuredVectors     = this.svc.featuredVectors;
  readonly trendingToday       = this.svc.trendingToday;
  readonly trendingWeek        = this.svc.trendingWeek;
  readonly trendingMonth       = this.svc.trendingMonth;
  readonly mostViewed          = this.svc.mostViewed;
  readonly mostLiked           = this.svc.mostLiked;
  readonly editorChoice        = this.svc.editorChoice;
  readonly newArrivals         = this.svc.newArrivals;
  readonly mostDownloaded      = this.svc.mostDownloaded;
  readonly staffPicks          = this.svc.staffPicks;
  readonly aiGenerated         = this.svc.aiGenerated;
  readonly freeVectors         = this.svc.freeVectors;
  readonly premiumVectors      = this.svc.premiumVectors;
  readonly recentlyViewed      = this.svc.recentlyViewedAssets;
  readonly popularCreators     = this.svc.popularCreators;
  readonly featuredCollections = this.svc.featuredCollections;
  readonly relatedTags         = this.svc.relatedTags;
  readonly recentSearches      = this.svc.recentSearches;

  // ── Detail panel extras ───────────────────────────────────────────────────
  readonly zoomOpen        = signal(false);
  readonly downloadSizeFor = signal<string | null>(null);
  readonly commentText     = signal('');
  readonly submittedComments = signal<{ user: string; avatar: string; text: string; time: string }[]>([]);
  readonly mockComments    = [
    { user: 'StudioPix', avatar: 'https://i.pravatar.cc/32?img=1', text: 'Amazing quality! Used this for a client project.', time: '2d ago' },
    { user: 'FlatCraft',  avatar: 'https://i.pravatar.cc/32?img=4', text: 'Clean lines, great color palette. 5 stars!', time: '5d ago' },
    { user: 'VectoArt',  avatar: 'https://i.pravatar.cc/32?img=2', text: 'Love the style. Perfectly editable in the AMX editor.', time: '1w ago' },
  ];

  // ── Star hover state (for interactive rating) ─────────────────────────────
  readonly hoverRating = signal(0);

  // ── Collection management ─────────────────────────────────────────────────
  readonly editColId   = signal<string | null>(null);
  readonly editColName = signal('');

  // ── Voice / image search ──────────────────────────────────────────────────
  readonly voiceActive      = signal(false);
  readonly imageSearchOpen  = signal(false);

  // ── Color mode options ────────────────────────────────────────────────────
  readonly colorModeOptions: { key: string; label: string; icon: string }[] = [
    { key: 'single',   label: 'Single Color',  icon: '◉' },
    { key: 'multi',    label: 'Multi Color',   icon: '◈' },
    { key: 'gradient', label: 'Gradient',       icon: '◑' },
    { key: 'black',    label: 'Black',          icon: '⬛' },
    { key: 'white',    label: 'White',          icon: '⬜' },
  ];

  // ── Toast notification ────────────────────────────────────────────────────
  readonly toastMsg  = signal('');
  readonly toastShow = signal(false);
  private toastTimer: any;

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
    if (f.subcategoryId) n++;
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

  readonly allComments = computed(() => [
    ...this.submittedComments(),
    ...this.mockComments,
  ]);

  readonly starRange = [1, 2, 3, 4, 5];

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {}
  ngOnDestroy(): void {
    document.body.style.overflow = '';
    if (this.toastTimer) clearTimeout(this.toastTimer);
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

  browseSubcategory(catId: string, subId: string): void {
    this.svc.resetFilters();
    this.svc.setFilter('categoryId', catId);
    this.svc.setFilter('subcategoryId', subId);
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
    this.submittedComments.set([]);
    this.hoverRating.set(0);
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
    this.showToast(`Downloaded "${asset.name}" as ${fmt.toUpperCase()}`);
  }

  openInEditor(asset: VectorAsset, e?: Event): void {
    e?.stopPropagation();
    this.router.navigate(['/editor'], { queryParams: { vectorId: asset.id } });
  }

  // ── Share / Copy link ─────────────────────────────────────────────────────
  shareAsset(asset: VectorAsset, e?: Event): void {
    e?.stopPropagation();
    this.copyLinkFor(asset);
  }

  copyLinkFor(asset: VectorAsset): void {
    const url = `${window.location.origin}/vectors/${asset.slug}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    this.showToast('Link copied to clipboard!');
  }

  // ── Follow creator ────────────────────────────────────────────────────────
  followCreator(creatorId: string, e?: Event): void {
    e?.stopPropagation();
    const wasFollowing = this.svc.isFollowing(creatorId);
    this.svc.toggleFollowCreator(creatorId);
    this.showToast(wasFollowing ? 'Unfollowed creator' : 'Now following creator!');
  }

  isFollowing(creatorId: string): boolean {
    return this.svc.isFollowing(creatorId);
  }

  // ── Rating ────────────────────────────────────────────────────────────────
  rateAsset(assetId: string, rating: number): void {
    this.svc.rateAsset(assetId, rating);
    this.hoverRating.set(0);
    this.showToast(`Rated ${rating} star${rating !== 1 ? 's' : ''}!`);
  }

  getUserRating(assetId: string): number {
    return this.svc.getUserRating(assetId);
  }

  getDisplayRating(asset: VectorAsset): number {
    const user = this.getUserRating(asset.id);
    return user > 0 ? user : this.hoverRating() > 0 ? this.hoverRating() : asset.rating;
  }

  // ── Voice search ──────────────────────────────────────────────────────────
  startVoiceSearch(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { this.showToast('Voice search not supported in this browser.'); return; }
    this.voiceActive.set(true);
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.onresult = (ev: any) => {
      const transcript = ev.results[0][0].transcript;
      this.searchQuery.set(transcript);
      this.onSearchSubmit();
      this.voiceActive.set(false);
    };
    rec.onerror = () => this.voiceActive.set(false);
    rec.onend   = () => this.voiceActive.set(false);
    rec.start();
  }

  // ── Image search (file picker) ────────────────────────────────────────────
  triggerImageSearch(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        this.searchQuery.set(`[Image: ${file.name}]`);
        this.svc.addRecentSearch(`Image search: ${file.name}`);
        this.section.set('browse');
        this.visibleCount.set(PAGE_SIZE);
        this.showToast('Image search: showing visually similar results');
      }
    };
    input.click();
  }

  // ── Zoom / fullscreen preview ─────────────────────────────────────────────
  openZoom(): void  { this.zoomOpen.set(true); }
  closeZoom(): void { this.zoomOpen.set(false); }

  // ── Comments ──────────────────────────────────────────────────────────────
  onCommentEnter(e: Event): void {
    const ke = e as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      this.submitComment();
    }
  }

  submitComment(): void {
    const text = this.commentText().trim();
    if (!text) return;
    this.submittedComments.update(prev => [
      { user: 'You', avatar: 'https://i.pravatar.cc/32?img=20', text, time: 'Just now' },
      ...prev,
    ]);
    this.commentText.set('');
    this.showToast('Comment posted!');
  }

  // ── Collection management ─────────────────────────────────────────────────
  startEditCol(col: { id: string; name: string }): void {
    this.editColId.set(col.id);
    this.editColName.set(col.name);
  }

  saveEditCol(): void {
    const id = this.editColId();
    const name = this.editColName().trim();
    if (id && name) { this.svc.renameCollection(id, name); }
    this.editColId.set(null);
    this.editColName.set('');
  }

  deleteCol(colId: string): void {
    this.svc.deleteCollection(colId);
  }

  // ── Color mode filter ─────────────────────────────────────────────────────
  setColorMode(mode: string | null): void {
    this.svc.setFilter('colorMode', mode as any);
  }

  // ── Creator search ────────────────────────────────────────────────────────
  readonly creatorQuery = signal('');

  setCreatorQuery(val: string): void {
    this.creatorQuery.set(val);
    const match = this.svc.allAssets()
      .find(a => a.creator.name.toLowerCase().includes(val.toLowerCase()));
    if (match && val.length > 1) {
      this.svc.setFilter('creatorId', match.creator.id);
    } else if (!val) {
      this.svc.setFilter('creatorId', null);
    }
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

  async bulkDownloadZip(): Promise<void> {
    const ids = [...this.bulkSelected()];
    if (!ids.length) return;

    const isPremiumUser = this.auth.isPremium();
    const allAssets = this.svc.allAssets();

    // Separate free vs. premium assets based on user entitlement
    const eligible: typeof allAssets = [];
    const blocked: typeof allAssets = [];
    for (const id of ids) {
      const asset = allAssets.find(x => x.id === id);
      if (!asset) continue;
      if (asset.isPremium && !isPremiumUser) {
        blocked.push(asset);
      } else {
        eligible.push(asset);
      }
    }

    if (blocked.length > 0 && eligible.length === 0) {
      // All selected are premium — redirect to pricing
      this.showToast(`${blocked.length} asset${blocked.length !== 1 ? 's' : ''} require a Premium subscription.`);
      this.router.navigate(['/pricing']);
      return;
    }

    if (blocked.length > 0) {
      this.showToast(`${blocked.length} premium asset${blocked.length !== 1 ? 's' : ''} skipped — upgrade to include them.`);
    }

    if (!eligible.length) return;

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const folder = zip.folder('amarapix-vectors')!;

      eligible.forEach(asset => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${asset.width} ${asset.height}"><rect width="100%" height="100%" fill="${asset.dominantColors[0] || '#3B82F6'}" rx="12"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="32" fill="white">${asset.name}</text></svg>`;
        folder.file(`${asset.slug}.svg`, svg);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amarapix-vectors-${eligible.length}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast(`Downloaded ${eligible.length} vector${eligible.length !== 1 ? 's' : ''} as ZIP`);
    } catch {
      // Fallback: individual downloads for eligible assets only
      eligible.forEach(asset => this.downloadAsset(asset));
    }

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
    this.showToast('Added to collection!');
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
    this.showToast(`Created collection "${name}"`);
  }

  // ── Report ────────────────────────────────────────────────────────────────
  submitReport(): void {
    this.reportOpen.set(false);
    this.reportReason.set('');
    this.showToast('Report submitted. Thank you for helping keep Amarapix safe.');
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  showToast(msg: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg.set(msg);
    this.toastShow.set(true);
    this.toastTimer = setTimeout(() => this.toastShow.set(false), 3000);
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      if (this.zoomOpen())       { this.closeZoom(); return; }
      if (this.selectedAsset())  { this.closeDetail(); return; }
      if (this.sortOpen())       { this.sortOpen.set(false); return; }
    }
    if (e.key === 'ArrowRight' && this.selectedAsset() && !this.zoomOpen()) this.navigateDetail(1);
    if (e.key === 'ArrowLeft'  && this.selectedAsset() && !this.zoomOpen()) this.navigateDetail(-1);
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
  trackByIdx(i: number): number { return i; }

  getCategoryLabel(catId: string): string {
    return this.categories().find(c => c.id === catId)?.label ?? catId;
  }

  getSubcategories(catId: string): { id: string; label: string }[] {
    return this.categories().find(c => c.id === catId)?.subcategories ?? [];
  }

  getSubcategoryLabel(subId: string): string {
    const catId = this.svc.filters().categoryId;
    if (!catId) return subId;
    const sub = this.categories()
      .find(c => c.id === catId)?.subcategories
      ?.find(s => s.id === subId);
    return sub?.label ?? subId;
  }

  clearBulkSelected(): void {
    this.bulkSelected.set(new Set());
  }
}
