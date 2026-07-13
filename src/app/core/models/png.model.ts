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
  tags: string[];
  createdAt: string;
  /** Host the cutout was sourced from, shown as attribution in the detail view. */
  source: string;
}

export interface PngCategory {
  id: string;
  name: string;
}

export type PngSortMode = 'popular' | 'newest' | 'downloads';
export type PngLicenseFilter = 'all' | 'free' | 'premium';

export interface PngFilterState {
  query: string;
  categoryId: string | null;
  license: PngLicenseFilter;
  sort: PngSortMode;
  favoritesOnly: boolean;
}
