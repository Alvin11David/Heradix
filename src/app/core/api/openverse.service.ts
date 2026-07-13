import { Injectable } from '@angular/core';
import { PngAsset, PngStyle, PngColorTone, PngFilterState } from '../models/png.model';

declare interface OpenverseImage {
  id: string;
  title: string;
  indexed_on: string;
  foreign_landing_url: string;
  url: string;
  creator: string;
  creator_url: string;
  license: string;
  license_version: string;
  license_url: string;
  provider: string;
  source: string;
  category: string | null;
  filesize: number | null;
  filetype: string | null;
  tags: string | unknown[];
  attribution: string;
  fields_matched: string;
  mature: boolean;
  height: number;
  width: number;
  thumbnail: string;
  detail_url: string;
  related_url: string;
  unstable__sensitivity: string[];
}

declare interface OpenverseResponse {
  result_count: number;
  page_count: number;
  page_size: number;
  page: number;
  results: OpenverseImage[];
}

function parseTags(image: OpenverseImage): string[] {
  if (Array.isArray(image.tags)) {
    return image.tags.map((t: any) => (typeof t === 'string' ? t : t?.name ?? '')).filter(Boolean);
  }
  if (typeof image.tags === 'string' && image.tags) {
    return image.tags.split(',').map((t) => t.trim()).filter(Boolean);
  }
  return image.title.split(' ').filter((t) => t.length > 2);
}

function detectStyle(title: string): PngStyle {
  const h = title.toLowerCase();
  if (h.includes('illustration') || h.includes('drawing')) return 'illustration';
  if (h.includes('3d') || h.includes('render')) return '3d';
  if (h.includes('cartoon')) return 'cartoon';
  if (h.includes('icon') || h.includes('flat')) return 'flat';
  if (h.includes('clipart')) return 'clipart';
  return 'photorealistic';
}

function detectColorTone(title: string): PngColorTone {
  const colors: Record<string, PngColorTone> = {
    black: 'black', white: 'white', gray: 'gray', red: 'red',
    orange: 'orange', yellow: 'yellow', green: 'green', blue: 'blue',
    purple: 'purple', pink: 'pink', brown: 'brown',
  };
  for (const [kw, tone] of Object.entries(colors)) {
    if (title.toLowerCase().includes(kw)) return tone;
  }
  return 'multi';
}

function hasPeople(title: string): boolean {
  return /\b(person|people|man|woman|child|boy|girl|face|portrait|human)\b/.test(title.toLowerCase());
}

function toSlug(title: string, id: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || `openverse-${id}`;
}

function mapImage(image: OpenverseImage): PngAsset {
  const tags = parseTags(image);
  const name = image.title || `Openverse ${image.id}`;

  return {
    id: `ov-${image.id}`,
    slug: toSlug(name, image.id),
    name,
    category: image.category ?? 'abstract',
    categoryLabel: image.category ? image.category.charAt(0).toUpperCase() + image.category.slice(1) : 'Abstract',
    url: image.url,
    thumb: image.url,
    width: image.width || 800,
    height: image.height || 800,
    isPremium: false,
    downloads: 0,
    likes: 0,
    views: 0,
    tags,
    createdAt: image.indexed_on ?? '',
    source: image.creator || 'Openverse',
    style: detectStyle(name),
    hasPeople: hasPeople(name),
    colorTone: detectColorTone(name),
    resolution: (image.width ?? 0) >= 3840 || (image.height ?? 0) >= 3840 ? '4k' : 'hd',
    provider: 'openverse',
  };
}

const CATEGORY_MAP: Record<string, string> = {
  business: 'business',
  technology: 'technology',
  nature: 'nature',
  animals: 'animals',
  food: 'food',
  people: 'people',
  music: 'music',
  travel: 'travel',
  fashion: 'fashion',
  sports: 'sports',
  abstract: 'abstract',
  education: 'education',
  medical: 'medical',
  home: 'home',
  transport: 'transport',
};

@Injectable({ providedIn: 'root' })
export class OpenverseService {
  private readonly baseUrl = 'https://api.openverse.org/v1';

  async search(params: {
    q?: string;
    page?: number;
    page_size?: number;
    license?: string;
    license_type?: string;
    categories?: string;
    aspect_ratio?: string;
    size?: string;
    mature?: boolean;
  }): Promise<{ assets: PngAsset[]; total: number }> {
    const query = new URLSearchParams();
    const q = params.q?.trim();
    if (q) {
      query.set('q', q);
    } else {
      query.set('q', 'nature');
    }
    if (params.page) query.set('page', String(params.page));
    if (params.page_size) query.set('page_size', String(params.page_size));
    if (params.license) query.set('license', params.license);
    if (params.license_type) query.set('license_type', params.license_type);
    if (params.categories) query.set('categories', params.categories);
    if (params.aspect_ratio) query.set('aspect_ratio', params.aspect_ratio);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${this.baseUrl}/images/?${query.toString()}`);
    if (!res.ok) throw new Error(`Openverse API error: ${res.status}`);

    const data: OpenverseResponse = await res.json();
    return {
      assets: (data.results ?? []).map((img) => mapImage(img)),
      total: data.result_count ?? 0,
    };
  }

  buildSearchParams(filters: PngFilterState): {
    q?: string;
    aspect_ratio?: string;
    size?: string;
    categories?: string;
  } {
    const params: ReturnType<typeof this.buildSearchParams> = {};

    const q = filters.query.trim();
    if (q) params.q = q;

    if (filters.categoryId && CATEGORY_MAP[filters.categoryId]) {
      params.categories = CATEGORY_MAP[filters.categoryId];
    }

    if (filters.orientation === 'square') params.aspect_ratio = 'square';
    else if (filters.orientation === 'landscape') params.aspect_ratio = 'wide';
    else if (filters.orientation === 'portrait') params.aspect_ratio = 'tall';

    if (filters.resolution === '4k') params.size = 'large';
    else if (filters.resolution === 'hd') params.size = 'medium';

    return params;
  }
}
