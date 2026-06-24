import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AffiliateService } from '../affiliate.service';
import { Affiliate, Submission } from '../../../core/models/affiliate.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'amx-affiliate-dashboard',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="affiliate-page">
      <h1 class="affiliate-page__title">Contributor Dashboard</h1>

      <amx-spinner *ngIf="loading()" />

      <ng-container *ngIf="!loading() && profile()">
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Total Earnings</span>
            <span class="stat-value">\${{ profile()!.totalEarnings.toFixed(2) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Pending Payout</span>
            <span class="stat-value">\${{ profile()!.pendingPayout.toFixed(2) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Submissions</span>
            <span class="stat-value">{{ submissions().length }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Status</span>
            <span class="stat-value stat-value--{{ profile()!.applicationStatus.toLowerCase() }}">
              {{ profile()!.applicationStatus }}
            </span>
          </div>
        </div>

        <section class="submissions-section">
          <div class="section-header">
            <h2>My Submissions</h2>
          </div>
          <table class="submissions-table">
            <thead>
              <tr>
                <th>Title</th><th>Format</th><th>Status</th><th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of submissions()">
                <td>{{ s.title }}</td>
                <td><span class="tag">{{ s.format }}</span></td>
                <td><span class="status-badge status-badge--{{ s.status.toLowerCase() }}">{{ s.status }}</span></td>
                <td>{{ s.createdAt | date:'mediumDate' }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </ng-container>
    </div>
  `,
  styleUrl: './affiliate-dashboard.component.scss',
})
export class AffiliateDashboardComponent implements OnInit {
  private readonly svc = inject(AffiliateService);

  profile     = signal<Affiliate | null>(null);
  submissions = signal<Submission[]>([]);
  loading     = signal(true);

  ngOnInit(): void {
    this.svc.getProfile().subscribe({
      next: (p) => { this.profile.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.svc.getSubmissions().subscribe((s) => this.submissions.set(s));
  }
}
