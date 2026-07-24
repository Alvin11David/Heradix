// Static data for the Mockups feature — categories, trending tags/colors, seasonal collections.
// Extracted from the component so the facade service can import them without circular deps.

import { MockupCategoryMeta } from '../../core/models/mockup.model';

export const MOCKUP_CATEGORIES: MockupCategoryMeta[] = [
  { id: 'devices',     label: 'Devices',     icon: '📱', count: 0, subcategories: [] },
  { id: 'apparel',     label: 'Apparel',     icon: '👕', count: 0, subcategories: [] },
  { id: 'branding',    label: 'Branding',    icon: '🏢', count: 0, subcategories: [] },
  { id: 'packaging',   label: 'Packaging',   icon: '📦', count: 0, subcategories: [] },
  { id: 'print',       label: 'Print',       icon: '📄', count: 0, subcategories: [] },
  { id: 'outdoor',     label: 'Outdoor',     icon: '🏙️', count: 0, subcategories: [] },
  { id: 'home-office', label: 'Home & Office',icon: '🏠', count: 0, subcategories: [] },
  { id: 'digital',     label: 'Digital',     icon: '💻', count: 0, subcategories: [] },
  { id: 'merchandise', label: 'Merchandise', icon: '🎁', count: 0, subcategories: [] },
];

export const MOCKUP_TRENDING_TAGS: string[] = [
  'iPhone', 'MacBook', 'hoodie', 'tote bag', 'coffee cup', 'notebook',
  'billboard', 'business card', 'packaging', 'poster', 'screen', 'apparel',
];

export const MOCKUP_TRENDING_COLORS: string[] = [
  '#ffffff', '#000000', '#f5f5f5', '#1e1e2e', '#e2e8f0', '#fef3c7',
  '#dbeafe', '#fce7f3', '#d1fae5', '#ede9fe',
];

export interface SeasonalCollection {
  id: string;
  label: string;
  emoji: string;
  tag: string;
}

export const MOCKUP_SEASONAL_COLLECTIONS: SeasonalCollection[] = [
  { id: 'summer',    label: 'Summer Vibes',    emoji: '☀️', tag: 'summer'    },
  { id: 'holiday',   label: 'Holiday Season',  emoji: '🎄', tag: 'holiday'   },
  { id: 'back2school', label: 'Back to School', emoji: '📚', tag: 'school'   },
  { id: 'minimal',   label: 'Minimal & Clean', emoji: '⬜', tag: 'minimal'   },
  { id: 'dark',      label: 'Dark Mode',       emoji: '🌑', tag: 'dark'      },
  { id: 'neon',      label: 'Neon & Glow',     emoji: '🌟', tag: 'neon'      },
];
