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
import { jsPDF } from 'jspdf';

type TemplateCategory = 'All' | 'Social Media' | 'Poster' | 'Business' | 'Event' | 'Print';

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
  // Hide page guide borders by default for a more infinite-canvas feel
  readonly pageMarginsVisible = signal(false);
  readonly snapToGridEnabled = signal(true);
  readonly snapToObjectsEnabled = signal(true);

  // ── Draw / Pencil tool (Canva / Freepik / PosterMyWall) ──────────
  readonly drawBrushSize = signal(14);
  readonly drawBrushColor = signal('#1a1a2e');
  readonly drawErase = signal(false);

  // ── Presentation / Fullscreen mode ───────────────────────────────
  readonly presentationMode = signal(false);

  // ── Aspect-ratio lock (Vistaprint / Canva) ────────────────────────
  readonly aspectLocked = signal(false);
  private _lockedAspectRatio = 1;

  readonly projectTitle = computed(() => this.ed.project()?.title ?? 'Untitled');
  readonly assets = signal<Asset[]>([]);
  readonly loadingAssets = signal(false);
  readonly layerSearchQuery = signal('');
  readonly filteredLayers = computed(() => {
    const query = this.layerSearchQuery().trim().toLowerCase();
    if (!query) {
      return this.layers();
    }

    return this.layers().filter((layer) => {
      return layer.name.toLowerCase().includes(query) || layer.type.toLowerCase().includes(query);
    });
  });
  readonly layerCountLabel = computed(() => {
    const total = this.layers().length;
    const visible = this.filteredLayers().length;
    return this.layerSearchQuery().trim().length ? `${visible} / ${total}` : `${total}`;
  });
  // Use a single very large page so the editor feels endless while keeping
  // export/print dimensions manageable when needed.
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
    // 10k x 8k gives a very large working area; adjust if you want larger/smaller
    { id: 'page-1', name: 'Canvas', x: 0, y: 0, width: 10000, height: 8000, margin: 120 },
  ]);
  readonly currentPageIndex = signal(0);
  readonly currentPage = computed(() => this.pages()[this.currentPageIndex()] ?? this.pages()[0]);
  readonly currentPageLabel = computed(() => this.currentPage()?.name ?? 'Page 1');
  assetsSearchQuery = '';

  // ── Expose Math for template expressions ─────────────
  readonly Math = Math;

  // ── Left panel tab navigation (Canva-style) ───────────
  readonly leftPanelTab = signal<'layers'|'templates'|'elements'|'photos'|'text'|'background'>('layers');

  // ── Canvas size dialog (Vistaprint / Canva) ───────────
  readonly showSizeDialog = signal(false);
  readonly customWidth = signal(800);
  readonly customHeight = signal(600);

  // ── Shortcuts modal ───────────────────────────────────
  readonly showShortcutsModal = signal(false);

  // ── Safe zone / bleed (Vistaprint) ────────────────────
  readonly showSafeZone = signal(false);

  // ── Stock photos (Unsplash) ───────────────────────────
  readonly photoQuery = signal('');
  readonly photoResults = signal<{id:string;thumb:string;url:string;alt:string;author:string;tags?:string}[]>([]);
  readonly photoSearching = signal(false);

  // ── Toast notifications ───────────────────────────────
  readonly toasts = signal<{id: number; message: string; type: 'info' | 'error' | 'success'}[]>([]);
  private _toastCounter = 0;

  // ── Clipboard (copy/paste) ────────────────────────────
  private _clipboard: any[] = [];

  // ── Right-click context menu ─────────────────────────
  readonly ctxMenu = signal<{
    visible: boolean; x: number; y: number;
    hasSelection: boolean; selCount: number;
    objType: string; isLocked: boolean; isGroup: boolean;
    isText: boolean; isImage: boolean; hasClipboard: boolean;
  }>({ visible: false, x: 0, y: 0, hasSelection: false, selCount: 0, objType: '', isLocked: false, isGroup: false, isText: false, isImage: false, hasClipboard: false });

  // ── Floating quick-action toolbar ────────────────────
  readonly floatBar = signal<{
    visible: boolean; x: number; y: number;
    isText: boolean; isImage: boolean; isGroup: boolean;
    isLocked: boolean; selCount: number;
    isBold: boolean; isItalic: boolean;
  }>({ visible: false, x: 0, y: 0, isText: false, isImage: false, isGroup: false, isLocked: false, selCount: 0, isBold: false, isItalic: false });

  // ── Recently used colors (Dribbble / Canva) ───────────
  readonly recentColors = signal<string[]>([]);

  // ── Image adjustments (Magnific / Canva) ──────────────
  readonly imgBrightness = signal(0);
  readonly imgContrast = signal(0);
  readonly imgSaturation = signal(0);
  readonly imgHue = signal(0);
  readonly activeImageFilter = signal('Normal');

  // ── Canvas size presets (Vistaprint / Canva / PosterMyWall) ──
  readonly canvasPresets = [
    { label: 'Instagram Post',     w: 1080, h: 1080, tag: 'Social' },
    { label: 'Instagram Story',    w: 1080, h: 1920, tag: 'Social' },
    { label: 'Facebook Post',      w: 1200, h: 630,  tag: 'Social' },
    { label: 'Twitter / X Post',   w: 1600, h: 900,  tag: 'Social' },
    { label: 'YouTube Thumbnail',  w: 1280, h: 720,  tag: 'Video'  },
    { label: 'LinkedIn Post',      w: 1200, h: 627,  tag: 'Social' },
    { label: 'Pinterest Pin',      w: 1000, h: 1500, tag: 'Social' },
    { label: 'TikTok / Reel',      w: 1080, h: 1920, tag: 'Video'  },
    { label: 'Presentation 16:9',  w: 1920, h: 1080, tag: 'Slides' },
    { label: 'Presentation 4:3',   w: 1024, h: 768,  tag: 'Slides' },
    { label: 'A4 Portrait',        w: 794,  h: 1123, tag: 'Print'  },
    { label: 'A4 Landscape',       w: 1123, h: 794,  tag: 'Print'  },
    { label: 'Business Card',      w: 1050, h: 600,  tag: 'Print'  },
    { label: 'US Letter',          w: 816,  h: 1056, tag: 'Print'  },
    { label: 'Flyer / Poster',     w: 794,  h: 1123, tag: 'Print'  },
    { label: 'Banner 728×90',      w: 728,  h: 90,   tag: 'Web'    },
  ];

  // ── Text style presets (Canva) ────────────────────────
  readonly textStylePresets = [
    { label: 'Display',    fs: 80, fw: 900, ff: 'Poppins',          lh: 1.0, color: '#1a1a2e', preview: 'Aa' },
    { label: 'Big Title',  fs: 60, fw: 700, ff: 'Poppins',          lh: 1.1, color: '#1a1a2e', preview: 'Aa' },
    { label: 'Title',      fs: 44, fw: 700, ff: 'Inter',            lh: 1.2, color: '#1a1a2e', preview: 'Aa' },
    { label: 'Heading',    fs: 32, fw: 600, ff: 'Inter',            lh: 1.3, color: '#16213e', preview: 'Aa' },
    { label: 'Subheading', fs: 22, fw: 500, ff: 'Inter',            lh: 1.4, color: '#374151', preview: 'Aa' },
    { label: 'Body',       fs: 16, fw: 400, ff: 'Inter',            lh: 1.6, color: '#374151', preview: 'Aa' },
    { label: 'Caption',    fs: 12, fw: 400, ff: 'Lato',             lh: 1.5, color: '#6b7280', preview: 'Aa' },
    { label: 'Quote',      fs: 24, fw: 300, ff: 'Playfair Display', lh: 1.5, color: '#1a1a2e', preview: '"Aa"' },
    { label: 'Monospace',  fs: 14, fw: 400, ff: 'Courier New',      lh: 1.5, color: '#1a1a2e', preview: 'Aa' },
    { label: 'Label',      fs: 10, fw: 600, ff: 'Inter',            lh: 1.4, color: '#6366f1', preview: 'AA' },
  ];

  // ── Element shapes library (Canva / Freepik) ──────────
  readonly elementShapes: {name:string;type:string;params?:Record<string,any>;svgPreview:string}[] = [
    { name:'Rectangle',    type:'rect',    svgPreview:'<rect x="4" y="7" width="16" height="10" rx="1"/>' },
    { name:'Rounded Rect', type:'rect',    params:{rx:16,ry:16}, svgPreview:'<rect x="4" y="7" width="16" height="10" rx="5"/>' },
    { name:'Circle',       type:'circle',  svgPreview:'<circle cx="12" cy="12" r="8"/>' },
    { name:'Triangle',     type:'polygon', params:{_sides:3},    svgPreview:'<polygon points="12,4 22,20 2,20"/>' },
    { name:'Pentagon',     type:'polygon', params:{_sides:5},    svgPreview:'<polygon points="12,2 22,9 18,21 6,21 2,9"/>' },
    { name:'Hexagon',      type:'polygon', params:{_sides:6},    svgPreview:'<polygon points="12,2 22,7 22,17 12,22 2,17 2,7"/>' },
    { name:'Octagon',      type:'polygon', params:{_sides:8},    svgPreview:'<polygon points="8,2 16,2 22,8 22,16 16,22 8,22 2,16 2,8"/>' },
    { name:'5-Star',       type:'star',    params:{_starPoints:5},svgPreview:'<polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>' },
    { name:'6-Star',       type:'star',    params:{_starPoints:6,_starRatio:0.55},svgPreview:'<polygon points="12,2 14,8 20,6 16,12 20,18 14,16 12,22 10,16 4,18 8,12 4,6 10,8"/>' },
    { name:'4-Star',       type:'star',    params:{_starPoints:4,_starRatio:0.4}, svgPreview:'<polygon points="12,2 14,10 22,12 14,14 12,22 10,14 2,12 10,10"/>' },
    { name:'Line',         type:'line',    svgPreview:'<line x1="2" y1="12" x2="22" y2="12" stroke-width="2"/>' },
    { name:'Dashed Line',  type:'line',    params:{strokeDashArray:[8,4]}, svgPreview:'<line x1="2" y1="12" x2="22" y2="12" stroke-width="2" stroke-dasharray="5,3"/>' },
  ];

  // ── Background solid colors (Canva palette) ───────────
  readonly bgSolidColors = [
    '#ffffff','#f8f9fa','#e9ecef','#adb5bd','#000000',
    '#212529','#495057','#6c757d','#868e96','#343a40',
    '#e94560','#f5820a','#f59e0b','#22c55e','#06b6d4',
    '#3b82f6','#6366f1','#8b5cf6','#ec4899','#14b8a6',
    '#1a1a2e','#16213e','#0f3460','#7c3aed','#065f46',
    '#fef9c3','#fce7f3','#e0f2fe','#dcfce7','#faf5ff',
  ];

  // ── Gradient presets (PosterMyWall / Canva) ───────────
  readonly bgGradients = [
    { label:'Ocean',   c1:'#667eea', c2:'#764ba2' },
    { label:'Sunset',  c1:'#f093fb', c2:'#f5576c' },
    { label:'Sky',     c1:'#4facfe', c2:'#00f2fe' },
    { label:'Forest',  c1:'#43e97b', c2:'#38f9d7' },
    { label:'Fire',    c1:'#fa709a', c2:'#fee140' },
    { label:'Night',   c1:'#30cfd0', c2:'#330867' },
    { label:'Mango',   c1:'#f6d365', c2:'#fda085' },
    { label:'Rose',    c1:'#ffecd2', c2:'#fcb69f' },
    { label:'Cosmic',  c1:'#a18cd1', c2:'#fbc2eb' },
    { label:'Steel',   c1:'#e0eafc', c2:'#cfdef3' },
    { label:'Candy',   c1:'#89f7fe', c2:'#66a6ff' },
    { label:'Noir',    c1:'#434343', c2:'#000000' },
    { label:'Gold',    c1:'#f7971e', c2:'#ffd200' },
    { label:'Mint',    c1:'#a8edea', c2:'#fed6e3' },
    { label:'Dusk',    c1:'#2c3e50', c2:'#3498db' },
    { label:'Aurora',  c1:'#00c9ff', c2:'#92fe9d' },
  ];

  // ── Image filter presets (Canva / Instagram / Magnific) ─
  readonly imageFilterPresets = [
    { label:'Normal',   filters:[] as string[] },
    { label:'Grayscale',filters:['Grayscale'] },
    { label:'Sepia',    filters:['Sepia'] },
    { label:'Invert',   filters:['Invert'] },
    { label:'Vintage',  filters:['Sepia:0.5','Brightness:-0.05','Contrast:0.1'] },
    { label:'Cool',     filters:['Saturation:-0.3','HueRotation:30'] },
    { label:'Warm',     filters:['Saturation:0.2','HueRotation:-15'] },
    { label:'Fade',     filters:['Brightness:0.12','Saturation:-0.3','Contrast:-0.1'] },
    { label:'Vivid',    filters:['Saturation:0.6','Contrast:0.15'] },
    { label:'Dramatic', filters:['Contrast:0.35','Saturation:-0.15'] },
    { label:'Chrome',   filters:['Contrast:0.25','Saturation:-0.5','Brightness:0.05'] },
    { label:'Moody',    filters:['Brightness:-0.1','Contrast:0.2','Saturation:-0.2'] },
  ];

  // ── Curated stock photos (Unsplash CDN — no API key needed) ──
  // Rich tag strings enable keyword matching across multiple topics.
  private readonly _curatedPhotos = [
    { id:'p1',  thumb:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&q=80', alt:'Mountains', author:'Samuel Ferrara', tags:'mountain nature landscape outdoor travel snow peak' },
    { id:'p2',  thumb:'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&q=80', alt:'Forest path', author:'Sergei Akulich', tags:'forest nature trees path green outdoor woods' },
    { id:'p3',  thumb:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1280&q=80', alt:'Beach', author:'Sean Oulashin', tags:'beach ocean sea sand summer water waves coast tropical' },
    { id:'p4',  thumb:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1280&q=80', alt:'City skyline', author:'Pedro Lastra', tags:'city skyline urban architecture buildings downtown night lights' },
    { id:'p5',  thumb:'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1280&q=80', alt:'Abstract art', author:'Ameen Fahmy', tags:'abstract art colorful texture pattern artistic creative' },
    { id:'p6',  thumb:'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1280&q=80', alt:'Aerial nature', author:'Karsten Würth', tags:'aerial nature landscape drone view green fields outdoor' },
    { id:'p7',  thumb:'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=1280&q=80', alt:'Night city', author:'Andreas Brucker', tags:'night city lights urban dark neon street bokeh' },
    { id:'p8',  thumb:'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1280&q=80', alt:'Sunrise hills', author:'Davide Cantelli', tags:'sunrise sunset hills nature sky dawn landscape golden' },
    { id:'p9',  thumb:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&q=80', alt:'Modern office', author:'Alex Kotliarskyi', tags:'office workplace modern interior desk work business professional' },
    { id:'p10', thumb:'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1280&q=80', alt:'Business meeting', author:'Campaign Creators', tags:'business meeting team collaboration office work professional corporate' },
    { id:'p11', thumb:'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1280&q=80', alt:'Finance money', author:'Micheile Henderson', tags:'finance money cash business investment banking economy' },
    { id:'p12', thumb:'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1280&q=80', alt:'Laptop coding', author:'Christopher Gower', tags:'laptop code programming technology developer computer tech software' },
    { id:'p13', thumb:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1280&q=80', alt:'Healthy food', author:'Anna Pelzer', tags:'food healthy vegetables salad nutrition eating diet organic' },
    { id:'p14', thumb:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1280&q=80', alt:'Team work', author:'Brooke Cagle', tags:'team teamwork people collaboration smile happy business group' },
    { id:'p15', thumb:'https://images.unsplash.com/photo-1469285994282-454ceb49e63c?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1469285994282-454ceb49e63c?w=1280&q=80', alt:'Desert dunes', author:'Yoann Boyer', tags:'desert sand dunes landscape nature dry hot arid minimal' },
    { id:'p16', thumb:'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1280&q=80', alt:'Gradient abstract', author:'Gradienta', tags:'gradient abstract colorful background wallpaper artistic minimal' },
    { id:'p17', thumb:'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1280&q=80', alt:'Fireworks festival', author:'Erwan Hesry', tags:'fireworks festival celebration party night event colorful' },
    { id:'p18', thumb:'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1280&q=80', alt:'Sports cycling', author:'Markus Spiske', tags:'sports cycling bike fitness outdoor exercise health athlete' },
    { id:'p19', thumb:'https://images.unsplash.com/photo-1490750967868-88df5691cc51?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1490750967868-88df5691cc51?w=1280&q=80', alt:'Flowers bloom', author:'Annie Spratt', tags:'flowers bloom nature garden spring floral pink beautiful' },
    { id:'p20', thumb:'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1280&q=80', alt:'Startup team', author:'Austin Distel', tags:'startup team business office people work success laptop' },
    { id:'p21', thumb:'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=1280&q=80', alt:'Architecture', author:'Lance Anderson', tags:'architecture building structure modern design urban construction' },
    { id:'p22', thumb:'https://images.unsplash.com/photo-1546961342-ea5f60b193a4?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1546961342-ea5f60b193a4?w=1280&q=80', alt:'Night road', author:'Matteo Catanese', tags:'road night highway long exposure light trails dark travel' },
    { id:'p23', thumb:'https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=1280&q=80', alt:'Motivational stairs', author:'Ian Schneider', tags:'motivation success stairs climb goal achievement inspiration' },
    { id:'p24', thumb:'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1280&q=80', alt:'Dark tech', author:'Ales Nesetril', tags:'technology dark laptop code programming developer software tech' },
    { id:'p25', thumb:'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1280&q=80', alt:'Students studying', author:'Brooke Cagle', tags:'student education study learning school university books' },
    { id:'p26', thumb:'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1280&q=80', alt:'Technology laptop', author:'Luca Bravo', tags:'technology laptop computer screen code dark blue neon' },
    { id:'p27', thumb:'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&q=80', alt:'Sunset ocean', author:'Johannes Plenio', tags:'sunset ocean sea dramatic sky clouds water horizon golden' },
    { id:'p28', thumb:'https://images.unsplash.com/photo-1559181567-c3190c307e67?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1559181567-c3190c307e67?w=1280&q=80', alt:'Cherries fruit', author:'Quaritsch Photography', tags:'food fruit cherry red berries fresh organic healthy' },
    { id:'p29', thumb:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=1280&q=80', alt:'Man portrait', author:'Foto Sushi', tags:'person man portrait face professional smile business headshot' },
    { id:'p30', thumb:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1280&q=80', alt:'Woman portrait', author:'Christopher Campbell', tags:'person woman portrait face smile happy professional headshot' },
    { id:'p31', thumb:'https://images.unsplash.com/photo-1493514789931-586cb221d7a7?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1493514789931-586cb221d7a7?w=1280&q=80', alt:'Winter snow', author:'Anders Jildén', tags:'winter snow cold ice landscape white nature season frozen' },
    { id:'p32', thumb:'https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=1280&q=80', alt:'Cute cat', author:'Mikhail Vasilyev', tags:'cat animal pet cute kitten furry domestic adorable' },
    { id:'p33', thumb:'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=1280&q=80', alt:'Golden retriever', author:'Peter Schulz', tags:'dog animal pet cute golden retriever puppy furry' },
    { id:'p34', thumb:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1280&q=80', alt:'Meal bowl', author:'Louis Hansel', tags:'food meal bowl restaurant dinner healthy delicious cuisine' },
    { id:'p35', thumb:'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1280&q=80', alt:'Workshop meeting', author:'Headway', tags:'meeting workshop people team business office presentation board' },
    { id:'p36', thumb:'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1280&q=80', alt:'Co-working space', author:'Proxyclick Visitor Management System', tags:'office coworking space people work business desk computer' },
    { id:'p37', thumb:'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1280&q=80', alt:'Tropical palm', author:'Preethi Viswanathan', tags:'tropical palm tree beach summer holiday vacation island' },
    { id:'p38', thumb:'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1280&q=80', alt:'Snow mountain stars', author:'Benjamin Voros', tags:'mountain snow stars night milkyway galaxy outdoor nature' },
    { id:'p39', thumb:'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1280&q=80', alt:'Orange flowers', author:'Sergey Shmidt', tags:'flowers orange nature spring garden bloom color floral' },
    { id:'p40', thumb:'https://images.unsplash.com/photo-1505935428862-770b6f24f629?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1505935428862-770b6f24f629?w=1280&q=80', alt:'Waterfall', author:'Liger Pham', tags:'waterfall water nature cascade river green landscape outdoor' },
    { id:'p41', thumb:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280&q=80', alt:'Pink sky sunrise', author:'Jeremy Bishop', tags:'sky pink sunrise dawn clouds beautiful pastel minimal' },
    { id:'p42', thumb:'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=1280&q=80', alt:'Home office desk', author:'Domenico Loia', tags:'home office desk work remote laptop minimal clean setup' },
    { id:'p43', thumb:'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1280&q=80', alt:'Online shopping', author:'CardMapr.nl', tags:'shopping ecommerce online store card payment retail' },
    { id:'p44', thumb:'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1280&q=80', alt:'Handshake deal', author:'Cytonn Photography', tags:'business handshake deal agreement partnership professional success' },
    { id:'p45', thumb:'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1280&q=80', alt:'Analytics chart', author:'Lukas Blazek', tags:'analytics data chart graph business statistics report growth' },
    { id:'p46', thumb:'https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?w=1280&q=80', alt:'Lake reflection', author:'James Donaldson', tags:'lake reflection water nature landscape peaceful calm mirror' },
    { id:'p47', thumb:'https://images.unsplash.com/photo-1456262703519-0d0b9e611faf?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1456262703519-0d0b9e611faf?w=1280&q=80', alt:'City bridge', author:'Joshua Sortino', tags:'city bridge architecture urban travel landmark infrastructure' },
    { id:'p48', thumb:'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=240&h=160&fit=crop&q=70', url:'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=1280&q=80', alt:'Waffles breakfast', author:'Brenda Godinez', tags:'food breakfast waffles brunch cafe sweet delicious morning' },
  ];

  // ── Templates (Canva / PosterMyWall style starting points) ──
  // Each template resizes the canvas and lays down real Fabric objects
  // (background + heading + subheading) sized for its format, so picking
  // one gives you an actual editable starting point instead of a picture.
  readonly templateCategories: TemplateCategory[] = ['All', 'Social Media', 'Poster', 'Business', 'Event', 'Print'];
  readonly templates: {
    id: string;
    label: string;
    category: TemplateCategory;
    w: number;
    h: number;
    c1: string;
    c2: string;
    title: string;
    subtitle?: string;
  }[] = [
    { id: 'tpl-biz-card', label: 'Modern Business Card', category: 'Business', w: 1050, h: 600, c1: '#667eea', c2: '#764ba2', title: 'Your Name', subtitle: 'Job Title · Company' },
    { id: 'tpl-ig-post', label: 'Instagram Post', category: 'Social Media', w: 1080, h: 1080, c1: '#f093fb', c2: '#f5576c', title: 'Your Headline', subtitle: '@yourhandle' },
    { id: 'tpl-slide', label: 'Presentation Slide', category: 'Business', w: 1920, h: 1080, c1: '#4facfe', c2: '#00f2fe', title: 'Presentation Title', subtitle: 'Subtitle goes here' },
    { id: 'tpl-flyer', label: 'Event Flyer', category: 'Event', w: 794, h: 1123, c1: '#43e97b', c2: '#38f9d7', title: 'Event Name', subtitle: 'Date · Location' },
    { id: 'tpl-yt', label: 'YouTube Thumbnail', category: 'Social Media', w: 1280, h: 720, c1: '#fa709a', c2: '#fee140', title: 'Video Title', subtitle: 'Episode 01' },
    { id: 'tpl-twitter', label: 'Twitter Banner', category: 'Social Media', w: 1500, h: 500, c1: '#30cfd0', c2: '#330867', title: 'Your Name', subtitle: '@yourhandle' },
    { id: 'tpl-linkedin', label: 'LinkedIn Post', category: 'Business', w: 1200, h: 627, c1: '#f7971e', c2: '#ffd200', title: 'Announcement', subtitle: 'What changed and why it matters' },
    { id: 'tpl-pin', label: 'Pinterest Pin', category: 'Social Media', w: 1000, h: 1500, c1: '#a18cd1', c2: '#fbc2eb', title: 'Pin Title', subtitle: 'A short, catchy hook' },
    { id: 'tpl-blog', label: 'Blog Header', category: 'Print', w: 1600, h: 840, c1: '#2c3e50', c2: '#3498db', title: 'Article Title', subtitle: 'A one-line summary' },
    { id: 'tpl-poster', label: 'Concert Poster', category: 'Poster', w: 794, h: 1123, c1: '#ff9a9e', c2: '#fecfef', title: 'Live Show', subtitle: 'Doors 7PM · Tickets at the door' },
    { id: 'tpl-sale', label: 'Sale Announcement', category: 'Poster', w: 1080, h: 1350, c1: '#f77062', c2: '#fe5196', title: 'Big Sale', subtitle: 'Up to 50% off' },
    { id: 'tpl-invite', label: 'Party Invitation', category: 'Event', w: 1080, h: 1350, c1: '#c471f5', c2: '#fa71cd', title: "You're Invited", subtitle: 'Saturday · 7PM' },
  ];
  readonly templateCategory = signal<TemplateCategory>('All');
  readonly templateSearchQuery = signal('');
  readonly filteredTemplates = computed(() => {
    const cat = this.templateCategory();
    const q = this.templateSearchQuery().trim().toLowerCase();
    return this.templates.filter((t) => {
      const matchesCategory = cat === 'All' || t.category === cat;
      const matchesQuery = !q || t.label.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  });

  fontFamilies = [
    'Inter', 'Lato', 'Roboto', 'Poppins', 'Playfair Display',
    'Courier New', 'Georgia', 'Arial', 'Montserrat', 'Open Sans',
    'Raleway', 'Merriweather', 'Oswald', 'Nunito', 'Source Sans Pro',
    'Ubuntu', 'Libre Baskerville', 'Dancing Script', 'Pacifico', 'Bebas Neue',
  ];

  // ── SVG Icon library (Canva / Freepik / Envato Elements) ─────────
  readonly editorIcons: {name: string; svg: string}[] = [
    { name: 'Heart', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e94560"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>` },
    { name: 'Star', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` },
    { name: 'Diamond', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#8b5cf6"><polygon points="12 2 22 9 12 22 2 9"/></svg>` },
    { name: 'Lightning', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f5820a"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>` },
    { name: 'Cloud', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>` },
    { name: 'Sun', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>` },
    { name: 'Moon', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6366f1"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>` },
    { name: 'Home', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` },
    { name: 'User', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
    { name: 'Search', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>` },
    { name: 'Mail', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>` },
    { name: 'Phone', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.56 2 2 0 0 1 3.6 2.36h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.12 6.12l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>` },
    { name: 'Location', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e94560"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>` },
    { name: 'Calendar', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` },
    { name: 'Clock', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
    { name: 'Camera', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>` },
    { name: 'Music', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>` },
    { name: 'Play', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6"><polygon points="5 3 19 12 5 21 5 3"/></svg>` },
    { name: 'Cart', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f5820a" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>` },
    { name: 'Like', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>` },
    { name: 'Share', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>` },
    { name: 'Bell', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>` },
    { name: 'Settings', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` },
    { name: 'Smile', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>` },
    { name: 'Trophy', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>` },
    { name: 'Gift', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#e94560" stroke-width="2" stroke-linecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>` },
    { name: 'Check', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` },
    { name: 'Arrow Right', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>` },
    { name: 'Fire', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f5820a"><path d="M12 2C8.5 5 7 8 8 11c-2-1-3-3-3-3S4 14 8 17c0 0-1-1-1-2 0 0 3 4 5 4s5-1 5-5c0-2-1-4-1-4S19 8 12 2z"/></svg>` },
    { name: 'Leaf', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round"><path d="M17 8C8 10 5.9 16.17 3.82 19.08L5 21c4-3 8-6 17-6-1-4-4-8-5-7z"/><path d="M3.82 19.08L5 21"/></svg>` },
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
  private _aiTargetId: string | null = null;
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
  private readonly canvasContextMenuHandler = this.handleCanvasContextMenu.bind(this);
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

  // ── Transform panel: position / size / rotation ──────────────────
  readonly selectedX = computed(() => Math.round(this._selectionProps()['left'] ?? 0));
  readonly selectedY = computed(() => Math.round(this._selectionProps()['top'] ?? 0));
  readonly selectedW = computed(() => {
    const p = this._selectionProps();
    return Math.round((p['width'] ?? 0) * (p['scaleX'] ?? 1));
  });
  readonly selectedH = computed(() => {
    const p = this._selectionProps();
    return Math.round((p['height'] ?? 0) * (p['scaleY'] ?? 1));
  });
  readonly selectedRotation = computed(() => Math.round(this._selectionProps()['angle'] ?? 0));

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
    } catch (err) {
      console.error('Fabric.js failed to load:', err);
      this.showToast('Canvas engine failed to load. Please refresh the page.', 'error');
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
      stopContextMenu: false,
      fireRightClick: true,
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
      this.updateFloatBar();
    });

    this.canvas.on('object:scaling', () => this.updateFloatBar());
    this.canvas.on('object:rotating', () => this.updateFloatBar());

    // Assign ids to freehand draw paths and trigger layer sync
    this.canvas.on('path:created', (e: any) => {
      if (e.path) {
        e.path._id = e.path._id || `draw-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        e.path.name = e.path.name || 'Drawing';
        this.onModify();
      }
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
        } catch (err) {
          console.error('Canvas restore failed:', err);
        }
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
      } catch (err) {
        console.error('Failed to load saved project canvas:', err);
      }
    } else if (this._assetImageUrl) {
      this.loadAssetImage(this._assetImageUrl);
    }

    // Load Google Fonts for expanded font picker
    this.loadGoogleFonts();

    // The setup above (grid render, initial onModify sync) isn't a real user
    // edit — restoring or starting a project shouldn't show "Saving…".
    this.ed.dirty.set(false);
    this.ed.saveState.set('saved');
  }

  private setupCanvasPanning(): void {
    if (!this.canvas || !this.canvasAreaRef?.nativeElement) return;

    const viewport = this.canvasAreaRef.nativeElement;
    viewport.addEventListener('wheel', this.canvasWheelHandler, { passive: false });
    viewport.addEventListener('mousedown', this.canvasMouseDownHandler);
    viewport.addEventListener('contextmenu', this.canvasContextMenuHandler);
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
    if (event.key === '?' && !(event.target as HTMLElement)?.matches('input,textarea,[contenteditable]')) {
      this.showShortcutsModal.update(v => !v);
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
    nextTransform[4] += dx;
    nextTransform[5] += dy;

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
    const obj = this._selectedObject ?? this.canvas?.getActiveObject?.();
    if (!obj) return;
    this.ed.pushUndoState();
    obj.set?.({ globalCompositeOperation: mode });
    obj.globalCompositeOperation = mode;
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  groupSelected(): void {
    if (!this.canvas || !this.fabric) return;
    const activeObjects = this.canvas.getActiveObjects?.() ?? [];
    const selected =
      activeObjects.length > 1
        ? activeObjects
        : this.canvas
            .getObjects()
            .filter((obj: any) => obj._id && this.ed.selectedLayerIds().has(obj._id));
    if (!selected.length || selected.length < 2) return;
    this.ed.pushUndoState();
    const group = new this.fabric.Group(selected, { subTargetCheck: true });
    selected.forEach((obj: any) => this.canvas.remove(obj));
    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this._selectedObject = group;
    this.canvas.renderAll();
    this.onSelect({ target: group, selected: [group] });
    this.ed.setDirty();
  }

  ungroupSelected(): void {
    if (!this.canvas) return;
    const obj = this._selectedObject;
    if (!obj?.isType?.('group')) return;
    this.ed.pushUndoState();
    const items = obj._objects ?? [];
    this.canvas.remove(obj);
    items.forEach((item: any) => this.canvas.add(item));
    this.canvas.setActiveObject(items[0] ?? null);
    this._selectedObject = items[0] ?? null;
    this.canvas.renderAll();
    if (items[0]) {
      this.onSelect({ target: items[0], selected: [items[0]] });
    } else {
      this.onDeselect();
    }
    this.ed.setDirty();
  }

  private bringObjectForward(obj: any): void {
    if (!this.canvas || !obj) return;
    if (typeof this.canvas.bringForward === 'function') {
      this.canvas.bringForward(obj);
    } else if (typeof obj.bringForward === 'function') {
      obj.bringForward();
    }
  }

  private sendObjectBackward(obj: any): void {
    if (!this.canvas || !obj) return;
    if (typeof this.canvas.sendBackwards === 'function') {
      this.canvas.sendBackwards(obj);
    } else if (typeof obj.sendBackwards === 'function') {
      obj.sendBackwards();
    }
  }

  private bringObjectToFront(obj: any): void {
    if (!this.canvas || !obj) return;
    if (typeof this.canvas.bringToFront === 'function') {
      this.canvas.bringToFront(obj);
    } else if (typeof obj.bringToFront === 'function') {
      obj.bringToFront();
    }
  }

  private sendObjectToBack(obj: any): void {
    if (!this.canvas || !obj) return;
    if (typeof this.canvas.sendToBack === 'function') {
      this.canvas.sendToBack(obj);
    } else if (typeof obj.sendToBack === 'function') {
      obj.sendToBack();
    }
  }

  moveSelectedForward(): void {
    if (!this.canvas) return;
    const objects =
      this.canvas.getActiveObjects?.() ??
      this.canvas
        .getObjects()
        .filter((obj: any) => obj._id && this.ed.selectedLayerIds().has(obj._id));
    if (!objects.length) return;
    this.ed.pushUndoState();
    objects.forEach((obj: any) => this.bringObjectForward(obj));
    this.canvas.renderAll();
    this.onModify();
  }

  bringSelectedToFront(): void {
    if (!this.canvas) return;
    const objects =
      this.canvas.getActiveObjects?.() ??
      this.canvas
        .getObjects()
        .filter((obj: any) => obj._id && this.ed.selectedLayerIds().has(obj._id));
    if (!objects.length) return;
    this.ed.pushUndoState();
    objects.forEach((obj: any) => this.bringObjectToFront(obj));
    this.canvas.renderAll();
    this.onModify();
  }

  moveSelectedBackward(): void {
    if (!this.canvas) return;
    const objects =
      this.canvas.getActiveObjects?.() ??
      this.canvas
        .getObjects()
        .filter((obj: any) => obj._id && this.ed.selectedLayerIds().has(obj._id));
    if (!objects.length) return;
    this.ed.pushUndoState();
    objects.forEach((obj: any) => this.sendObjectBackward(obj));
    this.canvas.renderAll();
    this.onModify();
  }

  sendSelectedToBack(): void {
    if (!this.canvas) return;
    const objects =
      this.canvas.getActiveObjects?.() ??
      this.canvas
        .getObjects()
        .filter((obj: any) => obj._id && this.ed.selectedLayerIds().has(obj._id));
    if (!objects.length) return;
    this.ed.pushUndoState();
    objects.forEach((obj: any) => this.sendObjectToBack(obj));
    this.canvas.renderAll();
    this.onModify();
  }

  moveLayerForward(id: string): void {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects().find((o: any) => o._id === id);
    if (!obj) return;
    this.ed.pushUndoState();
    this.bringObjectForward(obj);
    this.canvas.renderAll();
    this.onModify();
  }

  moveLayerBackward(id: string): void {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects().find((o: any) => o._id === id);
    if (!obj) return;
    this.ed.pushUndoState();
    this.sendObjectBackward(obj);
    this.canvas.renderAll();
    this.onModify();
  }

  bringLayerToFront(id: string): void {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects().find((o: any) => o._id === id);
    if (!obj) return;
    this.ed.pushUndoState();
    this.bringObjectToFront(obj);
    this.canvas.renderAll();
    this.onModify();
  }

  sendLayerToBack(id: string): void {
    if (!this.canvas) return;
    const obj = this.canvas.getObjects().find((o: any) => o._id === id);
    if (!obj) return;
    this.ed.pushUndoState();
    this.sendObjectToBack(obj);
    this.canvas.renderAll();
    this.onModify();
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
    const target = e.target as HTMLElement;
    const isInput =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.isContentEditable;
    if (isInput) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const mod = isMac ? e.metaKey : e.ctrlKey;

    // Undo / Redo
    if (mod && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) this.ed.redo();
      else this.ed.undo();
      return;
    }
    if (mod && e.key === 'y') {
      e.preventDefault();
      this.ed.redo();
      return;
    }
    // Save
    if (mod && !e.shiftKey && e.key === 's') {
      e.preventDefault();
      this.save();
      return;
    }
    // Select All
    if (mod && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      this.selectAll();
      return;
    }
    // Copy
    if (mod && !e.shiftKey && e.key === 'c') {
      e.preventDefault();
      this.copySelected();
      return;
    }
    // Cut
    if (mod && !e.shiftKey && e.key === 'x') {
      e.preventDefault();
      this.cutSelected();
      return;
    }
    // Paste
    if (mod && !e.shiftKey && e.key === 'v') {
      e.preventDefault();
      this.pasteClipboard();
      return;
    }
    // Duplicate
    if (mod && e.key === 'd') {
      e.preventDefault();
      this.duplicateSelected();
      return;
    }
    // Toggle grid
    if (mod && !e.shiftKey && e.key === 'g') {
      e.preventDefault();
      this.toggleGrid();
      return;
    }
    // Zoom in
    if (mod && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      this.zoomIn();
      return;
    }
    // Zoom out
    if (mod && (e.key === '-' || e.key === '_')) {
      e.preventDefault();
      this.zoomOut();
      return;
    }
    // Reset zoom to 100%
    if (mod && e.key === '0') {
      e.preventDefault();
      this.setZoom(1);
      return;
    }
    // Fit to screen
    if (mod && e.shiftKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      this.zoomToFit();
      return;
    }
    // Bring forward
    if (mod && e.key === ']') {
      e.preventDefault();
      this.moveSelectedForward();
      return;
    }
    // Send backward
    if (mod && e.key === '[') {
      e.preventDefault();
      this.moveSelectedBackward();
      return;
    }
    // Arrow nudge (1px, Shift+Arrow = 10px)
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (this.canvas?.getActiveObjects?.()?.length) {
        e.preventDefault();
        this.nudgeSelected(e.key, e.shiftKey ? 10 : 1);
        return;
      }
    }
    // Delete / Backspace
    if (e.key === 'Delete' || e.key === 'Backspace') {
      this.deleteSelected();
      return;
    }
    // Escape
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
    // Single-key tool shortcuts (no modifier)
    if (!mod && !e.shiftKey && !e.altKey) {
      switch (e.key) {
        case 'v': this.setTool('select'); return;
        case 't': this.setTool('text'); return;
        case 'r': this.setTool('shape'); return;
        case 'c': this.addShape('circle'); return;
        case 'l': this.addShape('line'); return;
        case 'p': this.setTool('draw'); return;  // p = pencil
        case 'F': this.togglePresentationMode(); return;  // Shift+f
        case '?': this.toggleShortcutsModal(); return;
      }
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvas();
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.showFontPicker.set(false);
    this.hideCtxMenu();
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
    this.updateFloatBar();
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
    this.floatBar.update(b => ({ ...b, visible: false }));
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
      scaleX: obj.scaleX ?? 1,
      scaleY: obj.scaleY ?? 1,
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
    const props = {
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
    };

    if (typeof target.set === 'function') {
      target.set(props);
      target.setCoords?.();
      return;
    }

    Object.assign(target, props);
    if (typeof target.setCoords === 'function') {
      target.setCoords();
    }
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
      draw: 'crosshair',
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

  searchLayers(query: string): void {
    this.layerSearchQuery.set(query);
  }

  onImageDragStart(e: DragEvent, url: string): void {
    e.dataTransfer?.setData('text/plain', url);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
  }

  onImageClick(url: string): void {
    this.addImage(url);
  }

  setTool(mode: ToolMode): void {
    // Disable draw mode when switching away
    if (this.ed.toolMode() === 'draw' && mode !== 'draw') {
      this.disableDrawingMode();
    }
    this.ed.toolMode.set(mode);
    this.showFontPicker.set(false);
    this.updateCanvasCursor();
    if (mode === 'text') this.addText();
    if (mode === 'shape') this.addShape('rect');
    if (mode === 'image') this.triggerImageUpload();
    if (mode === 'upload') this.showUploadDialog.set(true);
    if (mode === 'templates') this.showTemplatePicker.set(true);
    if (mode === 'draw') this.enableDrawingMode();
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
      case 'arrow':
        obj = new this.fabric.Line([c.x - 100, c.y, c.x + 100, c.y], {
          _id: id,
          name: 'Arrow',
          stroke: '#1a1a2e',
          strokeWidth: 3,
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          _arrowStart: false,
          _arrowEnd: true,
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
    if (type === 'arrow') {
      this.syncArrows(obj);
    }
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
        this.showToast('Unsupported format. Use PNG, JPEG, WebP, or SVG.', 'error');
        return;
      }
      if (file.size > this.FILE_SIZE_LIMIT) {
        this.showToast('File too large. Maximum size is 10 MB.', 'error');
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

  selectAll(): void {
    if (!this.canvas || !this.fabric) return;
    const objs = this.canvas.getObjects().filter((obj: any) => {
      if (!obj) return false;
      if (obj.visible === false) return false;
      if (obj._isGrid || obj._isStrokeSide || obj._isArrow || obj._isPageGuide) return false;
      return true;
    });
    if (!objs.length) return;

    // Try to use ActiveSelection when available so objects remain ungrouped
    try {
      const ActiveSelection =
        (this.fabric as any).ActiveSelection ?? (this.canvas as any).ActiveSelection;
      if (ActiveSelection) {
        const sel = new ActiveSelection(objs, { canvas: this.canvas });
        this.canvas.setActiveObject(sel);
        this.onSelect({ target: sel, selected: objs });
        this.canvas.requestRenderAll();
        return;
      }
    } catch (e) {
      // fall through to fallback
    }

    // Fallback: mark all ids in EditorService and visually apply selection appearance
    const ids = new Set<string>();
    objs.forEach((o: any) => {
      ids.add(o._id ?? `obj-${Date.now()}`);
      this.applySelectionAppearance(o);
    });
    this.ed.selectedLayerIds.set(ids);
    this.readPropsFromSelected();
    this.ed.syncLayers(this.canvas.getObjects());
    this.canvas.requestRenderAll();
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
    this.trackRecentColor(color);
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
      } catch (err) {
        console.warn('Canvas pointer resolution failed during drag drop:', err);
      }
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

  /**
   * Real, client-side background removal (no AI backend): estimates the
   * background color from the image corners and keys out matching pixels,
   * with a soft feather at the edge of the tolerance band. Works best on
   * photos with a solid or near-solid background.
   */
  removeBg(): void {
    const obj = this._selectedObject;
    const isImg = !!obj && (obj.type === 'image' || obj.isType?.('image'));
    if (!obj || !isImg) return;
    this.ed.aiJobState.set({ status: 'processing' });
    // Defer so the "Processing…" state renders before the pixel work runs.
    setTimeout(() => {
      try {
        const previewUrl = this.chromaKeyRemoveBackground(obj);
        this._aiTargetId = obj._id;
        this.ed.aiJobState.set({ status: 'ready', previewUrl });
      } catch (e) {
        console.error('Remove background failed', e);
        this.ed.aiJobState.set({
          status: 'failed',
          error: 'Could not process this image.',
        });
      }
    }, 300);
  }

  private chromaKeyRemoveBackground(obj: any): string {
    const el: HTMLImageElement | HTMLCanvasElement = obj.getElement
      ? obj.getElement()
      : obj._element;
    const w = (el as any).naturalWidth || el.width;
    const h = (el as any).naturalHeight || el.height;
    if (!w || !h) throw new Error('Image has no pixel data');

    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const ctx = off.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    ctx.drawImage(el, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Estimate the background color from the four corners.
    const corners = [
      [0, 0],
      [w - 1, 0],
      [0, h - 1],
      [w - 1, h - 1],
    ];
    let r = 0,
      g = 0,
      b = 0;
    corners.forEach(([x, y]) => {
      const i = (y * w + x) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    });
    r /= corners.length;
    g /= corners.length;
    b /= corners.length;

    const tolerance = 46;
    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i] - r;
      const dg = data[i + 1] - g;
      const db = data[i + 2] - b;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist < tolerance) {
        data[i + 3] = Math.round(data[i + 3] * (dist / tolerance));
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return off.toDataURL('image/png');
  }

  applyAiResult(): void {
    const state = this.ed.aiJobState();
    const obj = this._selectedObject;
    const previewUrl = state.previewUrl;
    if (previewUrl && obj && this.canvas && this.fabric && obj._id === this._aiTargetId) {
      this.ed.pushUndoState();
      void this.fabric.Image.fromURL(previewUrl).then((img: any) => {
        if (!this.canvas) return;
        img.set({
          _id: obj._id,
          name: obj.name,
          left: obj.left,
          top: obj.top,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          angle: obj.angle,
          opacity: obj.opacity,
          originX: obj.originX,
          originY: obj.originY,
        });
        this.canvas.remove(obj);
        this.canvas.add(img);
        this.canvas.setActiveObject(img);
        this._selectedObject = img;
        this.canvas.renderAll();
        this.onSelect({ target: img });
        this.ed.setDirty();
      });
    }
    this.ed.aiJobState.set({ status: 'idle' });
    this._aiTargetId = null;
    this.showAiResult.set(false);
  }

  discardAiResult(): void {
    this.ed.aiJobState.set({ status: 'idle' });
    this._aiTargetId = null;
    this.showAiResult.set(false);
  }

  openExport(): void {
    this.showExport.set(true);
    this.ed.resetExportState();
  }

  closeExport(): void {
    this.showExport.set(false);
  }

  /**
   * All exports are generated entirely in the browser (no export backend):
   * PNG/JPG via Fabric's canvas rasterizer, SVG via Fabric's native vector
   * serializer, and PDF by embedding the rasterized design with jsPDF.
   */
  exportDesign(format: ExportFormat): void {
    if (!this.canvas) return;
    this._exportFormat = format;
    this.ed.exportState.set({ status: 'queued' });
    // Defer a tick so the "Preparing export…" state is visible before the
    // (synchronous) rendering work runs, then produce the real file.
    setTimeout(() => {
      this.ed.exportState.set({ status: 'rendering' });
      setTimeout(() => {
        try {
          const downloadUrl = this.renderExport(format);
          this.ed.exportState.set({ status: 'ready', downloadUrl });
        } catch (e) {
          console.error('Export failed', e);
          this.ed.exportState.set({
            status: 'failed',
            error: 'Could not generate this export. Try a different format.',
          });
        }
      }, 250);
    }, 100);
  }

  /** Renders the whole design client-side and returns a downloadable data URL. */
  private renderExport(format: ExportFormat): string {
    if (!this.canvas) throw new Error('Canvas not ready');
    const w = this.canvas.getWidth();
    const h = this.canvas.getHeight();

    if (format === 'SVG') {
      const svg = this.canvas.toSVG();
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }

    const fmt = format === 'JPG' ? 'jpeg' : 'png';
    const multiplier = 2;
    const bg = this.canvas.backgroundColor;
    // JPG has no alpha channel — fall back to white so it never renders black.
    if (fmt === 'jpeg' && (!bg || this.exportTransparent === false)) {
      this.canvas.set('backgroundColor', bg || '#ffffff');
      this.canvas.renderAll();
    }
    const dataUrl = this.canvas.toDataURL({
      format: fmt,
      multiplier,
      quality: fmt === 'jpeg' ? Math.max(0.1, Math.min(1, this.exportQuality / 100)) : undefined,
    } as any);
    if (fmt === 'jpeg' && !bg) {
      this.canvas.set('backgroundColor', bg as any);
      this.canvas.renderAll();
    }

    if (format === 'PDF') {
      const pxW = w * multiplier;
      const pxH = h * multiplier;
      const pdf = new jsPDF({
        orientation: pxW >= pxH ? 'landscape' : 'portrait',
        unit: 'px',
        format: [pxW, pxH],
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, pxW, pxH);
      return pdf.output('datauristring');
    }

    return dataUrl;
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

  /** Export the currently selected object(s) as an image (client-side). */
  exportSelection(format: ExportFormat): void {
    if (!this.canvas) {
      this.exportDesign(format);
      return;
    }

    // Determine selected objects from Fabric active selection or service selection
    let objects: any[] = [];
    if (this.canvas.getActiveObjects && this.canvas.getActiveObjects().length) {
      objects = this.canvas.getActiveObjects();
    } else {
      const ids = this.ed.selectedLayerIds();
      if (ids && ids.size) {
        objects = this.canvas.getObjects().filter((o: any) => o._id && ids.has(o._id));
      }
    }

    if (!objects.length) {
      // nothing selected -> fallback to full project export
      this.exportDesign(format);
      return;
    }

    // Compute bounding box of selection
    let left = Number.POSITIVE_INFINITY;
    let top = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    let bottom = Number.NEGATIVE_INFINITY;

    objects.forEach((obj: any) => {
      const r = obj.getBoundingRect(true);
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.left + r.width);
      bottom = Math.max(bottom, r.top + r.height);
    });

    if (!isFinite(left) || !isFinite(top)) {
      this.exportDesign(format);
      return;
    }

    const width = Math.max(1, right - left);
    const height = Math.max(1, bottom - top);

    const fmt = format === 'JPG' ? 'jpeg' : 'png';
    const multiplier = 2; // increase resolution for exports

    // fabric.Canvas.toDataURL accepts an options object
    try {
      const dataUrl = this.canvas.toDataURL({
        format: fmt,
        left,
        top,
        width,
        height,
        multiplier,
        quality: fmt === 'jpeg' ? Math.max(0.1, Math.min(1, this.exportQuality / 100)) : undefined,
      } as any);

      // trigger download
      const a = document.createElement('a');
      const ext = fmt === 'jpeg' ? 'jpg' : 'png';
      a.href = dataUrl;
      a.download = `selection-${Date.now()}.${ext}`;
      a.click();
      this.closeExport();
    } catch (e) {
      // fallback to server export when client export fails
      console.warn('Selection export failed, falling back to project export', e);
      this.exportDesign(format);
    }
  }

  /** Duplicate the currently selected canvas object(s). */
  duplicateSelected(): void {
    if (!this.canvas || !this.fabric) return;
    const active = this.canvas.getActiveObjects?.() ?? [];
    if (!active.length) return;
    this.ed.pushUndoState();
    active.forEach((obj: any) => {
      try {
        const clone = obj.clone((cloned: any) => {
          if (!cloned) return;
          cloned.set({
            _id: `layer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: `${obj.name ?? 'Layer'} Copy`,
            left: (obj.left ?? 0) + 20,
            top: (obj.top ?? 0) + 20,
          });
          cloned.setCoords?.();
          this.canvas?.add(cloned);
          this.canvas?.setActiveObject(cloned);
          this.canvas?.renderAll();
          this.onSelect({ target: cloned });
        });
        // Sync: some fabric versions return from clone synchronously
        if (clone && typeof clone.set === 'function') {
          clone.set({
            _id: `layer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: `${obj.name ?? 'Layer'} Copy`,
            left: (obj.left ?? 0) + 20,
            top: (obj.top ?? 0) + 20,
          });
          clone.setCoords?.();
          this.canvas?.add(clone);
          this.canvas?.setActiveObject(clone);
          this.canvas?.renderAll();
          this.onSelect({ target: clone });
        }
      } catch { /* ignore clone errors */ }
    });
    this.ed.setDirty();
  }

  /** Toggle lock on the currently selected object(s). */
  toggleSelectedLock(): void {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects?.() ?? [];
    if (!active.length) return;
    const locked = !active[0].lockMovementX;
    this.ed.pushUndoState();
    active.forEach((obj: any) => {
      obj.set?.({
        lockMovementX: locked,
        lockMovementY: locked,
        lockRotation: locked,
        lockScalingX: locked,
        lockScalingY: locked,
      });
      obj.lockMovementX = locked;
      obj.lockMovementY = locked;
      obj.selectable = obj.visible && !locked;
      obj.evented = obj.visible && !locked;
    });
    this.canvas.renderAll();
    this.onModify();
  }

  /**
   * Align selected objects relative to each other or to the canvas.
   * Works for single objects (aligns to canvas center/edges) and
   * multiple objects (aligns to their collective bounding box).
   */
  alignSelected(alignment: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY'): void {
    if (!this.canvas) return;
    const objects: any[] = this.canvas.getActiveObjects?.() ?? [];
    if (!objects.length) return;
    this.ed.pushUndoState();

    // Compute collective bounding box
    let minLeft = Number.POSITIVE_INFINITY;
    let minTop = Number.POSITIVE_INFINITY;
    let maxRight = Number.NEGATIVE_INFINITY;
    let maxBottom = Number.NEGATIVE_INFINITY;

    objects.forEach((obj: any) => {
      const b = obj.getBoundingRect(true);
      minLeft = Math.min(minLeft, b.left);
      minTop = Math.min(minTop, b.top);
      maxRight = Math.max(maxRight, b.left + b.width);
      maxBottom = Math.max(maxBottom, b.top + b.height);
    });

    objects.forEach((obj: any) => {
      const b = obj.getBoundingRect(true);
      switch (alignment) {
        case 'left':
          obj.set('left', (obj.left ?? 0) + (minLeft - b.left));
          break;
        case 'right':
          obj.set('left', (obj.left ?? 0) + (maxRight - (b.left + b.width)));
          break;
        case 'top':
          obj.set('top', (obj.top ?? 0) + (minTop - b.top));
          break;
        case 'bottom':
          obj.set('top', (obj.top ?? 0) + (maxBottom - (b.top + b.height)));
          break;
        case 'centerX': {
          const cx = (minLeft + maxRight) / 2;
          obj.set('left', (obj.left ?? 0) + (cx - (b.left + b.width / 2)));
          break;
        }
        case 'centerY': {
          const cy = (minTop + maxBottom) / 2;
          obj.set('top', (obj.top ?? 0) + (cy - (b.top + b.height / 2)));
          break;
        }
      }
      obj.setCoords?.();
    });

    this.canvas.renderAll();
    this.onModify();
  }

  // ═══ NEW FEATURE METHODS ══════════════════════════════

  setTemplateCategory(category: TemplateCategory): void {
    this.templateCategory.set(category);
  }

  /**
   * Applies a template as a real, editable starting point: resizes the
   * canvas to the template's format, sets its gradient background, and
   * drops in an editable heading/subheading you can restyle immediately.
   */
  applyTemplate(t: (typeof this.templates)[number]): void {
    if (!this.canvas || !this.fabric) return;
    this.ed.pushUndoState();

    this.canvas.getObjects().slice().forEach((o: any) => this.canvas!.remove(o));
    this.customWidth.set(t.w);
    this.customHeight.set(t.h);
    this.canvas.setDimensions({ width: t.w, height: t.h });
    this.setCanvasBgGradient({ label: t.label, c1: t.c1, c2: t.c2 });

    const titleSize = Math.max(28, Math.round(t.w / 14));
    const title = new this.fabric.IText(t.title, {
      _id: `tmpl-title-${Date.now()}`,
      name: 'Title',
      left: t.w / 2,
      top: t.h * 0.42,
      fontSize: titleSize,
      fontWeight: 700,
      fill: '#ffffff',
      fontFamily: 'Poppins',
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
    });
    this.canvas.add(title);

    if (t.subtitle) {
      const subSize = Math.max(14, Math.round(t.w / 34));
      const sub = new this.fabric.IText(t.subtitle, {
        _id: `tmpl-subtitle-${Date.now()}`,
        name: 'Subtitle',
        left: t.w / 2,
        top: t.h * 0.42 + titleSize / 2 + subSize + 14,
        fontSize: subSize,
        fontWeight: 400,
        fill: 'rgba(255,255,255,0.85)',
        fontFamily: 'Inter',
        originX: 'center',
        originY: 'center',
        textAlign: 'center',
      });
      this.canvas.add(sub);
    }

    this.canvas.renderAll();
    requestAnimationFrame(() => this.zoomToFit());
    this.ed.setDirty();
    this.showTemplatePicker.set(false);
    this.leftPanelTab.set('layers');
  }

  // ── Left panel tab navigation (Canva-style) ───────────
  setLeftTab(tab: 'layers'|'templates'|'elements'|'photos'|'text'|'background'): void {
    this.leftPanelTab.set(tab);
    if (tab === 'photos' && this.photoResults().length === 0) {
      this.photoResults.set(this._curatedPhotos);
    }
  }

  searchPhotos(): void {
    const q = this.photoQuery().trim().toLowerCase();
    if (!q) { this.photoResults.set(this._curatedPhotos); return; }
    this.photoSearching.set(true);
    const terms = q.split(/\s+/).filter(Boolean);
    const scored = this._curatedPhotos.map(p => {
      const haystack = `${p.alt} ${p.tags ?? ''} ${p.author}`.toLowerCase();
      const score = terms.reduce((s, term) => {
        if (p.alt.toLowerCase().includes(term)) return s + 3;
        if (haystack.includes(term)) return s + 1;
        return s;
      }, 0);
      return { photo: p, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.photo);
    setTimeout(() => {
      this.photoResults.set(scored.length ? scored : []);
      this.photoSearching.set(false);
    }, 150);
  }

  insertStockPhoto(photo: {id:string;thumb:string;url:string;alt:string;author:string}): void {
    this.addImage(photo.url);
  }

  // ── Text style presets (Canva) ────────────────────────
  addStyledText(preset: {label:string;fs:number;fw:number;ff:string;lh:number;color:string;preview:string}): void {
    if (!this.canvas || !this.fabric) return;
    this.ed.pushUndoState();
    const id = `text-${Date.now()}`;
    const cw = this.canvas.getWidth();
    const ch = this.canvas.getHeight();
    const sample = preset.label === 'Quote' ? `"${preset.label}"` : preset.label;
    const txt = new this.fabric.IText(sample, {
      _id: id,
      name: preset.label,
      left: Math.max(20, cw / 2 - 200),
      top: Math.max(20, ch / 2 - preset.fs),
      fontSize: preset.fs,
      fontWeight: preset.fw,
      fontFamily: preset.ff,
      lineHeight: preset.lh,
      fill: preset.color,
      textAlign: 'left',
    });
    this.canvas.add(txt);
    this.canvas.setActiveObject(txt);
    this.canvas.renderAll();
    this.onSelect({ target: txt });
    this.ed.toolMode.set('select');
    this.ed.setDirty();
  }

  // ── Element shapes library (Canva / Freepik) ──────────
  addElement(el: {name:string;type:string;params?:Record<string,any>;svgPreview:string}): void {
    if (!this.canvas || !this.fabric) return;
    const cx = this.canvas.getWidth() / 2;
    const cy = this.canvas.getHeight() / 2;
    const id = `el-${Date.now()}`;
    if (el.type === 'rect') {
      this.ed.pushUndoState();
      const rx = el.params?.['rx'] ?? 0;
      const obj = new this.fabric.Rect({ _id: id, name: el.name, left: cx - 60, top: cy - 40, width: 120, height: 80, fill: '#3b82f6', rx, ry: rx });
      this.canvas.add(obj);
      this.canvas.setActiveObject(obj);
      this.canvas.renderAll();
      this.onSelect({ target: obj });
    } else if (el.type === 'circle') {
      this.addShape('circle');
    } else if (el.type === 'polygon') {
      this.addShape('polygon');
      const added = this.canvas.getObjects().slice(-1)[0];
      if (added && el.params?.['_sides']) { added._sides = el.params['_sides']; }
    } else if (el.type === 'star') {
      this.addShape('star');
      const added = this.canvas.getObjects().slice(-1)[0];
      if (added) {
        if (el.params?.['_starPoints']) added._starPoints = el.params['_starPoints'];
        if (el.params?.['_starRatio']) added._starRatio = el.params['_starRatio'];
      }
    } else if (el.type === 'line') {
      this.ed.pushUndoState();
      const dashArray = el.params?.['strokeDashArray'] ?? [];
      const obj = new this.fabric.Line([0, 0, 180, 0], { _id: id, name: el.name, left: cx - 90, top: cy, stroke: '#1a1a2e', strokeWidth: 3, fill: '', strokeDashArray: dashArray });
      this.canvas.add(obj);
      this.canvas.setActiveObject(obj);
      this.canvas.renderAll();
      this.onSelect({ target: obj });
    }
    this.ed.toolMode.set('select');
    this.ed.setDirty();
  }

  // ── Canvas background (Canva / Freepik / PosterMyWall) ─
  setCanvasBgColor(color: string): void {
    if (!this.canvas) return;
    this.ed.pushUndoState();
    this.canvas.set('backgroundColor', color);
    this.canvas.renderAll();
    this.ed.setDirty();
    this.trackRecentColor(color);
  }

  setCanvasBgGradient(g: {label:string;c1:string;c2:string}): void {
    if (!this.canvas || !this.fabric) return;
    this.ed.pushUndoState();
    const w = this.canvas.getWidth();
    const h = this.canvas.getHeight();
    try {
      const gradient = new this.fabric.Gradient({
        type: 'linear',
        gradientUnits: 'pixels',
        coords: { x1: 0, y1: 0, x2: w, y2: h },
        colorStops: [{ offset: 0, color: g.c1 }, { offset: 1, color: g.c2 }],
      });
      this.canvas.set('backgroundColor', gradient as any);
    } catch {
      // fallback to solid if gradient API differs
      this.canvas.set('backgroundColor', g.c1);
    }
    this.canvas.renderAll();
    this.ed.setDirty();
  }

  // ── Image adjustments (Magnific / Canva style) ────────
  applyImageAdjustment(): void {
    const obj = this._selectedObject;
    if (!obj || !this.fabric) return;
    const isImg = obj.type === 'image' || obj.isType?.('image');
    if (!isImg) return;
    this.ed.pushUndoState();
    const filters: any[] = [];
    const b = this.imgBrightness();
    const c = this.imgContrast();
    const s = this.imgSaturation();
    const h = this.imgHue();
    if (b !== 0) filters.push(new this.fabric.filters.Brightness({ brightness: b / 100 }));
    if (c !== 0) filters.push(new this.fabric.filters.Contrast({ contrast: c / 100 }));
    if (s !== 0) filters.push(new this.fabric.filters.Saturation({ saturation: s / 100 }));
    if (h !== 0) filters.push(new this.fabric.filters.HueRotation({ rotation: h / 360 }));
    obj.filters = filters;
    obj.applyFilters?.();
    this.canvas?.renderAll();
    this.activeImageFilter.set('Custom');
    this.ed.setDirty();
  }

  applyImageFilter(preset: {label:string;filters:string[]}): void {
    const obj = this._selectedObject;
    if (!obj || !this.fabric) return;
    const isImg = obj.type === 'image' || obj.isType?.('image');
    if (!isImg) return;
    this.ed.pushUndoState();
    this.activeImageFilter.set(preset.label);
    const filters: any[] = [];
    for (const f of preset.filters) {
      const [name, valStr] = f.split(':');
      const val = valStr != null ? parseFloat(valStr) : undefined;
      try {
        if (name === 'Grayscale') filters.push(new this.fabric.filters.Grayscale());
        else if (name === 'Sepia') filters.push(new this.fabric.filters.Sepia());
        else if (name === 'Invert') filters.push(new this.fabric.filters.Invert());
        else if (name === 'Brightness' && val != null) filters.push(new this.fabric.filters.Brightness({ brightness: val }));
        else if (name === 'Contrast' && val != null) filters.push(new this.fabric.filters.Contrast({ contrast: val }));
        else if (name === 'Saturation' && val != null) filters.push(new this.fabric.filters.Saturation({ saturation: val }));
        else if (name === 'HueRotation' && val != null) filters.push(new this.fabric.filters.HueRotation({ rotation: val / 360 }));
      } catch { /* filter not available */ }
    }
    obj.filters = filters;
    obj.applyFilters?.();
    this.canvas?.renderAll();
    // Reset adjustment sliders to neutral
    this.imgBrightness.set(0); this.imgContrast.set(0);
    this.imgSaturation.set(0); this.imgHue.set(0);
    this.ed.setDirty();
  }

  resetImageAdjustments(): void {
    const obj = this._selectedObject;
    if (!obj) return;
    obj.filters = [];
    obj.applyFilters?.();
    this.canvas?.renderAll();
    this.imgBrightness.set(0); this.imgContrast.set(0);
    this.imgSaturation.set(0); this.imgHue.set(0);
    this.activeImageFilter.set('Normal');
    this.ed.setDirty();
  }

  // ── Canvas size / format (Vistaprint / Canva) ─────────
  applyCanvasPreset(preset: {label:string;w:number;h:number;tag:string}): void {
    if (!this.canvas) return;
    this.customWidth.set(preset.w);
    this.customHeight.set(preset.h);
    this.canvas.setDimensions({ width: preset.w, height: preset.h });
    this.canvas.renderAll();
    this.ed.setDirty();
    this.showSizeDialog.set(false);
  }

  applyCustomSize(): void {
    if (!this.canvas) return;
    const w = Math.min(Math.max(this.customWidth(), 100), 6000);
    const h = Math.min(Math.max(this.customHeight(), 100), 6000);
    this.canvas.setDimensions({ width: w, height: h });
    this.canvas.renderAll();
    this.ed.setDirty();
    this.showSizeDialog.set(false);
  }

  // ── Color tracking (Dribbble / Canva) ─────────────────
  trackRecentColor(color: string): void {
    if (!color || color === 'transparent' || color === '') return;
    this.recentColors.update(cols => [color, ...cols.filter(c => c !== color)].slice(0, 12));
  }

  // ── Safe zone overlay (Vistaprint) ────────────────────
  toggleSafeZone(): void {
    this.showSafeZone.update(v => !v);
  }

  // ── Shortcuts modal ───────────────────────────────────
  toggleShortcutsModal(): void {
    this.showShortcutsModal.update(v => !v);
  }

  // ═══════════════════════════════════════════════════════

  // ── Toast notifications ───────────────────────────────
  showToast(message: string, type: 'info' | 'error' | 'success' = 'info', durationMs = 3500): void {
    const id = ++this._toastCounter;
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this.dismissToast(id), durationMs);
  }

  dismissToast(id: number): void {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }

  // ── Copy / Paste ──────────────────────────────────────
  copySelected(): void {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObjects?.() ?? [];
    if (!active.length) return;
    this._clipboard = active.map((obj: any) => {
      try {
        return obj.toObject([
          '_id', 'name', '_shapeType', '_sides', '_cornerRadius', '_starPoints', '_starRatio',
          '_arrowStart', '_arrowEnd', '_arc', '_sweep', '_ratio', '_layerBlur',
          '_fillType', '_gradientColors', '_gradientAngle', '_gradientRadius',
        ]);
      } catch (err) {
        console.warn('Copy serialization failed for object:', err);
        return null;
      }
    }).filter(Boolean);
    if (this._clipboard.length) {
      this.showToast(`Copied ${this._clipboard.length} object${this._clipboard.length > 1 ? 's' : ''}`, 'success', 1800);
    }
  }

  pasteClipboard(): void {
    if (!this.canvas || !this.fabric || !this._clipboard.length) return;
    this.ed.pushUndoState();
    const pasted: any[] = [];
    let pending = this._clipboard.length;
    this._clipboard.forEach((objData: any) => {
      try {
        this.fabric.util.enlivenObjects([objData], (objects: any[]) => {
          objects.forEach((obj: any) => {
            obj.set({
              _id: `paste-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: `${objData.name ?? 'Layer'} Copy`,
              left: (objData.left ?? 0) + 20,
              top: (objData.top ?? 0) + 20,
            });
            obj.setCoords?.();
            this.canvas!.add(obj);
            pasted.push(obj);
          });
          pending--;
          if (pending === 0) {
            if (pasted.length === 1) {
              this.canvas!.setActiveObject(pasted[0]);
            } else if (pasted.length > 1) {
              try {
                const sel = new this.fabric.ActiveSelection(pasted, { canvas: this.canvas! });
                this.canvas!.setActiveObject(sel as any);
              } catch {
                this.canvas!.setActiveObject(pasted[0]);
              }
            }
            this.canvas!.renderAll();
            this.onModify();
          }
        });
      } catch (err) {
        console.warn('Paste failed for object:', err);
        pending--;
      }
    });
  }

  // ── Arrow-key nudge ───────────────────────────────────
  nudgeSelected(key: string, delta: number): void {
    if (!this.canvas) return;
    const objs = this.canvas.getActiveObjects?.() ?? [];
    if (!objs.length) return;
    this.ed.pushUndoState();
    objs.forEach((obj: any) => {
      switch (key) {
        case 'ArrowLeft':  obj.set({ left: (obj.left ?? 0) - delta }); break;
        case 'ArrowRight': obj.set({ left: (obj.left ?? 0) + delta }); break;
        case 'ArrowUp':    obj.set({ top:  (obj.top  ?? 0) - delta }); break;
        case 'ArrowDown':  obj.set({ top:  (obj.top  ?? 0) + delta }); break;
      }
      obj.setCoords?.();
    });
    this.canvas.renderAll();
    this.onModify();
  }

  // ═══════════════════════════════════════════════════════
  // ── Right-click context menu ─────────────────────────

  private handleCanvasContextMenu(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this.canvas) return;

    // Find object under cursor and select it if not already selected.
    // Guard: only call setActiveObject on proper Fabric objects that have onSelect()
    // (findTarget can return custom stroke-side handles or arrow controls that lack it).
    const target = (this.canvas as any).findTarget(e, false);
    if (
      target &&
      !target._isStrokeSide &&
      !target._isArrow &&
      typeof target.onSelect === 'function'
    ) {
      const already = (this.canvas.getActiveObjects?.() ?? []).some((o: any) => o === target);
      if (!already) {
        try {
          this.canvas.setActiveObject(target);
          this.canvas.renderAll();
          this.onSelect({ target, selected: [target] });
        } catch { /* non-selectable object — ignore */ }
      }
    }

    const objs: any[] = this.canvas.getActiveObjects?.() ?? [];
    const first = objs[0] ?? null;
    const objType = first?.type ?? '';
    const isText = ['i-text', 'text', 'textbox'].includes(objType);
    const isImage = objType === 'image';
    const isGroup = objType === 'group' || objType === 'activeselection';

    // Position — flip to stay inside viewport
    const menuW = 236, menuH = 460;
    let x = e.clientX, y = e.clientY;
    if (x + menuW > window.innerWidth - 8) x = x - menuW;
    if (y + menuH > window.innerHeight - 8) y = window.innerHeight - menuH - 8;
    if (y < 8) y = 8;
    if (x < 8) x = 8;

    this.ctxMenu.set({
      visible: true, x, y,
      hasSelection: objs.length > 0,
      selCount: objs.length,
      objType,
      isLocked: first?.lockMovementX ?? false,
      isGroup,
      isText,
      isImage,
      hasClipboard: this._clipboard.length > 0,
    });
  }

  hideCtxMenu(): void {
    if (this.ctxMenu().visible) this.ctxMenu.update(m => ({ ...m, visible: false }));
  }

  private ctxRun(action: () => void): void {
    this.hideCtxMenu();
    requestAnimationFrame(() => action());
  }

  ctxCopy(): void         { this.ctxRun(() => this.copySelected()); }
  ctxCut(): void          { this.ctxRun(() => this.cutSelected()); }
  ctxPaste(): void        { this.ctxRun(() => this.pasteClipboard()); }
  ctxDuplicate(): void    { this.ctxRun(() => this.duplicateSelected()); }
  ctxBringToFront(): void { this.ctxRun(() => this.bringSelectedToFront()); }
  ctxBringForward(): void { this.ctxRun(() => this.moveSelectedForward()); }
  ctxSendBackward(): void { this.ctxRun(() => this.moveSelectedBackward()); }
  ctxSendToBack(): void   { this.ctxRun(() => this.sendSelectedToBack()); }
  ctxFlipH(): void        { this.ctxRun(() => this.flipSelectedHorizontal()); }
  ctxFlipV(): void        { this.ctxRun(() => this.flipSelectedVertical()); }
  ctxRotateCW(): void     { this.ctxRun(() => this.rotateSelected(90)); }
  ctxRotateCCW(): void    { this.ctxRun(() => this.rotateSelected(-90)); }
  ctxGroup(): void        { this.ctxRun(() => this.groupSelected()); }
  ctxUngroup(): void      { this.ctxRun(() => this.ungroupSelected()); }
  ctxCenterH(): void      { this.ctxRun(() => this.centerOnCanvas('h')); }
  ctxCenterV(): void      { this.ctxRun(() => this.centerOnCanvas('v')); }
  ctxLock(): void         { this.ctxRun(() => this.toggleSelectedLock()); }
  ctxSelectAll(): void    { this.ctxRun(() => this.selectAll()); }
  ctxDelete(): void       { this.ctxRun(() => this.deleteSelected()); }
  ctxEditText(): void {
    this.ctxRun(() => {
      const obj = this._selectedObject;
      if (obj?.enterEditing) { obj.enterEditing(); this.canvas?.renderAll(); }
    });
  }
  ctxReplaceImage(): void {
    this.ctxRun(() => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = async (ev: any) => {
        const file: File = ev.target?.files?.[0];
        if (!file || !this.canvas || !this.fabric) return;
        const url = await new Promise<string>(res => {
          const r = new FileReader();
          r.onload = (e2: any) => res(e2.target.result);
          r.readAsDataURL(file);
        });
        const obj = this._selectedObject;
        if (!obj || obj.type !== 'image') return;
        this.fabric.Image.fromURL(url, (img: any) => {
          if (!img) return;
          obj.setElement(img.getElement());
          obj.set({ width: img.width, height: img.height, scaleX: 1, scaleY: 1 });
          obj.setCoords?.();
          this.canvas?.renderAll();
          this.onModify();
          this.showToast('Image replaced', 'success', 2000);
        });
      };
      input.click();
    });
  }

  // ── Core new utility methods ──────────────────────────

  flipSelectedHorizontal(): void {
    const objs = this.canvas?.getActiveObjects?.() ?? [];
    if (!objs.length) return;
    this.ed.pushUndoState();
    objs.forEach((obj: any) => obj.set('flipX', !obj.flipX));
    this.canvas?.renderAll();
    this.onModify();
    this.showToast('Flipped horizontally', 'info', 1500);
  }

  flipSelectedVertical(): void {
    const objs = this.canvas?.getActiveObjects?.() ?? [];
    if (!objs.length) return;
    this.ed.pushUndoState();
    objs.forEach((obj: any) => obj.set('flipY', !obj.flipY));
    this.canvas?.renderAll();
    this.onModify();
    this.showToast('Flipped vertically', 'info', 1500);
  }

  rotateSelected(deg: number): void {
    const objs = this.canvas?.getActiveObjects?.() ?? [];
    if (!objs.length) return;
    this.ed.pushUndoState();
    objs.forEach((obj: any) => {
      obj.set('angle', ((obj.angle ?? 0) + deg + 360) % 360);
      obj.setCoords?.();
    });
    this.canvas?.renderAll();
    this.onModify();
  }

  cutSelected(): void {
    if (!this.canvas) return;
    const count = this.canvas.getActiveObjects?.()?.length ?? 0;
    if (!count) return;
    this.copySelected();
    this.deleteSelected();
    this.showToast(`Cut ${count} object${count > 1 ? 's' : ''}`, 'info', 1800);
  }

  centerOnCanvas(axis: 'h' | 'v' | 'both' = 'both'): void {
    if (!this.canvas) return;
    const objs = this.canvas.getActiveObjects?.() ?? [];
    if (!objs.length) return;
    this.ed.pushUndoState();
    const cw = this.canvas.getWidth();
    const ch = this.canvas.getHeight();
    objs.forEach((obj: any) => {
      const b = obj.getBoundingRect(true);
      if (axis === 'h' || axis === 'both') {
        obj.set('left', (obj.left ?? 0) + (cw / 2 - (b.left + b.width / 2)));
      }
      if (axis === 'v' || axis === 'both') {
        obj.set('top', (obj.top ?? 0) + (ch / 2 - (b.top + b.height / 2)));
      }
      obj.setCoords?.();
    });
    this.canvas.renderAll();
    this.onModify();
  }

  // ── Floating toolbar ─────────────────────────────────

  updateFloatBar(): void {
    const canvas = this.canvas;
    if (!canvas) { this.floatBar.update(b => ({ ...b, visible: false })); return; }
    const activeObj = canvas.getActiveObject?.();
    if (!activeObj) { this.floatBar.update(b => ({ ...b, visible: false })); return; }
    const canvasEl = this.canvasElRef?.nativeElement;
    if (!canvasEl) { this.floatBar.update(b => ({ ...b, visible: false })); return; }

    const br = activeObj.getBoundingRect(true);
    const canvasRect = canvasEl.getBoundingClientRect();
    const TOOLBAR_H = 44;
    const GAP = 10;
    let screenX = canvasRect.left + br.left + br.width / 2;
    let screenY = canvasRect.top + br.top - GAP - TOOLBAR_H;
    // flip below if not enough room above
    if (screenY < 8) screenY = canvasRect.top + br.top + br.height + GAP;
    // clamp horizontal
    screenX = Math.max(120, Math.min(screenX, window.innerWidth - 120));

    const type = (activeObj as any).type ?? '';
    const isText = type === 'i-text' || type === 'text';
    const isImage = type === 'image';
    const isGroup = type === 'group';
    const selCount = canvas.getActiveObjects?.()?.length ?? 1;
    const isLocked = !!(activeObj as any).lockMovementX;
    const fw = (activeObj as any).fontWeight;
    const isBold = fw === 'bold' || (typeof fw === 'number' && fw >= 700);
    const isItalic = (activeObj as any).fontStyle === 'italic';

    this.floatBar.set({ visible: true, x: screenX, y: screenY, isText, isImage, isGroup, isLocked, selCount, isBold, isItalic });
  }

  ftBold(): void {
    const obj = this.canvas?.getActiveObject?.() as any;
    if (!obj) return;
    this.ed.pushUndoState();
    const next = obj.fontWeight === 'bold' || obj.fontWeight >= 700 ? 'normal' : 'bold';
    obj.set('fontWeight', next);
    this.canvas?.renderAll();
    this.onModify();
    this.updateFloatBar();
  }

  ftItalic(): void {
    const obj = this.canvas?.getActiveObject?.() as any;
    if (!obj) return;
    this.ed.pushUndoState();
    const next = obj.fontStyle === 'italic' ? 'normal' : 'italic';
    obj.set('fontStyle', next);
    this.canvas?.renderAll();
    this.onModify();
    this.updateFloatBar();
  }

  // ═══════════════════════════════════════════════════════

  // ═══ NEW FEATURE METHODS (Position/Size/Distribute/Draw/Etc.) ════

  // ── Transform panel: X / Y / W / H / Rotation ────────────────────

  setPosX(v: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    this.ed.pushUndoState();
    obj.set('left', Math.round(v));
    obj.setCoords?.();
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  setPosY(v: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    this.ed.pushUndoState();
    obj.set('top', Math.round(v));
    obj.setCoords?.();
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  setSizeW(v: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    const naturalW = obj.width ?? 1;
    if (naturalW === 0) return;
    this.ed.pushUndoState();
    const newScaleX = Math.max(0.01, v / naturalW);
    if (this.aspectLocked()) {
      const naturalH = obj.height ?? 1;
      const newScaleY = Math.max(0.01, (v / this._lockedAspectRatio) / naturalH);
      obj.set({ scaleX: newScaleX, scaleY: newScaleY });
    } else {
      obj.set('scaleX', newScaleX);
    }
    obj.setCoords?.();
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  setSizeH(v: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    const naturalH = obj.height ?? 1;
    if (naturalH === 0) return;
    this.ed.pushUndoState();
    const newScaleY = Math.max(0.01, v / naturalH);
    if (this.aspectLocked()) {
      const naturalW = obj.width ?? 1;
      const newScaleX = Math.max(0.01, (v * this._lockedAspectRatio) / naturalW);
      obj.set({ scaleX: newScaleX, scaleY: newScaleY });
    } else {
      obj.set('scaleY', newScaleY);
    }
    obj.setCoords?.();
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  setRotation(v: number): void {
    const obj = this._selectedObject;
    if (!obj) return;
    this.ed.pushUndoState();
    obj.set('angle', ((v % 360) + 360) % 360);
    obj.setCoords?.();
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  toggleAspectLock(): void {
    const w = this.selectedW();
    const h = this.selectedH();
    this._lockedAspectRatio = h !== 0 ? w / h : 1;
    this.aspectLocked.update(v => !v);
  }

  // ── Distribute evenly (Canva / Vistaprint) ────────────────────────

  distributeHorizontally(): void {
    if (!this.canvas) return;
    const objects = this.canvas.getActiveObjects?.() ?? [];
    if (objects.length < 3) {
      this.showToast('Select 3+ objects to distribute', 'info', 2000);
      return;
    }
    this.ed.pushUndoState();
    const sorted = [...objects].sort((a, b) =>
      a.getBoundingRect(true).left - b.getBoundingRect(true).left
    );
    const firstB = sorted[0].getBoundingRect(true);
    const lastB = sorted[sorted.length - 1].getBoundingRect(true);
    const totalObjW = sorted.reduce((s, o) => s + o.getBoundingRect(true).width, 0);
    const totalSpace = (lastB.left + lastB.width) - firstB.left;
    const gap = (totalSpace - totalObjW) / (sorted.length - 1);
    let cur = firstB.left + firstB.width + gap;
    for (let i = 1; i < sorted.length - 1; i++) {
      const b = sorted[i].getBoundingRect(true);
      sorted[i].set('left', (sorted[i].left ?? 0) + (cur - b.left));
      sorted[i].setCoords?.();
      cur += b.width + gap;
    }
    this.canvas.renderAll();
    this.onModify();
  }

  distributeVertically(): void {
    if (!this.canvas) return;
    const objects = this.canvas.getActiveObjects?.() ?? [];
    if (objects.length < 3) {
      this.showToast('Select 3+ objects to distribute', 'info', 2000);
      return;
    }
    this.ed.pushUndoState();
    const sorted = [...objects].sort((a, b) =>
      a.getBoundingRect(true).top - b.getBoundingRect(true).top
    );
    const firstB = sorted[0].getBoundingRect(true);
    const lastB = sorted[sorted.length - 1].getBoundingRect(true);
    const totalObjH = sorted.reduce((s, o) => s + o.getBoundingRect(true).height, 0);
    const totalSpace = (lastB.top + lastB.height) - firstB.top;
    const gap = (totalSpace - totalObjH) / (sorted.length - 1);
    let cur = firstB.top + firstB.height + gap;
    for (let i = 1; i < sorted.length - 1; i++) {
      const b = sorted[i].getBoundingRect(true);
      sorted[i].set('top', (sorted[i].top ?? 0) + (cur - b.top));
      sorted[i].setCoords?.();
      cur += b.height + gap;
    }
    this.canvas.renderAll();
    this.onModify();
  }

  // ── Text transform (Uppercase / lowercase / Capitalize) ───────────

  applyTextTransform(transform: 'upper' | 'lower' | 'capitalize'): void {
    const obj = this._selectedObject;
    if (!obj) return;
    const text: string = obj.text ?? '';
    if (!text) return;
    this.ed.pushUndoState();
    let newText: string;
    switch (transform) {
      case 'upper': newText = text.toUpperCase(); break;
      case 'lower': newText = text.toLowerCase(); break;
      default: newText = text.replace(/\b\w/g, c => c.toUpperCase());
    }
    obj.set('text', newText);
    this.canvas?.renderAll();
    this.readPropsFromSelected();
    this.ed.setDirty();
  }

  // ── SVG Icon library ──────────────────────────────────────────────

  addIcon(icon: {name: string; svg: string}): void {
    if (!this.canvas || !this.fabric) return;
    this.ed.pushUndoState();
    const id = `icon-${Date.now()}`;
    const c = this.getCanvasCenter();
    const dataUri = `data:image/svg+xml,${encodeURIComponent(icon.svg)}`;
    void this.loadFabricImage(dataUri, false).then((img: any) => {
      if (!img) return;
      const size = 100;
      img.set({
        _id: id,
        name: icon.name,
        left: c.x - size / 2,
        top: c.y - size / 2,
        scaleX: size / (img.width || size),
        scaleY: size / (img.height || size),
      });
      this.canvas!.add(img);
      this.canvas!.setActiveObject(img);
      this.canvas!.renderAll();
      this.onSelect({ target: img });
      this.ed.setDirty();
    });
  }

  // ── Draw / Pencil / Freehand (Canva / Freepik) ────────────────────

  enableDrawingMode(): void {
    if (!this.canvas || !this.fabric) return;
    this.canvas.isDrawingMode = true;
    if (this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.width = this.drawBrushSize();
      this.canvas.freeDrawingBrush.color = this.drawErase()
        ? 'rgba(255,255,255,1)'
        : this.drawBrushColor();
    }
  }

  disableDrawingMode(): void {
    if (!this.canvas) return;
    this.canvas.isDrawingMode = false;
    this.drawErase.set(false);
  }

  updateDrawBrush(): void {
    if (!this.canvas?.freeDrawingBrush) return;
    this.canvas.freeDrawingBrush.width = this.drawBrushSize();
    this.canvas.freeDrawingBrush.color = this.drawErase()
      ? 'rgba(255,255,255,1)'
      : this.drawBrushColor();
  }

  toggleDrawErase(): void {
    this.drawErase.update(v => !v);
    this.updateDrawBrush();
  }

  // ── Presentation / Fullscreen mode (Canva) ────────────────────────

  togglePresentationMode(): void {
    this.presentationMode.update(v => !v);
    if (this.presentationMode()) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  // ── Google Fonts dynamic loader ───────────────────────────────────

  private loadGoogleFonts(): void {
    if (document.querySelector('link[data-amx-gfonts]')) return;
    const fonts = [
      'Montserrat', 'Open+Sans', 'Raleway', 'Merriweather', 'Oswald',
      'Nunito', 'Source+Sans+3', 'Ubuntu', 'Libre+Baskerville',
      'Dancing+Script', 'Pacifico', 'Bebas+Neue',
    ];
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f}:wght@400;600;700`).join('&')}&display=swap`;
    link.setAttribute('data-amx-gfonts', '1');
    document.head.appendChild(link);
  }

  // ═══════════════════════════════════════════════════════════════════

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
      this.canvasAreaRef.nativeElement.removeEventListener('mousedown', this.canvasMouseDownHandler);
      this.canvasAreaRef.nativeElement.removeEventListener('contextmenu', this.canvasContextMenuHandler);
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
