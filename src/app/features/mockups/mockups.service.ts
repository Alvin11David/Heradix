import { Injectable, signal, computed } from '@angular/core';
import {
  MockupAsset, MockupCategory, MockupCategoryMeta, MockupCollection,
  MockupFilterState, MockupCreator, MockupSceneType, MockupOrientation,
  MockupLicense, MockupSortMode,
} from '../../core/models/mockup.model';

// ─── Trending data ────────────────────────────────────────────────────────────
export const MOCKUP_TRENDING_TAGS = [
  'iphone mockup', 't-shirt', 'packaging', 'business card', 'billboard',
  'coffee cup', 'hoodie', 'macbook', 'poster', 'logo on wall',
  'bottle label', 'tote bag', 'mug', 'box packaging', 'storefront',
  'social media', 'instagram', 'branding kit', 'product label', 'flat lay',
  'minimal studio', 'lifestyle', 'apparel', 'cap mockup', 'outdoor sign',
];

export const MOCKUP_TRENDING_COLORS = [
  { name: 'Pure White',    hex: '#FFFFFF' },
  { name: 'Charcoal',     hex: '#374151' },
  { name: 'Sand Beige',   hex: '#D4B483' },
  { name: 'Electric Blue', hex: '#3B82F6' },
  { name: 'Forest Green', hex: '#16a34a' },
  { name: 'Blush Pink',   hex: '#FCA5A5' },
  { name: 'Midnight',     hex: '#0F172A' },
  { name: 'Warm Gray',    hex: '#9CA3AF' },
];

export const MOCKUP_SEASONAL_COLLECTIONS = [
  { id: 'summer',    label: 'Summer Promo',      emoji: '☀️', count: 480 },
  { id: 'holiday',   label: 'Holiday Gift',       emoji: '🎄', count: 380 },
  { id: 'branding',  label: 'Brand Identity',     emoji: '✨', count: 920 },
  { id: 'apparel',   label: 'Apparel Season',     emoji: '👕', count: 640 },
  { id: 'packaging', label: 'Premium Packaging',  emoji: '📦', count: 560 },
  { id: 'social',    label: 'Social Media Kit',   emoji: '📱', count: 740 },
];

// ─── Creators ────────────────────────────────────────────────────────────────
const CREATORS: MockupCreator[] = [
  { id: 'c1', name: 'MockupLab',    avatar: 'https://i.pravatar.cc/40?img=1',  isVerified: true,  followers: 18400, totalAssets: 428 },
  { id: 'c2', name: 'StudioFrame',  avatar: 'https://i.pravatar.cc/40?img=4',  isVerified: true,  followers: 11200, totalAssets: 315 },
  { id: 'c3', name: 'PixelScene',   avatar: 'https://i.pravatar.cc/40?img=2',  isVerified: false, followers: 6800,  totalAssets: 147 },
  { id: 'c4', name: 'CraftMock',    avatar: 'https://i.pravatar.cc/40?img=8',  isVerified: true,  followers: 24600, totalAssets: 592 },
  { id: 'c5', name: 'SceneLab',     avatar: 'https://i.pravatar.cc/40?img=12', isVerified: false, followers: 4200,  totalAssets: 98  },
  { id: 'c6', name: 'DesignForge',  avatar: 'https://i.pravatar.cc/40?img=6',  isVerified: true,  followers: 13800, totalAssets: 380 },
  { id: 'c7', name: 'ProMockup',    avatar: 'https://i.pravatar.cc/40?img=9',  isVerified: true,  followers: 9100,  totalAssets: 264 },
  { id: 'c8', name: 'VisualCraft',  avatar: 'https://i.pravatar.cc/40?img=15', isVerified: true,  followers: 31000, totalAssets: 680 },
];

