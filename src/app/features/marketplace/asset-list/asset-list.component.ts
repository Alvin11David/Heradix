import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MarketplaceService } from '../marketplace.service';
import { Asset, AssetListParams, PaginatedResponse } from '../../../core/models/asset.model';
import { AssetCardComponent } from '../../../shared/components/asset-card/asset-card.component';
import { AddToCollectionMenuComponent } from '../../../shared/components/add-to-collection/add-to-collection-menu.component';
import { CollectionsService } from '../../collections/collections.service';

gsap.registerPlugin(ScrollTrigger);

interface CalendarEvent {
  emoji: string;
  title: string;
  when: string;
  month: string;
  gradient: string;
  cover: string;
  tags: { label: string; type: 'next' | 'high' | 'sought' }[];
  assets: { img: string; title: string; slug: string }[];
}

@Component({
  selector: 'amx-asset-list',
  standalone: true,
  imports: [CommonModule, RouterLink, AssetCardComponent, AddToCollectionMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="amx-hero">
      <div class="amx-hero__card">
        <h2 class="amx-hero__title">Create Your Design!</h2>
        <div class="amx-hero__prompt" [class.amx-hero__prompt--loading]="submitting()">
          <input
            class="amx-hero__input"
            type="text"
            placeholder="Describe what you would want to create"
            aria-label="Design prompt"
            [value]="prompt()"
            (input)="prompt.set($any($event.target).value)"
            (keydown.enter)="submitPrompt()"
          />
          <button class="amx-hero__attach" type="button" aria-label="Attach file">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <button class="amx-hero__send" type="button" aria-label="Generate design"
                  (click)="submitPrompt()" [disabled]="submitting()">
            <svg *ngIf="!submitting()" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <svg *ngIf="submitting()" class="amx-hero__spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
            </svg>
          </button>
        </div>
        <p class="amx-hero__hint">Describe your idea and open it straight in the editor — or browse assets below.</p>
      </div>
    </section>

    <section class="amx-cal-section">
      <div class="amx-cal-section__header">
        <div>
          <h3 class="amx-cal-section__title">Strategic calendar</h3>
          <p class="amx-cal-section__sub">Important dates for your campaigns</p>
        </div>
        <div class="amx-cal-section__nav">
          <a routerLink="/calendar" class="amx-cal-section__view-all">
            View full calendar
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
          <button class="amx-cal-section__arrow" type="button" aria-label="Previous"
                  (click)="prevCalPage()" [disabled]="calPage() === 0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button class="amx-cal-section__arrow" type="button" aria-label="Next"
                  (click)="nextCalPage()" [disabled]="calPage() >= (calEvents.length / 4) - 1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="amx-cal-cards">
        <div *ngFor="let ev of visibleCalEvents(); let i = index"
             class="amx-cal-card"
             [class.amx-cal-card--active]="activeEvent() === ev"
             [style.background]="ev.gradient"
             (click)="activeEvent.set(ev)">

          <div class="amx-cal-card__preview-wrap">
            <div class="amx-cal-card__preview-shadow">
              <img [src]="ev.cover" [alt]="ev.title" class="amx-cal-card__preview-img" loading="lazy"/>
            </div>
          </div>

          <div class="amx-cal-card__footer">
            <div class="amx-cal-card__footer-left">
              <span class="amx-cal-card__icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              <div>
                <p class="amx-cal-card__title">{{ ev.title }}</p>
                <p class="amx-cal-card__when">{{ ev.when }}</p>
              </div>
            </div>
            <div class="amx-cal-card__tags">
              <span *ngFor="let tag of ev.tags"
                    class="amx-cal-tag amx-cal-tag--{{ tag.type }}">
                <svg *ngIf="tag.type === 'next'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <svg *ngIf="tag.type === 'high'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2c0 0-7 8-7 13a7 7 0 0 0 14 0c0-5-7-13-7-13z"/></svg>
                <svg *ngIf="tag.type === 'sought'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                {{ tag.label }}
              </span>
            </div>
          </div>

        </div>
      </div>

      <div class="amx-cal-resources" *ngIf="activeEvent()">
        <p class="amx-cal-resources__label">
          See below the resources for
          <span class="amx-cal-resources__event-name">{{ activeEvent()!.title }}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="amx-cal-resources__arrow-down" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </p>
      </div>

      <div class="amx-resources-header" *ngIf="activeEvent()">
        <h4 class="amx-resources-header__title">
          Resources for
          <span class="amx-resources-header__highlight">{{ activeEvent()!.title }}</span>
        </h4>
        <a routerLink="/marketplace" class="amx-resources-header__see-all">
          See all
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </a>
      </div>

      <div class="amx-thumb-grid" *ngIf="activeEvent()">
        <div *ngFor="let asset of activeEvent()!.assets"
             class="amx-thumb-card"
             (click)="openAsset(asset.slug, asset.img, asset.title)"
             style="cursor:pointer">
          <div class="amx-thumb-card__img-wrap">
            <img [src]="asset.img" [alt]="asset.title" class="amx-thumb-card__img" loading="lazy"/>
            <div class="amx-thumb-card__overlay">
              <button class="amx-thumb-card__select" type="button" aria-label="View asset details"
                      (click)="$event.stopPropagation(); openAsset(asset.slug, asset.img, asset.title)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="featured-assets">
      <div class="featured-assets__header">
        <h3 class="featured-assets__title">Featured Assets</h3>
        <a routerLink="/marketplace" class="featured-assets__link">
          Browse all
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </a>
      </div>

      <!-- Loading skeletons -->
      <div class="asset-grid" *ngIf="loading()">
        <div class="skeleton skeleton--card" *ngFor="let _ of [1,2,3,4,5,6]"></div>
      </div>

      <!-- Error state -->
      <div class="amx-assets-error" *ngIf="!loading() && loadError()">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p class="amx-assets-error__msg">Couldn't load assets right now.</p>
        <button class="amx-assets-error__retry" type="button" (click)="retryLoad()">
          Try again
        </button>
      </div>

      <!-- Asset grid -->
      <div class="asset-grid" *ngIf="!loading() && !loadError() && assets().length > 0">
        <amx-asset-card
          *ngFor="let asset of assets(); trackBy: trackById"
          [asset]="asset"
          (download)="onDownload($event)"
          (edit)="onEdit($event)"
          (save)="onSave($event)"
        />
      </div>

      <!-- Empty state (API responded but returned zero items) -->
      <div class="amx-assets-empty" *ngIf="!loading() && !loadError() && assets().length === 0">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 9h6M9 13h4"/>
        </svg>
        <p>No assets found. Check back soon!</p>
      </div>
    </section>

    <amx-add-to-collection
      *ngIf="saveMenuOpen()"
      [assetId]="saveAssetId()"
      (closed)="saveMenuOpen.set(false)"
    />
  `,
  styleUrl: './asset-list.component.scss',
})
export class AssetListComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly svc    = inject(MarketplaceService);
  private readonly router = inject(Router);
  private readonly el     = inject(ElementRef);
  private readonly mm     = gsap.matchMedia();
  readonly collectionsSvc = inject(CollectionsService);

  assets      = signal<Asset[]>([]);
  loading     = signal(true);
  loadError   = signal(false);
  total       = signal(0);
  currentPage = signal(1);
  totalPages  = signal(1);

  /** AI prompt bar */
  prompt     = signal('');
  submitting = signal(false);

  readonly saveMenuOpen = signal(false);
  readonly saveAssetId  = signal('');

  calPage     = signal(0);
  activeEvent = signal<CalendarEvent | null>(null);

  // ── Calendar: upcoming events from July 2026 onward ──────────────────────
  readonly calEvents: CalendarEvent[] = [
    {
      emoji: '🇺🇬', title: 'Uganda Independence Day', when: '09/10/2026', month: 'OCTOBER 2026',
      gradient: 'linear-gradient(145deg, #fffbeb 0%, #fde68a 60%, #fbbf24 100%)',
      cover: '/assets/images/thumbnails/african-Leaders.png',
      tags: [{ label: 'Upcoming', type: 'next' }, { label: 'On high', type: 'high' }],
      assets: [
        { img: '/assets/images/thumbnails/african-Leaders.png',          title: 'Independence 1',  slug: 'modern-business-card' },
        { img: '/assets/images/thumbnails/African-Day.jpg',              title: 'Independence 2',  slug: 'instagram-branding-kit' },
        { img: '/assets/images/thumbnails/International-Day5.png',       title: 'Independence 3',  slug: 'vintage-flyer-pack' },
        { img: '/assets/images/thumbnails/Denis.jpg',                    title: 'Independence 4',  slug: 'dark-abstract-backgrounds' },
        { img: '/assets/images/thumbnails/Coach-Paul.jpg',               title: 'Independence 5',  slug: 'phone-mockup-collection' },
        { img: '/assets/images/thumbnails/Kisoro-2.jpg',                 title: 'Independence 6',  slug: 'explainer-video-motion-pack' },
        { img: '/assets/images/thumbnails/Dr-JP-Business-cards.jpg',     title: 'Independence 7',  slug: 'minimalist-pitch-deck' },
        { img: '/assets/images/thumbnails/S.6.Candidates-2.jpg',         title: 'Independence 8',  slug: 'ai-landscape-pack' },
        { img: '/assets/images/thumbnails/P.7-Candidates.jpg',           title: 'Independence 9',  slug: 'modern-business-card' },
        { img: '/assets/images/thumbnails/Bombo-Sec-Thumbnail.png',      title: 'Independence 10', slug: 'instagram-branding-kit' },
        { img: '/assets/images/thumbnails/Inspirations-Be-Sincere.jpg',  title: 'Independence 11', slug: 'vintage-flyer-pack' },
        { img: '/assets/images/thumbnails/Inspirations-creative2.jpg',   title: 'Independence 12', slug: 'dark-abstract-backgrounds' },
        { img: '/assets/images/thumbnails/T-shirt-both-sides-2.png',     title: 'Independence 13', slug: 'phone-mockup-collection' },
        { img: '/assets/images/thumbnails/Happy-new-month.png',          title: 'Independence 14', slug: 'explainer-video-motion-pack' },
      ],
    },
    {
      emoji: '🎃', title: 'Halloween', when: '31/10/2026', month: 'OCTOBER 2026',
      gradient: 'linear-gradient(145deg, #fff7ed 0%, #fed7aa 60%, #f97316 100%)',
      cover: '/assets/images/thumbnails/image-gen-4.jpg',
      tags: [{ label: 'More sought', type: 'sought' }],
      assets: [
        { img: '/assets/images/thumbnails/image-gen-4.jpg',                       title: 'Halloween 1',  slug: 'dark-abstract-backgrounds' },
        { img: '/assets/images/thumbnails/9f303f86fd509fb3878fd01cf68aa4fa.jpg',  title: 'Halloween 2',  slug: 'phone-mockup-collection' },
        { img: '/assets/images/thumbnails/e6d1348494da9d5ec91f81fe2a3acb57.jpg',  title: 'Halloween 3',  slug: 'ai-landscape-pack' },
        { img: '/assets/images/thumbnails/982fc90f76e2f0c38e082c9f8700dd5c.jpg',  title: 'Halloween 4',  slug: 'vintage-flyer-pack' },
        { img: '/assets/images/thumbnails/5bab3098d48598d96d159989a821062d.jpg',  title: 'Halloween 5',  slug: 'modern-business-card' },
        { img: '/assets/images/thumbnails/916d081a3838f5ae2c67906d7c7ab7b9.jpg',  title: 'Halloween 6',  slug: 'instagram-branding-kit' },
        { img: '/assets/images/thumbnails/a408d491548f6f21a9a1ec53185cf28b.jpg',  title: 'Halloween 7',  slug: 'minimalist-pitch-deck' },
        { img: '/assets/images/thumbnails/Inspirations-creative2.jpg',            title: 'Halloween 8',  slug: 'explainer-video-motion-pack' },
        { img: '/assets/images/thumbnails/SoarAway-quotes-4.png',                 title: 'Halloween 9',  slug: 'dark-abstract-backgrounds' },
        { img: '/assets/images/thumbnails/T-shirt-both-sides-2.png',              title: 'Halloween 10', slug: 'phone-mockup-collection' },
      ],
    },
    {
      emoji: '🎄', title: 'Christmas 2026', when: '25/12/2026', month: 'DECEMBER 2026',
      gradient: 'linear-gradient(145deg, #f0fdf4 0%, #bbf7d0 60%, #22c55e 100%)',
      cover: '/assets/images/thumbnails/SoarAway-Easter.jpg',
      tags: [{ label: 'On high', type: 'high' }],
      assets: [
        { img: '/assets/images/thumbnails/SoarAway-Easter.jpg',                    title: 'Christmas 1',  slug: 'instagram-branding-kit' },
        { img: '/assets/images/thumbnails/916d081a3838f5ae2c67906d7c7ab7b9.jpg',  title: 'Christmas 2',  slug: 'modern-business-card' },
        { img: '/assets/images/thumbnails/5bab3098d48598d96d159989a821062d.jpg',  title: 'Christmas 3',  slug: 'ai-landscape-pack' },
        { img: '/assets/images/thumbnails/e6d1348494da9d5ec91f81fe2a3acb57.jpg',  title: 'Christmas 4',  slug: 'explainer-video-motion-pack' },
        { img: '/assets/images/thumbnails/982fc90f76e2f0c38e082c9f8700dd5c.jpg',  title: 'Christmas 5',  slug: 'vintage-flyer-pack' },
        { img: '/assets/images/thumbnails/9f303f86fd509fb3878fd01cf68aa4fa.jpg',  title: 'Christmas 6',  slug: 'dark-abstract-backgrounds' },
        { img: '/assets/images/thumbnails/a408d491548f6f21a9a1ec53185cf28b.jpg',  title: 'Christmas 7',  slug: 'phone-mockup-collection' },
        { img: '/assets/images/thumbnails/image-gen-4.jpg',                        title: 'Christmas 8',  slug: 'minimalist-pitch-deck' },
        { img: '/assets/images/thumbnails/Inspirations-Be-Sincere.jpg',            title: 'Christmas 9',  slug: 'ai-landscape-pack' },
        { img: '/assets/images/thumbnails/Inspirations-creative2.jpg',             title: 'Christmas 10', slug: 'modern-business-card' },
        { img: '/assets/images/thumbnails/Happy-new-month.png',                    title: 'Christmas 11', slug: 'instagram-branding-kit' },
        { img: '/assets/images/thumbnails/SoarAway-quotes-4.png',                 title: 'Christmas 12', slug: 'vintage-flyer-pack' },
        { img: '/assets/images/thumbnails/Bombo-Sec-Thumbnail.png',               title: 'Christmas 13', slug: 'dark-abstract-backgrounds' },
        { img: '/assets/images/thumbnails/P.7-Candidates.jpg',                    title: 'Christmas 14', slug: 'phone-mockup-collection' },
      ],
    },
    {
      emoji: '🎆', title: 'New Year 2027', when: '01/01/2027', month: 'JANUARY 2027',
      gradient: 'linear-gradient(145deg, #eff6ff 0%, #bfdbfe 60%, #60a5fa 100%)',
      cover: '/assets/images/thumbnails/african-Leaders.png',
      tags: [{ label: 'More sought', type: 'sought' }],
      assets: [
        { img: '/assets/images/thumbnails/african-Leaders.png',          title: 'New Year 1',  slug: 'dark-abstract-backgrounds' },
        { img: '/assets/images/thumbnails/African-Day.jpg',              title: 'New Year 2',  slug: 'explainer-video-motion-pack' },
        { img: '/assets/images/thumbnails/International-Day5.png',       title: 'New Year 3',  slug: 'vintage-flyer-pack' },
        { img: '/assets/images/thumbnails/Denis.jpg',                    title: 'New Year 4',  slug: 'modern-business-card' },
        { img: '/assets/images/thumbnails/Coach-Paul.jpg',               title: 'New Year 5',  slug: 'instagram-branding-kit' },
        { img: '/assets/images/thumbnails/Kisoro-2.jpg',                 title: 'New Year 6',  slug: 'phone-mockup-collection' },
        { img: '/assets/images/thumbnails/Dr-JP-Business-cards.jpg',     title: 'New Year 7',  slug: 'minimalist-pitch-deck' },
        { img: '/assets/images/thumbnails/S.6.Candidates-2.jpg',         title: 'New Year 8',  slug: 'ai-landscape-pack' },
        { img: '/assets/images/thumbnails/P.7-Candidates.jpg',           title: 'New Year 9',  slug: 'dark-abstract-backgrounds' },
        { img: '/assets/images/thumbnails/Bombo-Sec-Thumbnail.png',      title: 'New Year 10', slug: 'explainer-video-motion-pack' },
        { img: '/assets/images/thumbnails/Inspirations-Be-Sincere.jpg',  title: 'New Year 11', slug: 'vintage-flyer-pack' },
        { img: '/assets/images/thumbnails/T-shirt-both-sides-2.png',     title: 'New Year 12', slug: 'modern-business-card' },
        { img: '/assets/images/thumbnails/Safe-Birth-Awareness-CampaignArtboard-1-copy-2.png', title: 'New Year 13', slug: 'instagram-branding-kit' },
        { img: '/assets/images/thumbnails/Happy-new-month.png',          title: 'New Year 14', slug: 'phone-mockup-collection' },
      ],
    },
    {
      emoji: '❤️', title: "Valentine's Day", when: '14/02/2027', month: 'FEBRUARY 2027',
      gradient: 'linear-gradient(145deg, #fdf2f8 0%, #fbcfe8 60%, #f472b6 100%)',
      cover: '/assets/images/thumbnails/916d081a3838f5ae2c67906d7c7ab7b9.jpg',
      tags: [{ label: 'On high', type: 'high' }],
      assets: [
        { img: '/assets/images/thumbnails/916d081a3838f5ae2c67906d7c7ab7b9.jpg',  title: "Valentine's 1",  slug: 'instagram-branding-kit' },
        { img: '/assets/images/thumbnails/5bab3098d48598d96d159989a821062d.jpg',  title: "Valentine's 2",  slug: 'modern-business-card' },
        { img: '/assets/images/thumbnails/image-gen-4.jpg',                        title: "Valentine's 3",  slug: 'ai-landscape-pack' },
        { img: '/assets/images/thumbnails/Inspirations-creative2.jpg',             title: "Valentine's 4",  slug: 'vintage-flyer-pack' },
        { img: '/assets/images/thumbnails/SoarAway-quotes-4.png',                 title: "Valentine's 5",  slug: 'dark-abstract-backgrounds' },
        { img: '/assets/images/thumbnails/T-shirt-both-sides-2.png',              title: "Valentine's 6",  slug: 'phone-mockup-collection' },
        { img: '/assets/images/thumbnails/Denis.jpg',                              title: "Valentine's 7",  slug: 'minimalist-pitch-deck' },
        { img: '/assets/images/thumbnails/Coach-Paul.jpg',                         title: "Valentine's 8",  slug: 'ai-landscape-pack' },
      ],
    },
    {
      emoji: '🐰', title: 'Easter 2027', when: '28/03/2027', month: 'MARCH 2027',
      gradient: 'linear-gradient(145deg, #fffbeb 0%, #fde68a 60%, #fbbf24 100%)',
      cover: '/assets/images/thumbnails/SoarAway-Easter.jpg',
      tags: [{ label: 'More sought', type: 'sought' }],
      assets: [
        { img: '/assets/images/thumbnails/SoarAway-Easter.jpg',                    title: 'Easter 2027 1',  slug: 'modern-business-card' },
        { img: '/assets/images/thumbnails/5bab3098d48598d96d159989a821062d.jpg',  title: 'Easter 2027 2',  slug: 'instagram-branding-kit' },
        { img: '/assets/images/thumbnails/982fc90f76e2f0c38e082c9f8700dd5c.jpg',  title: 'Easter 2027 3',  slug: 'vintage-flyer-pack' },
        { img: '/assets/images/thumbnails/a408d491548f6f21a9a1ec53185cf28b.jpg',  title: 'Easter 2027 4',  slug: 'phone-mockup-collection' },
        { img: '/assets/images/thumbnails/e6d1348494da9d5ec91f81fe2a3acb57.jpg',  title: 'Easter 2027 5',  slug: 'explainer-video-motion-pack' },
        { img: '/assets/images/thumbnails/image-gen-4.jpg',                        title: 'Easter 2027 6',  slug: 'minimalist-pitch-deck' },
        { img: '/assets/images/thumbnails/African-Day.jpg',                        title: 'Easter 2027 7',  slug: 'ai-landscape-pack' },
        { img: '/assets/images/thumbnails/safebirth-1080.jpg',                    title: 'Easter 2027 8',  slug: 'dark-abstract-backgrounds' },
      ],
    },
    {
      emoji: '🏥', title: 'World Health Day 2027', when: '07/04/2027', month: 'APRIL 2027',
      gradient: 'linear-gradient(145deg, #ecfdf5 0%, #a7f3d0 60%, #34d399 100%)',
      cover: '/assets/images/thumbnails/safebirth-1080.jpg',
      tags: [{ label: 'More sought', type: 'sought' }],
      assets: [
        { img: '/assets/images/thumbnails/safebirth-1080.jpg',                    title: 'Health Day 1', slug: 'phone-mockup-collection' },
        { img: '/assets/images/thumbnails/safebirth-1080-breathe.jpg',            title: 'Health Day 2', slug: 'ai-landscape-pack' },
        { img: '/assets/images/thumbnails/safebirth-1080-Left-side.jpg',          title: 'Health Day 3', slug: 'minimalist-pitch-deck' },
        { img: '/assets/images/thumbnails/Safe-Birth-Awareness-CampaignArtboard-1-copy-2.png', title: 'Health Day 4', slug: 'modern-business-card' },
        { img: '/assets/images/thumbnails/International-Day5.png',                title: 'Health Day 5', slug: 'vintage-flyer-pack' },
        { img: '/assets/images/thumbnails/Dr-JP-Business-cards.jpg',              title: 'Health Day 6', slug: 'dark-abstract-backgrounds' },
        { img: '/assets/images/thumbnails/African-Day.jpg',                       title: 'Health Day 7', slug: 'explainer-video-motion-pack' },
        { img: '/assets/images/thumbnails/Inspirations-Be-Sincere.jpg',           title: 'Health Day 8', slug: 'phone-mockup-collection' },
      ],
    },
    {
      emoji: '👶', title: 'African Children\'s Day', when: '16/06/2027', month: 'JUNE 2027',
      gradient: 'linear-gradient(145deg, #fdf4ff 0%, #e9d5ff 60%, #a855f7 100%)',
      cover: '/assets/images/thumbnails/International-Day5.png',
      tags: [{ label: 'Upcoming', type: 'next' }],
      assets: [
        { img: '/assets/images/thumbnails/International-Day5.png',       title: 'Children\'s Day 1', slug: 'dark-abstract-backgrounds' },
        { img: '/assets/images/thumbnails/African-Day.jpg',              title: 'Children\'s Day 2', slug: 'explainer-video-motion-pack' },
        { img: '/assets/images/thumbnails/Bombo-Sec-Thumbnail.png',      title: 'Children\'s Day 3', slug: 'vintage-flyer-pack' },
        { img: '/assets/images/thumbnails/P.7-Candidates.jpg',           title: 'Children\'s Day 4', slug: 'modern-business-card' },
        { img: '/assets/images/thumbnails/S.6.Candidates-2.jpg',         title: 'Children\'s Day 5', slug: 'instagram-branding-kit' },
        { img: '/assets/images/thumbnails/Denis.jpg',                    title: 'Children\'s Day 6', slug: 'phone-mockup-collection' },
        { img: '/assets/images/thumbnails/Coach-Paul.jpg',               title: 'Children\'s Day 7', slug: 'minimalist-pitch-deck' },
        { img: '/assets/images/thumbnails/Happy-new-month.png',          title: 'Children\'s Day 8', slug: 'ai-landscape-pack' },
      ],
    },
  ];

  readonly visibleCalEvents = computed(() => {
    const start = this.calPage() * 4;
    return this.calEvents.slice(start, start + 4);
  });

  private params: AssetListParams = { page: 1, limit: 24 };

  ngOnInit(): void {
    this.activeEvent.set(this.calEvents[0]);
    this.load();
  }

  ngAfterViewInit(): void {
    const el = this.el.nativeElement;

    this.mm.add('(min-width: 640px)', () => {
      const ctx = gsap.context(() => {

        gsap.fromTo('.amx-hero__card',
          { y: 60, opacity: 0, scale: 0.96 },
          {
            scrollTrigger: {
              trigger: '.amx-hero', start: 'top 80%',
              toggleActions: 'play none none none',
            },
            y: 0, opacity: 1, scale: 1,
            duration: 1.2, ease: 'power4.out',
          }
        );

        gsap.fromTo('.amx-cal-section__header',
          { y: 30, opacity: 0 },
          {
            scrollTrigger: {
              trigger: '.amx-cal-section', start: 'top 80%',
              toggleActions: 'play none none none',
            },
            y: 0, opacity: 1,
            duration: 0.7, ease: 'power3.out',
          }
        );

        const cards = gsap.utils.toArray('.amx-cal-card') as HTMLElement[];
        cards.forEach((card, i) => {
          const dir = i % 2 === 0 ? -1 : 1;
          gsap.fromTo(card,
            { y: 80, x: 40 * dir, opacity: 0, scale: 0.88, rotation: -6 * dir },
            {
              scrollTrigger: {
                trigger: card, start: 'top 88%',
                toggleActions: 'play none none none',
              },
              y: 0, x: 0, opacity: 1, scale: 1, rotation: 0,
              duration: 0.7, ease: 'back.out(1.7)',
              delay: i * 0.15,
            }
          );
        });

        gsap.fromTo('.amx-cal-resources__label',
          { y: 20, opacity: 0 },
          {
            scrollTrigger: {
              trigger: '.amx-cal-resources', start: 'top 88%',
              toggleActions: 'play none none none',
            },
            y: 0, opacity: 1,
            duration: 0.5, ease: 'power2.out',
          }
        );

        gsap.fromTo('.amx-resources-header',
          { y: 20, opacity: 0 },
          {
            scrollTrigger: {
              trigger: '.amx-resources-header', start: 'top 88%',
              toggleActions: 'play none none none',
            },
            y: 0, opacity: 1,
            duration: 0.5, ease: 'power3.out',
          }
        );

        const thumbs = gsap.utils.toArray('.amx-thumb-card') as HTMLElement[];
        thumbs.forEach((card, i) => {
          gsap.fromTo(card,
            { y: 30, opacity: 0, scale: 0.92 },
            {
              scrollTrigger: {
                trigger: card, start: 'top 90%',
                toggleActions: 'play none none none',
              },
              y: 0, opacity: 1, scale: 1,
              duration: 0.45, ease: 'power3.out',
              delay: (i % 7) * 0.05,
            }
          );
        });

        gsap.fromTo('.featured-assets__header',
          { x: -30, opacity: 0 },
          {
            scrollTrigger: {
              trigger: '.featured-assets', start: 'top 80%',
              toggleActions: 'play none none none',
            },
            x: 0, opacity: 1,
            duration: 0.7, ease: 'power3.out',
          }
        );

      }, el);
      return () => ctx.revert();
    });

    this.mm.add('(max-width: 639px)', () => {
      const ctx = gsap.context(() => {

        gsap.fromTo('.amx-hero__card',
          { y: 40, opacity: 0, scale: 0.97 },
          {
            scrollTrigger: {
              trigger: '.amx-hero', start: 'top 85%',
              toggleActions: 'play none none none',
            },
            y: 0, opacity: 1, scale: 1,
            duration: 0.8, ease: 'power3.out',
          }
        );

        const cards = gsap.utils.toArray('.amx-cal-card') as HTMLElement[];
        cards.forEach((card, i) => {
          gsap.fromTo(card,
            { y: 50, opacity: 0, scale: 0.92, rotation: -4 },
            {
              scrollTrigger: {
                trigger: card, start: 'top 90%',
                toggleActions: 'play none none none',
              },
              y: 0, opacity: 1, scale: 1, rotation: 0,
              duration: 0.55, ease: 'back.out(1.5)',
              delay: i * 0.12,
            }
          );
        });

        const thumbs = gsap.utils.toArray('.amx-thumb-card') as HTMLElement[];
        thumbs.forEach((card, i) => {
          gsap.fromTo(card,
            { y: 20, opacity: 0 },
            {
              scrollTrigger: {
                trigger: card, start: 'top 92%',
                toggleActions: 'play none none none',
              },
              y: 0, opacity: 1,
              duration: 0.35, ease: 'power2.out',
              delay: (i % 2) * 0.06,
            }
          );
        });

      }, el);
      return () => ctx.revert();
    });
  }

  ngOnDestroy(): void {
    this.mm.kill();
  }

  prevCalPage(): void { if (this.calPage() > 0) this.calPage.update(p => p - 1); }
  /** Each page shows 4 cards; total pages = ceil(events / 4) */
  nextCalPage(): void {
    const maxPage = Math.ceil(this.calEvents.length / 4) - 1;
    if (this.calPage() < maxPage) this.calPage.update(p => p + 1);
  }

  submitPrompt(): void {
    const text = this.prompt().trim();
    if (!text) return;
    this.submitting.set(true);
    // Brief visual delay then navigate to editor with the prompt
    setTimeout(() => {
      this.submitting.set(false);
      this.router.navigate(['/editor'], { queryParams: { prompt: text } });
    }, 600);
  }

  retryLoad(): void {
    this.loadError.set(false);
    this.load();
  }

  onDownload(asset: Asset): void {
    this.svc.requestDownload(asset.id).subscribe({
      next: ({ signedUrl }) => window.open(signedUrl, '_blank'),
      error: (err) => alert(err.message),
    });
  }

  onEdit(asset: Asset): void { this.router.navigate(['/editor'], { queryParams: { assetId: asset.id, imageUrl: asset.previewUrl, title: asset.title } }); }
  onSave(data: { asset: Asset; event: MouseEvent }): void {
    this.saveAssetId.set(data.asset.id);
    this.saveMenuOpen.set(true);
  }
  trackById(_: number, a: Asset): string { return a.id; }
  openAsset(slug: string, img?: string, label?: string): void {
    this.router.navigate(['/marketplace', 'asset', slug], {
      queryParams: { thumb: img ?? null, label: label ?? null }
    });
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);

    // json-server returns a plain array at /assets; the real API returns
    // { data, total, totalPages }. Handle both formats gracefully.
    this.svc.getAssets(this.params).pipe(
      map((res: unknown) => {
        if (Array.isArray(res)) {
          const arr = res as Asset[];
          return { data: arr, total: arr.length, totalPages: 1 } as PaginatedResponse<Asset>;
        }
        return res as PaginatedResponse<Asset>;
      }),
      catchError(() => {
        this.loadError.set(true);
        this.loading.set(false);
        return of(null);
      }),
    ).subscribe(res => {
      if (!res) return;
      this.assets.set(res.data);
      this.total.set(res.total);
      this.totalPages.set(res.totalPages);
      this.loading.set(false);
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        this.animateAssetCards();
      });
    });
  }

  private animateAssetCards(): void {
    const grid = this.el.nativeElement.querySelector('.asset-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('amx-asset-card');
    if (!cards.length) return;

    cards.forEach((card: Element, i: number) => {
      const dir = i % 2 === 0 ? -1 : 1;
      gsap.fromTo(card,
        { y: 60, x: 20 * dir, opacity: 0, scale: 0.93, rotation: -3 * dir },
        {
          y: 0, x: 0, opacity: 1, scale: 1, rotation: 0,
          duration: 0.65, ease: 'power3.out',
          delay: i * 0.07,
        }
      );
    });
  }
}
