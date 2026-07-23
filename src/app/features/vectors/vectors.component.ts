import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
  HostListener, OnInit, OnDestroy, ElementRef, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { VectorsService, TRENDING_TAGS, TRENDING_COLORS, SEASONAL_COLLECTIONS } from './vectors.service';
import {
  VectorAsset, VectorFormat, VectorStyle, VectorLicense,
  VectorOrientation, VectorComplexity, VectorSortMode, VectorViewMode,
  VectorColorMode,
} from '../../core/models/vector.model';
import { AuthService } from '../../core/auth/auth.service';
import { DownloadTrackingService } from '../../core/services/download-tracking.service';

// ── AI Generation types ────────────────────────────────────────────────────────
export interface AiGeneratedVector {
  id: string;
  prompt: string;
  svgContent: string;
  style: VectorStyle;
  aspect: 'landscape' | 'portrait' | 'square';
  colors: string[];
  createdAt: string;
}

// ── Creator Upload form ───────────────────────────────────────────────────────
export interface UploadFormData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  tags: string;
  style: VectorStyle;
  license: VectorLicense;
  formats: VectorFormat[];
  isPremium: boolean;
  price: number;
  fileDataUrl: string;
  fileName: string;
}

// ── Download quality ──────────────────────────────────────────────────────────
export type DownloadQuality = 'original' | 'small' | 'medium' | 'large' | 'web' | 'print' | 'transparent';

export const DOWNLOAD_QUALITY_OPTIONS: { key: DownloadQuality; label: string; desc: string; suffix: string }[] = [
  { key: 'original',    label: 'Original',       desc: 'Full resolution, uncompressed',   suffix: '' },
  { key: 'small',       label: 'Small',          desc: '72 DPI · web thumbnails',          suffix: '_72' },
  { key: 'medium',      label: 'Medium',         desc: '150 DPI · presentations',          suffix: '_150' },
  { key: 'large',       label: 'Large',          desc: '300 DPI · high-res output',        suffix: '_300' },
  { key: 'web',         label: 'Web Optimized',  desc: 'Compressed, fast loading',         suffix: '_web' },
  { key: 'print',       label: 'Print Quality',  desc: '600 DPI · press-ready',            suffix: '_print' },
  { key: 'transparent', label: 'Transparent PNG', desc: 'No background, .png only',       suffix: '_transparent' },
];

