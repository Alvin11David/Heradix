#!/usr/bin/env node
/**
 * Icon data generation script.
 * Reads SVG files / JSON from each installed icon library and produces
 * TypeScript data files in src/app/features/icons/data/.
 *
 * Run: node scripts/generate-icon-data.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'src/app/features/icons/data');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const TODAY_MS = new Date('2026-07-11T09:00:00Z').getTime();
const DAY = 86400000;

let globalId = 10000; // start above the existing amarapix icons

// ─── helpers ──────────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Extract the inner markup from an SVG string (strips outer <svg> wrapper). */
function innerSvg(svgStr) {
  return svgStr
    .replace(/<!--[\s\S]*?-->/g, '')           // strip comments
    .replace(/<\?xml[^?]*\?>/g, '')            // strip xml decl
    .replace(/<svg[^>]*>/i, '')                // strip opening <svg>
    .replace(/<\/svg\s*>/i, '')                // strip closing </svg>
    .replace(/\s*stroke="none"\s+d="M0 0h24v24H0z"\s+fill="none"\s*/g, '') // tabler clip
    .replace(/\s*d="M0 0h24v24H0z"\s+fill="none"\s+stroke="none"\s*/g, '') // tabler clip alt
    .trim();
}

/** Read viewBox from an SVG string. Returns null if 0 0 24 24 (the default). */
function parseViewBox(svgStr) {
  const m = svgStr.match(/viewBox=["']([^"']+)["']/i);
  if (!m) return null;
  const vb = m[1].trim();
  return vb === '0 0 24 24' ? null : vb;
}

/** Infer category from icon name. Returns one of our CATEGORIES. */
const CAT_RULES = [
  [/android|apple|windows|macos|linux|chrome|firefox|safari|browser|brand|logo|social|facebook|twitter|instagram|youtube|spotify|github|linkedin|discord|slack|tiktok|google|whatsapp|snapchat|pinterest|reddit|twitch|telegram|wechat|signal|paypal|stripe|shopify|docker|figma|adobe|microsoft|amazon|netflix|uber|airbnb|zoom|wordpress|javascript|typescript|react|angular|vue|swift|kotlin|flutter|rust|golang|python|java|php|node|git/i, 'brands'],
  [/mail|email|message|chat|phone|call|inbox|send|notification|bell|alert|rss|reply|forward|attachment|paper.?plane|envelope|comment|speech|bubble|walkie|radio|broadcast|wi.?fi|signal|satellite|antenna|bluetooth/i, 'communication'],
  [/sun|moon|cloud|rain|snow|wind|storm|thunder|weather|fog|rainbow|temperature|thermometer|umbrella|hurricane|tornado|lightning/i, 'weather'],
  [/tree|leaf|flower|plant|nature|animal|pet|dog|cat|bird|fish|butterfly|wave|mountain|hill|forest|grass|earth|globe|world|ocean|river|lake|paw|bear|lion|horse|rabbit|snake|insect|bug|mushroom|cactus|palm|pine/i, 'nature'],
  [/food|drink|coffee|tea|water|beer|wine|pizza|burger|sandwich|cake|bread|fruit|vegetable|apple|banana|cherry|grape|meat|chicken|sushi|ramen|bowl|fork|spoon|knife|plate|cup|glass|bottle/i, 'food'],
  [/car|bus|train|plane|bike|ship|boat|helicopter|truck|taxi|ambulance|police|fire.truck|rocket|shuttle|vehicle|transport|travel|map|route|road|highway|traffic|signal|fuel|wheel/i, 'transport'],
  [/laptop|computer|phone|tablet|device|server|database|chip|cpu|gpu|memory|storage|printer|scanner|camera|keyboard|mouse|monitor|display|headphone|speaker|microphone|battery|charge|power|tech|hardware|software|code|terminal|console|browser|app/i, 'technology'],
  [/heart|pulse|health|medical|hospital|doctor|medicine|pill|drug|syringe|ambulance|fitness|gym|sport|exercise|dumbbell|trophy|medal|muscle|yoga|diet|nutrition|mental|brain/i, 'health'],
  [/shield|lock|unlock|key|password|secure|protect|privacy|eye|spy|camera|security|alarm|fire|danger|warning|error|cross|check|virus|malware/i, 'everyday'],
  [/game|play|music|note|film|movie|video|book|education|school|learn|pencil|pen|brush|art|palette|creative|design|photo|gallery|headphone|guitar|piano|drum|mic|record|star|rocket|ball|sport|dance|theater|puppet|magic|puzzle|dice|chess|card|shuffle/i, 'play'],
  [/office|work|job|business|calendar|clock|time|briefcase|chart|graph|analytics|calculator|money|finance|bank|credit|card|wallet|invoice|receipt|contract|deal|meeting|conference|presentation|report|file|folder|archive|print/i, 'business'],
];

