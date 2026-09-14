import { Injectable, Signal, WritableSignal, signal } from '@angular/core';
import {
  PersonalizationMetadata,
  PersonalizationPreferences,
  PersonalizationResult,
  PersonalizationType,
} from './personalization.model';

const STORAGE_PREFIX = 'amx_personalization_';

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ');
}

function tokens(values: string[]): string[] {
  return values.flatMap((value) => normalize(value).split(/[^a-z0-9]+/).filter(Boolean));
}

function matches(selected: string, available: string[]): boolean {
  const singular = selected.endsWith('s') ? selected.slice(0, -1) : selected;
  return available.some((value) =>
    value === selected ||
    value === singular ||
    value.startsWith(selected) ||
    selected.startsWith(value)
  );
}

function readPreferences(type: PersonalizationType): PersonalizationPreferences | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${type}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersonalizationPreferences>;
    if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.styles)) return null;
    return {
      categories: parsed.categories.filter((value): value is string => typeof value === 'string'),
      styles: parsed.styles.filter((value): value is string => typeof value === 'string'),
      topics: Array.isArray(parsed.topics) ? parsed.topics.filter((value): value is string => typeof value === 'string') : [],
      skipped: parsed.skipped === true,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class PersonalizationService {
  private readonly states = new Map<string, WritableSignal<PersonalizationPreferences | null>>();

  preferences(type: PersonalizationType): Signal<PersonalizationPreferences | null> {
    const existing = this.states.get(type);
    if (existing) return existing.asReadonly();
    const created = signal<PersonalizationPreferences | null>(readPreferences(type));
    this.states.set(type, created);
    return created.asReadonly();
  }

  hasPreferences(type: PersonalizationType): boolean {
    return this.preferences(type)() !== null;
  }

  save(type: PersonalizationType, result: PersonalizationResult): void {
    const next: PersonalizationPreferences = {
      categories: [...new Set(result.categories)],
      styles: [...new Set(result.styles)],
      topics: [...new Set(result.topics)],
      skipped: result.skipped,
      updatedAt: new Date().toISOString(),
    };
    const state = this.getMutableState(type);
    state.set(next);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${type}`, JSON.stringify(next));
    } catch {
      // The in-memory signal still keeps the current session personalized.
    }
  }

  clear(type: PersonalizationType): void {
    this.getMutableState(type).set(null);
    try { localStorage.removeItem(`${STORAGE_PREFIX}${type}`); } catch { }
  }

  rank<T>(
    items: T[],
    preferences: PersonalizationPreferences | null,
    getMetadata: (item: T) => PersonalizationMetadata,
  ): T[] {
    if (!preferences || preferences.skipped) return items;

    const selectedCategories = new Set(preferences.categories.map(normalize));
    const selectedStyles = new Set(preferences.styles.map(normalize));
    const selectedTopics = new Set(preferences.topics.map(normalize));

    return items
      .map((item, index) => {
        const metadata = getMetadata(item);
        const categories = tokens(metadata.categories ?? []);
        const styles = tokens(metadata.styles ?? []);
        const topics = tokens(metadata.topics ?? []);
        const categoryHits = [...selectedCategories].filter((selected) => matches(selected, categories) || matches(selected, topics)).length;
        const styleHits = [...selectedStyles].filter((selected) => matches(selected, styles) || matches(selected, topics)).length;
        const topicHits = [...selectedTopics].filter((selected) => matches(selected, topics)).length;
        return { item, index, score: categoryHits * 10 + styleHits * 6 + topicHits * 3 };
      })
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(({ item }) => item);
  }

  private getMutableState(type: PersonalizationType): WritableSignal<PersonalizationPreferences | null> {
    const existing = this.states.get(type);
    if (existing) return existing;
    const created = signal<PersonalizationPreferences | null>(readPreferences(type));
    this.states.set(type, created);
    return created;
  }
}