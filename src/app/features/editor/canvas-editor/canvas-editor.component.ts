import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, AfterViewInit, OnDestroy,
  ElementRef, HostListener, ViewChild, effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorService, ToolMode, EditorLayer, SaveState } from '../editor.service';
import { EditorProject } from '../../../core/models/editor.model';

@Component({
  selector: 'amx-canvas-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './canvas-editor.component.html',
  styleUrl: './canvas-editor.component.scss',
})
export class CanvasEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly ed = inject(EditorService);

  @ViewChild('canvasEl') canvasElRef!: ElementRef<HTMLCanvasElement>;

  readonly loading = signal(true);
  readonly showExport = signal(false);
  readonly showAiResult = signal(false);
  readonly showTemplatePicker = signal(false);
  readonly showUploadDialog = signal(false);
  readonly showFontPicker = signal(false);

  readonly toolMode = this.ed.toolMode;
  readonly zoom = this.ed.zoom;
  readonly saveState = this.ed.saveState;
  readonly dirty = this.ed.dirty;
  readonly layers = this.ed.layers;
  readonly selectedLayerIds = this.ed.selectedLayerIds;
  readonly selectedLayerType = this.ed.selectedLayerType;
  readonly canUndo = this.ed.canUndo;
  readonly canRedo = this.ed.canRedo;
  readonly exportState = this.ed.exportState;
  readonly aiJobState = this.ed.aiJobState;
  readonly colorPalette = this.ed.colorPalette;
  readonly gridVisible = this.ed.gridVisible;
  readonly snapEnabled = this.ed.snapEnabled;

  readonly projectTitle = computed(() => this.ed.project()?.title ?? 'Untitled');

  fontFamilies = ['Inter', 'Lato', 'Roboto', 'Poppins', 'Playfair Display', 'Courier New', 'Georgia', 'Arial'];
  shapeTypes = ['rect', 'circle', 'triangle', 'line'] as const;

  readonly fontWeights = [
    { value: 100, label: 'Thin' },
    { value: 200, label: 'Extra Light' },
    { value: 300, label: 'Light' },
    { value: 400, label: 'Normal' },
    { value: 500, label: 'Medium' },
    { value: 600, label: 'Semi Bold' },
    { value: 700, label: 'Bold' },
    { value: 800, label: 'Extra Bold' },
    { value: 900, label: 'Black' },
  ];

  readonly fontSizePresets = [8, 10, 12, 14, 18, 24, 32, 36, 48, 64, 72];

  private canvas: any = null;
  private fabric: any = null;
  private readonly FILE_SIZE_LIMIT = 10 * 1024 * 1024;
  private readonly ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  private _selectedObject: any = null;
  private _exportFormat: 'PNG' | 'PDF' | 'SVG' = 'PNG';
  private _textSelHandler: (() => void) | null = null;
  private _hasTextSelection = false;

  private _selectionProps = signal<Record<string, any>>({});
  readonly selectionProps = this._selectionProps.asReadonly();

  readonly selectedFill = computed(() => this._selectionProps()['fill'] ?? '');
  readonly selectedStroke = computed(() => this._selectionProps()['stroke'] ?? '');
  readonly selectedStrokeWidth = computed(() => this._selectionProps()['strokeWidth'] ?? 0);
  readonly selectedFontFamily = computed(() => this._selectionProps()['fontFamily'] ?? '');
  readonly selectedFontSize = computed(() => this._selectionProps()['fontSize'] ?? 24);
  readonly selectedFontWeight = computed(() => this._selectionProps()['fontWeight'] ?? 400);
  readonly selectedFontStyle = computed(() => this._selectionProps()['fontStyle'] ?? 'normal');
  readonly selectedOpacity = computed(() => this._selectionProps()['opacity'] ?? 1);
  readonly selectedTextAlign = computed(() => this._selectionProps()['textAlign'] ?? 'left');
  readonly selectedText = computed(() => this._selectionProps()['text'] ?? '');
  readonly selectedLineHeight = computed(() => this._selectionProps()['lineHeight'] ?? 1.2);
  readonly selectedCharSpacing = computed(() => this._selectionProps()['charSpacing'] ?? 0);
  readonly selectedUnderline = computed(() => !!this._selectionProps()['underline']);
  readonly selectedStrikethrough = computed(() => !!this._selectionProps()['strikethrough']);
  readonly selectedTextBackgroundColor = computed(() => this._selectionProps()['textBackgroundColor'] ?? '');
  readonly selectedDirection = computed(() => this._selectionProps()['direction'] ?? 'ltr');
  readonly selectedParagraphSpacing = computed(() => this._selectionProps()['paragraphSpacing'] ?? 0);
  readonly hasShadow = computed(() => {
    const s = this._selectionProps()['shadow'];
    return !!s && typeof s === 'object';
  });
  readonly shadowColor = computed(() => {
    const s = this._selectionProps()['shadow'];
    return s?.color ?? 'rgba(0,0,0,0.3)';
  });
  readonly shadowBlur = computed(() => {
    const s = this._selectionProps()['shadow'];
    return s?.blur ?? 0;
  });
  readonly shadowOffsetX = computed(() => {
    const s = this._selectionProps()['shadow'];
    return s?.offsetX ?? 0;
  });
  readonly shadowOffsetY = computed(() => {
    const s = this._selectionProps()['shadow'];
    return s?.offsetY ?? 0;
  });

  private _aiStatusEffect: any;

  constructor() {
    this._aiStatusEffect = effect(() => {
      if (this.ed.aiJobState().status === 'ready') {
        this.showAiResult.set(true);
      }
    });
  }

  trackLayer(_: number, layer: EditorLayer): string {
    return layer.id;
  }

  ngOnInit(): void {
    const projectId = this.route.snapshot.queryParamMap.get('projectId');
    const assetId = this.route.snapshot.queryParamMap.get('assetId');

    this.ed.initProject(assetId ?? undefined).subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });

    this.ed.startAutosave();
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      const mod = await import('fabric');
      this.fabric = mod;
    } catch {
      console.warn('Fabric.js not available, using mock canvas');
      this.fabric = null;
      return;
    }

    const el = this.canvasElRef.nativeElement;
    const parent = el.parentElement!;
    const w = Math.min(parent.clientWidth, 1200);
    const h = Math.min(parent.clientHeight, 800);

    this.canvas = new this.fabric.Canvas(el, {
      width: w,
      height: h,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: false,
    });

    this.fabric.Object.prototype.set({
      transparentCorners: false,
      cornerColor: '#3b82f6',
      cornerStrokeColor: '#3b82f6',
      cornerSize: 8,
      cornerStyle: 'circle',
      borderColor: '#3b82f6',
      borderScaleFactor: 1.5,
      padding: 4,
    });

    this.canvas.on('selection:created', (e: any) => this.onSelect(e));
    this.canvas.on('selection:updated', (e: any) => this.onSelect(e));
    this.canvas.on('selection:cleared', () => this.onDeselect());
    this.canvas.on('object:modified', () => this.onModify());

    this.canvas.on('object:moving', (e: any) => {
      if (this.ed.snapEnabled()) {
        const obj = e.target;
        const gs = 20;
        obj.set({
          left: Math.round(obj.left / gs) * gs,
          top: Math.round(obj.top / gs) * gs,
        });
      }
    });

    this.ed.registerCanvasApi(
      () => JSON.stringify(this.canvas?.toJSON(this.canfulProperties()) ?? {}),
      (json: string) => { try { this.canvas?.loadFromJSON(JSON.parse(json), () => this.canvas?.renderAll()); } catch {} }
    );

    this.updateGrid();
    this.onModify();

    if (this.ed.project()?.canvasJson && this.ed.project()!.canvasJson !== '{}') {
      try {
        this.canvas.loadFromJSON(JSON.parse(this.ed.project()!.canvasJson), () => this.canvas.renderAll());
      } catch {}
    }
  }

  private canfulProperties(): string[] {
    return ['_id', 'name', 'type', 'fill', 'stroke', 'strokeWidth', 'opacity',
      'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'textAlign',
      'lineHeight', 'charSpacing', 'underline', 'strikethrough', 'textBackgroundColor',
      'direction', 'paragraphSpacing', 'shadow',
      'width', 'height', 'left', 'top', 'scaleX', 'scaleY', 'angle',
      'visible', 'lockMovementX', 'lockMovementY', 'text', 'styles'];
  }

  ngOnDestroy(): void {
    this.ed.stopAutosave();
    this.removeTextSelectionHandler();
    this.canvas?.dispose();
    this.canvas = null;
    this._aiStatusEffect?.destroy();
  }

  private removeTextSelectionHandler(): void {
    if (this._textSelHandler) {
      this._textSelHandler();
      this._textSelHandler = null;
    }
    this._hasTextSelection = false;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    const isInput = (e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA';
    if (isInput) return;

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) this.ed.redo();
      else this.ed.undo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      this.ed.redo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      this.save();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
      e.preventDefault();
      this.toggleGrid();
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      this.deleteSelected();
      return;
    }
    if (e.key === 'Escape') {
      this.canvas?.discardActiveObject();
      this.canvas?.renderAll();
      this.showExport.set(false);
      this.showAiResult.set(false);
      this.showTemplatePicker.set(false);
      this.showUploadDialog.set(false);
      this.showFontPicker.set(false);
      this.ed.toolMode.set('select');
      return;
    }
    if (e.key === 'v' && !e.ctrlKey && !e.metaKey) { this.ed.toolMode.set('select'); return; }
    if (e.key === 't' && !e.ctrlKey && !e.metaKey) { this.ed.toolMode.set('text'); return; }
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) { this.ed.toolMode.set('shape'); return; }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.canvas) return;
    const parent = this.canvasElRef?.nativeElement?.parentElement;
    if (!parent) return;
    const w = Math.min(parent.clientWidth, 1200);
    const h = Math.min(parent.clientHeight, 800);
    if (this.canvas.getWidth() !== w || this.canvas.getHeight() !== h) {
      this.canvas.setWidth(w);
      this.canvas.setHeight(h);
      this.canvas.renderAll();
    }
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.showFontPicker.set(false);
  }

  private onSelect(e: any): void {
    const objs = e.selected ?? [e.target];
    if (!objs || !objs.length) return;
    this._selectedObject = objs.length === 1 ? objs[0] : null;
    const ids = new Set<string>();
    objs.forEach((o: any) => ids.add(o._id ?? `obj-${Date.now()}`));
    this.ed.selectedLayerIds.set(ids);
    this.readPropsFromSelected();
    this.ed.syncLayers(this.canvas?.getObjects() ?? []);
    this.updateCanvasCursor();
    this.wireTextSelectionHandler();
  }

  private wireTextSelectionHandler(): void {
    this.removeTextSelectionHandler();
    const obj = this._selectedObject;
    if (!obj || !obj.isType || !obj.isType('i-text')) return;

    const handler = () => {
      this._hasTextSelection = obj.selectionStart !== obj.selectionEnd;
      if (this._hasTextSelection) {
        const styles = obj.getSelectionStyles();
        this._selectionProps.update(p => ({ ...p, ...styles }));
      }
    };

    obj.on('selection:changed', handler);
    this._textSelHandler = () => obj.off('selection:changed', handler);
  }

  private onDeselect(): void {
    this.removeTextSelectionHandler();
    this._selectedObject = null;
    this.ed.selectedLayerIds.set(new Set());
    this._selectionProps.set({});
    this.ed.syncLayers(this.canvas?.getObjects() ?? []);
    this.updateCanvasCursor();
  }

  private onModify(): void {
    if (!this.canvas) return;
    this.ed.syncLayers(this.canvas.getObjects());
    this.ed.setDirty();
    this.readPropsFromSelected();
  }

  private readShadow(obj: any): any {
    const s = obj.shadow;
    if (!s) return null;
    return {
      color: s.color ?? 'rgba(0,0,0,0.3)',
      blur: s.blur ?? 0,
      offsetX: s.offsetX ?? 0,
      offsetY: s.offsetY ?? 0,
    };
  }

  private readPropsFromSelected(): void {
    const obj = this._selectedObject;
    if (!obj) { this._selectionProps.set({}); return; }
    this._selectionProps.set({
      fill: obj.fill,
      stroke: obj.stroke,
      strokeWidth: obj.strokeWidth,
      opacity: obj.opacity,
      fontFamily: obj.fontFamily,
      fontSize: obj.fontSize,
      fontWeight: obj.fontWeight,
      fontStyle: obj.fontStyle,
      textAlign: obj.textAlign,
      text: obj.text,
      lineHeight: obj.lineHeight,
      charSpacing: obj.charSpacing,
      underline: obj.underline,
      strikethrough: obj.strikethrough,
      textBackgroundColor: obj.textBackgroundColor,
      direction: obj.direction,
      paragraphSpacing: obj.paragraphSpacing ?? 0,
      shadow: this.readShadow(obj),
      width: obj.width,
      height: obj.height,
      left: obj.left,
      top: obj.top,
      angle: obj.angle,
    });
  }

  private updateCanvasCursor(): void {
    if (!this.canvas) return;
    const mode = this.ed.toolMode();
    const cursors: Record<string, string> = {
      select: 'default', text: 'text', shape: 'crosshair',
      image: 'crosshair', upload: 'crosshair', templates: 'default', ai: 'default',
    };
    this.canvas.defaultCursor = cursors[mode] ?? 'default';
    this.canvas.renderAll();
  }

  private getCanvasCenter(): { x: number; y: number } {
    if (!this.canvas) return { x: 400, y: 300 };
    return { x: this.canvas.getWidth() / 2, y: this.canvas.getHeight() / 2 };
  }

  private updateGrid(): void {
    if (!this.canvas || !this.fabric) return;
    const existing = this.canvas.getObjects().filter((o: any) => o._isGrid);
    existing.forEach((o: any) => this.canvas?.remove(o));

    if (this.ed.gridVisible()) {
      const gs = 20;
      const cw = 2000;
      const ch = 2000;

      for (let i = 0; i <= cw; i += gs) {
        this.canvas.add(new this.fabric.Line([i, 0, i, ch], {
          _isGrid: true, selectable: false, evented: false,
          stroke: '#c0c0c0', strokeWidth: i % 100 === 0 ? 0.8 : 0.3, opacity: 0.2,
        }));
      }
      for (let i = 0; i <= ch; i += gs) {
        this.canvas.add(new this.fabric.Line([0, i, cw, i], {
          _isGrid: true, selectable: false, evented: false,
          stroke: '#c0c0c0', strokeWidth: i % 100 === 0 ? 0.8 : 0.3, opacity: 0.2,
        }));
      }

      const gridLines = this.canvas.getObjects().filter((o: any) => o._isGrid);
      gridLines.forEach((o: any) => this.canvas?.sendToBack(o));
    }
    this.canvas.renderAll();
  }

  toggleGrid(): void {
    this.ed.gridVisible.update(v => !v);
    this.updateGrid();
  }

  toggleSnap(): void {
    this.ed.snapEnabled.update(v => !v);
  }

  save(): void {
    this.ed.saveProject().subscribe({
      next: () => { this.ed.saveState.set('saved'); this.ed.dirty.set(false); },
      error: () => this.ed.saveState.set('failed'),
    });
  }

  setTool(mode: ToolMode): void {
    this.ed.toolMode.set(mode);
    this.showFontPicker.set(false);
    this.updateCanvasCursor();
    if (mode === 'text') this.addText();
    if (mode === 'shape') this.addShape('rect');
    if (mode === 'image') this.triggerImageUpload();
    if (mode === 'upload') this.showUploadDialog.set(true);
    if (mode === 'templates') this.showTemplatePicker.set(true);
  }

  addShape(type: string): void {
    if (!this.canvas || !this.fabric) return;
    this.ed.pushUndoState();
    const id = `shape-${Date.now()}`;
    const c = this.getCanvasCenter();
    let obj: any;
    switch (type) {
      case 'circle':
        obj = new this.fabric.Circle({ _id: id, name: 'Circle', left: c.x - 50, top: c.y - 50, radius: 50, fill: '#3b82f6' });
        break;
      case 'triangle':
        obj = new this.fabric.Triangle({ _id: id, name: 'Triangle', left: c.x - 50, top: c.y - 50, width: 100, height: 100, fill: '#8b5cf6' });
        break;
      case 'line':
        obj = new this.fabric.Line([c.x - 100, c.y, c.x + 100, c.y], { _id: id, name: 'Line', stroke: '#e94560', strokeWidth: 3 });
        break;
      default:
        obj = new this.fabric.Rect({ _id: id, name: 'Rectangle', left: c.x - 60, top: c.y - 40, width: 120, height: 80, fill: '#22c55e', rx: 4, ry: 4 });
    }
    this.canvas.add(obj);
    this.canvas.setActiveObject(obj);
    this.canvas.renderAll();
    this.onSelect({ target: obj });
  }

  private addText(text?: string): void {
    if (!this.canvas || !this.fabric) return;
    this.ed.pushUndoState();
    const c = this.getCanvasCenter();
    const t = new this.fabric.IText(text ?? 'Double-click to edit', {
      _id: `txt-${Date.now()}`,
      name: 'Text',
      left: c.x - 100,
      top: c.y - 20,
      fontFamily: 'Inter',
      fontSize: 32,
      fill: '#1a1a2e',
      fontWeight: 400,
      paragraphSpacing: 0,
    });
    this.canvas.add(t);
    this.canvas.setActiveObject(t);
    this.canvas.renderAll();
    this.onSelect({ target: t });
  }

  triggerImageUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/svg+xml';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      if (!this.ALLOWED_TYPES.includes(file.type)) { alert('Unsupported format. Use PNG, JPEG, WebP, or SVG.'); return; }
      if (file.size > this.FILE_SIZE_LIMIT) { alert('File too large (max 10 MB).'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => this.addImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  }

  private addImage(url: string): void {
    if (!this.canvas || !this.fabric) return;
    this.ed.pushUndoState();
    this.fabric.Image.fromURL(url, (img: any) => {
      const maxW = 300, maxH = 300;
      const scale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1), 1);
      const c = this.getCanvasCenter();
      img.set({
        _id: `img-${Date.now()}`,
        name: 'Image',
        left: c.x - (img.width * scale) / 2,
        top: c.y - (img.height * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      });
      this.canvas!.add(img);
      this.canvas!.setActiveObject(img);
      this.canvas!.renderAll();
      this.onSelect({ target: img });
      this.ed.toolMode.set('select');
      this.updateCanvasCursor();
    }, { crossOrigin: 'anonymous' });
  }

  deleteSelected(): void {
    const active = this.canvas?.getActiveObjects();
    if (!active || !active.length) return;
    this.ed.pushUndoState();
    active.forEach((o: any) => this.canvas?.remove(o));
    this.canvas?.discardActiveObject();
    this.canvas?.renderAll();
    this.onDeselect();
  }

  setZoom(level: number): void {
    this.ed.zoom.set(level);
    if (!this.canvas) return;
    const z = level;
    this.canvas.setZoom(z);
    this.canvas.renderAll();
  }

  zoomIn(): void { this.setZoom(Math.min(this.ed.zoom() + 0.1, 5)); }
  zoomOut(): void { this.setZoom(Math.max(this.ed.zoom() - 0.1, 0.1)); }
  zoomToFit(): void { this.setZoom(1); }

  undo(): void { this.ed.undo(); }
  redo(): void { this.ed.redo(); }

  onLayerSelect(id: string): void {
    const obj = this.canvas?.getObjects().find((o: any) => o._id === id);
    if (obj) {
      this.canvas?.discardActiveObject();
      this.canvas?.setActiveObject(obj);
      this.canvas?.renderAll();
      this.onSelect({ target: obj });
    }
  }

  toggleLayerVisibility(id: string): void {
    const obj = this.canvas?.getObjects().find((o: any) => o._id === id);
    if (obj) {
      obj.visible = !obj.visible;
      this.canvas?.renderAll();
      this.onModify();
    }
  }

  toggleLayerLock(id: string): void {
    const obj = this.canvas?.getObjects().find((o: any) => o._id === id);
    if (obj) {
      obj.lockMovementX = !obj.lockMovementX;
      obj.lockMovementY = obj.lockMovementX;
      obj.lockRotation = obj.lockMovementX;
      obj.lockScalingX = obj.lockMovementX;
      obj.lockScalingY = obj.lockMovementX;
      this.canvas?.renderAll();
      this.onModify();
    }
  }

  updateProperty(key: string, value: any): void {
    const obj = this._selectedObject;
    if (!obj) return;
    this.ed.pushUndoState();

    if (this._hasTextSelection && obj.isType?.('i-text')) {
      const style: Record<string, any> = {};
      style[key] = value;
      obj.setSelectionStyles(style);
      this.canvas?.renderAll();
      this.readPropsFromSelected();
      this.ed.setDirty();
      return;
    }

    if (key === 'paragraphSpacing' && obj.isType?.('i-text')) {
      this.applyParagraphSpacing(obj, value as number);
    } else {
      obj.set(key, value);
    }

    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  private applyParagraphSpacing(obj: any, spacing: number): void {
    const raw = obj._cleanParaText || obj.text;
    const paragraphs = raw.split(/\n+/).filter((p: string) => p.length > 0);
    if (paragraphs.length <= 1) {
      obj.set('paragraphSpacing', spacing);
      obj._cleanParaText = raw;
      return;
    }
    const extraNewlines = Math.min(Math.round(spacing / 20), 10);
    const separator = '\n'.repeat(Math.max(1, extraNewlines + 1));
    const newText = paragraphs.join(separator);
    obj.set('text', newText);
    obj.set('paragraphSpacing', spacing);
    obj._cleanParaText = raw;
  }

  applyColor(color: string, target: 'fill' | 'stroke'): void {
    this.updateProperty(target, color);
  }

  toggleShadow(): void {
    const obj = this._selectedObject;
    if (!obj) return;
    this.ed.pushUndoState();
    if (obj.shadow) {
      obj.shadow = null;
    } else {
      obj.shadow = { color: 'rgba(0,0,0,0.3)', blur: 4, offsetX: 2, offsetY: 2 };
    }
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  updateShadow(): void {
    const obj = this._selectedObject;
    if (!obj) return;
    this.ed.pushUndoState();
    const s = this._selectionProps()['shadow'];
    if (s) {
      obj.shadow = {
        color: s.color,
        blur: s.blur,
        offsetX: s.offsetX,
        offsetY: s.offsetY,
      };
    }
    this.canvas?.renderAll();
    this.ed.setDirty();
  }

  shadowProp(key: string, value: any): void {
    this._selectionProps.update(p => {
      const shadow = { ...(p['shadow'] || {}), [key]: value };
      return { ...p, shadow };
    });
    this.updateShadow();
  }

  onFileDrop(e: DragEvent): void {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!this.ALLOWED_TYPES.includes(file.type)) { return; }
    if (file.size > this.FILE_SIZE_LIMIT) { return; }
    const reader = new FileReader();
    reader.onload = (ev) => this.addImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
  }

  removeBg(): void {
    this.ed.removeBg();
  }

  applyAiResult(): void {
    this.ed.applyAiResult();
    this.showAiResult.set(false);
  }

  discardAiResult(): void {
    this.ed.discardAiResult();
    this.showAiResult.set(false);
  }

  openExport(): void {
    this.showExport.set(true);
    this.ed.resetExportState();
  }

  closeExport(): void {
    this.showExport.set(false);
  }

  exportDesign(format: 'PNG' | 'PDF' | 'SVG'): void {
    this._exportFormat = format;
    this.ed.exportProject(format);
  }

  downloadExport(): void {
    const state = this.ed.exportState();
    if (state.downloadUrl) {
      const ext = this._exportFormat.toLowerCase();
      this.ed.downloadUrl(state.downloadUrl, `design-${Date.now()}.${ext}`);
      this.closeExport();
    }
  }

  saveAndClose(): void {
    this.save();
    this.router.navigate(['/marketplace']);
  }
}