function inferCategory(name) {
  const n = name.toLowerCase();
  for (const [re, cat] of CAT_RULES) {
    if (re.test(n)) return cat;
  }
  return 'everyday'; // fallback
}

/** Generate tags from icon name */
function makeTags(name) {
  return name.toLowerCase()
    .split(/[\s\-_]+/)
    .filter(w => w.length > 1 && !['icon','outline','filled','line','solid','bold'].includes(w));
}

function seededDownloads(i) { return 100 + ((i * 97 + 13) % 25000); }
function seededDate(i) {
  const days = [0,1,2,3,5,8,15,25,40,60][i % 10];
  return new Date(TODAY_MS - days * DAY).toISOString();
}

function makeIcon(id, name, path, library, viewBox = null, extra = {}) {
  const cat = extra.category ?? inferCategory(name);
  return {
    id: `${library}-${id}`,
    name,
    slug: slugify(name),
    category: cat,
    tags: makeTags(name),
    platforms: [],
    aesthetic: ['professional'],
    trend: '2020s',
    hasAnimatedVariant: false,
    isPremium: false,
    downloads: seededDownloads(id),
    createdAt: seededDate(id),
    path: path.replace(/"/g, '\\"').replace(/`/g, '\\`'),
    ...(viewBox ? { viewBox } : {}),
    library,
  };
}

function svgFilesToIcons(files, dir, library, opts = {}) {
  const icons = [];
  let i = 0;
  for (const file of files) {
    try {
      const raw = readFileSync(join(dir, file), 'utf8');
      const inner = innerSvg(raw);
      if (!inner) { i++; continue; }
      const viewBox = opts.forceViewBox ?? parseViewBox(raw);
      const namePart = opts.nameTransform
        ? opts.nameTransform(basename(file, '.svg'))
        : basename(file, '.svg').replace(/-/g, ' ').replace(/_/g, ' ');
      icons.push(makeIcon(i, namePart, inner, library, viewBox, opts.extra ?? {}));
      i++;
    } catch { i++; }
  }
  return icons;
}

function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function camelToWords(str) {
  return str.replace(/([A-Z])/g, ' $1').trim();
}

// ─── write output file ─────────────────────────────────────────────────────────

function writeDataFile(library, displayName, icons, totalHint) {
  const path = join(OUT_DIR, `${library}.ts`);
  const lines = [
    `// AUTO-GENERATED — do not edit manually. Run: node scripts/generate-icon-data.mjs`,
    `// Library: ${displayName} — ${icons.length} icons`,
    `import type { IconAsset } from '../../../core/models/icon.model';`,
    ``,
    `export const LIBRARY_INFO = {`,
    `  id: '${library}' as const,`,
    `  name: '${displayName}',`,
    `  count: ${totalHint ?? icons.length},`,
    `  license: '${getLicense(library)}',`,
    `};`,
    ``,
    `export const ICONS: IconAsset[] = [`,
  ];

  for (const icon of icons) {
    const parts = [
      `  {`,
      `    id: ${JSON.stringify(icon.id)},`,
      `    name: ${JSON.stringify(icon.name)},`,
      `    slug: ${JSON.stringify(icon.slug)},`,
      `    category: ${JSON.stringify(icon.category)},`,
      `    tags: ${JSON.stringify(icon.tags)},`,
      `    platforms: [],`,
      `    aesthetic: ['professional'],`,
      `    trend: '2020s',`,
      `    hasAnimatedVariant: false,`,
      `    isPremium: false,`,
      `    downloads: ${icon.downloads},`,
      `    createdAt: ${JSON.stringify(icon.createdAt)},`,
      `    path: \`${icon.path}\`,`,
    ];
    if (icon.viewBox) parts.push(`    viewBox: ${JSON.stringify(icon.viewBox)},`);
    parts.push(`    library: '${library}',`);
    parts.push(`  },`);
    lines.push(...parts);
  }

  lines.push(`];`);
  writeFileSync(path, lines.join('\n'), 'utf8');
  console.log(`✓ ${displayName}: ${icons.length} icons → ${path}`);
}

function getLicense(lib) {
  return { tabler: 'MIT', lucide: 'ISC', phosphor: 'MIT', heroicons: 'MIT', remixicon: 'Apache 2.0', bootstrap: 'MIT', mdi: 'Apache 2.0', ionicons: 'MIT', amarapix: 'proprietary' }[lib] ?? 'Unknown';
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLER ICONS
// ═══════════════════════════════════════════════════════════════════════════════
function generateTabler() {
  console.log('Processing Tabler Icons…');
  const jsonPath = join(ROOT, 'node_modules/@tabler/icons/tabler-nodes-outline.json');
  if (!existsSync(jsonPath)) { console.warn('  ✗ tabler-nodes-outline.json not found'); return; }

  const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const icons = [];
  let i = 0;

  for (const [iconName, nodes] of Object.entries(data)) {
    // Build SVG inner content from node array: [[tag, attrs], ...]
    const parts = [];
    for (const [tag, attrs] of nodes) {
      const attrsStr = Object.entries(attrs)
        .filter(([k, v]) => k !== 'stroke' || v !== 'none') // skip stroke="none" on clip paths
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      parts.push(`<${tag} ${attrsStr}/>`);
    }
    const inner = parts.join('');
    if (!inner) { i++; continue; }

    const name = titleCase(iconName.replace(/-/g, ' '));
    icons.push(makeIcon(i, name, inner, 'tabler'));
    i++;
  }

  writeDataFile('tabler', 'Tabler Icons', icons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LUCIDE ICONS
// ═══════════════════════════════════════════════════════════════════════════════
function generateLucide() {
  console.log('Processing Lucide Icons…');
  const dir = join(ROOT, 'node_modules/lucide-static/icons');
  if (!existsSync(dir)) { console.warn('  ✗ lucide-static not found'); return; }

  const files = readdirSync(dir).filter(f => f.endsWith('.svg')).sort();
  const icons = svgFilesToIcons(files, dir, 'lucide', {
    nameTransform: s => titleCase(s.replace(/-/g, ' ')),
  });
  writeDataFile('lucide', 'Lucide', icons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOTSTRAP ICONS
// ═══════════════════════════════════════════════════════════════════════════════
function generateBootstrap() {
  console.log('Processing Bootstrap Icons…');
  const dir = join(ROOT, 'node_modules/bootstrap-icons/icons');
  if (!existsSync(dir)) { console.warn('  ✗ bootstrap-icons not found'); return; }

  const files = readdirSync(dir).filter(f => f.endsWith('.svg')).sort();
  // Bootstrap icons use a 16x16 viewBox — store it so the render uses the correct viewBox
  const icons = svgFilesToIcons(files, dir, 'bootstrap', {
    nameTransform: s => titleCase(s.replace(/-/g, ' ')),
    forceViewBox: '0 0 16 16',
  });
  writeDataFile('bootstrap', 'Bootstrap Icons', icons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEROICONS (outline variants only)
// ═══════════════════════════════════════════════════════════════════════════════
function generateHeroicons() {
  console.log('Processing Heroicons…');
  const dir = join(ROOT, 'node_modules/heroicons/24/outline');
  if (!existsSync(dir)) { console.warn('  ✗ heroicons not found'); return; }

  const files = readdirSync(dir).filter(f => f.endsWith('.svg')).sort();
  const icons = svgFilesToIcons(files, dir, 'heroicons', {
    nameTransform: s => titleCase(s.replace(/-/g, ' ')),
  });
  writeDataFile('heroicons', 'Heroicons', icons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHOSPHOR ICONS (regular weight only)
// ═══════════════════════════════════════════════════════════════════════════════
function generatePhosphor() {
  console.log('Processing Phosphor Icons…');
  const dir = join(ROOT, 'node_modules/@phosphor-icons/core/assets/regular');
  if (!existsSync(dir)) { console.warn('  ✗ @phosphor-icons/core not found'); return; }

  const files = readdirSync(dir).filter(f => f.endsWith('.svg')).sort();
  // Phosphor uses 256x256 viewBox
  const icons = svgFilesToIcons(files, dir, 'phosphor', {
    nameTransform: s => titleCase(s.replace(/-/g, ' ')),
    forceViewBox: '0 0 256 256',
  });
  writeDataFile('phosphor', 'Phosphor Icons', icons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// REMIX ICON (line variants only, to avoid duplicates)
// ═══════════════════════════════════════════════════════════════════════════════
function generateRemix() {
  console.log('Processing Remix Icon…');
  const baseDir = join(ROOT, 'node_modules/remixicon/icons');
  if (!existsSync(baseDir)) { console.warn('  ✗ remixicon not found'); return; }

  const icons = [];
  let i = 0;
  const categories = readdirSync(baseDir);

  for (const cat of categories) {
    const catDir = join(baseDir, cat);
    let files;
    try { files = readdirSync(catDir).filter(f => f.endsWith('-line.svg')); } catch { continue; }

    for (const file of files) {
      try {
        const raw = readFileSync(join(catDir, file), 'utf8');
        const inner = innerSvg(raw);
        if (!inner) { i++; continue; }
        const baseName = basename(file, '-line.svg');
        const name = titleCase(baseName.replace(/-/g, ' '));
        icons.push(makeIcon(i, name, inner, 'remixicon', null, { category: inferCategory(name) }));
        i++;
      } catch { i++; }
    }
  }

  writeDataFile('remixicon', 'Remix Icon', icons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// IONICONS (default/filled variants — skip outline and sharp to avoid duplicates)
// ═══════════════════════════════════════════════════════════════════════════════
function generateIonicons() {
  console.log('Processing Ionicons…');
  const dir = join(ROOT, 'node_modules/ionicons/dist/svg');
  if (!existsSync(dir)) { console.warn('  ✗ ionicons/dist/svg not found'); return; }

  // Only take the outline variants (suffix: -outline.svg)
  const allFiles = readdirSync(dir).filter(f => f.endsWith('.svg'));
  const files = allFiles.filter(f => f.endsWith('-outline.svg'));

  const icons = svgFilesToIcons(files, dir, 'ionicons', {
    nameTransform: s => titleCase(s.replace(/-outline$/, '').replace(/-/g, ' ')),
  });
  writeDataFile('ionicons', 'Ionicons', icons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATERIAL DESIGN ICONS via @mdi/js (path string exports)
// ═══════════════════════════════════════════════════════════════════════════════
function generateMdi() {
  console.log('Processing Material Design Icons…');
  const mdiPath = join(ROOT, 'node_modules/@mdi/js/mdi.js');
  if (!existsSync(mdiPath)) { console.warn('  ✗ @mdi/js not found'); return; }

  const raw = readFileSync(mdiPath, 'utf8');
  // Each line: export var mdiSomeName = "path_data";
  const re = /export var (mdi[A-Za-z0-9]+) = "([^"]+)";/g;
  const icons = [];
  let match;
  let i = 0;

  while ((match = re.exec(raw)) !== null) {
    const varName = match[1]; // e.g. mdiAccount
    const pathData = match[2];
    // Convert camelCase varname to words: mdiAccountAlert -> Account Alert
    const name = camelToWords(varName.replace(/^mdi/, ''));
    const inner = `<path d="${pathData}"/>`;
    // MDI uses 24x24 viewBox internally but the path data is scaled for it
    icons.push(makeIcon(i, name.trim(), inner, 'mdi'));
    i++;
  }

  writeDataFile('mdi', 'Material Design Icons', icons);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log('🔧 Generating icon library data files…\n');

generateTabler();
generateLucide();
generateBootstrap();
generateHeroicons();
generatePhosphor();
generateRemix();
generateIonicons();
generateMdi();

// Write a barrel/index file listing all libraries
const indexContent = `// AUTO-GENERATED — do not edit manually.
export type IconLibraryId = 'amarapix' | 'tabler' | 'lucide' | 'bootstrap' | 'heroicons' | 'phosphor' | 'remixicon' | 'ionicons' | 'mdi';

export interface LibraryMeta {
  id: IconLibraryId;
  name: string;
  count: number;
  license: string;
  loaded?: boolean;
}

export const ICON_LIBRARIES: LibraryMeta[] = [
  { id: 'amarapix',  name: 'Amarapix',                count: 60,    license: 'proprietary' },
  { id: 'tabler',    name: 'Tabler Icons',             count: 5090,  license: 'MIT' },
  { id: 'lucide',    name: 'Lucide',                   count: 1995,  license: 'ISC' },
  { id: 'mdi',       name: 'Material Design Icons',    count: 7400,  license: 'Apache 2.0' },
  { id: 'remixicon', name: 'Remix Icon',               count: 2800,  license: 'Apache 2.0' },
  { id: 'bootstrap', name: 'Bootstrap Icons',          count: 2000,  license: 'MIT' },
  { id: 'phosphor',  name: 'Phosphor Icons',           count: 1500,  license: 'MIT' },
  { id: 'heroicons', name: 'Heroicons',                count: 300,   license: 'MIT' },
  { id: 'ionicons',  name: 'Ionicons',                 count: 1300,  license: 'MIT' },
];
`;

writeFileSync(join(OUT_DIR, 'index.ts'), indexContent, 'utf8');
console.log('\n✓ index.ts written');
console.log('\n✅ Done! All icon data files generated.\n');
