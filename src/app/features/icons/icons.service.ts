import { Injectable, signal, computed } from '@angular/core';
import {
  IconAsset, IconAuthor, IconAesthetic, IconTrend, IconPlatform,
  IconFilterState, IconStyleState,
} from '../../core/models/icon.model';

const FAVORITES_KEY = 'amx_icon_favorites';

export interface IconCategory {
  id: string;
  name: string;
  slug: string;
}

export const ICON_CATEGORIES: IconCategory[] = [
  { id: 'business',          name: 'Business & Office',  slug: 'business' },
  { id: 'communication',     name: 'Communication',      slug: 'communication' },
  { id: 'weather',           name: 'Weather',             slug: 'weather' },
  { id: 'nature',            name: 'Nature & Animals',    slug: 'nature-animals' },
  { id: 'food',              name: 'Food & Drink',        slug: 'food-drink' },
  { id: 'transport',         name: 'Transport',           slug: 'transport' },
  { id: 'technology',        name: 'Technology',          slug: 'technology' },
  { id: 'health',            name: 'Health & Fitness',    slug: 'health-fitness' },
  { id: 'everyday',          name: 'Everyday & Security', slug: 'everyday-security' },
  { id: 'play',              name: 'Play & Learning',     slug: 'play-learning' },
];

// -- Raw icon definitions -----------------------------------------------
// [name, category, path, tags, platforms, aesthetic, trend, author, animated, premium]
type Row = [
  string, string, string, string[], IconPlatform[], IconAesthetic[], IconTrend, IconAuthor, boolean, boolean
];