// ─── Categories ───────────────────────────────────────────────────────────────
export const MOCKUP_CATEGORIES: MockupCategoryMeta[] = [
  {
    id: 'devices', label: 'Devices', icon: '📱', count: 1840,
    subcategories: [
      { id: 'iphone', label: 'iPhone', icon: '📱' },
      { id: 'android', label: 'Android', icon: '🤖' },
      { id: 'macbook', label: 'MacBook', icon: '💻' },
      { id: 'laptop', label: 'Laptop', icon: '🖥️' },
      { id: 'imac', label: 'iMac', icon: '🖥️' },
      { id: 'tablet', label: 'Tablet', icon: '📟' },
      { id: 'smartwatch', label: 'Smart Watch', icon: '⌚' },
      { id: 'tv', label: 'TV / Display', icon: '📺' },
    ],
  },
  {
    id: 'apparel', label: 'Apparel', icon: '👕', count: 1380,
    subcategories: [
      { id: 'tshirt', label: 'T-Shirt', icon: '👕' },
      { id: 'hoodie', label: 'Hoodie', icon: '🧥' },
      { id: 'polo', label: 'Polo Shirt' },
      { id: 'jacket', label: 'Jacket' },
      { id: 'cap', label: 'Cap / Hat', icon: '🧢' },
      { id: 'tote', label: 'Tote Bag', icon: '👜' },
      { id: 'socks', label: 'Socks' },
      { id: 'apron', label: 'Apron' },
    ],
  },
  {
    id: 'branding', label: 'Branding', icon: '🏢', count: 980,
    subcategories: [
      { id: 'business-card', label: 'Business Cards', icon: '💳' },
      { id: 'letterhead', label: 'Letterhead' },
      { id: 'envelope', label: 'Envelope' },
      { id: 'notebook', label: 'Notebook' },
      { id: 'id-card', label: 'ID Card' },
      { id: 'folder', label: 'Presentation Folder' },
      { id: 'stamp', label: 'Rubber Stamp' },
    ],
  },
  {
    id: 'packaging', label: 'Packaging', icon: '📦', count: 1120,
    subcategories: [
      { id: 'box', label: 'Boxes', icon: '📦' },
      { id: 'bottle', label: 'Bottles', icon: '🍾' },
      { id: 'can', label: 'Cans', icon: '🥫' },
      { id: 'coffee-cup', label: 'Coffee Cup', icon: '☕' },
      { id: 'cosmetic', label: 'Cosmetic', icon: '💄' },
      { id: 'bag', label: 'Shopping Bag', icon: '🛍️' },
      { id: 'label', label: 'Labels' },
      { id: 'pouch', label: 'Pouches' },
    ],
  },
  {
    id: 'print', label: 'Print', icon: '📄', count: 860,
    subcategories: [
      { id: 'flyer', label: 'Flyers', icon: '📋' },
      { id: 'poster', label: 'Posters', icon: '🖼️' },
      { id: 'brochure', label: 'Brochures' },
      { id: 'magazine', label: 'Magazine', icon: '📰' },
      { id: 'book', label: 'Book / Booklet', icon: '📚' },
      { id: 'certificate', label: 'Certificate', icon: '🏆' },
      { id: 'menu', label: 'Menu' },
      { id: 'calendar', label: 'Calendar' },
    ],
  },
  {
    id: 'outdoor', label: 'Outdoor', icon: '🏙️', count: 620,
    subcategories: [
      { id: 'billboard', label: 'Billboard', icon: '🏗️' },
      { id: 'bus-stop', label: 'Bus Stop' },
      { id: 'vehicle', label: 'Vehicle Wrap', icon: '🚗' },
      { id: 'storefront', label: 'Storefront', icon: '🏪' },
      { id: 'banner', label: 'Roll-Up Banner' },
      { id: 'flag', label: 'Flag', icon: '🚩' },
      { id: 'street-sign', label: 'Street Sign' },
    ],
  },
  {
    id: 'home-office', label: 'Home & Office', icon: '🖼️', count: 540,
    subcategories: [
      { id: 'frame', label: 'Picture Frame', icon: '🖼️' },
      { id: 'wall-art', label: 'Wall Art' },
      { id: 'mug', label: 'Mug', icon: '☕' },
      { id: 'mousepad', label: 'Mouse Pad' },
      { id: 'pillow', label: 'Pillow', icon: '🛋️' },
      { id: 'canvas-print', label: 'Canvas Print' },
      { id: 'office-sign', label: 'Office Sign' },
    ],
  },
  {
    id: 'digital', label: 'Digital', icon: '💻', count: 760,
    subcategories: [
      { id: 'instagram', label: 'Instagram', icon: '📸' },
      { id: 'facebook', label: 'Facebook Cover' },
      { id: 'youtube', label: 'YouTube Thumbnail', icon: '▶️' },
      { id: 'website', label: 'Website Screen', icon: '🌐' },
      { id: 'app-ui', label: 'Mobile App UI', icon: '📲' },
      { id: 'dashboard', label: 'Dashboard UI' },
      { id: 'social', label: 'Social Post', icon: '💬' },
    ],
  },
  {
    id: 'merchandise', label: 'Merchandise', icon: '🎁', count: 480,
    subcategories: [
      { id: 'sticker', label: 'Stickers', icon: '🏷️' },
      { id: 'phone-case', label: 'Phone Case', icon: '📱' },
      { id: 'water-bottle', label: 'Water Bottle', icon: '💧' },
      { id: 'usb', label: 'USB Drive' },
      { id: 'keychain', label: 'Keychain', icon: '🔑' },
      { id: 'pen', label: 'Pen' },
      { id: 'gift-box', label: 'Gift Box', icon: '🎁' },
    ],
  },
];

// ─── Raw mock data builder ────────────────────────────────────────────────────
interface RawMock {
  name: string; slug: string; desc: string;
  cat: MockupCategory; catLabel: string; sub: string;
  scene: MockupSceneType; orient: MockupOrientation; lic: MockupLicense;
  fmts: ('png'|'jpg'|'pdf'|'psd'|'svg'|'webp')[];
  res: string; soSize: string; areas: number;
  colors: string[];
  dl: number; likes: number; views: number; rating: number; rc: number; comments: number;
  cid: string; daysAgo: number;
  flags?: string[];
}

