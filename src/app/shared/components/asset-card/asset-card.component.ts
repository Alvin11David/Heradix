import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Asset } from '../../../core/models/asset.model';

@Component({
  selector: 'amx-asset-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="asset-card" [class.premium]="asset.isPremium">
      <div class="asset-card__thumbnail">
        <img [src]="asset.thumbnailUrl" [alt]="asset.title" loading="lazy" />
        <span *ngIf="asset.isPremium" class="badge badge--premium" title="Premium Asset">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </span>
        <span *ngIf="asset.isEditable" class="badge badge--editable">Editable</span>
        <div class="asset-card__overlay">
          <button class="btn btn--icon" (click)="onDownload()" aria-label="Download">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button *ngIf="asset.isEditable" class="btn btn--icon" (click)="onEdit()" aria-label="Edit in Canvas">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn--icon" (click)="onSave()" aria-label="Save to collection">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
      </div>
      <div class="asset-card__info">
        <a [routerLink]="['/marketplace', 'asset', asset.slug]" class="asset-card__title">
          {{ asset.title }}
        </a>
        <div class="asset-card__meta">
          <span class="format-tag">{{ asset.format }}</span>
          <span class="orientation-tag">{{ asset.orientation }}</span>
        </div>
        <div class="asset-card__downloads">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {{ asset.downloadCount | number }}
        </div>
      </div>
    </div>
  `,
  styleUrl: './asset-card.component.scss',
})
export class AssetCardComponent {
  @Input({ required: true }) asset!: Asset;
  @Output() download = new EventEmitter<Asset>();
  @Output() edit = new EventEmitter<Asset>();
  @Output() save = new EventEmitter<Asset>();

  onDownload(): void { this.download.emit(this.asset); }
  onEdit(): void { this.edit.emit(this.asset); }
  onSave(): void { this.save.emit(this.asset); }
}
