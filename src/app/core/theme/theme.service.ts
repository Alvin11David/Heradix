import { Injectable, computed, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'amx_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  private readonly savedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;

  private readonly _theme = signal<ThemeMode>(this.resolveInitialTheme());

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    this.applyTheme(this._theme());

    this.systemPrefersDark.addEventListener('change', (event) => {
      if (localStorage.getItem(THEME_KEY)) {
        return;
      }

      const nextTheme: ThemeMode = event.matches ? 'dark' : 'light';
      this._theme.set(nextTheme);
      this.applyTheme(nextTheme);
    });
  }

  toggle(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  setTheme(theme: ThemeMode): void {
    this._theme.set(theme);
    localStorage.setItem(THEME_KEY, theme);
    this.applyTheme(theme);
  }

  syncTheme(): void {
    this.applyTheme(this._theme());
  }

  private resolveInitialTheme(): ThemeMode {
    if (this.savedTheme === 'light' || this.savedTheme === 'dark') {
      return this.savedTheme;
    }

    return this.systemPrefersDark.matches ? 'dark' : 'light';
  }

  private applyTheme(theme: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }
}