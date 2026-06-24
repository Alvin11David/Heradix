import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EditorService } from '../editor.service';
import { EditorProject, ExportFormat } from '../../../core/models/editor.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'amx-canvas-editor',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="editor-shell">
      <!-- Toolbar -->
      <aside class="editor-toolbar">
        <div class="toolbar-section">
          <button class="tool-btn" title="Select">&#9654;</button>
          <button class="tool-btn" title="Text">T</button>
          <button class="tool-btn" title="Rectangle">&#9645;</button>
          <button class="tool-btn" title="Image">&#128247;</button>
        </div>
        <div class="toolbar-section toolbar-section--bottom">
          <button class="tool-btn tool-btn--export" (click)="showExportPanel.set(!showExportPanel())">
            Export
          </button>
          <button class="tool-btn tool-btn--save" (click)="save()">Save</button>
        </div>
      </aside>

      <!-- Canvas area -->
      <main class="editor-canvas-area">
        <amx-spinner *ngIf="loading()" />
        <div id="canvas-container" class="canvas-container" *ngIf="!loading()">
          <!-- Fabric.js canvas will be mounted here by the component lifecycle -->
          <canvas id="amx-fabric-canvas"></canvas>
        </div>
      </main>

      <!-- Layers / Properties panel -->
      <aside class="editor-properties">
        <h3 class="panel-title">Layers</h3>
        <p class="panel-hint">Select an object on the canvas to see its properties.</p>

        <!-- Export panel (slide-in) -->
        <div class="export-panel" *ngIf="showExportPanel()">
          <h4>Export Design</h4>
          <div class="export-formats">
            <button *ngFor="let fmt of exportFormats" class="fmt-btn" (click)="exportAs(fmt)">
              {{ fmt }}
            </button>
          </div>
        </div>
      </aside>
    </div>
  `,
  styleUrl: './canvas-editor.component.scss',
})
export class CanvasEditorComponent implements OnInit, OnDestroy {
  private readonly route  = inject(ActivatedRoute);
  private readonly svc    = inject(EditorService);

  project  = signal<EditorProject | null>(null);
  loading  = signal(true);
  showExportPanel = signal(false);
  exportFormats: ExportFormat[] = ['PNG', 'PDF', 'SVG'];

  private autoSaveInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const projectId = this.route.snapshot.queryParamMap.get('projectId');
    const assetId   = this.route.snapshot.queryParamMap.get('assetId');

    if (projectId) {
      this.svc.getProject(projectId).subscribe({
        next: (p) => { this.project.set(p); this.loading.set(false); this.initCanvas(p.canvasJson); },
        error: () => this.loading.set(false),
      });
    } else {
      this.svc.createProject({ assetId: assetId ?? undefined }).subscribe({
        next: (p) => { this.project.set(p); this.loading.set(false); this.initCanvas(p.canvasJson); },
        error: () => this.loading.set(false),
      });
    }

    // Auto-save every 30 seconds
    this.autoSaveInterval = setInterval(() => this.save(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
  }

  save(): void {
    const p = this.project();
    if (!p) return;
    // TODO: serialise Fabric.js canvas JSON and call saveProject
    this.svc.saveProject(p.id, p.canvasJson).subscribe();
  }

  exportAs(format: ExportFormat): void {
    const p = this.project();
    if (!p) return;
    this.svc.exportProject(p.id, { format }).subscribe({
      next: (job) => alert(`Export started — Job ID: ${job.jobId}`),
    });
  }

  private initCanvas(_json: string): void {
    // Fabric.js initialisation will go here once the library is installed
    console.log('Canvas ready — Fabric.js init pending npm install');
  }
}
