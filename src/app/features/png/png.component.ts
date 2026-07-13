import { Component, ChangeDetectionStrategy, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PngService } from './png.service';
import { PngAsset, PngSortMode } from '../../core/models/png.model';

const PAGE_SIZE = 30;

const TRENDING_TAGS = [
  'laptop', 'flowers', 'confetti', 'crown', 'car', 'balloons',
  'coffee', 'guitar', 'sunglasses', 'trophy',
];

const SORT_LABELS: Record<PngSortMode, string> = {
  popular: 'Most Popular',
  newest: 'Newest First',
  downloads: 'Most Downloaded',
};

const SIZE_PRESETS = [
  { label: 'Small', px: 500 },
  { label: 'Medium', px: 1000 },
  { label: 'Large (Original)', px: 0 },
];

@Component({
  selector: 'amx-png',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './png.component.html',
  styleUrl: './png.component.scss',
})
export class PngComponent {
  private readonly router = inject(Router);
  readonly svc = inject(PngService);

  readonly categories = this.svc.categories;
  readonly trendingTags = TRENDING_TAGS;
  readonly sortLabels = SORT_LABELS;
  readonly sizePresets = SIZE_PRESETS;

  readonly filters = this.svc.filters;
  readonly visibleCount = signal(PAGE_SIZE);
  readonly sortMenuOpen = signal(false);
  readonly selected = signal<PngAsset | null>(null);
  readonly selectedSize = signal(SIZE_PRESETS[2]);
  readonly toast = signal<string | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly results = this.svc.filtered;
  readonly visibleResults = computed(() => this.results().slice(0, this.visibleCount()));
  readonly hasMore = computed(() => this.results().length > this.visibleCount());

  readonly related = computed<PngAsset[]>(() => {
    const cur = this.selected();
    return cur ? this.svc.related(cur, 8) : [];
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selected()) this.closeDetail();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (this.sortMenuOpen() && !target.closest('.amx-png__sort')) {
      this.sortMenuOpen.set(false);
    }
  }

  setQuery(value: string): void {
    this.svc.setQuery(value);
    this.visibleCount.set(PAGE_SIZE);
  }

  applyTag(tag: string): void {
    this.setQuery(tag);
  }

  setCategory(id: string | null): void {
    this.svc.setCategory(id);
    this.visibleCount.set(PAGE_SIZE);
  }

  isActiveCategory(id: string): boolean {
    return this.filters().categoryId === id;
  }

  setLicense(v: 'all' | 'free' | 'premium'): void {
    this.svc.setLicense(v);
    this.visibleCount.set(PAGE_SIZE);
  }

  setSort(v: PngSortMode): void {
    this.svc.setSort(v);
    this.sortMenuOpen.set(false);
  }

  toggleFavoritesOnly(): void {
    this.svc.toggleFavoritesOnly();
    this.visibleCount.set(PAGE_SIZE);
  }

  clearFilters(): void {
    this.svc.clearFilters();
    this.visibleCount.set(PAGE_SIZE);
  }

  loadMore(): void {
    this.visibleCount.update((v) => v + PAGE_SIZE);
  }

  toggleFavorite(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    this.svc.toggleFavorite(png.id);
  }

  isFavorite(png: PngAsset): boolean {
    return this.svc.isFavorite(png.id);
  }

  get activeFilterCount(): number {
    const f = this.filters();
    return (f.categoryId ? 1 : 0) + (f.license !== 'all' ? 1 : 0) + (f.favoritesOnly ? 1 : 0);
  }

  categoryName(id: string): string {
    return this.categories.find((c) => c.id === id)?.name ?? '';
  }

  openDetail(png: PngAsset): void {
    this.selected.set(png);
    this.selectedSize.set(SIZE_PRESETS[2]);
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  selectSize(size: (typeof SIZE_PRESETS)[number]): void {
    this.selectedSize.set(size);
  }

  showToast(msg: string, duration = 2200): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set(msg);
    this.toastTimer = setTimeout(() => this.toast.set(null), duration);
  }

  downloadPng(png: PngAsset): void {
    const a = document.createElement('a');
    a.href = png.url;
    a.download = `${png.slug}.png`;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.showToast(`Downloading "${png.name}"…`);
  }

  useInEditor(png: PngAsset, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/editor'], {
      queryParams: { imageUrl: png.url, title: png.name },
    });
  }

  trackById(_: number, png: PngAsset): string {
    return png.id;
  }
}
