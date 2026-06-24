import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminService } from '../admin.service';
import { Submission } from '../../../core/models/affiliate.model';

@Component({
  selector: 'amx-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <h2 class="admin-sidebar__title">Admin Panel</h2>
        <nav class="admin-nav">
          <a routerLink="users"       routerLinkActive="active" class="admin-nav__link">Users</a>
          <a routerLink="assets"      routerLinkActive="active" class="admin-nav__link">Assets</a>
          <a routerLink="submissions" routerLinkActive="active" class="admin-nav__link">
            Submissions
            <span class="badge" *ngIf="pendingCount() > 0">{{ pendingCount() }}</span>
          </a>
          <a routerLink="analytics"   routerLinkActive="active" class="admin-nav__link">Analytics</a>
        </nav>
      </aside>
      <main class="admin-content">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly svc = inject(AdminService);
  pendingCount = signal(0);

  ngOnInit(): void {
    this.svc.getPendingSubmissions().subscribe((s) => this.pendingCount.set(s.length));
  }
}