const RAW: RawMock[] = [
  // ── Devices ──────────────────────────────────────────────────────────────
  { name:'iPhone 16 Pro – Studio White', slug:'iphone-16-pro-studio-white', desc:'Clean studio shot of iPhone 16 Pro on a white surface. Perfect for app screenshots and UI showcases.',
    cat:'devices', catLabel:'Devices', sub:'iphone', scene:'studio', orient:'portrait', lic:'free',
    fmts:['png','jpg'], res:'4000×3000px', soSize:'1284×2778px', areas:1,
    colors:['#FFFFFF','#E5E7EB','#111827'], dl:24800, likes:1840, views:98000, rating:4.9, rc:612, comments:84,
    cid:'c1', daysAgo:5, flags:['featured','trending','editors'] },

  { name:'MacBook Pro – Desk Scene', slug:'macbook-pro-desk-scene', desc:'Premium MacBook Pro mockup on a minimal wooden desk with coffee cup and notebook.',
    cat:'devices', catLabel:'Devices', sub:'macbook', scene:'lifestyle', orient:'landscape', lic:'free',
    fmts:['png','jpg','psd'], res:'5000×3333px', soSize:'2560×1600px', areas:1,
    colors:['#D4B483','#6B7280','#FFFFFF'], dl:18600, likes:1420, views:76000, rating:4.8, rc:486, comments:62,
    cid:'c4', daysAgo:12, flags:['featured','staff'] },

  { name:'Samsung Galaxy S25 – Floating', slug:'samsung-galaxy-s25-floating', desc:'Dynamic floating Android smartphone mockup with shadow, ideal for app store screenshots.',
    cat:'devices', catLabel:'Devices', sub:'android', scene:'minimal', orient:'portrait', lic:'premium',
    fmts:['png','psd'], res:'4500×4500px', soSize:'1440×3088px', areas:1,
    colors:['#111827','#374151','#6366F1'], dl:9200, likes:780, views:42000, rating:4.7, rc:298, comments:31,
    cid:'c8', daysAgo:3, flags:['new','premium','ai'] },

  { name:'iPad Pro – Hand Hold', slug:'ipad-pro-hand-hold', desc:'Realistic iPad Pro held in hand, ideal for app UI and presentation mockups.',
    cat:'devices', catLabel:'Devices', sub:'tablet', scene:'lifestyle', orient:'portrait', lic:'free',
    fmts:['png','jpg'], res:'4000×4000px', soSize:'2048×2732px', areas:1,
    colors:['#F3F4F6','#9CA3AF','#FFFFFF'], dl:14200, likes:1080, views:58000, rating:4.6, rc:372, comments:45,
    cid:'c2', daysAgo:18, flags:['trending'] },

  { name:'iMac 27" – Workspace Setup', slug:'imac-27-workspace-setup', desc:'Full iMac setup with keyboard, mouse and accessories for website and desktop UI presentation.',
    cat:'devices', catLabel:'Devices', sub:'imac', scene:'lifestyle', orient:'landscape', lic:'premium',
    fmts:['png','psd','jpg'], res:'6000×4000px', soSize:'5120×2880px', areas:1,
    colors:['#E5E7EB','#D4B483','#6B7280'], dl:7800, likes:620, views:34000, rating:4.7, rc:214, comments:27,
    cid:'c6', daysAgo:25, flags:['premium','editors'] },

  { name:'Apple Watch Series 10 – Flat', slug:'apple-watch-series-10-flat', desc:'Minimalist Apple Watch mockup on clean white for watchOS app screenshots.',
    cat:'devices', catLabel:'Devices', sub:'smartwatch', scene:'flat-lay', orient:'square', lic:'free',
    fmts:['png','jpg'], res:'3000×3000px', soSize:'368×448px', areas:1,
    colors:['#FFFFFF','#111827','#9CA3AF'], dl:6400, likes:480, views:28000, rating:4.5, rc:168, comments:19,
    cid:'c3', daysAgo:40, flags:['new'] },

  { name:'Multi-Device Responsive Set', slug:'multi-device-responsive-set', desc:'Show your design on iPhone, iPad, MacBook, and iMac simultaneously. Perfect for marketing pages.',
    cat:'devices', catLabel:'Devices', sub:'laptop', scene:'isometric', orient:'landscape', lic:'premium',
    fmts:['png','psd'], res:'5500×3500px', soSize:'1920×1080px', areas:4,
    colors:['#FFFFFF','#E5E7EB','#3B82F6'], dl:11400, likes:940, views:52000, rating:4.9, rc:312, comments:58,
    cid:'c4', daysAgo:8, flags:['featured','premium','trending','ai'] },

  // ── Apparel ───────────────────────────────────────────────────────────────
  { name:'Classic White T-Shirt – Front', slug:'classic-white-tshirt-front', desc:'Clean ghosted white t-shirt on pure background. Ideal for print-on-demand and merch stores.',
    cat:'apparel', catLabel:'Apparel', sub:'tshirt', scene:'studio', orient:'portrait', lic:'free',
    fmts:['png','jpg'], res:'4000×4000px', soSize:'2000×2000px', areas:2,
    colors:['#FFFFFF','#F9FAFB'], dl:32400, likes:2480, views:124000, rating:4.8, rc:820, comments:112,
    cid:'c1', daysAgo:2, flags:['featured','trending','staff'] },

  { name:'Premium Hoodie – Lifestyle', slug:'premium-hoodie-lifestyle', desc:'Model wearing oversized hoodie in lifestyle setting. Multiple color variants included.',
    cat:'apparel', catLabel:'Apparel', sub:'hoodie', scene:'lifestyle', orient:'portrait', lic:'premium',
    fmts:['png','psd'], res:'5000×6000px', soSize:'1800×2200px', areas:1,
    colors:['#374151','#111827','#6B7280'], dl:8600, likes:720, views:39000, rating:4.7, rc:248, comments:34,
    cid:'c8', daysAgo:9, flags:['premium','editors'] },

  { name:'Snapback Cap – Front & Side', slug:'snapback-cap-front-side', desc:'Snapback cap shown from front and ¾ angle. Smart object makes logo placement seamless.',
    cat:'apparel', catLabel:'Apparel', sub:'cap', scene:'studio', orient:'landscape', lic:'free',
    fmts:['png','jpg'], res:'4500×3000px', soSize:'800×600px', areas:2,
    colors:['#1F2937','#FFFFFF','#9CA3AF'], dl:12800, likes:1040, views:56000, rating:4.6, rc:348, comments:42,
    cid:'c6', daysAgo:21, flags:['trending'] },

  { name:'Canvas Tote Bag – Natural', slug:'canvas-tote-bag-natural', desc:'Natural canvas tote bag mockup in lifestyle setting. Perfect for eco-brand products.',
    cat:'apparel', catLabel:'Apparel', sub:'tote', scene:'lifestyle', orient:'portrait', lic:'free',
    fmts:['png','jpg'], res:'4000×5000px', soSize:'1200×1600px', areas:1,
    colors:['#D4B483','#F5F0E8','#6B7280'], dl:9200, likes:780, views:44000, rating:4.5, rc:268, comments:28,
    cid:'c2', daysAgo:14, flags:['new'] },

  { name:'Polo Shirt – Flat Lay Grid', slug:'polo-shirt-flat-lay-grid', desc:'Flat lay polo shirt on concrete surface. Great for e-commerce product listings.',
    cat:'apparel', catLabel:'Apparel', sub:'polo', scene:'flat-lay', orient:'square', lic:'premium',
    fmts:['png','psd'], res:'4000×4000px', soSize:'1600×1600px', areas:1,
    colors:['#E5E7EB','#D1FAE5','#FEF3C7'], dl:4800, likes:380, views:21000, rating:4.4, rc:148, comments:14,
    cid:'c5', daysAgo:35, flags:['premium'] },

  // ── Branding ─────────────────────────────────────────────────────────────
  { name:'Business Card – Soft Shadow', slug:'business-card-soft-shadow', desc:'Elegant horizontal business card on matte surface with soft drop shadow. Classic branding presentation.',
    cat:'branding', catLabel:'Branding', sub:'business-card', scene:'studio', orient:'landscape', lic:'free',
    fmts:['png','jpg'], res:'4500×3000px', soSize:'1050×600px', areas:2,
    colors:['#FFFFFF','#111827','#F9FAFB'], dl:28400, likes:2140, views:108000, rating:4.9, rc:712, comments:96,
    cid:'c4', daysAgo:6, flags:['featured','trending','editors'] },

  { name:'Stationery Brand Identity Set', slug:'stationery-brand-identity-set', desc:'Full brand identity mockup featuring business card, letterhead, envelope, and notebook.',
    cat:'branding', catLabel:'Branding', sub:'letterhead', scene:'flat-lay', orient:'landscape', lic:'premium',
    fmts:['png','psd'], res:'6000×4000px', soSize:'2480×3507px', areas:5,
    colors:['#F3F4F6','#D4B483','#1F2937'], dl:6200, likes:540, views:28000, rating:4.8, rc:184, comments:32,
    cid:'c8', daysAgo:11, flags:['premium','featured','ai'] },

  { name:'Kraft Paper Envelope Mockup', slug:'kraft-paper-envelope-mockup', desc:'Rustic kraft paper envelope with wax seal. Great for luxury branding and invitations.',
    cat:'branding', catLabel:'Branding', sub:'envelope', scene:'flat-lay', orient:'landscape', lic:'free',
    fmts:['png','jpg'], res:'4000×3000px', soSize:'1000×700px', areas:2,
    colors:['#D4B483','#92400E','#FFFFFF'], dl:11600, likes:880, views:49000, rating:4.7, rc:292, comments:38,
    cid:'c3', daysAgo:28, flags:['staff'] },

  { name:'Hardcover Notebook – Desk', slug:'hardcover-notebook-desk', desc:'A5 hardcover notebook open on wooden desk with pen. Multi-page smart objects included.',
    cat:'branding', catLabel:'Branding', sub:'notebook', scene:'lifestyle', orient:'landscape', lic:'free',
    fmts:['png','jpg'], res:'4500×3000px', soSize:'1480×2100px', areas:3,
    colors:['#D4B483','#374151','#F5F0E8'], dl:8400, likes:680, views:37000, rating:4.6, rc:228, comments:26,
    cid:'c7', daysAgo:45, flags:['editors'] },

  // ── Packaging ─────────────────────────────────────────────────────────────
  { name:'Coffee Cup Sleeve – Kraft', slug:'coffee-cup-sleeve-kraft', desc:'Takeaway coffee cup with printable sleeve and lid. Realistic condensation and steam effects.',
    cat:'packaging', catLabel:'Packaging', sub:'coffee-cup', scene:'lifestyle', orient:'portrait', lic:'free',
    fmts:['png','jpg'], res:'4000×5000px', soSize:'1800×900px', areas:2,
    colors:['#D4B483','#92400E','#FFFFFF'], dl:19600, likes:1580, views:84000, rating:4.8, rc:528, comments:72,
    cid:'c1', daysAgo:4, flags:['featured','trending'] },

  { name:'Cosmetic Bottle & Pump Set', slug:'cosmetic-bottle-pump-set', desc:'Luxury skincare bottle with pump dispenser. Matte and glossy finish options available.',
    cat:'packaging', catLabel:'Packaging', sub:'cosmetic', scene:'studio', orient:'portrait', lic:'premium',
    fmts:['png','psd'], res:'4000×6000px', soSize:'800×2000px', areas:3,
    colors:['#F9FAFB','#E5E7EB','#1F2937'], dl:7200, likes:600, views:33000, rating:4.7, rc:212, comments:28,
    cid:'c4', daysAgo:16, flags:['premium','editors'] },

  { name:'Product Box – Unboxing Scene', slug:'product-box-unboxing-scene', desc:'Premium product box in open unboxing position. Perfect for tech accessories and luxury goods.',
    cat:'packaging', catLabel:'Packaging', sub:'box', scene:'lifestyle', orient:'landscape', lic:'free',
    fmts:['png','jpg'], res:'5000×3500px', soSize:'2000×2000px', areas:4,
    colors:['#111827','#374151','#FFFFFF'], dl:13800, likes:1120, views:62000, rating:4.6, rc:372, comments:48,
    cid:'c6', daysAgo:22, flags:['trending'] },

  { name:'Beverage Can – Cold Condensation', slug:'beverage-can-cold-condensation', desc:'360° wrap-around label can mockup with realistic cold condensation effect.',
    cat:'packaging', catLabel:'Packaging', sub:'can', scene:'studio', orient:'portrait', lic:'premium',
    fmts:['png','psd'], res:'4500×5500px', soSize:'2160×1260px', areas:1,
    colors:['#BFDBFE','#1E40AF','#F9FAFB'], dl:9800, likes:820, views:46000, rating:4.7, rc:276, comments:36,
    cid:'c8', daysAgo:7, flags:['new','premium','ai'] },

  { name:'Glass Bottle Label – Minimal', slug:'glass-bottle-label-minimal', desc:'Clear glass bottle with front and back printable label zones. Perfect for beverages and spirits.',
    cat:'packaging', catLabel:'Packaging', sub:'bottle', scene:'studio', orient:'portrait', lic:'free',
    fmts:['png','jpg'], res:'4000×6000px', soSize:'1000×2600px', areas:2,
    colors:['#DBEAFE','#93C5FD','#FFFFFF'], dl:11200, likes:920, views:51000, rating:4.5, rc:308, comments:41,
    cid:'c2', daysAgo:30, flags:['staff'] },

  { name:'Kraft Pouch – Food Packaging', slug:'kraft-pouch-food-packaging', desc:'Stand-up kraft pouch with zip lock. Great for coffee, snack, and food brand packaging.',
    cat:'packaging', catLabel:'Packaging', sub:'pouch', scene:'flat-lay', orient:'portrait', lic:'free',
    fmts:['png','jpg'], res:'4000×4500px', soSize:'1500×2000px', areas:2,
    colors:['#D4B483','#92400E','#F5F0E8'], dl:8600, likes:700, views:38000, rating:4.6, rc:234, comments:29,
    cid:'c3', daysAgo:50, flags:['editors'] },

  // ── Print ─────────────────────────────────────────────────────────────────
  { name:'A4 Poster – Wall Pin', slug:'a4-poster-wall-pin', desc:'A4 poster pinned on concrete wall with shadow. Clean and versatile for any design style.',
    cat:'print', catLabel:'Print', sub:'poster', scene:'lifestyle', orient:'portrait', lic:'free',
    fmts:['png','jpg'], res:'4000×5000px', soSize:'2480×3507px', areas:1,
    colors:['#E5E7EB','#F3F4F6','#FFFFFF'], dl:22600, likes:1780, views:92000, rating:4.8, rc:596, comments:80,
    cid:'c1', daysAgo:3, flags:['featured','trending'] },

  { name:'Tri-fold Brochure – Flat Lay', slug:'trifold-brochure-flat-lay', desc:'Tri-fold brochure open and folded views on wooden background with coffee.',
    cat:'print', catLabel:'Print', sub:'brochure', scene:'flat-lay', orient:'landscape', lic:'free',
    fmts:['png','jpg'], res:'5000×3500px', soSize:'2100×990px', areas:3,
    colors:['#F3F4F6','#D4B483','#374151'], dl:9400, likes:760, views:42000, rating:4.6, rc:256, comments:33,
    cid:'c5', daysAgo:19, flags:['staff'] },

  { name:'Hardcover Magazine – Editorial', slug:'hardcover-magazine-editorial', desc:'Realistic magazine spread with front cover, open pages, and back cover smart objects.',
    cat:'print', catLabel:'Print', sub:'magazine', scene:'studio', orient:'portrait', lic:'premium',
    fmts:['png','psd'], res:'5000×3500px', soSize:'2480×3507px', areas:3,
    colors:['#FFFFFF','#1F2937','#E5E7EB'], dl:6800, likes:560, views:30000, rating:4.7, rc:188, comments:24,
    cid:'c4', daysAgo:26, flags:['premium','editors'] },

  // ── Outdoor ───────────────────────────────────────────────────────────────
  { name:'Urban Billboard – City Street', slug:'urban-billboard-city-street', desc:'Large-format billboard mockup on an urban street with cars and buildings for context.',
    cat:'outdoor', catLabel:'Outdoor', sub:'billboard', scene:'outdoor', orient:'landscape', lic:'free',
    fmts:['png','jpg'], res:'5000×3500px', soSize:'3000×2000px', areas:1,
    colors:['#374151','#1F2937','#9CA3AF'], dl:16400, likes:1280, views:68000, rating:4.7, rc:432, comments:58,
    cid:'c8', daysAgo:14, flags:['featured','trending'] },

  { name:'Retail Storefront – Glass Window', slug:'retail-storefront-glass-window', desc:'Modern retail storefront with logo placement on glass door and signage above.',
    cat:'outdoor', catLabel:'Outdoor', sub:'storefront', scene:'outdoor', orient:'landscape', lic:'premium',
    fmts:['png','psd'], res:'5500×3500px', soSize:'1800×600px', areas:3,
    colors:['#1F2937','#FFFFFF','#F3F4F6'], dl:7400, likes:620, views:35000, rating:4.8, rc:212, comments:29,
    cid:'c6', daysAgo:31, flags:['premium','staff'] },

  { name:'Roll-Up Banner – Exhibition', slug:'rollup-banner-exhibition', desc:'Pull-up/roll-up banner stand with adjustable proportions for exhibitions and events.',
    cat:'outdoor', catLabel:'Outdoor', sub:'banner', scene:'indoor', orient:'portrait', lic:'free',
    fmts:['png','jpg'], res:'4000×6000px', soSize:'800×2000px', areas:1,
    colors:['#F9FAFB','#E5E7EB','#374151'], dl:11800, likes:940, views:52000, rating:4.5, rc:316, comments:40,
    cid:'c7', daysAgo:43, flags:['editors'] },

  // ── Home & Office ─────────────────────────────────────────────────────────
  { name:'Canvas Wall Art – Living Room', slug:'canvas-wall-art-living-room', desc:'Framed canvas print hung on living room wall. Multiple frame and canvas styles available.',
    cat:'home-office', catLabel:'Home & Office', sub:'wall-art', scene:'lifestyle', orient:'landscape', lic:'free',
    fmts:['png','jpg'], res:'5000×4000px', soSize:'3000×2000px', areas:1,
    colors:['#F5F0E8','#D4B483','#374151'], dl:13400, likes:1060, views:57000, rating:4.7, rc:356, comments:46,
    cid:'c2', daysAgo:17, flags:['trending','staff'] },

  { name:'Coffee Mug – Ceramic White', slug:'coffee-mug-ceramic-white', desc:'Classic white ceramic mug with steam on wooden table. Wrap-around print zone.',
    cat:'home-office', catLabel:'Home & Office', sub:'mug', scene:'lifestyle', orient:'landscape', lic:'free',
    fmts:['png','jpg'], res:'4000×3000px', soSize:'2400×1100px', areas:1,
    colors:['#FFFFFF','#F3F4F6','#D4B483'], dl:18200, likes:1420, views:74000, rating:4.6, rc:476, comments:64,
    cid:'c1', daysAgo:8, flags:['featured','trending'] },

  { name:'Wooden Picture Frame – Gallery', slug:'wooden-picture-frame-gallery', desc:'Premium wooden frame on white gallery wall. Multiple sizes and wood tones available.',
    cat:'home-office', catLabel:'Home & Office', sub:'frame', scene:'indoor', orient:'portrait', lic:'free',
    fmts:['png','jpg'], res:'4500×5500px', soSize:'2000×2800px', areas:1,
    colors:['#D4B483','#92400E','#F9FAFB'], dl:10400, likes:840, views:46000, rating:4.7, rc:280, comments:36,
    cid:'c4', daysAgo:35, flags:['editors'] },

  // ── Digital ───────────────────────────────────────────────────────────────
  { name:'Instagram Story – Portrait Phone', slug:'instagram-story-portrait-phone', desc:'Instagram story displayed on iPhone in a hand. Perfect for social media content previews.',
    cat:'digital', catLabel:'Digital', sub:'instagram', scene:'lifestyle', orient:'portrait', lic:'free',
    fmts:['png','jpg'], res:'4000×5000px', soSize:'1080×1920px', areas:1,
    colors:['#111827','#374151','#E879F9'], dl:21400, likes:1680, views:86000, rating:4.8, rc:560, comments:76,
    cid:'c8', daysAgo:2, flags:['featured','trending','new'] },

  { name:'Website Browser – Desktop', slug:'website-browser-desktop', desc:'Browser window mockup showing website design. Dark and light mode included.',
    cat:'digital', catLabel:'Digital', sub:'website', scene:'minimal', orient:'landscape', lic:'free',
    fmts:['png','jpg'], res:'5000×3500px', soSize:'2560×1600px', areas:1,
    colors:['#1F2937','#374151','#3B82F6'], dl:16800, likes:1320, views:70000, rating:4.7, rc:448, comments:60,
    cid:'c1', daysAgo:10, flags:['trending','staff'] },

  { name:'App UI – Dual Phone Scene', slug:'app-ui-dual-phone-scene', desc:'Two iPhones showing app screens in a stylish composition. Perfect for App Store and marketing.',
    cat:'digital', catLabel:'Digital', sub:'app-ui', scene:'studio', orient:'landscape', lic:'premium',
    fmts:['png','psd'], res:'5000×3500px', soSize:'1284×2778px', areas:2,
    colors:['#0F172A','#1E293B','#6366F1'], dl:8400, likes:700, views:38000, rating:4.9, rc:236, comments:31,
    cid:'c4', daysAgo:20, flags:['premium','featured','ai'] },

  // ── Merchandise ───────────────────────────────────────────────────────────
  { name:'Vinyl Sticker Sheet – Round', slug:'vinyl-sticker-sheet-round', desc:'Die-cut sticker sheet with individual circular stickers. Perfect for brand merchandise.',
    cat:'merchandise', catLabel:'Merchandise', sub:'sticker', scene:'flat-lay', orient:'landscape', lic:'free',
    fmts:['png','jpg'], res:'4000×3000px', soSize:'600×600px', areas:6,
    colors:['#FFFFFF','#F9FAFB','#E5E7EB'], dl:14600, likes:1160, views:62000, rating:4.6, rc:388, comments:52,
    cid:'c3', daysAgo:13, flags:['trending'] },

  { name:'Custom Phone Case – Flat', slug:'custom-phone-case-flat', desc:'iPhone snap case mockup in flat lay position. Front, back, and side panels included.',
    cat:'merchandise', catLabel:'Merchandise', sub:'phone-case', scene:'flat-lay', orient:'portrait', lic:'free',
    fmts:['png','jpg'], res:'4000×4000px', soSize:'1000×2000px', areas:2,
    colors:['#F9FAFB','#E5E7EB','#111827'], dl:11200, likes:880, views:49000, rating:4.5, rc:296, comments:38,
    cid:'c7', daysAgo:27, flags:['staff'] },

  { name:'Reusable Water Bottle – Matte', slug:'reusable-water-bottle-matte', desc:'Matte finish stainless steel water bottle with wrap-around label and lid close-up.',
    cat:'merchandise', catLabel:'Merchandise', sub:'water-bottle', scene:'lifestyle', orient:'portrait', lic:'premium',
    fmts:['png','psd'], res:'4000×5000px', soSize:'1800×1400px', areas:2,
    colors:['#374151','#1F2937','#10B981'], dl:5600, likes:460, views:26000, rating:4.7, rc:158, comments:20,
    cid:'c6', daysAgo:38, flags:['premium','new'] },

  { name:'Gift Box – Ribbon & Tag', slug:'gift-box-ribbon-tag', desc:'Premium gift box with silk ribbon and hang tag smart objects. Holiday and luxury brand ready.',
    cat:'merchandise', catLabel:'Merchandise', sub:'gift-box', scene:'lifestyle', orient:'portrait', lic:'free',
    fmts:['png','jpg'], res:'4500×5500px', soSize:'800×600px', areas:3,
    colors:['#FFFFFF','#D4B483','#1F2937'], dl:8800, likes:720, views:40000, rating:4.6, rc:244, comments:31,
    cid:'c2', daysAgo:52, flags:['editors','ai'] },
];

