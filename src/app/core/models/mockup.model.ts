// ─── Mockup Asset Model ──────────────────────────────────────────────────────

export type MockupCategory =
  | 'devices' | 'apparel' | 'branding' | 'packaging'
  | 'print' | 'outdoor' | 'home-office' | 'digital' | 'merchandise';

export type MockupSceneType =
  | 'studio' | 'lifestyle' | 'minimal' | 'flat-lay'
  | 'perspective' | 'top-view' | 'front-view' | 'side-view' | 'isometric' | 'outdoor' | 'indoor';

export type MockupOrientation = 'portrait' | 'landscape' | 'square';
export type MockupLicense = 'free' | 'premium' | 'commercial' | 'editorial';
export type MockupFormat = 'png' | 'jpg' | 'pdf' | 'psd' | 'svg' | 'webp';
export type MockupSortMode = 'popular' | 'newest' | 'downloads' | 'views' | 'likes' | 'rating';
export type MockupViewMode = 'masonry' | 'grid' | 'list';
export type MockupQuality = 'low' | 'medium' | 'high' | 'ultra-hd' | 'print';

export interface MockupCreator {
  id: string;
  name: string;
  avatar: string;
  isVerified: boolean;
  followers: number;
  totalAssets: number;
}

export interface MockupAsset {
  id: string;
  slug: string;
  name: string;
  description: string;

  category: MockupCategory;
  categoryLabel: string;
  subcategory?: string;

  previewUrl: string;
  thumbUrl: string;
  additionalPreviews: string[];
  dominantColors: string[];

  sceneType: MockupSceneType;
  orientation: MockupOrientation;
  license: MockupLicense;
  formats: MockupFormat[];
  resolution: string;
  smartObjectSize: string;
  editableAreas: number;

  isPremium: boolean;
  isFree: boolean;
  isAiGenerated: boolean;
  isNew: boolean;
  isStaffPick: boolean;
  isEditorsChoice: boolean;
  isFeatured: boolean;
  isTrending: boolean;

  downloads: number;
  likes: number;
  views: number;
  rating: number;
  ratingCount: number;
  comments: number;

  tags: string[];
  width: number;
  height: number;

  creator: MockupCreator;
  uploadedAt: string;
  updatedAt: string;
}

export interface MockupCategoryMeta {
  id: MockupCategory;
  label: string;
  icon: string;
  count: number;
  subcategories: { id: string; label: string; icon?: string }[];
}

export interface MockupCollection {
  id: string;
  name: string;
  assetIds: string[];
  isPublic: boolean;
  createdAt: string;
}

export interface MockupWithSource extends MockupAsset {
  source?: 'mockuuups' | 'mediamodifier' | 'local';
}

export interface MockupFilterState {
  query: string;
  categoryId: MockupCategory | null;
  subcategoryId: string | null;
  sceneType: MockupSceneType | null;
  orientation: MockupOrientation | null;
  license: MockupLicense | null;
  formats: MockupFormat[];
  isAiGenerated: boolean | null;
  bgColor: string | null;
  sort: MockupSortMode;
  dateAdded: 'all' | 'today' | 'week' | 'month';
  favoritesOnly: boolean;
  creatorId: string | null;
}
