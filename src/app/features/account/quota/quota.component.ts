import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'amx-quota',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="amx-pf">
      <div class="amx-pf__header">
        <div>
          <h1 class="amx-pf__title">Quota Status</h1>
          <p class="amx-pf__sub">Track your daily and monthly download limits.</p>
        </div>
      </div>
      <div class="amx-pf__card amx-pf__card--placeholder">
        <div class="amx-pf__placeholder-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <h3 class="amx-pf__placeholder-title">Quota status coming soon</h3>
        <p class="amx-pf__placeholder-text">See your remaining free downloads, premium limits, and usage analytics.</p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .amx-pf { font-family: 'Manrope', sans-serif; }
    .amx-pf__header { margin-bottom: 28px; }
    .amx-pf__title { font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 800; color: var(--amx-text); margin: 0 0 4px; letter-spacing: -0.5px; }
    .amx-pf__sub { font-size: 13.5px; color: var(--amx-muted); margin: 0; max-width: 500px; line-height: 1.6; }
    .amx-pf__card { background: var(--amx-card); border: 1px solid var(--amx-border); border-radius: 16px; padding: 48px 32px; box-shadow: var(--amx-shadow-sm); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; }
    .amx-pf__placeholder-icon svg { color: var(--amx-text-faint); }
    .amx-pf__placeholder-title { font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; color: var(--amx-text); margin: 0; }
    .amx-pf__placeholder-text { font-size: 13.5px; color: var(--amx-muted); margin: 0; max-width: 360px; line-height: 1.6; }
  `],
})
export class QuotaComponent {}
