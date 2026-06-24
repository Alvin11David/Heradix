import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface MockCollection {
  id: string;
  name: string;
  fileCount: number;
  format: string;
  thumbnails: string[];
  items?: { id: string; name: string; thumbnail: string }[];
}

interface ExpandedCollection extends MockCollection {
  items: { id: string; name: string; thumbnail: string }[];
}

@Component({
  selector: 'amx-collections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="amx-col-page">

      <!-- Page heading -->
      <div class="amx-col-page__hero">
        <h1 class="amx-col-page__title">Amazing Collections</h1>
        <p class="amx-col-page__sub">Selected files one by one, organized by subjects and categories.</p>
      </div>

      <!-- Search bar -->
      <div class="amx-col-search">
        <input
          class="amx-col-search__input"
          type="text"
          placeholder="Type a word to search..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
        />
        <button class="amx-col-search__btn">Search</button>
      </div>

      <!-- Collections grid -->
      <div class="amx-col-grid">
        <div class="amx-col-card" *ngFor="let col of filtered()" (click)="viewCollection(col)">
          <!-- 2×2 mosaic -->
          <div class="amx-col-card__mosaic">
            <img
              *ngFor="let thumb of col.thumbnails.slice(0, 4)"
              [src]="thumb"
              [alt]="col.name"
              class="amx-col-card__tile"
              loading="lazy"
            />
          </div>
          <!-- Card footer -->
          <div class="amx-col-card__footer">
            <span class="amx-col-card__name">{{ col.name }}</span>
            <span class="amx-col-card__meta">{{ col.fileCount }} files&nbsp;|&nbsp;{{ col.format }} format</span>
          </div>
        </div>
      </div>

      <p class="amx-col-empty" *ngIf="filtered().length === 0">
        No collections match your search.
      </p>
    </div>
  `,
  styleUrl: './collections.component.scss',
})
export class CollectionsComponent {
  private readonly router = inject(Router);
  searchQuery = signal('');
  selectedCollection = signal<ExpandedCollection | null>(null);

  readonly allCollections: ExpandedCollection[] = [
    {
      id: 'safe-birth',
      name: 'Safe Birth Campaign',
      fileCount: 5,
      format: 'PNG/JPG',
      thumbnails: [
        '/assets/images/thumbnails/safebirth-1080.jpg',
        '/assets/images/thumbnails/safebirth-1080-breathe.jpg',
        '/assets/images/thumbnails/safebirth-1080-Left-side.jpg',
        '/assets/images/thumbnails/Safe-Birth-Awareness-CampaignArtboard-1-copy-2.png',
      ],
      items: [
        { id: '1', name: 'Safe Birth - Main', thumbnail: '/assets/images/thumbnails/safebirth-1080.jpg' },
        { id: '2', name: 'Safe Birth - Breathe', thumbnail: '/assets/images/thumbnails/safebirth-1080-breathe.jpg' },
        { id: '3', name: 'Safe Birth - Left Side', thumbnail: '/assets/images/thumbnails/safebirth-1080-Left-side.jpg' },
        { id: '4', name: 'Safe Birth - Campaign', thumbnail: '/assets/images/thumbnails/Safe-Birth-Awareness-CampaignArtboard-1-copy-2.png' },
        { id: '5', name: 'Safe Birth - Alternative', thumbnail: '/assets/images/thumbnails/Safe-Birth-Awareness-CampaignArtboard-1-copy-3.png' },
      ],
    },
    {
      id: 'easter-resources',
      name: 'Easter Resources',
      fileCount: 8,
      format: 'JPG',
      thumbnails: [
        '/assets/images/thumbnails/5bab3098d48598d96d159989a821062d.jpg',
        '/assets/images/thumbnails/916d081a3838f5ae2c67906d7c7ab7b9.jpg',
        '/assets/images/thumbnails/SoarAway-Easter.jpg',
        '/assets/images/thumbnails/image-gen-4.jpg',
      ],
      items: [
        { id: '1', name: 'Easter - Design 1', thumbnail: '/assets/images/thumbnails/5bab3098d48598d96d159989a821062d.jpg' },
        { id: '2', name: 'Easter - Design 2', thumbnail: '/assets/images/thumbnails/916d081a3838f5ae2c67906d7c7ab7b9.jpg' },
        { id: '3', name: 'Soar Away Easter', thumbnail: '/assets/images/thumbnails/SoarAway-Easter.jpg' },
        { id: '4', name: 'Image Gen 4', thumbnail: '/assets/images/thumbnails/image-gen-4.jpg' },
        { id: '5', name: 'Easter - Theme 1', thumbnail: '/assets/images/thumbnails/5bab3098d48598d96d159989a821062d.jpg' },
        { id: '6', name: 'Easter - Theme 2', thumbnail: '/assets/images/thumbnails/916d081a3838f5ae2c67906d7c7ab7b9.jpg' },
        { id: '7', name: 'Easter - Theme 3', thumbnail: '/assets/images/thumbnails/SoarAway-Easter.jpg' },
        { id: '8', name: 'Easter - Theme 4', thumbnail: '/assets/images/thumbnails/image-gen-4.jpg' },
      ],
    },
    {
      id: 'african-day',
      name: 'African Day',
      fileCount: 4,
      format: 'JPG/PNG',
      thumbnails: [
        '/assets/images/thumbnails/African-Day.jpg',
        '/assets/images/thumbnails/african-Leaders.png',
        '/assets/images/thumbnails/International-Day5.png',
        '/assets/images/thumbnails/SoarAway-quotes-4.png',
      ],
      items: [
        { id: '1', name: 'African Day', thumbnail: '/assets/images/thumbnails/African-Day.jpg' },
        { id: '2', name: 'African Leaders', thumbnail: '/assets/images/thumbnails/african-Leaders.png' },
        { id: '3', name: 'International Day 5', thumbnail: '/assets/images/thumbnails/International-Day5.png' },
        { id: '4', name: 'Soar Away Quotes', thumbnail: '/assets/images/thumbnails/SoarAway-quotes-4.png' },
      ],
    },
    {
      id: 'education-schools',
      name: 'Education & Schools',
      fileCount: 4,
      format: 'JPG/PNG',
      thumbnails: [
        '/assets/images/thumbnails/P.7-Candidates.jpg',
        '/assets/images/thumbnails/S.6.Candidates-2.jpg',
        '/assets/images/thumbnails/Kisoro-2.jpg',
        '/assets/images/thumbnails/Bombo-Sec-Thumbnail.png',
      ],
      items: [
        { id: '1', name: 'P.7 Candidates', thumbnail: '/assets/images/thumbnails/P.7-Candidates.jpg' },
        { id: '2', name: 'S.6 Candidates', thumbnail: '/assets/images/thumbnails/S.6.Candidates-2.jpg' },
        { id: '3', name: 'Kisoro School', thumbnail: '/assets/images/thumbnails/Kisoro-2.jpg' },
        { id: '4', name: 'Bombo Secondary', thumbnail: '/assets/images/thumbnails/Bombo-Sec-Thumbnail.png' },
      ],
    },
    {
      id: 'business-cards',
      name: 'Business Cards',
      fileCount: 4,
      format: 'JPG',
      thumbnails: [
        '/assets/images/thumbnails/Dr-JP-Business-cards.jpg',
        '/assets/images/thumbnails/Inspirations-Be-Sincere.jpg',
        '/assets/images/thumbnails/Inspirations-creative2.jpg',
        '/assets/images/thumbnails/Denis.jpg',
      ],
      items: [
        { id: '1', name: 'Dr. JP Business Cards', thumbnail: '/assets/images/thumbnails/Dr-JP-Business-cards.jpg' },
        { id: '2', name: 'Be Sincere Cards', thumbnail: '/assets/images/thumbnails/Inspirations-Be-Sincere.jpg' },
        { id: '3', name: 'Creative Design 2', thumbnail: '/assets/images/thumbnails/Inspirations-creative2.jpg' },
        { id: '4', name: 'Denis Cards', thumbnail: '/assets/images/thumbnails/Denis.jpg' },
      ],
    },
    {
      id: 'motivational-quotes',
      name: 'Motivational Quotes',
      fileCount: 4,
      format: 'PNG/JPG',
      thumbnails: [
        '/assets/images/thumbnails/Inspirations-Be-Sincere.jpg',
        '/assets/images/thumbnails/SoarAway-quotes-4.png',
        '/assets/images/thumbnails/Happy-new-month.png',
        '/assets/images/thumbnails/Inspirations-creative2.jpg',
      ],
      items: [
        { id: '1', name: 'Be Sincere Quote', thumbnail: '/assets/images/thumbnails/Inspirations-Be-Sincere.jpg' },
        { id: '2', name: 'Soar Away Quote 4', thumbnail: '/assets/images/thumbnails/SoarAway-quotes-4.png' },
        { id: '3', name: 'Happy New Month', thumbnail: '/assets/images/thumbnails/Happy-new-month.png' },
        { id: '4', name: 'Creative Quote', thumbnail: '/assets/images/thumbnails/Inspirations-creative2.jpg' },
      ],
    },
    {
      id: 'portraits-people',
      name: 'Portraits & People',
      fileCount: 3,
      format: 'JPG',
      thumbnails: [
        '/assets/images/thumbnails/Coach-Paul.jpg',
        '/assets/images/thumbnails/Denis.jpg',
        '/assets/images/thumbnails/Kisoro-2.jpg',
        '/assets/images/thumbnails/Dr-JP-Business-cards.jpg',
      ],
      items: [
        { id: '1', name: 'Coach Paul', thumbnail: '/assets/images/thumbnails/Coach-Paul.jpg' },
        { id: '2', name: 'Denis Portrait', thumbnail: '/assets/images/thumbnails/Denis.jpg' },
        { id: '3', name: 'Kisoro Portrait', thumbnail: '/assets/images/thumbnails/Kisoro-2.jpg' },
      ],
    },
    {
      id: 'apparel-merchandise',
      name: 'Apparel & Merchandise',
      fileCount: 2,
      format: 'PNG',
      thumbnails: [
        '/assets/images/thumbnails/T-shirt-both-sides-2.png',
        '/assets/images/thumbnails/Safe-Birth-Awareness-CampaignArtboard-1-copy-3.png',
        '/assets/images/thumbnails/Bombo-Sec-Thumbnail.png',
        '/assets/images/thumbnails/Happy-new-month.png',
      ],
      items: [
        { id: '1', name: 'T-Shirt Design', thumbnail: '/assets/images/thumbnails/T-shirt-both-sides-2.png' },
        { id: '2', name: 'Apparel Variant', thumbnail: '/assets/images/thumbnails/Safe-Birth-Awareness-CampaignArtboard-1-copy-3.png' },
      ],
    },
  ];

  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.allCollections;
    return this.allCollections.filter(c =>
      c.name.toLowerCase().includes(q) || c.format.toLowerCase().includes(q)
    );
  });

  viewCollection(collection: ExpandedCollection): void {
    // Navigate to collection detail page with collection ID
    this.router.navigate(['/collections', collection.id]);
  }

  openCollection(collection: ExpandedCollection): void {
    this.selectedCollection.set(collection);
  }

  closeCollection(): void {
    this.selectedCollection.set(null);
  }
}
