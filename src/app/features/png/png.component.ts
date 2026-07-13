import {
  Component, ChangeDetectionStrategy, HostListener,
  inject, signal, computed, ElementRef, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PngService } from './png.service';
import { PngAsset, PngSortMode, PngViewMode, PngCollection } from '../../core/models/png.model';

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

@Component({
  selector: 'amx-png',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './png.component.html',
  styleUrl: './png.component.scss',
})
export class PngComponent {
  private readonly router  = inject(Router);
  readonly svc             = inject(PngService);

  // ── Static data ────────────────────────────────────────────────────────────
  readonly categories    = this.svc.categories;
  readonly trendingTags  = TRENDING_TAGS;
  readonly sortLabels    = SORT_LABELS;
  readonly sizePresets   = SIZE_PRESETS;
  readonly colorSwatches = COLOR_SWATCHES;
  readonly styleOptions  = STYLE_OPTIONS;

  // ── Pagination / display ───────────────────────────────────────────────────
  readonly visibleCount   = signal(PAGE_SIZE);
  readonly results        = this.svc.filtered;
  readonly visibleResults = computed(() => this.results().slice(0, this.visibleCount()));
  readonly hasMore        = computed(() => this.results().length > this.visibleCount());

  // ── UI state ──────────────────────────────────────────────────────────────
  readonly sidebarOpen    = signal(true);
  readonly mobileSidebar  = signal(false);
  readonly sortMenuOpen   = signal(false);
  readonly viewMode       = this.svc.viewMode;

  // section expand/collapse (all open by default)
  readonly expandedSections = signal<Set<SidebarSection>>(
    new Set(['license', 'style', 'orientation', 'color', 'people', 'resolution', 'date'])
  );

  // ── Detail panel ───────────────────────────────────────────────────────────
  readonly selected     = signal<PngAsset | null>(null);
  readonly selectedSize = signal(SIZE_PRESETS[2]);
  readonly related      = computed<PngAsset[]>(() => {
    const cur = this.selected();
    return cur ? this.svc.related(cur, 8) : [];
  });

  // ── Collections ─────────────────────────────────────────────────────────────
  readonly collectionsOpen       = signal(false);
  readonly collectionTarget      = signal<PngAsset | null>(null);
  readonly newCollectionName     = signal('');
  readonly showNewCollectionForm = signal(false);

  // ── Toast ──────────────────────────────────────────────────────────────────
  readonly toast      = signal<{ msg: string; type: 'success' | 'info' } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Search suggestions ─────────────────────────────────────────────────────
  readonly suggestionsOpen = signal(false);
  readonly suggestions     = computed<string[]>(() => {
    const q = this.svc.filters().query.trim().toLowerCase();
    if (q.length < 2) return [];
    const tags = new Set<string>();
    this.svc.library.forEach((p) => p.tags.forEach((t) => { if (t.includes(q)) tags.add(t); }));
    return [...tags].slice(0, 8);
  });

  // ── Keyboard / outside click ────────────────────────────────────────────────
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selected()) { this.closeDetail(); return; }
    if (this.collectionsOpen()) { this.closeCollections(); return; }
    if (this.mobileSidebar()) { this.mobileSidebar.set(false); }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const t = e.target as HTMLElement;
    if (this.sortMenuOpen() && !t.closest('.amx-png__sort')) this.sortMenuOpen.set(false);
    if (this.suggestionsOpen() && !t.closest('.amx-png__search-wrap')) this.suggestionsOpen.set(false);
  }

  // ── Filter helpers ──────────────────────────────────────────────────────────
  get filters() { return this.svc.filters; }
  get activeFilterCount() { return this.svc.activeFilterCount; }

  setQuery(value: string): void { this.svc.setQuery(value); this.resetPage(); }
  applyTag(tag: string):   void { this.setQuery(tag); this.suggestionsOpen.set(false); }
  applySuggestion(s: string): void { this.applyTag(s); }

  setCategory(id: string | null): void { this.svc.setCategory(id); this.resetPage(); }
  isActiveCategory(id: string): boolean { return this.filters().categoryId === id; }

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

  // ── Sidebar sections ────────────────────────────────────────────────────────
  toggleSection(s: SidebarSection): void {
    const next = new Set(this.expandedSections());
    if (next.has(s)) next.delete(s); else next.add(s);
    this.expandedSections.set(next);
  }
  isSectionOpen(s: SidebarSection): boolean { return this.expandedSections().has(s); }

  // ── Favorites ───────────────────────────────────────────────────────────────
  toggleFavorite(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    this.svc.toggleFavorite(png.id);
    this.showToast(this.svc.isFavorite(png.id) ? '❤️ Added to favorites' : 'Removed from favorites', 'info');
  }
  isFavorite(png: PngAsset): boolean { return this.svc.isFavorite(png.id); }

  // ── Detail panel ────────────────────────────────────────────────────────────
  openDetail(png: PngAsset): void {
    this.selected.set(png);
    this.selectedSize.set(SIZE_PRESETS[2]);
    this.svc.trackRecent(png.id);
  }
  closeDetail(): void { this.selected.set(null); }
  selectSize(size: (typeof SIZE_PRESETS)[number]): void { this.selectedSize.set(size); }

  selectRelated(png: PngAsset): void {
    this.selected.set(png);
    this.selectedSize.set(SIZE_PRESETS[2]);
    this.svc.trackRecent(png.id);
  }

  // ── Download / Editor ──────────────────────────────────────────────────────
  downloadPng(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    const a = document.createElement('a');
    a.href     = png.url;
    a.download = `${png.slug}.png`;
    a.target   = '_blank';
    a.rel      = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.showToast(`⬇️ Downloading "${png.name}"…`, 'success');
  }

  useInEditor(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/editor'], { queryParams: { imageUrl: png.url, title: png.name } });
  }

  copyLink(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    navigator.clipboard?.writeText(png.url).then(() => this.showToast('🔗 Link copied to clipboard', 'success'));
  }

  // ── Collections ─────────────────────────────────────────────────────────────
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

  // ── Toast ──────────────────────────────────────────────────────────────────
  showToast(msg: string, type: 'success' | 'info' = 'success', duration = 2400): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set({ msg, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), duration);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
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
