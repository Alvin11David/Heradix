import {
  Component, ChangeDetectionStrategy, HostListener, OnInit,
  inject, signal, computed, effect, ElementRef, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PngService } from './png.service';
import { PngAsset, PngSortMode, PngViewMode, PngCollection } from '../../core/models/png.model';
import { removeBackgroundFromImage, resizeImageToDataUrl } from '../../shared/utils/bg-removal';
import { AuthService } from '../../core/auth/auth.service';
import { DAILY_FREE_DOWNLOAD_LIMIT } from './png.service';
import { estimatePngFileSize, formatFileSize } from '../../shared/utils/file-size-estimate';

const PAGE_SIZE = 32;

const TRENDING_TAGS = [
  'flowers', 'laptop', 'confetti', 'crown', 'car', 'balloons',
  'coffee', 'guitar', 'sunglasses', 'trophy', 'gold', 'dragon',
  'neon', 'diamond', 'flamingo',
];

const SORT_LABELS: Record<PngSortMode, string> = {
  popular:   'Most Popular',
  newest:    'Newest First',
  downloads: 'Most Downloaded',
  views:     'Most Viewed',
};

const SIZE_PRESETS = [
  { label: 'Small',          px: 500,  dim: '500px' },
  { label: 'Medium',         px: 1000, dim: '1000px' },
  { label: 'Large (Original)', px: 0,  dim: 'Full res' },
];

export const COLOR_SWATCHES = [
  { key: 'black',  hex: '#111111', label: 'Black'  },
  { key: 'white',  hex: '#ffffff', label: 'White'  },
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
  { key: 'multi',  hex: 'linear-gradient(135deg,#ef4444,#3b82f6,#22c55e)', label: 'Multicolor' },
] as const;

export const STYLE_OPTIONS = [
  { key: 'photorealistic', label: 'Photo',         icon: '📸' },
  { key: '3d',             label: '3D Render',     icon: '🎲' },
  { key: 'illustration',   label: 'Illustration',  icon: '🎨' },
  { key: 'clipart',        label: 'Clipart',       icon: '✂️' },
  { key: 'flat',           label: 'Flat Design',   icon: '◼' },
  { key: 'cartoon',        label: 'Cartoon',       icon: '😄' },
] as const;

const SIDEBAR_SECTIONS = ['license', 'style', 'orientation', 'color', 'people', 'resolution', 'date'] as const;
type SidebarSection = (typeof SIDEBAR_SECTIONS)[number];


const CURATED_PACKS = [
  { label: 'Holiday & Events',   emoji: '🎄', categoryId: 'holiday',    tag: '' },
  { label: 'Business Essentials',emoji: '💼', categoryId: 'business',   tag: '' },
  { label: 'Animal Kingdom',     emoji: '🐾', categoryId: 'animals',    tag: '' },
  { label: 'Tech & Gadgets',     emoji: '💻', categoryId: 'technology', tag: '' },
  { label: 'Food & Drink',       emoji: '🍕', categoryId: 'food',       tag: '' },
  { label: 'Travel Essentials',  emoji: '✈️', categoryId: 'travel',     tag: '' },
  { label: 'Fashion & Beauty',   emoji: '👗', categoryId: 'fashion',    tag: '' },
  { label: 'Gold & Luxury',      emoji: '✨', categoryId: null,         tag: 'gold' },
] as const;

@Component({
  selector: 'amx-png',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './png.component.html',
  styleUrl: './png.component.scss',
})
export class PngComponent implements OnInit {
  private readonly router  = inject(Router);
  readonly svc             = inject(PngService);
  private readonly auth    = inject(AuthService);

  ngOnInit(): void {
    this.svc.search();
  }


  readonly categories    = this.svc.categories;
  readonly trendingTags  = TRENDING_TAGS;
  readonly sortLabels    = SORT_LABELS;
  readonly sizePresets   = SIZE_PRESETS;
  readonly colorSwatches = COLOR_SWATCHES;
  readonly styleOptions  = STYLE_OPTIONS;
  readonly curatedPacks  = CURATED_PACKS;


  readonly isPremiumUser = this.auth.isPremium;


