import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { CircularTextComponent } from '../../../shared/components/circular-text/circular-text.component';
import { SplashCursorComponent } from '../../../shared/components/splash-cursor/splash-cursor.component';

const passwordsMatch: ValidatorFn = (control) => {
  const password = control.get('password')?.value;
  const confirmation = control.get('confirmPassword')?.value;
  return !confirmation || password === confirmation ? null : { passwordMismatch: true };
};

@Component({
  selector: 'amx-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CircularTextComponent,
    SplashCursorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">
      <div class="auth-panels">
        <div class="auth-panel auth-panel--form">
          <div class="auth-logo">
            <img
              src="https://i.postimg.cc/zD47BZ94/Asset-1-2x.png"
              alt="Amarapix"
              class="auth-logo__img"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
            />
            <span class="auth-logo__fallback">
              <img
                [src]="isDark() ? 'assets/logo/whitelogo.png' : 'assets/logo/blacklogo.png'"
                width="46"
                height="46"
                alt=""
              />
              <span class="auth-logo__text">Amara<span class="auth-logo__pix">pix</span></span>
            </span>
          </div>

          <h1 class="auth-title">Create your account!</h1>
          <p class="auth-sub">Join thousands of designers and start creating today</p>
          <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
            <div class="auth-field">
              <label class="auth-field__label" for="register-full-name">Full Name</label>
              <div
                class="auth-field__wrap"
                [class.auth-field__wrap--error]="nameCtrl.invalid && nameCtrl.touched"
                [class.auth-field__wrap--valid]="nameCtrl.valid && nameCtrl.dirty"
              >
                <svg
                  class="auth-field__icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="register-full-name"
                  class="auth-field__input"
                  type="text"
                  formControlName="fullName"
                  placeholder="Jane Doe"
                  autocomplete="name"
                  [attr.aria-invalid]="nameCtrl.invalid && nameCtrl.touched"
                  [attr.aria-describedby]="
                    nameCtrl.invalid && nameCtrl.touched ? 'register-full-name-error' : null
                  "
                  maxlength="120"
                />
              </div>
              <span
                id="register-full-name-error"
                class="auth-field__error"
                *ngIf="nameCtrl.invalid && nameCtrl.touched"
                aria-live="polite"
                >{{
                  nameCtrl.hasError('required') || nameCtrl.hasError('pattern')
                    ? 'Enter your full name.'
                    : nameCtrl.hasError('minlength')
                      ? 'Name must be at least 2 characters.'
                      : 'Name must be 120 characters or fewer.'
                }}</span
              >
            </div>

            <div class="auth-field">
              <label class="auth-field__label" for="register-email">Email</label>
              <div
                class="auth-field__wrap"
                [class.auth-field__wrap--error]="emailCtrl.invalid && emailCtrl.touched"
                [class.auth-field__wrap--valid]="emailCtrl.valid && emailCtrl.dirty"
              >
                <svg
                  class="auth-field__icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="register-email"
                  class="auth-field__input"
                  type="email"
                  formControlName="email"
                  placeholder="your@email.com"
                  autocomplete="email"
                  [attr.aria-invalid]="emailCtrl.invalid && emailCtrl.touched"
                  [attr.aria-describedby]="emailCtrl.invalid && emailCtrl.touched ? 'register-email-error' : null"
                  maxlength="254"
                />
              </div>
              <span
                id="register-email-error"
                class="auth-field__error"
                *ngIf="emailCtrl.invalid && emailCtrl.touched"
                aria-live="polite"
                >{{
                  emailCtrl.hasError('required')
                    ? 'Email is required.'
                    : emailCtrl.hasError('email')
                      ? 'Enter a valid email address.'
                      : 'Email must be 254 characters or fewer.'
                }}</span
              >
            </div>

            <div class="auth-field">
              <label class="auth-field__label" for="register-password">Password</label>
              <div
                class="auth-field__wrap"
                [class.auth-field__wrap--error]="pwdCtrl.invalid && pwdCtrl.touched"
                [class.auth-field__wrap--valid]="pwdCtrl.valid && pwdCtrl.dirty"
              >
                <svg
                  class="auth-field__icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="register-password"
                  class="auth-field__input"
                  [type]="showPwd() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Min. 8 characters"
                  autocomplete="new-password"
                  [attr.aria-invalid]="pwdCtrl.invalid && pwdCtrl.touched"
                  [attr.aria-describedby]="pwdCtrl.invalid && pwdCtrl.touched ? 'register-password-error' : 'register-password-hint'"
                  maxlength="128"
                />
                <button
                  type="button"
                  class="auth-field__toggle"
                  (click)="showPwd.set(!showPwd())"
                  [attr.aria-label]="showPwd() ? 'Hide password' : 'Show password'"
                  [attr.aria-pressed]="showPwd()"
                >
                  <svg
                    *ngIf="!showPwd()"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg
                    *ngIf="showPwd()"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                    />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
              <span
                id="register-password-error"
                class="auth-field__error"
                *ngIf="pwdCtrl.invalid && pwdCtrl.touched"
                aria-live="polite"
                >{{
                  pwdCtrl.hasError('required')
                    ? 'Password is required.'
                    : pwdCtrl.hasError('minlength')
                      ? 'Password must be at least 8 characters.'
                      : 'Password must be 128 characters or fewer.'
                }}</span
              >
              <span *ngIf="!pwdCtrl.invalid || !pwdCtrl.touched" id="register-password-hint" class="auth-field__hint">
                Use 8–128 characters.
              </span>
            </div>

            <div class="auth-field">
              <label class="auth-field__label" for="register-confirm-password"
                >Confirm Password</label
              >
              <div
                class="auth-field__wrap"
                [class.auth-field__wrap--error]="
                  confirmPwdCtrl.invalid && confirmPwdCtrl.touched ||
                  form.hasError('passwordMismatch') && confirmPwdCtrl.touched
                "
                [class.auth-field__wrap--valid]="confirmPwdCtrl.valid && !form.hasError('passwordMismatch') && confirmPwdCtrl.dirty"
              >
                <svg
                  class="auth-field__icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="register-confirm-password"
                  class="auth-field__input"
                  [type]="showPwd() ? 'text' : 'password'"
                  formControlName="confirmPassword"
                  placeholder="Re-enter your password"
                  autocomplete="new-password"
                  [attr.aria-invalid]="
                    confirmPwdCtrl.invalid && confirmPwdCtrl.touched ||
                    form.hasError('passwordMismatch') && confirmPwdCtrl.touched
                  "
                  [attr.aria-describedby]="
                    confirmPwdCtrl.touched && (confirmPwdCtrl.invalid || form.hasError('passwordMismatch'))
                      ? 'register-confirm-password-error'
                      : null
                  "
                  maxlength="128"
                />
                <button
                  type="button"
                  class="auth-field__toggle"
                  (click)="showPwd.set(!showPwd())"
                  [attr.aria-label]="showPwd() ? 'Hide passwords' : 'Show passwords'"
                  [attr.aria-pressed]="showPwd()"
                >
                  <svg
                    *ngIf="!showPwd()"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg
                    *ngIf="showPwd()"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                    />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
              <span
                id="register-confirm-password-error"
                class="auth-field__error"
                *ngIf="
                  confirmPwdCtrl.touched &&
                  (confirmPwdCtrl.invalid || form.hasError('passwordMismatch'))
                "
                aria-live="polite"
                >{{
                  confirmPwdCtrl.hasError('required')
                    ? 'Please confirm your password.'
                    : 'Passwords do not match.'
                }}</span
              >
            </div>

            <p *ngIf="error()" class="auth-error">{{ error() }}</p>

            <button
              type="submit"
              class="auth-btn auth-btn--primary auth-submit"
              [class.auth-submit--loading]="loading()"
              [disabled]="loading()"
              [attr.aria-busy]="loading()"
            >
              <span *ngIf="loading()" class="auth-submit__spinner" aria-hidden="true"></span>
              <span>{{ loading() ? 'Creating your account…' : 'Create account' }}</span>
            </button>
          </form>

          <div class="auth-divider">
            <span>OR CONTINUE WITH</span>
          </div>

          <a
            [href]="authService.getOAuthUrl('google')"
            class="auth-btn auth-btn--oauth"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            Continue with Google
          </a>

          <p class="auth-footer-link">
            Already have an account?
            <a routerLink="/auth/login" class="auth-link">Login</a>
          </p>
        </div>

        <div class="auth-panel auth-panel--promo">
          <div class="auth-img-slider">
            <div
              *ngFor="let slide of heroSlides; let i = index"
              class="auth-img-slide"
              [class.auth-img-slide--active]="heroSlideIndex() === i"
            >
              <img
                [src]="slide.img"
                [alt]="slide.label"
                class="auth-img-slide__img"
                loading="lazy"
              />
              <div class="auth-img-slide__overlay"></div>
            </div>
          </div>

          <div class="auth-ambient">
            <amx-circular-text text="Amarapix" [spinDuration]="24" onHover="speedUp" />
          </div>

          <div class="auth-img-slide__label">{{ heroSlides[heroSlideIndex()].label }}</div>
          <div class="auth-img-slider__dots">
            <button
              *ngFor="let slide of heroSlides; let i = index"
              class="auth-img-slider__dot"
              [class.auth-img-slider__dot--active]="heroSlideIndex() === i"
              (click)="goToSlide(i)"
              [attr.aria-label]="'Go to slide ' + (i + 1)"
            ></button>
          </div>
        </div>

        <amx-splash-cursor [RAINBOW_MODE]="false" COLOR="#a855f7" />
      </div>
    </div>
  `,
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly isDark = inject(ThemeService).isDark;

  loading = signal(false);
  error = signal('');
  showPwd = signal(false);
  heroSlideIndex = signal(0);
  private slideTimer?: ReturnType<typeof setInterval>;

  readonly heroSlides = [
    { img: '/assets/images/Branding_Print/All_Branding.jpg', label: 'Full Branding Packages' },
    { img: '/assets/images/Branding_Print/Tshirt-2.jpg', label: 'Custom T-Shirts' },
    { img: '/assets/images/Branding_Print/Business_cards-2.jpg', label: 'Premium Business Cards' },
    { img: '/assets/images/Branding_Print/Pullup_Banner.jpg', label: 'Pull-Up Banners' },
    { img: '/assets/images/Branding_Print/Cap_Branding.jpg', label: 'Custom Caps & Hats' },
  ];

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.pattern(/\S/), Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  get nameCtrl() {
    return this.form.controls['fullName'];
  }
  get emailCtrl() {
    return this.form.controls['email'];
  }
  get pwdCtrl() {
    return this.form.controls['password'];
  }
  get confirmPwdCtrl() {
    return this.form.controls['confirmPassword'];
  }

  ngOnInit(): void {
    this.slideTimer = setInterval(() => {
      this.heroSlideIndex.update((i) => (i + 1) % this.heroSlides.length);
    }, 3500);
  }

  ngOnDestroy(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
  }

  goToSlide(i: number): void {
    this.heroSlideIndex.set(i);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set('');

    const { fullName, email, password } = this.form.getRawValue();
    this.authService.register({ fullName, email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/auth/verify-email'], { queryParams: { email } });
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.errorMessage(err, 'Registration failed. Please try again.'));
      },
    });
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const responseMessage = error.error && typeof error.error === 'object'
        ? Reflect.get(error.error, 'message')
        : null;
      return typeof responseMessage === 'string' ? responseMessage : fallback;
    }
    if (error && typeof error === 'object') {
      const message = Reflect.get(error, 'message');
      if (typeof message === 'string') return message;
    }
    return error instanceof Error ? error.message : fallback;
  }
}
