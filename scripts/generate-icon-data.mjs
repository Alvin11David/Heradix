#!/usr/bin/env node
/**
 * Icon data generation script.
 * Reads SVG files / JSON from each installed icon library and writes
 * static JSON files to src/assets/icons/ for fast fetch()-based loading.
 *
 * Run: node scripts/generate-icon-data.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'src/assets/icons');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const TODAY_MS = new Date('2026-07-11T09:00:00Z').getTime();
const DAY = 86400000;

// ─── helpers ──────────────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Extract the inner markup from an SVG string (strips outer <svg> wrapper). */
function innerSvg(svgStr) {
  return svgStr
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg\s*>/i, '')
    .replace(/\s*stroke="none"\s+d="M0 0h24v24H0z"\s+fill="none"\s*/g, '')
    .replace(/\s*d="M0 0h24v24H0z"\s+fill="none"\s+stroke="none"\s*/g, '')
    .trim();
}

/** Read viewBox from an SVG string. Returns null if 0 0 24 24 (the default). */
function parseViewBox(svgStr) {
  const m = svgStr.match(/viewBox=["']([^"']+)["']/i);
  if (!m) return null;
  const vb = m[1].trim();
  return vb === '0 0 24 24' ? null : vb;
}

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
  return 'everyday';
}

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

/** Build a plain icon object — paths stored raw (no TS escaping needed for JSON). */
function makeIcon(id, name, path, library, viewBox = null, extra = {}) {
  const cat = extra.category ?? inferCategory(name);
  const obj = {
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
    path,   // raw — JSON.stringify handles all escaping
    library,
  };
  if (viewBox) obj.viewBox = viewBox;
  return obj;
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

// ─── write JSON asset file ─────────────────────────────────────────────────────

function writeJsonFile(library, displayName, icons) {
  const outPath = join(OUT_DIR, `${library}.json`);
  writeFileSync(outPath, JSON.stringify(icons), 'utf8');
  const kb = Math.round(icons.reduce((n, ic) => n + ic.path.length, 0) / 1024);
  console.log(`✓ ${displayName}: ${icons.length} icons → ${outPath} (~${kb} KB path data)`);
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
    const parts = [];
    for (const [tag, attrs] of nodes) {
      const attrsStr = Object.entries(attrs)
        .filter(([k, v]) => k !== 'stroke' || v !== 'none')
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
  writeJsonFile('tabler', 'Tabler Icons', icons);
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
  writeJsonFile('lucide', 'Lucide', icons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOTSTRAP ICONS
// ═══════════════════════════════════════════════════════════════════════════════
function generateBootstrap() {
  console.log('Processing Bootstrap Icons…');
  const dir = join(ROOT, 'node_modules/bootstrap-icons/icons');
  if (!existsSync(dir)) { console.warn('  ✗ bootstrap-icons not found'); return; }
  const files = readdirSync(dir).filter(f => f.endsWith('.svg')).sort();
  const icons = svgFilesToIcons(files, dir, 'bootstrap', {
    nameTransform: s => titleCase(s.replace(/-/g, ' ')),
    forceViewBox: '0 0 16 16',
  });
  writeJsonFile('bootstrap', 'Bootstrap Icons', icons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEROICONS
// ═══════════════════════════════════════════════════════════════════════════════
function generateHeroicons() {
  console.log('Processing Heroicons…');
  const dir = join(ROOT, 'node_modules/heroicons/24/outline');
  if (!existsSync(dir)) { console.warn('  ✗ heroicons not found'); return; }
  const files = readdirSync(dir).filter(f => f.endsWith('.svg')).sort();
  const icons = svgFilesToIcons(files, dir, 'heroicons', {
    nameTransform: s => titleCase(s.replace(/-/g, ' ')),
  });
  writeJsonFile('heroicons', 'Heroicons', icons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHOSPHOR ICONS
// ═══════════════════════════════════════════════════════════════════════════════
function generatePhosphor() {
  console.log('Processing Phosphor Icons…');
  const dir = join(ROOT, 'node_modules/@phosphor-icons/core/assets/regular');
  if (!existsSync(dir)) { console.warn('  ✗ @phosphor-icons/core not found'); return; }
  const files = readdirSync(dir).filter(f => f.endsWith('.svg')).sort();
  const icons = svgFilesToIcons(files, dir, 'phosphor', {
    nameTransform: s => titleCase(s.replace(/-/g, ' ')),
    forceViewBox: '0 0 256 256',
  });
  writeJsonFile('phosphor', 'Phosphor Icons', icons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// REMIX ICON
// ═══════════════════════════════════════════════════════════════════════════════
function generateRemix() {
  console.log('Processing Remix Icon…');
  const baseDir = join(ROOT, 'node_modules/remixicon/icons');
  if (!existsSync(baseDir)) { console.warn('  ✗ remixicon not found'); return; }

  const icons = [];
  let i = 0;
  for (const cat of readdirSync(baseDir)) {
    const catDir = join(baseDir, cat);
    let files;
    try { files = readdirSync(catDir).filter(f => f.endsWith('-line.svg')); } catch { continue; }
    for (const file of files) {
      try {
        const raw = readFileSync(join(catDir, file), 'utf8');
        const inner = innerSvg(raw);
        if (!inner) { i++; continue; }
        const name = titleCase(basename(file, '-line.svg').replace(/-/g, ' '));
        icons.push(makeIcon(i, name, inner, 'remixicon', null, { category: inferCategory(name) }));
        i++;
      } catch { i++; }
    }
  }
  writeJsonFile('remixicon', 'Remix Icon', icons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// IONICONS
// ═══════════════════════════════════════════════════════════════════════════════
function generateIonicons() {
  console.log('Processing Ionicons…');
  const dir = join(ROOT, 'node_modules/ionicons/dist/svg');
  if (!existsSync(dir)) { console.warn('  ✗ ionicons not found'); return; }
  const files = readdirSync(dir).filter(f => f.endsWith('-outline.svg'));
  const icons = svgFilesToIcons(files, dir, 'ionicons', {
    nameTransform: s => titleCase(s.replace(/-outline$/, '').replace(/-/g, ' ')),
  });
  writeJsonFile('ionicons', 'Ionicons', icons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATERIAL DESIGN ICONS
// ═══════════════════════════════════════════════════════════════════════════════
function generateMdi() {
  console.log('Processing Material Design Icons…');
  const mdiPath = join(ROOT, 'node_modules/@mdi/js/mdi.js');
  if (!existsSync(mdiPath)) { console.warn('  ✗ @mdi/js not found'); return; }

  const raw = readFileSync(mdiPath, 'utf8');
  const re = /export var (mdi[A-Za-z0-9]+) = "([^"]+)";/g;
  const icons = [];
  let match, i = 0;

  while ((match = re.exec(raw)) !== null) {
    const name = camelToWords(match[1].replace(/^mdi/, '')).trim();
    const inner = `<path d="${match[2]}"/>`;
    icons.push(makeIcon(i, name, inner, 'mdi'));
    i++;
  }
  writeJsonFile('mdi', 'Material Design Icons', icons);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log('🔧 Generating icon JSON assets → src/assets/icons/\n');
generateTabler();
generateLucide();
generateBootstrap();
generateHeroicons();
generatePhosphor();
generateRemix();
generateIonicons();
generateMdi();
console.log('\n✅ Done!\n');
