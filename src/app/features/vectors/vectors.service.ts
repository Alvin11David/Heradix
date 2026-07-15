import { Injectable, signal, computed } from '@angular/core';
import {
  VectorAsset, VectorCategory, VectorCollection, VectorFilterState,
  VectorFormat, VectorStyle, VectorLicense, VectorOrientation,
  VectorComplexity, VectorColorMode, VectorSortMode, VectorCreator,
} from '../../core/models/vector.model';

// ─── Mock Creators ────────────────────────────────────────────────────────────

const CREATORS: VectorCreator[] = [
  { id: 'c1', name: 'StudioPix',    avatar: 'https://i.pravatar.cc/40?img=1',  isVerified: true,  followers: 12400, totalAssets: 348 },
  { id: 'c2', name: 'VectoArt',     avatar: 'https://i.pravatar.cc/40?img=2',  isVerified: true,  followers: 8900,  totalAssets: 215 },
  { id: 'c3', name: 'DesignNova',   avatar: 'https://i.pravatar.cc/40?img=3',  isVerified: false, followers: 3200,  totalAssets: 87  },
  { id: 'c4', name: 'FlatCraft',    avatar: 'https://i.pravatar.cc/40?img=4',  isVerified: true,  followers: 22100, totalAssets: 512 },
  { id: 'c5', name: 'IllustroLab',  avatar: 'https://i.pravatar.cc/40?img=5',  isVerified: false, followers: 1800,  totalAssets: 43  },
  { id: 'c6', name: 'GradientGuru', avatar: 'https://i.pravatar.cc/40?img=6',  isVerified: true,  followers: 6500,  totalAssets: 167 },
];

// ─── Seeded Random ────────────────────────────────────────────────────────────

