import {
  Component, ChangeDetectionStrategy, inject, signal, computed, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconsService, ICON_CATEGORIES } from '../icons.service';
import { ICON_LIBRARIES } from '../data/index';
import {
  IconAsset, IconAesthetic, IconTrend, IconTechnique,
  IconColorMode, IconCorners, IconSizeDensity, IconLibraryId,
} from '../../../core/models/icon.model';

interface IconGroup {
  label: string;
  icons: IconAsset[];
}

const PNG_SIZES = [16, 32, 64, 128, 256, 512];
const DAY = 24 * 60 * 60 * 1000;

@Component({
  selector: 'amx-icons-new',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icons-new.component.html',
  styleUrl: './icons-new.component.scss',
})
export class IconsNewComponent {
  private readonly sanitizer = inject(DomSanitizer);
  readonly svc = inject(IconsService);

  readonly categories = ICON_CATEGORIES;
  readonly libraryMeta = ICON_LIBRARIES;
  readonly pngSizes = PNG_SIZES;

  readonly style = this.svc.style;
  readonly filters = this.svc.filters;

  readonly aiSearchOn = signal(false);
  readonly mobileFiltersOpen = signal(false);
  readonly selected = signal<IconAsset | null>(null);
  readonly copyState = signal<'idle' | 'copied'>('idle');
  readonly visibleCount = signal(48);
  readonly recolorOpen = signal(false);

  readonly PRESET_COLORS = [
    '#f5820a', '#ef4444', '#ec4899', '#a855f7',
    '#6366f1', '#2563eb', '#0891b2', '#059669',
    '#16a34a', '#ca8a04', '#374151', '#9ca3af',
  ];

