import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, interval } from 'rxjs';
import { EditorProject } from '../../core/models/editor.model';

export type ToolMode = 'select' | 'text' | 'shape' | 'image' | 'upload' | 'templates' | 'ai' | 'draw';
export type SaveState = 'saved' | 'saving' | 'failed';

export interface EditorLayer {
  id: string;
  name: string;
  type: 'text' | 'rect' | 'circle' | 'polygon' | 'star' | 'triangle' | 'image' | 'line' | 'path';
  visible: boolean;
  locked: boolean;
  opacity: number;
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
    const layer = this.layers().find((l) => l.id === [...ids][0]);
    return layer?.type ?? null;
  });

  readonly colorPalette = signal<string[]>([
    '#1a1a2e',
    '#16213e',
    '#0f3460',
    '#e94560',
    '#f5820a',
    '#ffffff',
    '#f5f5f5',
    '#e0e0e0',
    '#3b82f6',
    '#22c55e',
    '#ef4444',
    '#8b5cf6',
  ]);

  readonly exportState = signal<ExportJobState>({ status: 'idle' });
  readonly aiJobState = signal<AiJobState>({ status: 'idle' });

  private _undoStack: string[] = [];
  private _redoStack: string[] = [];
  private _canvasGetJson: (() => string) | null = null;
  private _canvasLoadJson: ((json: string) => void) | null = null;

  private _autoSaveSub: any = null;
  private readonly STORAGE_PREFIX = 'amx-editor-project-';

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


  private storageKey(id: string): string {
    return `${this.STORAGE_PREFIX}${id}`;
  }

  private loadFromStorage(id: string): EditorProject | null {
    try {
      const raw = localStorage.getItem(this.storageKey(id));
      return raw ? (JSON.parse(raw) as EditorProject) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(project: EditorProject): void {
    try {
      localStorage.setItem(this.storageKey(project.id), JSON.stringify(project));
    } catch {

    }
  }

  initProject(assetId?: string): Observable<EditorProject> {
    const id = assetId ? `asset-${assetId}` : 'draft';
    const existing = this.loadFromStorage(id);
    if (existing) {
      this.project.set(existing);
      this.dirty.set(false);
      this.saveState.set('saved');
      return of(existing);
    }

    const project: EditorProject = {
      id,
      userId: 'local-user',
      title: assetId ? 'New Project' : 'Untitled Design',
      assetId,
      canvasJson: '{}',
      width: 800,
      height: 600,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.project.set(project);
    this.dirty.set(false);
    this.saveState.set('saved');
    return of(project);
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
    const updated: EditorProject = {
      ...p,
      canvasJson: this.canvasJson,
      updatedAt: new Date().toISOString(),
    };
    this.saveToStorage(updated);
    this.project.set(updated);
    this.dirty.set(false);
    this.saveState.set('saved');
    return of(updated);
  }

  resetExportState(): void {
    this.exportState.set({ status: 'idle' });
  }

  syncLayers(canvasObjects: any[]): void {
    const currentIds = new Set(this.selectedLayerIds());
    const layers: EditorLayer[] = canvasObjects
      .map((obj: any, index: number) => {
        const id = obj._id ?? obj.id ?? `layer-${index}`;
        obj._id = id;
        let type = obj.type as string;
        if (type === 'i-text') type = 'text';
        else if (type === 'path' && obj._shapeType) type = obj._shapeType;
        else if (
          type === 'rect' ||
          type === 'circle' ||
          type === 'polygon' ||
          type === 'star' ||
          type === 'triangle' ||
          type === 'line'
        )
          type = type;
        else if (type === 'image') type = type;
        return {
          id,
          name: obj.name ?? `${type}-${index + 1}`,
          type: type as any,
          visible: obj.visible ?? true,
          locked: obj.lockMovementX ?? false,
          opacity: obj.opacity ?? 1,
          selected: currentIds.has(id),
          index,
        };
      })
      .reverse();
    this.layers.set(layers);
  }

  downloadUrl(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
}
