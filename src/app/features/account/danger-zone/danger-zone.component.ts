import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'amx-danger-zone',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './danger-zone.component.html',
  styleUrl: './danger-zone.component.scss',
})
export class DangerZoneComponent {
  readonly DELETE_CONFIRM_WORD = 'DELETE';

  readonly exporting = signal(false);
  readonly exportDone = signal(false);
  readonly exportError = signal(false);

  startExport(): void {
    this.exporting.set(true);
    this.exportError.set(false);
    this.exportDone.set(false);

    setTimeout(() => {
      this.exporting.set(false);
      this.exportDone.set(true);
      setTimeout(() => this.exportDone.set(false), 4000);
    }, 2000);
  }

  readonly confirmText = signal('');
  readonly deleting = signal(false);
  readonly deleteDone = signal(false);

  readonly canDelete = computed(() => this.confirmText() === this.DELETE_CONFIRM_WORD);

  confirmDelete(): void {
    if (!this.canDelete()) return;
    this.deleting.set(true);

    setTimeout(() => {
      this.deleting.set(false);
      this.deleteDone.set(true);
      this.confirmText.set('');
      setTimeout(() => this.deleteDone.set(false), 4000);
    }, 1500);
  }
}
