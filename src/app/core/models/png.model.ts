
export type PngStyle = 'photorealistic' | '3d' | 'illustration' | 'clipart' | 'flat' | 'cartoon';


export type PngColorTone =
  | 'black' | 'white' | 'gray' | 'red' | 'orange'
  | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'
  | 'brown' | 'gold' | 'multi';


export type PngOrientation = 'landscape' | 'portrait' | 'square';


export type PngResolution = 'hd' | '4k';


export type PngProvider = 'pixabay' | 'pexels' | 'openverse' | 'local';

export interface PngAsset {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;

  url: string;

  thumb: string;
  width: number;
  height: number;
  isPremium: boolean;
  downloads: number;
  likes: number;
  views: number;
  tags: string[];
  createdAt: string;

  source: string;
  style: PngStyle;
  hasPeople: boolean;
  colorTone: PngColorTone;
  resolution: PngResolution;
  provider: PngProvider;
}

export interface PngCategory {
  id: string;
  name: string;
  emoji: string;
}


export interface PngCollection {
  id: string;
  name: string;
  assetIds: string[];
  createdAt: string;
}

export type PngSortMode = 'popular' | 'newest' | 'downloads' | 'views';
export type PngLicenseFilter = 'all' | 'free' | 'premium';
export type PngViewMode = 'masonry' | 'grid' | 'list';

export interface PngFilterState {
  query: string;
  categoryId: string | null;
  license: PngLicenseFilter;
  sort: PngSortMode;
  favoritesOnly: boolean;
  style: PngStyle | null;
  hasPeople: 'all' | 'yes' | 'no';
  colorTone: PngColorTone | null;
  resolution: PngResolution | 'all';
  dateAdded: 'all' | 'today' | 'week' | 'month';
  orientation: PngOrientation | 'all';
}
