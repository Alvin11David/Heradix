import {
  Component, ChangeDetectionStrategy, inject, signal, computed, HostListener,
  ElementRef, ViewChild, AfterViewInit, OnDestroy,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconsService, ICON_CATEGORIES } from '../icons.service';
import { ICON_LIBRARIES } from '../data/index';
import {
  IconAsset, IconAesthetic, IconTrend, IconTechnique,
  IconColorMode, IconCorners, IconSizeDensity, IconLibraryId,
  IconCollection, IconPlatform, IconStyleState,
} from '../../../core/models/icon.model';
interface IconGroup { label: string; icons: IconAsset[]; }
interface StylePack {
  id: string;
  name: string;
  subtitle: string;
  badge?: string;
  style: Partial<IconStyleState>;
  accent: string;
  gradient: string;
  darkBg?: boolean;
}
interface TrendCard {
  id: string;
  name: string;
  tag: string;
  style: Partial<IconStyleState>;
  accent: string;
  bg: string;
  darkBg?: boolean;
}
type AnimationType = 'none' | 'spin' | 'pulse' | 'bounce' | 'shake' | 'ping';
const PNG_SIZES = [16, 32, 64, 128, 256, 512];
const DAY = 24 * 60 * 60 * 1000;
export const STYLE_PACKS: StylePack[] = [
  {
    id: 'ios17', name: 'iOS 17', subtitle: 'Ultra-thin system icons', badge: 'NEW',
    style: { technique: 'line', corners: 'round', strokeWidth: 1.5, colorMode: 'mono' },
    accent: '#007AFF', gradient: 'linear-gradient(135deg,#e8f4fd 0%,#f0f8ff 100%)',
  },
  {
    id: 'material3', name: 'Material 3', subtitle: "Google's design language",
    style: { technique: 'filled', corners: 'round', colorMode: 'mono' },
    accent: '#1976D2', gradient: 'linear-gradient(135deg,#e3f0ff 0%,#eff6ff 100%)',
  },
  {
    id: 'fluency3d', name: '3D Fluency', subtitle: 'Realistic depth & volume',
    style: { technique: '3d', corners: 'round', colorMode: 'gradient' },
    accent: '#f5820a', gradient: 'linear-gradient(135deg,#fff0e0 0%,#fef7f0 100%)',
  },
  {
    id: 'glassmorphic', name: 'Glassmorphic', subtitle: 'Frosted glass aesthetic', badge: 'TRENDING',
    style: { technique: 'line', corners: 'round', strokeWidth: 1.5, colorMode: 'mono' },
    accent: '#a855f7', gradient: 'linear-gradient(135deg,#f3e8ff 0%,#faf5ff 100%)',
  },
  {
    id: 'neon', name: 'Neon Glow', subtitle: 'Vibrant electric strokes', badge: 'HOT',
    style: { technique: 'line', corners: 'sharp', strokeWidth: 2, colorMode: 'mono' },
    accent: '#22d3ee', gradient: 'linear-gradient(135deg,#083344 0%,#0f172a 100%)', darkBg: true,
  },
  {
    id: 'sketch', name: 'Sketch', subtitle: 'Hand-crafted imperfection',
    style: { technique: 'hand-drawn', corners: 'round', strokeWidth: 2, colorMode: 'mono' },
    accent: '#78716c', gradient: 'linear-gradient(135deg,#fdf8f0 0%,#f5f0ea 100%)',
  },
  {
    id: 'bold', name: 'Bold Outlined', subtitle: 'High-impact thick strokes',
    style: { technique: 'line', corners: 'round', strokeWidth: 3, colorMode: 'mono' },
    accent: '#111827', gradient: 'linear-gradient(135deg,#f9fafb 0%,#f3f4f6 100%)',
  },
  {
    id: 'gradient', name: 'Gradient Flow', subtitle: 'Smooth color transitions',
    style: { technique: 'line', corners: 'round', strokeWidth: 2, colorMode: 'gradient' },
    accent: '#6366f1', gradient: 'linear-gradient(135deg,#eef2ff 0%,#f5f3ff 100%)',
  },
  {
    id: 'duotone', name: 'Duo-tone', subtitle: 'Two-color harmony',
    style: { technique: 'filled', corners: 'round', colorMode: 'duo' },
    accent: '#ec4899', gradient: 'linear-gradient(135deg,#fce7f3 0%,#fdf4ff 100%)',
  },
  {
    id: 'pastel', name: 'Pastel Filled', subtitle: 'Soft friendly shapes',
    style: { technique: 'filled', corners: 'round', colorMode: 'mono' },
    accent: '#10b981', gradient: 'linear-gradient(135deg,#d1fae5 0%,#ecfdf5 100%)',
  },
  {
    id: 'windows11', name: 'Windows 11', subtitle: 'Fluent design iconography',
    style: { technique: 'line', corners: 'round', strokeWidth: 1, colorMode: 'mono' },
    accent: '#0078D4', gradient: 'linear-gradient(135deg,#dbeafe 0%,#eff6ff 100%)',
  },
  {
    id: 'pixel', name: 'Pixel Art', subtitle: '8-bit retro nostalgia',
    style: { technique: 'filled', corners: 'sharp', colorMode: 'mono' },
    accent: '#f59e0b', gradient: 'linear-gradient(135deg,#fef3c7 0%,#fffbeb 100%)',
  },
];
const TREND_CARDS: TrendCard[] = [
  {
    id: 'glassmorphism', name: 'Glassmorphism', tag: '🔥 Trending',
    style: { technique: 'line', corners: 'round', strokeWidth: 1.5, colorMode: 'mono' },
    accent: '#a855f7', bg: 'linear-gradient(135deg,rgba(168,85,247,0.15),rgba(99,102,241,0.08))',
  },
  {
    id: 'neon-glow', name: 'Neon Glow', tag: '⚡ Hot',
    style: { technique: 'line', corners: 'sharp', strokeWidth: 2, colorMode: 'mono' },
    accent: '#22d3ee', bg: 'linear-gradient(135deg,rgba(8,51,68,0.92),rgba(15,23,42,0.96))', darkBg: true,
  },
  {
    id: 'liquid-glass', name: 'Liquid Glass', tag: '✨ New',
    style: { technique: '3d', corners: 'round', colorMode: 'gradient' },
    accent: '#0ea5e9', bg: 'linear-gradient(135deg,rgba(14,165,233,0.12),rgba(99,102,241,0.1))',
  },
  {
    id: 'handsy', name: 'Handsy', tag: '🎨 Creative',
    style: { technique: 'hand-drawn', corners: 'round', strokeWidth: 2, colorMode: 'mono' },
    accent: '#f97316', bg: 'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(245,130,10,0.06))',
  },
  {
    id: 'tapes', name: 'Tapes', tag: '📼 Retro',
    style: { technique: 'hand-drawn', corners: 'sharp', strokeWidth: 2.5, colorMode: 'mono' },
    accent: '#78716c', bg: 'linear-gradient(135deg,rgba(120,113,108,0.14),rgba(87,83,78,0.06))',
  },
  {
    id: 'mono-bold', name: 'Mono Bold', tag: '💎 Classic',
    style: { technique: 'filled', corners: 'sharp', colorMode: 'mono' },
    accent: '#111827', bg: 'linear-gradient(135deg,rgba(17,24,39,0.07),rgba(55,65,81,0.03))',
  },
];
const PLATFORM_TABS = [
  { id: null as null, label: 'All Platforms' },
  { id: 'ios' as const, label: 'iOS' },
  { id: 'android' as const, label: 'Android' },
  { id: 'windows' as const, label: 'Windows' },
  { id: 'macos' as const, label: 'macOS' },
];
const ANIMATION_TYPES: { id: AnimationType; label: string; emoji: string }[] = [
  { id: 'none', label: 'Static', emoji: '◼' },
  { id: 'spin', label: 'Spin', emoji: '↻' },
  { id: 'pulse', label: 'Pulse', emoji: '◎' },
  { id: 'bounce', label: 'Bounce', emoji: '⬆' },
  { id: 'shake', label: 'Shake', emoji: '↔' },
  { id: 'ping', label: 'Ping', emoji: '◯' },
];
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}
function fuzzyScore(token: string, target: string): number {
  if (target.includes(token)) return 0;
  const dist = levenshtein(token, target);
  const maxLen = Math.max(token.length, target.length);
  if (dist <= 1 && maxLen >= 4) return 22;
  if (dist <= 2 && maxLen >= 6) return 12;
  return 0;
}
interface IconRequest {
  id: string;
  name: string;
  description: string;
  style: string;
  email: string;
  votes: number;
  submittedAt: string;
  status: 'pending' | 'planned' | 'done';
}
const ICON_REQUESTS_KEY = 'amx_icon_requests';
function loadRequests(): IconRequest[] {
  try { return JSON.parse(localStorage.getItem(ICON_REQUESTS_KEY) ?? '[]'); } catch { return []; }
}
function saveRequests(reqs: IconRequest[]): void {
  try { localStorage.setItem(ICON_REQUESTS_KEY, JSON.stringify(reqs)); } catch {  }
}
const AI_SYNONYMS: Record<string, string[]> = {
  settings: ['gear', 'cog', 'config', 'preferences', 'options', 'tune', 'wrench'],
  home: ['house', 'homepage', 'main', 'dashboard', 'start'],
  delete: ['trash', 'remove', 'bin', 'garbage', 'discard', 'clear', 'recycle'],
  add: ['plus', 'create', 'new', 'append', 'insert'],
  close: ['x', 'dismiss', 'exit', 'cancel', 'cross'],
  search: ['magnify', 'find', 'lookup', 'glass', 'discover'],
  edit: ['pencil', 'pen', 'modify', 'write', 'update', 'compose'],
  user: ['person', 'profile', 'account', 'avatar', 'human', 'member'],
  money: ['currency', 'payment', 'cash', 'wallet', 'coin', 'dollar', 'finance'],
  message: ['chat', 'comment', 'talk', 'bubble', 'text', 'conversation'],
  image: ['photo', 'picture', 'camera', 'media', 'gallery', 'photograph'],
  upload: ['cloud', 'share', 'export', 'sync'],
  download: ['save', 'import', 'receive', 'fetch'],
  lock: ['security', 'private', 'secure', 'padlock', 'protect', 'key'],
  star: ['favorite', 'bookmark', 'rating', 'rate'],
  heart: ['like', 'love', 'favorite', 'care'],
  info: ['information', 'help', 'about', 'question', 'details'],
  warning: ['alert', 'caution', 'danger', 'error', 'attention', 'exclamation'],
  check: ['tick', 'done', 'complete', 'success', 'approve', 'confirm'],
  arrow: ['direction', 'navigate', 'pointer', 'move', 'chevron'],
  chart: ['graph', 'analytics', 'data', 'stats', 'statistics', 'report'],
  calendar: ['date', 'schedule', 'event', 'appointment', 'time', 'clock'],
  mail: ['email', 'inbox', 'letter', 'envelope', 'send'],
  phone: ['call', 'mobile', 'contact', 'dial', 'telephone'],
  music: ['audio', 'sound', 'song', 'melody', 'note', 'play'],
  video: ['movie', 'film', 'play', 'watch', 'recording'],
  code: ['developer', 'programming', 'terminal', 'console', 'script', 'dev'],
  location: ['map', 'pin', 'place', 'geo', 'position', 'navigation'],
  link: ['url', 'chain', 'connect', 'attach', 'hyperlink'],
  file: ['document', 'page', 'doc', 'paper', 'attachment'],
  folder: ['directory', 'collection', 'group', 'category'],
  grid: ['layout', 'dashboard', 'tiles', 'apps', 'table'],
  cart: ['shop', 'buy', 'purchase', 'store', 'basket', 'order', 'checkout'],
  notification: ['bell', 'alert', 'remind', 'notify', 'badge'],
  share: ['forward', 'distribute', 'spread', 'export', 'social'],
  filter: ['sort', 'refine', 'narrow', 'funnel', 'control'],
  refresh: ['reload', 'sync', 'update', 'restart', 'rotate'],
  eye: ['visible', 'show', 'view', 'preview', 'see', 'watch'],
  weather: ['sun', 'rain', 'cloud', 'wind', 'temperature', 'climate'],
  food: ['eat', 'restaurant', 'meal', 'dining', 'dish', 'kitchen'],
  tag: ['label', 'price', 'badge', 'category', 'mark'],
  tool: ['wrench', 'hammer', 'build', 'fix', 'repair'],
  wifi: ['network', 'connection', 'internet', 'wireless', 'signal'],
};
@Component({
  selector: 'amx-icons-new',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icons-new.component.html',
  styleUrl: './icons-new.component.scss',
})
export class IconsNewComponent implements AfterViewInit, OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly location = inject(Location);
  readonly svc = inject(IconsService);
  @ViewChild('scrollSentinel') scrollSentinelRef?: ElementRef<HTMLElement>;
  private scrollObserver?: IntersectionObserver;
  readonly categories = ICON_CATEGORIES;
  readonly libraryMeta = ICON_LIBRARIES;
  readonly webLibraries = ICON_LIBRARIES.filter(l => (l.kind ?? 'web') === 'web');
  readonly flutterLibraries = ICON_LIBRARIES.filter(l => l.kind === 'flutter');
  readonly pngSizes = PNG_SIZES;
  readonly stylePacks = STYLE_PACKS;
  readonly trendCards = TREND_CARDS;
  readonly platformTabs = PLATFORM_TABS;
  readonly animationTypes = ANIMATION_TYPES;
  readonly style = this.svc.style;
  readonly filters = this.svc.filters;
  readonly aiSearchOn = signal(false);
  readonly comingSoonMessage = signal('');
  readonly mobileFiltersOpen = signal(false);
  readonly selected = signal<IconAsset | null>(null);
  readonly copyState = signal<'idle' | 'copied'>('idle');
  readonly copyPngState = signal<'idle' | 'copied'>('idle');
  readonly figmaCopyState = signal<'idle' | 'copied' | 'opening'>('idle');
  readonly visibleCount = signal(48);
  readonly recolorOpen = signal(false);
  readonly animType = signal<AnimationType>('none');
  readonly showStyleGallery = signal(true);
  readonly showTrending = signal(true);
  readonly requestModalOpen = signal(false);
  readonly iconRequests = signal<IconRequest[]>(loadRequests());
  readonly requestForm = signal({ name: '', description: '', style: 'line', email: '' });
  readonly requestSubmitted = signal(false);
  readonly requestVoted = signal<Set<string>>(new Set());
  readonly requestsTab = signal<'submit' | 'browse'>('submit');
  readonly multiSelectMode = signal(false);
  readonly selectedIcons = signal<Set<string>>(new Set());
  readonly selectedCount = computed(() => this.selectedIcons().size);
  readonly bulkCollectIcon = signal<IconAsset | null>(null);
  readonly activeTab = signal<'browse' | 'collections'>('browse');
  readonly activeCollectionId = signal<string | null>(null);
  readonly collectionPickerIcon = signal<IconAsset | null>(null);
  readonly newCollectionName = signal('');
  readonly renamingCollectionId = signal<string | null>(null);
  readonly addFeedbackId = signal<string | null>(null);
  private comingSoonTimer?: ReturnType<typeof setTimeout>;
  readonly openCollection = computed(() => {
    const id = this.activeCollectionId();
    return id ? (this.svc.collections().find(c => c.id === id) ?? null) : null;
  });
  readonly activeCollectionIcons = computed<IconAsset[]>(() => {
    const col = this.openCollection();
    if (!col) return [];
    const allMap = new Map(this.svc.allIcons().map(i => [i.id, i]));
    return col.iconIds.map(i => allMap.get(i)).filter(Boolean) as IconAsset[];
  });
  collectionPreviewIcons(col: IconCollection): IconAsset[] {
    const allMap = new Map(this.svc.allIcons().map(i => [i.id, i]));
    return col.iconIds.slice(0, 4).map(id => allMap.get(id)).filter(Boolean) as IconAsset[];
  }
  readonly PRESET_COLORS = [
    '#f5820a', '#ef4444', '#ec4899', '#a855f7',
    '#6366f1', '#2563eb', '#0891b2', '#059669',
    '#16a34a', '#ca8a04', '#374151', '#9ca3af',
  ];
  readonly currentHue = computed(() => {
    const hex = this.style().recolorHue;
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return 25;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max === min) return 0;
    const d = max - min;
    let h = 0;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return Math.round(h * 360);
  });
  readonly activePlatform = computed<string | null>(() => {
    const platforms = this.filters().platforms;
    return platforms.length === 1 ? platforms[0] : null;
  });
  private readonly rawFiltered = this.svc.filteredIcons;
  readonly filtered = computed<IconAsset[]>(() => {
    const list = this.rawFiltered();
    const q = this.filters().query.trim().toLowerCase();
    if (!q) return list;
    if (!this.aiSearchOn()) {
      return list.filter(icon => {
        const h = `${icon.name} ${icon.tags.join(' ')} ${icon.category}`.toLowerCase();
        return h.includes(q);
      });
    }
    const tokens = q.split(/\s+/).filter(Boolean);
    const expandedSet = new Set(tokens);
    for (const token of tokens) {
      const fwd = AI_SYNONYMS[token] ?? [];
      fwd.forEach(s => expandedSet.add(s));
      for (const [key, syns] of Object.entries(AI_SYNONYMS)) {
        if (syns.includes(token)) expandedSet.add(key);
      }
    }
    const expanded = Array.from(expandedSet);
    const scored = list.map(icon => {
      const nameLow = icon.name.toLowerCase();
      const tagLow = icon.tags.join(' ').toLowerCase();
      const catLow = icon.category.toLowerCase();
      const nameWords = nameLow.split(/[\s\-_]+/);
      const tagWords = tagLow.split(/[\s,]+/);
      let score = 0;
      for (const token of tokens) {
        if (nameLow === token) score += 120;
        else if (nameLow.startsWith(token + ' ') || nameLow.endsWith(' ' + token)) score += 90;
        else if (nameLow.includes(token)) score += 60;
        if (icon.tags.some(t => t.toLowerCase() === token)) score += 70;
        else if (tagLow.includes(token)) score += 35;
        if (catLow.includes(token)) score += 20;
        for (const w of nameWords) { score += fuzzyScore(token, w) * 0.8; }
        for (const w of tagWords)  { score += fuzzyScore(token, w) * 0.5; }
      }
      for (const syn of expanded) {
        if (tokens.includes(syn)) continue;
        if (nameLow.includes(syn)) score += 30;
        else if (tagLow.includes(syn)) score += 18;
      }
      return { icon, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
    return scored.map(x => x.icon);
  });
  readonly visibleIcons = computed(() => this.filtered().slice(0, this.visibleCount()));
  readonly hasMore = computed(() => this.filtered().length > this.visibleCount());
  readonly groups = computed<IconGroup[]>(() => {
    const icons = this.visibleIcons();
    if (!icons.length) return [];
    const ref = icons.reduce((max, i) => Math.max(max, new Date(i.createdAt).getTime()), 0);
    const refDay = Math.floor(ref / DAY);
    const buckets: Record<string, IconAsset[]> = {
      'Today': [], 'Yesterday': [], 'This week': [], 'This month': [], 'Earlier': [],
    };
    for (const icon of icons) {
      const day = Math.floor(new Date(icon.createdAt).getTime() / DAY);
      const diff = refDay - day;
      if (diff <= 0) buckets['Today'].push(icon);
      else if (diff === 1) buckets['Yesterday'].push(icon);
      else if (diff <= 6) buckets['This week'].push(icon);
      else if (diff <= 29) buckets['This month'].push(icon);
      else buckets['Earlier'].push(icon);
    }
    return Object.entries(buckets)
      .filter(([, arr]) => arr.length > 0)
      .map(([label, arr]) => ({ label, icons: arr }));
  });
  readonly previewIcons = computed(() => this.svc.filteredIcons().slice(0, 4));
  styledPackSvg(icon: IconAsset, pack: StylePack): string {
    const filled = pack.style.technique === 'filled' || pack.style.technique === '3d';
    const cap = pack.style.corners === 'sharp' ? 'square' : 'round';
    const join = cap;
    const sw = pack.style.strokeWidth ?? 2;
    const color = pack.accent;
    const vb = icon.viewBox ?? '0 0 24 24';
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" fill="${filled ? color : 'none'}" stroke="${filled ? 'none' : color}" stroke-width="${sw}" stroke-linecap="${cap}" stroke-linejoin="${join}">${icon.path}</svg>`;
  }
  styledPackSvgSafe(icon: IconAsset, pack: StylePack): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.styledPackSvg(icon, pack));
  }
  styledTrendSvgSafe(icon: IconAsset, card: TrendCard): SafeHtml {
    const filled = card.style.technique === 'filled' || card.style.technique === '3d';
    const cap = card.style.corners === 'sharp' ? 'square' : 'round';
    const sw = card.style.strokeWidth ?? 2;
    const color = card.accent;
    const vb = icon.viewBox ?? '0 0 24 24';
    const svg = `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" fill="${filled ? color : 'none'}" stroke="${filled ? 'none' : color}" stroke-width="${sw}" stroke-linecap="${cap}" stroke-linejoin="${cap}">${icon.path}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
  readonly svgCache = new Map<string, SafeHtml>();
  markup(icon: IconAsset): SafeHtml {
    let cached = this.svgCache.get(icon.id);
    if (!cached) {
      const inner = icon.colorSvg ?? icon.path;
      const viewBox = icon.viewBox ?? '0 0 24 24';
      const svg = `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
      cached = this.sanitizer.bypassSecurityTrustHtml(svg);
      this.svgCache.set(icon.id, cached);
    }
    return cached;
  }
  isColored(icon: IconAsset): boolean { return !!icon.colorSvg; }
  libraryName(id: IconLibraryId | null | undefined): string {
    if (!id || id === 'amarapix') return 'Amarapix';
    return this.libraryMeta.find(l => l.id === id)?.name ?? id;
  }
  animClass(): string {
    if (!this.style().animatedOn) return '';
    const t = this.animType();
    return t === 'none' ? '' : `amx-icon-render--anim-${t}`;
  }
  isActiveStylePack(packId: string): boolean {
    const pack = STYLE_PACKS.find(p => p.id === packId);
    if (!pack) return false;
    const s = this.style();
    const ps = pack.style;
    return (
      (ps.technique == null || s.technique === ps.technique) &&
      (ps.colorMode == null || s.colorMode === ps.colorMode) &&
      (ps.corners == null || s.corners === ps.corners) &&
      (ps.strokeWidth == null || s.strokeWidth === ps.strokeWidth)
    );
  }
  applyStylePack(pack: StylePack): void {
    this.svc.updateStyle({
      technique: pack.style.technique ?? this.style().technique,
      colorMode: pack.style.colorMode ?? this.style().colorMode,
      corners: pack.style.corners ?? this.style().corners,
      strokeWidth: pack.style.strokeWidth ?? this.style().strokeWidth,
      recolorHue: pack.accent,
    });
  }
  applyTrendCard(card: TrendCard): void {
    this.svc.updateStyle({
      technique: card.style.technique ?? this.style().technique,
      colorMode: card.style.colorMode ?? this.style().colorMode,
      corners: card.style.corners ?? this.style().corners,
      strokeWidth: card.style.strokeWidth ?? this.style().strokeWidth,
      recolorHue: card.accent,
    });
  }
  spStroke(pack: StylePack): string {
    return String(pack.style.strokeWidth ?? 2);
  }
  spTech(pack: StylePack): string {
    return pack.style.technique ?? 'line';
  }
  trendTech(card: TrendCard): string {
    return card.style.technique ?? 'line';
  }
  trendStroke(card: TrendCard): string {
    return String(card.style.strokeWidth ?? 2);
  }
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selected()) this.closeDetail();
    else if (this.multiSelectMode()) this.exitMultiSelect();
  }
  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.key === 'a' || e.key === 'A') && (e.ctrlKey || e.metaKey) && this.multiSelectMode()) {
      e.preventDefault();
      this.selectAll();
    }
  }
  setTechnique(t: string): void { this.svc.updateStyle({ technique: t as IconTechnique }); }
  setColorMode(c: string): void { this.svc.updateStyle({ colorMode: c as IconColorMode }); }
  setCorners(c: string): void { this.svc.updateStyle({ corners: c as IconCorners }); }
  setStroke(w: number): void { this.svc.updateStyle({ strokeWidth: w }); }
  setDensity(d: string): void { this.svc.updateStyle({ density: d as IconSizeDensity }); }
  toggleAnimated(): void { this.svc.updateStyle({ animatedOn: !this.style().animatedOn }); }
  setAnimType(t: AnimationType): void { this.animType.set(t); }
  setRecolor(hex: string): void { this.svc.updateStyle({ recolorHue: hex }); }
  setRecolorHex(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.trim();
    const hex = raw.startsWith('#') ? raw : `#${raw}`;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) this.setRecolor(hex);
  }
  setRecolorFromHue(hue: number): void {
    const s = 0.80, l = 0.50;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (hue < 60)       { r = c; g = x; b = 0; }
    else if (hue < 120) { r = x; g = c; b = 0; }
    else if (hue < 180) { r = 0; g = c; b = x; }
    else if (hue < 240) { r = 0; g = x; b = c; }
    else if (hue < 300) { r = x; g = 0; b = c; }
    else                { r = c; g = 0; b = x; }
    const h = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
    this.setRecolor(`#${h(r)}${h(g)}${h(b)}`);
  }
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (this.recolorOpen() && !target.closest('.amx-icons__recolor')) {
      this.recolorOpen.set(false);
    }
    if (target.closest('.amx-collection-picker-overlay')) return;
    if (this.selected() && !target.closest('.amx-icon-detail') && !target.closest('.amx-icon-card')) {
      this.closeDetail();
    }
  }
  setPlatform(id: IconPlatform | null): void {
    this.svc.updateFilters({ platforms: id ? [id] : [] });
    this.visibleCount.set(48);
  }
  toggleMultiSelectMode(): void {
    if (this.multiSelectMode()) {
      this.exitMultiSelect();
    } else {
      this.multiSelectMode.set(true);
      this.selectedIcons.set(new Set());
    }
  }
  exitMultiSelect(): void {
    this.multiSelectMode.set(false);
    this.selectedIcons.set(new Set());
  }
  handleCardClick(icon: IconAsset, event: MouseEvent): void {
    if (this.multiSelectMode()) {
      event.stopPropagation();
      this.toggleIconSelection(icon.id);
    } else {
      this.openDetail(icon);
    }
  }
  toggleIconSelection(id: string): void {
    const next = new Set(this.selectedIcons());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.selectedIcons.set(next);
  }
  isIconSelected(id: string): boolean {
    return this.selectedIcons().has(id);
  }
  selectAll(): void {
    const ids = new Set(this.visibleIcons().map(i => i.id));
    this.selectedIcons.set(ids);
  }
  clearSelection(): void {
    this.selectedIcons.set(new Set());
  }
  bulkDownloadSvg(): void {
    for (const id of this.selectedIcons()) {
      const icon = this.svc.allIcons().find(i => i.id === id);
      if (icon) this.downloadSvg(icon);
    }
  }
  bulkDownloadPng(): void {
    for (const id of this.selectedIcons()) {
      const icon = this.svc.allIcons().find(i => i.id === id);
      if (icon) this.downloadPng(icon, 512);
    }
  }
  openBulkCollect(event: Event): void {
    event.stopPropagation();
    const firstId = this.selectedIcons().values().next().value;
    if (!firstId) return;
    const icon = this.svc.allIcons().find(i => i.id === firstId) ?? null;
    this.bulkCollectIcon.set(icon);
    this.collectionPickerIcon.set(icon);
  }
  openCollectionPicker(icon: IconAsset, event: Event): void {
    event.stopPropagation();
    this.collectionPickerIcon.set(icon);
    this.newCollectionName.set('');
  }
  closeCollectionPicker(): void {
    this.collectionPickerIcon.set(null);
  }
  addIconToCollection(collId: string): void {
    const icon = this.collectionPickerIcon();
    if (!icon) return;
    if (this.multiSelectMode() && this.selectedIcons().size > 0) {
      for (const id of this.selectedIcons()) {
        this.svc.addToCollection(collId, id);
      }
    } else {
      this.svc.addToCollection(collId, icon.id);
    }
    this.addFeedbackId.set(collId);
    setTimeout(() => {
      this.addFeedbackId.set(null);
      this.closeCollectionPicker();
    }, 700);
  }
  createCollectionAndAdd(): void {
    const icon = this.collectionPickerIcon();
    const name = this.newCollectionName().trim();
    if (!icon || !name) return;
    const id = this.svc.createCollection(name);
    if (this.multiSelectMode() && this.selectedIcons().size > 0) {
      for (const sid of this.selectedIcons()) {
        this.svc.addToCollection(id, sid);
      }
    } else {
      this.svc.addToCollection(id, icon.id);
    }
    this.newCollectionName.set('');
    this.closeCollectionPicker();
  }
  viewCollection(id: string): void { this.activeCollectionId.set(id); }
  backToCollections(): void { this.activeCollectionId.set(null); }
  deleteCollection(id: string, event: Event): void {
    event.stopPropagation();
    if (this.activeCollectionId() === id) this.activeCollectionId.set(null);
    this.svc.deleteCollection(id);
  }
  startRenaming(id: string, event: Event): void {
    event.stopPropagation();
    this.renamingCollectionId.set(id);
  }
  finishRenaming(id: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (val.trim()) this.svc.renameCollection(id, val);
    this.renamingCollectionId.set(null);
  }
  removeFromCollection(iconId: string, event: Event): void {
    event.stopPropagation();
    const colId = this.activeCollectionId();
    if (colId) this.svc.removeFromCollection(colId, iconId);
  }
  dragColIndex = -1;
  onDragStart(colId: string, event: DragEvent): void {
    const idx = this.svc.collections().findIndex(c => c.id === colId);
    if (idx < 0) return;
    this.dragColIndex = idx;
    (event.dataTransfer!).effectAllowed = 'move';
    (event.target as HTMLElement).closest('.amx-collection-card')?.classList.add('amx-collection-card--dragging');
  }
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    (event.dataTransfer!).dropEffect = 'move';
  }
  onDrop(colId: string, event: DragEvent): void {
    event.preventDefault();
    const fromIdx = this.dragColIndex;
    const toIdx = this.svc.collections().findIndex(c => c.id === colId);
    if (fromIdx >= 0 && toIdx >= 0) {
      this.svc.reorderCollections(fromIdx, toIdx);
    }
    this.dragColIndex = -1;
    document.querySelectorAll('.amx-collection-card--dragging').forEach(el => el.classList.remove('amx-collection-card--dragging'));
  }
  onDragEnd(event: DragEvent): void {
    this.dragColIndex = -1;
    document.querySelectorAll('.amx-collection-card--dragging').forEach(el => el.classList.remove('amx-collection-card--dragging'));
  }
  resetStyle(): void { this.svc.resetStyle(); }
  setQuery(value: string): void { this.svc.updateFilters({ query: value }); this.visibleCount.set(48); }
  notifyComingSoon(libraryName: string): void {
    this.comingSoonMessage.set(`${libraryName} is coming soon. Try one of the loaded libraries instead.`);
    if (this.comingSoonTimer) clearTimeout(this.comingSoonTimer);
    this.comingSoonTimer = setTimeout(() => this.comingSoonMessage.set(''), 3600);
  }
  scrollToIconGrid(): void {
    document.querySelector('.amx-icons__group')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  setCategory(id: string | null): void { this.svc.updateFilters({ categoryId: id }); this.visibleCount.set(48); }
  toggleAesthetic(v: string): void { this.svc.toggleArrayFilter('aesthetic', v as IconAesthetic); this.visibleCount.set(48); }
  toggleTrend(v: string): void { this.svc.toggleArrayFilter('trend', v as IconTrend); this.visibleCount.set(48); }
  toggleFavoritesOnly(): void {
    this.svc.updateFilters({ favoritesOnly: !this.filters().favoritesOnly });
    this.visibleCount.set(48);
  }
  clearFilters(): void {
    this.svc.clearFilters();
    this.aiSearchOn.set(false);
    this.visibleCount.set(48);
  }
  loadMore(): void { this.visibleCount.update(v => v + 48); }
  isActiveAesthetic(v: string): boolean { return this.filters().aesthetic.includes(v as IconAesthetic); }
  isActiveTrend(v: string): boolean { return this.filters().trend.includes(v as IconTrend); }
  categoryName(id: string): string {
    return this.categories.find(c => c.id === id)?.name ?? '';
  }
  get activeFilterCount(): number {
    const f = this.filters();
    return f.aesthetic.length + f.trend.length + f.platforms.length
      + (f.categoryId ? 1 : 0) + (f.favoritesOnly ? 1 : 0)
      + (this.style().animatedOn ? 1 : 0)
      + (f.libraryId ? 1 : 0);
  }
  setLibrary(id: IconLibraryId | null): void {
    this.svc.setLibrary(id);
    this.visibleCount.set(48);
  }
  isActiveLibrary(id: IconLibraryId): boolean { return this.filters().libraryId === id; }
  isLibraryLoading(id: IconLibraryId): boolean { return this.svc.isLoading(id); }
  isLibraryLoaded(id: IconLibraryId): boolean { return this.svc.isLoaded(id); }
  toggleFavorite(icon: IconAsset, event?: Event): void {
    event?.stopPropagation();
    this.svc.toggleFavorite(icon.id);
  }
  isFavorite(icon: IconAsset): boolean { return this.svc.isFavorite(icon.id); }
  openDetail(icon: IconAsset): void {
    this.selected.set(icon);
    this.copyState.set('idle');
    this.copyPngState.set('idle');
  }
  closeDetail(): void { this.selected.set(null); }
  relatedIcons(icon: IconAsset): IconAsset[] {
    return this.svc.filteredIcons()
      .filter(i => i.id !== icon.id && i.category === icon.category)
      .slice(0, 8);
  }
  buildStandaloneSvg(icon: IconAsset, size = 512): string {
    const s = this.style();
    const fillMode = s.technique === 'filled' || s.technique === '3d';
    const cap = s.corners === 'round' ? 'round' : 'square';
    const join = s.corners === 'round' ? 'round' : 'miter';
    const color = s.recolorHue;
    const viewBox = icon.viewBox ?? '0 0 24 24';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}" fill="${fillMode ? color : 'none'}" stroke="${fillMode ? 'none' : color}" stroke-width="${s.strokeWidth}" stroke-linecap="${cap}" stroke-linejoin="${join}">${icon.path}</svg>`;
  }
  async copySvg(icon: IconAsset): Promise<void> {
    const svg = this.buildStandaloneSvg(icon, 24);
    try {
      await navigator.clipboard.writeText(svg);
      this.copyState.set('copied');
      setTimeout(() => this.copyState.set('idle'), 1800);
    } catch { this.copyState.set('idle'); }
  }
  async copyPng(icon: IconAsset, size = 128): Promise<void> {
    const svg = this.buildStandaloneSvg(icon, size);
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); return; }
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob(async (blob) => {
        URL.revokeObjectURL(url);
        if (!blob) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          this.copyPngState.set('copied');
          setTimeout(() => this.copyPngState.set('idle'), 1800);
        } catch {  }
      }, 'image/png');
    };
    img.src = url;
  }
  downloadSvg(icon: IconAsset): void {
    const svg = this.buildStandaloneSvg(icon, 512);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    this.triggerDownload(URL.createObjectURL(blob), `${icon.slug}.svg`);
  }
  private buildFigmaSvg(icon: IconAsset, size = 24): string {
    const s = this.style();
    const color = s.recolorHue;
    const fillMode = s.technique === 'filled';
    const cap = s.corners === 'round' ? 'round' : 'butt';
    const join = s.corners === 'round' ? 'round' : 'miter';
    const viewBox = icon.viewBox ?? '0 0 24 24';
    const fillAttr  = fillMode ? color : 'none';
    const strokeAttr = fillMode ? 'none' : color;
    const strokeWidthAttr = fillMode ? '0' : String(s.strokeWidth);
    return [
      `<!-- Generated by Amarapix — https://amarapix.io -->`,
      `<svg`,
      `  xmlns="http://www.w3.org/2000/svg"`,
      `  width="${size}" height="${size}"`,
      `  viewBox="${viewBox}"`,
      `  fill="${fillAttr}"`,
      `  stroke="${strokeAttr}"`,
      `  stroke-width="${strokeWidthAttr}"`,
      `  stroke-linecap="${cap}"`,
      `  stroke-linejoin="${join}"`,
      `  data-figma-node-name="${icon.name}"`,
      `  aria-label="${icon.name}"`,
      `>`,
      `  <title>${icon.name}</title>`,
      `  ${icon.path}`,
      `</svg>`,
    ].join('\n');
  }
  async copyFigmaSvg(icon: IconAsset): Promise<void> {
    const svg = this.buildFigmaSvg(icon, 24);
    try {
      await navigator.clipboard.writeText(svg);
      this.figmaCopyState.set('copied');
      setTimeout(() => this.figmaCopyState.set('idle'), 2000);
    } catch { this.figmaCopyState.set('idle'); }
  }
  async openInFigma(icon: IconAsset): Promise<void> {
    const svg = this.buildFigmaSvg(icon, 24);
    try { await navigator.clipboard.writeText(svg); } catch {  }
    this.figmaCopyState.set('opening');
    window.open('https://www.figma.com/', '_blank', 'noopener');
    setTimeout(() => this.figmaCopyState.set('idle'), 3000);
  }
  downloadLottie(icon: IconAsset): void {
    const anim = this.animType();
    const color = this.style().recolorHue;
    const hexToLottieColor = (hex: string): [number, number, number] => {
      const n = parseInt(hex.replace('#', ''), 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    };
    const [r, g, b] = hexToLottieColor(color);
    const fps = 30;
    const dur = 60;
    let ks: Record<string, unknown>;
    switch (anim) {
      case 'spin':
        ks = { r: { a: 1, k: [{ t: 0, s: [0], e: [360], i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } }, { t: dur, s: [360] }] } };
        break;
      case 'pulse':
        ks = { s: { a: 1, k: [{ t: 0, s: [100, 100], e: [120, 120], i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } }, { t: 30, s: [120, 120], e: [100, 100], i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } }, { t: dur, s: [100, 100] }] } };
        break;
      case 'bounce':
        ks = { p: { a: 1, k: [{ t: 0, s: [256, 256], e: [256, 220], i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } }, { t: 20, s: [256, 220], e: [256, 256], i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } }, { t: dur, s: [256, 256] }] } };
        break;
      case 'shake':
        ks = { p: { a: 1, k: [{ t: 0, s: [256, 256], e: [278, 256], i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } }, { t: 8, s: [278, 256], e: [234, 256], i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } }, { t: 16, s: [234, 256], e: [256, 256], i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } }, { t: dur, s: [256, 256] }] } };
        break;
      case 'ping':
        ks = { s: { a: 1, k: [{ t: 0, s: [100, 100], e: [140, 140], i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } }, { t: dur, s: [140, 140] }] }, op: { a: 1, k: [{ t: 0, s: [100], e: [0], i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } }, { t: dur, s: [0] }] } };
        break;
      default:
        ks = {};
    }
    const lottie = {
      v: '5.9.0', fr: fps, ip: 0, op: dur, w: 512, h: 512,
      nm: icon.name, ddd: 0,
      assets: [],
      layers: [{
        ddd: 0, ind: 1, ty: 4, nm: icon.name,
        sr: 1, ks: {
          o: { a: 0, k: 100 },
          r: ks['r'] ?? { a: 0, k: 0 },
          p: ks['p'] ?? { a: 0, k: [256, 256, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: ks['s'] ?? { a: 0, k: [100, 100, 100] },
        },
        ao: 0, ip: 0, op: dur, st: 0, bm: 0,
        shapes: [{
          ty: 'gr', nm: 'icon',
          it: [
            { ty: 'rc', nm: 'rect', d: 1, p: { a: 0, k: [0, 0] }, s: { a: 0, k: [480, 480] }, r: { a: 0, k: 0 } },
            { ty: 'st', c: { a: 0, k: [r, g, b, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: this.style().strokeWidth * 10 }, lc: 2, lj: 2, ml: 4 },
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        }],
      }],
      markers: [],
      meta: { g: 'Amarapix Icon Browser', a: '', k: icon.tags.join(', '), d: icon.name, tc: color },
    };
    const blob = new Blob([JSON.stringify(lottie, null, 2)], { type: 'application/json' });
    this.triggerDownload(URL.createObjectURL(blob), `${icon.slug}-${anim === 'none' ? 'static' : anim}.lottie.json`);
  }
  openRequestModal(): void {
    this.requestModalOpen.set(true);
    this.requestSubmitted.set(false);
    this.requestsTab.set('submit');
    this.requestForm.set({ name: '', description: '', style: 'line', email: '' });
  }
  closeRequestModal(): void { this.requestModalOpen.set(false); }
  updateRequestForm(field: keyof ReturnType<typeof this.requestForm>, value: string): void {
    this.requestForm.update(f => ({ ...f, [field]: value }));
  }
  submitIconRequest(): void {
    const f = this.requestForm();
    if (!f.name.trim()) return;
    const req: IconRequest = {
      id: `req-${Date.now()}`,
      name: f.name.trim(),
      description: f.description.trim(),
      style: f.style,
      email: f.email.trim(),
      votes: 1,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    const updated = [req, ...this.iconRequests()];
    this.iconRequests.set(updated);
    saveRequests(updated);
    this.requestSubmitted.set(true);
    this.requestsTab.set('browse');
  }
  voteForRequest(id: string): void {
    const voted = new Set(this.requestVoted());
    if (voted.has(id)) return;
    voted.add(id);
    this.requestVoted.set(voted);
    const updated = this.iconRequests().map(r =>
      r.id === id ? { ...r, votes: r.votes + 1 } : r
    ).sort((a, b) => b.votes - a.votes);
    this.iconRequests.set(updated);
    saveRequests(updated);
  }
  hasVoted(id: string): boolean { return this.requestVoted().has(id); }
  requestStatusLabel(status: IconRequest['status']): string {
    return { pending: '⏳ Pending', planned: '🗓 Planned', done: '✅ Done' }[status];
  }
  downloadPng(icon: IconAsset, size: number): void {
    const svg = this.buildStandaloneSvg(icon, size);
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (blob) this.triggerDownload(URL.createObjectURL(blob), `${icon.slug}-${size}.png`);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.src = url;
  }
  private triggerDownload(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }
  ngAfterViewInit(): void {
    const sentinel = this.scrollSentinelRef?.nativeElement;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;
    this.scrollObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.hasMore()) {
        this.loadMore();
      }
    }, { rootMargin: '300px' });
    this.scrollObserver.observe(sentinel);
  }
  ngOnDestroy(): void {
    this.scrollObserver?.disconnect();
    if (this.comingSoonTimer) clearTimeout(this.comingSoonTimer);
  }
  trackById(_: number, icon: IconAsset): string { return icon.id; }
  trackByPackId(_: number, pack: StylePack): string { return pack.id; }
  trackByTrendId(_: number, card: TrendCard): string { return card.id; }
  goBack(): void { this.location.back(); }
}
