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
  { id: 'brands',            name: 'Brands & OS',         slug: 'brands-os' },
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
// [name, category, path, tags, platforms, aesthetic, trend, author, animated, premium, colorSvg?]
type Row = [
  string, string, string, string[], IconPlatform[], IconAesthetic[], IconTrend, IconAuthor, boolean, boolean, string?
];

const ANDROID_SVG = `
  <line x1="8.5" y1="3.5" x2="6" y2="1" stroke="#3DDC84" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="15.5" y1="3.5" x2="18" y2="1" stroke="#3DDC84" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M5 8.5C5 6.6 6.6 5 8.5 5h7C17.4 5 19 6.6 19 8.5V11H5V8.5z" fill="#3DDC84"/>
  <rect x="1.5" y="11" width="2.5" height="6" rx="1.25" fill="#3DDC84"/>
  <rect x="20" y="11" width="2.5" height="6" rx="1.25" fill="#3DDC84"/>
  <rect x="5" y="11" width="14" height="9" rx="0" fill="#3DDC84"/>
  <rect x="5" y="18" width="14" height="2" fill="#3DDC84"/>
  <rect x="7.5" y="19" width="3" height="4" rx="1.5" fill="#3DDC84"/>
  <rect x="13.5" y="19" width="3" height="4" rx="1.5" fill="#3DDC84"/>
  <circle cx="9" cy="8" r="1.1" fill="white"/>
  <circle cx="15" cy="8" r="1.1" fill="white"/>`;

const IOS_SVG = `
  <rect x="3" y="1" width="18" height="22" rx="5" fill="#000000"/>
  <path d="M12 6.5c.8-1 2-1.5 3-1.3-.1 1.1-.7 2.2-1.5 2.8-.8.6-1.9.9-2.8.7.1-1 .5-1.8 1.3-2.2z" fill="white"/>
  <path d="M15.5 8.5c-1.5 0-2.1.8-3.1.8-1.1 0-2-.8-3.4-.8-1.7 0-3.5 1.4-3.5 4.2 0 2.6 1.6 6.3 3.4 6.3.9 0 1.5-.6 2.7-.6 1.2 0 1.6.6 2.7.6 1.7 0 3.2-3.4 3.2-3.4s-1.7-.8-1.7-2.8c0-1.7 1.3-2.6 1.3-2.6s-.8-1.7-2.6-1.7z" fill="white"/>`;

const WINDOWS_SVG = `
  <rect x="2" y="3" width="9.5" height="9.5" rx="1" fill="#F35325"/>
  <rect x="12.5" y="3" width="9.5" height="9.5" rx="1" fill="#81BC06"/>
  <rect x="2" y="13.5" width="9.5" height="9.5" rx="1" fill="#05A6F0"/>
  <rect x="12.5" y="13.5" width="9.5" height="9.5" rx="1" fill="#FFBA08"/>`;

const MACOS_SVG = `
  <rect x="2" y="2" width="20" height="20" rx="5" fill="#000000"/>
  <circle cx="7" cy="9.5" r="2.5" fill="#FF5F57"/>
  <circle cx="12" cy="9.5" r="2.5" fill="#FFBD2E"/>
  <circle cx="17" cy="9.5" r="2.5" fill="#28C840"/>
  <rect x="5" y="14" width="14" height="1.5" rx=".75" fill="#555"/>
  <rect x="5" y="16.5" width="10" height="1.5" rx=".75" fill="#555"/>`;

const CHROME_SVG = `
  <circle cx="12" cy="12" r="4.5" fill="white" stroke="#4285F4" stroke-width="0"/>
  <path d="M12 7.5h9.2A10 10 0 0 0 3.8 5.7z" fill="#EA4335"/>
  <path d="M21.2 7.5H12l-4.6 8A10 10 0 0 0 21.2 7.5z" fill="#FBBC05"/>
  <path d="M7.4 15.5l4.6-8a10 10 0 0 0-9.2 7.8z" fill="#34A853"/>
  <circle cx="12" cy="12" r="4.5" fill="white"/>
  <circle cx="12" cy="12" r="2.8" fill="#4285F4"/>`;