// ─── Build full asset objects ─────────────────────────────────────────────────
function buildAssets(): MockupAsset[] {
  return RAW.map((r, i) => {
    const seed = `amxmock${i}`;
    const [w, h] = r.orient === 'portrait' ? [800, 1000]
                 : r.orient === 'landscape' ? [1200, 800]
                 : [900, 900];
    const flags = r.flags ?? [];
    const daysAgo = r.daysAgo;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const creator = CREATORS.find(c => c.id === r.cid) ?? CREATORS[0];
    return {
      id: `m${i + 1}`,
      slug: r.slug,
      name: r.name,
      description: r.desc,
      category: r.cat,
      categoryLabel: r.catLabel,
      subcategory: r.sub,
      previewUrl: `https://picsum.photos/seed/${seed}/${w}/${h}`,
      thumbUrl:   `https://picsum.photos/seed/${seed}/400/320`,
      additionalPreviews: [
        `https://picsum.photos/seed/${seed}a/800/600`,
        `https://picsum.photos/seed/${seed}b/800/600`,
        `https://picsum.photos/seed/${seed}c/800/600`,
      ],
      dominantColors: r.colors,
      sceneType: r.scene,
      orientation: r.orient,
      license: r.lic,
      formats: r.fmts,
      resolution: r.res,
      smartObjectSize: r.soSize,
      editableAreas: r.areas,
      isPremium: r.lic === 'premium',
      isFree: r.lic === 'free',
      isAiGenerated: flags.includes('ai'),
      isNew: flags.includes('new'),
      isStaffPick: flags.includes('staff'),
      isEditorsChoice: flags.includes('editors'),
      isFeatured: flags.includes('featured'),
      isTrending: flags.includes('trending'),
      downloads: r.dl,
      likes: r.likes,
      views: r.views,
      rating: r.rating,
      ratingCount: r.rc,
      comments: r.comments,
      tags: r.name.toLowerCase().split(/\W+/).filter(t => t.length > 2),
      width: w,
      height: h,
      creator,
      uploadedAt: date.toISOString(),
      updatedAt: date.toISOString(),
    } as MockupAsset;
  });
}

