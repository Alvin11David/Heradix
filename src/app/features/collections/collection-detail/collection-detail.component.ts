import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface CollectionItem {
  id: string;
  name: string;
  thumbnail: string;
  slug?: string;
}

interface Collection {
  id: string;
  name: string;
  fileCount: number;
  format: string;
  items: CollectionItem[];
}

// Mock data - same collections from collections.component
const MOCK_COLLECTIONS: Record<string, Collection> = {
  'safe-birth': {
    id: 'safe-birth',
    name: 'Safe Birth Campaign',
    fileCount: 5,
    format: 'PNG/JPG',
    items: [
      { id: '1', name: 'Safe Birth - Main', thumbnail: '/assets/images/thumbnails/safebirth-1080.jpg', slug: 'safe-birth-main' },
      { id: '2', name: 'Safe Birth - Breathe', thumbnail: '/assets/images/thumbnails/safebirth-1080-breathe.jpg', slug: 'safe-birth-breathe' },
      { id: '3', name: 'Safe Birth - Left Side', thumbnail: '/assets/images/thumbnails/safebirth-1080-Left-side.jpg', slug: 'safe-birth-left' },
      { id: '4', name: 'Safe Birth - Campaign', thumbnail: '/assets/images/thumbnails/Safe-Birth-Awareness-CampaignArtboard-1-copy-2.png', slug: 'safe-birth-campaign' },
      { id: '5', name: 'Safe Birth - Alternative', thumbnail: '/assets/images/thumbnails/Safe-Birth-Awareness-CampaignArtboard-1-copy-3.png', slug: 'safe-birth-alt' },
    ],
  },
  'easter-resources': {
    id: 'easter-resources',
    name: 'Easter Resources',
    fileCount: 8,
    format: 'JPG',
    items: [
      { id: '1', name: 'Easter - Design 1', thumbnail: '/assets/images/thumbnails/5bab3098d48598d96d159989a821062d.jpg', slug: 'easter-design-1' },
      { id: '2', name: 'Easter - Design 2', thumbnail: '/assets/images/thumbnails/916d081a3838f5ae2c67906d7c7ab7b9.jpg', slug: 'easter-design-2' },
      { id: '3', name: 'Soar Away Easter', thumbnail: '/assets/images/thumbnails/SoarAway-Easter.jpg', slug: 'soar-away-easter' },
      { id: '4', name: 'Image Gen 4', thumbnail: '/assets/images/thumbnails/image-gen-4.jpg', slug: 'image-gen-4' },
      { id: '5', name: 'Easter - Theme 1', thumbnail: '/assets/images/thumbnails/5bab3098d48598d96d159989a821062d.jpg', slug: 'easter-theme-1' },
      { id: '6', name: 'Easter - Theme 2', thumbnail: '/assets/images/thumbnails/916d081a3838f5ae2c67906d7c7ab7b9.jpg', slug: 'easter-theme-2' },
      { id: '7', name: 'Easter - Theme 3', thumbnail: '/assets/images/thumbnails/SoarAway-Easter.jpg', slug: 'easter-theme-3' },
      { id: '8', name: 'Easter - Theme 4', thumbnail: '/assets/images/thumbnails/image-gen-4.jpg', slug: 'easter-theme-4' },
    ],
  },
  'african-day': {
    id: 'african-day',
    name: 'African Day',
    fileCount: 4,
    format: 'JPG/PNG',
    items: [
      { id: '1', name: 'African Day', thumbnail: '/assets/images/thumbnails/African-Day.jpg', slug: 'african-day' },
      { id: '2', name: 'African Leaders', thumbnail: '/assets/images/thumbnails/african-Leaders.png', slug: 'african-leaders' },
      { id: '3', name: 'International Day 5', thumbnail: '/assets/images/thumbnails/International-Day5.png', slug: 'intl-day-5' },
      { id: '4', name: 'Soar Away Quotes', thumbnail: '/assets/images/thumbnails/SoarAway-quotes-4.png', slug: 'soar-away-quotes-4' },
    ],
  },
  'education-schools': {
    id: 'education-schools',
    name: 'Education & Schools',
    fileCount: 4,
    format: 'JPG/PNG',
    items: [
      { id: '1', name: 'P.7 Candidates', thumbnail: '/assets/images/thumbnails/P.7-Candidates.jpg', slug: 'p7-candidates' },
      { id: '2', name: 'S.6 Candidates', thumbnail: '/assets/images/thumbnails/S.6.Candidates-2.jpg', slug: 's6-candidates' },
      { id: '3', name: 'Kisoro School', thumbnail: '/assets/images/thumbnails/Kisoro-2.jpg', slug: 'kisoro-school' },
      { id: '4', name: 'Bombo Secondary', thumbnail: '/assets/images/thumbnails/Bombo-Sec-Thumbnail.png', slug: 'bombo-secondary' },
    ],
  },
  'business-cards': {
    id: 'business-cards',
    name: 'Business Cards',
    fileCount: 4,
    format: 'JPG',
    items: [
      { id: '1', name: 'Dr. JP Business Cards', thumbnail: '/assets/images/thumbnails/Dr-JP-Business-cards.jpg', slug: 'dr-jp-cards' },
      { id: '2', name: 'Be Sincere Cards', thumbnail: '/assets/images/thumbnails/Inspirations-Be-Sincere.jpg', slug: 'be-sincere-cards' },
      { id: '3', name: 'Creative Design 2', thumbnail: '/assets/images/thumbnails/Inspirations-creative2.jpg', slug: 'creative-design-2' },
      { id: '4', name: 'Denis Cards', thumbnail: '/assets/images/thumbnails/Denis.jpg', slug: 'denis-cards' },
    ],
  },
  'motivational-quotes': {
    id: 'motivational-quotes',
    name: 'Motivational Quotes',
    fileCount: 4,
    format: 'PNG/JPG',
    items: [
      { id: '1', name: 'Be Sincere Quote', thumbnail: '/assets/images/thumbnails/Inspirations-Be-Sincere.jpg', slug: 'be-sincere-quote' },
      { id: '2', name: 'Soar Away Quote 4', thumbnail: '/assets/images/thumbnails/SoarAway-quotes-4.png', slug: 'soar-away-quote-4' },
      { id: '3', name: 'Happy New Month', thumbnail: '/assets/images/thumbnails/Happy-new-month.png', slug: 'happy-new-month' },
      { id: '4', name: 'Creative Quote', thumbnail: '/assets/images/thumbnails/Inspirations-creative2.jpg', slug: 'creative-quote' },
    ],
  },
  'portraits-people': {
    id: 'portraits-people',
    name: 'Portraits & People',
    fileCount: 3,
    format: 'JPG',
    items: [
      { id: '1', name: 'Coach Paul', thumbnail: '/assets/images/thumbnails/Coach-Paul.jpg', slug: 'coach-paul' },
      { id: '2', name: 'Denis Portrait', thumbnail: '/assets/images/thumbnails/Denis.jpg', slug: 'denis-portrait' },
      { id: '3', name: 'Kisoro Portrait', thumbnail: '/assets/images/thumbnails/Kisoro-2.jpg', slug: 'kisoro-portrait' },
    ],
  },
  'apparel-merchandise': {
    id: 'apparel-merchandise',
    name: 'Apparel & Merchandise',
    fileCount: 2,
    format: 'PNG',
    items: [
      { id: '1', name: 'T-Shirt Design', thumbnail: '/assets/images/thumbnails/T-shirt-both-sides-2.png', slug: 'tshirt-design' },
      { id: '2', name: 'Apparel Variant', thumbnail: '/assets/images/thumbnails/Safe-Birth-Awareness-CampaignArtboard-1-copy-3.png', slug: 'apparel-variant' },
    ],
  },
};

