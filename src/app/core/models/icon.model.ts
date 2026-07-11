export type IconPlatform = 'android' | 'ios' | 'windows' | 'macos';
export type IconAesthetic = 'professional' | 'decorative' | 'games' | 'classic' | 'kids';
export type IconTrend = 'retro' | '2000s' | '2010s' | '2020s' | 'new';
export type IconAuthor = 'amarapix' | 'community';

export type IconTechnique = 'line' | 'filled' | '3d' | 'hand-drawn';
export type IconColorMode = 'mono' | 'duo' | 'multi' | 'gradient';
export type IconCorners = 'round' | 'sharp';
export type IconSizeDensity = 'small' | 'medium' | 'large';

export interface IconAsset {
  id: string;
  name: string;
  slug: string;
  category: string;
  tags: string[];
  platforms: IconPlatform[];
  aesthetic: IconAesthetic[];
  trend: IconTrend;
  author: IconAuthor;
  hasAnimatedVariant: boolean;
  isPremium: boolean;
  downloads: number;
  createdAt: string;
  /** Inner SVG markup (paths/shapes only), 24x24 viewBox, currentColor-driven. */
  path: string;
  /** Full-color inner SVG content with embedded fill/stroke colors. When present,
   *  the icon renders with its real colors and bypasses the global style CSS overrides. */
  colorSvg?: string;
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
}
