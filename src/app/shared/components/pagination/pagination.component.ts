import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'amx-pagination',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="pagination" *ngIf="totalPages > 1" aria-label="Pagination">
      <button class="pagination__btn" [disabled]="currentPage === 1" (click)="goTo(currentPage - 1)" aria-label="Previous">‹</button>

      <ng-container *ngFor="let p of visiblePages">
        <span *ngIf="p === -1" class="pagination__ellipsis">…</span>
        <button
          *ngIf="p !== -1"
          class="pagination__btn"
          [class.active]="p === currentPage"
          (click)="goTo(p)"
          [attr.aria-current]="p === currentPage ? 'page' : null">
          {{ p }}
        </button>
      </ng-container>

      <button class="pagination__btn" [disabled]="currentPage === totalPages" (click)="goTo(currentPage + 1)" aria-label="Next">›</button>
    </nav>
  `,
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Output() pageChange = new EventEmitter<number>();

  get visiblePages(): number[] {
    const pages: number[] = [];
    const delta = 2;
    for (let i = 1; i <= this.totalPages; i++) {
      if (
        i === 1 ||
        i === this.totalPages ||
        (i >= this.currentPage - delta && i <= this.currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== -1) {
        pages.push(-1);
      }
    }
    return pages;
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageChange.emit(page);
  }
}
