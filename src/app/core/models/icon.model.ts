export type IconPlatform = 'android' | 'ios' | 'windows' | 'macos';
export type IconAesthetic = 'professional' | 'decorative' | 'games' | 'classic' | 'kids';
export type IconTrend = 'retro' | '2000s' | '2010s' | '2020s' | 'new';
export type IconAuthor = 'amarapix' | 'community';

export type IconTechnique = 'line' | 'filled' | '3d' | 'hand-drawn';
export type IconColorMode = 'mono' | 'duo' | 'multi' | 'gradient';
export type IconCorners = 'round' | 'sharp';
export type IconSizeDensity = 'small' | 'medium' | 'large';

export type IconLibraryId =
  'amarapix' | 'tabler' | 'lucide' | 'bootstrap' | 'heroicons' |
  'phosphor' | 'remixicon' | 'ionicons' | 'mdi';

export interface IconAsset {
  id: string;
  name: string;
  slug: string;
  category: string;
  tags: string[];
  platforms: IconPlatform[];
  aesthetic: IconAesthetic[];
  trend: IconTrend;
  /** Which icon library this icon comes from. */
  library?: IconLibraryId;
  hasAnimatedVariant: boolean;
  isPremium: boolean;
  downloads: number;
  createdAt: string;
  /** Inner SVG markup (paths/shapes only), designed for the given viewBox. */
  path: string;
  /** SVG viewBox — defaults to "0 0 24 24" if absent. Non-24x24 libraries set this. */
  viewBox?: string;
  /** Full-color inner SVG content with embedded fill/stroke colors. When present,
   *  the icon renders with its real colors and bypasses the global style CSS overrides. */
  colorSvg?: string;
  author?: IconAuthor;
}

/** Live rendering controls that apply across the whole grid, mirroring how a
 *  "style pack" re-renders the same icon set rather than filtering it out. */
export interface IconStyleState {
  technique: IconTechnique;
  colorMode: IconColorMode;
  corners: IconCorners;
  strokeWidth: number;
  animatedOn: boolean;
  recolorHue: string;
  density: IconSizeDensity;
}

export interface IconFilterState {
  query: string;
  platforms: IconPlatform[];
  aesthetic: IconAesthetic[];
  trend: IconTrend[];
  author: IconAuthor[];
  categoryId: string | null;
  favoritesOnly: boolean;
  /** Active library filter — null means "all loaded libraries" */
  libraryId: IconLibraryId | null;
}
