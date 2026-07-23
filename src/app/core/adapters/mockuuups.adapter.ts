import { MkuMockup, MkuTag } from '../services/mockuuups-api.service';
import {
  MockupAsset, MockupCategory, MockupSceneType,
} from '../models/mockup.model';
import { inferCategory } from './category-inference';
import { pickCreator } from './creators';

export interface MappedMockupExtra {
  source: 'mockuuups';
  mockuuupsId: string;
  placements: MkuMockup['placements'];
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isValidNumber(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v);
}

function validateMkuMockup(raw: unknown): raw is MkuMockup {
  if (!raw || typeof raw !== 'object') return false;
  const m = raw as Record<string, unknown>;
  return isNonEmptyString(m['id'])
    && isNonEmptyString(m['title'])
    && isNonEmptyString(m['thumbnail'])
    && isValidNumber(m['width'])
    && isValidNumber(m['height']);
}

export function mapMkuMockup(raw: unknown, index: number): (MockupAsset & MappedMockupExtra) | null {
  if (!validateMkuMockup(raw)) return null;

  const m = raw as MkuMockup;
  const tagSlugs = m.tags.map((t: MkuTag) => t.slug);
  const tagTitles = m.tags.map((t: MkuTag) => t.title.toLowerCase());
  const primaryTag = m.tags[0]?.title ?? '';
  const family = m.placements[0]?.family ?? '';

  const cat = inferCategory(tagSlugs, family);
  const isFree = !tagSlugs.includes('premium');
  const isPremium = tagSlugs.includes('premium');

  const isPortrait = m.height > m.width;
  const orient: 'portrait' | 'landscape' | 'square' =
    m.width === m.height ? 'square' : isPortrait ? 'portrait' : 'landscape';

  return {
    id: `api_${m.id}`,
    slug: m.id,
    name: m.title,
    description: `${m.title} — professional mockup with ${m.placements.length} smart object${m.placements.length > 1 ? 's' : ''}. ${m.tags.map((t: MkuTag) => t.title).join(', ')}.`,
    category: cat as MockupCategory,
    categoryLabel: cat.charAt(0).toUpperCase() + cat.slice(1),
    subcategory: family.toLowerCase().replace(/\s+/g, '-'),
    previewUrl: m.thumbnail,
    thumbUrl: m.thumbnail,
    additionalPreviews: [],
    dominantColors: ['#1F2937', '#374151', '#6B7280'],
    sceneType: 'studio' as MockupSceneType,
    orientation: orient,
    license: isFree ? 'free' : 'premium',
    formats: ['png', 'jpg', 'webp'],
    resolution: `${m.width}×${m.height}px`,
    smartObjectSize: m.placements[0] ? `${m.placements[0].width}×${m.placements[0].height}${m.placements[0].unit ?? 'px'}` : '',
    editableAreas: m.placements.length,
    isPremium,
    isFree,
    isAiGenerated: tagSlugs.includes('ai-generated'),
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
    tags: tagTitles,
    width: m.width,
    height: m.height,
    creator: pickCreator(index),
    uploadedAt: new Date(Date.now() - index * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'mockuuups' as const,
    mockuuupsId: m.id,
    placements: m.placements,
  };
}

export function mapMkuMockupList(raw: unknown): (MockupAsset & MappedMockupExtra)[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => mapMkuMockup(item, i))
    .filter((m): m is NonNullable<typeof m> => m !== null);
}
