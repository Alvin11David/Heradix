import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { DownloadTrackingService } from '../../../core/services/download-tracking.service';

@Component({
  selector: 'amx-quota',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="quota">
      <div class="quota__header">
        <div>
          <h1 class="quota__title">Quota &amp; Usage</h1>
          <p class="quota__sub">Track your daily and monthly download allowances.</p>
        </div>
        <div class="quota__plan-badge" [class.quota__plan-badge--premium]="isPremium()">
          <svg width="14" height="14" viewBox="0 0 24 24" [attr.fill]="isPremium() ? '#f5820a' : 'currentColor'" aria-hidden="true">
            <path *ngIf="isPremium()" d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
            <circle *ngIf="!isPremium()" cx="12" cy="12" r="10"/><line *ngIf="!isPremium()" x1="12" y1="8" x2="12" y2="12"/><line *ngIf="!isPremium()" x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ isPremium() ? 'Premium Plan' : 'Free Plan' }}
        </div>
      </div>

      <!-- Stat cards row -->
      <div class="quota__stats">
        <div class="quota__stat-card">
          <span class="quota__stat-label">Today</span>
          <div class="quota__stat-val">
            <strong>{{ todayCount() }}</strong>
            <span *ngIf="!isPremium()"> / {{ DAILY_LIMIT }}</span>
            <span *ngIf="isPremium()"> downloads</span>
          </div>
          <div class="quota__bar-wrap" *ngIf="!isPremium()">
            <div class="quota__bar" [style.width.%]="dailyPct()" [class.quota__bar--warn]="dailyPct() >= 80" [class.quota__bar--full]="dailyPct() >= 100"></div>
          </div>
          <p class="quota__reset-note" *ngIf="!isPremium()">Resets at midnight</p>
          <p class="quota__reset-note quota__reset-note--ok" *ngIf="isPremium()">Unlimited daily downloads</p>
        </div>

        <div class="quota__stat-card">
          <span class="quota__stat-label">This Month</span>
          <div class="quota__stat-val">
            <strong>{{ monthCount() }}</strong>
            <span *ngIf="!isPremium()"> / {{ MONTHLY_LIMIT }}</span>
            <span *ngIf="isPremium()"> downloads</span>
          </div>
          <div class="quota__bar-wrap" *ngIf="!isPremium()">
            <div class="quota__bar" [style.width.%]="monthlyPct()" [class.quota__bar--warn]="monthlyPct() >= 80" [class.quota__bar--full]="monthlyPct() >= 100"></div>
          </div>
          <p class="quota__reset-note" *ngIf="!isPremium()">Resets {{ monthResetDate() }}</p>
          <p class="quota__reset-note quota__reset-note--ok" *ngIf="isPremium()">Unlimited monthly downloads</p>
        </div>

        <div class="quota__stat-card">
          <span class="quota__stat-label">All Time</span>
          <div class="quota__stat-val"><strong>{{ totalCount() }}</strong> <span>downloads</span></div>
          <p class="quota__reset-note quota__reset-note--ok">Since you joined</p>
        </div>
      </div>

      <!-- Upgrade prompt (free plan only) -->
      <div class="quota__upgrade" *ngIf="!isPremium()">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#f5820a" aria-hidden="true"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg>
        <div>
          <strong>Unlock unlimited downloads</strong>
          <p>Upgrade to Premium and never worry about limits again. Plus get access to all premium assets.</p>
        </div>
        <a href="/pricing" class="quota__upgrade-btn">Upgrade Now</a>
      </div>

      <!-- Recent download breakdown -->
      <div class="quota__breakdown" *ngIf="recentByType().length > 0">
        <h2 class="quota__section-title">Downloads by type — last 30 days</h2>
        <div class="quota__type-list">
          <div *ngFor="let row of recentByType()" class="quota__type-row">
            <span class="quota__type-name">{{ row.label }}</span>
            <div class="quota__type-bar-wrap">
              <div class="quota__type-bar" [style.width.%]="row.pct"></div>
            </div>
            <span class="quota__type-count">{{ row.count }}</span>
          </div>
        </div>
      </div>

      <!-- Empty state when no downloads yet -->
      <div class="quota__empty" *ngIf="totalCount() === 0">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        <p>No downloads yet. Start exploring and download assets to see your usage here.</p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .quota {
      font-family: 'Manrope', sans-serif;
      max-width: 860px;
    }

    .quota__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }

    .quota__title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: var(--amx-text);
      margin: 0 0 4px;
      letter-spacing: -0.5px;
    }

    .quota__sub {
      font-size: 13.5px;
      color: var(--amx-muted);
      margin: 0;
      line-height: 1.6;
    }

    .quota__plan-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 999px;
      background: var(--amx-card);
      border: 1px solid var(--amx-border);
      font-size: 13px;
      font-weight: 700;
      color: var(--amx-text);
      white-space: nowrap;
      flex-shrink: 0;

      &--premium {
        background: linear-gradient(135deg, #fff7ed, #fef3c7);
        border-color: #f5820a40;
        color: #c25d00;
      }
    }

    .quota__stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .quota__stat-card {
      background: var(--amx-card);
      border: 1px solid var(--amx-border);
      border-radius: 16px;
      padding: 20px 22px;
      box-shadow: var(--amx-shadow-sm);
    }

    .quota__stat-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--amx-muted);
    }

    .quota__stat-val {
      font-size: 28px;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 800;
      color: var(--amx-text);
      margin: 6px 0 10px;
      line-height: 1;

      strong { color: inherit; }
      span { font-size: 15px; font-weight: 500; color: var(--amx-muted); margin-left: 2px; }
    }

    .quota__bar-wrap {
      height: 6px;
      background: var(--amx-border);
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .quota__bar {
      height: 100%;
      border-radius: 999px;
      background: #f5820a;
      transition: width .4s ease;

      &--warn { background: #f59e0b; }
      &--full { background: #ef4444; }
    }

    .quota__reset-note {
      font-size: 11.5px;
      color: var(--amx-muted);
      margin: 0;

      &--ok { color: #10b981; }
    }

    .quota__upgrade {
      display: flex;
      align-items: center;
      gap: 16px;
      background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
      border: 1px solid #f5820a30;
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 24px;

      svg { flex-shrink: 0; }

      div {
        flex: 1;
        strong { display: block; font-size: 15px; font-weight: 700; color: #92400e; margin-bottom: 4px; }
        p { font-size: 13px; color: #b45309; margin: 0; line-height: 1.5; }
      }
    }

    .quota__upgrade-btn {
      display: inline-flex;
      align-items: center;
      padding: 9px 20px;
      background: #f5820a;
      color: #fff;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background .15s;

      &:hover { background: #e07309; }
    }

    .quota__section-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: var(--amx-text);
      margin: 0 0 14px;
    }

    .quota__breakdown {
      background: var(--amx-card);
      border: 1px solid var(--amx-border);
      border-radius: 16px;
      padding: 20px 22px;
      box-shadow: var(--amx-shadow-sm);
    }

    .quota__type-list { display: flex; flex-direction: column; gap: 10px; }

    .quota__type-row {
      display: grid;
      grid-template-columns: 80px 1fr 36px;
      align-items: center;
      gap: 12px;
    }

    .quota__type-name { font-size: 12.5px; font-weight: 600; color: var(--amx-text); }

    .quota__type-bar-wrap {
      height: 8px;
      background: var(--amx-border);
      border-radius: 999px;
      overflow: hidden;
    }

    .quota__type-bar {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #f5820a, #f59e0b);
      transition: width .4s ease;
    }

    .quota__type-count {
      font-size: 12px;
      font-weight: 700;
      color: var(--amx-muted);
      text-align: right;
    }

    .quota__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 32px;
      text-align: center;
      color: var(--amx-muted);

      svg { opacity: .4; }
      p { font-size: 13.5px; line-height: 1.6; max-width: 320px; margin: 0; }
    }
  `],
})
export class QuotaComponent {
  private readonly auth    = inject(AuthService);
  private readonly tracker = inject(DownloadTrackingService);

  readonly DAILY_LIMIT   = 5;
  readonly MONTHLY_LIMIT = 50;

  readonly isPremium  = this.auth.isPremium;
  readonly todayCount = this.tracker.todayCount;
  readonly monthCount = this.tracker.monthCount;
  readonly totalCount = computed(() => this.tracker.history().length);

  readonly dailyPct   = computed(() =>
    Math.min(100, Math.round((this.todayCount()  / this.DAILY_LIMIT)   * 100)));
  readonly monthlyPct = computed(() =>
    Math.min(100, Math.round((this.monthCount() / this.MONTHLY_LIMIT) * 100)));

  readonly monthResetDate = computed(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  readonly recentByType = computed(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const recent = this.tracker.history().filter(e => new Date(e.downloadedAt) >= start);
    if (recent.length === 0) return [];

    const counts: Record<string, number> = {};
    recent.forEach(e => { counts[e.assetType] = (counts[e.assetType] ?? 0) + 1; });

    const labels: Record<string, string> = {
      vector: 'Vectors', photo: 'Photos', mockup: 'Mockups',
      template: 'Templates', icon: 'Icons', other: 'Other',
    };
    const maxCount = Math.max(...Object.values(counts));

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        label: labels[type] ?? type,
        count,
        pct: Math.round((count / maxCount) * 100),
      }));
  });
}
