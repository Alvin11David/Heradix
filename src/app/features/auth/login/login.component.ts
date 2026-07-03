import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { CircularTextComponent } from '../../../shared/components/circular-text/circular-text.component';
import { SplashCursorComponent } from '../../../shared/components/splash-cursor/splash-cursor.component';

@Component({
  selector: 'amx-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SpinnerComponent, CircularTextComponent, SplashCursorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page">

      <div class="auth-panels">
      <div class="auth-panel auth-panel--form">

        <div class="auth-logo">
          <img src="https://i.postimg.cc/zD47BZ94/Asset-1-2x.png"
               alt="Amarapix"
               class="auth-logo__img"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
          <span class="auth-logo__fallback">
            <img [src]="isDark() ? 'assets/logo/whitelogo.png' : 'assets/logo/blacklogo.png'"
                 width="46" height="46" alt="" />
            <span class="auth-logo__text">Amara<span class="auth-logo__pix">pix</span></span>
          </span>
        </div>

        <h1 class="auth-title">Welcome back!</h1>
        <p class="auth-sub">Sign in with your email and password to access your account</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">


          <div class="auth-field">
            <label class="auth-field__label">Email</label>
            <div class="auth-field__wrap" [class.auth-field__wrap--error]="emailCtrl.invalid && emailCtrl.touched">
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
            <span class="auth-field__error" *ngIf="emailCtrl.touched && emailCtrl.hasError('required')">Email is required.</span>
            <span class="auth-field__error" *ngIf="emailCtrl.touched && emailCtrl.hasError('email')">Enter a valid email address.</span>
          </div>


          <div class="auth-field">
            <label class="auth-field__label">Password</label>
            <div class="auth-field__wrap" [class.auth-field__wrap--error]="pwdCtrl.invalid && pwdCtrl.touched">
              <svg class="auth-field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                class="auth-field__input"
                [type]="showPwd() ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
                autocomplete="current-password"
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
            <span class="auth-field__error" *ngIf="pwdCtrl.touched && pwdCtrl.hasError('required')">Password is required.</span>
            <span class="auth-field__error" *ngIf="pwdCtrl.touched && pwdCtrl.hasError('minlength')">Password must be at least 8 characters.</span>
          </div>


          <div class="auth-form__meta">
            <label class="auth-check">
              <input type="checkbox" formControlName="remember" />
              <span class="auth-check__box"></span>
              <span class="auth-check__label">Remembering me</span>
            </label>
            <a routerLink="/auth/forgot-password" class="auth-link">Forgot the password?</a>
          </div>

          <p *ngIf="error()" class="auth-error">{{ error() }}</p>

          <button type="submit" class="auth-btn auth-btn--primary" [disabled]="loading()">
            <amx-spinner *ngIf="loading()" [size]="'sm'"></amx-spinner>
            {{ loading() ? 'Signing in…' : 'Login' }}
          </button>
        </form>

        <div class="auth-divider"><span>OR CONTINUE WITH</span></div>

        <a [href]="authService.getOAuthUrl('google')" class="auth-btn auth-btn--oauth">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </a>

        <p class="auth-footer-link">
          Don't have an account?
          <a routerLink="/auth/register" class="auth-link">Register</a>
        </p>

      </div>


      <div class="auth-panel auth-panel--promo">

        <div class="auth-ambient">
          <amx-circular-text text="Amarapix" [spinDuration]="24" onHover="speedUp" />
        </div>

        <div class="auth-slider">
          <div class="auth-slider__track" [style.transform]="'translateX(-' + (activeSlide() * 100) + '%)'">
            <div class="auth-slide" *ngFor="let slide of slides">
              <div class="auth-slide__icon">
                <img src="assets/logo/whitelogo.png" alt="" class="auth-slide__icon-img" />
              </div>
              <h2 class="auth-promo__title">{{ slide.title }} <span>{{ slide.highlight }}</span></h2>
              <p class="auth-promo__sub">{{ slide.sub }}</p>
            </div>
          </div>
          <div class="auth-slider__dots">
            <div class="auth-slider__track-line">
              <div class="auth-slider__track-fill" [style.width.%]="activeSlide() * 50"></div>
            </div>
            <button *ngFor="let slide of slides; let i = index"
              class="auth-slider__dot"
              [class.auth-slider__dot--active]="activeSlide() === i"
              (click)="activeSlide.set(i)"
              [attr.aria-label]="'Slide ' + (i + 1)">
            </button>
          </div>
        </div>
      </div>

      <amx-splash-cursor [RAINBOW_MODE]="false" COLOR="#a855f7" />
      </div>
    </div>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  private readonly fb    = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  readonly isDark = inject(ThemeService).isDark;

  loading     = signal(false);
  error       = signal('');
  showPwd     = signal(false);
  activeSlide = signal(0);

  readonly slides = [
    {
      icon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
      title: 'Create without', highlight: 'Limits',
      sub: 'Access thousands of premium design assets for your projects',
    },
    {
      icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
      title: 'Millions of', highlight: 'Templates',
      sub: 'Browse PSD, vectors, mockups, icons and more — all in one place',
    },
    {
      icon: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
      title: 'Built for', highlight: 'Designers',
      sub: 'Professional tools, AI editor and print-on-demand all in one',
    },
  ];

  form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    remember: [false],
  });

  get emailCtrl() { return this.form.controls['email']; }
  get pwdCtrl()   { return this.form.controls['password']; }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/marketplace';
    this.router.navigateByUrl(returnUrl);
  }
}
