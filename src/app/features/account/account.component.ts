import { Component, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'amx-account',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="amx-acc">
      <aside class="amx-acc__sidebar"
             [class.amx-acc__sidebar--collapsed]="collapsed()"
             (mousemove)="onSidebarMouseMove()"
             (mouseleave)="onSidebarMouseLeave()">
        <div class="amx-acc__sidebar-header">
          <div class="amx-acc__brand">
            <div class="amx-acc__brand-square">
              <img [src]="isDark() ? 'assets/logo/whitelogo.png' : 'assets/logo/blacklogo.png'"
                   alt="Amarapix" />
            </div>
            <span class="amx-acc__brand-name">
              Amara<span class="amx-acc__brand-pix">pix</span>
            </span>
          </div>
          <div class="amx-acc__user-mini">
            <div class="amx-acc__mini-avatar">
              <img *ngIf="auth.currentUser()?.avatarUrl"
                   [src]="auth.currentUser()!.avatarUrl" alt="" />
              <span *ngIf="!auth.currentUser()?.avatarUrl"
                    class="amx-acc__mini-initial">{{ initials() }}</span>
            </div>
            <div class="amx-acc__mini-info">
              <span class="amx-acc__mini-name">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {{ auth.currentUser()?.fullName }}
              </span>
              <span class="amx-acc__mini-role">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                {{ auth.currentUser()?.role }}
              </span>
            </div>
          </div>
        </div>

        <nav class="amx-acc__nav" (click)="onNavClick($event)">
          <a *ngFor="let item of navItems"
             [routerLink]="item.path"
             routerLinkActive="amx-acc__nav-link--active"
             class="amx-acc__nav-link"
             [attr.data-label]="item.label">
            <span class="amx-acc__nav-icon" [innerHTML]="safeIcon(item.icon)"></span>
            <span class="amx-acc__nav-label">{{ item.label }}</span>
          </a>
        </nav>

        <div class="amx-acc__sidebar-footer">
          <button class="amx-acc__toggle" (click)="toggleCollapse()" title="Toggle sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 [style.transform]="collapsed() ? 'rotate(180deg)' : 'rotate(0deg)'">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <a routerLink="/marketplace" class="amx-acc__back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span class="amx-acc__back-link-text">Back to Marketplace</span>
          </a>
        </div>
      </aside>

      <main class="amx-acc__content" [class.amx-acc__content--shifted]="!collapsed()">
        <router-outlet />
      </main>

      <nav class="amx-acc__mobile-nav">
        <a *ngFor="let item of navItems"
           [routerLink]="item.path"
           routerLinkActive="amx-acc__mobile-link--active"
           class="amx-acc__mobile-link">
          <span [innerHTML]="safeIcon(item.icon)"></span>
          <span>{{ item.label }}</span>
        </a>
      </nav>
    </div>
  `,
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnDestroy {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly isDark = this.theme.isDark;
  private readonly sanitizer = inject(DomSanitizer);

  readonly collapsed = signal(localStorage.getItem('amx-sidebar-collapsed') === 'true');
  readonly prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly IDLE_MS = 5000;

  readonly navItems: NavItem[] = [
    { path: 'profile',      label: 'Profile',         icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
    { path: 'settings',     label: 'Settings',        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
    { path: 'subscription', label: 'Subscription',    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>' },
    { path: 'payment-methods', label: 'Payment Methods', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
    { path: 'downloads',    label: 'Downloads',       icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' },
    { path: 'quota',        label: 'Quota',            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
    { path: 'danger-zone',  label: 'Danger Zone',     icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
  ];

  initials(): string {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  safeIcon(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
    localStorage.setItem('amx-sidebar-collapsed', String(this.collapsed()));
  }

  onNavClick(event: MouseEvent): void {
    if (this.prefersReducedMotion) return;
    const link = (event.target as HTMLElement).closest('.amx-acc__nav-link') as HTMLElement | null;
    if (!link) return;
    const rect = link.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'amx-acc__ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    link.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  onSidebarMouseMove(): void {
    if (this.collapsed()) this.collapsed.set(false);
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  onSidebarMouseLeave(): void {
    this.startIdleTimer();
  }

  private startIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.collapsed.set(true);
      this.idleTimer = null;
    }, this.IDLE_MS);
  }

  ngOnDestroy(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
  }
}
