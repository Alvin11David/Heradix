import type { IconLibraryId } from '../../../core/models/icon.model';

export type { IconLibraryId };

export interface LibraryMeta {
  id: IconLibraryId;
  name: string;
  count: number;
  license: string;
  kind?: 'web' | 'flutter';
  pubUrl?: string;
  comingSoon?: boolean;
}

export const ICON_LIBRARIES: LibraryMeta[] = [
  // ── Web / SVG libraries ──────────────────────────────────────────────────
  { id: 'amarapix',         name: 'Amarapix',             count: 60,    license: 'Proprietary',    kind: 'web' },
  { id: 'tabler',           name: 'Tabler Icons',         count: 5093,  license: 'MIT',            kind: 'web' },
  { id: 'lucide',           name: 'Lucide',               count: 1995,  license: 'ISC',            kind: 'web' },
  { id: 'mdi',              name: 'Material Design Icons',count: 7447,  license: 'Apache 2.0',     kind: 'web' },
  { id: 'material-symbols', name: 'Material Symbols',     count: 2500,  license: 'Apache 2.0',     kind: 'web', comingSoon: true },
  { id: 'heroicons',        name: 'Heroicons',            count: 324,   license: 'MIT',            kind: 'web' },
  { id: 'feather',          name: 'Feather Icons',        count: 287,   license: 'MIT',            kind: 'web', comingSoon: true },
  { id: 'fontawesome',      name: 'Font Awesome',         count: 2058,  license: 'CC BY 4.0 + MIT',kind: 'web', comingSoon: true },
  { id: 'remixicon',        name: 'Remix Icon',           count: 1539,  license: 'Apache 2.0',     kind: 'web' },
  { id: 'bootstrap',        name: 'Bootstrap Icons',      count: 2078,  license: 'MIT',            kind: 'web' },
  { id: 'phosphor',         name: 'Phosphor Icons',       count: 1512,  license: 'MIT',            kind: 'web' },
  { id: 'ionicons',         name: 'Ionicons',             count: 421,   license: 'MIT',            kind: 'web' },
  { id: 'react-icons',      name: 'React Icons',          count: 49000, license: 'MIT (varies)',   kind: 'web', comingSoon: true },

  // ── Flutter packages ─────────────────────────────────────────────────────
  { id: 'flutter-material',   name: 'Material Icons (built-in)', count: 1100, license: 'Apache 2.0', kind: 'flutter', pubUrl: 'https://api.flutter.dev/flutter/material/Icons-class.html' },
  { id: 'flutter-fontawesome',name: 'font_awesome_flutter',      count: 1600, license: 'MIT',        kind: 'flutter', pubUrl: 'https://pub.dev/packages/font_awesome_flutter' },
  { id: 'flutter-phosphor',   name: 'flutter_phosphor_icons',    count: 1512, license: 'MIT',        kind: 'flutter', pubUrl: 'https://pub.dev/packages/phosphor_flutter' },
  { id: 'flutter-heroicons',  name: 'heroicons (Flutter)',        count: 324,  license: 'MIT',        kind: 'flutter', pubUrl: 'https://pub.dev/packages/heroicons_flutter' },
  { id: 'flutter-tabler',     name: 'tabler_icons (Flutter)',     count: 5093, license: 'MIT',        kind: 'flutter', pubUrl: 'https://pub.dev/packages/tabler_icons' },
  { id: 'flutter-remixicon',  name: 'remixicon (Flutter)',        count: 1539, license: 'Apache 2.0', kind: 'flutter', pubUrl: 'https://pub.dev/packages/remixicon' },
  { id: 'flutter-boxicons',   name: 'boxicons (Flutter)',         count: 1630, license: 'MIT',        kind: 'flutter', pubUrl: 'https://pub.dev/packages/boxicons' },
];