const FIREFOX_SVG = `
  <circle cx="12" cy="12" r="9.5" fill="#FF9500"/>
  <path d="M12 2.5c5.2 0 9.5 4.3 9.5 9.5 0 2.6-1 5-2.7 6.8-1-2-2.5-3.3-4.3-3.3-2.2 0-3.8 1.5-4.5 3.5A9.5 9.5 0 0 1 12 2.5z" fill="#FF6000"/>
  <path d="M12 4c1.3 0 2.6.3 3.7.9-1 .3-2 1-2.7 2-1-.7-2.5-1-3.8-.6C9.8 5 10.8 4 12 4z" fill="#FFD700"/>
  <circle cx="12" cy="12" r="5" fill="#FF4500"/>
  <path d="M9 10c.5-1.5 2-2.5 3.5-2.5 2 0 3.5 1.5 3.5 3.5 0 1.5-1 2.8-2.5 3.2" fill="none" stroke="#FF9500" stroke-width="1.5"/>`;

const YOUTUBE_SVG = `
  <rect x="2" y="5" width="20" height="14" rx="4" fill="#FF0000"/>
  <polygon points="10,9 10,15 16,12" fill="white"/>`;

const WHATSAPP_SVG = `
  <circle cx="12" cy="12" r="10" fill="#25D366"/>
  <path d="M12 6.5A5.5 5.5 0 0 0 7.2 15l-.7 2.5 2.6-.7A5.5 5.5 0 1 0 12 6.5z" fill="white"/>
  <path d="M9.5 10c.2-.4.7-.7 1-.7.2 0 .4 0 .5.1l.7 1.7c.1.2 0 .4-.1.6l-.4.4c.3.6.8 1.1 1.4 1.4l.4-.4c.2-.2.4-.2.6-.1l1.7.7c.2.1.2.3.1.5-.3.7-1 1.2-1.8 1.2-2.4 0-4.3-2-4.3-4.3 0-.5.1-1 .2-1.1z" fill="#25D366"/>`;

const INSTAGRAM_SVG = `
  <defs>
    <linearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#F58529"/>
      <stop offset="30%" stop-color="#DD2A7B"/>
      <stop offset="65%" stop-color="#8134AF"/>
      <stop offset="100%" stop-color="#515BD4"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig)"/>
  <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="white" stroke-width="1.8"/>
  <circle cx="12" cy="12" r="3.5" fill="none" stroke="white" stroke-width="1.8"/>
  <circle cx="17" cy="7" r="1.1" fill="white"/>`;

const TWITTER_SVG = `
  <rect x="2" y="2" width="20" height="20" rx="5" fill="#000000"/>
  <path d="M6 6h4l3 4.5L16.5 6H19l-5 6 5.5 6H15l-3.5-4.8L8 18H5.5l5.3-6z" fill="white"/>`;

const FACEBOOK_SVG = `
  <circle cx="12" cy="12" r="10" fill="#1877F2"/>
  <path d="M15 8h-2a1 1 0 0 0-1 1v2h3l-.4 3H12v7h-3v-7H7v-3h2V9a4 4 0 0 1 4-4h2z" fill="white"/>`;

const SPOTIFY_SVG = `
  <circle cx="12" cy="12" r="10" fill="#1DB954"/>
  <path d="M7 9.5c2.8-1.7 6.8-1.7 9.5 0" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M8 12.5c2.2-1.3 5.8-1.3 8 0" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M9 15.5c1.7-1 4.3-1 6 0" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round"/>`;

const GITHUB_SVG = `
  <circle cx="12" cy="12" r="10" fill="#24292F"/>
  <path d="M12 4.3a7.7 7.7 0 0 0-2.4 15c.4.1.5-.2.5-.4v-1.4c-2.1.5-2.5-1-2.5-1-.3-.9-.8-1.1-.8-1.1-.7-.5 0-.5 0-.5.8.1 1.2.8 1.2.8.7 1.2 1.8.8 2.2.7.1-.5.3-.9.5-1.1-1.7-.2-3.5-.8-3.5-3.7 0-.8.3-1.5.8-2-.1-.2-.3-1 .1-2 0 0 .6-.2 2.1.8a7.4 7.4 0 0 1 3.8 0c1.4-1 2-1 2-1 .4 1.1.2 1.9.1 2.1.5.5.8 1.2.8 2 0 2.9-1.8 3.5-3.5 3.7.3.2.5.7.5 1.5v2.2c0 .2.1.5.5.4A7.7 7.7 0 0 0 12 4.3z" fill="white"/>`;

