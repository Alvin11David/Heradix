import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { signal } from '@angular/core';
import { filter } from 'rxjs';
import { ThemeService } from './core/theme/theme.service';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  readonly isAuthPage = signal(false);

  constructor() {
    this.theme.syncTheme();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || '';
        this.isAuthPage.set(/^\/auth\/(login|register|forgot-password)|^\/editor/.test(url));
      });
  }

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.auth.login({
        email: 'kafulumap@gmail.com',
        password: 'Zulukedra!7',
      }).subscribe();
    }
  }
}
