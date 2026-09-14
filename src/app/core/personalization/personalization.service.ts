import { Injectable, Signal, WritableSignal, computed, signal } from '@angular/core';
import {
  PersonalizationMetadata,
  PersonalizationPreferences,
  PersonalizationResult,
  PersonalizationType,
} from './personalization.model';

const STORAGE_PREFIX = 'amx_personalization_';
const SIGNALS_PREFIX = 'amx_personalization_signals_';
const SIGNAL_HALF_LIFE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_SIGNAL_ENTRIES = 40;

interface SignalEntry { w: number; t: number; }

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

function readSignalEntries(type: PersonalizationType): Map<string, SignalEntry> {
  try {
    const raw = localStorage.getItem(`${SIGNALS_PREFIX}${type}`);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, SignalEntry>;
    const map = new Map<string, SignalEntry>();
    if (parsed && typeof parsed === 'object') {
      for (const [key, value] of Object.entries(parsed)) {
        if (value && typeof value === 'object' && typeof value.w === 'number' && typeof value.t === 'number') {
          map.set(key, { w: value.w, t: value.t });
        }
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function decayedWeight(entry: SignalEntry): number {
  const elapsed = Date.now() - entry.t;
  return entry.w * Math.pow(0.5, elapsed / SIGNAL_HALF_LIFE_MS);
}

@Injectable({ providedIn: 'root' })
export class PersonalizationService {
  private readonly states = new Map<string, WritableSignal<PersonalizationPreferences | null>>();
  private readonly signalStores = new Map<string, WritableSignal<Map<string, SignalEntry>>>();
  private readonly signalViews = new Map<string, Signal<ReadonlyMap<string, number>>>();

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

  signals(type: PersonalizationType): Signal<ReadonlyMap<string, number>> {
    let view = this.signalViews.get(type);
    if (!view) {
      const store = this.signalStore(type);
      view = computed(() => {
        const decayed = new Map<string, number>();
        for (const [token, entry] of store()) {
          const weight = decayedWeight(entry);
          if (weight >= 0.25) decayed.set(token, weight);
        }
        return decayed;
      });
      this.signalViews.set(type, view);
    }
    return view;
  }

  recordSignals(type: PersonalizationType, tokens: string[], weight: number): void {
    if (weight <= 0) return;
    const store = this.signalStore(type);
    store.update((map) => {
      const next = new Map(map);
      const now = Date.now();
      for (const raw of tokens) {
        const token = normalize(raw);
        if (!token) continue;
        const entry = next.get(token);
        next.set(token, entry ? { w: entry.w + weight, t: now } : { w: weight, t: now });
      }
      if (next.size > MAX_SIGNAL_ENTRIES) {
        const keep = [...next.entries()]
          .sort((a, b) => decayedWeight(b[1]) - decayedWeight(a[1]))
          .slice(0, MAX_SIGNAL_ENTRIES);
        const pruned = new Map(keep);
        this.persistSignalEntries(type, pruned);
        return pruned;
      }
      this.persistSignalEntries(type, next);
      return next;
    });
  }

  clearSignals(type: PersonalizationType): void {
    this.signalStore(type).set(new Map());
    try { localStorage.removeItem(`${SIGNALS_PREFIX}${type}`); } catch { }
  }

  rank<T>(
    type: PersonalizationType,
    items: T[],
    preferences: PersonalizationPreferences | null,
    getMetadata: (item: T) => PersonalizationMetadata,
  ): T[] {
    const signals = this.signals(type)();
    if ((!preferences || preferences.skipped) && signals.size === 0) return items;

    const selectedCategories = new Set((preferences?.categories ?? []).map(normalize));
    const selectedStyles = new Set((preferences?.styles ?? []).map(normalize));
    const selectedTopics = new Set((preferences?.topics ?? []).map(normalize));
    const signalEntries = [...signals.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_SIGNAL_ENTRIES);

    return items
      .map((item, index) => {
        const metadata = getMetadata(item);
        const categories = tokens(metadata.categories ?? []);
        const styles = tokens(metadata.styles ?? []);
        const topics = tokens(metadata.topics ?? []);
        const categoryHits = [...selectedCategories].filter((selected) => matches(selected, categories) || matches(selected, topics)).length;
        const styleHits = [...selectedStyles].filter((selected) => matches(selected, styles) || matches(selected, topics)).length;
        const topicHits = [...selectedTopics].filter((selected) => matches(selected, topics)).length;
        let score = categoryHits * 10 + styleHits * 6 + topicHits * 3;
        for (const [signal, signalWeight] of signalEntries) {
          if (matches(signal, categories) || matches(signal, styles) || matches(signal, topics)) {
            score += Math.min(12, signalWeight * 0.35);
          }
        }
        return { item, index, score };
      })
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(({ item }) => item);
  }

  private signalStore(type: PersonalizationType): WritableSignal<Map<string, SignalEntry>> {
    const existing = this.signalStores.get(type);
    if (existing) return existing;
    const created = signal<Map<string, SignalEntry>>(readSignalEntries(type));
    this.signalStores.set(type, created);
    return created;
  }

  private persistSignalEntries(type: PersonalizationType, map: Map<string, SignalEntry>): void {
    try {
      localStorage.setItem(`${SIGNALS_PREFIX}${type}`, JSON.stringify(Object.fromEntries(map)));
    } catch { }
  }

  private getMutableState(type: PersonalizationType): WritableSignal<PersonalizationPreferences | null> {
    const existing = this.states.get(type);
    if (existing) return existing;
    const created = signal<PersonalizationPreferences | null>(readPreferences(type));
    this.states.set(type, created);
    return created;
  }
}