import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'amx-spinner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="spinner" [class]="'spinner--' + size" role="status" aria-label="Loading">
      <div class="spinner__ring"></div>
    </div>
  `,
  styleUrl: './spinner.component.scss',
})
export class SpinnerComponent {

  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}
