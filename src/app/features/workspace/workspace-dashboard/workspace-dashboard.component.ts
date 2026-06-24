import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WorkspaceService } from '../workspace.service';
import { Workspace } from '../../../core/models/workspace.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'amx-workspace-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="workspace-page">
      <div class="workspace-page__header">
        <h1>My Workspaces</h1>
        <button class="btn btn--primary" (click)="showCreate.set(true)">+ New Workspace</button>
      </div>

      <amx-spinner *ngIf="loading()" />

      <div class="workspace-grid" *ngIf="!loading()">
        <a
          *ngFor="let ws of workspaces()"
          [routerLink]="['/workspace', ws.id]"
          class="ws-card">
          <div class="ws-card__logo" *ngIf="ws.logoUrl">
            <img [src]="ws.logoUrl" [alt]="ws.name" />
          </div>
          <div class="ws-card__initials" *ngIf="!ws.logoUrl">
            {{ ws.name.charAt(0).toUpperCase() }}
          </div>
          <div class="ws-card__body">
            <h3>{{ ws.name }}</h3>
          </div>
        </a>
      </div>
    </div>
  `,
  styleUrl: './workspace-dashboard.component.scss',
})
export class WorkspaceDashboardComponent implements OnInit {
  private readonly svc = inject(WorkspaceService);

  workspaces = signal<Workspace[]>([]);
  loading    = signal(true);
  showCreate = signal(false);

  ngOnInit(): void {
    this.svc.getWorkspaces().subscribe({
      next: (ws) => { this.workspaces.set(ws); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
