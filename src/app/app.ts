import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { signal } from '@angular/core';
import { filter } from 'rxjs';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);
  readonly isAuthPage = signal(false);

  constructor() {
    this.theme.syncTheme();

    // Hide header/footer on auth pages
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || '';
        this.isAuthPage.set(/^\/auth\/(login|register|forgot-password)/.test(url));
      });
  }
}
