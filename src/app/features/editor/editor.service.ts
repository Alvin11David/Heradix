import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, interval } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/api/api.service';
import { EditorProject, CreateProjectPayload, ExportProjectPayload, ExportJob } from '../../core/models/editor.model';

export type ToolMode = 'select' | 'text' | 'shape' | 'image' | 'upload' | 'templates' | 'ai';
export type SaveState = 'saved' | 'saving' | 'failed';

export interface EditorLayer {
  id: string;
  name: string;
  type: 'text' | 'rect' | 'circle' | 'polygon' | 'star' | 'triangle' | 'image' | 'line' | 'path';
  visible: boolean;
  locked: boolean;
  selected: boolean;
  index: number;
}

export interface ExportJobState {
  status: 'idle' | 'queued' | 'rendering' | 'ready' | 'failed';
  jobId?: string;
  downloadUrl?: string;
  error?: string;
}

export interface AiJobState {
  status: 'idle' | 'processing' | 'ready' | 'failed';
  jobId?: string;
  error?: string;
  previewUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class EditorService {
  private readonly api = inject(ApiService);

  readonly project = signal<EditorProject | null>(null);
  readonly projectId = computed(() => this.project()?.id ?? null);
  readonly toolMode = signal<ToolMode>('select');
  readonly zoom = signal(1);
  readonly panX = signal(0);
  readonly panY = signal(0);
  readonly saveState = signal<SaveState>('saved');
  readonly dirty = signal(false);
  readonly gridVisible = signal(false);
  readonly snapEnabled = signal(true);

  readonly layers = signal<EditorLayer[]>([]);
  readonly selectedLayerIds = signal<Set<string>>(new Set());
  readonly selectedLayerType = computed(() => {
    const ids = this.selectedLayerIds();
    if (ids.size !== 1) return null;
    const layer = this.layers().find(l => l.id === [...ids][0]);
    return layer?.type ?? null;
  });

  readonly colorPalette = signal<string[]>([
    '#1a1a2e', '#16213e', '#0f3460', '#e94560',
    '#f5820a', '#ffffff', '#f5f5f5', '#e0e0e0',
    '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6',
  ]);

  readonly exportState = signal<ExportJobState>({ status: 'idle' });
  readonly aiJobState = signal<AiJobState>({ status: 'idle' });

  private _undoStack: string[] = [];
  private _redoStack: string[] = [];
  private _canvasGetJson: (() => string) | null = null;
  private _canvasLoadJson: ((json: string) => void) | null = null;

  private _autoSaveSub: any = null;

  registerCanvasApi(getJson: () => string, loadJson: (json: string) => void): void {
    this._canvasGetJson = getJson;
    this._canvasLoadJson = loadJson;
  }

  setDirty(): void {
    this.dirty.set(true);
    if (this.saveState() === 'saved') {
      this.saveState.set('saving');
    }
  }

  get canvasJson(): string {
    return this._canvasGetJson?.() ?? '{}';
  }

  loadFromCanvasJson(json: string): void {
    this._canvasLoadJson?.(json);
  }

  pushUndoState(): void {
    const json = this.canvasJson;
    this._undoStack.push(json);
    if (this._undoStack.length > 50) this._undoStack.shift();
    this._redoStack = [];
  }

  undo(): void {
    if (!this._undoStack.length) return;
    const current = this.canvasJson;
    const prev = this._undoStack.pop()!;
    this._redoStack.push(current);
    this.loadFromCanvasJson(prev);
    this.setDirty();
  }

  redo(): void {
    if (!this._redoStack.length) return;
    const current = this.canvasJson;
    const next = this._redoStack.pop()!;
    this._undoStack.push(current);
    this.loadFromCanvasJson(next);
    this.setDirty();
  }

  canUndo = computed(() => this._undoStack.length > 0);
  canRedo = computed(() => this._redoStack.length > 0);

  initProject(assetId?: string): Observable<EditorProject> {
    if (assetId) {
      const mock: EditorProject = {
        id: `proj-${Date.now()}`,
        userId: 'mock-user-001',
        title: 'New Project',
        assetId,
        canvasJson: '{}',
        width: 800,
        height: 600,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.project.set(mock);
      this.dirty.set(false);
      this.saveState.set('saved');
      return of(mock);
    }
    return this.api.post<EditorProject>('/editor/projects', {}).pipe(
      catchError(() => {
        const mock = this.createMockProject();
        this.project.set(mock);
        this.dirty.set(false);
        this.saveState.set('saved');
        return of(mock);
      })
    );
  }

  private createMockProject(): EditorProject {
    return {
      id: `proj-${Date.now()}`,
      userId: 'mock-user-001',
      title: 'Untitled Design',
      canvasJson: '{}',
      width: 800,
      height: 600,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  startAutosave(): void {
    this._autoSaveSub = interval(30000).subscribe(() => {
      if (this.dirty() && this.project()) {
        this.saveProject().subscribe({
          error: () => this.saveState.set('failed'),
        });
      }
    });
  }

  stopAutosave(): void {
    this._autoSaveSub?.unsubscribe();
    this._autoSaveSub = null;
  }

  saveProject(): Observable<EditorProject> {
    const p = this.project();
    if (!p) return of(p as any);
    this.saveState.set('saving');
    this.dirty.set(false);
    const json = this.canvasJson;
    return this.api.patch<EditorProject>(`/editor/projects/${p.id}`, { canvasJson: json }).pipe(
      catchError(() => {
        this.saveState.set('failed');
        return of({ ...p, canvasJson: json });
      })
    );
  }

  exportProject(format: string, options?: { quality?: number; transparent?: boolean }): void {
    const p = this.project();
    if (!p) return;
    this.exportState.set({ status: 'queued' });
    this.api.post<ExportJob>(`/editor/projects/${p.id}/export`, { format, ...options }).pipe(
      catchError(() => {
        const mockJob: ExportJob = {
          jobId: `job-${Date.now()}`,
          status: 'DONE',
          downloadUrl: '#',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        };
        return of(mockJob);
      })
    ).subscribe({
      next: (job) => {
        this.exportState.set({ status: 'rendering', jobId: job.jobId });
        this.pollExportJob(job.jobId);
      },
      error: () => this.exportState.set({ status: 'failed', error: 'Failed to start export' }),
    });
  }

  private pollExportJob(jobId: string): void {
    const p = this.project();
    if (!p) return;
    this.api.get<ExportJob>(`/editor/projects/${p.id}/export/${jobId}`).pipe(
      catchError(() => {
        const ready: ExportJob = { jobId, status: 'DONE', downloadUrl: '#', expiresAt: '' };
        return of(ready);
      })
    ).subscribe({
      next: (job) => {
        if (job.status === 'DONE' || job.status === 'PROCESSING' || job.status === 'QUEUED') {
          if (job.status === 'DONE') {
            this.exportState.set({ status: 'ready', jobId: job.jobId, downloadUrl: job.downloadUrl });
          } else {
            this.exportState.set({ status: 'rendering', jobId: job.jobId });
            setTimeout(() => this.pollExportJob(jobId), 2000);
          }
        } else {
          this.exportState.set({ status: 'failed', error: 'Export failed' });
        }
      },
      error: () => this.exportState.set({ status: 'failed', error: 'Export failed' }),
    });
  }

  resetExportState(): void {
    this.exportState.set({ status: 'idle' });
  }

  removeBg(): void {
    const layer = this.selectedLayerIds();
    if (layer.size !== 1) return;
    this.aiJobState.set({ status: 'processing' });
    const jobId = `ai-${Date.now()}`;
    setTimeout(() => {
      this.aiJobState.set({ status: 'ready', jobId, previewUrl: undefined });
    }, 2500);
  }

  applyAiResult(): void {
    this.aiJobState.set({ status: 'idle' });
  }

  discardAiResult(): void {
    this.aiJobState.set({ status: 'idle' });
  }

  syncLayers(canvasObjects: any[]): void {
    const currentIds = new Set(this.selectedLayerIds());
    const layers: EditorLayer[] = canvasObjects.map((obj: any, index: number) => {
      const id = obj._id ?? obj.id ?? `layer-${index}`;
      obj._id = id;
      let type = obj.type as string;
      if (type === 'i-text') type = 'text';
      else if (type === 'path' && obj._shapeType) type = obj._shapeType;
      else if (type === 'rect' || type === 'circle' || type === 'polygon' || type === 'star' || type === 'triangle' || type === 'line') type = type;
      else if (type === 'image') type = type;
      return {
        id,
        name: obj.name ?? `${type}-${index + 1}`,
        type: type as any,
        visible: obj.visible ?? true,
        locked: obj.lockMovementX ?? false,
        selected: currentIds.has(id),
        index,
      };
    }).reverse();
    this.layers.set(layers);
  }

  downloadUrl(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
}