const LINKEDIN_SVG = `
  <rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2"/>
  <rect x="5.5" y="9" width="3" height="9" fill="white"/>
  <circle cx="7" cy="6.5" r="1.8" fill="white"/>
  <path d="M11 9h2.8v1.3c.4-.7 1.3-1.5 2.8-1.5 2.9 0 3.4 1.9 3.4 4.3V18H17v-4.5c0-1.1 0-2.5-1.5-2.5S14 12.2 14 13.4V18h-3z" fill="white"/>`;

const DISCORD_SVG = `
  <rect x="2" y="3" width="20" height="18" rx="5" fill="#5865F2"/>
  <path d="M8.5 7C7 7.3 5.5 8 4.5 9c-1.5 2.5-1.5 5.5 0 8 1.2 1.2 3 2 5 2l1-1.5c-.8-.2-1.5-.5-2.2-1" fill="none" stroke="white" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M15.5 7c1.5.3 3 1 4 2 1.5 2.5 1.5 5.5 0 8-1.2 1.2-3 2-5 2L13.5 17.5c.8-.2 1.5-.5 2.2-1" fill="none" stroke="white" stroke-width="1.3" stroke-linecap="round"/>
  <circle cx="9.5" cy="13" r="2" fill="white"/>
  <circle cx="14.5" cy="13" r="2" fill="white"/>`;

const SLACK_SVG = `
  <circle cx="8.5" cy="5" r="2" fill="#E01E5A"/>
  <rect x="7" y="7" width="3" height="7" rx="1.5" fill="#E01E5A"/>
  <circle cx="19" cy="8.5" r="2" fill="#36C5F0"/>
  <rect x="10" y="7" width="7" height="3" rx="1.5" fill="#36C5F0"/>
  <circle cx="15.5" cy="19" r="2" fill="#2EB67D"/>
  <rect x="14" y="10" width="3" height="7" rx="1.5" fill="#2EB67D"/>
  <circle cx="5" cy="15.5" r="2" fill="#ECB22E"/>
  <rect x="7" y="14" width="7" height="3" rx="1.5" fill="#ECB22E"/>`;

const TIKTOK_SVG = `
  <rect x="2" y="2" width="20" height="20" rx="5" fill="#010101"/>
  <path d="M14.5 5.5c.5 2 2 3 3.5 3.3v2.5c-1.2-.1-2.5-.6-3.5-1.5v5.2a4.5 4.5 0 1 1-3-4.2V13c-.8-.3-1.5 0-2 .5a2 2 0 0 0 2 3 2 2 0 0 0 2-2V5.5z" fill="white"/>
  <path d="M14.7 5.5h-.2c.1.1.2.2.2.3v-.3z" fill="#00F2EA"/>`;

const GOOGLE_SVG = `
  <path d="M21.5 12.2c0-.8-.1-1.4-.2-2H12v3.7h5.4c-.2 1.3-1 2.4-2.1 3.1v2.5h3.3c2-1.8 3-4.5 2.9-7.3z" fill="#4285F4"/>
  <path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.3-2.5c-.9.6-2 1-3.3 1-2.6 0-4.8-1.7-5.5-4H3v2.6C4.6 19.9 8 22 12 22z" fill="#34A853"/>
  <path d="M6.5 14.1c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.5H3A10 10 0 0 0 2 12c0 1.6.4 3.2 1 4.5z" fill="#FBBC05"/>
  <path d="M12 5.9c1.5 0 2.8.5 3.8 1.5L18.5 5C17 3.5 14.7 2.5 12 2.5A10 10 0 0 0 3 7.5l3.5 2.6C7.2 7.6 9.4 5.9 12 5.9z" fill="#EA4335"/>`;

