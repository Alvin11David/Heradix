import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CollectionsService } from '../collections.service';

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

const CARD_ACCENTS = ['var(--amx-orange)', '#0891b2', '#7c3aed', '#059669', '#e11d48', '#2563eb'];

@Component({
  selector: 'amx-collections',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="amx-cols">
      <div class="amx-cols__bg">
        <div class="amx-cols__blob amx-cols__blob--1"></div>
        <div class="amx-cols__blob amx-cols__blob--2"></div>
        <div class="amx-cols__blob amx-cols__blob--3"></div>
      </div>

      <div class="amx-cols__hero">
        <div class="amx-cols__badge">Collections</div>
        <h1 class="amx-cols__title">
          Organise your <span class="amx-cols__title--accent">creative&nbsp;world</span>
        </h1>
        <p class="amx-cols__sub">
          Group your favourite assets into beautiful collections — keep everything organised, on brand, and at your fingertips.
        </p>
      </div>

      <div class="amx-cols__toolbar">
        <div class="amx-cols__search">
          <svg class="amx-cols__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input class="amx-cols__search-input" type="text" placeholder="Search collections…"
                 [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"/>
        </div>

        <div class="amx-cols__filters">
          <button class="amx-cols__filter"
                  [class.amx-cols__filter--active]="activeFilter() === 'all'"
                  (click)="activeFilter.set('all')">All</button>
          <button class="amx-cols__filter"
                  [class.amx-cols__filter--active]="activeFilter() === 'public'"
                  (click)="activeFilter.set('public')">Public</button>
          <button class="amx-cols__filter"
                  [class.amx-cols__filter--active]="activeFilter() === 'private'"
                  (click)="activeFilter.set('private')">Private</button>
        </div>

        <span class="amx-cols__count">{{ filtered().length }} collection{{ filtered().length !== 1 ? 's' : '' }}</span>
      </div>

      @if (loading()) {
        <div class="amx-cols__grid">
          @for (skeleton of [1,2,3,4,5,6,7,8]; track skeleton) {
            <div class="amx-cols__skeleton">
              <div class="amx-cols__skeleton-mosaic"></div>
              <div class="amx-cols__skeleton-body">
                <div class="amx-cols__skeleton-line amx-cols__skeleton-line--name"></div>
                <div class="amx-cols__skeleton-line amx-cols__skeleton-line--meta"></div>
              </div>
            </div>
          }
        </div>
      }

      @if (!loading() && filtered().length === 0) {
        <div class="amx-cols__empty">
          <div class="amx-cols__empty-icon">
            <svg viewBox="0 0 80 80" fill="none" stroke="var(--amx-faint)" stroke-width="1.5">
              <rect x="10" y="22" width="60" height="48" rx="8" stroke="currentColor" fill="none"/>
              <path d="M30 22V14a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v8" stroke="currentColor" fill="none"/>
              <path d="M26 42h28M26 52h18" stroke="var(--amx-border-2)" stroke-linecap="round"/>
            </svg>
          </div>
          <h3 class="amx-cols__empty-title">No collections yet</h3>
          <p class="amx-cols__empty-text">
            {{ searchQuery() ? 'No collections match your search.' : 'Create your first collection to organise and group your favourite assets.' }}
          </p>
          @if (!searchQuery()) {
            <button class="amx-cols__btn amx-cols__btn--primary" routerLink="/marketplace">
              Browse Marketplace
            </button>
          }
        </div>
      }

      @if (!loading() && filtered().length > 0) {
        <div class="amx-cols__grid">
          @for (col of filtered(); track col.id; let idx = $index) {
            <div class="amx-cols__card"
                 [style.--card-accent]="CARD_ACCENTS[idx % CARD_ACCENTS.length]"
                 (click)="viewCollection(col.id)"
                 role="button" [attr.aria-label]="'View ' + col.name">

              <div class="amx-cols__mosaic">
                @for (thumb of colThumbs(col); track $index; let j = $index) {
                  <div class="amx-cols__tile-wrap" [style.animation-delay]="(j * 0.05) + 's'">
                    <img [src]="thumb" alt="" class="amx-cols__tile" loading="lazy"/>
                  </div>
                }
                <div class="amx-cols__mosaic-gradient"></div>
                <div class="amx-cols__mosaic-ring"></div>

                <span class="amx-cols__badge" [class.amx-cols__badge--public]="col.isPublic">
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
              </div>

              <div class="amx-cols__body">
                <h3 class="amx-cols__name">{{ col.name }}</h3>
                @if (col.description) {
                  <p class="amx-cols__desc">{{ col.description }}</p>
                }
                <div class="amx-cols__meta">
                  <span class="amx-cols__meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m22 14-6-6-8 8-4-4"/>
                    </svg>
                    {{ col.assetCount }} {{ col.assetCount === 1 ? 'file' : 'files' }}
                  </span>
                  <span class="amx-cols__meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ timeAgo(col.updatedAt) }}
                  </span>
                </div>
              </div>

              <div class="amx-cols__accent"></div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './collections.component.scss',
})
export class CollectionsComponent implements OnInit {
  private readonly router = inject(Router);
  readonly svc = inject(CollectionsService);
  readonly CARD_ACCENTS = CARD_ACCENTS;
  readonly timeAgo = timeAgo;

  readonly collections = computed(() => this.svc.collections());
  readonly loading = computed(() => this.svc.loading());

  searchQuery = signal('');
  activeFilter = signal<'all' | 'public' | 'private'>('all');

  filtered = computed(() => {
    let list = this.collections();
    const filter = this.activeFilter();
    if (filter === 'public') list = list.filter(c => c.isPublic);
    if (filter === 'private') list = list.filter(c => !c.isPublic);
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(c => c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q));
    return list;
  });

  readonly fallbackThumbs = [
    '/assets/images/thumbnails/safebirth-1080.jpg',
    '/assets/images/thumbnails/916d081a3838f5ae2c67906d7c7ab7b9.jpg',
    '/assets/images/thumbnails/African-Day.jpg',
    '/assets/images/thumbnails/P.7-Candidates.jpg',
  ];

  colThumbs(col: { id: string; coverThumbnailUrl?: string }): string[] {
    if (col.coverThumbnailUrl) {
      return [
        col.coverThumbnailUrl,
        ...this.fallbackThumbs.filter(t => t !== col.coverThumbnailUrl).slice(0, 3),
      ];
    }
    return this.fallbackThumbs;
  }

  ngOnInit(): void {
    this.svc.loadCollections();
  }

  viewCollection(id: string): void {
    this.router.navigate(['/collections', id]);
  }
}