function seeded(seed: number): number {
  let x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ─── Mock Data Factory ────────────────────────────────────────────────────────

const STYLES: VectorStyle[]       = ['flat','outline','filled','cartoon','minimal','isometric','hand-drawn','watercolor','clay','glassmorphism','neumorphism','gradient','3d'];
const LICENSES: VectorLicense[]   = ['free','premium','commercial','editorial','public-domain'];
const ORIENTATIONS: VectorOrientation[] = ['landscape','portrait','square'];
const COMPLEXITIES: VectorComplexity[]  = ['beginner','medium','advanced'];
const COLOR_MODES: VectorColorMode[]    = ['single','multi','gradient','black','white'];
const FORMATS_POOL: VectorFormat[][]    = [
  ['svg','png'],
  ['svg','eps','png'],
  ['svg','eps','ai','pdf','png'],
  ['svg'],
  ['svg','eps','ai','pdf','cdr','dxf','png'],
];

const CATEGORY_DATA: { id: string; label: string; icon: string; tags: string[]; subcategories?: { id: string; label: string }[] }[] = [
  { id: 'business',    label: 'Business',    icon: '💼', tags: ['office','marketing','startup','finance','analytics','banking'],
    subcategories: [{id:'office',label:'Office'},{id:'marketing',label:'Marketing'},{id:'startup',label:'Startup'},{id:'finance',label:'Finance'}] },
  { id: 'technology',  label: 'Technology',  icon: '💻', tags: ['ai','coding','cloud','robotics','cybersecurity','blockchain'],
    subcategories: [{id:'ai',label:'AI'},{id:'coding',label:'Coding'},{id:'cloud',label:'Cloud'}] },
  { id: 'education',   label: 'Education',   icon: '📚', tags: ['books','graduation','science','school','mathematics'],
    subcategories: [{id:'books',label:'Books'},{id:'graduation',label:'Graduation'}] },
  { id: 'medical',     label: 'Medical',     icon: '🏥', tags: ['doctors','hospital','pharmacy','dentistry','mental health'],
    subcategories: [{id:'doctors',label:'Doctors'},{id:'hospital',label:'Hospitals'}] },
  { id: 'people',      label: 'People',      icon: '👥', tags: ['students','professionals','families','children','seniors','diversity'] },
  { id: 'animals',     label: 'Animals',     icon: '🐾', tags: ['pets','wildlife','birds','marine','farm'] },
  { id: 'nature',      label: 'Nature',      icon: '🌿', tags: ['trees','mountains','rivers','forest','flowers','sky'] },
  { id: 'food',        label: 'Food',        icon: '🍕', tags: ['fruits','vegetables','drinks','coffee','desserts','fast food'] },
  { id: 'sports',      label: 'Sports',      icon: '⚽', tags: ['football','basketball','tennis','running','gym','swimming'] },
  { id: 'travel',      label: 'Travel',      icon: '✈️', tags: ['hotels','beaches','airplanes','cars','maps','adventure'] },
  { id: 'holidays',    label: 'Holidays',    icon: '🎄', tags: ['christmas','easter','halloween','valentines','new year'] },
  { id: 'abstract',    label: 'Abstract',    icon: '🔷', tags: ['patterns','waves','shapes','mesh','geometry'] },
  { id: 'ui-ux',       label: 'UI & UX',     icon: '🖥️', tags: ['buttons','cards','dashboards','charts','wireframes'] },
  { id: 'logos',       label: 'Logos',       icon: '🔑', tags: ['brand marks','monograms','emblems','badges'] },
  { id: 'social',      label: 'Social Media',icon: '📱', tags: ['instagram','tiktok','facebook','youtube','linkedin'] },
  { id: 'marketing',   label: 'Marketing',   icon: '📣', tags: ['flyers','posters','banners','brochures','presentations'] },
];

const VECTOR_NAMES: Record<string, string[]> = {
  business:   ['Corporate Report Cover','Office Worker Set','Business Team Meeting','Analytics Dashboard UI','Finance Icons Bundle','Startup Rocket Launch','Marketing Funnel','Banking App Concept','Data Charts Pack','Brand Identity Kit'],
  technology: ['AI Robot Character','Cloud Network Infographic','Cybersecurity Shield','Blockchain Nodes','Coding Laptop Scene','Circuit Board Pattern','Tech Startup Icons','Robot Arms Factory','Server Room Concept','Mobile App Wireframe'],
  education:  ['Back to School Set','Graduation Cap Collection','Science Lab Equipment','Math Formulas Board','Online Learning Platform','Books Stack Illustration','Student Life Icons','Classroom Scene','Knowledge Graph','Certificate Template'],
  medical:    ['Doctor Character Pack','Hospital Building','Pharmacy Icons','Dental Care Set','Mental Health Illustrations','First Aid Kit','Medical Equipment','Health Infographic','Ambulance Scene','Pill & Capsule Icons'],
  people:     ['Diverse Team Illustration','Family Portrait Set','Children Playing','Senior Lifestyle Icons','Professional Woman','Team Collaboration','Cultural Diversity Pack','Avatar Collection','Crowd Scene','People in Motion'],
  animals:    ['Cute Pet Characters','Wildlife Safari Pack','Tropical Birds Set','Ocean Life Collection','Farm Animals Bundle','Zoo Characters','Endangered Species','Jungle Animals','Pet Shop Icons','Aquarium Scene'],
  nature:     ['Mountain Landscape','Tropical Forest','River & Waterfall','Flower Meadow','Sky & Clouds Pack','Desert Scene','Arctic Landscape','Jungle Foliage','Seasonal Trees','Nature Icons Set'],
  food:       ['Fresh Fruit Collection','Vegetable Garden Icons','Coffee Shop Pack','Dessert & Sweets','Fast Food Bundle','Restaurant Menu Icons','Smoothie & Drinks','Pizza Variations','Japanese Food Set','Bakery Illustrations'],
  sports:     ['Football Stadium','Basketball Players','Tennis Court Scene','Running Athletes','Gym Equipment Icons','Swimming Pool','Olympic Sports Pack','Sports Equipment','Team Jersey Design','Fitness Icons'],
  travel:     ['World Travel Pack','Beach Vacation Set','Airport Terminal','Car Journey Icons','City Maps Collection','Adventure Sports','Hotel & Resort','Tropical Paradise','Mountain Trek','Passport & Travel'],
  holidays:   ['Christmas Decoration Set','Easter Bunny Pack','Halloween Spooky Icons','Valentines Heart Bundle','New Year Fireworks','Holiday Gift Collection','Festive Patterns','Season Greetings','Holiday Characters','Winter Wonderland'],
  abstract:   ['Geometric Wave Pattern','Color Mesh Background','Abstract Shapes Pack','Polygon Art Collection','Flowing Lines Set','Minimal Geometry','Gradient Blur Shapes','Neon Grid Pattern','Crystal Formations','Particle System'],
  'ui-ux':    ['Dashboard UI Kit','Button Components Set','Card Layout System','Chart & Graph Pack','Wireframe Templates','Form Elements Bundle','Mobile UI Components','Navigation Icons','Data Visualization Kit','App Screen Templates'],
  logos:      ['Minimal Logo Pack','Monogram Collection','Badge & Emblem Set','Brand Mark Templates','Letter Logo System','Geometric Brand Marks','Shield Logo Designs','Circular Emblem Pack','Startup Logo Kit','Sports Team Badges'],
  social:     ['Instagram Story Templates','TikTok Content Pack','Facebook Cover Set','YouTube Thumbnail Bundle','LinkedIn Banner Templates','Social Media Icons','Story Highlight Icons','Profile Frame Pack','Content Calendar Templates','Social Media UI'],
  marketing:  ['Event Flyer Templates','Product Poster Collection','Banner Ad Bundle','Brochure Layout Set','Presentation Template','Sale Promotion Pack','Newsletter Templates','Ad Campaign Kit','Product Launch Materials','Email Header Bundle'],
};

const THUMBS = [
  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
  'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400&q=80',
  'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&q=80',
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&q=80',
  'https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=400&q=80',
  'https://images.unsplash.com/photo-1579547945413-497e1b99dac0?w=400&q=80',
  'https://images.unsplash.com/photo-1607274492818-d46c97cf9ebe?w=400&q=80',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80',
  'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?w=400&q=80',
  'https://images.unsplash.com/photo-1636955735635-bf7db5f1ffe3?w=400&q=80',
  'https://images.unsplash.com/photo-1540350394557-8d14678e7f91?w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80',
  'https://images.unsplash.com/photo-1493421419110-74f4e85ba126?w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
];

const COLOR_PALETTES = [
  ['#3B82F6','#6366F1','#8B5CF6'],
  ['#F97316','#EF4444','#F59E0B'],
  ['#10B981','#14B8A6','#06B6D4'],
  ['#EC4899','#F43F5E','#A855F7'],
  ['#111827','#374151','#6B7280'],
  ['#FBBF24','#F59E0B','#D97706'],
  ['#34D399','#10B981','#059669'],
];

function buildAssets(): VectorAsset[] {
  const assets: VectorAsset[] = [];
  let idx = 0;
  const now = Date.now();
  const DAY = 86400000;

  for (const cat of CATEGORY_DATA) {
    const names = VECTOR_NAMES[cat.id] || ['Vector Set'];
    for (let i = 0; i < names.length; i++) {
      const seed = idx * 37 + i * 13;
      const r = (offset = 0) => seeded(seed + offset);
      const isPremium = r(1) > 0.45;
      const daysAgo = Math.floor(r(5) * 120);

      assets.push({
        id: `vec-${cat.id}-${i}`,
        slug: `${cat.id}-${names[i].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
        name: names[i],
        description: `A professional ${names[i].toLowerCase()} designed for ${cat.label.toLowerCase()} projects. Available in multiple formats, fully editable, and scalable to any size.`,
        category: cat.id,
        categoryLabel: cat.label,
        previewUrl: THUMBS[idx % THUMBS.length],
        thumbUrl: THUMBS[idx % THUMBS.length],
        dominantColors: COLOR_PALETTES[Math.floor(r(6) * COLOR_PALETTES.length)],
        formats: FORMATS_POOL[Math.floor(r(2) * FORMATS_POOL.length)],
        style: STYLES[Math.floor(r(3) * STYLES.length)],
        license: isPremium ? 'premium' : (r(7) > 0.5 ? 'commercial' : 'free'),
        orientation: ORIENTATIONS[Math.floor(r(4) * ORIENTATIONS.length)],
        complexity: COMPLEXITIES[Math.floor(r(8) * COMPLEXITIES.length)],
        colorMode: COLOR_MODES[Math.floor(r(9) * COLOR_MODES.length)],
        isPremium,
        isFree: !isPremium && r(10) > 0.6,
        isAiGenerated: r(11) > 0.75,
        isAnimated: r(12) > 0.85,
        isNew: daysAgo < 7,
        isStaffPick: r(13) > 0.9,
        isEditorsChoice: r(14) > 0.93,
        downloads: Math.floor(r(15) * 50000) + 100,
        likes: Math.floor(r(16) * 5000) + 10,
        views: Math.floor(r(17) * 200000) + 500,
        rating: parseFloat((3.5 + r(18) * 1.5).toFixed(1)),
        ratingCount: Math.floor(r(19) * 2000) + 5,
        comments: Math.floor(r(20) * 300),
        tags: cat.tags.slice(0, 3 + Math.floor(r(21) * 4)),
        width: [400,600,800,1200,2400][Math.floor(r(22) * 5)],
        height: [300,400,600,800,1800][Math.floor(r(23) * 5)],
        fileSize: Math.floor(r(24) * 2048) + 24,
        creator: CREATORS[Math.floor(r(25) * CREATORS.length)],
        uploadedAt: new Date(now - daysAgo * DAY).toISOString(),
        updatedAt: new Date(now - Math.floor(r(26) * daysAgo) * DAY).toISOString(),
      });
      idx++;
    }
  }
  return assets;
}

export const ALL_VECTORS = buildAssets();

export const VECTOR_CATEGORIES: VectorCategory[] = CATEGORY_DATA.map(c => ({
  id: c.id,
  label: c.label,
  icon: c.icon,
  count: ALL_VECTORS.filter(v => v.category === c.id).length,
  subcategories: c.subcategories,
}));

// ─── Trending / Curated Sections ─────────────────────────────────────────────

export const TRENDING_TAGS = [
  'flat design','isometric','gradient','minimal','3d render',
  'cartoon','abstract','geometric','watercolor','neon','glassmorphism',
  'retro','clay','hand-drawn','vintage',
];

export const TRENDING_COLORS = [
  { name: 'Electric Blue',  hex: '#3B82F6' },
  { name: 'Coral Sunset',   hex: '#F97316' },
  { name: 'Emerald',        hex: '#10B981' },
  { name: 'Violet Dream',   hex: '#8B5CF6' },
  { name: 'Rose Gold',      hex: '#F43F5E' },
  { name: 'Midnight',       hex: '#111827' },
  { name: 'Amber',          hex: '#F59E0B' },
  { name: 'Teal',           hex: '#14B8A6' },
];

export const SEASONAL_COLLECTIONS = [
  { id: 'summer',    label: 'Summer Vibes',    emoji: '☀️', count: 840 },
  { id: 'christmas', label: 'Holiday Season',  emoji: '🎄', count: 620 },
  { id: 'business',  label: 'Back to Business',emoji: '💼', count: 1240 },
  { id: 'nature',    label: 'Earth Day',        emoji: '🌍', count: 380 },
  { id: 'gradient',  label: 'Gradient Mania',  emoji: '🌈', count: 990 },
  { id: 'minimalist',label: 'Less is More',    emoji: '◽', count: 760 },
];

// ─── Service ─────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: VectorFilterState = {
  query:        '',
  categoryId:   null,
  formats:      [],
  style:        null,
  license:      null,
  orientation:  null,
  complexity:   null,
  colorMode:    null,
  color:        null,
  isAiGenerated:null,
  isAnimated:   null,
  dateAdded:    'all',
  sort:         'popular',
  favoritesOnly:false,
  creatorId:    null,
};

const FAVORITES_KEY = 'amx_vector_favorites';
const COLLECTIONS_KEY = 'amx_vector_collections';
const RECENT_KEY = 'amx_vector_recent';
const RECENT_SEARCHES_KEY = 'amx_vector_recent_searches';

@Injectable({ providedIn: 'root' })
export class VectorsService {
  // ── Filter state ──────────────────────────────────────────────────────────
  readonly filters = signal<VectorFilterState>({ ...DEFAULT_FILTERS });

  // ── Favorites ─────────────────────────────────────────────────────────────
  readonly favorites = signal<Set<string>>(this._loadFavorites());

  // ── Collections ───────────────────────────────────────────────────────────
  readonly collections = signal<VectorCollection[]>(this._loadCollections());

  // ── Recently viewed ───────────────────────────────────────────────────────
  readonly recentlyViewed = signal<string[]>(this._loadRecent());

  // ── Recent searches ───────────────────────────────────────────────────────
  readonly recentSearches = signal<string[]>(this._loadRecentSearches());

  // ── All assets ────────────────────────────────────────────────────────────
  readonly allAssets = signal<VectorAsset[]>(ALL_VECTORS);

  // ── Derived: filtered & sorted ────────────────────────────────────────────
  readonly filtered = computed(() => {
    const f = this.filters();
    let list = this.allAssets();

    if (f.query) {
      const q = f.query.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.tags.some(t => t.includes(q)) ||
        a.categoryLabel.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }
    if (f.categoryId) list = list.filter(a => a.category === f.categoryId);
    if (f.formats.length) list = list.filter(a => f.formats.every(fmt => a.formats.includes(fmt)));
    if (f.style) list = list.filter(a => a.style === f.style);
    if (f.license) list = list.filter(a => a.license === f.license);
    if (f.orientation) list = list.filter(a => a.orientation === f.orientation);
    if (f.complexity) list = list.filter(a => a.complexity === f.complexity);
    if (f.colorMode) list = list.filter(a => a.colorMode === f.colorMode);
    if (f.color) {
      const target = f.color.toLowerCase();
      list = list.filter(a => a.dominantColors.some(c => c.toLowerCase() === target));
    }
    if (f.isAiGenerated !== null) list = list.filter(a => a.isAiGenerated === f.isAiGenerated);
    if (f.isAnimated !== null) list = list.filter(a => a.isAnimated === f.isAnimated);
    if (f.favoritesOnly) {
      const favs = this.favorites();
      list = list.filter(a => favs.has(a.id));
    }
    if (f.creatorId) list = list.filter(a => a.creator.id === f.creatorId);

    const now = Date.now();
    if (f.dateAdded === 'today') list = list.filter(a => now - new Date(a.uploadedAt).getTime() < 86400000);
    else if (f.dateAdded === 'week') list = list.filter(a => now - new Date(a.uploadedAt).getTime() < 7 * 86400000);
    else if (f.dateAdded === 'month') list = list.filter(a => now - new Date(a.uploadedAt).getTime() < 30 * 86400000);

    switch (f.sort) {
      case 'newest':    return [...list].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      case 'downloads': return [...list].sort((a, b) => b.downloads - a.downloads);
      case 'views':     return [...list].sort((a, b) => b.views - a.views);
      case 'likes':     return [...list].sort((a, b) => b.likes - a.likes);
      case 'rating':    return [...list].sort((a, b) => b.rating - a.rating);
      default:          return [...list].sort((a, b) => (b.downloads * 0.5 + b.views * 0.3 + b.likes * 0.2) - (a.downloads * 0.5 + a.views * 0.3 + a.likes * 0.2));
    }
  });

  // ── Followed creators ─────────────────────────────────────────────────────
  readonly followedCreators = signal<Set<string>>(this._loadFollowed());

  // ── Derived sections ──────────────────────────────────────────────────────
  readonly featuredVectors  = computed(() => ALL_VECTORS.filter(a => a.isEditorsChoice || a.isStaffPick).slice(0, 12));
  readonly trendingToday    = computed(() => [...ALL_VECTORS].sort((a, b) => b.views - a.views).slice(0, 20));
  readonly trendingWeek     = computed(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    return [...ALL_VECTORS]
      .filter(a => new Date(a.uploadedAt).getTime() > weekAgo || a.downloads > 5000)
      .sort((a, b) => (b.downloads + b.views) - (a.downloads + a.views))
      .slice(0, 20);
  });
  readonly trendingMonth    = computed(() => [...ALL_VECTORS].sort((a, b) => (b.downloads + b.likes) - (a.downloads + a.likes)).slice(0, 20));
  readonly mostViewed       = computed(() => [...ALL_VECTORS].sort((a, b) => b.views - a.views).slice(0, 20));
  readonly mostLiked        = computed(() => [...ALL_VECTORS].sort((a, b) => b.likes - a.likes).slice(0, 20));
  readonly editorChoice     = computed(() => ALL_VECTORS.filter(a => a.isEditorsChoice).slice(0, 16));
  readonly newArrivals      = computed(() => [...ALL_VECTORS].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()).slice(0, 20));
  readonly mostDownloaded   = computed(() => [...ALL_VECTORS].sort((a, b) => b.downloads - a.downloads).slice(0, 20));
  readonly staffPicks       = computed(() => ALL_VECTORS.filter(a => a.isStaffPick).slice(0, 12));
  readonly aiGenerated      = computed(() => ALL_VECTORS.filter(a => a.isAiGenerated).slice(0, 16));
  readonly freeVectors      = computed(() => ALL_VECTORS.filter(a => a.isFree).slice(0, 16));
  readonly premiumVectors   = computed(() => ALL_VECTORS.filter(a => a.isPremium).slice(0, 16));
  readonly recentlyViewedAssets = computed(() => {
    const ids = this.recentlyViewed();
    return ids.map(id => ALL_VECTORS.find(a => a.id === id)).filter(Boolean) as VectorAsset[];
  });
  readonly popularCreators  = computed(() => {
    return CREATORS.map(creator => ({
      ...creator,
      topAssets: ALL_VECTORS.filter(a => a.creator.id === creator.id)
        .sort((a, b) => b.downloads - a.downloads).slice(0, 3),
      totalDownloads: ALL_VECTORS.filter(a => a.creator.id === creator.id)
        .reduce((sum, a) => sum + a.downloads, 0),
    })).sort((a, b) => b.totalDownloads - a.totalDownloads);
  });
  readonly featuredCollections = computed(() => {
    return SEASONAL_COLLECTIONS.map(col => ({
      ...col,
      assets: ALL_VECTORS.filter(a => a.category === col.id || a.tags.some(t => col.label.toLowerCase().includes(t))).slice(0, 4),
    }));
  });

  // ── Categories ────────────────────────────────────────────────────────────
  readonly categories = signal<VectorCategory[]>(VECTOR_CATEGORIES);

  // ── Related tags (from current results) ──────────────────────────────────
  readonly relatedTags = computed(() => {
    const q = this.filters().query.toLowerCase();
    const tagCounts = new Map<string, number>();
    this.filtered().slice(0, 60).forEach(a =>
      a.tags.forEach(t => { if (t !== q) tagCounts.set(t, (tagCounts.get(t) || 0) + 1); })
    );
    return [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t]) => t);
  });

  // ── Methods ───────────────────────────────────────────────────────────────

  setFilter<K extends keyof VectorFilterState>(key: K, value: VectorFilterState[K]): void {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  resetFilters(): void {
    this.filters.set({ ...DEFAULT_FILTERS });
  }

  toggleFavorite(id: string): void {
    this.favorites.update(favs => {
      const next = new Set(favs);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  isFavorite(id: string): boolean {
    return this.favorites().has(id);
  }

  trackView(id: string): void {
    this.recentlyViewed.update(ids => {
      const next = [id, ...ids.filter(i => i !== id)].slice(0, 20);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  addRecentSearch(q: string): void {
    if (!q.trim()) return;
    this.recentSearches.update(prev => {
      const next = [q, ...prev.filter(s => s !== q)].slice(0, 12);
      try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  removeRecentSearch(q: string): void {
    this.recentSearches.update(prev => {
      const next = prev.filter(s => s !== q);
      try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  toggleFollowCreator(creatorId: string): void {
    this.followedCreators.update(s => {
      const next = new Set(s);
      next.has(creatorId) ? next.delete(creatorId) : next.add(creatorId);
      try { localStorage.setItem('amx_vec_followed', JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  isFollowing(creatorId: string): boolean {
    return this.followedCreators().has(creatorId);
  }

  createCollection(name: string): void {
    const col: VectorCollection = {
      id: `col-${Date.now()}`, name, assetIds: [], isPublic: false,
      createdAt: new Date().toISOString(),
    };
    this.collections.update(cols => {
      const next = [...cols, col];
      this._saveCollections(next);
      return next;
    });
  }

  renameCollection(colId: string, name: string): void {
    this.collections.update(cols => {
      const next = cols.map(c => c.id === colId ? { ...c, name } : c);
      this._saveCollections(next); return next;
    });
  }

  deleteCollection(colId: string): void {
    this.collections.update(cols => {
      const next = cols.filter(c => c.id !== colId);
      this._saveCollections(next); return next;
    });
  }

  toggleCollectionPublic(colId: string): void {
    this.collections.update(cols => {
      const next = cols.map(c => c.id === colId ? { ...c, isPublic: !c.isPublic } : c);
      this._saveCollections(next); return next;
    });
  }

  addToCollection(colId: string, assetId: string): void {
    this.collections.update(cols => {
      const next = cols.map(c =>
        c.id === colId && !c.assetIds.includes(assetId)
          ? { ...c, assetIds: [...c.assetIds, assetId] }
          : c
      );
      this._saveCollections(next);
      return next;
    });
  }

  getSimilar(asset: VectorAsset, limit = 8): VectorAsset[] {
    return ALL_VECTORS
      .filter(a => a.id !== asset.id && (a.category === asset.category || a.style === asset.style))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  getByCreator(creatorId: string, excludeId?: string): VectorAsset[] {
    return ALL_VECTORS.filter(a => a.creator.id === creatorId && a.id !== excludeId).slice(0, 8);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _loadFollowed(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem('amx_vec_followed') || '[]')); } catch { return new Set(); }
  }

  private _loadFavorites(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')); } catch { return new Set(); }
  }

  private _loadCollections(): VectorCollection[] {
    try { return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || '[]'); } catch { return []; }
  }

  private _saveCollections(cols: VectorCollection[]): void {
    try { localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols)); } catch {}
  }

  private _loadRecent(): string[] {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  }

  private _loadRecentSearches(): string[] {
    try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'); } catch { return []; }
  }
}
