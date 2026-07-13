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

  library?: IconLibraryId;
  hasAnimatedVariant: boolean;
  isPremium: boolean;
  downloads: number;
  createdAt: string;

  path: string;

  viewBox?: string;

  colorSvg?: string;
  author?: IconAuthor;
}


export interface IconStyleState {
  technique: IconTechnique;
  colorMode: IconColorMode;
  corners: IconCorners;
  strokeWidth: number;
  animatedOn: boolean;
  recolorHue: string;
  density: IconSizeDensity;
}

export interface IconCollection {
  id: string;
  name: string;
  iconIds: string[];
  createdAt: string;
}

export interface IconFilterState {
  query: string;
  platforms: IconPlatform[];
  aesthetic: IconAesthetic[];
  trend: IconTrend[];
  author: IconAuthor[];
  categoryId: string | null;
  favoritesOnly: boolean;

  libraryId: IconLibraryId | null;
}
