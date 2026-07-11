import { Component, ChangeDetectionStrategy, inject, signal, computed, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconsService, ICON_CATEGORIES } from '../icons.service';
import { IconAsset, IconAesthetic, IconAuthor, IconPlatform, IconTrend, IconTechnique, IconColorMode, IconCorners, IconSizeDensity } from '../../../core/models/icon.model';

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
  private readonly el = inject(ElementRef);
  readonly svc = inject(IconsService);

  readonly categories = ICON_CATEGORIES;
  readonly pngSizes = PNG_SIZES;

  readonly style = this.svc.style;
  readonly filters = this.svc.filters;

  readonly aiSearchOn = signal(false);
  readonly mobileFiltersOpen = signal(false);
  readonly selected = signal<IconAsset | null>(null);
  readonly copyState = signal<'idle' | 'copied'>('idle');
  readonly visibleCount = signal(30);
  readonly recolorOpen = signal(false);

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
      const svg = `<svg viewBox="0 0 24 24">${icon.path}</svg>`;
      cached = this.sanitizer.bypassSecurityTrustHtml(svg);
      this.svgCache.set(icon.id, cached);
    }
    return cached;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selected()) this.closeDetail();
  }

  // -- Style controls -----------------------------------------------------
  setTechnique(t: string): void { this.svc.updateStyle({ technique: t as IconTechnique }); }
  setColorMode(c: string): void { this.svc.updateStyle({ colorMode: c as IconColorMode }); }
  setCorners(c: string): void { this.svc.updateStyle({ corners: c as IconCorners }); }
  setStroke(w: number): void { this.svc.updateStyle({ strokeWidth: w }); }
  setDensity(d: string): void { this.svc.updateStyle({ density: d as IconSizeDensity }); }
  toggleAnimated(): void { this.svc.updateStyle({ animatedOn: !this.style().animatedOn }); }
  setRecolor(hex: string): void { this.svc.updateStyle({ recolorHue: hex }); }
  resetStyle(): void { this.svc.resetStyle(); }

  // -- Filters --------------------------------------------------------------
  setQuery(value: string): void { this.svc.updateFilters({ query: value }); this.visibleCount.set(30); }
  setCategory(id: string | null): void { this.svc.updateFilters({ categoryId: id }); this.visibleCount.set(30); }
  toggleAesthetic(v: string): void { this.svc.toggleArrayFilter('aesthetic', v as IconAesthetic); this.visibleCount.set(30); }
  togglePlatform(v: string): void { this.svc.toggleArrayFilter('platforms', v as IconPlatform); this.visibleCount.set(30); }
  toggleTrend(v: string): void { this.svc.toggleArrayFilter('trend', v as IconTrend); this.visibleCount.set(30); }
  toggleAuthor(v: string): void { this.svc.toggleArrayFilter('author', v as IconAuthor); this.visibleCount.set(30); }
  toggleFavoritesOnly(): void {
    this.svc.updateFilters({ favoritesOnly: !this.filters().favoritesOnly });
    this.visibleCount.set(30);
  }
  clearFilters(): void {
    this.svc.clearFilters();
    this.aiSearchOn.set(false);
    this.visibleCount.set(30);
  }
  loadMore(): void { this.visibleCount.update(v => v + 24); }

  isActiveAesthetic(v: string): boolean { return this.filters().aesthetic.includes(v as IconAesthetic); }
  isActivePlatform(v: string): boolean { return this.filters().platforms.includes(v as IconPlatform); }
  isActiveTrend(v: string): boolean { return this.filters().trend.includes(v as IconTrend); }
  isActiveAuthor(v: string): boolean { return this.filters().author.includes(v as IconAuthor); }

  categoryName(id: string): string {
    return this.categories.find(c => c.id === id)?.name ?? '';
  }

  get activeFilterCount(): number {
    const f = this.filters();
    return f.platforms.length + f.aesthetic.length + f.trend.length + f.author.length
      + (f.categoryId ? 1 : 0) + (f.favoritesOnly ? 1 : 0) + (this.style().animatedOn ? 1 : 0);
  }

  // -- Favorites ------------------------------------------------------------
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
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fillMode ? color : 'none'}" stroke="${fillMode ? 'none' : color}" stroke-width="${s.strokeWidth}" stroke-linecap="${cap}" stroke-linejoin="${join}">${icon.path}</svg>`;
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
      canvas.width = size;
      canvas.height = size;
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
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  trackById(_: number, icon: IconAsset): string { return icon.id; }
}