  /** Current hue (0-360) derived from the active recolorHue hex */
  readonly currentHue = computed(() => {
    const hex = this.style().recolorHue;
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return 25;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max === min) return 0;
    const d = max - min;
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return Math.round(h * 360);
  });

  private readonly rawFiltered = this.svc.filteredIcons;

  readonly filtered = computed<IconAsset[]>(() => {
    const list = this.rawFiltered();
    const q = this.filters().query.trim().toLowerCase();
    if (!q || !this.aiSearchOn()) return list;

    // "AI search" widens matching to any token overlap across name/tags/category.
    const tokens = q.split(/\s+/).filter(Boolean);
    return list.filter((icon) => {
      const haystack = `${icon.name} ${icon.tags.join(' ')} ${icon.category}`.toLowerCase();
      return tokens.some(t => haystack.split(/\W+/).some(word => word.startsWith(t)));
    });
  });

  readonly visibleIcons = computed(() => this.filtered().slice(0, this.visibleCount()));
  readonly hasMore = computed(() => this.filtered().length > this.visibleCount());

  readonly groups = computed<IconGroup[]>(() => {
    const icons = this.visibleIcons();
    if (!icons.length) return [];

    const ref = icons.reduce((max, i) => Math.max(max, new Date(i.createdAt).getTime()), 0);
    const refDay = Math.floor(ref / DAY);

    const buckets: Record<string, IconAsset[]> = {
      'Today': [], 'Yesterday': [], 'This week': [], 'This month': [], 'Earlier': [],
    };

    for (const icon of icons) {
      const day = Math.floor(new Date(icon.createdAt).getTime() / DAY);
      const diff = refDay - day;
      if (diff <= 0) buckets['Today'].push(icon);
      else if (diff === 1) buckets['Yesterday'].push(icon);
      else if (diff <= 6) buckets['This week'].push(icon);
      else if (diff <= 29) buckets['This month'].push(icon);
      else buckets['Earlier'].push(icon);
    }

    return Object.entries(buckets)
      .filter(([, arr]) => arr.length > 0)
      .map(([label, arr]) => ({ label, icons: arr }));
  });

  readonly svgCache = new Map<string, SafeHtml>();

  markup(icon: IconAsset): SafeHtml {
    let cached = this.svgCache.get(icon.id);
    if (!cached) {
      const inner = icon.colorSvg ?? icon.path;
      // Use the icon's native viewBox if set (e.g. Phosphor=256x256, Bootstrap=16x16)
      const viewBox = icon.viewBox ?? '0 0 24 24';
      const svg = `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
      cached = this.sanitizer.bypassSecurityTrustHtml(svg);
      this.svgCache.set(icon.id, cached);
    }
    return cached;
  }

  isColored(icon: IconAsset): boolean {
    return !!icon.colorSvg;
  }

  libraryName(id: IconLibraryId | null | undefined): string {
    if (!id || id === 'amarapix') return 'Amarapix';
    return this.libraryMeta.find(l => l.id === id)?.name ?? id;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selected()) this.closeDetail();
  }

  // -- Style controls ---------------------------------------------------------
  setTechnique(t: string): void { this.svc.updateStyle({ technique: t as IconTechnique }); }
  setColorMode(c: string): void { this.svc.updateStyle({ colorMode: c as IconColorMode }); }
  setCorners(c: string): void { this.svc.updateStyle({ corners: c as IconCorners }); }
  setStroke(w: number): void { this.svc.updateStyle({ strokeWidth: w }); }
  setDensity(d: string): void { this.svc.updateStyle({ density: d as IconSizeDensity }); }
  toggleAnimated(): void { this.svc.updateStyle({ animatedOn: !this.style().animatedOn }); }
  setRecolor(hex: string): void {
    // Color is applied via CSS custom property --icon-color — no cache clear needed.
    this.svc.updateStyle({ recolorHue: hex });
  }

  setRecolorHex(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.trim();
    const hex = raw.startsWith('#') ? raw : `#${raw}`;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) this.setRecolor(hex);
  }

  setRecolorFromHue(hue: number): void {
    // HSL→hex: saturation 80%, lightness 50%
    const s = 0.80, l = 0.50;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (hue < 60)       { r = c; g = x; b = 0; }
    else if (hue < 120) { r = x; g = c; b = 0; }
    else if (hue < 180) { r = 0; g = c; b = x; }
    else if (hue < 240) { r = 0; g = x; b = c; }
    else if (hue < 300) { r = x; g = 0; b = c; }
    else                { r = c; g = 0; b = x; }
    const h = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    this.setRecolor(`#${h(r)}${h(g)}${h(b)}`);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (this.recolorOpen() && !target.closest('.amx-icons__recolor')) {
      this.recolorOpen.set(false);
    }
    if (this.selected() && !target.closest('.amx-icon-detail') && !target.closest('.amx-icon-card')) {
      this.closeDetail();
    }
  }
  resetStyle(): void { this.svc.resetStyle(); }

  // -- Filters ----------------------------------------------------------------
  setQuery(value: string): void { this.svc.updateFilters({ query: value }); this.visibleCount.set(48); }
  setCategory(id: string | null): void { this.svc.updateFilters({ categoryId: id }); this.visibleCount.set(48); }
  toggleAesthetic(v: string): void { this.svc.toggleArrayFilter('aesthetic', v as IconAesthetic); this.visibleCount.set(48); }
  toggleTrend(v: string): void { this.svc.toggleArrayFilter('trend', v as IconTrend); this.visibleCount.set(48); }
  toggleFavoritesOnly(): void {
    this.svc.updateFilters({ favoritesOnly: !this.filters().favoritesOnly });
    this.visibleCount.set(48);
  }
  clearFilters(): void {
    this.svc.clearFilters();
    this.aiSearchOn.set(false);
    this.visibleCount.set(48);
  }
  loadMore(): void { this.visibleCount.update(v => v + 48); }

  isActiveAesthetic(v: string): boolean { return this.filters().aesthetic.includes(v as IconAesthetic); }
  isActiveTrend(v: string): boolean { return this.filters().trend.includes(v as IconTrend); }

  categoryName(id: string): string {
    return this.categories.find(c => c.id === id)?.name ?? '';
  }

  get activeFilterCount(): number {
    const f = this.filters();
    return f.aesthetic.length + f.trend.length
      + (f.categoryId ? 1 : 0) + (f.favoritesOnly ? 1 : 0)
      + (this.style().animatedOn ? 1 : 0)
      + (f.libraryId ? 1 : 0);
  }

  // -- Libraries --------------------------------------------------------------
  setLibrary(id: IconLibraryId | null): void {
    this.svc.setLibrary(id);
    this.visibleCount.set(48);
  }

  isActiveLibrary(id: IconLibraryId): boolean {
    return this.filters().libraryId === id;
  }

  isLibraryLoading(id: IconLibraryId): boolean {
    return this.svc.isLoading(id);
  }

  isLibraryLoaded(id: IconLibraryId): boolean {
    return this.svc.isLoaded(id);
  }

  // -- Favorites --------------------------------------------------------------
  toggleFavorite(icon: IconAsset, event?: Event): void {
    event?.stopPropagation();
    this.svc.toggleFavorite(icon.id);
  }
  isFavorite(icon: IconAsset): boolean { return this.svc.isFavorite(icon.id); }

  // -- Detail panel -----------------------------------------------------------
  openDetail(icon: IconAsset): void {
    this.selected.set(icon);
    this.copyState.set('idle');
  }
  closeDetail(): void { this.selected.set(null); }

  relatedIcons(icon: IconAsset): IconAsset[] {
    return this.svc.filteredIcons()
      .filter(i => i.id !== icon.id && i.category === icon.category)
      .slice(0, 6);
  }

  // -- Export -----------------------------------------------------------------
  buildStandaloneSvg(icon: IconAsset, size = 512): string {
    const s = this.style();
    const fillMode = s.technique === 'filled' || s.technique === '3d';
    const cap = s.corners === 'round' ? 'round' : 'square';
    const join = s.corners === 'round' ? 'round' : 'miter';
    const color = s.recolorHue;
    const viewBox = icon.viewBox ?? '0 0 24 24';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}" fill="${fillMode ? color : 'none'}" stroke="${fillMode ? 'none' : color}" stroke-width="${s.strokeWidth}" stroke-linecap="${cap}" stroke-linejoin="${join}">${icon.path}</svg>`;
  }

  async copySvg(icon: IconAsset): Promise<void> {
    const svg = this.buildStandaloneSvg(icon, 24);
    try {
      await navigator.clipboard.writeText(svg);
      this.copyState.set('copied');
      setTimeout(() => this.copyState.set('idle'), 1800);
    } catch {
      this.copyState.set('idle');
    }
  }

  downloadSvg(icon: IconAsset): void {
    const svg = this.buildStandaloneSvg(icon, 512);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    this.triggerDownload(URL.createObjectURL(blob), `${icon.slug}.svg`);
  }

  downloadPng(icon: IconAsset, size: number): void {
    const svg = this.buildStandaloneSvg(icon, size);
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (blob) this.triggerDownload(URL.createObjectURL(blob), `${icon.slug}-${size}.png`);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = url;
  }

  private triggerDownload(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }

  trackById(_: number, icon: IconAsset): string { return icon.id; }
}