const ALL_ASSETS = buildAssets();

// ─── Default filter state ─────────────────────────────────────────────────────
const DEFAULT_FILTER: MockupFilterState = {
  query: '',
  categoryId: null,
  subcategoryId: null,
  sceneType: null,
  orientation: null,
  license: null,
  formats: [],
  isAiGenerated: null,
  bgColor: null,
  sort: 'popular',
  dateAdded: 'all',
  favoritesOnly: false,
  creatorId: null,
};

@Injectable({ providedIn: 'root' })
export class MockupsService {
  // ── State ─────────────────────────────────────────────────────────────────
  readonly filter   = signal<MockupFilterState>({ ...DEFAULT_FILTER });
  readonly favorites = signal<Set<string>>(this.loadFavorites());
  readonly collections = signal<MockupCollection[]>(this.loadCollections());
  readonly recentSearches = signal<string[]>(this.loadRecentSearches());
  readonly recentlyViewed = signal<string[]>([]);

  // ── Derived ───────────────────────────────────────────────────────────────
  readonly allAssets = ALL_ASSETS;
  readonly categories = MOCKUP_CATEGORIES;
  readonly creators = CREATORS;

  readonly filteredAssets = computed(() => {
    const f = this.filter();
    const favSet = this.favorites();
    let list = [...ALL_ASSETS];

    if (f.query) {
      const q = f.query.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some(t => t.includes(q)) ||
        a.categoryLabel.toLowerCase().includes(q)
      );
    }
    if (f.categoryId)   list = list.filter(a => a.category === f.categoryId);
    if (f.subcategoryId) list = list.filter(a => a.subcategory === f.subcategoryId);
    if (f.sceneType)    list = list.filter(a => a.sceneType === f.sceneType);
    if (f.orientation)  list = list.filter(a => a.orientation === f.orientation);
    if (f.license)      list = list.filter(a => a.license === f.license);
    if (f.isAiGenerated !== null) list = list.filter(a => a.isAiGenerated === f.isAiGenerated);
    if (f.formats.length) list = list.filter(a => f.formats.every(fmt => a.formats.includes(fmt)));
    if (f.favoritesOnly) list = list.filter(a => favSet.has(a.id));
    if (f.creatorId)    list = list.filter(a => a.creator.id === f.creatorId);
    if (f.dateAdded !== 'all') {
      const days = f.dateAdded === 'today' ? 1 : f.dateAdded === 'week' ? 7 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      list = list.filter(a => new Date(a.uploadedAt) >= cutoff);
    }

    switch (f.sort) {
      case 'newest':    list.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)); break;
      case 'downloads': list.sort((a, b) => b.downloads - a.downloads); break;
      case 'views':     list.sort((a, b) => b.views - a.views); break;
      case 'likes':     list.sort((a, b) => b.likes - a.likes); break;
      case 'rating':    list.sort((a, b) => b.rating - a.rating); break;
      default:          list.sort((a, b) => (b.downloads + b.likes * 3) - (a.downloads + a.likes * 3));
    }
    return list;
  });

  readonly featuredAssets   = computed(() => ALL_ASSETS.filter(a => a.isFeatured).slice(0, 8));
  readonly trendingAssets   = computed(() => ALL_ASSETS.filter(a => a.isTrending).slice(0, 8));
  readonly editorsPickAssets = computed(() => ALL_ASSETS.filter(a => a.isEditorsChoice).slice(0, 6));
  readonly staffPickAssets  = computed(() => ALL_ASSETS.filter(a => a.isStaffPick).slice(0, 6));
  readonly newAssets        = computed(() => ALL_ASSETS.filter(a => a.isNew).slice(0, 8));
  readonly freeAssets       = computed(() => ALL_ASSETS.filter(a => a.isFree).slice(0, 8));
  readonly premiumAssets    = computed(() => ALL_ASSETS.filter(a => a.isPremium).slice(0, 8));
  readonly aiAssets         = computed(() => ALL_ASSETS.filter(a => a.isAiGenerated).slice(0, 6));
  readonly deviceAssets     = computed(() => ALL_ASSETS.filter(a => a.category === 'devices').slice(0, 6));
  readonly apparelAssets    = computed(() => ALL_ASSETS.filter(a => a.category === 'apparel').slice(0, 6));
  readonly packagingAssets  = computed(() => ALL_ASSETS.filter(a => a.category === 'packaging').slice(0, 6));
  readonly brandingAssets   = computed(() => ALL_ASSETS.filter(a => a.category === 'branding').slice(0, 6));
  readonly mostDownloaded   = computed(() => [...ALL_ASSETS].sort((a, b) => b.downloads - a.downloads).slice(0, 6));

  // ── Actions ───────────────────────────────────────────────────────────────
  setFilter(patch: Partial<MockupFilterState>): void {
    this.filter.update(f => ({ ...f, ...patch }));
  }
  resetFilter(): void { this.filter.set({ ...DEFAULT_FILTER }); }

  toggleFavorite(id: string): void {
    this.favorites.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem('amx_mockup_favs', JSON.stringify([...next])); } catch {}
      return next;
    });
  }
  isFavorite(id: string): boolean { return this.favorites().has(id); }

  addRecentSearch(q: string): void {
    if (!q.trim()) return;
    this.recentSearches.update(list => {
      const next = [q, ...list.filter(x => x !== q)].slice(0, 10);
      try { localStorage.setItem('amx_mockup_recent_searches', JSON.stringify(next)); } catch {}
      return next;
    });
  }
  clearRecentSearches(): void {
    this.recentSearches.set([]);
    try { localStorage.removeItem('amx_mockup_recent_searches'); } catch {}
  }

  addRecentlyViewed(id: string): void {
    this.recentlyViewed.update(list => [id, ...list.filter(x => x !== id)].slice(0, 20));
  }

  createCollection(name: string): void {
    const col: MockupCollection = { id: Date.now().toString(), name, assetIds: [], isPublic: false, createdAt: new Date().toISOString() };
    this.collections.update(list => { const next = [...list, col]; this.saveCollections(next); return next; });
  }
  addToCollection(colId: string, assetId: string): void {
    this.collections.update(list => {
      const next = list.map(c => c.id === colId && !c.assetIds.includes(assetId) ? { ...c, assetIds: [...c.assetIds, assetId] } : c);
      this.saveCollections(next);
      return next;
    });
  }

  getById(id: string): MockupAsset | undefined { return ALL_ASSETS.find(a => a.id === id); }
  getBySlug(slug: string): MockupAsset | undefined { return ALL_ASSETS.find(a => a.slug === slug); }
  getSimilar(asset: MockupAsset, limit = 6): MockupAsset[] {
    return ALL_ASSETS.filter(a => a.id !== asset.id && (a.category === asset.category || a.sceneType === asset.sceneType)).slice(0, limit);
  }
  getRecentlyViewed(): MockupAsset[] {
    return this.recentlyViewed().map(id => this.getById(id)).filter(Boolean) as MockupAsset[];
  }

  // ── Persistence helpers ───────────────────────────────────────────────────
  private loadFavorites(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem('amx_mockup_favs') ?? '[]')); } catch { return new Set(); }
  }
  private loadCollections(): MockupCollection[] {
    try { return JSON.parse(localStorage.getItem('amx_mockup_collections') ?? '[]'); } catch { return []; }
  }
  private saveCollections(list: MockupCollection[]): void {
    try { localStorage.setItem('amx_mockup_collections', JSON.stringify(list)); } catch {}
  }
  private loadRecentSearches(): string[] {
    try { return JSON.parse(localStorage.getItem('amx_mockup_recent_searches') ?? '[]'); } catch { return []; }
  }
}
