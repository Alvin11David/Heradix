import { Component, ChangeDetectionStrategy, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: string;
  danger?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'amx-account',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="amx-acc">

      <!-- ── Sidebar ─────────────────────────────────────── -->
      <aside class="amx-acc__sidebar" [class.amx-acc__sidebar--collapsed]="collapsed()">

        <!-- Brand row -->
        <div class="amx-acc__brand" [class.amx-acc__brand--collapsed]="collapsed()">
          <div class="amx-acc__brand-logo">
            <img [src]="isDark() ? 'assets/logo/whitelogo.png' : 'assets/logo/blacklogo.png'"
                 alt="Amarapix" width="22" height="22" />
          </div>
          <span class="amx-acc__brand-name">Amara<span class="amx-acc__brand-pix">pix</span></span>
          <button class="amx-acc__collapse-btn" (click)="toggleCollapse()"
                  [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
                  data-tip="Toggle sidebar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <polyline [attr.points]="collapsed() ? '9 18 15 12 9 6' : '15 18 9 12 15 6'"/>
            </svg>
          </button>
        </div>

        <!-- User card -->
        <div class="amx-acc__user-card" [class.amx-acc__user-card--collapsed]="collapsed()">
          <div class="amx-acc__avatar" [class.amx-acc__avatar--admin]="isAdmin()"
               [class.amx-acc__avatar--premium]="isPremium()">
            <img *ngIf="auth.currentUser()?.avatarUrl"
                 [src]="auth.currentUser()!.avatarUrl" alt="" />
            <span *ngIf="!auth.currentUser()?.avatarUrl" class="amx-acc__avatar-initial">
              {{ initials() }}
            </span>
            <span class="amx-acc__avatar-status"></span>
          </div>
          <div class="amx-acc__user-info">
            <span class="amx-acc__user-name">{{ auth.currentUser()?.fullName ?? 'User' }}</span>
            <span class="amx-acc__user-email">{{ auth.currentUser()?.email }}</span>
            <span class="amx-acc__plan-badge"
                  [class.amx-acc__plan-badge--premium]="isPremium()"
                  [class.amx-acc__plan-badge--admin]="isAdmin()">
              <svg *ngIf="isPremium() || isAdmin()" width="9" height="9" viewBox="0 0 24 24"
                   fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
              {{ planLabel() }}
            </span>
          </div>
        </div>

        <!-- Nav sections -->
        <nav class="amx-acc__nav" aria-label="Account navigation">
          <div *ngFor="let section of sections" class="amx-acc__section">
            <span class="amx-acc__section-label" *ngIf="!collapsed()">{{ section.label }}</span>
            <a *ngFor="let item of section.items"
               [routerLink]="item.path"
               routerLinkActive="amx-acc__link--active"
               class="amx-acc__link"
               [class.amx-acc__link--danger]="item.danger"
               [attr.data-label]="item.label"
               (click)="onNavClick($event)">
              <span class="amx-acc__link-icon" [innerHTML]="safeIcon(item.icon)"></span>
              <span class="amx-acc__link-label">{{ item.label }}</span>
              <span *ngIf="item.badge" class="amx-acc__link-badge">{{ item.badge }}</span>
            </a>
          </div>
        </nav>

        <!-- Upgrade CTA (free users only) -->
        <a *ngIf="!isPremium() && !isAdmin() && !collapsed()"
           routerLink="/subscription/pricing"
           class="amx-acc__upgrade-cta">
          <span class="amx-acc__upgrade-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </span>
          <div class="amx-acc__upgrade-text">
            <strong>Upgrade to Premium</strong>
            <span>Unlock unlimited downloads</span>
          </div>
          <svg class="amx-acc__upgrade-arrow" width="14" height="14" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </a>

        <!-- Upgrade CTA collapsed -->
        <a *ngIf="!isPremium() && !isAdmin() && collapsed()"
           routerLink="/subscription/pricing"
           class="amx-acc__upgrade-icon-btn"
           data-tip="Upgrade to Premium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </a>

        <!-- Footer -->
        <div class="amx-acc__footer">
          <a routerLink="/marketplace" class="amx-acc__footer-btn"
             [class.amx-acc__footer-btn--icon-only]="collapsed()"
             data-tip="Back to Marketplace">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span *ngIf="!collapsed()">Marketplace</span>
          </a>

          <button class="amx-acc__footer-btn amx-acc__footer-btn--icon"
                  (click)="toggleTheme()"
                  [attr.data-tip]="isDark() ? 'Light mode' : 'Dark mode'"
                  [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
            <svg *ngIf="isDark()" width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg *ngIf="!isDark()" width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>

          <button class="amx-acc__footer-btn amx-acc__footer-btn--icon amx-acc__footer-btn--logout"
                  (click)="logout()"
                  data-tip="Sign out"
                  aria-label="Sign out">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

        <!-- Ripple container -->
        <span class="amx-acc__ripple-host" aria-hidden="true"></span>
      </aside>

      <!-- ── Main content ─────────────────────────────────── -->
      <main class="amx-acc__content" [class.amx-acc__content--expanded]="collapsed()">
        <router-outlet />
      </main>

      <!-- ── Mobile bottom nav ───────────────────────────── -->
      <nav class="amx-acc__mobile-nav" aria-label="Account navigation">
        <a *ngFor="let item of mobileItems"
           [routerLink]="item.path"
           routerLinkActive="amx-acc__mob-link--active"
           class="amx-acc__mob-link"
           [class.amx-acc__mob-link--danger]="item.danger">
          <span [innerHTML]="safeIcon(item.icon)"></span>
          <span>{{ item.label }}</span>
        </a>
        <button class="amx-acc__mob-link" (click)="logout()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Sign out</span>
        </button>
      </nav>

    </div>
  `,
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnDestroy {
  readonly auth    = inject(AuthService);
  readonly theme   = inject(ThemeService);
  readonly isDark  = this.theme.isDark;
  private readonly sanitizer = inject(DomSanitizer);

  readonly collapsed = signal(localStorage.getItem('amx-sidebar-collapsed') === 'true');

  readonly isPremium = computed(() => this.auth.isPremium());
  readonly isAdmin   = computed(() => this.auth.isAdmin());

  private idleTimer: ReturnType<typeof setTimeout> | null = null;

  readonly planLabel = computed(() => {
    const role = this.auth.currentUser()?.role ?? 'FREE';
    if (role === 'ADMIN')   return 'Admin';
    if (role === 'PREMIUM') return 'Premium';
    return 'Free';
  });

  readonly sections: NavSection[] = [
    {
      label: 'Account',
      items: [
        {
          path: 'profile',
          label: 'Profile',
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        },
        {
          path: 'settings',
          label: 'Settings',
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
        },
      ],
    },
    {
      label: 'Billing',
      items: [
        {
          path: 'subscription',
          label: 'Subscription',
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>',
        },
        {
          path: 'payment-methods',
          label: 'Payment Methods',
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
        },
      ],
    },
    {
      label: 'Usage',
      items: [
        {
          path: 'downloads',
          label: 'Downloads',
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        },
        {
          path: 'quota',
          label: 'Quota & Limits',
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
        },
      ],
    },
    {
      label: 'More',
      items: [
        {
          path: 'danger-zone',
          label: 'Danger Zone',
          danger: true,
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        },
      ],
    },
  ];

  /** Items shown in the mobile bottom bar (max 5) */
  readonly mobileItems: NavItem[] = [
    this.sections[0].items[0], // Profile
    this.sections[0].items[1], // Settings
    this.sections[1].items[0], // Subscription
    this.sections[2].items[0], // Downloads
    this.sections[2].items[1], // Quota
  ];

  initials(): string {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
  }

  safeIcon(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
    localStorage.setItem('amx-sidebar-collapsed', String(this.collapsed()));
    if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null; }
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  logout(): void {
    this.auth.logout();
  }

  onNavClick(event: MouseEvent): void {
    const link = (event.currentTarget as HTMLElement);
    const rect = link.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const ripple = document.createElement('span');
    ripple.className = 'amx-acc__ripple';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${event.clientX - rect.left - size / 2}px;top:${event.clientY - rect.top - size / 2}px`;
    link.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }

  ngOnDestroy(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
  }
}
