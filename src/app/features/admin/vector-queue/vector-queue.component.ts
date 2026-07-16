import {
  Component, ChangeDetectionStrategy, signal, computed, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type QueueStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface QueueAsset {
  id: string;
  name: string;
  thumb: string;
  preview: string;
  creator: string;
  creatorAvatar: string;
  category: string;
  style: string;
  license: string;
  submittedAt: string;
  formats: string[];
  status: QueueStatus;
  flags: string[];
  note: string;
}

export interface CreatorVerification {
  id: string;
  name: string;
  avatar: string;
  email: string;
  uploadCount: number;
  submittedAt: string;
  portfolio: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

export interface DmcaRequest {
  id: string;
  assetId: string;
  assetName: string;
  assetThumb: string;
  claimant: string;
  email: string;
  description: string;
  submittedAt: string;
  status: 'pending' | 'actioned' | 'dismissed';
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_QUEUE: QueueAsset[] = [
  {
    id: 'q1', name: 'Business Icons Pack v2', thumb: 'https://picsum.photos/seed/q1/120/90',
    preview: 'https://picsum.photos/seed/q1/400/300', creator: 'PixelCraft Studio',
    creatorAvatar: 'https://i.pravatar.cc/32?img=2', category: 'business',
    style: 'flat', license: 'free', submittedAt: '2026-07-15T10:22:00Z',
    formats: ['svg', 'eps', 'png'], status: 'pending', flags: [], note: '',
  },
  {
    id: 'q2', name: 'Abstract Wave Collection', thumb: 'https://picsum.photos/seed/q2/120/90',
    preview: 'https://picsum.photos/seed/q2/400/300', creator: 'FlatMaster',
    creatorAvatar: 'https://i.pravatar.cc/32?img=5', category: 'abstract',
    style: 'gradient', license: 'premium', submittedAt: '2026-07-15T14:11:00Z',
    formats: ['svg', 'ai'], status: 'pending', flags: ['large-file'], note: '',
  },
  {
    id: 'q3', name: 'Cute Animal Set', thumb: 'https://picsum.photos/seed/q3/120/90',
    preview: 'https://picsum.photos/seed/q3/400/300', creator: 'ToonWorks',
    creatorAvatar: 'https://i.pravatar.cc/32?img=7', category: 'characters',
    style: 'cartoon', license: 'free', submittedAt: '2026-07-14T18:05:00Z',
    formats: ['svg', 'png'], status: 'approved', flags: [], note: 'Quality pass',
  },
  {
    id: 'q4', name: 'Medical Icons Set', thumb: 'https://picsum.photos/seed/q4/120/90',
    preview: 'https://picsum.photos/seed/q4/400/300', creator: 'HealthGraphics',
    creatorAvatar: 'https://i.pravatar.cc/32?img=9', category: 'medical',
    style: 'outline', license: 'premium', submittedAt: '2026-07-14T09:40:00Z',
    formats: ['svg', 'eps'], status: 'rejected', flags: ['low-quality'], note: 'Needs better contrast',
  },
  {
    id: 'q5', name: 'City Skyline Set', thumb: 'https://picsum.photos/seed/q5/120/90',
    preview: 'https://picsum.photos/seed/q5/400/300', creator: 'UrbanDesigns',
    creatorAvatar: 'https://i.pravatar.cc/32?img=11', category: 'travel',
    style: 'isometric', license: 'free', submittedAt: '2026-07-16T07:30:00Z',
    formats: ['svg', 'ai', 'pdf'], status: 'pending', flags: ['possible-copyright'], note: '',
  },
  {
    id: 'q6', name: 'Tech Circuit Background', thumb: 'https://picsum.photos/seed/q6/120/90',
    preview: 'https://picsum.photos/seed/q6/400/300', creator: 'CircuitLabs',
    creatorAvatar: 'https://i.pravatar.cc/32?img=13', category: 'technology',
    style: 'flat', license: 'premium', submittedAt: '2026-07-16T08:00:00Z',
    formats: ['svg', 'eps', 'png'], status: 'flagged', flags: ['dmca-claim'], note: 'Review copyright',
  },
];

const MOCK_VERIFICATIONS: CreatorVerification[] = [
  { id: 'cv1', name: 'PixelCraft Studio', avatar: 'https://i.pravatar.cc/40?img=2',  email: 'pixelcraft@email.com', uploadCount: 47, submittedAt: '2026-07-14T12:00:00Z', portfolio: 'https://example.com', status: 'pending', reason: '' },
  { id: 'cv2', name: 'FlatMaster',        avatar: 'https://i.pravatar.cc/40?img=5',  email: 'flatmaster@email.com', uploadCount: 128, submittedAt: '2026-07-13T09:00:00Z', portfolio: 'https://example.com', status: 'pending', reason: '' },
  { id: 'cv3', name: 'ToonWorks',         avatar: 'https://i.pravatar.cc/40?img=7',  email: 'toon@email.com',       uploadCount: 22, submittedAt: '2026-07-12T15:00:00Z', portfolio: 'https://example.com', status: 'approved', reason: '' },
  { id: 'cv4', name: 'UrbanDesigns',      avatar: 'https://i.pravatar.cc/40?img=11', email: 'urban@email.com',      uploadCount: 8,  submittedAt: '2026-07-15T11:00:00Z', portfolio: 'https://example.com', status: 'rejected', reason: 'Insufficient portfolio' },
];

const MOCK_DMCA: DmcaRequest[] = [
  { id: 'd1', assetId: 'q6', assetName: 'Tech Circuit Background', assetThumb: 'https://picsum.photos/seed/q6/120/90', claimant: 'CircuitArts Ltd.', email: 'legal@circuitarts.com', description: 'This asset uses copyrighted circuit pattern from our product catalog.', submittedAt: '2026-07-16T06:00:00Z', status: 'pending' },
  { id: 'd2', assetId: 'a12', assetName: 'Corporate Infographic Kit', assetThumb: 'https://picsum.photos/seed/d2/120/90', claimant: 'InfoGraphica Inc.', email: 'dmca@infographica.com', description: 'Multiple elements copied from our premium template library.', submittedAt: '2026-07-14T10:00:00Z', status: 'actioned' },
  { id: 'd3', assetId: 'a45', assetName: 'Tropical Icon Pack', assetThumb: 'https://picsum.photos/seed/d3/120/90', claimant: 'SunDesigns Corp.', email: 'ip@sundesigns.com', description: 'Palm tree illustration style is identical to our registered design.', submittedAt: '2026-07-13T16:00:00Z', status: 'dismissed' },
];

const MOCK_FEATURED: QueueAsset[] = MOCK_QUEUE.filter(q => q.status === 'approved').concat([
  { id: 'f1', name: 'Mountain Landscape Pack', thumb: 'https://picsum.photos/seed/f1/120/90', preview: 'https://picsum.photos/seed/f1/400/300', creator: 'NatureVectors', creatorAvatar: 'https://i.pravatar.cc/32?img=15', category: 'nature', style: 'flat', license: 'free', submittedAt: '2026-07-10T00:00:00Z', formats: ['svg'], status: 'approved', flags: [], note: '' },
  { id: 'f2', name: 'Minimal UI Kit',          thumb: 'https://picsum.photos/seed/f2/120/90', preview: 'https://picsum.photos/seed/f2/400/300', creator: 'UIDesigns',     creatorAvatar: 'https://i.pravatar.cc/32?img=17', category: 'ui-ux',  style: 'minimal', license: 'premium', submittedAt: '2026-07-08T00:00:00Z', formats: ['svg', 'ai'], status: 'approved', flags: [], note: '' },
]);

@Component({
  selector: 'app-vector-queue',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="adm-queue">

      <!-- Admin sub-nav -->
      <nav class="adm-subnav">
        <button class="adm-subnav__btn" [class.adm-subnav__btn--active]="tab() === 'queue'"        (click)="tab.set('queue')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Submission Queue
          <span class="adm-badge" *ngIf="pendingCount() > 0">{{ pendingCount() }}</span>
        </button>
        <button class="adm-subnav__btn" [class.adm-subnav__btn--active]="tab() === 'verification'" (click)="tab.set('verification')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Creator Verification
          <span class="adm-badge" *ngIf="pendingVerifications() > 0">{{ pendingVerifications() }}</span>
        </button>
        <button class="adm-subnav__btn" [class.adm-subnav__btn--active]="tab() === 'dmca'"         (click)="tab.set('dmca')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          DMCA Requests
          <span class="adm-badge adm-badge--red" *ngIf="pendingDmca() > 0">{{ pendingDmca() }}</span>
        </button>
        <button class="adm-subnav__btn" [class.adm-subnav__btn--active]="tab() === 'featured'"     (click)="tab.set('featured')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg>
          Featured Assets
        </button>
      </nav>

      <!-- ── Submission Queue ─────────────────────────────────────────────── -->
      <section *ngIf="tab() === 'queue'">
        <div class="adm-queue__toolbar">
          <h2 class="adm-queue__heading">Asset Submission Queue</h2>
          <div class="adm-queue__filters">
            <button *ngFor="let f of ['all','pending','approved','rejected','flagged']"
                    class="adm-filter-pill"
                    [class.adm-filter-pill--active]="queueFilter() === f"
                    (click)="queueFilter.set(f)">
              {{ f | titlecase }}
            </button>
          </div>
        </div>

        <div class="adm-queue__table-wrap">
          <table class="adm-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Creator</th>
                <th>Category</th>
                <th>License</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let asset of filteredQueue(); trackBy: trackById">
                <td class="adm-table__asset-cell">
                  <img [src]="asset.thumb" [alt]="asset.name" class="adm-table__thumb" />
                  <div>
                    <span class="adm-table__asset-name">{{ asset.name }}</span>
                    <span class="adm-table__asset-formats">{{ asset.formats.join(' · ').toUpperCase() }}</span>
                    <div *ngIf="asset.flags.length > 0" class="adm-table__flags">
                      <span *ngFor="let f of asset.flags" class="adm-flag-chip">⚑ {{ f }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="adm-table__creator">{{ asset.creator }}</span>
                </td>
                <td><span class="adm-table__text">{{ asset.category | titlecase }}</span></td>
                <td>
                  <span class="adm-license-badge" [class.adm-license-badge--premium]="asset.license === 'premium'">
                    {{ asset.license | titlecase }}
                  </span>
                </td>
                <td><span class="adm-table__date">{{ formatDate(asset.submittedAt) }}</span></td>
                <td>
                  <span class="adm-status-badge adm-status-badge--{{ asset.status }}">{{ asset.status | titlecase }}</span>
                </td>
                <td>
                  <div class="adm-table__actions" *ngIf="asset.status === 'pending' || asset.status === 'flagged'">
                    <button class="adm-action-btn adm-action-btn--approve" (click)="approveAsset(asset.id)" title="Approve">✓</button>
                    <button class="adm-action-btn adm-action-btn--reject"  (click)="rejectAsset(asset.id)"  title="Reject">✕</button>
                    <button class="adm-action-btn adm-action-btn--flag"    (click)="flagAsset(asset.id)"    title="Flag" *ngIf="asset.status !== 'flagged'">⚑</button>
                    <button class="adm-action-btn adm-action-btn--preview" (click)="previewingId.set(asset.id)" title="Preview">👁</button>
                  </div>
                  <div class="adm-table__actions" *ngIf="asset.status === 'approved' || asset.status === 'rejected'">
                    <button class="adm-action-btn adm-action-btn--preview" (click)="previewingId.set(asset.id)" title="Preview">👁</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="adm-queue__empty" *ngIf="filteredQueue().length === 0">
            No assets in this filter.
          </div>
        </div>

        <!-- Preview panel -->
        <div class="adm-preview-overlay" *ngIf="previewingAsset()" (click)="previewingId.set(null)">
          <div class="adm-preview-panel" (click)="$event.stopPropagation()">
            <div class="adm-preview-panel__header">
              <h3>{{ previewingAsset()!.name }}</h3>
              <button (click)="previewingId.set(null)">×</button>
            </div>
            <img [src]="previewingAsset()!.preview" [alt]="previewingAsset()!.name" class="adm-preview-panel__img" />
            <div class="adm-preview-panel__meta">
              <span>Creator: <strong>{{ previewingAsset()!.creator }}</strong></span>
              <span>Category: <strong>{{ previewingAsset()!.category | titlecase }}</strong></span>
              <span>Style: <strong>{{ previewingAsset()!.style | titlecase }}</strong></span>
              <span>Formats: <strong>{{ previewingAsset()!.formats.join(', ').toUpperCase() }}</strong></span>
            </div>
            <div class="adm-preview-panel__actions" *ngIf="previewingAsset()!.status === 'pending' || previewingAsset()!.status === 'flagged'">
              <textarea class="adm-reject-note" placeholder="Optional rejection note…" rows="2"
                        [value]="previewingAsset()!.note"
                        (input)="updateNote(previewingAsset()!.id, $any($event.target).value)"></textarea>
              <div class="adm-preview-panel__btn-row">
                <button class="adm-btn adm-btn--approve" (click)="approveAsset(previewingAsset()!.id); previewingId.set(null)">✓ Approve</button>
                <button class="adm-btn adm-btn--reject"  (click)="rejectAsset(previewingAsset()!.id);  previewingId.set(null)">✕ Reject</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Creator Verification ──────────────────────────────────────────── -->
      <section *ngIf="tab() === 'verification'">
        <div class="adm-queue__toolbar">
          <h2 class="adm-queue__heading">Creator Verification Queue</h2>
        </div>
        <div class="adm-verification-grid">
          <div *ngFor="let v of verifications(); trackBy: trackById" class="adm-verification-card">
            <img [src]="v.avatar" [alt]="v.name" class="adm-verification-card__avatar" />
            <div class="adm-verification-card__body">
              <h4 class="adm-verification-card__name">{{ v.name }}</h4>
              <p class="adm-verification-card__email">{{ v.email }}</p>
              <div class="adm-verification-card__stats">
                <span>{{ v.uploadCount }} uploads</span>
                <span>Submitted {{ formatDate(v.submittedAt) }}</span>
              </div>
              <a [href]="v.portfolio" target="_blank" class="adm-portfolio-link">View Portfolio →</a>
            </div>
            <div class="adm-verification-card__status">
              <span class="adm-status-badge adm-status-badge--{{ v.status }}">{{ v.status | titlecase }}</span>
              <div class="adm-table__actions" *ngIf="v.status === 'pending'">
                <button class="adm-action-btn adm-action-btn--approve" (click)="approveVerification(v.id)">✓ Approve</button>
                <button class="adm-action-btn adm-action-btn--reject"  (click)="rejectVerification(v.id)">✕ Reject</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── DMCA Requests ─────────────────────────────────────────────────── -->
      <section *ngIf="tab() === 'dmca'">
        <div class="adm-queue__toolbar">
          <h2 class="adm-queue__heading">DMCA / Copyright Requests</h2>
        </div>
        <div class="adm-dmca-list">
          <div *ngFor="let req of dmcaRequests(); trackBy: trackById" class="adm-dmca-card" [class.adm-dmca-card--actioned]="req.status === 'actioned'" [class.adm-dmca-card--dismissed]="req.status === 'dismissed'">
            <img [src]="req.assetThumb" [alt]="req.assetName" class="adm-dmca-card__thumb" />
            <div class="adm-dmca-card__body">
              <div class="adm-dmca-card__header">
                <h4>{{ req.assetName }}</h4>
                <span class="adm-status-badge adm-status-badge--{{ req.status }}">{{ req.status | titlecase }}</span>
              </div>
              <p class="adm-dmca-card__claimant"><strong>Claimant:</strong> {{ req.claimant }} ({{ req.email }})</p>
              <p class="adm-dmca-card__desc">{{ req.description }}</p>
              <span class="adm-dmca-card__date">Submitted {{ formatDate(req.submittedAt) }}</span>
            </div>
            <div class="adm-dmca-card__actions" *ngIf="req.status === 'pending'">
              <button class="adm-btn adm-btn--approve" (click)="actionDmca(req.id)">Take Action (Remove)</button>
              <button class="adm-btn adm-btn--ghost"   (click)="dismissDmca(req.id)">Dismiss</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Featured Assets ─────────────────────────────────────────────── -->
      <section *ngIf="tab() === 'featured'">
        <div class="adm-queue__toolbar">
          <h2 class="adm-queue__heading">Manage Featured Assets</h2>
          <p class="adm-queue__sub">Select approved assets to feature on the homepage. Featured assets appear in "Staff Picks" and "Editor's Choice" sections.</p>
        </div>
        <div class="adm-featured-grid">
          <div *ngFor="let a of featuredAssets(); trackBy: trackById"
               class="adm-featured-card"
               [class.adm-featured-card--selected]="isFeatured(a.id)"
               (click)="toggleFeatured(a.id)">
            <div class="adm-featured-card__check">
              <svg *ngIf="isFeatured(a.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <img [src]="a.thumb" [alt]="a.name" class="adm-featured-card__thumb" />
            <div class="adm-featured-card__body">
              <p class="adm-featured-card__name">{{ a.name }}</p>
              <span class="adm-featured-card__creator">by {{ a.creator }}</span>
            </div>
          </div>
        </div>
        <div class="adm-featured-footer">
          <span>{{ featuredIds().length }} assets featured</span>
          <button class="adm-btn adm-btn--approve" (click)="saveFeatured()">Save Featured Selection</button>
        </div>
      </section>

    </div>
  `,
  styles: [`
    .adm-queue { padding: 24px; max-width: 1200px; }

    .adm-subnav {
      display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 24px;
      background: var(--amx-bg, #f9f9f9); padding: 6px; border-radius: 12px;
      border: 1px solid var(--amx-border, #e5e7eb);
    }

    .adm-subnav__btn {
      display: flex; align-items: center; gap: 8px; padding: 8px 16px;
      background: none; border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
      color: var(--amx-text-muted, #6b7280); cursor: pointer; transition: background .15s, color .15s;
      &:hover { background: var(--amx-surface, white); color: var(--amx-text, #111); }
      &--active { background: var(--amx-surface, white); color: #f5820a; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
    }

    .adm-badge {
      background: #f5820a; color: white; border-radius: 10px; padding: 1px 7px;
      font-size: 11px; font-weight: 700;
      &--red { background: #ef4444; }
    }

    .adm-queue__toolbar {
      display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
    }

    .adm-queue__heading { margin: 0; font-size: 18px; font-weight: 800; flex: 1; }

    .adm-queue__sub { margin: 4px 0 0; font-size: 13px; color: var(--amx-text-muted, #6b7280); }

    .adm-queue__filters { display: flex; gap: 6px; flex-wrap: wrap; }

    .adm-filter-pill {
      padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
      background: var(--amx-bg, #f9f9f9); border: 1px solid var(--amx-border, #e5e7eb);
      color: var(--amx-text-muted, #6b7280); cursor: pointer; transition: all .15s;
      &--active { background: #f5820a; border-color: #f5820a; color: white; }
      &:hover:not(&--active) { border-color: #f5820a; color: #f5820a; }
    }

    .adm-queue__table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid var(--amx-border, #e5e7eb); }

    .adm-table {
      width: 100%; border-collapse: collapse; background: var(--amx-surface, white);
      th {
        text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;
        letter-spacing: .5px; color: var(--amx-text-muted, #6b7280);
        background: var(--amx-bg, #f9f9f9); border-bottom: 1px solid var(--amx-border, #e5e7eb);
      }
      td { padding: 12px 16px; border-bottom: 1px solid var(--amx-border, #e5e7eb); vertical-align: middle; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: rgba(245,130,10,.03); }
    }

    .adm-table__asset-cell { display: flex; align-items: center; gap: 12px; min-width: 220px; }

    .adm-table__thumb { width: 56px; height: 42px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }

    .adm-table__asset-name { display: block; font-size: 13px; font-weight: 600; color: var(--amx-text, #111); }

    .adm-table__asset-formats { display: block; font-size: 11px; color: var(--amx-text-muted, #6b7280); }

    .adm-table__flags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }

    .adm-flag-chip {
      background: rgba(239,68,68,.1); color: #ef4444; border-radius: 4px; padding: 1px 6px;
      font-size: 10px; font-weight: 700;
    }

    .adm-table__creator { font-size: 13px; font-weight: 500; color: var(--amx-text, #111); white-space: nowrap; }

    .adm-table__text { font-size: 13px; color: var(--amx-text-muted, #6b7280); }

    .adm-table__date { font-size: 12px; color: var(--amx-text-muted, #6b7280); white-space: nowrap; }

    .adm-license-badge {
      display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;
      background: rgba(16,185,129,.1); color: #10b981;
      &--premium { background: rgba(139,92,246,.1); color: #8b5cf6; }
    }

    .adm-status-badge {
      display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700;
      &--pending  { background: rgba(245,158,11,.1); color: #d97706; }
      &--approved { background: rgba(16,185,129,.1); color: #10b981; }
      &--rejected { background: rgba(239,68,68,.1);  color: #ef4444; }
      &--flagged  { background: rgba(239,68,68,.15); color: #dc2626; border: 1px solid rgba(239,68,68,.3); }
      &--actioned { background: rgba(16,185,129,.1); color: #10b981; }
      &--dismissed { background: rgba(156,163,175,.1); color: #9ca3af; }
    }

    .adm-table__actions { display: flex; gap: 4px; }

    .adm-action-btn {
      width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--amx-border, #e5e7eb);
      background: var(--amx-bg, #f9f9f9); cursor: pointer; font-size: 13px;
      display: flex; align-items: center; justify-content: center; transition: all .15s;
      &--approve { &:hover { background: rgba(16,185,129,.1); border-color: #10b981; } }
      &--reject  { &:hover { background: rgba(239,68,68,.1);  border-color: #ef4444; } }
      &--flag    { &:hover { background: rgba(245,130,10,.1);  border-color: #f5820a; } }
      &--preview { &:hover { background: rgba(59,130,246,.1);  border-color: #3b82f6; } }
    }

    .adm-action-btn--approve.adm-btn { width: auto; padding: 6px 12px; }
    .adm-action-btn--reject.adm-btn  { width: auto; padding: 6px 12px; }

    .adm-queue__empty { padding: 40px; text-align: center; color: var(--amx-text-muted, #6b7280); font-size: 14px; }

    /* Preview overlay */
    .adm-preview-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
    }

    .adm-preview-panel {
      background: var(--amx-surface, white); border-radius: 16px; width: min(90vw, 560px);
      overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,.3);
    }

    .adm-preview-panel__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid var(--amx-border, #e5e7eb);
      h3 { margin: 0; font-size: 15px; }
      button { background: none; border: none; font-size: 22px; cursor: pointer; color: var(--amx-text-muted, #6b7280); }
    }

    .adm-preview-panel__img { width: 100%; aspect-ratio: 4/3; object-fit: cover; }

    .adm-preview-panel__meta {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; padding: 16px 20px;
      span { font-size: 13px; color: var(--amx-text-muted, #6b7280); }
      strong { color: var(--amx-text, #111); }
    }

    .adm-preview-panel__actions { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 10px; }

    .adm-reject-note {
      width: 100%; background: var(--amx-bg, #f9f9f9); border: 1px solid var(--amx-border, #e5e7eb);
      border-radius: 8px; padding: 8px 12px; font-size: 13px; resize: vertical; box-sizing: border-box; outline: none;
    }

    .adm-preview-panel__btn-row { display: flex; gap: 8px; }

    .adm-btn {
      padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; border: none;
      &--approve { background: #10b981; color: white; &:hover { opacity: .9; } }
      &--reject  { background: #ef4444; color: white; &:hover { opacity: .9; } }
      &--ghost   { background: var(--amx-bg, #f9f9f9); border: 1px solid var(--amx-border, #e5e7eb); color: var(--amx-text, #111); &:hover { border-color: #f5820a; } }
    }

    /* Verification */
    .adm-verification-grid { display: flex; flex-direction: column; gap: 12px; }

    .adm-verification-card {
      display: flex; align-items: center; gap: 16px; padding: 16px 20px;
      background: var(--amx-surface, white); border: 1px solid var(--amx-border, #e5e7eb);
      border-radius: 12px; flex-wrap: wrap;
    }

    .adm-verification-card__avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

    .adm-verification-card__body { flex: 1; min-width: 200px; }

    .adm-verification-card__name { margin: 0 0 2px; font-size: 15px; font-weight: 700; }

    .adm-verification-card__email { margin: 0 0 6px; font-size: 12px; color: var(--amx-text-muted, #6b7280); }

    .adm-verification-card__stats { display: flex; gap: 12px; font-size: 12px; color: var(--amx-text-muted, #6b7280); margin-bottom: 6px; }

    .adm-portfolio-link { font-size: 12px; color: #3b82f6; text-decoration: none; &:hover { text-decoration: underline; } }

    .adm-verification-card__status { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }

    /* DMCA */
    .adm-dmca-list { display: flex; flex-direction: column; gap: 12px; }

    .adm-dmca-card {
      display: flex; gap: 16px; align-items: flex-start; padding: 16px 20px;
      background: var(--amx-surface, white); border: 1px solid var(--amx-border, #e5e7eb); border-radius: 12px;
      border-left: 4px solid #ef4444;
      &--actioned { border-left-color: #10b981; opacity: .7; }
      &--dismissed { border-left-color: #9ca3af; opacity: .5; }
    }

    .adm-dmca-card__thumb { width: 80px; height: 60px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }

    .adm-dmca-card__body { flex: 1; }

    .adm-dmca-card__header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; h4 { margin: 0; } }

    .adm-dmca-card__claimant, .adm-dmca-card__desc { margin: 0 0 6px; font-size: 13px; }

    .adm-dmca-card__date { font-size: 11px; color: var(--amx-text-muted, #6b7280); }

    .adm-dmca-card__actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }

    /* Featured */
    .adm-featured-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

    .adm-featured-card {
      border: 2px solid var(--amx-border, #e5e7eb); border-radius: 10px; overflow: hidden; cursor: pointer;
      transition: border-color .15s; position: relative;
      &--selected { border-color: #f5820a; }
      &:hover:not(&--selected) { border-color: #d1d5db; }
    }

    .adm-featured-card__check {
      position: absolute; top: 8px; right: 8px; width: 20px; height: 20px; border-radius: 50%;
      background: #f5820a; display: flex; align-items: center; justify-content: center; opacity: 0;
      .adm-featured-card--selected & { opacity: 1; }
    }

    .adm-featured-card__thumb { width: 100%; aspect-ratio: 4/3; object-fit: cover; }

    .adm-featured-card__body { padding: 8px; }

    .adm-featured-card__name { margin: 0 0 2px; font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .adm-featured-card__creator { font-size: 11px; color: var(--amx-text-muted, #6b7280); }

    .adm-featured-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--amx-border, #e5e7eb); }
  `],
})
export class VectorQueueComponent {

  readonly tab          = signal<'queue' | 'verification' | 'dmca' | 'featured'>('queue');
  readonly queueFilter  = signal('all');
  readonly queue        = signal<QueueAsset[]>(MOCK_QUEUE);
  readonly verifications = signal<CreatorVerification[]>(MOCK_VERIFICATIONS);
  readonly dmcaRequests = signal<DmcaRequest[]>(MOCK_DMCA);
  readonly featuredAssets = signal<QueueAsset[]>(MOCK_FEATURED);
  readonly featuredIds  = signal<string[]>(['f1']);
  readonly previewingId = signal<string | null>(null);

  readonly pendingCount = computed(() => this.queue().filter(q => q.status === 'pending').length);
  readonly pendingVerifications = computed(() => this.verifications().filter(v => v.status === 'pending').length);
  readonly pendingDmca = computed(() => this.dmcaRequests().filter(d => d.status === 'pending').length);

  readonly filteredQueue = computed(() => {
    const f = this.queueFilter();
    if (f === 'all') return this.queue();
    return this.queue().filter(q => q.status === f);
  });

  readonly previewingAsset = computed(() => this.queue().find(q => q.id === this.previewingId()) ?? null);

  approveAsset(id: string): void {
    this.queue.update(q => q.map(a => a.id === id ? { ...a, status: 'approved' as QueueStatus } : a));
  }

  rejectAsset(id: string): void {
    this.queue.update(q => q.map(a => a.id === id ? { ...a, status: 'rejected' as QueueStatus } : a));
  }

  flagAsset(id: string): void {
    this.queue.update(q => q.map(a => a.id === id ? { ...a, status: 'flagged' as QueueStatus } : a));
  }

  updateNote(id: string, note: string): void {
    this.queue.update(q => q.map(a => a.id === id ? { ...a, note } : a));
  }

  approveVerification(id: string): void {
    this.verifications.update(v => v.map(x => x.id === id ? { ...x, status: 'approved' as const } : x));
  }

  rejectVerification(id: string): void {
    this.verifications.update(v => v.map(x => x.id === id ? { ...x, status: 'rejected' as const } : x));
  }

  actionDmca(id: string): void {
    this.dmcaRequests.update(d => d.map(x => x.id === id ? { ...x, status: 'actioned' as const } : x));
  }

  dismissDmca(id: string): void {
    this.dmcaRequests.update(d => d.map(x => x.id === id ? { ...x, status: 'dismissed' as const } : x));
  }

  isFeatured(id: string): boolean { return this.featuredIds().includes(id); }

  toggleFeatured(id: string): void {
    this.featuredIds.update(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  }

  saveFeatured(): void {
    // In prod this would call an API
    alert(`Featured assets saved: ${this.featuredIds().join(', ')}`);
  }

  formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return iso; }
  }

  trackById(_: number, item: { id: string }): string { return item.id; }
}
