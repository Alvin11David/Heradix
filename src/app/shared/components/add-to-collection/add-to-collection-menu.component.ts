import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, Output, EventEmitter, ElementRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { CollectionsService } from '../../../features/collections/collections.service';

@Component({
  selector: 'amx-add-to-collection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-to-collection-menu.component.html',
  styleUrl: './add-to-collection-menu.component.scss',
})
export class AddToCollectionMenuComponent implements OnInit {
  private readonly authSvc = inject(AuthService);
  readonly collectionsSvc = inject(CollectionsService);
  private readonly el = inject(ElementRef);

  readonly assetId = input.required<string>();
  @Output() closed = new EventEmitter<void>();

  readonly isPremium = computed(() => this.authSvc.isPremium());
  readonly collections = computed(() => this.collectionsSvc.collections());
  readonly loading = computed(() => this.collectionsSvc.loading());
  readonly error = signal<string | null>(null);

  readonly saving = signal<Set<string>>(new Set());
  readonly newName = signal('');
  readonly creating = signal(false);
  readonly createError = signal('');

  private _mounted = false;

  ngOnInit(): void {
    this.collectionsSvc.loadCollections();
    setTimeout(() => {
      this._mounted = true;
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.amx-acm__panel')) {
      this.closed.emit();
    }
  }

  toggleCollection(collectionId: string): void {
    if (this.saving().has(collectionId)) return;
    if (!this.assetId()) return;
    this.saving.update(s => new Set(s).add(collectionId));

    const alreadySaved = this.collectionsSvc.isAssetInCollection(collectionId, this.assetId());

    const action$ = alreadySaved
      ? this.collectionsSvc.removeAsset(collectionId, this.assetId())
      : this.collectionsSvc.addAsset(collectionId, this.assetId());

    action$.subscribe({
      next: () => { this.saving.update(s => { const n = new Set(s); n.delete(collectionId); return n; }); },
      error: () => { this.saving.update(s => { const n = new Set(s); n.delete(collectionId); return n; }); },
    });
  }

  isSaved(collectionId: string): boolean {
    return this.collectionsSvc.isAssetInCollection(collectionId, this.assetId());
  }

  createCollection(): void {
    const name = this.newName().trim();
    if (!name) return;
    this.creating.set(true);
    this.createError.set('');
    this.collectionsSvc.createCollection({ name }).subscribe({
      next: () => {
        this.newName.set('');
        this.creating.set(false);
      },
      error: () => {
        this.createError.set('Failed to create collection');
        this.creating.set(false);
      },
    });
  }


  savedCount = computed(() => {
    if (!this.assetId()) return 0;
    return this.collectionsSvc.collectionIdsForAsset(this.assetId()).length;
  });
}
