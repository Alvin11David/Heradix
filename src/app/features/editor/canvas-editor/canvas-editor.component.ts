import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  HostListener,
  ViewChild,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EditorService, ToolMode, EditorLayer, SaveState } from '../editor.service';
import { EditorProject, ExportFormat } from '../../../core/models/editor.model';
import { MarketplaceService } from '../../marketplace/marketplace.service';
import { Asset } from '../../../core/models/asset.model';

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
  private readonly marketplace = inject(MarketplaceService);

  @ViewChild('canvasEl') canvasElRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasArea') canvasAreaRef!: ElementRef<HTMLDivElement>;

  private resizeObserver: ResizeObserver | null = null;

  readonly loading = signal(true);
  readonly showExport = signal(false);
  readonly showAiResult = signal(false);
  readonly showTemplatePicker = signal(false);
  readonly showUploadDialog = signal(false);
  readonly showFontPicker = signal(false);
  readonly leftPanelCollapsed = signal(false);
  readonly rightPanelCollapsed = signal(false);

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
  readonly rulersVisible = signal(false);
  readonly gridView = signal(false);
  readonly guidesVisible = signal(true);
  readonly smartGuidesEnabled = signal(true);
  readonly pageMarginsVisible = signal(true);
  readonly snapToGridEnabled = signal(true);
  readonly snapToObjectsEnabled = signal(true);

  readonly projectTitle = computed(() => this.ed.project()?.title ?? 'Untitled');
  readonly assets = signal<Asset[]>([]);
  readonly loadingAssets = signal(false);
  readonly pages = signal<
    Array<{
      id: string;
      name: string;
      x: number;
      y: number;
      width: number;
      height: number;
      margin?: number;
    }>
  >([
    { id: 'page-1', name: 'Page 1', x: 0, y: 0, width: 1400, height: 900, margin: 120 },
    { id: 'page-2', name: 'Page 2', x: 1800, y: 0, width: 1400, height: 900, margin: 120 },
  ]);
  readonly currentPageIndex = signal(0);
  readonly currentPage = computed(() => this.pages()[this.currentPageIndex()] ?? this.pages()[0]);
  readonly currentPageLabel = computed(() => this.currentPage()?.name ?? 'Page 1');
  assetsSearchQuery = '';

  fontFamilies = [
    'Inter',
    'Lato',
    'Roboto',
    'Poppins',
    'Playfair Display',
    'Courier New',
    'Georgia',
    'Arial',
  ];
  shapeTypes = ['rect', 'circle', 'polygon', 'star', 'line'] as const;

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
  private _exportFormat: ExportFormat = 'PNG';
  exportQuality = 92;
  exportTransparent = true;
  private _assetImageUrl: string | null = null;
  private _textSelHandler: (() => void) | null = null;
  private _hasTextSelection = false;

  private _selectionProps = signal<Record<string, any>>({});
  readonly selectionProps = this._selectionProps.asReadonly();

  readonly layerActionTarget = signal<string | null>(null);
  readonly layerRenameValue = signal('');
  private _dragPreview: any = null;
  private panKeyPressed = false;
  private isPanning = false;
  private panStartPoint: { x: number; y: number } | null = null;
  private panOriginTransform: [number, number, number, number, number, number] | null = null;
  private readonly canvasWheelHandler = this.handleCanvasWheel.bind(this);
  private readonly canvasMouseDownHandler = this.handleCanvasMouseDown.bind(this);
  private readonly canvasMouseMoveHandler = this.handleCanvasMouseMove.bind(this);
  private readonly canvasMouseUpHandler = this.handleCanvasMouseUp.bind(this);
  private readonly windowKeyDownHandler = this.handleWindowKeyDown.bind(this);
  private readonly windowKeyUpHandler = this.handleWindowKeyUp.bind(this);

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
  readonly selectedTextBackgroundColor = computed(
    () => this._selectionProps()['textBackgroundColor'] ?? '',
  );
  readonly selectedDirection = computed(() => this._selectionProps()['direction'] ?? 'ltr');
  readonly selectedParagraphSpacing = computed(
    () => this._selectionProps()['paragraphSpacing'] ?? 0,
  );
  readonly hasShadow = computed(() => {
    const s = this._selectionProps()['shadow'];
    return !!s && typeof s === 'object';
  });

  readonly selectedCornerRx = computed(() => this._selectionProps()['cornerRx'] ?? 0);
  readonly selectedCornerRy = computed(() => this._selectionProps()['cornerRy'] ?? 0);
  readonly selectedStrokeTop = computed(() => !!this._selectionProps()['strokeTop']);
  readonly selectedStrokeBottom = computed(() => !!this._selectionProps()['strokeBottom']);
  readonly selectedStrokeLeft = computed(() => !!this._selectionProps()['strokeLeft']);
  readonly selectedStrokeRight = computed(() => !!this._selectionProps()['strokeRight']);
  readonly maxCornerSmoothing = computed(() => {
    const w = this._selectionProps()['width'] ?? 120;
    const h = this._selectionProps()['height'] ?? 80;
    return Math.round(Math.min(Math.abs(w), Math.abs(h)) / 2);
  });

  readonly selectedCircleArc = computed(() => this._selectionProps()['_arc'] ?? 0);
  readonly selectedCircleSweep = computed(() => this._selectionProps()['_sweep'] ?? 360);
  readonly selectedCircleRatio = computed(() => this._selectionProps()['_ratio'] ?? 0);

  readonly selectedStrokeLineCap = computed(
    () => this._selectionProps()['strokeLineCap'] ?? 'butt',
  );
  readonly selectedStrokeLineJoin = computed(
    () => this._selectionProps()['strokeLineJoin'] ?? 'miter',
  );
  readonly selectedArrowStart = computed(() => !!this._selectionProps()['_arrowStart']);
  readonly selectedArrowEnd = computed(() => !!this._selectionProps()['_arrowEnd']);

  readonly selectedPolygonSides = computed(() => this._selectionProps()['_sides'] ?? 3);
  readonly selectedPolygonCornerRadius = computed(
    () => this._selectionProps()['_cornerRadius'] ?? 0,
  );
  readonly selectedStarPoints = computed(() => this._selectionProps()['_starPoints'] ?? 5);
  readonly selectedStarRatio = computed(() => this._selectionProps()['_starRatio'] ?? 0.5);
  readonly maxPolygonCornerRadius = computed(() => {
    const sides = this._selectionProps()['_sides'] ?? 3;
    const w = this._selectionProps()['width'] ?? 100;
    const h = this._selectionProps()['height'] ?? 100;
    const radius = Math.min(Math.abs(w), Math.abs(h)) / 2;
    return Math.max(0, radius * Math.sin(Math.PI / sides));
  });
  readonly selectedBlendMode = computed(
    () => this._selectionProps()['globalCompositeOperation'] ?? 'source-over',
  );
  readonly selectedLayerBlur = computed(() => this._selectionProps()['_layerBlur'] ?? 0);
  readonly selectedFillType = computed(() => this._selectionProps()['_fillType'] ?? 'solid');
  readonly selectedGradientColors = computed(
    () => this._selectionProps()['_gradientColors'] ?? ['#3b82f6', '#8b5cf6'],
  );
  readonly selectedGradientAngle = computed(() => this._selectionProps()['_gradientAngle'] ?? 0);
  readonly selectedGradientRadius = computed(() => this._selectionProps()['_gradientRadius'] ?? 50);

  blendModes = [
    'source-over',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
  ];

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

  trackAsset(_: number, asset: Asset): string {
    return asset.id;
  }

  ngOnInit(): void {
    const projectId = this.route.snapshot.queryParamMap.get('projectId');
    const assetId = this.route.snapshot.queryParamMap.get('assetId');
    this._assetImageUrl = this.route.snapshot.queryParamMap.get('imageUrl');
    const assetTitle = this.route.snapshot.queryParamMap.get('title');

    this.ed.initProject(assetId ?? undefined).subscribe({
      next: () => {
        this.loading.set(false);
        if (assetTitle) {
          this.ed.project.update((p) => (p ? { ...p, title: assetTitle } : p));
        }
      },
      error: () => this.loading.set(false),
    });

    this.ed.startAutosave();
    this.loadAssets();
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
    const container = this.canvasAreaRef?.nativeElement ?? el.parentElement!;
    const w = Math.max(Math.min(container.clientWidth, 1200), 400);
    const h = Math.max(Math.min(container.clientHeight, 800), 300);

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
      cornerColor: '#ffffff',
      cornerStrokeColor: '#2563eb',
      cornerSize: 9,
      cornerStyle: 'circle',
      borderColor: '#2563eb',
      borderScaleFactor: 1.35,
      padding: 6,
      borderOpacityWhenMoving: 0.9,
      hasBorders: true,
      hasControls: true,
      objectCaching: false,
      strokeUniform: true,
    });

    this.canvas.on('selection:created', (e: any) => this.onSelect(e));
    this.canvas.on('selection:updated', (e: any) => this.onSelect(e));
    this.canvas.on('selection:cleared', () => this.onDeselect());
    this.canvas.on('object:modified', (e: any) => {
      this.syncStrokeSides(e.target);
      this.syncArrows(e.target);
      this.onModify();
    });

    this.canvas.on('object:moving', (e: any) => {
      const obj = e.target;
      if (this.ed.snapEnabled() && (this.snapToGridEnabled() || this.snapToObjectsEnabled())) {
        const snapped = this.applySnapping(obj);
        obj.set({ left: snapped.left, top: snapped.top });
        obj.setCoords();
      }
      this.applySelectionAppearance(obj);
      this.showDragPreview(obj);
      this.renderGuidesForObject(e.target);
    });

    this.canvas.on('object:modified', (e: any) => {
      this.applySelectionAppearance(e.target);
      this.clearDragPreview();
      this.renderGuidesForObject(e.target);
    });

    this.ed.registerCanvasApi(
      () => JSON.stringify(this.canvas?.toJSON(this.canfulProperties()) ?? {}),
      (json: string) => {
        try {
          this.canvas?.loadFromJSON(JSON.parse(json), () => this.canvas?.renderAll());
        } catch {}
      },
    );

    this.updateGrid();
    this.onModify();
    this.setupCanvasPanning();
    this.renderPageGuides();

    if (this.canvasAreaRef) {
      this.resizeObserver = new ResizeObserver(() => {
        this.resizeCanvas();
      });
      this.resizeObserver.observe(this.canvasAreaRef.nativeElement);
    }

    if (this.ed.project()?.canvasJson && this.ed.project()!.canvasJson !== '{}') {
      try {
        this.canvas.loadFromJSON(JSON.parse(this.ed.project()!.canvasJson), () =>
          this.canvas.renderAll(),
        );
      } catch {}
    } else if (this._assetImageUrl) {
      this.loadAssetImage(this._assetImageUrl);
    }
  }

  private setupCanvasPanning(): void {
    if (!this.canvas || !this.canvasAreaRef?.nativeElement) return;

    const viewport = this.canvasAreaRef.nativeElement;
    viewport.addEventListener('wheel', this.canvasWheelHandler, { passive: false });
    viewport.addEventListener('mousedown', this.canvasMouseDownHandler);
    window.addEventListener('mousemove', this.canvasMouseMoveHandler);
    window.addEventListener('mouseup', this.canvasMouseUpHandler);
    window.addEventListener('keydown', this.windowKeyDownHandler);
    window.addEventListener('keyup', this.windowKeyUpHandler);
  }

  private handleWindowKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Space' && !this.panKeyPressed) {
      this.panKeyPressed = true;
      this.updateCanvasCursor();
    }
  }

  private handleWindowKeyUp(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      this.panKeyPressed = false;
      this.updateCanvasCursor();
    }
  }

  private handleCanvasMouseDown(event: MouseEvent): void {
    const shouldPan = this.panKeyPressed || event.button === 1;
    if (!this.canvas || !shouldPan) return;

    event.preventDefault();
    event.stopPropagation();
    this.isPanning = true;
    this.panStartPoint = { x: event.clientX, y: event.clientY };
    this.panOriginTransform = (this.canvas.viewportTransform?.slice() ?? [1, 0, 0, 1, 0, 0]) as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    this.canvas.selection = false;
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
    this.canvas.setCursor('grabbing');
  }

  private handleCanvasMouseMove(event: MouseEvent): void {
    if (!this.isPanning || !this.canvas || !this.panStartPoint || !this.panOriginTransform) return;

    const dx = event.clientX - this.panStartPoint.x;
    const dy = event.clientY - this.panStartPoint.y;
    const nextTransform = this.panOriginTransform.slice() as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    nextTransform[4] -= dx;
    nextTransform[5] -= dy;

    this.canvas.setViewportTransform(nextTransform);
    this.canvas.requestRenderAll();
    this.panStartPoint = { x: event.clientX, y: event.clientY };
  }

  private handleCanvasMouseUp(): void {
    if (!this.isPanning) return;

    this.isPanning = false;
    this.panStartPoint = null;
    this.panOriginTransform = null;
    this.canvas?.selection && (this.canvas.selection = true);
    this.updateCanvasCursor();
  }

  private handleCanvasWheel(event: WheelEvent): void {
    if (!this.canvas) return;

    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      const rect = this.canvasAreaRef?.nativeElement?.getBoundingClientRect();
      const point = rect
        ? { x: event.clientX - rect.left, y: event.clientY - rect.top }
        : this.getCanvasCenter();
      const delta = event.deltaY < 0 ? 0.1 : -0.1;
      this.setZoom(this.ed.zoom() + delta, point);
      return;
    }

    const shouldPan = Math.abs(event.deltaX) > 0 || Math.abs(event.deltaY) > 0;
    if (!shouldPan) return;

    event.preventDefault();
    event.stopPropagation();

    const currentTransform = (this.canvas.viewportTransform?.slice() ?? [1, 0, 0, 1, 0, 0]) as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const nextTransform = currentTransform.slice() as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    nextTransform[4] += event.deltaX;
    nextTransform[5] += event.deltaY;
    this.canvas.setViewportTransform(nextTransform);
    this.canvas.requestRenderAll();
  }

  private loadAssetImage(url: string): void {
    if (!this.canvas || !this.fabric) return;
    this.ed.pushUndoState();
    void this.loadFabricImage(url, true).then((img) => {
      if (!img) return;
      const cw = this.canvas!.getWidth();
      const ch = this.canvas!.getHeight();
      const maxW = cw * 0.8;
      const maxH = ch * 0.8;
      const scale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1), 1);
      img.set({
        _id: `asset-img-${Date.now()}`,
        name: 'Asset Image',
        left: (cw - img.width * scale) / 2,
        top: (ch - img.height * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      });
      this.canvas!.add(img);
      this.canvas!.setActiveObject(img);
      this.canvas!.renderAll();
      this.onSelect({ target: img });
      this.ed.toolMode.set('select');
      this.updateCanvasCursor();
    });
  }

  updateCornerSmoothing(value: number): void {
    const obj = this._selectedObject;
    if (!obj || !obj.isType || !obj.isType('rect')) return;
    this.ed.pushUndoState();
    const v = Math.round(value);
    const maxVal = Math.round(Math.min(Math.abs(obj.width), Math.abs(obj.height)) / 2);
    const clamped = Math.min(v, maxVal);
    obj.set('rx', clamped);
    obj.set('ry', clamped);
    obj._cornerRx = clamped;
    obj._cornerRy = clamped;
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  updateStrokeSide(side: 'top' | 'bottom' | 'left' | 'right'): void {
    const obj = this._selectedObject;
    if (!obj || !obj.isType || !obj.isType('rect')) return;
    this.ed.pushUndoState();
    if (!obj._strokeSides)
      obj._strokeSides = { top: false, bottom: false, left: false, right: false };
    obj._strokeSides[side] = !obj._strokeSides[side];
    this.syncStrokeSides(obj);
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  private syncStrokeSides(obj: any): void {
    if (!obj || !obj._strokeSides || !this.canvas || !this.fabric) return;
    const sides = obj._strokeSides;
    const id = obj._id;
    const stroke = obj.stroke || '#000000';
    const sw = obj.strokeWidth || 1;

    const existing = this.canvas
      .getObjects()
      .filter((o: any) => o._isStrokeSide && o._parentId === id);
    existing.forEach((o: any) => this.canvas?.remove(o));

    if (!sides.top && !sides.bottom && !sides.left && !sides.right) {
      obj.set('stroke', stroke);
      obj.set('strokeWidth', sw);
      this.canvas.renderAll();
      return;
    }

    obj.set('stroke', 'transparent');
    obj.set('strokeWidth', 0);

    const b = obj.getBoundingRect();
    const half = sw / 2;

    if (sides.top) {
      this.canvas.add(
        new this.fabric.Line([b.left, b.top + half, b.left + b.width, b.top + half], {
          _isStrokeSide: true,
          _parentId: id,
          selectable: false,
          evented: false,
          stroke,
          strokeWidth: sw,
          strokeUniform: true,
        }),
      );
    }
    if (sides.bottom) {
      this.canvas.add(
        new this.fabric.Line(
          [b.left, b.top + b.height - half, b.left + b.width, b.top + b.height - half],
          {
            _isStrokeSide: true,
            _parentId: id,
            selectable: false,
            evented: false,
            stroke,
            strokeWidth: sw,
            strokeUniform: true,
          },
        ),
      );
    }
    if (sides.left) {
      this.canvas.add(
        new this.fabric.Line([b.left + half, b.top, b.left + half, b.top + b.height], {
          _isStrokeSide: true,
          _parentId: id,
          selectable: false,
          evented: false,
          stroke,
          strokeWidth: sw,
          strokeUniform: true,
        }),
      );
    }
    if (sides.right) {
      this.canvas.add(
        new this.fabric.Line(
          [b.left + b.width - half, b.top, b.left + b.width - half, b.top + b.height],
          {
            _isStrokeSide: true,
            _parentId: id,
            selectable: false,
            evented: false,
            stroke,
            strokeWidth: sw,
            strokeUniform: true,
          },
        ),
      );
    }

    this.canvas.renderAll();
  }

  private buildSectorPath(R: number, startDeg: number, sweepDeg: number, ratio: number): string {
    const startRad = (startDeg * Math.PI) / 180;
    const sweepRad = (sweepDeg * Math.PI) / 180;
    const endRad = startRad + sweepRad;
    const r = R * Math.max(0, Math.min(0.95, ratio));

    const cosS = Math.cos(startRad),
      sinS = Math.sin(startRad);
    const cosE = Math.cos(endRad),
      sinE = Math.sin(endRad);

    const ox = R * cosS,
      oy = R * sinS;
    const ex = R * cosE,
      ey = R * sinE;
    const large = sweepDeg > 180 ? 1 : 0;

    if (sweepDeg >= 360) {
      const mx = R * Math.cos(startRad + Math.PI),
        my = R * Math.sin(startRad + Math.PI);
      if (r <= 0) {
        return `M ${ox} ${oy} A ${R} ${R} 0 0 1 ${mx} ${my} A ${R} ${R} 0 0 1 ${ox} ${oy} Z`;
      }
      const ix = r * cosS,
        iy = r * sinS;
      const imx = r * Math.cos(startRad + Math.PI),
        imy = r * Math.sin(startRad + Math.PI);
      return `M ${ox} ${oy} A ${R} ${R} 0 0 1 ${mx} ${my} A ${R} ${R} 0 0 1 ${ox} ${oy} Z M ${ix} ${iy} A ${r} ${r} 0 0 0 ${imx} ${imy} A ${r} ${r} 0 0 0 ${ix} ${iy} Z`;
    }

    if (r <= 0) {
      return `M ${ox} ${oy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey} L 0 0 Z`;
    }

    const ix = r * cosS,
      iy = r * sinS;
    const iex = r * cosE,
      iey = r * sinE;
    return `M ${ox} ${oy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey} L ${iex} ${iey} A ${r} ${r} 0 ${large} 0 ${ix} ${iy} Z`;
  }

  private replaceCircleShape(obj: any, arc: number, sweep: number, ratio: number): void {
    if (!this.canvas || !this.fabric) return;
    const R =
      Math.min(Math.abs(obj.width || obj.radius || 50), Math.abs(obj.height || obj.radius || 50)) /
      2;
    const cx = obj.left + (obj.width || obj.radius * 2) / 2;
    const cy = obj.top + (obj.height || obj.radius * 2) / 2;
    const pathStr = this.buildSectorPath(R, arc, sweep, ratio);
    const isDefault = arc === 0 && sweep === 360 && ratio === 0;

    let newObj: any;

    if (isDefault) {
      newObj = new this.fabric.Circle({
        _id: obj._id,
        name: obj.name ?? 'Circle',
        radius: R,
        fill: obj.fill ?? '#3b82f6',
        stroke: obj.stroke,
        strokeWidth: obj.strokeWidth,
        opacity: obj.opacity,
        shadow: obj.shadow,
        lockMovementX: obj.lockMovementX,
        lockMovementY: obj.lockMovementY,
        visible: obj.visible,
        angle: obj.angle,
        _arc: 0,
        _sweep: 360,
        _ratio: 0,
      });
    } else {
      newObj = new this.fabric.Path(pathStr, {
        _id: obj._id,
        name: obj.name ?? 'Circle',
        fill: obj.fill ?? '#3b82f6',
        stroke: obj.stroke ?? '',
        strokeWidth: obj.strokeWidth ?? 0,
        opacity: obj.opacity ?? 1,
        shadow: obj.shadow,
        lockMovementX: obj.lockMovementX,
        lockMovementY: obj.lockMovementY,
        visible: obj.visible,
        angle: obj.angle,
        _arc: arc,
        _sweep: sweep,
        _ratio: ratio,
        _shapeType: 'circle',
      });
    }

    newObj.set({
      left: cx - (newObj.width ?? R * 2) / 2,
      top: cy - (newObj.height ?? R * 2) / 2,
      originX: 'center',
      originY: 'center',
    });
    this.canvas.remove(obj);
    this.canvas.add(newObj);
    this.canvas.setActiveObject(newObj);
    this._selectedObject = newObj;
    this.canvas.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  updateCircleArc(value: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    const isCircle = obj.isType?.('circle') || obj._shapeType === 'circle';
    if (!isCircle) return;
    this.ed.pushUndoState();
    const clamped = Math.min(Math.max(Math.round(value), 0), 359);
    const sweep = obj._sweep ?? 360;
    const ratio = obj._ratio ?? 0;
    this.replaceCircleShape(obj, clamped, sweep, ratio);
  }

  updateCircleSweep(value: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    const isCircle = obj.isType?.('circle') || obj._shapeType === 'circle';
    if (!isCircle) return;
    this.ed.pushUndoState();
    const clamped = Math.min(Math.max(Math.round(value), 1), 360);
    const arc = obj._arc ?? 0;
    const ratio = obj._ratio ?? 0;
    this.replaceCircleShape(obj, arc, clamped, ratio);
  }

  updateCircleRatio(value: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    const isCircle = obj.isType?.('circle') || obj._shapeType === 'circle';
    if (!isCircle) return;
    this.ed.pushUndoState();
    const clamped = Math.min(Math.max(value, 0), 0.95);
    const arc = obj._arc ?? 0;
    const sweep = obj._sweep ?? 360;
    this.replaceCircleShape(obj, arc, sweep, clamped);
  }

  updateStrokeCap(cap: 'butt' | 'round' | 'square'): void {
    const obj = this._selectedObject;
    if (!obj || !obj.isType || !obj.isType('line')) return;
    this.ed.pushUndoState();
    obj.set('strokeLineCap', cap);
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  updateStrokeJoin(join: 'miter' | 'round' | 'bevel'): void {
    const obj = this._selectedObject;
    if (!obj || !obj.isType || !obj.isType('line')) return;
    this.ed.pushUndoState();
    obj.set('strokeLineJoin', join);
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  updateArrowStart(): void {
    const obj = this._selectedObject;
    if (!obj || !obj.isType || !obj.isType('line')) return;
    this.ed.pushUndoState();
    obj._arrowStart = !obj._arrowStart;
    this.syncArrows(obj);
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  updateArrowEnd(): void {
    const obj = this._selectedObject;
    if (!obj || !obj.isType || !obj.isType('line')) return;
    this.ed.pushUndoState();
    obj._arrowEnd = !obj._arrowEnd;
    this.syncArrows(obj);
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  private syncArrows(obj: any): void {
    if (!obj || !this.canvas || !this.fabric) return;
    const id = obj._id;
    const stroke = obj.stroke || '#000000';
    const sw = obj.strokeWidth || 3;

    const existing = this.canvas.getObjects().filter((o: any) => o._isArrow && o._parentId === id);
    existing.forEach((o: any) => this.canvas?.remove(o));

    const x1 = obj.x1 ?? 0,
      y1 = obj.y1 ?? 0;
    const x2 = obj.x2 ?? 100,
      y2 = obj.y2 ?? 0;
    const dx = x2 - x1,
      dy = y2 - y1;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const arrowSize = sw * 4;

    if (obj._arrowStart) {
      const startPath = `M 0,-${arrowSize} L -${arrowSize * 2},0 L 0,${arrowSize} Z`;
      this.canvas.add(
        new this.fabric.Path(startPath, {
          _isArrow: true,
          _parentId: id,
          selectable: false,
          evented: false,
          left: x1,
          top: y1,
          angle: angle + 180,
          fill: stroke,
          originX: 'center',
          originY: 'center',
        }),
      );
    }

    if (obj._arrowEnd) {
      const endPath = `M 0,-${arrowSize} L ${arrowSize * 2},0 L 0,${arrowSize} Z`;
      this.canvas.add(
        new this.fabric.Path(endPath, {
          _isArrow: true,
          _parentId: id,
          selectable: false,
          evented: false,
          left: x2,
          top: y2,
          angle: angle,
          fill: stroke,
          originX: 'center',
          originY: 'center',
        }),
      );
    }
  }

  private buildPolygonPath(radius: number, sides: number, cornerR: number): string {
    const n = sides;
    const r = Math.min(cornerR, radius * Math.sin(Math.PI / n));
    const verts: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const a = (2 * Math.PI * i) / n - Math.PI / 2;
      verts.push({ x: radius * Math.cos(a), y: radius * Math.sin(a) });
    }
    if (r <= 0) {
      let path = `M ${verts[0].x} ${verts[0].y}`;
      for (let i = 1; i < n; i++) path += ` L ${verts[i].x} ${verts[i].y}`;
      return path + ' Z';
    }
    const starts: { x: number; y: number }[] = [];
    const ends: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const dx = verts[j].x - verts[i].x;
      const dy = verts[j].y - verts[i].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len;
      const uy = dy / len;
      starts.push({ x: verts[i].x + r * ux, y: verts[i].y + r * uy });
      ends.push({ x: verts[j].x - r * ux, y: verts[j].y - r * uy });
    }
    let path = `M ${starts[0].x} ${starts[0].y}`;
    for (let i = 1; i < n; i++) {
      path += ` L ${ends[i - 1].x} ${ends[i - 1].y}`;
      path += ` A ${r} ${r} 0 0 0 ${starts[i].x} ${starts[i].y}`;
    }
    path += ` L ${ends[n - 1].x} ${ends[n - 1].y}`;
    path += ` A ${r} ${r} 0 0 0 ${starts[0].x} ${starts[0].y} Z`;
    return path;
  }

  private replacePolygonShape(obj: any, sides: number, cornerR: number): void {
    if (!this.canvas || !this.fabric) return;
    const radius = Math.min(Math.abs(obj.width || 100), Math.abs(obj.height || 100)) / 2;
    const pathStr = this.buildPolygonPath(radius, sides, cornerR);
    const newObj = new this.fabric.Path(pathStr, {
      _id: obj._id,
      name: obj.name ?? 'Polygon',
      fill: obj.fill ?? '#8b5cf6',
      stroke: obj.stroke ?? '',
      strokeWidth: obj.strokeWidth ?? 0,
      opacity: obj.opacity ?? 1,
      shadow: obj.shadow,
      lockMovementX: obj.lockMovementX,
      lockMovementY: obj.lockMovementY,
      visible: obj.visible,
      angle: obj.angle,
      _sides: sides,
      _cornerRadius: cornerR,
      _shapeType: 'polygon',
    });
    const cx = obj.left + (obj.width || 100) / 2;
    const cy = obj.top + (obj.height || 100) / 2;
    newObj.set({
      left: cx - (newObj.width || radius * 2) / 2,
      top: cy - (newObj.height || radius * 2) / 2,
    });
    this.canvas.remove(obj);
    this.canvas.add(newObj);
    this.canvas.setActiveObject(newObj);
    this._selectedObject = newObj;
    this.canvas.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  updatePolygonSides(value: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    const isPolygon = obj.isType?.('polygon') || obj._shapeType === 'polygon';
    if (!isPolygon) return;
    this.ed.pushUndoState();
    const clamped = Math.min(Math.max(Math.round(value), 3), 24);
    const cornerR = obj._cornerRadius ?? 0;
    this.replacePolygonShape(obj, clamped, Math.min(cornerR, this.maxPolygonCornerRadius()));
  }

  updatePolygonCornerRadius(value: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    const isPolygon = obj.isType?.('polygon') || obj._shapeType === 'polygon';
    if (!isPolygon) return;
    this.ed.pushUndoState();
    const sides = obj._sides ?? 3;
    const clamped = Math.min(Math.max(value, 0), this.maxPolygonCornerRadius());
    this.replacePolygonShape(obj, sides, clamped);
  }

  private buildStarPath(R: number, points: number, ratio: number): string {
    const n = points;
    const r = R * Math.max(0.05, Math.min(0.95, ratio));
    let path = '';
    for (let i = 0; i < n; i++) {
      const outerAngle = (2 * Math.PI * i) / n - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / n;
      const ox = R * Math.cos(outerAngle);
      const oy = R * Math.sin(outerAngle);
      const ix = r * Math.cos(innerAngle);
      const iy = r * Math.sin(innerAngle);
      path += (i === 0 ? 'M' : 'L') + ` ${ox} ${oy}`;
      path += ` L ${ix} ${iy}`;
    }
    return path + ' Z';
  }

  private replaceStarShape(obj: any, points: number, ratio: number): void {
    if (!this.canvas || !this.fabric) return;
    const radius = Math.min(Math.abs(obj.width || 100), Math.abs(obj.height || 100)) / 2;
    const pathStr = this.buildStarPath(radius, points, ratio);
    const newObj = new this.fabric.Path(pathStr, {
      _id: obj._id,
      name: obj.name ?? 'Star',
      fill: obj.fill ?? '#f59e0b',
      stroke: obj.stroke ?? '',
      strokeWidth: obj.strokeWidth ?? 0,
      opacity: obj.opacity ?? 1,
      shadow: obj.shadow,
      lockMovementX: obj.lockMovementX,
      lockMovementY: obj.lockMovementY,
      visible: obj.visible,
      angle: obj.angle,
      _starPoints: points,
      _starRatio: ratio,
      _shapeType: 'star',
    });
    const cx = obj.left + (obj.width || 100) / 2;
    const cy = obj.top + (obj.height || 100) / 2;
    newObj.set({
      left: cx - (newObj.width || radius * 2) / 2,
      top: cy - (newObj.height || radius * 2) / 2,
    });
    this.canvas.remove(obj);
    this.canvas.add(newObj);
    this.canvas.setActiveObject(newObj);
    this._selectedObject = newObj;
    this.canvas.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  updateStarPoints(value: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    const isStar = obj._shapeType === 'star';
    if (!isStar) return;
    this.ed.pushUndoState();
    const clamped = Math.min(Math.max(Math.round(value), 3), 24);
    const ratio = obj._starRatio ?? 0.5;
    this.replaceStarShape(obj, clamped, ratio);
  }

  updateStarRatio(value: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    const isStar = obj._shapeType === 'star';
    if (!isStar) return;
    this.ed.pushUndoState();
    const points = obj._starPoints ?? 5;
    const clamped = Math.min(Math.max(value, 0.05), 0.95);
    this.replaceStarShape(obj, points, clamped);
  }

  applyBlendMode(mode: string): void {
    const obj = this._selectedObject;
    if (!obj) return;
    this.ed.pushUndoState();
    obj.set('globalCompositeOperation', mode);
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  applyLayerBlur(value: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    this.ed.pushUndoState();
    const clamped = Math.min(Math.max(value, 0), 20);
    obj._layerBlur = clamped;
    obj.filters = clamped > 0 ? [new this.fabric.Image.filters.Blur({ blur: clamped / 10 })] : [];
    obj.applyFilters();
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  applyFillType(type: 'solid' | 'linear' | 'radial'): void {
    const obj = this._selectedObject;
    if (!obj) return;
    this.ed.pushUndoState();
    obj._fillType = type;
    this.applyFillToObject(obj);
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  applyGradientColor(index: number, color: string): void {
    const obj = this._selectedObject;
    if (!obj) return;
    this.ed.pushUndoState();
    const colors = [...(obj._gradientColors ?? ['#3b82f6', '#8b5cf6'])];
    colors[index] = color;
    obj._gradientColors = colors;
    this.applyFillToObject(obj);
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  applyGradientAngle(angle: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    this.ed.pushUndoState();
    obj._gradientAngle = angle;
    this.applyFillToObject(obj);
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  applyGradientRadius(radius: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    this.ed.pushUndoState();
    obj._gradientRadius = radius;
    this.applyFillToObject(obj);
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  private applyFillToObject(obj: any): void {
    if (!this.fabric) return;
    const type = obj._fillType ?? 'solid';
    if (type === 'solid') {
      const solidColor = obj._gradientColors?.[0] || obj.fill || '#000000';
      obj.set('fill', solidColor);
      return;
    }

    const colors = obj._gradientColors ?? ['#3b82f6', '#8b5cf6'];
    const colorStops = colors.map((c: string, i: number) => ({
      offset: colors.length === 1 ? 0 : i / (colors.length - 1),
      color: c,
    }));

    if (type === 'linear') {
      const angle = ((obj._gradientAngle ?? 0) * Math.PI) / 180;
      const cos = Math.cos(angle),
        sin = Math.sin(angle);
      const gradient = new this.fabric.Gradient({
        type: 'linear',
        gradientUnits: 'percentage',
        coords: {
          x1: 0.5 - cos * 0.5,
          y1: 0.5 - sin * 0.5,
          x2: 0.5 + cos * 0.5,
          y2: 0.5 + sin * 0.5,
        },
        colorStops,
      });
      obj.set('fill', gradient);
    } else if (type === 'radial') {
      const r = (obj._gradientRadius ?? 50) / 100;
      const gradient = new this.fabric.Gradient({
        type: 'radial',
        gradientUnits: 'percentage',
        coords: { x1: 0.5, y1: 0.5, r1: 0, x2: 0.5, y2: 0.5, r2: r },
        colorStops,
      });
      obj.set('fill', gradient);
    }
  }

  private canfulProperties(): string[] {
    return [
      '_id',
      'name',
      'type',
      'fill',
      'stroke',
      'strokeWidth',
      'opacity',
      'fontFamily',
      'fontSize',
      'fontWeight',
      'fontStyle',
      'textAlign',
      'lineHeight',
      'charSpacing',
      'underline',
      'strikethrough',
      'textBackgroundColor',
      'direction',
      'paragraphSpacing',
      'shadow',
      'width',
      'height',
      'left',
      'top',
      'scaleX',
      'scaleY',
      'angle',
      'visible',
      'lockMovementX',
      'lockMovementY',
      'text',
      'styles',
      'rx',
      'ry',
      '_cornerRx',
      '_cornerRy',
      '_strokeSides',
      '_arc',
      '_sweep',
      '_ratio',
      '_shapeType',
      'strokeLineCap',
      'strokeLineJoin',
      '_arrowStart',
      '_arrowEnd',
      '_sides',
      '_cornerRadius',
      '_starPoints',
      '_starRatio',
      'globalCompositeOperation',
      '_layerBlur',
      '_fillType',
      '_gradientColors',
      '_gradientAngle',
      '_gradientRadius',
    ];
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
    const isInput =
      (e.target as HTMLElement)?.tagName === 'INPUT' ||
      (e.target as HTMLElement)?.tagName === 'TEXTAREA';
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
    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      this.zoomIn();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
      e.preventDefault();
      this.zoomOut();
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
    if (e.key === 'v' && !e.ctrlKey && !e.metaKey) {
      this.ed.toolMode.set('select');
      return;
    }
    if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
      this.ed.toolMode.set('text');
      return;
    }
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
      this.ed.toolMode.set('shape');
      return;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvas();
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
    objs.forEach((o: any) => {
      ids.add(o._id ?? `obj-${Date.now()}`);
      this.applySelectionAppearance(o);
    });
    this.ed.selectedLayerIds.set(ids);
    this.readPropsFromSelected();
    this.ed.syncLayers(this.canvas?.getObjects() ?? []);
    this.updateCanvasCursor();
    this.wireTextSelectionHandler();
    this.canvas?.requestRenderAll();
  }

  private wireTextSelectionHandler(): void {
    this.removeTextSelectionHandler();
    const obj = this._selectedObject;
    if (!obj || !obj.isType || !obj.isType('i-text')) return;

    const handler = () => {
      this._hasTextSelection = obj.selectionStart !== obj.selectionEnd;
      if (this._hasTextSelection) {
        const styles = obj.getSelectionStyles();
        this._selectionProps.update((p) => ({ ...p, ...styles }));
      }
    };

    obj.on('selection:changed', handler);
    this._textSelHandler = () => obj.off('selection:changed', handler);
  }

  private onDeselect(): void {
    this.removeTextSelectionHandler();
    this.clearDragPreview();
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
    if (!obj) {
      this._selectionProps.set({});
      return;
    }
    const sides = obj._strokeSides ?? { top: false, bottom: false, left: false, right: false };
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
      rx: obj.rx ?? 0,
      ry: obj.ry ?? 0,
      cornerRx: obj._cornerRx ?? obj.rx ?? 0,
      cornerRy: obj._cornerRy ?? obj.ry ?? 0,
      strokeTop: sides.top,
      strokeBottom: sides.bottom,
      strokeLeft: sides.left,
      strokeRight: sides.right,
      _arc: obj._arc ?? 0,
      _sweep: obj._sweep ?? 360,
      _ratio: obj._ratio ?? 0,
      strokeLineCap: obj.strokeLineCap ?? 'butt',
      strokeLineJoin: obj.strokeLineJoin ?? 'miter',
      _arrowStart: !!obj._arrowStart,
      _arrowEnd: !!obj._arrowEnd,
      _sides: obj._sides ?? 3,
      _cornerRadius: obj._cornerRadius ?? 0,
      _starPoints: obj._starPoints ?? 5,
      _starRatio: obj._starRatio ?? 0.5,
      globalCompositeOperation: obj.globalCompositeOperation ?? 'source-over',
      _layerBlur: obj._layerBlur ?? 0,
      _fillType: obj._fillType ?? 'solid',
      _gradientColors: obj._gradientColors ?? ['#3b82f6', '#8b5cf6'],
      _gradientAngle: obj._gradientAngle ?? 0,
      _gradientRadius: obj._gradientRadius ?? 50,
    });
  }

  private applySelectionAppearance(target: any): void {
    if (!target || !this.fabric) return;
    target.set({
      transparentCorners: false,
      cornerColor: '#ffffff',
      cornerStrokeColor: '#2563eb',
      cornerSize: 10,
      cornerStyle: 'circle',
      borderColor: '#2563eb',
      borderScaleFactor: 1.25,
      padding: 7,
      borderOpacityWhenMoving: 0.95,
      hasBorders: true,
      hasControls: true,
      objectCaching: false,
      strokeUniform: true,
      shadow: new this.fabric.Shadow({
        color: 'rgba(15, 23, 42, 0.18)',
        blur: 12,
        offsetX: 0,
        offsetY: 4,
      }),
    });
    target.setCoords();
  }

  private showDragPreview(target: any): void {
    if (!this.canvas || !this.fabric || !target) return;
    this.clearDragPreview();

    const applyPreview = (preview: any): void => {
      if (!preview || typeof preview.set !== 'function') return;
      preview.set({
        left: target.left,
        top: target.top,
        opacity: 0.28,
        evented: false,
        selectable: false,
        hasControls: false,
        hasBorders: false,
        lockMovementX: true,
        lockMovementY: true,
        shadow: new this.fabric.Shadow({
          color: 'rgba(37, 99, 235, 0.24)',
          blur: 16,
          offsetX: 0,
          offsetY: 8,
        }),
        _isDragPreview: true,
      });
      preview.setCoords();
      this.canvas.add(preview);
      this._dragPreview = preview;
      this.canvas.requestRenderAll();
    };

    try {
      const cloneResult = target.clone((cloned: any) => applyPreview(cloned));
      if (cloneResult && typeof cloneResult.set === 'function') {
        applyPreview(cloneResult);
      }
    } catch {
      const fallback = target.toObject?.();
      if (fallback) {
        const preview = new this.fabric.Object(fallback);
        applyPreview(preview);
      }
    }
  }

  private clearDragPreview(): void {
    if (!this.canvas || !this._dragPreview) return;
    this.canvas.remove(this._dragPreview);
    this._dragPreview = null;
    this.canvas.requestRenderAll();
  }

  private updateCanvasCursor(): void {
    if (!this.canvas) return;
    const mode = this.ed.toolMode();
    if (this.isPanning || this.panKeyPressed) {
      this.canvas.defaultCursor = 'grab';
      this.canvas.hoverCursor = 'grab';
      this.canvas.moveCursor = 'grabbing';
      this.canvas.renderAll();
      return;
    }

    const cursors: Record<string, string> = {
      select: 'default',
      text: 'text',
      shape: 'crosshair',
      image: 'crosshair',
      upload: 'crosshair',
      templates: 'default',
      ai: 'default',
    };
    this.canvas.defaultCursor = cursors[mode] ?? 'default';
    this.canvas.hoverCursor = cursors[mode] ?? 'default';
    this.canvas.moveCursor = cursors[mode] ?? 'default';
    this.canvas.renderAll();
  }

  private getCanvasCenter(): { x: number; y: number } {
    if (!this.canvas) return { x: 400, y: 300 };
    const page = this.currentPage();
    if (page) {
      return { x: page.x + page.width / 2, y: page.y + page.height / 2 };
    }
    return { x: this.canvas.getWidth() / 2, y: this.canvas.getHeight() / 2 };
  }

  private applySnapping(target: any): { left: number; top: number } {
    if (!target || !this.canvas) {
      return { left: target?.left ?? 0, top: target?.top ?? 0 };
    }

    const gridSize = 20;
    const threshold = 12;
    const page = this.currentPage();
    const margin = page?.margin ?? 96;
    const bounds = target.getBoundingRect();
    let left = target.left;
    let top = target.top;

    if (this.snapToGridEnabled()) {
      left = Math.round(left / gridSize) * gridSize;
      top = Math.round(top / gridSize) * gridSize;
    }

    if (this.snapToObjectsEnabled()) {
      const candidatesX: number[] = [];
      const candidatesY: number[] = [];

      if (page) {
        candidatesX.push(page.x + margin, page.x + page.width - margin, page.x + page.width / 2);
        candidatesY.push(page.y + margin, page.y + page.height - margin, page.y + page.height / 2);
      }

      this.canvas.getObjects().forEach((obj: any) => {
        if (obj === target || obj._isPageGuide || obj._isGrid || obj._isGuideOverlay) return;
        const objBounds = obj.getBoundingRect();
        const centerX = objBounds.left + objBounds.width / 2;
        const centerY = objBounds.top + objBounds.height / 2;
        candidatesX.push(objBounds.left, objBounds.left + objBounds.width, centerX);
        candidatesY.push(objBounds.top, objBounds.top + objBounds.height, centerY);
      });

      left = this.snapToNearest(left, candidatesX, threshold, bounds.width);
      top = this.snapToNearest(top, candidatesY, threshold, bounds.height);
    }

    return { left, top };
  }

  private snapToNearest(
    value: number,
    candidates: number[],
    threshold: number,
    size: number,
  ): number {
    let snapped = value;
    let nearestDistance = threshold + 1;

    candidates.forEach((candidate) => {
      const distance = Math.abs(value - candidate);
      const distanceToEdge = Math.abs(value + size - candidate);
      const effectiveDistance = Math.min(distance, distanceToEdge);
      if (effectiveDistance < nearestDistance) {
        snapped = candidate;
        nearestDistance = effectiveDistance;
      }
    });

    return nearestDistance <= threshold ? snapped : value;
  }

  private updateGrid(): void {
    if (!this.canvas || !this.fabric) return;
    const existing = this.canvas.getObjects().filter((o: any) => o._isGrid);
    existing.forEach((o: any) => this.canvas?.remove(o));

    if (this.ed.gridVisible()) {
      const gs = 20;
      const cw = 6000;
      const ch = 4000;

      for (let i = 0; i <= cw; i += gs) {
        this.canvas.add(
          new this.fabric.Line([i, 0, i, ch], {
            _isGrid: true,
            selectable: false,
            evented: false,
            stroke: '#c0c0c0',
            strokeWidth: i % 100 === 0 ? 0.8 : 0.3,
            opacity: 0.2,
          }),
        );
      }
      for (let i = 0; i <= ch; i += gs) {
        this.canvas.add(
          new this.fabric.Line([0, i, cw, i], {
            _isGrid: true,
            selectable: false,
            evented: false,
            stroke: '#c0c0c0',
            strokeWidth: i % 100 === 0 ? 0.8 : 0.3,
            opacity: 0.2,
          }),
        );
      }

      const gridLines = this.canvas.getObjects().filter((o: any) => o._isGrid);
      gridLines.forEach((o: any) => {
        if (this.canvas && typeof this.canvas.sendToBack === 'function') {
          this.canvas.sendToBack(o);
        }
      });
    }
    this.canvas.renderAll();
  }

  toggleGrid(): void {
    this.ed.gridVisible.update((v) => !v);
    this.updateGrid();
  }

  togglePageMargins(): void {
    this.pageMarginsVisible.update((value) => !value);
    this.renderPageGuides();
  }

  toggleSnapToGrid(): void {
    this.snapToGridEnabled.update((value) => !value);
  }

  toggleSnapToObjects(): void {
    this.snapToObjectsEnabled.update((value) => !value);
    this.renderGuidesForObject(this._selectedObject);
  }

  toggleGridView(): void {
    this.gridView.update((value) => !value);
    this.renderPageGuides();
  }

  toggleRulers(): void {
    this.rulersVisible.update((value) => !value);
    this.renderPageGuides();
  }

  toggleGuides(): void {
    this.guidesVisible.update((value) => !value);
    this.renderPageGuides();
    this.renderGuidesForObject(this._selectedObject);
  }

  toggleSmartGuides(): void {
    this.smartGuidesEnabled.update((value) => !value);
    this.renderGuidesForObject(this._selectedObject);
  }

  movePage(fromIndex: number, direction: -1 | 1): void {
    if (fromIndex < 0 || fromIndex >= this.pages().length) return;
    const targetIndex = fromIndex + direction;
    if (targetIndex < 0 || targetIndex >= this.pages().length) return;

    const items = [...this.pages()];
    const [page] = items.splice(fromIndex, 1);
    items.splice(targetIndex, 0, page);
    this.pages.set(items);
    if (this.currentPageIndex() === fromIndex) {
      this.currentPageIndex.set(targetIndex);
    } else {
      this.currentPageIndex.update((index) => (index === targetIndex ? fromIndex : index));
    }
    this.renderPageGuides();
    this.centerOnPage(this.currentPage());
  }

  addPage(): void {
    const nextIndex = this.pages().length;
    const page = {
      id: `page-${Date.now()}`,
      name: `Page ${nextIndex + 1}`,
      x: (nextIndex % 3) * 1800,
      y: Math.floor(nextIndex / 3) * 1200,
      width: 1400,
      height: 900,
      margin: 120,
    };
    this.pages.update((items) => [...items, page]);
    this.currentPageIndex.set(this.pages().length - 1);
    this.renderPageGuides();
    this.centerOnPage(page);
  }

  duplicatePage(): void {
    const current = this.currentPage();
    if (!current) return;

    const duplicate = {
      ...current,
      id: `page-${Date.now()}`,
      name: `${current.name} Copy`,
      x: current.x + 220,
      y: current.y + 220,
      margin: current.margin ?? 120,
    };

    this.pages.update((items) => [...items, duplicate]);
    this.currentPageIndex.set(this.pages().length - 1);
    this.renderPageGuides();
    this.centerOnPage(duplicate);
  }

  deletePage(): void {
    if (this.pages().length <= 1) return;

    const currentIndex = this.currentPageIndex();
    const nextPages = this.pages().filter((_, index) => index !== currentIndex);
    const nextIndex = Math.min(currentIndex, nextPages.length - 1);

    this.pages.set(nextPages);
    this.currentPageIndex.set(nextIndex);
    this.renderPageGuides();
    this.centerOnPage(this.currentPage());
  }

  previousPage(): void {
    this.currentPageIndex.update((index) => Math.max(0, index - 1));
    this.centerOnPage(this.currentPage());
  }

  nextPage(): void {
    this.currentPageIndex.update((index) => Math.min(this.pages().length - 1, index + 1));
    this.centerOnPage(this.currentPage());
  }

  private renderPageGuides(): void {
    if (!this.canvas || !this.fabric) return;
    const existing = this.canvas.getObjects().filter((obj: any) => obj._isPageGuide);
    existing.forEach((obj: any) => this.canvas.remove(obj));

    this.pages().forEach((page) => {
      const isCurrent = page.id === this.currentPage().id;
      const rect = new this.fabric.Rect({
        left: page.x,
        top: page.y,
        width: page.width,
        height: page.height,
        fill: 'rgba(59, 130, 246, 0.04)',
        stroke: isCurrent ? '#60a5fa' : 'rgba(255,255,255,0.16)',
        strokeWidth: isCurrent ? 2 : 1,
        rx: 16,
        ry: 16,
        selectable: false,
        evented: false,
        _isPageGuide: true,
      });
      if (this.pageMarginsVisible()) {
        const margin = page.margin ?? 96;
        const marginRect = new this.fabric.Rect({
          left: page.x + margin,
          top: page.y + margin,
          width: page.width - margin * 2,
          height: page.height - margin * 2,
          fill: 'transparent',
          stroke: isCurrent ? '#38bdf8' : 'rgba(56, 189, 248, 0.38)',
          strokeWidth: 1,
          strokeDashArray: [6, 6],
          selectable: false,
          evented: false,
          _isPageGuide: true,
        });
        this.canvas.add(marginRect);
      }
      const label = new this.fabric.Text(page.name, {
        left: page.x + 18,
        top: page.y + 16,
        fontSize: 13,
        fill: isCurrent ? '#60a5fa' : '#b6b6bf',
        fontWeight: '600',
        selectable: false,
        evented: false,
        _isPageGuide: true,
      });
      if (this.rulersVisible()) {
        const topRuler = new this.fabric.Line(
          [page.x, page.y - 8, page.x + page.width, page.y - 8],
          {
            stroke: '#93c5fd',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            _isPageGuide: true,
          },
        );
        const leftRuler = new this.fabric.Line(
          [page.x - 8, page.y, page.x - 8, page.y + page.height],
          {
            stroke: '#93c5fd',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            _isPageGuide: true,
          },
        );
        this.canvas.add(topRuler);
        this.canvas.add(leftRuler);
      }
      this.canvas.add(rect);
      this.canvas.add(label);
    });
    this.canvas.requestRenderAll();
  }

  private renderGuidesForObject(target: any): void {
    if (!this.canvas || !this.fabric || !this.guidesVisible()) return;

    const existing = this.canvas.getObjects().filter((obj: any) => obj._isGuideOverlay);
    existing.forEach((obj: any) => this.canvas.remove(obj));

    if (!target || !this.smartGuidesEnabled()) return;

    const bounds = target.getBoundingRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const page = this.currentPage();

    const guideLines: Array<{ points: [number, number, number, number]; color: string }> = [];
    const addGuide = (points: [number, number, number, number], color: string): void => {
      guideLines.push({ points, color });
    };

    if (page) {
      addGuide([page.x, centerY, page.x + page.width, centerY], '#38bdf8');
      addGuide([centerX, page.y, centerX, page.y + page.height], '#38bdf8');
      addGuide(
        [page.x + page.width / 2, page.y, page.x + page.width / 2, page.y + page.height],
        '#f59e0b',
      );
      addGuide(
        [page.x, page.y + page.height / 2, page.x + page.width, page.y + page.height / 2],
        '#f59e0b',
      );
    }

    const objects = this.canvas
      .getObjects()
      .filter((obj: any) => obj !== target && !obj._isPageGuide);
    objects.forEach((obj: any) => {
      const otherBounds = obj.getBoundingRect();
      const edges = [
        { key: 'top', value: otherBounds.top },
        { key: 'bottom', value: otherBounds.top + otherBounds.height },
        { key: 'centerY', value: otherBounds.top + otherBounds.height / 2 },
        { key: 'left', value: otherBounds.left },
        { key: 'right', value: otherBounds.left + otherBounds.width },
        { key: 'centerX', value: otherBounds.left + otherBounds.width / 2 },
      ];

      const verticalMatches =
        edges.some((edge) => Math.abs(edge.value - bounds.left) < 8) ||
        edges.some((edge) => Math.abs(edge.value - (bounds.left + bounds.width)) < 8) ||
        edges.some((edge) => Math.abs(edge.value - centerX) < 8);
      const horizontalMatches =
        edges.some((edge) => Math.abs(edge.value - bounds.top) < 8) ||
        edges.some((edge) => Math.abs(edge.value - (bounds.top + bounds.height)) < 8) ||
        edges.some((edge) => Math.abs(edge.value - centerY) < 8);

      if (verticalMatches) {
        addGuide(
          [
            otherBounds.left + otherBounds.width / 2,
            page?.y ?? 0,
            otherBounds.left + otherBounds.width / 2,
            (page?.y ?? 0) + (page?.height ?? 0),
          ],
          '#38bdf8',
        );
      }
      if (horizontalMatches) {
        addGuide(
          [
            page?.x ?? 0,
            otherBounds.top + otherBounds.height / 2,
            (page?.x ?? 0) + (page?.width ?? 0),
            otherBounds.top + otherBounds.height / 2,
          ],
          '#f59e0b',
        );
      }
    });

    guideLines.forEach((guide, index) => {
      const line = new this.fabric.Line(guide.points, {
        stroke: guide.color,
        strokeWidth: index % 2 === 0 ? 1.5 : 1,
        selectable: false,
        evented: false,
        opacity: 0.95,
        _isGuideOverlay: true,
      });
      this.canvas.add(line);
    });

    this.canvas.requestRenderAll();
  }

  private centerOnPage(page: any): void {
    if (!this.canvas || !page) return;
    const centerX = page.x + page.width / 2;
    const centerY = page.y + page.height / 2;
    const viewportWidth = this.canvas.getWidth();
    const viewportHeight = this.canvas.getHeight();
    const zoom = this.ed.zoom();
    const panX = viewportWidth / 2 - centerX * zoom;
    const panY = viewportHeight / 2 - centerY * zoom;
    this.canvas.setViewportTransform([zoom, 0, 0, zoom, panX, panY]);
    this.canvas.requestRenderAll();
    this.renderPageGuides();
  }

  toggleSnap(): void {
    this.ed.snapEnabled.update((v) => !v);
  }

  save(): void {
    this.ed.saveProject().subscribe({
      next: () => {
        this.ed.saveState.set('saved');
        this.ed.dirty.set(false);
      },
      error: () => this.ed.saveState.set('failed'),
    });
  }

  loadAssets(query?: string): void {
    this.loadingAssets.set(true);
    const params: Record<string, any> = { limit: 24 };
    if (query) params['q'] = query;
    this.marketplace.getAssets(params).subscribe({
      next: (res) => {
        this.assets.set(res.data.filter((a) => a.previewUrl));
        this.loadingAssets.set(false);
      },
      error: () => this.loadingAssets.set(false),
    });
  }

  searchAssets(query: string): void {
    this.assetsSearchQuery = query;
    this.loadAssets(query);
  }

  onImageDragStart(e: DragEvent, url: string): void {
    e.dataTransfer?.setData('text/plain', url);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
  }

  onImageClick(url: string): void {
    this.addImage(url);
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
        obj = new this.fabric.Circle({
          _id: id,
          name: 'Circle',
          left: c.x - 50,
          top: c.y - 50,
          radius: 50,
          fill: '#3b82f6',
          _arc: 0,
          _sweep: 360,
          _ratio: 0,
        });
        break;
      case 'polygon': {
        const r = 50;
        const pStr = this.buildPolygonPath(r, 3, 0);
        obj = new this.fabric.Path(pStr, {
          _id: id,
          name: 'Polygon',
          fill: '#8b5cf6',
          _sides: 3,
          _cornerRadius: 0,
          _shapeType: 'polygon',
        });
        obj.set({ left: c.x - (obj.width || r * 2) / 2, top: c.y - (obj.height || r * 2) / 2 });
        break;
      }
      case 'star': {
        const sR = 50;
        const sStr = this.buildStarPath(sR, 5, 0.5);
        obj = new this.fabric.Path(sStr, {
          _id: id,
          name: 'Star',
          fill: '#f59e0b',
          _starPoints: 5,
          _starRatio: 0.5,
          _shapeType: 'star',
        });
        obj.set({ left: c.x - (obj.width || sR * 2) / 2, top: c.y - (obj.height || sR * 2) / 2 });
        break;
      }
      case 'line':
        obj = new this.fabric.Line([c.x - 100, c.y, c.x + 100, c.y], {
          _id: id,
          name: 'Line',
          stroke: '#e94560',
          strokeWidth: 3,
          strokeLineCap: 'butt',
          strokeLineJoin: 'miter',
          _arrowStart: false,
          _arrowEnd: false,
        });
        break;
      default:
        obj = new this.fabric.Rect({
          _id: id,
          name: 'Rectangle',
          left: c.x - 60,
          top: c.y - 40,
          width: 120,
          height: 80,
          fill: '#22c55e',
          rx: 0,
          ry: 0,
          _cornerRx: 0,
          _cornerRy: 0,
          _strokeSides: { top: false, bottom: false, left: false, right: false },
        });
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
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        alert('Unsupported format. Use PNG, JPEG, WebP, or SVG.');
        return;
      }
      if (file.size > this.FILE_SIZE_LIMIT) {
        alert('File too large (max 10 MB).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => this.addImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  }

  private addImage(url: string, dropX?: number, dropY?: number): void {
    if (!this.canvas || !this.fabric) return;
    this.ed.pushUndoState();
    void this.loadFabricImage(url, true).then((img) => {
      if (!img) return;
      const maxW = 300;
      const maxH = 300;
      const scale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1), 1);
      let left: number;
      let top: number;
      if (dropX != null && dropY != null) {
        left = dropX - (img.width * scale) / 2;
        top = dropY - (img.height * scale) / 2;
      } else {
        const c = this.getCanvasCenter();
        left = c.x - (img.width * scale) / 2;
        top = c.y - (img.height * scale) / 2;
      }
      img.set({
        _id: `img-${Date.now()}`,
        name: 'Image',
        left,
        top,
        scaleX: scale,
        scaleY: scale,
      });
      this.canvas!.add(img);
      this.canvas!.setActiveObject(img);
      this.canvas!.renderAll();
      this.onSelect({ target: img });
      this.ed.toolMode.set('select');
      this.updateCanvasCursor();
    });
  }

  private async loadFabricImage(
    url: string,
    tryAnonymousCrossOrigin: boolean,
  ): Promise<any | null> {
    if (!this.fabric) return null;
    try {
      const options = tryAnonymousCrossOrigin ? { crossOrigin: 'anonymous' } : {};
      return await this.fabric.Image.fromURL(url, options);
    } catch {
      if (tryAnonymousCrossOrigin) {
        return this.loadFabricImage(url, false);
      }
      return null;
    }
  }

  deleteSelected(): void {
    const active = this.canvas?.getActiveObjects();
    if (!active || !active.length) return;
    this.ed.pushUndoState();
    const ids = new Set(active.map((o: any) => o._id));
    const helpers = this.canvas!.getObjects().filter(
      (o: any) => (o._isStrokeSide || o._isArrow) && ids.has(o._parentId),
    );
    helpers.forEach((o: any) => this.canvas?.remove(o));
    active.forEach((o: any) => this.canvas?.remove(o));
    this.canvas?.discardActiveObject();
    this.canvas?.renderAll();
    this.onDeselect();
  }

  setZoom(level: number, origin?: { x: number; y: number }): void {
    if (!this.canvas) return;
    const safeLevel = Math.max(0.1, Math.min(5, level));
    this.ed.zoom.set(safeLevel);
    const point = origin ?? this.getCanvasCenter();
    this.canvas.zoomToPoint(point, safeLevel);
    this.canvas.requestRenderAll();
  }

  zoomIn(): void {
    this.setZoom(Math.min(this.ed.zoom() + 0.1, 5));
  }

  zoomOut(): void {
    this.setZoom(Math.max(this.ed.zoom() - 0.1, 0.1));
  }

  zoomToFit(): void {
    this.zoomToObjects(this.canvas?.getObjects?.() ?? []);
  }

  zoomToSelection(): void {
    const selected = this.canvas?.getActiveObjects?.() ?? [];
    if (selected.length) {
      this.zoomToObjects(selected);
      return;
    }
    this.zoomToObjects(this.canvas?.getObjects?.() ?? []);
  }

  private zoomToObjects(objects: any[]): void {
    if (!this.canvas || !this.fabric) return;

    const visibleObjects = (objects || []).filter((obj: any) => {
      if (!obj || obj.visible === false) return false;
      if (obj._isGrid || obj._isStrokeSide || obj._isArrow) return false;
      return true;
    });

    if (!visibleObjects.length) {
      this.setZoom(1);
      return;
    }

    let minLeft = Number.POSITIVE_INFINITY;
    let minTop = Number.POSITIVE_INFINITY;
    let maxRight = Number.NEGATIVE_INFINITY;
    let maxBottom = Number.NEGATIVE_INFINITY;

    visibleObjects.forEach((obj: any) => {
      const rect = obj.getBoundingRect(true, true);
      minLeft = Math.min(minLeft, rect.left);
      minTop = Math.min(minTop, rect.top);
      maxRight = Math.max(maxRight, rect.left + rect.width);
      maxBottom = Math.max(maxBottom, rect.top + rect.height);
    });

    if (!Number.isFinite(minLeft) || !Number.isFinite(minTop)) {
      this.setZoom(1);
      return;
    }

    const width = Math.max(1, maxRight - minLeft);
    const height = Math.max(1, maxBottom - minTop);
    const padding = 40;
    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();
    const scaleX = (canvasWidth - padding * 2) / width;
    const scaleY = (canvasHeight - padding * 2) / height;
    const nextZoom = Math.max(0.1, Math.min(5, Math.min(scaleX, scaleY)));
    const centerX = minLeft + width / 2;
    const centerY = minTop + height / 2;
    const panX = canvasWidth / 2 - centerX * nextZoom;
    const panY = canvasHeight / 2 - centerY * nextZoom;

    this.ed.zoom.set(nextZoom);
    this.canvas.setViewportTransform([nextZoom, 0, 0, nextZoom, panX, panY]);
    this.canvas.requestRenderAll();
  }

  undo(): void {
    this.ed.undo();
  }
  redo(): void {
    this.ed.redo();
  }

  onLayerSelect(id: string): void {
    const obj = this.canvas?.getObjects().find((o: any) => o._id === id);
    if (obj) {
      this.canvas?.discardActiveObject();
      this.canvas?.setActiveObject(obj);
      this.canvas?.renderAll();
      this.onSelect({ target: obj });
    }
  }

  createLayer(): void {
    if (!this.canvas || !this.fabric) return;
    this.ed.pushUndoState();
    const id = `layer-${Date.now()}`;
    const layer = new this.fabric.Rect({
      _id: id,
      name: 'New Layer',
      left: 180,
      top: 180,
      width: 120,
      height: 80,
      fill: '#3b82f6',
      opacity: 1,
    });
    this.canvas.add(layer);
    this.canvas.setActiveObject(layer);
    this.canvas.renderAll();
    this.onSelect({ target: layer });
    this.ed.setDirty();
  }

  startRenameLayer(id: string): void {
    const obj = this.canvas?.getObjects().find((o: any) => o._id === id);
    if (!obj) return;
    this.layerActionTarget.set(id);
    this.layerRenameValue.set(obj.name ?? 'Layer');
  }

  commitRenameLayer(): void {
    const id = this.layerActionTarget();
    if (!id) return;
    const obj = this.canvas?.getObjects().find((o: any) => o._id === id);
    if (!obj) return;
    const nextName = (this.layerRenameValue() || 'Layer').trim();
    if (!nextName) return;
    obj.name = nextName;
    this.layerActionTarget.set(null);
    this.layerRenameValue.set('');
    this.canvas?.renderAll();
    this.onModify();
  }

  cancelRenameLayer(): void {
    this.layerActionTarget.set(null);
    this.layerRenameValue.set('');
  }

  duplicateLayer(id: string): void {
    const obj = this.canvas?.getObjects().find((o: any) => o._id === id);
    if (!obj || !this.canvas || !this.fabric) return;
    this.ed.pushUndoState();
    const clone = obj.clone();
    clone.set({
      _id: `layer-${Date.now()}`,
      name: `${obj.name ?? 'Layer'} Copy`,
      left: (obj.left ?? 0) + 24,
      top: (obj.top ?? 0) + 24,
      opacity: obj.opacity ?? 1,
    });
    clone.setCoords();
    this.canvas.add(clone);
    this.canvas.setActiveObject(clone);
    this.canvas.renderAll();
    this.onSelect({ target: clone });
    this.ed.setDirty();
  }

  toggleLayerVisibility(id: string): void {
    const obj = this.canvas?.getObjects().find((o: any) => o._id === id);
    if (obj) {
      const nextVisible = !obj.visible;
      obj.set?.({ visible: nextVisible });
      obj.visible = nextVisible;
      obj.selectable = nextVisible && !obj.lockMovementX;
      obj.evented = nextVisible;
      this.canvas?.renderAll();
      this.onModify();
    }
  }

  toggleLayerLock(id: string): void {
    const obj = this.canvas?.getObjects().find((o: any) => o._id === id);
    if (obj) {
      const locked = !obj.lockMovementX;
      obj.set?.({
        lockMovementX: locked,
        lockMovementY: locked,
        lockRotation: locked,
        lockScalingX: locked,
        lockScalingY: locked,
      });
      obj.lockMovementX = locked;
      obj.lockMovementY = locked;
      obj.lockRotation = locked;
      obj.lockScalingX = locked;
      obj.lockScalingY = locked;
      obj.selectable = obj.visible && !locked;
      obj.evented = obj.visible && !locked;
      this.canvas?.renderAll();
      this.onModify();
    }
  }

  setLayerOpacity(id: string, value: number): void {
    const obj = this.canvas?.getObjects().find((o: any) => o._id === id);
    if (!obj) return;
    const nextOpacity = Math.max(0, Math.min(1, value));
    obj.set?.({ opacity: nextOpacity });
    obj.opacity = nextOpacity;
    this.canvas?.renderAll();
    this.onModify();
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
    this._selectionProps.update((p) => {
      const shadow = { ...(p['shadow'] || {}), [key]: value };
      return { ...p, shadow };
    });
    this.updateShadow();
  }

  onFileDrop(e: DragEvent): void {
    e.preventDefault();
    const url = e.dataTransfer?.getData('text/plain');
    if (url) {
      try {
        const pt = this.canvas?.getPointer(e);
        if (pt && pt.x != null && pt.y != null) {
          this.addImage(this.normalizeImageUrl(url), pt.x, pt.y);
          return;
        }
      } catch {}
      this.addImage(this.normalizeImageUrl(url));
      return;
    }
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return;
    }
    if (file.size > this.FILE_SIZE_LIMIT) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => this.addImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  private normalizeImageUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return new URL(url, window.location.origin).toString();
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

  exportDesign(format: ExportFormat): void {
    this._exportFormat = format;
    this.ed.exportProject(format, {
      quality: this.exportQuality,
      transparent: this.exportTransparent,
    });
  }

  setExportQuality(value: number): void {
    this.exportQuality = Math.min(Math.max(Math.round(value), 10), 100);
  }

  toggleExportTransparent(): void {
    this.exportTransparent = !this.exportTransparent;
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

  toggleLeftPanel(): void {
    this.leftPanelCollapsed.update((v) => !v);
    requestAnimationFrame(() => this.resizeCanvas());
  }

  toggleRightPanel(): void {
    this.rightPanelCollapsed.update((v) => !v);
    requestAnimationFrame(() => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    if (!this.canvas || !this.canvasAreaRef) return;
    const container = this.canvasAreaRef.nativeElement;
    const w = Math.max(Math.min(container.clientWidth, 1200), 400);
    const h = Math.max(Math.min(container.clientHeight, 800), 300);
    if (this.canvas.getWidth() === w && this.canvas.getHeight() === h) return;

    this.canvas.setDimensions({ width: w, height: h });
    this.canvas.requestRenderAll();
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.canvasAreaRef?.nativeElement) {
      this.canvasAreaRef.nativeElement.removeEventListener('wheel', this.canvasWheelHandler);
      this.canvasAreaRef.nativeElement.removeEventListener(
        'mousedown',
        this.canvasMouseDownHandler,
      );
    }
    window.removeEventListener('mousemove', this.canvasMouseMoveHandler);
    window.removeEventListener('mouseup', this.canvasMouseUpHandler);
    window.removeEventListener('keydown', this.windowKeyDownHandler);
    window.removeEventListener('keyup', this.windowKeyUpHandler);
    this.ed.stopAutosave();
    this.removeTextSelectionHandler();
    this.clearDragPreview();
    this.canvas?.dispose?.();
    this.canvas = null;
    this._aiStatusEffect?.destroy();
  }
}
