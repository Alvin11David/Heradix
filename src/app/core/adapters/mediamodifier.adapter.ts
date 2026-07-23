import { MmMockup } from '../services/mediamodifier-api.service';
import {
  MockupAsset, MockupCategory, MockupSceneType,
} from '../models/mockup.model';
import { inferCategory } from './category-inference';
import { pickCreator } from './creators';

export interface MappedMmMockupExtra {
  source: 'mediamodifier';
  mediamodifierNr: number;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isValidNumber(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v);
}

function validateMmMockup(raw: unknown): raw is MmMockup {
  if (!raw || typeof raw !== 'object') return false;
  const m = raw as Record<string, unknown>;
  return isValidNumber(m['nr'])
    && isNonEmptyString(m['slug'])
    && isNonEmptyString(m['name'])
    && isNonEmptyString(m['preview']);
}

export function mapMmMockup(raw: unknown, index: number): (MockupAsset & MappedMmMockupExtra) | null {
  if (!validateMmMockup(raw)) return null;

  const m = raw as MmMockup;
  const cat = inferCategory(m.tags, m.category);
  const preview = m.preview.startsWith('http')
    ? m.preview
    : `https://mediamodifier.com${m.preview}`;

  return {
    id: `mm_${m.nr}`,
    slug: m.slug,
    name: m.name,
    description: `${m.name} — professional mockup from MediaModifier. ${m.tags.join(', ')}.`,
    category: cat as MockupCategory,
    categoryLabel: cat.charAt(0).toUpperCase() + cat.slice(1),
    subcategory: m.category.toLowerCase().replace(/\s+/g, '-'),
    previewUrl: preview,
    thumbUrl: preview,
    additionalPreviews: [],
    dominantColors: ['#1F2937', '#374151', '#6B7280'],
    sceneType: 'studio' as MockupSceneType,
    orientation: 'landscape',
    license: 'free',
    formats: ['png', 'jpg', 'webp'],
    resolution: '3000×2000px',
    smartObjectSize: '',
    editableAreas: 1,
    isPremium: false,
    isFree: true,
    isAiGenerated: false,
    isNew: false,
    isStaffPick: false,
    isEditorsChoice: false,
    isFeatured: false,
    isTrending: false,
    downloads: 0,
    likes: 0,
    views: 0,
    rating: 0,
    ratingCount: 0,
    comments: 0,
    tags: m.tags.map((t: string) => t.toLowerCase()),
    width: 3000,
    height: 2000,
    creator: pickCreator(index),
    uploadedAt: new Date(Date.now() - index * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'mediamodifier' as const,
    mediamodifierNr: m.nr,
  };
}

export function mapMmMockupList(raw: unknown): (MockupAsset & MappedMmMockupExtra)[] {
  const list = validateMmResponse(raw);
  if (!list) return [];
  return list
    .map((item, i) => mapMmMockup(item, i))
    .filter((m): m is NonNullable<typeof m> => m !== null);
}

function validateMmResponse(raw: unknown): MmMockup[] | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r['mockups'])) return null;
  return r['mockups'] as MmMockup[];
}
