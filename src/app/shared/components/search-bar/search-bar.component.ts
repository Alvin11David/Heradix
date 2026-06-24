import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetFormat, Orientation } from '../../../core/models/asset.model';

export interface SearchFilters {
  q: string;
  format?: AssetFormat;
  orientation?: Orientation;
  isPremium?: boolean;
}

@Component({
  selector: 'amx-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="search-bar">
      <div class="search-bar__input-wrap">
        <svg class="search-bar__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          class="search-bar__input"
          type="search"
          [placeholder]="placeholder"
          [(ngModel)]="query"
          (keyup.enter)="emitSearch()"
          (ngModelChange)="onQueryChange($event)"
          [attr.aria-label]="placeholder"
        />
        <button *ngIf="query" class="search-bar__clear" (click)="clearSearch()" aria-label="Clear">✕</button>
      </div>

      <div class="search-bar__filters" *ngIf="showFilters">
        <select [(ngModel)]="filters.format" (ngModelChange)="emitSearch()" class="filter-select">
          <option value="">All Formats</option>
          <option value="PSD">PSD</option>
          <option value="AI">Illustrator</option>
          <option value="VECTOR">Vector</option>
          <option value="PHOTO">Photo</option>
          <option value="MOCKUP">Mockup</option>
          <option value="VIDEO">Video</option>
          <option value="PPT">Presentation</option>
          <option value="AI_GEN">AI Generated</option>
        </select>
        <select [(ngModel)]="filters.orientation" (ngModelChange)="emitSearch()" class="filter-select">
          <option value="">All Orientations</option>
          <option value="LANDSCAPE">Landscape</option>
          <option value="PORTRAIT">Portrait</option>
          <option value="SQUARE">Square</option>
        </select>
        <label class="filter-toggle">
          <input type="checkbox" [(ngModel)]="filters.isPremium" (ngModelChange)="emitSearch()" />
          Premium Only
        </label>
      </div>
    </div>
  `,
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent {
  @Input() placeholder = 'Search design assets…';
  @Input() showFilters = true;
  @Output() searched = new EventEmitter<SearchFilters>();

  query = '';
  filters: SearchFilters = { q: '' };

  onQueryChange(val: string): void {
    this.filters.q = val;
  }

  emitSearch(): void {
    this.searched.emit({ ...this.filters, q: this.query });
  }

  clearSearch(): void {
    this.query = '';
    this.filters = { q: '' };
    this.emitSearch();
  }
}
