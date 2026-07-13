import { Injectable } from '@angular/core';
import { PngAsset, PngStyle, PngColorTone, PngOrientation, PngFilterState } from '../models/png.model';

const API_KEY = '47995852-81c506cad40b30eda362e7575';

declare interface PixabayHit {
  id: number;
  pageURL: string;
  type: 'photo' | 'illustration' | 'vector';
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  fullHDURL?: string;
  imageURL?: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

declare interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayHit[];
}

const PIXABAY_CATEGORIES: Record<string, string> = {
  business: 'business',
  technology: 'computer',
  nature: 'nature',
  animals: 'animals',
  food: 'food',
  holiday: 'places',
  people: 'people',
  music: 'music',
  travel: 'travel',
  home: 'buildings',
  abstract: 'backgrounds',
  education: 'education',
  medical: 'science',
  money: 'business',
  social: 'people',
  fashion: 'fashion',
  sports: 'sports',
  transport: 'transportation',
};

const STYLE_MAP: Record<string, PngStyle> = {
  photo: 'photorealistic',
  illustration: 'illustration',
  vector: 'clipart',
};

const COLOR_MAP: Record<string, string> = {
  black: 'black',
  white: 'white',
  gray: 'gray',
  red: 'red',
  orange: 'orange',
  yellow: 'yellow',
  green: 'green',
  blue: 'blue',
  purple: 'lilac',
  pink: 'pink',
  brown: 'brown',
  gold: 'yellow',
};

function detectColorFromTags(tags: string[]): PngColorTone {
  const haystack = tags.join(' ');
  for (const [ourColor, _] of Object.entries(COLOR_MAP)) {
    if (haystack.includes(ourColor)) return ourColor as PngColorTone;
  }
  return 'multi';
}

function hasPeople(tags: string[]): boolean {
  const haystack = tags.join(' ');
  return /\b(person|people|man|woman|child|boy|girl|face|portrait|human)\b/.test(haystack);
}

function toSlug(title: string, id: number): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || `pixabay-${id}`;
}

function getCategoryLabel(catId: string): string {
  return catId.charAt(0).toUpperCase() + catId.slice(1);
}

function mapHit(hit: PixabayHit, categoryId?: string | null): PngAsset {
  const tags = hit.tags.split(',').map((t) => t.trim()).filter(Boolean);
  const name = tags[0] || `Image ${hit.id}`;

  const cat = categoryId && PIXABAY_CATEGORIES[categoryId]
    ? { category: categoryId, label: getCategoryLabel(categoryId) }
    : { category: 'abstract', label: 'Abstract' };

  return {
    id: `px-${hit.id}`,
    slug: toSlug(name, hit.id),
    name,
    category: cat.category,
    categoryLabel: cat.label,
    url: hit.largeImageURL || hit.webformatURL,
    thumb: hit.previewURL,
    width: hit.imageWidth || hit.webformatWidth || 800,
    height: hit.imageHeight || hit.webformatHeight || 800,
    isPremium: false,
    downloads: hit.downloads,
    likes: hit.likes,
    views: hit.views,
    tags,
    createdAt: '',
    source: hit.user || 'Pixabay',
    style: STYLE_MAP[hit.type] || 'photorealistic',
    hasPeople: hasPeople(tags),
    colorTone: detectColorFromTags(tags),
    resolution: 'hd',
    provider: 'pixabay',
  };
}

@Injectable({ providedIn: 'root' })
export class PixabayService {
  private readonly baseUrl = 'https://pixabay.com/api';

  async search(params: {
    q?: string;
    page?: number;
    per_page?: number;
    category?: string;
    colors?: string;
    orientation?: string;
    order?: string;
    image_type?: string;
    safesearch?: boolean;
    editors_choice?: boolean;
  }): Promise<{ assets: PngAsset[]; total: number; totalHits: number }> {
    const query = new URLSearchParams();
    query.set('key', API_KEY);
    if (params.q) query.set('q', params.q);
    if (params.page) query.set('page', String(params.page));
    if (params.per_page) query.set('per_page', String(params.per_page));
    if (params.category) query.set('category', params.category);
    if (params.colors) query.set('colors', params.colors);
    if (params.orientation) query.set('orientation', params.orientation);
    if (params.order) query.set('order', params.order);
    if (params.image_type) query.set('image_type', params.image_type);
    if (params.safesearch) query.set('safesearch', 'true');
    if (params.editors_choice) query.set('editors_choice', 'true');

    const res = await fetch(`${this.baseUrl}/?${query.toString()}`);
    if (!res.ok) throw new Error(`Pixabay API error: ${res.status}`);

    const data: PixabayResponse = await res.json();
    return {
      assets: (data.hits ?? []).map((h) => mapHit(h)),
      total: data.total ?? 0,
      totalHits: data.totalHits ?? 0,
    };
  }

  async byId(id: string): Promise<PngAsset | undefined> {
    const rawId = id.replace(/^px-/, '');
    const res = await fetch(`${this.baseUrl}/?key=${API_KEY}&id=${rawId}`);
    if (!res.ok) return undefined;
    const data: PixabayResponse = await res.json();
    const hit = data.hits?.[0];
    return hit ? mapHit(hit) : undefined;
  }

  buildSearchParams(filters: PngFilterState): {
    q?: string;
    category?: string;
    colors?: string;
    orientation?: string;
    order?: string;
  } {
    const params: ReturnType<typeof this.buildSearchParams> = {};

    const q = filters.query.trim();
    if (q) params.q = q;

    if (filters.categoryId && PIXABAY_CATEGORIES[filters.categoryId]) {
      params.category = PIXABAY_CATEGORIES[filters.categoryId];
    }

    if (filters.colorTone && COLOR_MAP[filters.colorTone]) {
      params.colors = COLOR_MAP[filters.colorTone];
    }

    if (filters.orientation === 'landscape') params.orientation = 'horizontal';
    else if (filters.orientation === 'portrait') params.orientation = 'vertical';

    if (filters.sort === 'newest') params.order = 'latest';
    else params.order = 'popular';

    return params;
  }
}
