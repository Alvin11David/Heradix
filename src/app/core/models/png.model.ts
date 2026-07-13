/** Rendered visual style of a PNG cutout. */
export type PngStyle = 'photorealistic' | '3d' | 'illustration' | 'clipart' | 'flat' | 'cartoon';

/** Dominant colour tone of the asset. */
export type PngColorTone =
  | 'black' | 'white' | 'gray' | 'red' | 'orange'
  | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'
  | 'brown' | 'gold' | 'multi';

/** Image orientation derived from width/height. */
export type PngOrientation = 'landscape' | 'portrait' | 'square';

/** Minimum export resolution available. */
export type PngResolution = 'hd' | '4k';

/** A single transparent PNG cutout asset in the PNG marketplace library. */
export interface PngAsset {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  /** Full-resolution download URL (transparent background). */
  url: string;
  /** Grid thumbnail URL — same asset, smaller/cheaper to paint at scale. */
  thumb: string;
  width: number;
  height: number;
  isPremium: boolean;
  downloads: number;
  likes: number;
  views: number;
  tags: string[];
  createdAt: string;
  /** Host the cutout was sourced from, shown as attribution in the detail view. */
  source: string;
  style: PngStyle;
  hasPeople: boolean;
  colorTone: PngColorTone;
  resolution: PngResolution;
}

export interface PngCategory {
  id: string;
  name: string;
  emoji: string;
}

/** A saved user board/collection of PNG assets. */
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
