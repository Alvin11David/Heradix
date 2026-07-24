import { MmMockup } from '../../services/mediamodifier-api.service';
import {
  MockupAsset, MockupCategory, MockupSceneType,
} from '../../models/mockup.model';
import { inferCategory } from './category-inference';

const SOURCE_CREATOR = {
  id: 'mediamodifier',
  name: 'MediaModifier',
  avatar: '',
  isVerified: true,
  followers: 0,
  totalAssets: 0,
};

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

export function mapMmMockup(raw: unknown, index: number): MockupAsset | null {
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
    dominantColors: [],
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
    tags: m.tags.map(t => t.toLowerCase()),
    width: 3000,
    height: 2000,
    creator: SOURCE_CREATOR,
    uploadedAt: new Date(Date.now() - index * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function mapMmMockupList(raw: unknown): MockupAsset[] {
  if (!raw || typeof raw !== 'object') return [];
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r['mockups'])) return [];
  const list = r['mockups'] as MmMockup[];
  return list
    .map((item, i) => mapMmMockup(item, i))
    .filter((m): m is NonNullable<typeof m> => m !== null);
}
