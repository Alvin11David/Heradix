import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'amx-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">

      <!-- ═══ LEFT PANEL ═══ -->
      <div class="auth-panel auth-panel--form">

        <!-- Logo -->
        <div class="auth-logo">
          <img src="https://i.postimg.cc/zD47BZ94/Asset-1-2x.png"
               alt="Amarapix"
               class="auth-logo__img"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
          <span class="auth-logo__fallback" style="display:none">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none"><path d="M18 3L33 30H3L18 3Z" fill="#f5820a"/></svg>
            <span class="auth-logo__text">Amara<span class="auth-logo__pix">pix</span></span>
          </span>
        </div>

        <!-- STEP 1: Enter email -->
        <ng-container *ngIf="step() === 1">
          <h1 class="auth-title">Forgot Password?</h1>
          <p class="auth-sub">Enter your email and we'll send you a 6-digit reset code</p>

          <form [formGroup]="emailForm" (ngSubmit)="sendCode()" class="auth-form">

            <div class="auth-field">
              <label class="auth-field__label">Email</label>
              <div class="auth-field__wrap">
                <svg class="auth-field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  class="auth-field__input"
                  type="email"
                  formControlName="email"
                  placeholder="your@email.com"
                  autocomplete="email"
                />
              </div>
            </div>

            <p *ngIf="error()" class="auth-error">{{ error() }}</p>

            <button type="submit" class="auth-btn auth-btn--primary" [disabled]="loading()">
              {{ loading() ? 'Sending…' : 'Send Reset Code' }}
            </button>
          </form>
        </ng-container>

        <!-- STEP 2: Enter 6-digit code only -->
        <ng-container *ngIf="step() === 2">
          <h1 class="auth-title">Check your email</h1>
          <p class="auth-sub">We sent a 6-digit code to <strong>{{ emailForm.value.email }}</strong>. Enter it below to continue.</p>

          <form [formGroup]="otpForm" (ngSubmit)="verifyOtp()" class="auth-form">

            <!-- OTP inputs -->
            <div class="auth-otp">
              <input *ngFor="let i of [0,1,2,3,4,5]; let idx = index"
                class="auth-otp__box"
                type="text"
                maxlength="1"
                inputmode="numeric"
                pattern="[0-9]*"
                [id]="'otp-' + idx"
                (input)="onOtpInput($event, idx)"
                (keydown)="onOtpKeydown($event, idx)"
                autocomplete="one-time-code"
              />
            </div>

            <p *ngIf="error()" class="auth-error">{{ error() }}</p>

            <button type="submit" class="auth-btn auth-btn--primary" [disabled]="loading()">
              {{ loading() ? 'Verifying…' : 'Verify Code' }}
            </button>

            <button type="button" class="auth-btn auth-btn--ghost" (click)="step.set(1)">
              ← Back
            </button>
          </form>
        </ng-container>

        <!-- STEP 3: New password -->
        <ng-container *ngIf="step() === 3">
          <h1 class="auth-title">Set new password</h1>
          <p class="auth-sub">Choose a strong password for your account.</p>

          <form [formGroup]="passwordForm" (ngSubmit)="resetPassword()" class="auth-form">

            <div class="auth-field">
              <label class="auth-field__label">New Password</label>
              <div class="auth-field__wrap">
                <svg class="auth-field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  class="auth-field__input"
                  [type]="showPwd() ? 'text' : 'password'"
                  formControlName="newPassword"
                  placeholder="Min. 8 characters"
                  autocomplete="new-password"
                />
                <button type="button" class="auth-field__toggle" (click)="showPwd.set(!showPwd())" aria-label="Toggle password">
                  <svg *ngIf="!showPwd()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg *ngIf="showPwd()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>

            <p *ngIf="error()" class="auth-error">{{ error() }}</p>

            <button type="submit" class="auth-btn auth-btn--primary" [disabled]="loading()">
              {{ loading() ? 'Saving…' : 'Save New Password' }}
            </button>
          </form>
        </ng-container>

        <!-- STEP 4: Success -->
        <ng-container *ngIf="step() === 4">
          <div class="auth-success">
            <div class="auth-success__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 class="auth-title">Password Reset!</h1>
            <p class="auth-sub">Your password has been updated successfully.</p>
            <a routerLink="/auth/login" class="auth-btn auth-btn--primary">Back to Login</a>
          </div>
        </ng-container>


        <p class="auth-footer-link">
          Remember your password?
          <a routerLink="/auth/login" class="auth-link">Login</a>
        </p>

      </div>

      <!-- ═══ RIGHT PANEL – Promo Slider ═══ -->
      <div class="auth-panel auth-panel--promo">
        <div class="auth-slider">
          <div class="auth-slider__track" [style.transform]="'translateX(-' + (activeSlide() * 100) + '%)'">
            <div class="auth-slide" *ngFor="let slide of slides">
              <div class="auth-slide__icon">
                <svg [innerHTML]="slide.icon" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" aria-hidden="true"></svg>
              </div>
              <h2 class="auth-promo__title">{{ slide.title }} <span>{{ slide.highlight }}</span></h2>
              <p class="auth-promo__sub">{{ slide.sub }}</p>
            </div>
          </div>
          <div class="auth-slider__dots">
            <button *ngFor="let slide of slides; let i = index"
              class="auth-slider__dot"
              [class.auth-slider__dot--active]="activeSlide() === i"
              (click)="activeSlide.set(i)"
              [attr.aria-label]="'Slide ' + (i + 1)">
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  readonly authService = inject(AuthService);
  private readonly fb  = inject(FormBuilder);
  private readonly router = inject(Router);

  step    = signal(1);
  loading = signal(false);
  error   = signal('');
  showPwd = signal(false);
  activeSlide = signal(0);

  readonly slides = [
    {
      icon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
      title: 'Create without',
      highlight: 'Limits',
      sub: 'Access thousands of premium design assets for your projects',
    },
    {
      icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
      title: 'Millions of',
      highlight: 'Templates',
      sub: 'Browse PSD, vectors, mockups, icons and more — all in one place',
    },
    {
      icon: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
      title: 'Built for',
      highlight: 'Designers',
      sub: 'Professional tools, AI-powered editor and print-on-demand all in one',
    },
  ];

  emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  otpForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  passwordForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  private otpDigits: string[] = ['', '', '', '', '', ''];

  sendCode(): void {
    if (this.emailForm.invalid) return;
    this.loading.set(true);
    this.error.set('');
    // TODO: wire to authService.forgotPassword(email)
    setTimeout(() => {
      this.loading.set(false);
      this.step.set(2);
    }, 800);
  }

  onOtpInput(event: Event, idx: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');
    input.value = val;
    this.otpDigits[idx] = val;
    if (val && idx < 5) {
      (document.getElementById(`otp-${idx + 1}`) as HTMLInputElement)?.focus();
    }
    this.otpForm.patchValue({ code: this.otpDigits.join('') });
  }

  onOtpKeydown(event: KeyboardEvent, idx: number): void {
    if (event.key === 'Backspace' && !(event.target as HTMLInputElement).value && idx > 0) {
      (document.getElementById(`otp-${idx - 1}`) as HTMLInputElement)?.focus();
    }
  }

  verifyOtp(): void {
    if (this.otpForm.invalid) return;
    this.loading.set(true);
    this.error.set('');
    // TODO: wire to authService.verifyOtp(code)
    setTimeout(() => {
      this.loading.set(false);
      this.step.set(3);
    }, 800);
  }

  resetPassword(): void {
    if (this.passwordForm.invalid) return;
    this.loading.set(true);
    this.error.set('');
    // TODO: wire to authService.resetPassword(newPassword)
    setTimeout(() => {
      this.loading.set(false);
      this.step.set(4);
    }, 800);
  }
}
