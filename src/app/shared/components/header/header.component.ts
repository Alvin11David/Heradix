import { Component, ChangeDetectionStrategy, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';

interface CategoryGroup {
  label: string;
  route: string;
  hasDropdown?: boolean;
  dropdownItems?: string[];
}

const FORMAT_ITEMS = [
  'All Images', 'PSDs', 'Vector', 'PNGs', 'Photos',
  'Videos', 'Mockups', 'SVGs', 'Motion Graphics', 'Templates',
];

@Component({
  selector: 'amx-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="amx-topbar">
      <div class="amx-topbar__inner">

        <a routerLink="/marketplace" class="amx-logo" aria-label="Amarapix home">
          <img src="https://i.postimg.cc/zD47BZ94/Asset-1-2x.png"
               alt="Amarapix"
               class="amx-logo__img"
               onerror="this.style.display='none';this.nextElementSibling.style.display='inline'" />
          <span class="amx-logo__text" style="display:none">Amara<span class="amx-logo__pix">pix</span></span>
        </a>

        <button class="amx-categories-btn" type="button" aria-haspopup="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          All Categories
        </button>

        <div class="amx-search">
          <input
            class="amx-search__input"
            type="search"
            placeholder="Search over 1million + assets"
            aria-label="Search assets"
          />
          <div class="amx-search__divider" aria-hidden="true"></div>
          <div class="amx-search__format-wrap">
            <button class="amx-search__format" type="button"
                    (click)="formatOpen.set(!formatOpen())"
                    [attr.aria-expanded]="formatOpen()">
              {{ selectedFormat() }}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <ul class="amx-format-dropdown" *ngIf="formatOpen()" role="listbox">
              <li *ngFor="let item of formatItems"
                  class="amx-format-dropdown__item"
                  [class.amx-format-dropdown__item--active]="selectedFormat() === item"
                  (click)="selectFormat(item)"
                  role="option">
                {{ item }}
              </li>
            </ul>
          </div>
          <button class="amx-search__submit" type="submit" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </div>

        <div class="amx-topbar__actions">
          <button
            class="amx-theme-btn"
            type="button"
            (click)="toggleTheme()"
            [attr.aria-pressed]="darkMode()"
            [attr.aria-label]="darkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <svg *ngIf="!darkMode()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
            <svg *ngIf="darkMode()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            <span>{{ darkMode() ? 'Dark' : 'Light' }}</span>
          </button>

          <ng-container *ngIf="auth.isLoggedIn(); else guestTpl">
            <button class="amx-btn amx-btn--premium" routerLink="/pricing">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M2 19h20v2H2v-2zM12 3l4 8 4-4-3 10H7L4 7l4 4 4-8z"/>
              </svg>
              Premium
            </button>

            <div class="amx-avatar-wrap" (click)="$event.stopPropagation()">
              <button class="amx-avatar"
                      (click)="avatarMenuOpen.set(!avatarMenuOpen())"
                      [attr.aria-expanded]="avatarMenuOpen()"
                      aria-label="Account menu">
                <img *ngIf="auth.currentUser()?.avatarUrl; else initials"
                  [src]="auth.currentUser()!.avatarUrl"
                  [alt]="auth.currentUser()!.fullName" />
                <ng-template #initials>
                  <span>{{ auth.currentUser()!.fullName.charAt(0).toUpperCase() }}</span>
                </ng-template>
              </button>

              <div class="amx-user-menu" *ngIf="avatarMenuOpen()" role="menu">
                <div class="amx-user-menu__header">
                  <div class="amx-user-menu__avatar">
                    <img *ngIf="auth.currentUser()?.avatarUrl"
                         [src]="auth.currentUser()!.avatarUrl"
                         [alt]="auth.currentUser()!.fullName" />
                    <span *ngIf="!auth.currentUser()?.avatarUrl">
                      {{ auth.currentUser()!.fullName.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div class="amx-user-menu__info">
                    <span class="amx-user-menu__name">{{ auth.currentUser()!.fullName }}</span>
                    <span class="amx-user-menu__email">{{ auth.currentUser()!.email }}</span>
                    <span class="amx-user-menu__role amx-user-menu__role--{{ auth.currentUser()!.role | lowercase }}">
                      {{ auth.currentUser()!.role }}
                    </span>
                  </div>
                </div>

                <div class="amx-user-menu__divider"></div>

                <ul class="amx-user-menu__list" role="none">
                  <li role="none">
                    <a routerLink="/profile" class="amx-user-menu__item" role="menuitem" (click)="avatarMenuOpen.set(false)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      Profile
                    </a>
                  </li>
                  <li role="none">
                    <a routerLink="/workspace" class="amx-user-menu__item" role="menuitem" (click)="avatarMenuOpen.set(false)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                      </svg>
                      My Workspace
                    </a>
                  </li>
                  <li role="none">
                    <a routerLink="/settings" class="amx-user-menu__item" role="menuitem" (click)="avatarMenuOpen.set(false)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      Settings
                    </a>
                  </li>
                  <li role="none">
                    <a routerLink="/pricing" class="amx-user-menu__item" role="menuitem" (click)="avatarMenuOpen.set(false)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      Plan &amp; Billing
                    </a>
                  </li>
                </ul>

                <div class="amx-user-menu__divider"></div>

                <div class="amx-user-menu__theme" role="none">
                  <span class="amx-user-menu__theme-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                    Dark Mode
                  </span>
                  <button class="amx-theme-toggle"
                          [class.amx-theme-toggle--on]="darkMode()"
                          (click)="toggleTheme()"
                          [attr.aria-checked]="darkMode()"
                          role="switch"
                          aria-label="Toggle dark mode">
                    <span class="amx-theme-toggle__knob"></span>
                  </button>
                </div>

                <div class="amx-user-menu__divider"></div>

                <ul class="amx-user-menu__list" role="none">
                  <li role="none">
                    <button class="amx-user-menu__item amx-user-menu__item--danger" role="menuitem" (click)="logout()">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Log Out
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </ng-container>

          <ng-template #guestTpl>
            <button class="amx-btn amx-btn--premium" routerLink="/pricing">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M2 19h20v2H2v-2zM12 3l4 8 4-4-3 10H7L4 7l4 4 4-8z"/>
              </svg>
              Premium
            </button>
            <a routerLink="/auth/register" class="amx-btn amx-btn--ghost">Register</a>
            <a routerLink="/auth/login"    class="amx-btn amx-btn--primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Login
            </a>
          </ng-template>
        </div>
      </div>
    </header>

    <nav class="amx-catnav" aria-label="Asset categories">
      <div class="amx-catnav__inner">
        <ul class="amx-catnav__list" role="list">
          <li *ngFor="let cat of categories" class="amx-catnav__item"
              (mouseenter)="cat.dropdownItems && openCatDropdown(cat.label)"
              (mouseleave)="closeCatDropdown()">
            <a [routerLink]="cat.route"
               class="amx-catnav__link"
               [class.active]="activeCat === cat.label">
              {{ cat.label }}
              <svg *ngIf="cat.hasDropdown"
                   width="11" height="11" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </a>
            <ul *ngIf="cat.dropdownItems && openDropdown === cat.label"
                class="amx-cat-dropdown" role="menu">
              <li *ngFor="let item of cat.dropdownItems"
                  class="amx-cat-dropdown__item"
                  role="menuitem">{{ item }}</li>
            </ul>
          </li>
        </ul>

        <ul class="amx-catnav__utils" role="list">
          <li>
            <a routerLink="/print" routerLinkActive="active" class="amx-catnav__util-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print
            </a>
          </li>
          <li>
            <a routerLink="/academy" routerLinkActive="active" class="amx-catnav__util-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              Amarapix Academy
            </a>
          </li>
        </ul>
      </div>
    </nav>
  `,
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);


  formatOpen     = signal(false);
  selectedFormat = signal('Format');
  readonly formatItems = FORMAT_ITEMS;


  openDropdown: string | null = null;
  activeCat: string | null = null;


  avatarMenuOpen = signal(false);


  readonly darkMode = this.theme.isDark;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.avatarMenuOpen.set(false);
    this.formatOpen.set(false);
  }

  openCatDropdown(label: string): void  { this.openDropdown = label; }
  closeCatDropdown(): void              { this.openDropdown = null; }

  selectFormat(item: string): void {
    this.selectedFormat.set(item);
    this.formatOpen.set(false);
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  logout(): void {
    this.avatarMenuOpen.set(false);
    this.auth.logout();
  }

  readonly categories: CategoryGroup[] = [
    { label: 'Collections', route: '/collections' },
    {
      label: 'PSD', route: '/marketplace', hasDropdown: true,
      dropdownItems: ['All PSDs', 'Church Flyer', 'Business Cards', 'Brochures', 'Profile', 'Party Flyers'],
    },
    { label: 'Mockups', route: '/mockups' },
    { label: 'Icons',   route: '/icons' },
    {
      label: 'PNG', route: '/png', hasDropdown: true,
      dropdownItems: ['All PNGs', 'Business & Office', 'Technology', 'Nature & Plants', 'Animals', 'Food & Drink', 'Holidays & Events'],
    },
    { label: 'Vectors', route: '/vectors' },
    {
      label: 'Photos', route: '/marketplace', hasDropdown: true,
      dropdownItems: ['All Photos', 'AI Generated', 'City', 'Landscapes', 'People', 'Animals', 'Sports', 'Branding'],
    },
    { label: 'Videos', route: '/marketplace' },
    { label: 'Other Categories', route: '/marketplace', hasDropdown: true },
  ];
}
