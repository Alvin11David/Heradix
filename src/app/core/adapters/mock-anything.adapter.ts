import {
  MockProductDetail, MockProductDecoration,
} from '../services/mock-anything-api.service';
import {
  MockupAsset, MockupCategory, MockupSceneType,
} from '../models/mockup.model';
import { inferCategory } from './category-inference';
import { pickCreator } from './creators';

export interface MappedAnyMockupExtra {
  source: 'mock-anything';
  productUuid: string;
  decoration: MockProductDecoration;
}

function svgDataUri(text: string, bg: string): string {
  const encoded = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="${bg}"/>
    <rect x="1" y="1" width="598" height="398" fill="none" stroke="#e5e7eb" stroke-width="2" rx="8"/>
    <text x="300" y="180" text-anchor="middle" fill="#6b7280" font-family="Arial,sans-serif" font-size="16">${text}</text>
    <text x="300" y="210" text-anchor="middle" fill="#9ca3af" font-family="Arial,sans-serif" font-size="12">AI-ready mockup</text>
  </svg>`);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function mapAnyMockup(product: MockProductDetail, decoration: MockProductDecoration, colorName: string, colorHex: string, index: number): MockupAsset & MappedAnyMockupExtra {
  const tags = [
    product.category.toLowerCase(),
    product.brand.toLowerCase(),
    product.name.toLowerCase(),
    decoration.location.toLowerCase(),
    decoration.name.toLowerCase(),
    colorName.toLowerCase(),
  ];
  const cat = inferCategory(tags, product.category);

  const previewUrl = svgDataUri(product.name, colorHex);

  return {
    id: `ma_${product.uuid}_${decoration.location}_${colorName.replace(/\s+/g, '-')}`,
    slug: `${product.uuid}-${decoration.location}`,
    name: `${product.name} — ${decoration.name} (${colorName})`,
    description: `AI-ready ${product.category.toLowerCase()} mockup from Mock Anything. Product: ${product.name} by ${product.brand}. Decoration: ${decoration.name} (${decoration.location}). Color: ${colorName}.`,
    category: cat as MockupCategory,
    categoryLabel: cat.charAt(0).toUpperCase() + cat.slice(1),
    subcategory: product.category.toLowerCase().replace(/\s+/g, '-'),
    previewUrl,
    thumbUrl: previewUrl,
    additionalPreviews: [],
    dominantColors: [colorHex],
    sceneType: 'studio' as MockupSceneType,
    orientation: 'landscape',
    license: 'free',
    formats: ['png', 'webp'],
    resolution: '1024×1024px',
    smartObjectSize: decoration.surface ?? '',
    editableAreas: 1,
    isPremium: false,
    isFree: true,
    isAiGenerated: true,
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
    tags,
    width: 1024,
    height: 1024,
    creator: pickCreator(index),
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'mock-anything' as const,
    productUuid: product.uuid,
    decoration,
  };
}

export function mapAnyProductToMockups(product: MockProductDetail, indexBase: number): (MockupAsset & MappedAnyMockupExtra)[] {
  if (!product.decorations.length) {
    return [mapAnyMockup(product, { location: 'full', name: 'Full Print', surface: '' }, product.colors[0]?.name ?? 'White', product.colors[0]?.hex ?? '#FFFFFF', indexBase)];
  }

  const results: (MockupAsset & MappedAnyMockupExtra)[] = [];
  let idx = indexBase;

  for (const decoration of product.decorations) {
    const colors = product.colors.length ? product.colors : [{ name: 'White', hex: '#FFFFFF' }];
    for (const color of colors) {
      results.push(mapAnyMockup(product, decoration, color.name, color.hex, idx));
      idx++;
    }
  }

  return results;
}
