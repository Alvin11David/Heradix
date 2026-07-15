// ─── Vector Asset Model ──────────────────────────────────────────────────────

export type VectorFormat = 'svg' | 'eps' | 'ai' | 'pdf' | 'cdr' | 'dxf' | 'png';

export type VectorStyle =
  | 'flat' | 'outline' | 'filled' | 'cartoon' | 'minimal'
  | 'isometric' | 'hand-drawn' | 'watercolor' | 'clay'
  | 'glassmorphism' | 'neumorphism' | 'gradient' | '3d';

export type VectorLicense = 'free' | 'premium' | 'commercial' | 'editorial' | 'public-domain';
export type VectorOrientation = 'portrait' | 'landscape' | 'square';
export type VectorComplexity = 'beginner' | 'medium' | 'advanced';
export type VectorSortMode = 'popular' | 'newest' | 'downloads' | 'views' | 'likes' | 'rating';
export type VectorViewMode = 'masonry' | 'grid' | 'list';
export type VectorColorMode = 'single' | 'multi' | 'gradient' | 'black' | 'white';

export interface VectorCreator {
  id: string;
  name: string;
  avatar: string;
  isVerified: boolean;
  followers: number;
  totalAssets: number;
}

export interface VectorAsset {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  subcategory?: string;

  previewUrl: string;
  thumbUrl: string;
  dominantColors: string[];

  formats: VectorFormat[];
  style: VectorStyle;
  license: VectorLicense;
  orientation: VectorOrientation;
  complexity: VectorComplexity;
  colorMode: VectorColorMode;

  isPremium: boolean;
  isFree: boolean;
  isAiGenerated: boolean;
  isAnimated: boolean;
  isNew: boolean;
  isStaffPick: boolean;
  isEditorsChoice: boolean;

  downloads: number;
  likes: number;
  views: number;
  rating: number;
  ratingCount: number;
  comments: number;

  tags: string[];
  width: number;
  height: number;
  fileSize: number; // KB

  creator: VectorCreator;
  uploadedAt: string;
  updatedAt: string;
}

export interface VectorCategory {
  id: string;
  label: string;
  icon: string;
  count: number;
  subcategories?: { id: string; label: string }[];
}

export interface VectorCollection {
  id: string;
  name: string;
  assetIds: string[];
  isPublic: boolean;
  createdAt: string;
}

export interface VectorFilterState {
  query: string;
  categoryId: string | null;
  subcategoryId: string | null;
  formats: VectorFormat[];
  style: VectorStyle | null;
  license: VectorLicense | null;
  orientation: VectorOrientation | null;
  complexity: VectorComplexity | null;
  colorMode: VectorColorMode | null;
  color: string | null;
  isAiGenerated: boolean | null;
  isAnimated: boolean | null;
  dateAdded: 'all' | 'today' | 'week' | 'month';
  sort: VectorSortMode;
  favoritesOnly: boolean;
  creatorId: string | null;
}