const ROWS: Row[] = [
  // Business & Office
  ['Briefcase', 'business', '<rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M2 13h20"/>', ['work','office','case'], [], ['professional'], '2020s', 'amarapix', false, false],
  ['Calculator', 'business', '<rect x="4" y="2" width="16" height="20" rx="2"/><rect x="7" y="5" width="10" height="4"/><path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2M15 17h2"/>', ['math','finance','numbers'], ['windows','macos'], ['professional'], '2010s', 'amarapix', false, false],
  ['Calendar', 'business', '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/>', ['schedule','date','planner'], ['ios','android'], ['professional'], 'new', 'amarapix', false, false],
  ['Clock', 'business', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>', ['time','watch'], [], ['professional','classic'], '2000s', 'amarapix', true, false],
  ['Wallet', 'business', '<path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2h-3a3 3 0 0 0 0 6h3v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="16" cy="12" r="1"/>', ['money','finance','pay'], [], ['professional'], '2020s', 'community', false, true],
  ['Credit Card', 'business', '<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>', ['payment','bank','card'], [], ['professional'], 'new', 'amarapix', false, true],

  // Communication
  ['Chat Bubble', 'communication', '<path d="M21 11a8 8 0 1 1-3-6.2L21 3l-1.3 4A7.9 7.9 0 0 1 21 11z"/>', ['message','talk','support'], ['ios','android'], ['professional','decorative'], 'new', 'amarapix', true, false],
  ['Mail', 'communication', '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 6l9 7 9-7"/>', ['email','envelope','inbox'], [], ['professional','classic'], '2000s', 'amarapix', false, false],
  ['Phone', 'communication', '<path d="M6 2h4l2 5-2.5 2a12 12 0 0 0 5.5 5.5l2-2.5 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 6a2 2 0 0 1 2-4z"/>', ['call','telephone'], ['ios','android'], ['professional','classic'], '2010s', 'amarapix', false, false],
  ['Send', 'communication', '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>', ['paper plane','share'], [], ['professional','decorative'], 'new', 'amarapix', true, false],
  ['At Sign', 'communication', '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-4 7.5"/>', ['email','mention','social'], [], ['professional'], '2010s', 'community', false, false],
  ['Wifi', 'communication', '<path d="M5 13a11 11 0 0 1 14 0M8.5 16.5a6 6 0 0 1 7 0"/><circle cx="12" cy="20" r="1"/>', ['network','signal','internet'], ['windows','macos','android','ios'], ['professional'], '2020s', 'amarapix', true, false],

  // Weather
  ['Sun', 'weather', '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>', ['weather','sunny','bright'], [], ['classic','decorative'], '2000s', 'amarapix', true, false],
  ['Moon', 'weather', '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>', ['night','sleep','dark mode'], [], ['classic'], 'new', 'amarapix', false, false],
  ['Cloud', 'weather', '<path d="M7 18a4 4 0 1 1 .5-8 5 5 0 0 1 9.6 1.5A3.5 3.5 0 0 1 17 18H7z"/>', ['weather','overcast','sky'], [], ['classic'], '2000s', 'amarapix', false, false],
  ['Umbrella', 'weather', '<path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z"/><path d="M12 12v7a2 2 0 0 1-4 0"/><path d="M12 3v2"/>', ['rain','protection'], [], ['decorative'], '2010s', 'community', false, false],
  ['Snowflake', 'weather', '<path d="M12 2v20M4 7l16 10M20 7L4 17M6 4l1 3-3 1M18 4l-1 3 3 1M6 20l1-3-3-1M18 20l-1-3 3-1"/>', ['winter','cold','snow'], [], ['decorative','kids'], 'retro', 'amarapix', true, false],
  ['Wind', 'weather', '<path d="M3 8h11a3 3 0 1 0-2.5-4.7M3 12h15a3 3 0 1 1-2.5 4.7M3 16h8"/>', ['breeze','air','weather'], [], ['classic'], '2000s', 'amarapix', false, false],

  // Nature & Animals
  ['Tree', 'nature', '<path d="M12 2l5 8h-3l4 6h-4v6h-4v-6H6l4-6H7z"/>', ['forest','plant','wood'], [], ['classic','decorative'], 'retro', 'amarapix', false, false],
  ['Leaf', 'nature', '<path d="M20 4C10 4 4 10 4 20c10 0 16-6 16-16z"/><path d="M9 15c3-3 5-5 8-8"/>', ['eco','plant','green'], [], ['decorative'], '2020s', 'amarapix', false, false],
  ['Flower', 'nature', '<circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="5" r="2.5"/><circle cx="12" cy="19" r="2.5"/><circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="12" r="2.5"/>', ['bloom','garden','spring'], [], ['decorative','kids'], '2000s', 'community', false, false],
  ['Mountain', 'nature', '<path d="M3 20l6-11 4 6 2-3 6 8z"/>', ['hiking','peak','landscape'], [], ['classic'], '2010s', 'amarapix', false, false],
  ['Wave', 'nature', '<path d="M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4 2 6 0"/><path d="M2 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0 4 2 6 0"/>', ['ocean','sea','water'], [], ['decorative'], 'new', 'amarapix', true, false],
  ['Paw', 'nature', '<circle cx="7" cy="8" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="8" r="2"/><path d="M12 12c-3 0-6 2-6 5a3 3 0 0 0 6 1 3 3 0 0 0 6-1c0-3-3-5-6-5z"/>', ['pet','animal','dog'], [], ['decorative','kids'], '2020s', 'community', false, true],

  // Food & Drink
  ['Coffee', 'food', '<path d="M4 8h14v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M18 9h1a2.5 2.5 0 0 1 0 5h-1"/><path d="M8 2v2M12 2v2M16 2v2"/>', ['drink','cafe','espresso'], [], ['professional','decorative'], '2010s', 'amarapix', false, false],
  ['Pizza', 'food', '<path d="M12 2L2 20h20z"/><circle cx="9" cy="14" r="1"/><circle cx="14" cy="16" r="1"/><circle cx="12" cy="10" r="1"/>', ['food','slice','italian'], [], ['decorative','kids'], '2000s', 'amarapix', false, false],
  ['Burger', 'food', '<path d="M4 10a8 4 0 0 1 16 0z"/><path d="M3 13h18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M4 17h16"/>', ['food','fastfood','snack'], [], ['decorative','kids'], '2000s', 'community', false, false],
  ['Apple', 'food', '<path d="M12 6c1-2 3-3 5-2-1 2-1 4 0 5-1 3-3 6-5 6s-4-3-5-6c-1-1-1-3 0-5 2-1 4 0 5 2z"/>', ['fruit','healthy','snack'], [], ['classic','kids'], 'retro', 'amarapix', false, false],
  ['Cake', 'food', '<path d="M4 21v-8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8z"/><path d="M2 21h20"/><path d="M8 11V8M12 11V8M16 11V8"/><path d="M8 5V3M12 5V2M16 5V3"/>', ['birthday','dessert','party'], [], ['decorative','kids'], 'new', 'amarapix', true, true],
  ['Fish', 'food', '<path d="M2 12s4-6 12-6 8 6 8 6-4 6-8 6-12-6-12-6z"/><circle cx="17" cy="11" r="1"/><path d="M2 12l4 4M2 12l4-4"/>', ['seafood','animal','ocean'], [], ['classic'], '2010s', 'community', false, false],

  // Transport
  ['Car', 'transport', '<path d="M3 13l1.5-5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.4L21 13"/><path d="M3 13h18v4a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><circle cx="7" cy="17" r="1.5"/><circle cx="17" cy="17" r="1.5"/>', ['vehicle','drive','travel'], [], ['professional','classic'], '2010s', 'amarapix', false, false],
  ['Bus', 'transport', '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M3 12h18"/><circle cx="7.5" cy="19" r="1.3"/><circle cx="16.5" cy="19" r="1.3"/>', ['public transport','vehicle'], [], ['classic'], '2000s', 'amarapix', false, false],
  ['Bike', 'transport', '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-9h4l3 5"/><path d="M10 8h4"/>', ['bicycle','cycle','sport'], [], ['classic','decorative'], '2010s', 'community', false, false],
  ['Plane', 'transport', '<path d="M12 2c-.6 0-1 .4-1 1v6L3 13v2l8-2.5V19l-2.5 1.5V22l3.5-1 3.5 1v-1.5L13 19v-6.5l8 2.5v-2l-8-4V3c0-.6-.4-1-1-1z"/>', ['flight','airplane','travel'], [], ['professional','classic'], '2000s', 'amarapix', false, false],
  ['Train', 'transport', '<rect x="5" y="3" width="14" height="14" rx="3"/><circle cx="9" cy="14" r="1.2"/><circle cx="15" cy="14" r="1.2"/><path d="M5 21l3-4M19 21l-3-4M8 3v4M16 3v4"/>', ['railway','metro','vehicle'], [], ['classic'], '2010s', 'amarapix', false, false],
  ['Anchor', 'transport', '<circle cx="12" cy="5" r="2"/><path d="M12 7v13"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><path d="M8 9l4-2 4 2"/>', ['boat','ship','nautical'], [], ['classic','decorative'], 'retro', 'community', false, true],

  // Technology
  ['Laptop', 'technology', '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M1 20h22"/>', ['computer','device','work'], ['windows','macos'], ['professional'], '2020s', 'amarapix', false, false],
  ['Smartphone', 'technology', '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>', ['mobile','device','app'], ['ios','android'], ['professional'], '2020s', 'amarapix', false, false],
  ['Bluetooth', 'technology', '<path d="M12 2v20M12 2l6 4.5-6 4.5M12 11l6 4.5-6 4.5"/>', ['wireless','pairing','connect'], ['ios','android','windows','macos'], ['professional'], '2010s', 'amarapix', true, false],
  ['Printer', 'technology', '<rect x="5" y="8" width="14" height="8" rx="1"/><path d="M7 8V4h10v4"/><path d="M7 16v4h10v-4"/>', ['office','print','scan'], ['windows'], ['professional'], '2000s', 'amarapix', false, false],
  ['Database', 'technology', '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>', ['server','storage','backend'], [], ['professional'], '2020s', 'community', false, true],
  ['Battery', 'technology', '<rect x="2" y="8" width="18" height="8" rx="2"/><path d="M22 10v4"/><path d="M5 11h6v2H5z"/>', ['power','charge','energy'], ['ios','android'], ['professional'], 'new', 'amarapix', true, false],

  // Health & Fitness
  ['Heart', 'health', '<path d="M12 20.5l-1.4-1.3C5.1 14.8 2 12 2 8.5 2 5.9 4 4 6.5 4c1.5 0 2.9.7 3.8 1.8L12 7.6l1.7-1.8C14.6 4.7 16 4 17.5 4 20 4 22 5.9 22 8.5c0 3.5-3.1 6.3-8.6 10.7L12 20.5z"/>', ['love','favorite','health'], ['ios','android'], ['decorative','classic'], '2000s', 'amarapix', true, false],
  ['Heart Pulse', 'health', '<path d="M12 20.5l-1.4-1.3C5.1 14.8 2 12 2 8.5 2 5.9 4 4 6.5 4c1.5 0 2.9.7 3.8 1.8L12 7.6l1.7-1.8C14.6 4.7 16 4 17.5 4 20 4 22 5.9 22 8.5c0 3.5-3.1 6.3-8.6 10.7L12 20.5z"/><path d="M4 12h4l2-4 3 8 2-4h5"/>', ['heartbeat','medical','cardio'], [], ['professional'], '2020s', 'amarapix', false, true],
  ['Pill', 'health', '<path d="M6.5 17.5a5 5 0 0 1 0-7l7-7a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7 0z"/><path d="M9 8l7 7"/>', ['medicine','drug','capsule'], [], ['professional'], '2010s', 'community', false, false],
  ['Tooth', 'health', '<path d="M12 2c-2 0-3 1-4 1s-2-1-3-1c-2 0-3 2-3 4 0 3 1 6 2 9 1 2 2 3 3 3s1-3 2-5 1-2 3-2 2 0 3 2 1 5 2 5 2-1 3-3c1-3 2-6 2-9 0-2-1-4-3-4-1 0-2 1-3 1s-2-1-4-1z"/>', ['dental','medical'], [], ['professional'], '2010s', 'amarapix', false, false],
  ['Dumbbell', 'health', '<rect x="9" y="10" width="6" height="4" rx="1"/><rect x="4" y="8" width="3" height="8" rx="1"/><rect x="17" y="8" width="3" height="8" rx="1"/><path d="M7 12h2M15 12h2"/>', ['gym','fitness','workout'], [], ['classic'], '2020s', 'amarapix', false, false],
  ['Trophy', 'health', '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 5H4a2 2 0 0 0 0 4h3M17 5h3a2 2 0 0 1 0 4h-3"/><path d="M9 20h6M12 14v6"/>', ['winner','award','achievement'], [], ['decorative','games'], 'new', 'amarapix', true, false],

  // Everyday & Security
  ['Bell', 'everyday', '<path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 6 2 7H4c.5-1 2-3 2-7z"/><path d="M9.5 18a2.5 2.5 0 0 0 5 0"/>', ['notification','alarm','alert'], ['ios','android'], ['professional'], '2010s', 'amarapix', true, false],
  ['Settings Gear', 'everyday', '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.7 15a1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.7a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>', ['config','preferences','options'], [], ['professional'], '2000s', 'amarapix', false, false],
  ['Camera', 'everyday', '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7l1.5-3h5L16 7"/><circle cx="12" cy="13.5" r="3.5"/>', ['photo','picture','lens'], ['ios','android'], ['professional','classic'], '2000s', 'amarapix', false, false],
  ['Shopping Bag', 'everyday', '<path d="M6 8h12l1 12H5z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>', ['shopping','store','purchase'], [], ['professional','decorative'], '2010s', 'amarapix', false, false],
  ['Lock', 'everyday', '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', ['security','private','password'], [], ['professional'], '2020s', 'amarapix', false, false],
  ['Shield', 'everyday', '<path d="M12 2l8 3v6c0 5-4 8.5-8 11-4-2.5-8-6-8-11V5z"/>', ['protection','safety','security'], [], ['professional'], '2020s', 'community', false, true],

  // Play & Learning
  ['Football', 'play', '<circle cx="12" cy="12" r="9"/><path d="M12 8l3 2-1 4h-4l-1-4z"/><path d="M12 3v5M4.2 8l3 1M19.8 8l-3 1M7 20l1.5-4M17 20l-1.5-4"/>', ['sport','soccer','ball'], [], ['games','decorative'], '2000s', 'amarapix', false, false],
  ['Basketball', 'play', '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.5 5.5c3 3 3 10.5 0 13M18.5 5.5c-3 3-3 10.5 0 13"/>', ['sport','ball','game'], [], ['games','decorative'], '2000s', 'amarapix', false, false],
  ['Gamepad', 'play', '<rect x="2" y="8" width="20" height="10" rx="4"/><path d="M7 11v4M5 13h4"/><circle cx="16" cy="11.5" r="1"/><circle cx="18.5" cy="14" r="1"/>', ['console','gaming','controller'], ['windows'], ['games'], 'new', 'amarapix', true, false],
  ['Music Note', 'play', '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 18V4l12-2v14"/>', ['song','audio','sound'], [], ['decorative'], '2010s', 'amarapix', false, false],
  ['Book', 'play', '<path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 1-2-2z"/><path d="M20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 0 2-2z"/>', ['reading','education','library'], [], ['professional','classic'], '2000s', 'amarapix', false, false],
  ['Graduation Cap', 'play', '<path d="M12 3L2 8l10 5 10-5z"/><path d="M6 10.5v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>', ['education','school','academy'], [], ['professional','classic'], '2010s', 'community', false, false],
];

const DAY = 24 * 60 * 60 * 1000;
const TODAY = new Date('2026-07-11T09:00:00Z').getTime();

function seededOffset(i: number): number {
  // Deterministic spread across "today / yesterday / this week / this month / earlier"
  const bucket = i % 10;
  if (bucket === 0) return 0;
  if (bucket === 1) return 1;
  if (bucket <= 3) return 2 + (i % 4);
  if (bucket <= 6) return 8 + (i % 6);
  return 20 + (i % 30);
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const ICON_LIBRARY: IconAsset[] = ROWS.map((row, i) => {
  const [name, category, path, tags, platforms, aesthetic, trend, author, animated, premium] = row;
  const createdAt = new Date(TODAY - seededOffset(i) * DAY).toISOString();
  return {
    id: `icon-${i + 1}`,
    name,
    slug: slugify(name),
    category,
    tags,
    platforms,
    aesthetic,
    trend,
    author,
    hasAnimatedVariant: animated,
    isPremium: premium,
    downloads: 300 + ((i * 137) % 48000),
    createdAt,
    path,
  };
});

export const DEFAULT_ICON_STYLE: IconStyleState = {
  technique: 'line',
  colorMode: 'mono',
  corners: 'round',
  strokeWidth: 2,
  animatedOn: false,
  recolorHue: '#f5820a',
  density: 'medium',
};

export const DEFAULT_ICON_FILTERS: IconFilterState = {
  query: '',
  platforms: [],
  aesthetic: [],
  trend: [],
  author: [],
  categoryId: null,
  favoritesOnly: false,
};

@Injectable({ providedIn: 'root' })
export class IconsService {
  readonly categories = ICON_CATEGORIES;

  readonly style = signal<IconStyleState>({ ...DEFAULT_ICON_STYLE });
  readonly filters = signal<IconFilterState>({ ...DEFAULT_ICON_FILTERS });
  readonly favorites = signal<Set<string>>(this.loadFavorites());

  readonly filteredIcons = computed(() => {
    const f = this.filters();
    const favs = this.favorites();
    const q = f.query.trim().toLowerCase();

    return ICON_LIBRARY.filter((icon) => {
      if (f.favoritesOnly && !favs.has(icon.id)) return false;
      if (f.categoryId && icon.category !== f.categoryId) return false;
      if (this.style().animatedOn && !icon.hasAnimatedVariant) return false;
      if (f.platforms.length && !f.platforms.some(p => icon.platforms.includes(p))) return false;
      if (f.aesthetic.length && !f.aesthetic.some(a => icon.aesthetic.includes(a))) return false;
      if (f.trend.length && !f.trend.includes(icon.trend)) return false;
      if (f.author.length && !f.author.includes(icon.author)) return false;
      if (q) {
        const haystack = `${icon.name} ${icon.tags.join(' ')} ${icon.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  updateStyle(patch: Partial<IconStyleState>): void {
    this.style.update(s => ({ ...s, ...patch }));
  }

  resetStyle(): void {
    this.style.set({ ...DEFAULT_ICON_STYLE });
  }

  updateFilters(patch: Partial<IconFilterState>): void {
    this.filters.update(f => ({ ...f, ...patch }));
  }

  clearFilters(): void {
    this.filters.set({ ...DEFAULT_ICON_FILTERS });
  }

  toggleArrayFilter<K extends 'platforms' | 'aesthetic' | 'trend' | 'author'>(key: K, value: IconFilterState[K][number]): void {
    this.filters.update((f) => {
      const list = f[key] as any[];
      const next = list.includes(value) ? list.filter(v => v !== value) : [...list, value];
      return { ...f, [key]: next };
    });
  }

  toggleFavorite(id: string): void {
    const next = new Set(this.favorites());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.favorites.set(next);
    this.saveFavorites(next);
  }

  isFavorite(id: string): boolean {
    return this.favorites().has(id);
  }

  private loadFavorites(): Set<string> {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  private saveFavorites(set: Set<string>): void {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
    } catch { /* ignore quota errors */ }
  }
}
