import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { hasShownSignupOnboarding, markSignupOnboardingShown } from './onboarding-state';

@Component({
  selector: 'amx-signup-onboarding',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="welcome" aria-label="Amarapix introduction">
      <header class="welcome__topbar">
        <div class="wordmark" aria-label="Amarapix">
          <span class="wordmark__mark" aria-hidden="true">a<span>.</span></span>
          <span>amara<span class="wordmark__pix">pix</span></span>
        </div>

        <button class="skip-button" type="button" (click)="skip()">Skip intro</button>
      </header>

      <section class="onboarding" aria-label="Getting started">
        <div class="phone-stage" [attr.data-step]="currentStep()">
          <article
            *ngFor="let slide of slides; let index = index"
            class="phone"
            [class.phone--active]="currentStep() === index"
            [class.phone--first]="index === 0"
            [class.phone--last]="index === 2"
            [ngClass]="'phone--' + slide.tone"
            [attr.aria-hidden]="currentStep() === index ? null : 'true'"
            [attr.aria-label]="'Step ' + (index + 1) + ': ' + slide.title"
          >
            <div class="phone__status">
              <span>9:41</span>
              <span class="phone__status-icons" aria-hidden="true">
                <svg viewBox="0 0 38 14" fill="none">
                  <path d="M1 11V8.5M5 11V6.5M9 11V4.5M13 11V2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  <path d="M20 4.2c2.5-2.1 6.5-2.1 9 0M22.5 7c1.1-.9 2.9-.9 4 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  <circle cx="24.5" cy="9.6" r="1" fill="currentColor" />
                  <rect x="32" y="3" width="5" height="8" rx="1.4" stroke="currentColor" stroke-width="1.4" />
                  <path d="M34 5h1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                </svg>
              </span>
            </div>

            <div class="phone__content">
              <div class="phone__eyebrow">
                <span class="phone__eyebrow-dot"></span>
                {{ slide.eyebrow }}
              </div>
              <h1>{{ slide.title }}</h1>
              <p class="phone__description">{{ slide.description }}</p>

              <div class="phone__art" [ngSwitch]="index" aria-hidden="true">
                <svg *ngSwitchCase="0" class="art art--discover" viewBox="0 0 300 270" fill="none">
                  <path class="art__scribble" d="M42 77c-13 1-20 10-22 20 10-3 18-3 25 0-7 5-10 11-11 19 12-2 21-9 24-20" />
                  <path class="art__spark" d="m244 34 5 12 12 4-12 4-5 12-4-12-12-4 12-4 4-12Z" />
                  <path d="M59 74c4-22 22-37 44-37h106c22 0 40 15 44 37l11 122H48L59 74Z" fill="#F8F4E8" stroke="#191817" stroke-width="3" />
                  <path d="M72 81c3-15 15-25 31-25h105c16 0 29 11 31 27l8 67H65l7-69Z" fill="#D6C8F6" stroke="#191817" stroke-width="2.5" />
                  <path d="M93 135c10-19 25-30 45-33 23-4 45 6 62 31l16 17H81l12-15Z" fill="#F27B60" />
                  <circle cx="132" cy="98" r="18" fill="#F8D949" stroke="#191817" stroke-width="2.5" />
                  <path d="M123 99c5-6 12-6 18 0m-12 7 3 2 4-2" stroke="#191817" stroke-width="2" stroke-linecap="round" />
                  <rect x="62" y="149" width="178" height="9" rx="4.5" fill="#191817" />
                  <rect x="74" y="164" width="65" height="18" rx="9" fill="#F8D949" stroke="#191817" stroke-width="2" />
                  <rect x="146" y="164" width="78" height="18" rx="9" fill="#F8F4E8" stroke="#191817" stroke-width="2" />
                  <path d="M220 196 263 239l-18 2-8 16-17-61Z" fill="#191817" />
                  <path d="m217 196 14 48" stroke="#fff" stroke-width="3" stroke-linecap="round" />
                  <path class="art__spark" d="m41 207 4 9 9 3-9 3-4 9-3-9-9-3 9-3 3-9Z" />
                  <path d="M100 220c13 8 23 8 36 0m18 0c13 8 23 8 36 0" stroke="#191817" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1 7" />
                </svg>

                <svg *ngSwitchCase="1" class="art art--make" viewBox="0 0 300 270" fill="none">
                  <path class="art__spark" d="m38 58 5 12 12 4-12 4-5 12-4-12-12-4 12-4 4-12Z" />
                  <path d="M79 57h131a17 17 0 0 1 17 17v136H62V74a17 17 0 0 1 17-17Z" fill="#FBF9F4" stroke="#191817" stroke-width="3" />
                  <path d="M77 78h135v105H77z" fill="#EE765C" />
                  <path d="M105 157c14-39 43-62 68-55 18 5 27 27 21 55h-89Z" fill="#F8D949" />
                  <path d="M105 157c14-39 43-62 68-55 18 5 27 27 21 55" stroke="#191817" stroke-width="2.5" />
                  <path d="m103 148 31-34 19 18 21-25 20 24" stroke="#191817" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="163" cy="105" r="7" fill="#D7C8FA" stroke="#191817" stroke-width="2" />
                  <rect x="93" y="164" width="97" height="7" rx="3.5" fill="#191817" opacity=".8" />
                  <path d="M118 211h53m-43 0v14m33-14v14m-46 0h60" stroke="#191817" stroke-width="3" stroke-linecap="round" />
                  <path d="M219 84c14-15 32-13 39-4-13 0-17 6-18 14 11-4 19-2 25 4-8 9-22 12-38 4" fill="#F27B60" stroke="#191817" stroke-width="2" stroke-linejoin="round" />
                  <path d="m45 188 14 6-13 8-1-14Z" fill="#191817" />
                  <path d="m217 223 4 9 9 3-9 3-4 9-3-9-9-3 9-3 3-9Z" class="art__spark" />
                  <path d="M67 45c7-9 16-11 26-8m108 177c11 7 20 6 29-2" stroke="#191817" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 7" />
                </svg>

                <svg *ngSwitchDefault class="art art--create" viewBox="0 0 300 270" fill="none">
                  <path class="art__spark" d="m249 47 5 12 12 4-12 4-5 12-4-12-12-4 12-4 4-12Z" />
                  <path d="M62 80c0-11 9-20 20-20h135c11 0 20 9 20 20v111H62V80Z" fill="#FCF8F0" stroke="#191817" stroke-width="3" />
                  <path d="M75 82h149v92H75z" fill="#F8D949" />
                  <path d="M75 82h149v27H75z" fill="#191817" />
                  <circle cx="88" cy="95.5" r="3" fill="#F27B60" />
                  <circle cx="99" cy="95.5" r="3" fill="#D7C8FA" />
                  <circle cx="110" cy="95.5" r="3" fill="#F8D949" />
                  <path d="M94 152c12-22 26-33 44-33 20 0 35 11 45 33H94Z" fill="#D7C8FA" stroke="#191817" stroke-width="2.5" />
                  <path d="M144 120c0-8 7-14 15-14s15 6 15 14" stroke="#191817" stroke-width="2.5" />
                  <path d="M126 144h45" stroke="#191817" stroke-width="2.5" stroke-linecap="round" />
                  <path d="M90 191v12h120v-12m-89 12v17m58-17v17m-71 0h84" stroke="#191817" stroke-width="3" stroke-linecap="round" />
                  <path d="m49 102 7 16 16 6-16 6-7 16-6-16-16-6 16-6 6-16Z" fill="#F27B60" stroke="#191817" stroke-width="2" />
                  <path d="M220 215c-10 9-22 12-36 8m-83-2c-11 5-21 4-30-2" stroke="#191817" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 7" />
                  <path d="M238 135c8-7 15-7 22-2-7 2-10 6-11 12 8-3 14-1 19 4-6 6-15 8-26 3" fill="#F27B60" stroke="#191817" stroke-width="2" stroke-linejoin="round" />
                </svg>
              </div>
            </div>

            <div class="phone__bottom">
              <span>{{ slide.action }}</span>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m7 4 6 6-6 6m4-12 6 6-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="phone__home" aria-hidden="true"><span></span></div>
          </article>
        </div>

        <nav class="step-navigation" aria-label="Onboarding steps">
          <div class="step-navigation__meta">
            <span class="step-navigation__count">0{{ currentStep() + 1 }}</span>
            <span class="step-navigation__rule" aria-hidden="true"></span>
            <span class="step-navigation__total">03</span>
          </div>
          <div class="step-navigation__dots">
            <button
              *ngFor="let slide of slides; let index = index"
              type="button"
              class="step-dot"
              [class.step-dot--active]="currentStep() === index"
              [attr.aria-label]="'Go to step ' + (index + 1) + ': ' + slide.eyebrow"
              [attr.aria-current]="currentStep() === index ? 'step' : null"
              (click)="goToStep(index)"
            >
              <span></span>
            </button>
          </div>
          <button class="next-button" type="button" (click)="next()">
            <span>{{ currentStep() === 2 ? 'Finish' : 'Next' }}</span>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 10h11m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </nav>
      </section>
      <span class="welcome__signature" aria-hidden="true">GOOD IDEAS LIVE HERE</span>
    </main>
  `,
  styleUrl: './onboarding.component.scss',
})
export class OnboardingComponent implements OnInit {
  private readonly router = inject(Router);

  readonly currentStep = signal(0);

  readonly slides = [
    {
      tone: 'yellow',
      eyebrow: 'THE ASSET LIBRARY',
      title: 'Find the piece\nthat makes it.',
      description: 'A whole world of mockups, photos, icons and vectors—ready for your next big idea.',
      action: 'Browse the library',
    },
    {
      tone: 'lavender',
      eyebrow: 'YOUR CREATIVE TOOLKIT',
      title: 'Make the idea\nlook like yours.',
      description: 'Start with a template, open a PSD, and make every detail feel unmistakably you.',
      action: 'Make it your own',
    },
    {
      tone: 'coral',
      eyebrow: 'YOUR CREATOR SPACE',
      title: 'Put your work\nout in the world.',
      description: 'Build your portfolio, publish your assets, and let your next collaboration find you.',
      action: 'Meet your community',
    },
  ];

  ngOnInit(): void {
    if (hasShownSignupOnboarding()) {
      void this.router.navigate(['/marketplace'], { replaceUrl: true });
      return;
    }
    markSignupOnboardingShown();
  }

  goToStep(index: number): void {
    if (index >= 0 && index < this.slides.length) this.currentStep.set(index);
  }

  next(): void {
    if (this.currentStep() < this.slides.length - 1) {
      this.currentStep.update((step) => step + 1);
      return;
    }
    this.finish();
  }

  skip(): void {
    this.finish();
  }

  private finish(): void {
    void this.router.navigate(['/marketplace'], { replaceUrl: true });
  }
}