  readonly freeDownloadsRemaining = this.svc.freeDownloadsRemaining;
  readonly dailyFreeLimit         = DAILY_FREE_DOWNLOAD_LIMIT;


  readonly editorsPicks = this.svc.editorsPicks;


  readonly licenseTier = signal<'standard' | 'extended'>('standard');


  readonly visibleCount   = signal(PAGE_SIZE);
  readonly results        = this.svc.filtered;
  readonly visibleResults = computed(() => this.results().slice(0, this.visibleCount()));
  readonly hasMore        = computed(() => this.results().length > this.visibleCount());


  readonly sidebarOpen    = signal(true);
  readonly mobileSidebar  = signal(false);
  readonly sortMenuOpen   = signal(false);
  readonly viewMode       = this.svc.viewMode;


  readonly expandedSections = signal<Set<SidebarSection>>(
    new Set(['license', 'style', 'orientation', 'color', 'people', 'resolution', 'date'])
  );


  readonly selected     = signal<PngAsset | null>(null);
  readonly selectedSize = signal(SIZE_PRESETS[2]);
  readonly related      = signal<PngAsset[]>([]);
  private readonly _relatedEffect = effect(() => {
    const cur = this.selected();
    if (!cur) { this.related.set([]); return; }
    this.svc.related(cur, 8).then((r) => this.related.set(r));
  });


  readonly selectedIndex = computed<number>(() => {
    const cur = this.selected();
    if (!cur) return -1;
    return this.results().findIndex((p) => p.id === cur.id);
  });
  readonly hasPrev = computed(() => this.selectedIndex() > 0);
  readonly hasNext = computed(() => {
    const i = this.selectedIndex();
    return i >= 0 && i < this.results().length - 1;
  });


  readonly lightboxOpen = signal(false);
  readonly lightboxZoom = signal(false);


  readonly recentAssets = this.svc.recentAssets;


  readonly bulkMode     = signal(false);
  readonly bulkSelected = signal<Set<string>>(new Set());
  readonly bulkCount    = computed(() => this.bulkSelected().size);


  readonly createOpen     = signal(false);
  readonly createStage    = signal<'upload' | 'processing' | 'result' | 'error'>('upload');
  readonly createOriginal = signal<string | null>(null);
  readonly createResult   = signal<string | null>(null);
  readonly createError    = signal<string | null>(null);
  readonly createDragOver = signal(false);
  readonly createProgress = signal(0);
  private cancelRemoval = false;


  readonly collectionsOpen       = signal(false);
  readonly collectionTarget      = signal<PngAsset | null>(null);
  readonly newCollectionName     = signal('');
  readonly showNewCollectionForm = signal(false);


  readonly toast      = signal<{ msg: string; type: 'success' | 'info' } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;


  readonly suggestionsOpen = signal(false);
  readonly suggestions     = computed<string[]>(() => {
    const q = this.svc.filters().query.trim().toLowerCase();
    if (q.length < 2) return [];
    const tags = new Set<string>();
    this.svc.library().forEach((p: PngAsset) => p.tags.forEach((t: string) => { if (t.includes(q)) tags.add(t); }));
    return [...tags].slice(0, 8);
  });


  readonly searchHistory = this.svc.searchHistory;

  readonly showSearchHistory = computed(() => this.suggestionsOpen() && !this.filters().query.trim() && this.searchHistory().length > 0);

  applyHistoryTerm(term: string): void { this.setQuery(term); this.suggestionsOpen.set(false); }
  removeHistoryTerm(term: string, event: Event): void { event.stopPropagation(); this.svc.removeSearchHistoryItem(term); }
  clearSearchHistory(event?: Event): void { event?.stopPropagation(); this.svc.clearSearchHistory(); }


  commitSearch(): void {
    this.svc.trackSearch(this.filters().query);
    this.suggestionsOpen.set(false);
  }