// ── Collaboration types ───────────────────────────────────────────────────────
export interface CollabMember {
  id: string; name: string; avatar: string; role: 'owner' | 'editor' | 'viewer'; color: string;
}
export interface CollabHistoryEntry {
  id: string; user: string; avatar: string; action: string; timestamp: string;
}
export interface CollabComment {
  id: string; user: string; avatar: string; text: string; resolved: boolean; timestamp: string;
}

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
  readonly svc       = inject(VectorsService);
  private router     = inject(Router);
  readonly auth      = inject(AuthService);
  private sanitizer  = inject(DomSanitizer);
  private tracker    = inject(DownloadTrackingService);

  // ── Service proxies (avoids direct signal mutation from templates) ──────────
  readonly collections    = this.svc.collections;
  readonly recentSearches = this.svc.recentSearches;

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
  readonly detailTab       = signal<'info' | 'similar' | 'creator' | 'collab'>('info');
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
  readonly imageSearching   = signal(false);
  readonly loadMoreLoading  = signal(false);

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

  // ── AI Generation ─────────────────────────────────────────────────────────
  readonly aiGenOpen       = signal(false);
  readonly aiPrompt        = signal('');
  readonly aiGenStyle      = signal<VectorStyle>('flat');
  readonly aiGenAspect     = signal<'landscape' | 'portrait' | 'square'>('landscape');
  readonly aiColorTheme    = signal('#3B82F6');
  readonly aiGenerating    = signal(false);
  readonly aiGenResults    = signal<AiGeneratedVector[]>([]);
  readonly aiGenTab        = signal<'generate' | 'history' | 'settings'>('generate');
  readonly aiSelectedResult = signal<AiGeneratedVector | null>(null);
  readonly aiModel         = signal<'fast' | 'quality' | 'creative'>('quality');
  readonly aiStyleOptions: { key: VectorStyle; label: string; icon: string }[] = [
    { key: 'flat',        label: 'Flat',       icon: '◼' },
    { key: 'outline',     label: 'Outline',    icon: '◻' },
    { key: 'isometric',   label: 'Isometric',  icon: '⬡' },
    { key: 'minimal',     label: 'Minimal',    icon: '▫' },
    { key: 'cartoon',     label: 'Cartoon',    icon: '😊' },
    { key: 'gradient',    label: 'Gradient',   icon: '🌈' },
    { key: 'hand-drawn',  label: 'Hand Drawn', icon: '✏️' },
    { key: '3d',          label: '3D Render',  icon: '🎲' },
  ];
  readonly aiPromptSuggestions = [
    'A vibrant abstract wave pattern with blue and purple gradients',
    'Flat icons set for mobile app navigation',
    'Isometric office workspace illustration',
    'Minimal geometric logo mark',
    'Hand-drawn botanical flowers',
    'Futuristic tech circuit board',
    'Cute cartoon animals for kids app',
    'Clean business infographic elements',
  ];

  // ── Creator Studio ────────────────────────────────────────────────────────
  readonly creatorOpen   = signal(false);
  readonly creatorView   = signal<'portfolio' | 'upload' | 'analytics' | 'earnings' | 'settings'>('portfolio');
  readonly myUploads     = signal<VectorAsset[]>([]);

  // ── Creator settings (persisted to localStorage) ──────────────────────────
  private static readonly CREATOR_SETTINGS_KEY = 'amx_vec_creator_settings';
  readonly creatorSettingsName    = signal('You');
  readonly creatorSettingsBio     = signal('');
  readonly creatorSettingsWebsite = signal('');
  readonly notifyDownloads        = signal(true);
  readonly notifyPayouts          = signal(true);
  readonly uploadOpen    = signal(false);
  readonly uploadStep    = signal<1 | 2 | 3>(1);
  readonly uploadPreview = signal<string>('');
  readonly uploadForm    = signal<UploadFormData>({
    name: '', description: '', category: '', subcategory: '',
    tags: '', style: 'flat', license: 'free',
    formats: ['svg'], isPremium: false, price: 0,
    fileDataUrl: '', fileName: '',
  });
  readonly uploadDragOver = signal(false);

  // ── Download quality ──────────────────────────────────────────────────────
  readonly downloadQuality      = signal<DownloadQuality>('original');
  readonly downloadQualityOpen  = signal(false);
  readonly downloadQualityOptions = DOWNLOAD_QUALITY_OPTIONS;

  // ── Collaboration ─────────────────────────────────────────────────────────
  readonly collabOpen    = signal(false);
  readonly collabTab     = signal<'team' | 'history' | 'comments' | 'versions'>('team');
  readonly collabInvite  = signal('');
  readonly collabComment = signal('');
  readonly mockCollabMembers = signal<CollabMember[]>([
    { id: 'm1', name: 'You',       avatar: 'https://i.pravatar.cc/32?img=20', role: 'owner',  color: '#f5820a' },
    { id: 'm2', name: 'StudioPix', avatar: 'https://i.pravatar.cc/32?img=1',  role: 'editor', color: '#3B82F6' },
    { id: 'm3', name: 'FlatCraft', avatar: 'https://i.pravatar.cc/32?img=4',  role: 'viewer', color: '#10B981' },
  ]);
  readonly mockCollabHistory = signal<CollabHistoryEntry[]>([
    { id: 'h1', user: 'You',       avatar: 'https://i.pravatar.cc/32?img=20', action: 'Created this vector',              timestamp: '2 hours ago' },
    { id: 'h2', user: 'StudioPix', avatar: 'https://i.pravatar.cc/32?img=1',  action: 'Changed fill color to #3B82F6',    timestamp: '1 hour ago' },
    { id: 'h3', user: 'FlatCraft', avatar: 'https://i.pravatar.cc/32?img=4',  action: 'Added comment on the background',  timestamp: '45 min ago' },
    { id: 'h4', user: 'You',       avatar: 'https://i.pravatar.cc/32?img=20', action: 'Resized to 1400×900px',            timestamp: '30 min ago' },
    { id: 'h5', user: 'StudioPix', avatar: 'https://i.pravatar.cc/32?img=1',  action: 'Approved changes',                 timestamp: '15 min ago' },
  ]);
  readonly mockCollabComments = signal<CollabComment[]>([
    { id: 'cc1', user: 'StudioPix', avatar: 'https://i.pravatar.cc/32?img=1',  text: 'The gradient transition looks great here!', resolved: false, timestamp: '1 hour ago' },
    { id: 'cc2', user: 'FlatCraft', avatar: 'https://i.pravatar.cc/32?img=4',  text: 'Can we try a darker shade for the background?', resolved: false, timestamp: '50 min ago' },
    { id: 'cc3', user: 'You',       avatar: 'https://i.pravatar.cc/32?img=20', text: 'Updated — let me know if this works.', resolved: true, timestamp: '20 min ago' },
  ]);
  readonly mockVersions = [
    { id: 'v3', label: 'v3 — Latest', user: 'You', timestamp: '30 min ago', isCurrent: true },
    { id: 'v2', label: 'v2 — After color update', user: 'StudioPix', timestamp: '1 hour ago', isCurrent: false },
    { id: 'v1', label: 'v1 — Initial upload', user: 'You', timestamp: '2 hours ago', isCurrent: false },
  ];

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
  private static readonly UPLOADS_KEY = 'amx_vec_my_uploads';

  ngOnInit(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(VectorsComponent.UPLOADS_KEY) || '[]');
      if (Array.isArray(saved) && saved.length) {
        this.myUploads.set(saved);
        saved.forEach((a: VectorAsset) => this.svc.addUploadedAsset(a));
      }
    } catch {}
    try {
      const cs = JSON.parse(localStorage.getItem(VectorsComponent.CREATOR_SETTINGS_KEY) || 'null');
      if (cs) {
        if (cs.name     != null) this.creatorSettingsName.set(cs.name);
        if (cs.bio      != null) this.creatorSettingsBio.set(cs.bio);
        if (cs.website  != null) this.creatorSettingsWebsite.set(cs.website);
        if (cs.notifyDownloads != null) this.notifyDownloads.set(cs.notifyDownloads);
        if (cs.notifyPayouts   != null) this.notifyPayouts.set(cs.notifyPayouts);
      }
    } catch {}
  }

  saveCreatorSettings(): void {
    try {
      localStorage.setItem(VectorsComponent.CREATOR_SETTINGS_KEY, JSON.stringify({
        name:            this.creatorSettingsName(),
        bio:             this.creatorSettingsBio(),
        website:         this.creatorSettingsWebsite(),
        notifyDownloads: this.notifyDownloads(),
        notifyPayouts:   this.notifyPayouts(),
      }));
    } catch {}
    this.showToast('Settings saved!');
  }

  private _saveUploads(): void {
    try { localStorage.setItem(VectorsComponent.UPLOADS_KEY, JSON.stringify(this.myUploads())); } catch {}
  }
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
    if (!q) return;
    this.svc.addRecentSearch(q);
    this.svc.setFilter('query', q);
    if (this.aiSearch()) {
      // AI search: broaden by clearing active category/format restrictions so
      // token matching across all categories is possible
      this.svc.setFilter('categoryId', null);
      this.svc.setFilter('formats', []);
    }
    this.section.set('browse');
    this.searchFocused.set(false);
    this.visibleCount.set(PAGE_SIZE);
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
    this.visibleCount.set(PAGE_SIZE);
  }

  /** Called from hero format chips — also switches to browse view. */
  toggleFormatFromHero(fmt: VectorFormat): void {
    this.toggleFormat(fmt);
    this.section.set('browse');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setStyle(style: VectorStyle | null): void {
    this.svc.setFilter('style', style);
    this.visibleCount.set(PAGE_SIZE);
  }

  setLicense(lic: VectorLicense | null): void {
    this.svc.setFilter('license', lic);
    this.visibleCount.set(PAGE_SIZE);
  }

  setOrientation(o: VectorOrientation | null): void {
    this.svc.setFilter('orientation', o);
    this.visibleCount.set(PAGE_SIZE);
  }

  setSort(s: VectorSortMode): void {
    this.svc.setFilter('sort', s);
    this.sortOpen.set(false);
    this.visibleCount.set(PAGE_SIZE);
  }

  setComplexity(c: 'beginner' | 'medium' | 'advanced' | null): void {
    this.svc.setFilter('complexity', c);
    this.visibleCount.set(PAGE_SIZE);
  }

  toggleAiFilter(): void {
    const cur = this.svc.filters().isAiGenerated;
    this.svc.setFilter('isAiGenerated', cur === true ? null : true);
    this.visibleCount.set(PAGE_SIZE);
  }

  toggleAnimatedFilter(): void {
    const cur = this.svc.filters().isAnimated;
    this.svc.setFilter('isAnimated', cur === true ? null : true);
    this.visibleCount.set(PAGE_SIZE);
  }

  toggleFavoritesOnly(): void {
    this.svc.setFilter('favoritesOnly', !this.svc.filters().favoritesOnly);
    this.visibleCount.set(PAGE_SIZE);
  }

  setDateAdded(d: 'all' | 'today' | 'week' | 'month'): void {
    this.svc.setFilter('dateAdded', d);
    this.visibleCount.set(PAGE_SIZE);
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
    this.downloadPickerFor.set(null);
    this.tracker.record({
      assetId: asset.id,
      assetTitle: asset.name,
      assetType: 'vector',
      format: fmt.toUpperCase(),
      fileSize: fmt === 'png' ? 1_800_000 : fmt === 'pdf' ? 3_200_000 : 420_000,
    });
    void this._fetchAndDownload(asset.previewUrl, `${asset.slug}.${fmt}`,
      `Downloaded "${asset.name}" as ${fmt.toUpperCase()}`);
  }

  private async _fetchAndDownload(src: string, filename: string, toastMsg: string): Promise<void> {
    try {
      const res = await fetch(src, { mode: 'cors' });
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      // Cross-origin fallback: open in a new tab so the browser's save-as dialog takes over
      const a = document.createElement('a');
      a.href = src; a.target = '_blank'; a.rel = 'noopener'; a.click();
    }
    this.showToast(toastMsg);
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
    rec.onerror = (ev: any) => {
      this.voiceActive.set(false);
      const errorMap: Record<string, string> = {
        'no-speech':          'No speech detected — please try again.',
        'audio-capture':      'Microphone not available. Check your permissions.',
        'not-allowed':        'Microphone access denied. Allow it in browser settings.',
        'network':            'Network error during voice recognition.',
        'service-not-allowed':'Voice search service is not allowed.',
      };
      const msg = errorMap[ev.error] ?? `Voice search error: ${ev.error ?? 'unknown'}`;
      this.showToast(msg);
    };
    rec.onend = () => this.voiceActive.set(false);
    rec.start();
  }

  // ── Image search (file picker) ────────────────────────────────────────────
  triggerImageSearch(): void {
    if (this.imageSearching()) return;
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showToast('Unsupported file type. Please upload an image.');
        return;
      }
      // Validate file size
      if (file.size > MAX_SIZE_BYTES) {
        this.showToast('Image is too large. Please upload a file under 10 MB.');
        return;
      }

      this.imageSearching.set(true);
      // Extract dominant color from the uploaded image and use it as a color filter
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 50; canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 50, 50);
          const data = ctx.getImageData(25, 25, 1, 1).data;
          const hex = `#${data[0].toString(16).padStart(2,'0')}${data[1].toString(16).padStart(2,'0')}${data[2].toString(16).padStart(2,'0')}`;
          this.svc.setFilter('color', hex);
          this.section.set('browse');
          this.visibleCount.set(PAGE_SIZE);
          this.showToast('Filtering by dominant color extracted from your image');
        }
        URL.revokeObjectURL(objectUrl);
        this.imageSearching.set(false);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        this.imageSearching.set(false);
        this.showToast('Could not read the image file. Please try a different image.');
      };
      img.src = objectUrl;
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
    this.visibleCount.set(PAGE_SIZE);
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

      await Promise.all(eligible.map(async asset => {
        try {
          const res = await fetch(asset.previewUrl);
          if (!res.ok) throw new Error();
          const blob = await res.blob();
          const ext = blob.type.includes('svg') ? 'svg' : blob.type.includes('png') ? 'png' : 'jpg';
          folder.file(`${asset.slug}.${ext}`, blob);
        } catch {
          // If the preview URL fails, skip this asset silently
        }
      }));

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
    if (this.loadMoreLoading()) return;
    this.loadMoreLoading.set(true);
    setTimeout(() => {
      this.visibleCount.update(n => n + PAGE_SIZE);
      this.loadMoreLoading.set(false);
    }, 400);
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
    const asset = this.selectedAsset();
    const entry = {
      assetId:    asset?.id   ?? 'unknown',
      assetName:  asset?.name ?? 'unknown',
      reason:     this.reportReason(),
      reportedAt: new Date().toISOString(),
    };
    try {
      const stored: typeof entry[] = JSON.parse(localStorage.getItem('amx_vec_reports') || '[]');
      stored.push(entry);
      localStorage.setItem('amx_vec_reports', JSON.stringify(stored));
    } catch {}
    this.reportOpen.set(false);
    this.reportReason.set('');
    this.showToast('Report submitted. Thank you for helping keep Amarapix safe.');
  }

  // ── AI Generation ─────────────────────────────────────────────────────────
  openAiGen(): void { this.aiGenOpen.set(true); document.body.style.overflow = 'hidden'; }
  closeAiGen(): void { this.aiGenOpen.set(false); document.body.style.overflow = ''; }

  setAiPromptSuggestion(s: string): void { this.aiPrompt.set(s); }

  generateAiVector(): void {
    const prompt = this.aiPrompt().trim();
    if (!prompt) return;
    this.aiGenerating.set(true);
    // Client-side SVG generation based on prompt parameters
    const colors = this._pickAiColors();
    const results: AiGeneratedVector[] = Array.from({ length: 4 }, (_, i) => ({
      id: `ai-${Date.now()}-${i}`,
      prompt,
      svgContent: this._buildAiSvg(prompt, this.aiGenStyle(), colors, i),
      style: this.aiGenStyle(),
      aspect: this.aiGenAspect(),
      colors,
      createdAt: new Date().toISOString(),
    }));
    this.aiGenResults.set(results);
    this.aiGenerating.set(false);
    this.showToast('Generated 4 SVG variations from your prompt');
  }

  private _pickAiColors(): string[] {
    const theme = this.aiColorTheme();
    const palettes: string[][] = [
      ['#3B82F6','#6366F1','#8B5CF6'],
      ['#F97316','#EF4444','#FBBF24'],
      ['#10B981','#059669','#34D399'],
      ['#EC4899','#F43F5E','#FB7185'],
      ['#8B5CF6','#A855F7','#C084FC'],
      ['#14B8A6','#0EA5E9','#38BDF8'],
    ];
    if (theme) return [theme, this._lighten(theme), this._darken(theme)];
    return palettes[Math.floor(Math.random() * palettes.length)];
  }

  private _lighten(hex: string): string {
    try {
      const n = parseInt(hex.replace('#',''), 16);
      const r = Math.min(255, ((n >> 16) & 0xff) + 60);
      const g = Math.min(255, ((n >> 8) & 0xff) + 60);
      const b = Math.min(255, (n & 0xff) + 60);
      return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    } catch { return '#6366F1'; }
  }

  private _darken(hex: string): string {
    try {
      const n = parseInt(hex.replace('#',''), 16);
      const r = Math.max(0, ((n >> 16) & 0xff) - 60);
      const g = Math.max(0, ((n >> 8) & 0xff) - 60);
      const b = Math.max(0, (n & 0xff) - 60);
      return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    } catch { return '#1D4ED8'; }
  }

  private _buildAiSvg(prompt: string, style: VectorStyle, colors: string[], variant: number): string {
    const [c1, c2, c3] = colors;
    const shapes: string[] = [];
    const seed = prompt.length + variant * 37;

    if (style === 'gradient' || variant === 0) {
      shapes.push(`<defs><linearGradient id="g${variant}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${c1}"/><stop offset="100%" style="stop-color:${c2}"/></linearGradient></defs>`);
      shapes.push(`<rect width="400" height="300" fill="url(#g${variant})" rx="16"/>`);
    } else {
      shapes.push(`<rect width="400" height="300" fill="${c3 || '#f0f4ff'}" rx="16"/>`);
    }

    const count = 5 + (seed % 8);
    for (let i = 0; i < count; i++) {
      const x = (seed * (i+1) * 43) % 360;
      const y = (seed * (i+1) * 17) % 260;
      const r = 20 + (seed * (i+1)) % 60;
      const opacity = 0.15 + (i % 5) * 0.1;
      const fill = i % 2 === 0 ? c1 : c2;
      if (style === 'outline') {
        shapes.push(`<circle cx="${x + 20}" cy="${y + 20}" r="${r}" fill="none" stroke="${fill}" stroke-width="2.5" opacity="${opacity + 0.3}"/>`);
      } else if (style === 'isometric') {
        const sx = x + 20, sy = y + 20;
        shapes.push(`<polygon points="${sx},${sy - r} ${sx + r * 0.866},${sy + r * 0.5} ${sx - r * 0.866},${sy + r * 0.5}" fill="${fill}" opacity="${opacity + 0.3}"/>`);
      } else {
        shapes.push(`<circle cx="${x + 20}" cy="${y + 20}" r="${r}" fill="${fill}" opacity="${opacity}"/>`);
      }
    }

    const label = prompt.length > 22 ? prompt.slice(0, 22) + '…' : prompt;
    shapes.push(`<text x="200" y="270" text-anchor="middle" font-family="sans-serif" font-size="11" fill="${c1}" opacity="0.7">${label}</text>`);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${shapes.join('')}</svg>`;
  }

  selectAiResult(v: AiGeneratedVector): void { this.aiSelectedResult.set(v); }

  downloadAiVector(v: AiGeneratedVector): void {
    const blob = new Blob([v.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amx-ai-${v.id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('AI vector downloaded!');
  }

  openAiResultInEditor(v: AiGeneratedVector): void {
    this.closeAiGen();
    const params: Record<string, string> = { aiPrompt: v.prompt, aiStyle: v.style };
    this.router.navigate(['/editor'], { queryParams: params });
  }

  // ── Creator Studio ────────────────────────────────────────────────────────
  openCreatorStudio(): void {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/auth/login']); return; }
    this.creatorOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeCreatorStudio(): void {
    this.creatorOpen.set(false);
    document.body.style.overflow = '';
  }

  setCreatorView(view: 'portfolio' | 'upload' | 'analytics' | 'earnings' | 'settings'): void {
    this.creatorView.set(view);
    if (view === 'upload') this.uploadStep.set(1);
  }

  onUploadDrop(e: DragEvent): void {
    e.preventDefault();
    this.uploadDragOver.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this._readUploadFile(file);
  }

  onUploadFilePick(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this._readUploadFile(file);
  }

  private _readUploadFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      this.uploadPreview.set(data);
      this.uploadForm.update(f => ({
        ...f,
        fileDataUrl: data,
        fileName: file.name,
        formats: this._formatsFromName(file.name),
      }));
      this.uploadStep.set(2);
    };
    reader.readAsDataURL(file);
  }

  private _formatsFromName(name: string): VectorFormat[] {
    const ext = name.split('.').pop()?.toLowerCase() as VectorFormat;
    const valid: VectorFormat[] = ['svg','eps','ai','pdf','cdr','dxf','png'];
    return valid.includes(ext) ? [ext, 'png'] : ['svg','png'];
  }

  updateUploadForm(key: keyof UploadFormData, value: any): void {
    this.uploadForm.update(f => ({ ...f, [key]: value }));
  }

  submitUpload(): void {
    const form = this.uploadForm();
    if (!form.name.trim() || !form.category) { this.showToast('Please fill in required fields'); return; }
    const newAsset: VectorAsset = {
      id: `upload-${Date.now()}`,
      slug: form.name.toLowerCase().replace(/\s+/g, '-'),
      name: form.name,
      description: form.description,
      category: form.category,
      categoryLabel: form.category.charAt(0).toUpperCase() + form.category.slice(1),
      subcategory: form.subcategory || undefined,
      previewUrl: form.fileDataUrl || 'https://picsum.photos/seed/upload1/400/300',
      thumbUrl: form.fileDataUrl || 'https://picsum.photos/seed/upload1/200/150',
      dominantColors: ['#3B82F6','#6366F1'],
      formats: form.formats.length ? form.formats : ['svg'],
      style: form.style,
      license: form.license,
      orientation: 'landscape',
      complexity: 'medium',
      colorMode: 'multi',
      isPremium: form.isPremium,
      isFree: !form.isPremium,
      isAiGenerated: false,
      isAnimated: false,
      isNew: true,
      isStaffPick: false,
      isEditorsChoice: false,
      downloads: 0, likes: 0, views: 0, rating: 0, ratingCount: 0, comments: 0,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      width: 1200, height: 800, fileSize: 256,
      creator: { id: 'me', name: 'You', avatar: 'https://i.pravatar.cc/40?img=20', isVerified: false, followers: 0, totalAssets: 0 },
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.myUploads.update(u => [newAsset, ...u]);
    this.svc.addUploadedAsset(newAsset);
    this._saveUploads();
    this.uploadStep.set(3);
    this.showToast('Asset submitted for review!');
  }

  resetUpload(): void {
    this.uploadForm.set({ name:'', description:'', category:'', subcategory:'', tags:'', style:'flat', license:'free', formats:['svg'], isPremium:false, price:0, fileDataUrl:'', fileName:'' });
    this.uploadPreview.set('');
    this.uploadStep.set(1);
  }

  deleteMyUpload(id: string): void {
    this.myUploads.update(u => u.filter(x => x.id !== id));
    this._saveUploads();
    this.showToast('Upload removed.');
  }

  // ── Earnings — computed from uploaded assets ──────────────────────────────
  private static readonly RATE_FREE    = 0.01;   // $0.01 per free download
  private static readonly RATE_PREMIUM = 0.70;   // 70% of $2.99 default price

  readonly earnings = computed(() => {
    const uploads = this.myUploads();
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    // Seed base amounts so the chart is never empty on first open
    const base: Record<string, number> = { Jan:0, Feb:0, Mar:12.50, Apr:34, May:58.25, Jun:89.75 };
    const totals: Record<string, number> = { ...base };

    uploads.forEach(asset => {
      const dl = asset.downloads;
      const perDl = asset.isPremium
        ? 2.99 * VectorsComponent.RATE_PREMIUM
        : VectorsComponent.RATE_FREE;
      const assetTotal = dl * perDl;
      // Distribute linearly over recent months
      const uploadDate = new Date(asset.uploadedAt);
      const monthKey = MONTHS[uploadDate.getMonth()];
      totals[monthKey] = (totals[monthKey] ?? 0) + assetTotal;
    });

    // Return last 7 months
    const result: { month: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = MONTHS[d.getMonth()];
      result.push({ month: key, amount: Math.round((totals[key] ?? 0) * 100) / 100 });
    }
    return result;
  });

  /** @deprecated alias kept for template compat */
  get mockEarnings() { return this.earnings(); }

  readonly totalEarnings = computed(() => this.earnings().reduce((s, e) => s + e.amount, 0));
  readonly pendingPayout = computed(() => {
    const total = this.totalEarnings();
    return total > 0 ? Math.max(0, total * 0.15) : 0; // ~15% pending
  });
  readonly barMax = computed(() => Math.max(1, ...this.earnings().map(e => e.amount)));

  earningsBarHeight(amount: number): number {
    return Math.round((amount / this.barMax()) * 120);
  }

  // ── Payout setup ──────────────────────────────────────────────────────────
  readonly payoutsOpen     = signal(false);
  readonly payoutStep      = signal<1 | 2>(1);
  readonly payoutMethod    = signal<'bank' | 'mobile' | 'paypal'>('bank');
  readonly payoutAccHolder = signal('');
  readonly payoutAccNumber = signal('');
  readonly payoutBankName  = signal('');
  readonly payoutPhone     = signal('');
  readonly payoutEmail     = signal('');
  readonly payoutSaving    = signal(false);
  readonly payoutDone      = signal(false);

  private static readonly PAYOUT_KEY = 'amx_payout_setup';

  readonly payoutSaved = computed<{ method: string; masked: string } | null>(() => {
    // Recompute when payoutDone changes (just a trigger)
    this.payoutDone();
    try {
      const raw = localStorage.getItem(VectorsComponent.PAYOUT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  openPayouts(): void {
    this.payoutStep.set(1);
    this.payoutMethod.set('bank');
    this.payoutAccHolder.set('');
    this.payoutAccNumber.set('');
    this.payoutBankName.set('');
    this.payoutPhone.set('');
    this.payoutEmail.set('');
    this.payoutSaving.set(false);
    this.payoutDone.set(false);
    this.payoutsOpen.set(true);
  }

  payoutNext(): void { this.payoutStep.set(2); }
  payoutBack(): void { this.payoutStep.set(1); }

  payoutConfirm(): void {
    this.payoutSaving.set(true);
    setTimeout(() => {
      const method  = this.payoutMethod();
      const masked  = method === 'paypal'
        ? this.payoutEmail()
        : method === 'mobile'
          ? '**** ' + this.payoutPhone().slice(-4)
          : '**** ' + this.payoutAccNumber().replace(/\s/g, '').slice(-4);
      try {
        localStorage.setItem(VectorsComponent.PAYOUT_KEY, JSON.stringify({ method, masked }));
      } catch {}
      this.payoutSaving.set(false);
      this.payoutDone.set(true);
      setTimeout(() => this.payoutsOpen.set(false), 2000);
    }, 900);
  }

  // ── Download quality ──────────────────────────────────────────────────────
  getQualityLabel(key: DownloadQuality): string {
    return DOWNLOAD_QUALITY_OPTIONS.find(q => q.key === key)?.label ?? key;
  }

  downloadWithQuality(asset: VectorAsset, fmt: VectorFormat, quality: DownloadQuality): void {
    if (asset.isPremium && !this.auth.isPremium()) {
      this.router.navigate(['/pricing']); return;
    }
    const suffix = DOWNLOAD_QUALITY_OPTIONS.find(q => q.key === quality)?.suffix ?? '';
    const ext = fmt === 'png' || quality === 'transparent' ? 'png' : fmt;
    const label = DOWNLOAD_QUALITY_OPTIONS.find(q => q.key === quality)?.label ?? quality;
    this.downloadQualityOpen.set(false);
    void this._fetchAndDownload(asset.previewUrl, `${asset.slug}${suffix}.${ext}`,
      `Downloaded "${asset.name}" — ${label}`);
  }

  // ── Collaboration ─────────────────────────────────────────────────────────
  openCollab(): void { this.collabOpen.set(true); this.collabTab.set('team'); }
  closeCollab(): void { this.collabOpen.set(false); }

  inviteCollaborator(): void {
    const email = this.collabInvite().trim();
    if (!email) return;
    this.showToast(`Invitation sent to ${email}`);
    this.collabInvite.set('');
  }

  submitCollabComment(): void {
    const text = this.collabComment().trim();
    if (!text) return;
    this.mockCollabComments.update(c => [
      { id: `cc-${Date.now()}`, user: 'You', avatar: 'https://i.pravatar.cc/32?img=20',
        text, resolved: false, timestamp: 'Just now' },
      ...c,
    ]);
    this.collabComment.set('');
    this.showToast('Comment added!');
  }

  resolveCollabComment(id: string): void {
    this.mockCollabComments.update(c => c.map(x => x.id === id ? { ...x, resolved: true } : x));
  }

  restoreVersion(id: string): void {
    this.showToast(`Restored to ${this.mockVersions.find(v => v.id === id)?.label ?? 'version'}`);
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
      if (this.aiGenOpen())      { this.closeAiGen(); return; }
      if (this.creatorOpen())    { this.closeCreatorStudio(); return; }
      if (this.collectionOpen()) { this.collectionOpen.set(false); return; }
      if (this.reportOpen())     { this.reportOpen.set(false); return; }
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
