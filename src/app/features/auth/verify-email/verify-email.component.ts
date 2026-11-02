import {
  Component,
  ChangeDetectionStrategy,
  computed,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { CircularTextComponent } from '../../../shared/components/circular-text/circular-text.component';
import { SplashCursorComponent } from '../../../shared/components/splash-cursor/splash-cursor.component';

@Component({
  selector: 'amx-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, CircularTextComponent, SplashCursorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-panels">
        <div class="auth-panel auth-panel--form">
          <div class="auth-logo">
            <img
              [src]="isDark() ? 'assets/logo/whitelogo.png' : 'assets/logo/blacklogo.png'"
              alt=""
              class="auth-logo__icon"
              width="36"
              height="36"
            />
            <span class="auth-logo__text">Amara<span class="auth-logo__pix">pix</span></span>
          </div>

          <ng-container *ngIf="verified(); else verificationForm">
            <div class="auth-verified-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 class="auth-title">Email verified!</h1>
            <p class="auth-sub">Your Amarapix account is ready. Sign in to start creating.</p>
            <a routerLink="/auth/login" class="auth-btn auth-btn--primary">Continue to login</a>
          </ng-container>

          <ng-template #verificationForm>
            <h1 class="auth-title">Verify your email</h1>
            <p class="auth-sub">
              We sent a 5-character code to <strong>{{ email() || 'your email address' }}</strong>.
              Enter it below to activate your account.
            </p>

            <form class="auth-form" (ngSubmit)="verifyCode()">
              <div class="auth-otp" role="group" aria-label="Five-character verification code">
                <input
                  #codeInput
                  *ngFor="let slot of codeSlots; let index = index"
                  class="auth-otp__box"
                  type="text"
                  maxlength="5"
                  inputmode="text"
                  autocapitalize="characters"
                  autocomplete="one-time-code"
                  [attr.aria-label]="'Code character ' + (index + 1)"
                  [attr.aria-invalid]="!!error()"
                  [value]="codeParts()[index]"
                  (input)="onCodeInput($event, index)"
                  (keydown)="onCodeKeydown($event, index)"
                  (paste)="onCodePaste($event)"
                  [disabled]="!email() || loading()"
                />
              </div>

              <p *ngIf="error()" class="auth-error" role="alert">{{ error() }}</p>
              <p *ngIf="notice()" class="auth-notice" role="status">{{ notice() }}</p>

              <button
                type="submit"
                class="auth-btn auth-btn--primary"
                [disabled]="!email() || loading() || !isValidCode()"
              >
                {{ loading() ? 'Verifying…' : 'Verify email' }}
              </button>

              <p class="auth-resend">
                Didn’t receive the email?
                <button
                  type="button"
                  class="auth-link"
                  [disabled]="resendSeconds() > 0 || loading() || !email()"
                  (click)="resendCode()"
                >
                  {{ resendSeconds() > 0 ? 'Resend in ' + resendSeconds() + 's' : 'Resend code' }}
                </button>
              </p>
            </form>

            <p *ngIf="!email()" class="auth-error" role="alert">
              This verification page is missing an email address.
              <a routerLink="/auth/register" class="auth-link">Create an account</a>
            </p>

            <p class="auth-footer-link">
              Already verified?
              <a routerLink="/auth/login" class="auth-link">Login</a>
            </p>
          </ng-template>
        </div>

        <div class="auth-panel auth-panel--promo">
          <div class="auth-img-slider">
            <div
              *ngFor="let slide of heroSlides; let index = index"
              class="auth-img-slide"
              [class.auth-img-slide--active]="heroSlideIndex() === index"
            >
              <img [src]="slide.img" [alt]="slide.label" class="auth-img-slide__img" loading="lazy" />
              <div class="auth-img-slide__overlay"></div>
            </div>
          </div>
          <div class="auth-ambient">
            <amx-circular-text text="Amarapix" [spinDuration]="24" onHover="speedUp" />
          </div>
          <div class="auth-img-slide__label">{{ heroSlides[heroSlideIndex()].label }}</div>
          <div class="auth-img-slider__dots">
            <button
              *ngFor="let slide of heroSlides; let index = index"
              class="auth-img-slider__dot"
              [class.auth-img-slider__dot--active]="heroSlideIndex() === index"
              (click)="heroSlideIndex.set(index)"
              [attr.aria-label]="'Go to slide ' + (index + 1)"
            ></button>
          </div>
        </div>

        <amx-splash-cursor [RAINBOW_MODE]="false" COLOR="#a855f7" />
      </div>
    </div>
  `,
  styleUrl: '../login/login.component.scss',
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly isDark = inject(ThemeService).isDark;

  @ViewChildren('codeInput') private readonly codeInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly codeSlots = [0, 1, 2, 3, 4];
  readonly email = signal('');
  readonly codeParts = signal(['', '', '', '', '']);
  readonly code = computed(() => this.codeParts().join(''));
  readonly loading = signal(false);
  readonly verified = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly resendSeconds = signal(60);
  readonly heroSlideIndex = signal(0);

  private resendTimer?: ReturnType<typeof setInterval>;
  private slideTimer?: ReturnType<typeof setInterval>;

  readonly heroSlides = [
    { img: '/assets/images/Branding_Print/All_Branding.jpg', label: 'Full Branding Packages' },
    { img: '/assets/images/Branding_Print/Tshirt-2.jpg', label: 'Custom T-Shirts' },
    { img: '/assets/images/Branding_Print/Business_cards-2.jpg', label: 'Premium Business Cards' },
    { img: '/assets/images/Branding_Print/Pullup_Banner.jpg', label: 'Pull-Up Banners' },
  ];

  ngOnInit(): void {
    this.email.set(this.route.snapshot.queryParamMap.get('email')?.trim() ?? '');
    this.startResendTimer();
    this.slideTimer = setInterval(() => {
      this.heroSlideIndex.update((index) => (index + 1) % this.heroSlides.length);
    }, 3500);
  }

  ngOnDestroy(): void {
    if (this.resendTimer) clearInterval(this.resendTimer);
    if (this.slideTimer) clearInterval(this.slideTimer);
  }

  isValidCode(): boolean {
    return /^(?=.*[A-Z])(?=.*\d)[A-Z\d]{5}$/.test(this.code());
  }

  onCodeInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^a-z\d]/gi, '').toUpperCase();
    if (value.length > 1) {
      this.setCode(value);
      this.focusCodeInput(Math.min(value.length, 4));
      return;
    }

    const characters = [...this.codeParts()];
    characters[index] = value;
    this.codeParts.set(characters);
    input.value = value;
    this.error.set('');
    if (value && index < 4) this.focusCodeInput(index + 1);
  }

  onCodeKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && index > 0) {
      this.focusCodeInput(index - 1);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusCodeInput(index - 1);
    } else if (event.key === 'ArrowRight' && index < 4) {
      this.focusCodeInput(index + 1);
    }
  }

  onCodePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const value = event.clipboardData?.getData('text').replace(/[^a-z\d]/gi, '').toUpperCase() ?? '';
    this.setCode(value);
    this.focusCodeInput(Math.min(value.length, 4));
  }

  verifyCode(): void {
    if (!this.email() || !this.isValidCode() || this.loading()) {
      this.error.set('Enter all five characters, including at least one letter and one number.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.notice.set('');
    this.authService.verifyRegistrationEmail({ email: this.email(), code: this.code() }).subscribe({
      next: () => {
        this.loading.set(false);
        this.verified.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('That code is incorrect or expired. Check it and try again, or request a new one.');
      },
    });
  }

  resendCode(): void {
    if (!this.email() || this.loading() || this.resendSeconds() > 0) return;
    this.loading.set(true);
    this.error.set('');
    this.notice.set('');
    this.authService.resendVerificationCode({ email: this.email() }).subscribe({
      next: () => {
        this.loading.set(false);
        this.codeParts.set(['', '', '', '', '']);
        this.notice.set('If your account is awaiting verification, a fresh code will be sent.');
        this.startResendTimer();
        this.focusCodeInput(0);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('We could not resend your code right now. Please try again shortly.');
      },
    });
  }

  private setCode(value: string): void {
    const characters = value.slice(0, 5).split('');
    this.codeParts.set([...characters, ...Array(5 - characters.length).fill('')]);
    this.error.set('');
    this.notice.set('');
    this.codeInputs?.forEach((input, index) => {
      input.nativeElement.value = this.codeParts()[index];
    });
  }

  private focusCodeInput(index: number): void {
    this.codeInputs?.get(index)?.nativeElement.focus();
  }

  private startResendTimer(): void {
    this.resendSeconds.set(60);
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      this.resendSeconds.update((seconds) => {
        if (seconds <= 1) {
          if (this.resendTimer) clearInterval(this.resendTimer);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
  }
}