@Component({
  selector: 'amx-collection-detail',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="amx-col-detail-page">
      <!-- Header with back button -->
      <div class="amx-col-detail__header">
        <button class="amx-col-detail__back" (click)="goBack()">← Back to Collections</button>
      </div>

      <!-- Collection info -->
      <div class="amx-col-detail__hero" *ngIf="collection()">
        <h1 class="amx-col-detail__title">{{ collection()!.name }}</h1>
        <p class="amx-col-detail__meta">{{ collection()!.fileCount }} items • {{ collection()!.format }} format</p>
      </div>

      <!-- Items grid -->
      <div class="amx-col-detail__content" *ngIf="collection()">
        <div class="amx-col-detail__grid">
          <div
            class="amx-col-detail__item"
            *ngFor="let item of collection()!.items"
            (click)="viewAssetDetail(item)"
          >
            <div class="amx-col-detail__item-img-wrapper">
              <img
                [src]="item.thumbnail"
                [alt]="item.name"
                class="amx-col-detail__item-img"
                loading="lazy"
              />
            </div>
            <p class="amx-col-detail__item-name">{{ item.name }}</p>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div class="amx-col-detail__empty" *ngIf="!collection()">
        <p>Collection not found</p>
        <button class="amx-col-detail__empty-btn" (click)="goBack()">Go Back</button>
      </div>
    </div>
  `,
  styleUrl: './collection-detail.component.scss',
})
export class CollectionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  collection = signal<Collection | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const collectionId = params.get('id');
      if (collectionId && MOCK_COLLECTIONS[collectionId]) {
        this.collection.set(MOCK_COLLECTIONS[collectionId]);
      }
    });
  }

  viewAssetDetail(item: CollectionItem): void {
    // Navigate to asset detail page using the slug
    if (item.slug) {
      this.router.navigate(['/marketplace/asset', item.slug]);
    }
  }

  goBack(): void {
    this.router.navigate(['/collections']);
  }
}