const ROWS: Row[] = [
  // Brands & OS
  ['Android', 'brands', '<path d="M8.5 3.5L6 1M15.5 3.5L18 1M5 11V8.5A3.5 3.5 0 0 1 8.5 5h7A3.5 3.5 0 0 1 19 8.5V11H5zM1.5 11H4v6H1.5A1.5 1.5 0 0 1 0 15.5v-3A1.5 1.5 0 0 1 1.5 11zM20 11h2.5A1.5 1.5 0 0 1 24 12.5v3A1.5 1.5 0 0 1 22.5 17H20V11zM5 11h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><circle cx="9" cy="8" r="1.2"/><circle cx="15" cy="8" r="1.2"/>', ['android','mobile','os','robot'], ['android'], ['professional'], 'new', 'amarapix', false, false, ANDROID_SVG],
  ['iOS / Apple', 'brands', '<path d="M12 6.5c.8-1 2-1.5 3-1.3-.1 1.1-.7 2.2-1.5 2.8-.8.6-1.9.9-2.8.7.1-1 .5-1.8 1.3-2.2zM15.5 8.5c-1.5 0-2.1.8-3.1.8-1.1 0-2-.8-3.4-.8-1.7 0-3.5 1.4-3.5 4.2 0 2.6 1.6 6.3 3.4 6.3.9 0 1.5-.6 2.7-.6 1.2 0 1.6.6 2.7.6 1.7 0 3.2-3.4 3.2-3.4s-1.7-.8-1.7-2.8c0-1.7 1.3-2.6 1.3-2.6s-.8-1.7-2.6-1.7z"/>', ['apple','ios','iphone','mobile'], ['ios'], ['professional'], 'new', 'amarapix', false, false, IOS_SVG],
  ['Windows', 'brands', '<rect x="2" y="3" width="9.5" height="9.5" rx="1"/><rect x="12.5" y="3" width="9.5" height="9.5" rx="1"/><rect x="2" y="13.5" width="9.5" height="9.5" rx="1"/><rect x="12.5" y="13.5" width="9.5" height="9.5" rx="1"/>', ['windows','microsoft','os','pc'], ['windows'], ['professional'], '2020s', 'amarapix', false, false, WINDOWS_SVG],
  ['macOS', 'brands', '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="7" cy="9.5" r="2.5"/><circle cx="12" cy="9.5" r="2.5"/><circle cx="17" cy="9.5" r="2.5"/>', ['apple','mac','macos','osx'], ['macos'], ['professional'], '2020s', 'amarapix', false, false, MACOS_SVG],
  ['Chrome', 'brands', '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2h9.2M3.8 5.7l4.6 7.9M20.7 5.7L16 13.6"/>', ['google','browser','chrome','web'], [], ['professional'], '2010s', 'amarapix', false, false, CHROME_SVG],
  ['Firefox', 'brands', '<circle cx="12" cy="12" r="10"/><path d="M12 4c1.3 0 2.6.3 3.7.9-1 .3-2 1-2.7 2-1-.7-2.5-1-3.8-.6C9.8 5 10.8 4 12 4z"/>', ['mozilla','browser','firefox','web'], [], ['professional'], '2010s', 'amarapix', false, false, FIREFOX_SVG],
  ['YouTube', 'brands', '<rect x="2" y="5" width="20" height="14" rx="4"/><polygon points="10,9 10,15 16,12"/>', ['video','google','yt','watch'], [], ['professional','decorative'], '2010s', 'amarapix', false, false, YOUTUBE_SVG],
  ['WhatsApp', 'brands', '<circle cx="12" cy="12" r="10"/><path d="M12 6.5A5.5 5.5 0 0 0 7.2 15l-.7 2.5 2.6-.7A5.5 5.5 0 1 0 12 6.5z"/>', ['chat','message','whatsapp','green'], [], ['professional'], '2020s', 'amarapix', false, false, WHATSAPP_SVG],
  ['Instagram', 'brands', '<rect x="2" y="2" width="20" height="20" rx="6"/><rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="7" r="1.2"/>', ['photo','social','instagram','gradient'], [], ['decorative'], '2020s', 'amarapix', false, false, INSTAGRAM_SVG],
  ['X (Twitter)', 'brands', '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M6 6h4l3 4.5L16.5 6H19l-5 6 5.5 6H15l-3.5-4.8L8 18H5.5l5.3-6z"/>', ['twitter','x','social','tweet'], [], ['professional'], '2020s', 'amarapix', false, false, TWITTER_SVG],
  ['Facebook', 'brands', '<circle cx="12" cy="12" r="10"/><path d="M15 8h-2a1 1 0 0 0-1 1v2h3l-.4 3H12v7h-3v-7H7v-3h2V9a4 4 0 0 1 4-4h2z"/>', ['social','meta','facebook','fb'], [], ['professional'], '2010s', 'amarapix', false, false, FACEBOOK_SVG],
  ['Spotify', 'brands', '<circle cx="12" cy="12" r="10"/><path d="M7 9.5c2.8-1.7 6.8-1.7 9.5 0M8 12.5c2.2-1.3 5.8-1.3 8 0M9 15.5c1.7-1 4.3-1 6 0"/>', ['music','audio','spotify','stream'], [], ['professional','decorative'], '2010s', 'amarapix', false, false, SPOTIFY_SVG],
  ['GitHub', 'brands', '<circle cx="12" cy="12" r="10"/><path d="M12 4.3a7.7 7.7 0 0 0-2.4 15c.4.1.5-.2.5-.4v-1.4c-2.1.5-2.5-1-2.5-1-.3-.9-.8-1.1-.8-1.1-.7-.5 0-.5 0-.5.8.1 1.2.8 1.2.8.7 1.2 1.8.8 2.2.7.1-.5.3-.9.5-1.1-1.7-.2-3.5-.8-3.5-3.7 0-.8.3-1.5.8-2-.1-.2-.3-1 .1-2 0 0 .6-.2 2.1.8a7.4 7.4 0 0 1 3.8 0c1.4-1 2-1 2-1 .4 1.1.2 1.9.1 2.1.5.5.8 1.2.8 2 0 2.9-1.8 3.5-3.5 3.7.3.2.5.7.5 1.5v2.2c0 .2.1.5.5.4A7.7 7.7 0 0 0 12 4.3z"/>', ['code','developer','github','git'], [], ['professional'], '2010s', 'amarapix', false, false, GITHUB_SVG],
  ['LinkedIn', 'brands', '<rect x="2" y="2" width="20" height="20" rx="4"/><rect x="5.5" y="9" width="3" height="9"/><circle cx="7" cy="6.5" r="1.8"/><path d="M11 9h2.8v1.3c.4-.7 1.3-1.5 2.8-1.5 2.9 0 3.4 1.9 3.4 4.3V18H17v-4.5c0-1.1 0-2.5-1.5-2.5S14 12.2 14 13.4V18h-3z"/>', ['job','career','linkedin','professional'], [], ['professional'], '2010s', 'amarapix', false, false, LINKEDIN_SVG],
  ['Discord', 'brands', '<rect x="2" y="3" width="20" height="18" rx="5"/><circle cx="9.5" cy="13" r="2"/><circle cx="14.5" cy="13" r="2"/><path d="M8 7c-2 .5-4 2-4.5 4M16 7c2 .5 4 2 4.5 4"/>', ['gaming','chat','discord','community'], [], ['games','professional'], '2020s', 'amarapix', false, false, DISCORD_SVG],
  ['Slack', 'brands', '<circle cx="8.5" cy="5" r="2"/><rect x="7" y="7" width="3" height="7" rx="1.5"/><circle cx="19" cy="8.5" r="2"/><rect x="10" y="7" width="7" height="3" rx="1.5"/><circle cx="15.5" cy="19" r="2"/><rect x="14" y="10" width="3" height="7" rx="1.5"/><circle cx="5" cy="15.5" r="2"/><rect x="7" y="14" width="7" height="3" rx="1.5"/>', ['work','team','slack','communication'], [], ['professional'], '2010s', 'amarapix', false, false, SLACK_SVG],
  ['TikTok', 'brands', '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M14.5 5.5c.5 2 2 3 3.5 3.3v2.5c-1.2-.1-2.5-.6-3.5-1.5v5.2a4.5 4.5 0 1 1-3-4.2V13"/>', ['video','social','tiktok','short'], [], ['decorative'], '2020s', 'amarapix', false, false, TIKTOK_SVG],
  ['Google', 'brands', '<path d="M21.5 12.2c0-.8-.1-1.4-.2-2H12v3.7h5.4c-.2 1.3-1 2.4-2.1 3.1v2.5h3.3c2-1.8 3-4.5 2.9-7.3z"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.3-2.5c-.9.6-2 1-3.3 1-2.6 0-4.8-1.7-5.5-4H3v2.6C4.6 19.9 8 22 12 22z"/><path d="M6.5 14.1c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.5H3A10 10 0 0 0 2 12c0 1.6.4 3.2 1 4.5z"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5L18.5 5C17 3.5 14.7 2.5 12 2.5A10 10 0 0 0 3 7.5l3.5 2.6C7.2 7.6 9.4 5.9 12 5.9z"/>', ['search','google','brand'], [], ['professional'], '2020s', 'amarapix', false, false, GOOGLE_SVG],
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
  const [name, category, path, tags, platforms, aesthetic, trend, author, animated, premium, colorSvg] = row;
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
    ...(colorSvg ? { colorSvg } : {}),
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
