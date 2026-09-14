import {
  ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PersonalizationConfig,
  PersonalizationPreferences,
  PersonalizationResult,
} from '../../../core/personalization/personalization.model';

@Component({
  selector: 'amx-personalization-onboarding',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *ngIf="visible"
      class="personalization-backdrop"
      [class.personalization-backdrop--closing]="closing()"
      role="presentation"
      (click)="skip()"
    >
      <section
        class="personalization-modal"
        [class.personalization-modal--closing]="closing()"
        role="dialog"
        aria-modal="true"
        aria-labelledby="personalization-title"
        (click)="$event.stopPropagation()"
      >
        <button class="personalization-modal__close" type="button" (click)="skip()" aria-label="Skip personalization">
          <span aria-hidden="true">×</span>
        </button>
        <div class="personalization-modal__intro">
          <span class="personalization-modal__eyebrow">{{ config.eyebrow }}</span>
          <h2 id="personalization-title">{{ config.title }}</h2>
          <p>{{ config.description }}</p>
        </div>

        <div class="personalization-section">
          <div class="personalization-section__heading">
            <div>
              <h3>{{ config.categoryLabel }}</h3>
              <p>Select as many as you like</p>
            </div>
            <span class="personalization-section__count" aria-live="polite">
              {{ selectedCategories().length }} selected
            </span>
          </div>
          <div class="personalization-options personalization-options--categories">
            <button
              *ngFor="let option of config.categories; index as i"
              type="button"
              class="personalization-option"
              [style.--card-i]="i"
              [class.personalization-option--selected]="isSelected(selectedCategories(), option.id)"
              [attr.aria-pressed]="isSelected(selectedCategories(), option.id)"
              (click)="toggleCategory(option.id)"
            >
              <img [src]="option.previewUrl" [alt]="''" loading="lazy" />
              <span class="personalization-option__shade"></span>
              <span class="personalization-option__emoji" aria-hidden="true">{{ option.emoji }}</span>
              <span class="personalization-option__label">{{ option.label }}</span>
              <span *ngIf="isSelected(selectedCategories(), option.id)" class="personalization-option__check" aria-hidden="true">✓</span>
            </button>
          </div>
        </div>

        <div class="personalization-section personalization-section--styles">
          <div class="personalization-section__heading">
            <div>
              <h3>{{ config.styleLabel }}</h3>
              <p>Optional — fine-tune the feeling</p>
            </div>
          </div>
          <div class="personalization-style-list">
            <button
              *ngFor="let option of config.styles; index as i"
              type="button"
              class="personalization-style"
              [style.--chip-i]="i"
              [class.personalization-style--selected]="isSelected(selectedStyles(), option.id)"
              [attr.aria-pressed]="isSelected(selectedStyles(), option.id)"
              (click)="toggleStyle(option.id)"
            >
              <span class="personalization-style__icon" aria-hidden="true">{{ option.emoji }}</span>
              <span>{{ option.label }}</span>
              <span *ngIf="isSelected(selectedStyles(), option.id)" class="personalization-style__check" aria-hidden="true">✓</span>
            </button>
          </div>
        </div>

        <div class="personalization-modal__footer">
          <span class="personalization-modal__hint">
            You can change this anytime.
          </span>
          <div class="personalization-modal__actions">
            <button type="button" class="personalization-skip" (click)="skip()">Skip for now</button>
            <button type="button" class="personalization-continue" (click)="continue()">
              Continue
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  `,
  styleUrl: './personalization-onboarding.component.scss',
})
export class PersonalizationOnboardingComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) config!: PersonalizationConfig;
  @Input() visible = false;
  @Input() existingPreferences: PersonalizationPreferences | null = null;
  @Output() completed = new EventEmitter<PersonalizationResult>();
  @Output() dismissed = new EventEmitter<void>();

  readonly selectedCategories = signal<string[]>([]);
  readonly selectedStyles = signal<string[]>([]);
  readonly closing = signal(false);
  private closingTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.closing.set(false);
      if (this.closingTimer) { clearTimeout(this.closingTimer); this.closingTimer = null; }
    }
    if (changes['visible']?.currentValue === true || changes['existingPreferences']) {
      this.selectedCategories.set([...(this.existingPreferences?.categories ?? [])]);
      this.selectedStyles.set([...(this.existingPreferences?.styles ?? [])]);
    }
  }

  ngOnDestroy(): void {
    if (this.closingTimer) clearTimeout(this.closingTimer);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible) this.skip();
  }

  isSelected(list: string[], id: string): boolean {
    return list.includes(id);
  }

  toggleCategory(id: string): void {
    this.selectedCategories.update((items) => this.toggle(items, id));
  }

  toggleStyle(id: string): void {
    this.selectedStyles.update((items) => this.toggle(items, id));
  }

  continue(): void {
    if (this.closing()) return;
    const selectedOptions = [
      ...this.config.categories.filter((option) => this.selectedCategories().includes(option.id)),
      ...this.config.styles.filter((option) => this.selectedStyles().includes(option.id)),
    ];
    const result: PersonalizationResult = {
      categories: this.selectedCategories(),
      styles: this.selectedStyles(),
      topics: selectedOptions.flatMap((option) => [option.id, option.label, ...(option.keywords ?? [])]),
      skipped: false,
    };
    this.playExit(() => this.completed.emit(result));
  }

  skip(): void {
    if (!this.visible || this.closing()) return;
    this.playExit(() => this.dismissed.emit());
  }

  private playExit(after: () => void): void {
    this.closing.set(true);
    this.closingTimer = setTimeout(() => {
      this.closing.set(false);
      after();
    }, 560);
  }

  private toggle(items: string[], id: string): string[] {
    return items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
  }
}