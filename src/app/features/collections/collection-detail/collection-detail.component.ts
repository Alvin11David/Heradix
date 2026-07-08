import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CollectionsService } from '../collections.service';
import { Collection } from '../../../core/models/collection.model';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

const ACCENTS = ['var(--amx-orange)', '#0891b2', '#7c3aed', '#059669', '#e11d48', '#2563eb'];

@Component({
  selector: 'amx-collection-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="amx-cd">
      <div class="amx-cd__hero"
           [style.--hero-accent]="accentColor()">

        @let col = collection();
        @if (col) {
          @if (col.coverThumbnailUrl) {
            <div class="amx-cd__cover">
              <img [src]="col.coverThumbnailUrl" alt="" class="amx-cd__cover-img"/>
              <div class="amx-cd__cover-overlay"></div>
            </div>
          }

          <a class="amx-cd__back" routerLink="/collections">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5m7-7-7 7 7 7"/>
            </svg>
            Collections
          </a>

          <div class="amx-cd__hero-content" [class.amx-cd__hero-content--has-cover]="!!col.coverThumbnailUrl">
            <div class="amx-cd__badge-row">
              <span class="amx-cd__badge" [class.amx-cd__badge--public]="col.isPublic">
                @if (col.isPublic) {
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                } @else {
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                }
                {{ col.isPublic ? 'Public' : 'Private' }}
              </span>
              <span class="amx-cd__count">{{ col.assetCount }} {{ col.assetCount === 1 ? 'item' : 'items' }}</span>
            </div>

            <h1 class="amx-cd__title">{{ col.name }}</h1>

            @if (col.description) {
              <p class="amx-cd__desc">{{ col.description }}</p>
            }

            <div class="amx-cd__meta">
              <span class="amx-cd__meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Updated {{ timeAgo(col.updatedAt) }}
              </span>
              <span class="amx-cd__meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m22 14-6-6-8 8-4-4"/>
                </svg>
                Created {{ timeAgo(col.createdAt) }}
              </span>
            </div>
          </div>
        } @else {
          <div class="amx-cd__hero-content">
            <div class="amx-cd__skeleton-badge"></div>
            <div class="amx-cd__skeleton-title"></div>
            <div class="amx-cd__skeleton-desc"></div>
            <div class="amx-cd__skeleton-meta"></div>
          </div>
        }
      </div>

      <div class="amx-cd__body">

        <div class="amx-cd__section-header">
          <h2 class="amx-cd__section-title">Assets in this collection</h2>
          @if (!loadingItems() && items().length > 0) {
            <span class="amx-cd__section-count">{{ items().length }} file{{ items().length !== 1 ? 's' : '' }}</span>
          }
        </div>

        @if (loadingItems()) {
          <div class="amx-cd__grid">
            @for (s of [1,2,3,4,5,6]; track s) {
              <div class="amx-cd__skeleton-card">
                <div class="amx-cd__skeleton-thumb"></div>
                <div class="amx-cd__skeleton-label"></div>
              </div>
            }
          </div>
        }

        @if (!loadingItems() && items().length > 0) {
          <div class="amx-cd__grid">
            @for (item of items(); track item.id; let i = $index) {
              <div class="amx-cd__card"
                   [style.--card-accent]="ACCENTS[i % ACCENTS.length]"
                   (click)="viewAssetDetail(item)"
                   role="button"
                   [attr.aria-label]="'View ' + item.name">
                <div class="amx-cd__thumb-wrap">
                  <img [src]="item.thumbnail" [alt]="item.name" class="amx-cd__thumb" loading="lazy"/>
                  <div class="amx-cd__thumb-overlay">
                    <span class="amx-cd__view-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      View
                    </span>
                  </div>
                </div>
                <p class="amx-cd__label">{{ item.name }}</p>
              </div>
            }
          </div>
        }

        @if (!loadingItems() && items().length === 0) {
          <div class="amx-cd__empty">
            <div class="amx-cd__empty-icon">
              <svg viewBox="0 0 80 80" fill="none" stroke="var(--amx-faint)" stroke-width="1.5">
                <rect x="14" y="18" width="52" height="46" rx="6" stroke="currentColor" fill="none"/>
                <path d="M32 18V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10" stroke="currentColor" fill="none"/>
                <path d="M24 38h32M24 48h20" stroke="var(--amx-border-2)" stroke-linecap="round"/>
                <circle cx="54" cy="52" r="16" fill="none" stroke="var(--amx-orange)" stroke-width="1.5" stroke-dasharray="3 3"/>
                <path d="M54 46v12M48 52h12" stroke="var(--amx-orange)" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            @if (col) {
              <h3 class="amx-cd__empty-title">This collection is empty</h3>
              <p class="amx-cd__empty-text">Start adding assets from the marketplace to fill it up.</p>
              <a class="amx-cd__btn" routerLink="/marketplace">Browse Marketplace</a>
            } @else {
              <h3 class="amx-cd__empty-title">Collection not found</h3>
              <p class="amx-cd__empty-text">The collection you're looking for doesn't exist or has been deleted.</p>
              <a class="amx-cd__btn" routerLink="/collections">Back to Collections</a>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './collection-detail.component.scss',
})
export class CollectionDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly svc = inject(CollectionsService);
  readonly ACCENTS = ACCENTS;
  readonly timeAgo = timeAgo;

  private readonly collectionId = signal<string | null>(null);
  private readonly itemsLoaded = signal(false);

  readonly collection = computed(() => {
    const id = this.collectionId();
    if (!id) return null;
    return this.svc.collections().find(c => c.id === id) ?? null;
  });

  readonly items = signal<{ id: string; name: string; thumbnail: string; slug?: string }[]>([]);
  readonly loadingItems = computed(() => !this.itemsLoaded() && !!this.collectionId());

  private sub?: Subscription;

  accentColor = computed(() => {
    const col = this.collection();
    if (!col) return 'var(--amx-orange)';
    const hash = col.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return ACCENTS[hash % ACCENTS.length];
  });

  constructor() {
    effect(() => {
      const col = this.collection();
      if (!col) return;
      this.itemsLoaded.set(false);
      this.svc.getCollectionItems(col.id).subscribe({
        next: (items) => { this.items.set(items); this.itemsLoaded.set(true); },
        error: () => { this.items.set([]); this.itemsLoaded.set(true); },
      });
    });
  }

  ngOnInit(): void {
    this.svc.loadCollections();

    this.sub = this.route.paramMap.subscribe(params => {
      this.collectionId.set(params.get('id'));
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  viewAssetDetail(item: { id: string; name: string; thumbnail: string; slug?: string }): void {
    if (item.slug) {
      this.router.navigate(['/marketplace/asset', item.slug], {
        queryParams: { thumb: item.thumbnail, label: item.name }
      });
    }
  }
}