  readonly relatedTags = computed<string[]>(() => this.svc.relatedTags(this.results(), this.filters().query, 16));


  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.lightboxOpen()) { this.closeLightbox(); return; }
    if (this.createOpen()) { this.closeCreateTool(); return; }
    if (this.selected()) { this.closeDetail(); return; }
    if (this.collectionsOpen()) { this.closeCollections(); return; }
    if (this.mobileSidebar()) { this.mobileSidebar.set(false); }
  }

  @HostListener('document:keydown.arrowleft')
  onArrowLeft(): void {
    if (this.selected() && !this.lightboxOpen()) this.goPrev();
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void {
    if (this.selected() && !this.lightboxOpen()) this.goNext();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const t = e.target as HTMLElement;
    if (this.sortMenuOpen() && !t.closest('.amx-png__sort')) this.sortMenuOpen.set(false);
    if (this.suggestionsOpen() && !t.closest('.amx-png__search-wrap')) this.suggestionsOpen.set(false);
  }


  get filters() { return this.svc.filters; }
  get activeFilterCount() { return this.svc.activeFilterCount; }

  setQuery(value: string): void { this.svc.setQuery(value); this.resetPage(); }
  applyTag(tag: string):   void { this.setQuery(tag); this.suggestionsOpen.set(false); }
  applySuggestion(s: string): void { this.applyTag(s); }

  setCategory(id: string | null): void { this.svc.setCategory(id); this.resetPage(); }
  isActiveCategory(id: string): boolean { return this.filters().categoryId === id; }


  applyPack(pack: (typeof CURATED_PACKS)[number]): void {
    this.svc.clearFilters();
    if (pack.categoryId) this.svc.setCategory(pack.categoryId);
    if (pack.tag) this.svc.setQuery(pack.tag);
    this.resetPage();
    document.querySelector('.amx-png__grid-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  setLicense(v: 'all' | 'free' | 'premium'): void { this.svc.setLicense(v); this.resetPage(); }
  setSort(v: PngSortMode): void { this.svc.setSort(v); this.sortMenuOpen.set(false); }
  setViewMode(m: PngViewMode): void { this.svc.setViewMode(m); }
  toggleFavoritesOnly(): void { this.svc.toggleFavoritesOnly(); this.resetPage(); }
  clearFilters(): void { this.svc.clearFilters(); this.resetPage(); }

  toggleStyle(key: string): void { this.svc.setStyle(key as any); this.resetPage(); }
  toggleColorTone(key: string): void { this.svc.setColorTone(key as any); this.resetPage(); }
  setResolution(v: string): void { this.svc.setResolution(v as any); this.resetPage(); }
  setHasPeople(v: string): void { this.svc.setHasPeople(v as any); this.resetPage(); }
  setDateAdded(v: string): void { this.svc.setDateAdded(v as any); this.resetPage(); }
  setOrientation(v: string): void { this.svc.setOrientation(v as any); this.resetPage(); }

  private resetPage(): void { this.visibleCount.set(PAGE_SIZE); }

  loadMore(): void { this.visibleCount.update((v) => v + PAGE_SIZE); }


  toggleSection(s: SidebarSection): void {
    const next = new Set(this.expandedSections());
    if (next.has(s)) next.delete(s); else next.add(s);
    this.expandedSections.set(next);
  }
  isSectionOpen(s: SidebarSection): boolean { return this.expandedSections().has(s); }


  toggleFavorite(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    this.svc.toggleFavorite(png.id);
    this.showToast(this.svc.isFavorite(png.id) ? '❤️ Added to favorites' : 'Removed from favorites', 'info');
  }
  isFavorite(png: PngAsset): boolean { return this.svc.isFavorite(png.id); }


  openDetail(png: PngAsset): void {
    if (this.bulkMode()) { this.toggleBulkSelect(png); return; }
    this.selected.set(png);
    this.selectedSize.set(SIZE_PRESETS[2]);
    this.licenseTier.set('standard');
    this.svc.trackRecent(png.id);
  }
  closeDetail(): void { this.selected.set(null); }
  selectSize(size: (typeof SIZE_PRESETS)[number]): void { this.selectedSize.set(size); }


  sizeFileSize(png: PngAsset, size: (typeof SIZE_PRESETS)[number]): string {
    return formatFileSize(estimatePngFileSize(png.width, png.height, size.px));
  }


  toggleBulkMode(): void {
    this.bulkMode.update((v) => !v);
    if (!this.bulkMode()) this.bulkSelected.set(new Set());
  }
  toggleBulkSelect(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    const next = new Set(this.bulkSelected());
    if (next.has(png.id)) next.delete(png.id); else next.add(png.id);
    this.bulkSelected.set(next);
  }
  isBulkSelected(png: PngAsset): boolean { return this.bulkSelected().has(png.id); }
  clearBulkSelection(): void { this.bulkSelected.set(new Set()); }
  selectAllVisible(): void {
    this.bulkSelected.set(new Set(this.visibleResults().map((p) => p.id)));
  }
  downloadBulkSelected(): void {
    const ids     = this.bulkSelected();
    const all     = this.results().filter((p) => ids.has(p.id));
    const items   = all.filter((p) => !this.isLocked(p));
    const locked  = all.length - items.length;
    items.forEach((png, idx) => setTimeout(() => this.downloadPng(png), idx * 250));
    if (items.length) this.showToast(`⬇️ Downloading ${items.length} PNG${items.length === 1 ? '' : 's'}…`, 'success');
    if (locked) this.showToast(`⭐ ${locked} Premium PNG${locked === 1 ? '' : 's'} skipped — upgrade to include ${locked === 1 ? 'it' : 'them'}`, 'info');
    this.toggleBulkMode();
  }


  readonly zipping = signal(false);


  downloadBulkAsZip(): void {
    const ids   = this.bulkSelected();
    const all   = this.results().filter((p) => ids.has(p.id));
    const items = all.filter((p) => !this.isLocked(p));
    const locked = all.length - items.length;
    if (!items.length) return;
    if (locked) this.showToast(`⭐ ${locked} Premium PNG${locked === 1 ? '' : 's'} skipped — upgrade to include ${locked === 1 ? 'it' : 'them'}`, 'info');
    this.zipAndDownload(items, 'amarapix-pngs');
    this.toggleBulkMode();
  }


  downloadCollectionAsZip(col: PngCollection, event?: Event): void {
    event?.stopPropagation();
    const items = col.assetIds
      .map((id) => this.svc.byId(id))
      .filter((p): p is PngAsset => !!p && !this.isLocked(p));
    if (!items.length) { this.showToast('This board has no downloadable PNGs yet', 'info'); return; }
    this.zipAndDownload(items, col.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'board');
  }


  private applyQuotaCap(items: PngAsset[]): { allowed: PngAsset[]; quotaSkipped: number } {
    if (this.isPremiumUser()) return { allowed: items, quotaSkipped: 0 };
    let remaining = this.freeDownloadsRemaining();
    const allowed: PngAsset[] = [];
    let quotaSkipped = 0;
    for (const png of items) {
      if (!png.isPremium) {
        if (remaining <= 0) { quotaSkipped++; continue; }
        remaining--;
      }
      allowed.push(png);
    }
    return { allowed, quotaSkipped };
  }

  private async zipAndDownload(requested: PngAsset[], filename: string): Promise<void> {
    if (this.zipping()) return;

    const { allowed: items, quotaSkipped } = this.applyQuotaCap(requested);
    if (quotaSkipped) {
      this.showToast(`⏳ ${quotaSkipped} PNG${quotaSkipped === 1 ? '' : 's'} skipped — today's free-download limit (${this.dailyFreeLimit}/day) reached`, 'info');
    }
    if (!items.length) { if (!quotaSkipped) this.showToast('Nothing to download', 'info'); return; }

    this.zipping.set(true);
    this.showToast(`📦 Zipping ${items.length} PNG${items.length === 1 ? '' : 's'}…`, 'info', 6000);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();






      const results = await Promise.allSettled(
        items.map(async (png) => {
          const res = await fetch(png.url);
          if (!res.ok) throw new Error(`fetch failed for ${png.slug}`);
          const blob = await res.blob();
          zip.file(`${png.slug}.png`, blob);
          return png;
        })
      );
      const zipped = results
        .filter((r): r is PromiseFulfilledResult<PngAsset> => r.status === 'fulfilled')
        .map((r) => r.value);
      const zippedIds = new Set(zipped.map((p) => p.id));
      const fellBackToDirect = items.filter((p) => !zippedIds.has(p.id));

      if (zipped.length) {
        const blob = await zip.generateAsync({ type: 'blob' });
        const url  = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }


      fellBackToDirect.forEach((png, idx) => setTimeout(() => this.directDownload(png), idx * 250));



      [...zipped, ...fellBackToDirect].forEach((png) => this.registerDownloadUsage(png));

      if (!fellBackToDirect.length) {
        this.showToast(`⬇️ Downloaded ${zipped.length} PNG${zipped.length === 1 ? '' : 's'} as one ZIP`, 'success');
      } else if (!zipped.length) {
        this.showToast(`⬇️ Your browser blocked ZIP bundling for these — downloading ${fellBackToDirect.length} PNG${fellBackToDirect.length === 1 ? '' : 's'} individually instead`, 'info');
      } else {
        this.showToast(`⬇️ Downloaded ${zipped.length} as a ZIP; ${fellBackToDirect.length} more couldn't be bundled so ${fellBackToDirect.length === 1 ? 'it' : "they're"} downloading individually`, 'info');
      }
    } catch (e) {
      console.error('ZIP bundle download failed — falling back to individual downloads', e);
      items.forEach((png, idx) => setTimeout(() => this.directDownload(png), idx * 250));
      items.forEach((png) => this.registerDownloadUsage(png));
      this.showToast(`⬇️ Couldn't build a ZIP — downloading ${items.length} PNG${items.length === 1 ? '' : 's'} individually instead`, 'info');
    } finally {
      this.zipping.set(false);
    }
  }


  private directDownload(png: PngAsset): void {
    const a = document.createElement('a');
    a.href     = png.url;
    a.download = `${png.slug}.png`;
    a.target   = '_blank';
    a.rel      = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  selectRelated(png: PngAsset): void {
    this.selected.set(png);
    this.selectedSize.set(SIZE_PRESETS[2]);
    this.licenseTier.set('standard');
    this.svc.trackRecent(png.id);
  }

  selectLicenseTier(tier: 'standard' | 'extended'): void { this.licenseTier.set(tier); }

  goPrev(): void {
    const i = this.selectedIndex();
    if (i > 0) this.selectRelated(this.results()[i - 1]);
  }
  goNext(): void {
    const i = this.selectedIndex();
    if (i >= 0 && i < this.results().length - 1) this.selectRelated(this.results()[i + 1]);
  }


  openLightbox(event?: Event): void { event?.stopPropagation(); this.lightboxZoom.set(false); this.lightboxOpen.set(true); }
  closeLightbox(): void { this.lightboxOpen.set(false); }
  toggleLightboxZoom(): void { this.lightboxZoom.update((v) => !v); }



  isLocked(png: PngAsset): boolean { return png.isPremium && !this.isPremiumUser(); }


  readonly watermarkRepeat = Array.from({ length: 12 });

  downloadPng(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    if (this.isLocked(png)) { this.goPremium(png); return; }
    if (this.isQuotaExceeded(png)) { this.goQuotaLimit(); return; }
    this.directDownload(png);
    this.registerDownloadUsage(png);
    this.showToast(`⬇️ Downloading "${png.name}"…`, 'success');
  }


  isQuotaExceeded(png: PngAsset): boolean {
    return !png.isPremium && !this.isPremiumUser() && this.freeDownloadsRemaining() <= 0;
  }

  private registerDownloadUsage(png: PngAsset): void {
    if (!png.isPremium && !this.isPremiumUser()) this.svc.registerFreeDownload();
  }

  goQuotaLimit(): void {
    this.showToast(`⏳ You've hit today's free-download limit (${this.dailyFreeLimit}/day) — go Premium for unlimited downloads`, 'info');
    this.router.navigate(['/pricing']);
  }


  goPremium(png?: PngAsset): void {
    this.showToast(`⭐ "${png?.name ?? 'This PNG'}" is a Premium asset — upgrade to download it`, 'info');
    this.router.navigate(['/pricing']);
  }


  downloadWithSize(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    if (this.isLocked(png)) { this.goPremium(png); return; }
    if (this.isQuotaExceeded(png)) { this.goQuotaLimit(); return; }
    const size = this.selectedSize();
    if (!size.px) { this.downloadPng(png); return; }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const dataUrl = resizeImageToDataUrl(img, size.px);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${png.slug}-${size.px}px.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        this.registerDownloadUsage(png);
        this.showToast(`⬇️ Downloading "${png.name}" (${size.label})…`, 'success');
      } catch {
        this.showToast(`Couldn't resize this image — downloading full resolution instead`, 'info');
        this.downloadPng(png);
      }
    };
    img.onerror = () => {
      this.showToast(`Couldn't resize this image — downloading full resolution instead`, 'info');
      this.downloadPng(png);
    };
    img.src = png.url;
  }


  requiresAttribution(png: PngAsset): boolean { return !png.isPremium; }
  attributionText(png: PngAsset): string {
    return `"${png.name}" by ${png.source} via Amarapix — https://amarapix.app/png/${png.slug}`;
  }
  copyAttribution(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    navigator.clipboard?.writeText(this.attributionText(png)).then(() => this.showToast('📋 Attribution text copied', 'success'));
  }


  shareTo(network: 'pinterest' | 'facebook' | 'twitter', png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    const pageUrl = `${location.origin}/png?asset=${png.slug}`;
    const text    = `${png.name} — free transparent PNG`;
    let url = '';
    if (network === 'pinterest') url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(pageUrl)}&media=${encodeURIComponent(png.url)}&description=${encodeURIComponent(text)}`;
    if (network === 'facebook')  url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
    if (network === 'twitter')   url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,width=600,height=520');
  }

  useInEditor(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    if (this.isLocked(png)) { this.goPremium(png); return; }
    this.router.navigate(['/editor'], { queryParams: { imageUrl: png.url, title: png.name } });
  }

  copyLink(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    navigator.clipboard?.writeText(png.url).then(() => this.showToast('🔗 Link copied to clipboard', 'success'));
  }


  readonly reportOpen   = signal(false);
  readonly reportReason = signal('');
  readonly reportSent   = signal(false);

  openReport(event?: Event): void {
    event?.stopPropagation();
    this.reportOpen.set(true);
    this.reportReason.set('');
    this.reportSent.set(false);
  }
  closeReport(): void { this.reportOpen.set(false); }
  submitReport(png: PngAsset): void {
    if (!this.reportReason().trim()) return;

    this.reportSent.set(true);
    setTimeout(() => this.closeReport(), 1600);
  }


  readonly contributorOpen  = signal(false);
  readonly contributorTitle = signal('');
  readonly contributorCategory = signal('');
  readonly contributorTags  = signal('');
  readonly contributorFile  = signal<{ name: string; dataUrl: string } | null>(null);
  readonly contributorError = signal('');
  readonly contributorDone  = signal(false);
  readonly mySubmissions    = this.svc.contributions;

  openContributor(event?: Event): void {
    event?.stopPropagation();
    this.contributorOpen.set(true);
    this.contributorTitle.set('');
    this.contributorCategory.set(this.categories[0]?.id ?? '');
    this.contributorTags.set('');
    this.contributorFile.set(null);
    this.contributorError.set('');
    this.contributorDone.set(false);
  }
  closeContributor(): void { this.contributorOpen.set(false); }

  onContributorFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.contributorError.set('Please choose an image file.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      this.contributorFile.set({ name: file.name, dataUrl: reader.result as string });
      this.contributorError.set('');
    };
    reader.readAsDataURL(file);
  }

  submitContributor(): void {
    const title = this.contributorTitle().trim();
    const file  = this.contributorFile();
    if (!title)     { this.contributorError.set('Give your submission a title.'); return; }
    if (!file)      { this.contributorError.set('Upload a preview image.'); return; }
    this.svc.submitContribution({
      title,
      category: this.contributorCategory(),
      tags: this.contributorTags().split(',').map((t) => t.trim()).filter(Boolean),
      previewUrl: file.dataUrl,
    });
    this.contributorDone.set(true);
  }


  openCollections(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    this.collectionTarget.set(png);
    this.collectionsOpen.set(true);
    this.showNewCollectionForm.set(false);
    this.newCollectionName.set('');
  }
  closeCollections(): void { this.collectionsOpen.set(false); this.collectionTarget.set(null); }

  toggleCollection(col: PngCollection): void {
    const png = this.collectionTarget();
    if (!png) return;
    if (this.svc.isInCollection(col.id, png.id)) {
      this.svc.removeFromCollection(col.id, png.id);
    } else {
      this.svc.addToCollection(col.id, png.id);
    }
  }

  isInCollection(col: PngCollection): boolean {
    const png = this.collectionTarget();
    return !!png && this.svc.isInCollection(col.id, png.id);
  }

  createAndAdd(): void {
    const name = this.newCollectionName().trim();
    if (!name) return;
    const col = this.svc.createCollection(name);
    const png = this.collectionTarget();
    if (png) this.svc.addToCollection(col.id, png.id);
    this.showNewCollectionForm.set(false);
    this.newCollectionName.set('');
    this.showToast(`📁 Collection "${col.name}" created`, 'success');
  }

  saveCollections(): void {
    this.closeCollections();
    this.showToast('✅ Collections saved', 'success');
  }

  updateCollectionName(value: string): void { this.newCollectionName.set(value); }


  openCreateTool(): void {
    this.createOpen.set(true);
    this.createStage.set('upload');
    this.createOriginal.set(null);
    this.createResult.set(null);
    this.createError.set(null);
    this.createDragOver.set(false);
    this.createProgress.set(0);
    this.cancelRemoval = false;
  }
  closeCreateTool(): void { this.createOpen.set(false); this.cancelRemoval = true; }

  onCreateDrop(event: DragEvent): void {
    event.preventDefault();
    this.createDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.loadUploadedFile(file);
  }
  onCreateDragOver(event: DragEvent): void { event.preventDefault(); this.createDragOver.set(true); }
  onCreateDragLeave(): void { this.createDragOver.set(false); }

  onCreateFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.loadUploadedFile(file);
  }

  private loadUploadedFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.createError.set('Please upload an image file (PNG, JPG or WEBP).');
      this.createStage.set('error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.createOriginal.set(reader.result as string);
      this.runBackgroundRemoval();
    };
    reader.onerror = () => {
      this.createError.set("Couldn't read that file.");
      this.createStage.set('error');
    };
    reader.readAsDataURL(file);
  }

  private async runBackgroundRemoval(): Promise<void> {
    const src = this.createOriginal();
    if (!src) return;
    this.createStage.set('processing');
    this.createProgress.set(0);
    this.cancelRemoval = false;

    try {
      const dataUrl = await removeBackgroundFromImage(src, (pct) => {
        if (!this.cancelRemoval) this.createProgress.set(pct);
      });
      if (this.cancelRemoval) return;
      this.createResult.set(dataUrl);
      this.createStage.set('result');
    } catch (e: any) {
      if (this.cancelRemoval) return;
      this.createError.set(e?.message ?? "Couldn't remove the background from this image.");
      this.createStage.set('error');
    }
  }

  retryCreate(): void {
    this.createStage.set('upload');
    this.createOriginal.set(null);
    this.createResult.set(null);
    this.createError.set(null);
  }

  downloadCreated(): void {
    const url = this.createResult();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-cutout.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.showToast('⬇️ Downloading your cutout…', 'success');
  }

  useCreatedInEditor(): void {
    const url = this.createResult();
    if (!url) return;
    this.closeCreateTool();
    this.router.navigate(['/editor'], { queryParams: { imageUrl: url, title: 'My Cutout' } });
  }


  showToast(msg: string, type: 'success' | 'info' = 'success', duration = 2400): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set({ msg, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), duration);
  }


  categoryName(id: string): string { return this.categories.find((c) => c.id === id)?.name ?? ''; }
  categoryEmoji(id: string): string { return this.categories.find((c) => c.id === id)?.emoji ?? ''; }

  formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)    return `${(n / 1000).toFixed(0)}K`;
    return String(n);
  }

  trackById(_: number, png: PngAsset): string { return png.id; }
  trackByColId(_: number, col: PngCollection): string { return col.id; }
}
