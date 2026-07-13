import { Injectable } from '@angular/core';
import { PngAsset, PngStyle, PngColorTone, PngFilterState } from '../models/png.model';

const API_KEY = 'Wn8bZH1OuteEDiAN4BN9X1YXukQ9KqYIcF6cWH0VCMtSjUrPPqpSw47t';

declare interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    tiny: string;
    portrait: string;
    landscape: string;
    square: string;
  };
  liked: boolean;
  alt: string;
}

declare interface PexelsResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page: string;
}

const STYLE_KEYWORDS: Record<string, PngStyle> = {
  photo: 'photorealistic',
  photograph: 'photorealistic',
  illustration: 'illustration',
  '3d': '3d',
  render: '3d',
  clipart: 'clipart',
  icon: 'flat',
  cartoon: 'cartoon',
};

const COLOR_MAP: Record<string, string> = {
  black: 'black',
  white: 'white',
  gray: 'gray',
  grey: 'gray',
  red: 'red',
  orange: 'orange',
  yellow: 'yellow',
  green: 'green',
  blue: 'blue',
  purple: 'purple',
  pink: 'pink',
  brown: 'brown',
};

const CATEGORY_KEYWORDS: Record<string, string> = {
  business: 'business',
  office: 'business',
  technology: 'technology',
  tech: 'technology',
  nature: 'nature',
  plant: 'nature',
  flower: 'nature',
  animal: 'animals',
  pet: 'animals',
  food: 'food',
  drink: 'food',
  people: 'people',
  person: 'people',
  music: 'music',
  travel: 'travel',
  fashion: 'fashion',
  beauty: 'fashion',
  sport: 'sports',
  fitness: 'sports',
  abstract: 'abstract',
  education: 'education',
  medical: 'medical',
  health: 'medical',
  money: 'money',
  finance: 'money',
  home: 'home',
  building: 'home',
  car: 'transport',
  vehicle: 'transport',
};

function detectStyle(alt: string): PngStyle {
  const haystack = alt.toLowerCase();
  for (const [kw, style] of Object.entries(STYLE_KEYWORDS)) {
    if (haystack.includes(kw)) return style;
  }
  return 'photorealistic';
}

function detectColorTone(alt: string): PngColorTone {
  const haystack = alt.toLowerCase();
  for (const [kw, tone] of Object.entries(COLOR_MAP)) {
    if (haystack.includes(kw)) return tone as PngColorTone;
  }
  return 'multi';
}

function detectCategory(alt: string): { category: string; label: string } {
  const haystack = alt.toLowerCase();
  for (const [kw, catId] of Object.entries(CATEGORY_KEYWORDS)) {
    if (haystack.includes(kw)) {
      const label = catId.charAt(0).toUpperCase() + catId.slice(1);
      return { category: catId, label };
    }
  }
  return { category: 'abstract', label: 'Abstract' };
}

function hasPeople(alt: string): boolean {
  return /\b(person|people|man|woman|child|boy|girl|face|portrait|human)\b/.test(alt.toLowerCase());
}

function toSlug(alt: string, id: number): string {
  const slug = alt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || `pexels-${id}`;
}

function mapPhoto(photo: PexelsPhoto, _filters?: PngFilterState): PngAsset {
  const alt = photo.alt || `Photo ${photo.id}`;
  const cat = detectCategory(alt);
  const tags = alt.split(' ').filter((t) => t.length > 2);

  return {
    id: `pxl-${photo.id}`,
    slug: toSlug(alt, photo.id),
    name: alt,
    category: cat.category,
    categoryLabel: cat.label,
    url: photo.src.large || photo.src.original,
    thumb: photo.src.tiny || photo.src.small,
    width: photo.width || 800,
    height: photo.height || 800,
    isPremium: false,
    downloads: 0,
    likes: 0,
    views: 0,
    tags,
    createdAt: '',
    source: photo.photographer || 'Pexels',
    style: detectStyle(alt),
    hasPeople: hasPeople(alt),
    colorTone: detectColorTone(alt),
    resolution: 'hd',
    provider: 'pexels',
  };
}

const PEXEL_ORIENTATION: Record<string, string> = {
  landscape: 'landscape',
  portrait: 'portrait',
  square: 'square',
};

@Injectable({ providedIn: 'root' })
export class PexelsService {
  private readonly baseUrl = 'https://api.pexels.com/v1';

  async search(params: {
    q?: string;
    page?: number;
    per_page?: number;
    orientation?: string;
    color?: string;
  }): Promise<{ assets: PngAsset[]; total: number }> {
    if (!params.q) return this.curated(params.page, params.per_page);

    const query = new URLSearchParams();
    query.set('query', params.q);
    if (params.page) query.set('page', String(params.page));
    if (params.per_page) query.set('per_page', String(params.per_page));
    if (params.orientation) query.set('orientation', params.orientation);
    if (params.color) query.set('color', params.color);

    const res = await fetch(`${this.baseUrl}/search?${query.toString()}`, {
      headers: { Authorization: API_KEY },
    });
    if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);

    const data: PexelsResponse = await res.json();
    return {
      assets: (data.photos ?? []).map((p) => mapPhoto(p)),
      total: data.total_results ?? 0,
    };
  }

  async curated(page = 1, perPage = 32): Promise<{ assets: PngAsset[]; total: number }> {
    const res = await fetch(`${this.baseUrl}/curated?page=${page}&per_page=${perPage}`, {
      headers: { Authorization: API_KEY },
    });
    if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);
    const data: PexelsResponse = await res.json();
    return {
      assets: (data.photos ?? []).map((p) => mapPhoto(p)),
      total: data.total_results ?? 0,
    };
  }

  buildSearchParams(filters: PngFilterState): {
    q?: string;
    orientation?: string;
    color?: string;
  } {
    const params: ReturnType<typeof this.buildSearchParams> = {};

    const q = filters.query.trim();
    if (q) {
      params.q = q;
    } else if (filters.categoryId) {
      params.q = filters.categoryId;
    }

    if (filters.orientation && PEXEL_ORIENTATION[filters.orientation]) {
      params.orientation = PEXEL_ORIENTATION[filters.orientation];
    }

    const colorHex: Record<string, string> = {
      black: '000000', white: 'ffffff', gray: '808080', red: 'ff0000',
      orange: 'ffa500', yellow: 'ffff00', green: '008000', blue: '0000ff',
      purple: '800080', pink: 'ffc0cb', brown: 'a52a2a',
    };
    if (filters.colorTone && colorHex[filters.colorTone]) {
      params.color = colorHex[filters.colorTone];
    }

    return params;
  }
}
