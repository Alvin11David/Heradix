export type PersonalizationType = 'png' | 'photos' | string;

export interface PersonalizationOption {
  id: string;
  label: string;
  emoji: string;
  previewUrl: string;
  description?: string;
  keywords?: string[];
}

export interface PersonalizationConfig {
  type: PersonalizationType;
  eyebrow: string;
  title: string;
  description: string;
  categoryLabel: string;
  styleLabel: string;
  categories: PersonalizationOption[];
  styles: PersonalizationOption[];
}

export interface PersonalizationPreferences {
  categories: string[];
  styles: string[];
  topics: string[];
  skipped: boolean;
  updatedAt: string;
}

export interface PersonalizationMetadata {
  categories?: string[];
  styles?: string[];
  topics?: string[];
}

export interface PersonalizationResult {
  categories: string[];
  styles: string[];
  topics: string[];
  skipped: boolean;
}