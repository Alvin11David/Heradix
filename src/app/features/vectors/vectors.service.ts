import { Injectable, signal, computed } from '@angular/core';
import {
  VectorAsset, VectorCategory, VectorCollection, VectorFilterState,
  VectorFormat, VectorStyle, VectorLicense, VectorOrientation,
  VectorComplexity, VectorColorMode, VectorSortMode, VectorCreator,
} from '../../core/models/vector.model';

export const TRENDING_TAGS = [
  'flat design','isometric','gradient','minimal','3d render',
  'cartoon','abstract','geometric','watercolor','neon','glassmorphism',
  'retro','clay','hand-drawn','vintage','ai generated','outline','typography',
  'nature','business','tech','medical','holiday','social media',
];

export const TRENDING_COLORS = [
  { name: 'Electric Blue',  hex: '#3B82F6' },
  { name: 'Coral Sunset',   hex: '#F97316' },
  { name: 'Emerald',        hex: '#10B981' },
  { name: 'Violet Dream',   hex: '#8B5CF6' },
  { name: 'Rose Gold',      hex: '#F43F5E' },
  { name: 'Midnight',       hex: '#111827' },
  { name: 'Amber',          hex: '#F59E0B' },
  { name: 'Teal',           hex: '#14B8A6' },
];

export const SEASONAL_COLLECTIONS = [
  { id: 'summer',    label: 'Summer Vibes',    emoji: '☀️', count: 840 },
  { id: 'christmas', label: 'Holiday Season',  emoji: '🎄', count: 620 },
  { id: 'business',  label: 'Back to Business',emoji: '💼', count: 1240 },
  { id: 'nature',    label: 'Earth Day',        emoji: '🌍', count: 380 },
  { id: 'gradient',  label: 'Gradient Mania',  emoji: '🌈', count: 990 },
  { id: 'minimalist',label: 'Less is More',    emoji: '◽', count: 760 },
];

// ─── Mock data (used as fallback when API is unavailable) ────────────────────

const MOCK_CREATORS: VectorCreator[] = [
  { id: 'c1', name: 'StudioPix',   avatar: 'https://i.pravatar.cc/40?img=1',  isVerified: true,  followers: 12400, totalAssets: 348 },
  { id: 'c2', name: 'FlatCraft',   avatar: 'https://i.pravatar.cc/40?img=4',  isVerified: true,  followers: 8900,  totalAssets: 215 },
  { id: 'c3', name: 'VectoArt',    avatar: 'https://i.pravatar.cc/40?img=2',  isVerified: false, followers: 5200,  totalAssets: 127 },
  { id: 'c4', name: 'IconMaker',   avatar: 'https://i.pravatar.cc/40?img=8',  isVerified: true,  followers: 15600, totalAssets: 492 },
  { id: 'c5', name: 'DesignLab',   avatar: 'https://i.pravatar.cc/40?img=12', isVerified: false, followers: 3400,  totalAssets: 89  },
  { id: 'c6', name: 'PixelBrush',  avatar: 'https://i.pravatar.cc/40?img=6',  isVerified: true,  followers: 9800,  totalAssets: 310 },
  { id: 'c7', name: 'ArtFlow',     avatar: 'https://i.pravatar.cc/40?img=9',  isVerified: false, followers: 2100,  totalAssets: 64  },
  { id: 'c8', name: 'CreativeHub', avatar: 'https://i.pravatar.cc/40?img=15', isVerified: true,  followers: 22000, totalAssets: 580 },
];

export const MOCK_CATEGORIES: VectorCategory[] = [
  { id: 'business',   label: 'Business',    icon: '💼', count: 1240, subcategories: [{ id: 'office', label: 'Office' }, { id: 'marketing', label: 'Marketing' }, { id: 'startup', label: 'Startup' }, { id: 'finance', label: 'Finance' }, { id: 'banking', label: 'Banking' }, { id: 'analytics', label: 'Analytics' }] },
  { id: 'technology', label: 'Technology',  icon: '💻', count: 980,  subcategories: [{ id: 'ai', label: 'AI' }, { id: 'programming', label: 'Programming' }, { id: 'cloud', label: 'Cloud' }, { id: 'robotics', label: 'Robotics' }, { id: 'cybersecurity', label: 'Cybersecurity' }, { id: 'blockchain', label: 'Blockchain' }] },
  { id: 'education',  label: 'Education',   icon: '📚', count: 760,  subcategories: [{ id: 'books', label: 'Books' }, { id: 'graduation', label: 'Graduation' }, { id: 'science', label: 'Science' }, { id: 'mathematics', label: 'Mathematics' }] },
  { id: 'medical',    label: 'Medical',     icon: '🏥', count: 640,  subcategories: [{ id: 'doctors', label: 'Doctors' }, { id: 'hospitals', label: 'Hospitals' }, { id: 'pharmacy', label: 'Pharmacy' }, { id: 'dentistry', label: 'Dentistry' }, { id: 'mental-health', label: 'Mental Health' }] },
  { id: 'people',     label: 'People',      icon: '👥', count: 890,  subcategories: [{ id: 'students', label: 'Students' }, { id: 'professionals', label: 'Professionals' }, { id: 'families', label: 'Families' }, { id: 'children', label: 'Children' }, { id: 'diversity', label: 'Diversity' }] },
  { id: 'animals',    label: 'Animals',     icon: '🐾', count: 520,  subcategories: [{ id: 'pets', label: 'Pets' }, { id: 'wildlife', label: 'Wildlife' }, { id: 'birds', label: 'Birds' }, { id: 'marine', label: 'Marine Life' }, { id: 'farm', label: 'Farm Animals' }] },
  { id: 'nature',     label: 'Nature',      icon: '🌿', count: 710,  subcategories: [{ id: 'trees', label: 'Trees' }, { id: 'mountains', label: 'Mountains' }, { id: 'rivers', label: 'Rivers' }, { id: 'flowers', label: 'Flowers' }, { id: 'sky', label: 'Sky' }] },
  { id: 'food',       label: 'Food',        icon: '🍕', count: 830,  subcategories: [{ id: 'fruits', label: 'Fruits' }, { id: 'vegetables', label: 'Vegetables' }, { id: 'drinks', label: 'Drinks' }, { id: 'coffee', label: 'Coffee' }, { id: 'desserts', label: 'Desserts' }, { id: 'fast-food', label: 'Fast Food' }] },
  { id: 'sports',     label: 'Sports',      icon: '⚽', count: 690,  subcategories: [{ id: 'football', label: 'Football' }, { id: 'basketball', label: 'Basketball' }, { id: 'tennis', label: 'Tennis' }, { id: 'running', label: 'Running' }, { id: 'gym', label: 'Gym' }, { id: 'swimming', label: 'Swimming' }] },
  { id: 'travel',     label: 'Travel',      icon: '✈️', count: 770,  subcategories: [{ id: 'hotels', label: 'Hotels' }, { id: 'beaches', label: 'Beaches' }, { id: 'airplanes', label: 'Airplanes' }, { id: 'cars', label: 'Cars' }, { id: 'adventure', label: 'Adventure' }] },
  { id: 'holidays',   label: 'Holidays',    icon: '🎄', count: 580,  subcategories: [{ id: 'christmas', label: 'Christmas' }, { id: 'easter', label: 'Easter' }, { id: 'halloween', label: 'Halloween' }, { id: 'valentine', label: "Valentine's" }, { id: 'new-year', label: 'New Year' }] },
  { id: 'abstract',   label: 'Abstract',    icon: '🔷', count: 920,  subcategories: [{ id: 'patterns', label: 'Patterns' }, { id: 'waves', label: 'Waves' }, { id: 'shapes', label: 'Shapes' }, { id: 'mesh', label: 'Mesh' }, { id: 'geometry', label: 'Geometry' }] },
  { id: 'ui-ux',      label: 'UI & UX',     icon: '🖥️', count: 1100, subcategories: [{ id: 'buttons', label: 'Buttons' }, { id: 'cards', label: 'Cards' }, { id: 'dashboards', label: 'Dashboards' }, { id: 'charts', label: 'Charts' }, { id: 'wireframes', label: 'Wireframes' }] },
  { id: 'logos',      label: 'Logos',       icon: '🔑', count: 860,  subcategories: [{ id: 'brand-marks', label: 'Brand Marks' }, { id: 'monograms', label: 'Monograms' }, { id: 'emblems', label: 'Emblems' }, { id: 'badges', label: 'Badges' }] },
  { id: 'social',     label: 'Social Media',icon: '📱', count: 1040, subcategories: [{ id: 'instagram', label: 'Instagram' }, { id: 'tiktok', label: 'TikTok' }, { id: 'facebook', label: 'Facebook' }, { id: 'youtube', label: 'YouTube' }, { id: 'linkedin', label: 'LinkedIn' }] },
  { id: 'marketing',  label: 'Marketing',   icon: '📣', count: 950,  subcategories: [{ id: 'flyers', label: 'Flyers' }, { id: 'posters', label: 'Posters' }, { id: 'banners', label: 'Banners' }, { id: 'brochures', label: 'Brochures' }, { id: 'presentations', label: 'Presentations' }] },
];

type VecSeed = {
  name: string; slug: string; desc: string;
  cat: string; catLabel: string; sub?: string;
  style: VectorStyle; lic: VectorLicense; fmts: VectorFormat[];
  orient: VectorOrientation; complex: VectorComplexity; cm: VectorColorMode;
  tags: string[]; colors: string[];
  dl: number; likes: number; views: number; rating: number; rc: number; comments: number;
  w: number; h: number; fs: number;
  cid: string; daysAgo: number;
  flags?: string[];
};

const SEEDS: VecSeed[] = [
  // ── BUSINESS ────────────────────────────────────────────────────────────────
  { name:'Corporate Report Cover', slug:'corporate-report-cover', desc:'Professional corporate report cover for business presentations.',
    cat:'business', catLabel:'Business', sub:'office', style:'flat', lic:'commercial', fmts:['svg','eps','ai','pdf'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['office','report','corporate','business','cover'],
    colors:['#3B82F6','#6366F1','#8B5CF6'], dl:12400, likes:843, views:45200, rating:4.7, rc:312, comments:28,
    w:1200, h:800, fs:256, cid:'c1', daysAgo:14 },
  { name:'Marketing Campaign Bundle', slug:'marketing-campaign-bundle', desc:'Complete marketing campaign graphics pack with social media templates.',
    cat:'business', catLabel:'Business', sub:'marketing', style:'gradient', lic:'free', fmts:['svg','png'],
    orient:'landscape', complex:'beginner', cm:'gradient', tags:['marketing','campaign','bundle','social','design'],
    colors:['#F97316','#EF4444','#FBBF24'], dl:8900, likes:620, views:32000, rating:4.5, rc:215, comments:19,
    w:1200, h:800, fs:180, cid:'c2', daysAgo:7, flags:['new'] },
  { name:'Startup Landing Page Kit', slug:'startup-landing-page-kit', desc:'Modern startup landing page UI vector kit with components.',
    cat:'business', catLabel:'Business', sub:'startup', style:'minimal', lic:'premium', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['startup','landing','ui','website','modern'],
    colors:['#10B981','#3B82F6','#FFFFFF'], dl:6200, likes:445, views:28000, rating:4.8, rc:180, comments:14,
    w:1440, h:900, fs:320, cid:'c4', daysAgo:21, flags:['premium','editors'] },
  { name:'Financial Dashboard UI', slug:'financial-dashboard-ui', desc:'Comprehensive financial dashboard with charts and data visualisations.',
    cat:'business', catLabel:'Business', sub:'finance', style:'flat', lic:'commercial', fmts:['svg','ai','pdf'],
    orient:'landscape', complex:'advanced', cm:'multi', tags:['finance','dashboard','chart','analytics','data'],
    colors:['#111827','#3B82F6','#10B981'], dl:5400, likes:380, views:21000, rating:4.6, rc:147, comments:11,
    w:1440, h:900, fs:410, cid:'c6', daysAgo:3, flags:['new','ai'] },
  { name:'Banking App Icons Set', slug:'banking-app-icons-set', desc:'50-piece banking and finance icon set in clean outline style.',
    cat:'business', catLabel:'Business', sub:'banking', style:'outline', lic:'free', fmts:['svg','png'],
    orient:'square', complex:'beginner', cm:'single', tags:['banking','icons','app','finance','outline'],
    colors:['#1D4ED8','#FFFFFF'], dl:9800, likes:720, views:42000, rating:4.4, rc:290, comments:33,
    w:800, h:800, fs:120, cid:'c8', daysAgo:45, flags:['staff'] },
  { name:'Analytics Charts Collection', slug:'analytics-charts-collection', desc:'Beautiful data analytics charts and graphs for business reports.',
    cat:'business', catLabel:'Business', sub:'analytics', style:'flat', lic:'premium', fmts:['svg','eps'],
    orient:'landscape', complex:'advanced', cm:'multi', tags:['analytics','charts','data','visualization','business'],
    colors:['#8B5CF6','#EC4899','#3B82F6'], dl:4200, likes:310, views:17000, rating:4.7, rc:120, comments:8,
    w:1200, h:800, fs:380, cid:'c1', daysAgo:60, flags:['premium'] },
  { name:'Business Cards Collection', slug:'business-cards-collection', desc:'Professional business card designs for multiple industries.',
    cat:'business', catLabel:'Business', sub:'office', style:'minimal', lic:'free', fmts:['svg','eps','ai','pdf','cdr'],
    orient:'portrait', complex:'medium', cm:'multi', tags:['business','cards','design','professional','branding'],
    colors:['#111827','#F97316','#FFFFFF'], dl:7600, likes:540, views:31000, rating:4.3, rc:198, comments:22,
    w:900, h:500, fs:210, cid:'c3', daysAgo:90 },
  { name:'Finance Infographic Set', slug:'finance-infographic-set', desc:'Modern financial infographics for annual reports and presentations.',
    cat:'business', catLabel:'Business', sub:'finance', style:'flat', lic:'commercial', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['finance','infographic','report','data','annual'],
    colors:['#059669','#047857','#ECFDF5'], dl:3800, likes:280, views:14500, rating:4.5, rc:95, comments:7,
    w:1200, h:800, fs:290, cid:'c5', daysAgo:30 },

  // ── TECHNOLOGY ──────────────────────────────────────────────────────────────
  { name:'AI Neural Network Illustration', slug:'ai-neural-network-illustration', desc:'Futuristic AI neural network and machine learning visual.',
    cat:'technology', catLabel:'Technology', sub:'ai', style:'gradient', lic:'commercial', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'advanced', cm:'gradient', tags:['ai','neural','machine learning','tech','futuristic'],
    colors:['#6366F1','#8B5CF6','#EC4899'], dl:11200, likes:890, views:52000, rating:4.9, rc:340, comments:41,
    w:1400, h:900, fs:480, cid:'c4', daysAgo:5, flags:['new','ai','staff','editors'] },
  { name:'Programming Code Icons', slug:'programming-code-icons', desc:'Developer-focused code and programming icons in outline style.',
    cat:'technology', catLabel:'Technology', sub:'programming', style:'outline', lic:'free', fmts:['svg','png'],
    orient:'square', complex:'beginner', cm:'single', tags:['programming','code','developer','icons','tech'],
    colors:['#10B981','#FFFFFF'], dl:15600, likes:1120, views:68000, rating:4.6, rc:420, comments:55,
    w:800, h:800, fs:95, cid:'c8', daysAgo:20, flags:['staff'] },
  { name:'Cloud Computing Infographic', slug:'cloud-computing-infographic', desc:'Cloud infrastructure and computing concept vector illustration.',
    cat:'technology', catLabel:'Technology', sub:'cloud', style:'isometric', lic:'premium', fmts:['svg','eps','ai','pdf'],
    orient:'landscape', complex:'advanced', cm:'multi', tags:['cloud','computing','infrastructure','isometric','server'],
    colors:['#3B82F6','#60A5FA','#DBEAFE'], dl:5800, likes:420, views:24000, rating:4.7, rc:165, comments:12,
    w:1200, h:800, fs:560, cid:'c6', daysAgo:35, flags:['premium'] },
  { name:'Cybersecurity Shield Pack', slug:'cybersecurity-shield-pack', desc:'Cybersecurity and data protection vector icons and illustrations.',
    cat:'technology', catLabel:'Technology', sub:'cybersecurity', style:'flat', lic:'commercial', fmts:['svg','png'],
    orient:'square', complex:'medium', cm:'multi', tags:['cybersecurity','security','shield','protection','data'],
    colors:['#DC2626','#111827','#F59E0B'], dl:4400, likes:330, views:18900, rating:4.5, rc:128, comments:9,
    w:800, h:800, fs:185, cid:'c1', daysAgo:28 },
  { name:'Blockchain Network Visual', slug:'blockchain-network-visual', desc:'Abstract blockchain and cryptocurrency network illustration.',
    cat:'technology', catLabel:'Technology', sub:'blockchain', style:'gradient', lic:'free', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'gradient', tags:['blockchain','crypto','network','web3','technology'],
    colors:['#F59E0B','#D97706','#FEF3C7'], dl:6700, likes:510, views:27500, rating:4.3, rc:182, comments:16,
    w:1200, h:700, fs:245, cid:'c3', daysAgo:10, flags:['new','ai'] },
  { name:'Robotics Engineer Scene', slug:'robotics-engineer-scene', desc:'Futuristic robotics and automation engineering illustration.',
    cat:'technology', catLabel:'Technology', sub:'robotics', style:'cartoon', lic:'premium', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'advanced', cm:'multi', tags:['robotics','automation','engineer','future','robot'],
    colors:['#6366F1','#4F46E5','#EDE9FE'], dl:3200, likes:245, views:13000, rating:4.8, rc:88, comments:6,
    w:1400, h:900, fs:640, cid:'c7', daysAgo:50, flags:['premium','editors'] },
  { name:'Tech Startup UI Components', slug:'tech-startup-ui-components', desc:'Modern tech startup UI component library for digital products.',
    cat:'technology', catLabel:'Technology', sub:'programming', style:'minimal', lic:'free', fmts:['svg','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['ui','components','startup','design system','modern'],
    colors:['#111827','#3B82F6','#F9FAFB'], dl:13400, likes:970, views:58000, rating:4.7, rc:378, comments:48,
    w:1440, h:900, fs:320, cid:'c4', daysAgo:15, flags:['staff'] },
  { name:'VR Technology Scene', slug:'vr-technology-scene', desc:'Virtual reality and augmented reality technology concept art.',
    cat:'technology', catLabel:'Technology', sub:'ai', style:'3d', lic:'commercial', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'advanced', cm:'gradient', tags:['vr','virtual reality','ar','technology','3d','futuristic'],
    colors:['#8B5CF6','#6D28D9','#DDD6FE'], dl:2900, likes:215, views:11200, rating:4.6, rc:72, comments:5,
    w:1200, h:800, fs:720, cid:'c6', daysAgo:8, flags:['new','ai'] },

  // ── EDUCATION ───────────────────────────────────────────────────────────────
  { name:'School Backpack Icons', slug:'school-backpack-icons', desc:'Cute and colorful school and education icon pack.',
    cat:'education', catLabel:'Education', sub:'books', style:'flat', lic:'free', fmts:['svg','png'],
    orient:'square', complex:'beginner', cm:'multi', tags:['school','education','icons','kids','backpack'],
    colors:['#F97316','#FBBF24','#34D399'], dl:10200, likes:760, views:39000, rating:4.5, rc:285, comments:31,
    w:800, h:800, fs:140, cid:'c2', daysAgo:25 },
  { name:'Graduation Celebration Pack', slug:'graduation-celebration-pack', desc:'Graduation party and ceremony vector illustration set.',
    cat:'education', catLabel:'Education', sub:'graduation', style:'cartoon', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['graduation','celebration','diploma','university','ceremony'],
    colors:['#7C3AED','#FCD34D','#111827'], dl:8400, likes:610, views:34000, rating:4.6, rc:240, comments:27,
    w:1200, h:800, fs:380, cid:'c5', daysAgo:18, flags:['new'] },
  { name:'Science Lab Equipment', slug:'science-lab-equipment', desc:'Detailed science laboratory equipment and chemistry icons.',
    cat:'education', catLabel:'Education', sub:'science', style:'outline', lic:'commercial', fmts:['svg','eps','ai'],
    orient:'square', complex:'medium', cm:'single', tags:['science','lab','chemistry','education','research'],
    colors:['#0EA5E9','#FFFFFF','#F0F9FF'], dl:4600, likes:345, views:19500, rating:4.4, rc:130, comments:10,
    w:800, h:800, fs:190, cid:'c4', daysAgo:40 },
  { name:'Mathematics Formula Vectors', slug:'mathematics-formula-vectors', desc:'Mathematical symbols, formulas, and geometry illustrations.',
    cat:'education', catLabel:'Education', sub:'mathematics', style:'minimal', lic:'free', fmts:['svg','png'],
    orient:'square', complex:'advanced', cm:'single', tags:['math','mathematics','formula','geometry','symbols'],
    colors:['#111827','#3B82F6'], dl:5800, likes:420, views:23000, rating:4.3, rc:165, comments:14,
    w:800, h:800, fs:95, cid:'c8', daysAgo:55 },
  { name:'Online Learning Platform UI', slug:'online-learning-platform-ui', desc:'E-learning platform interface vectors with course cards.',
    cat:'education', catLabel:'Education', sub:'books', style:'flat', lic:'premium', fmts:['svg','ai','pdf'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['elearning','online','platform','ui','education'],
    colors:['#3B82F6','#10B981','#FFFFFF'], dl:3400, likes:255, views:14000, rating:4.7, rc:98, comments:8,
    w:1440, h:900, fs:420, cid:'c6', daysAgo:12, flags:['premium'] },
  { name:'Campus Life Illustrations', slug:'campus-life-illustrations', desc:'University campus life scene illustrations with students.',
    cat:'education', catLabel:'Education', sub:'graduation', style:'cartoon', lic:'commercial', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['campus','university','students','college','life'],
    colors:['#F97316','#3B82F6','#10B981'], dl:6200, likes:475, views:27000, rating:4.5, rc:196, comments:20,
    w:1200, h:800, fs:520, cid:'c3', daysAgo:32 },
  { name:'Book Collection Icons', slug:'book-collection-icons', desc:'Classic and modern book icon collection for libraries and apps.',
    cat:'education', catLabel:'Education', sub:'books', style:'flat', lic:'free', fmts:['svg','png'],
    orient:'square', complex:'beginner', cm:'multi', tags:['books','library','reading','icons','literature'],
    colors:['#92400E','#D97706','#FEF3C7'], dl:9100, likes:670, views:37000, rating:4.4, rc:262, comments:29,
    w:800, h:800, fs:110, cid:'c1', daysAgo:70 },
  { name:'Study Room Scene', slug:'study-room-scene', desc:'Cozy study room and workspace flat vector illustration.',
    cat:'education', catLabel:'Education', sub:'books', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['study','room','desk','workspace','cozy'],
    colors:['#7C3AED','#EDE9FE','#F5F3FF'], dl:5500, likes:410, views:22000, rating:4.6, rc:152, comments:13,
    w:1200, h:800, fs:310, cid:'c7', daysAgo:22 },

  // ── MEDICAL ─────────────────────────────────────────────────────────────────
  { name:'Doctor Character Set', slug:'doctor-character-set', desc:'Friendly doctor and nurse character illustrations for healthcare.',
    cat:'medical', catLabel:'Medical', sub:'doctors', style:'cartoon', lic:'free', fmts:['svg','eps','png'],
    orient:'portrait', complex:'medium', cm:'multi', tags:['doctor','nurse','healthcare','character','medical'],
    colors:['#0EA5E9','#FFFFFF','#F0F9FF'], dl:9600, likes:710, views:41000, rating:4.6, rc:298, comments:35,
    w:800, h:1100, fs:420, cid:'c2', daysAgo:16 },
  { name:'Hospital Building Icons', slug:'hospital-building-icons', desc:'Medical facility and hospital building icon collection.',
    cat:'medical', catLabel:'Medical', sub:'hospitals', style:'outline', lic:'commercial', fmts:['svg','png'],
    orient:'square', complex:'beginner', cm:'single', tags:['hospital','building','medical','icons','healthcare'],
    colors:['#DC2626','#FFFFFF'], dl:4800, likes:355, views:19800, rating:4.3, rc:135, comments:9,
    w:800, h:800, fs:120, cid:'c5', daysAgo:42 },
  { name:'Medical Icons Complete Pack', slug:'medical-icons-complete-pack', desc:'200+ comprehensive medical and health care vector icons.',
    cat:'medical', catLabel:'Medical', sub:'hospitals', style:'flat', lic:'premium', fmts:['svg','eps','ai'],
    orient:'square', complex:'medium', cm:'multi', tags:['medical','icons','healthcare','symbols','health'],
    colors:['#10B981','#ECFDF5','#111827'], dl:6700, likes:490, views:28500, rating:4.8, rc:204, comments:18,
    w:800, h:800, fs:680, cid:'c4', daysAgo:28, flags:['premium','editors'] },
  { name:'Mental Health Support Vectors', slug:'mental-health-support-vectors', desc:'Mental wellness and mindfulness illustration set.',
    cat:'medical', catLabel:'Medical', sub:'mental-health', style:'watercolor', lic:'free', fmts:['svg','png'],
    orient:'square', complex:'medium', cm:'multi', tags:['mental health','mindfulness','wellness','therapy','self care'],
    colors:['#8B5CF6','#DDD6FE','#F5F3FF'], dl:12300, likes:940, views:54000, rating:4.9, rc:380, comments:52,
    w:800, h:800, fs:290, cid:'c6', daysAgo:9, flags:['new','staff','editors'] },
  { name:'Pharmacy Icons Collection', slug:'pharmacy-icons-collection', desc:'Pharmacy, medicine, and drug-related vector icon pack.',
    cat:'medical', catLabel:'Medical', sub:'pharmacy', style:'flat', lic:'free', fmts:['svg','png'],
    orient:'square', complex:'beginner', cm:'multi', tags:['pharmacy','medicine','drug','pill','health'],
    colors:['#10B981','#D1FAE5','#FFFFFF'], dl:7200, likes:530, views:30000, rating:4.4, rc:210, comments:22,
    w:800, h:800, fs:155, cid:'c8', daysAgo:50 },
  { name:'Dentist Office Illustration', slug:'dentist-office-illustration', desc:'Dental clinic scene and tooth care vector illustrations.',
    cat:'medical', catLabel:'Medical', sub:'dentistry', style:'cartoon', lic:'commercial', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['dental','dentist','teeth','oral care','clinic'],
    colors:['#0EA5E9','#FFFFFF','#BAE6FD'], dl:3500, likes:265, views:14800, rating:4.5, rc:102, comments:8,
    w:1200, h:800, fs:380, cid:'c3', daysAgo:38 },
  { name:'First Aid Kit Icons', slug:'first-aid-kit-icons', desc:'Emergency first aid kit and medical equipment icon set.',
    cat:'medical', catLabel:'Medical', sub:'hospitals', style:'outline', lic:'free', fmts:['svg','png'],
    orient:'square', complex:'beginner', cm:'single', tags:['first aid','emergency','medical','kit','icons'],
    colors:['#DC2626','#FFFFFF'], dl:6100, likes:455, views:25500, rating:4.3, rc:182, comments:15,
    w:800, h:800, fs:100, cid:'c1', daysAgo:62 },
  { name:'Medical Certificate Templates', slug:'medical-certificate-templates', desc:'Professional medical certificate and diploma vector templates.',
    cat:'medical', catLabel:'Medical', sub:'doctors', style:'minimal', lic:'premium', fmts:['svg','ai','pdf'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['certificate','medical','diploma','award','professional'],
    colors:['#111827','#D97706','#FEF3C7'], dl:2800, likes:210, views:11500, rating:4.6, rc:80, comments:5,
    w:1200, h:800, fs:240, cid:'c7', daysAgo:25, flags:['premium'] },

  // ── PEOPLE ──────────────────────────────────────────────────────────────────
  { name:'Diverse Team Characters', slug:'diverse-team-characters', desc:'Inclusive and diverse team of professional character vectors.',
    cat:'people', catLabel:'People', sub:'professionals', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['diverse','team','characters','people','inclusion'],
    colors:['#F97316','#3B82F6','#10B981'], dl:16800, likes:1240, views:72000, rating:4.8, rc:480, comments:64,
    w:1400, h:900, fs:580, cid:'c4', daysAgo:11, flags:['new','staff','editors'] },
  { name:'Family Portrait Illustrations', slug:'family-portrait-illustrations', desc:'Warm and loving family portrait vector illustrations.',
    cat:'people', catLabel:'People', sub:'families', style:'cartoon', lic:'free', fmts:['svg','eps','png'],
    orient:'portrait', complex:'medium', cm:'multi', tags:['family','portrait','kids','parents','home'],
    colors:['#F59E0B','#FBBF24','#FEF3C7'], dl:9400, likes:690, views:38000, rating:4.6, rc:272, comments:31,
    w:900, h:1200, fs:460, cid:'c2', daysAgo:19 },
  { name:'Students Study Group', slug:'students-study-group', desc:'University students studying together vector scene illustrations.',
    cat:'people', catLabel:'People', sub:'students', style:'flat', lic:'commercial', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['students','study','group','university','learning'],
    colors:['#3B82F6','#60A5FA','#DBEAFE'], dl:5600, likes:415, views:23000, rating:4.5, rc:158, comments:13,
    w:1200, h:800, fs:340, cid:'c5', daysAgo:33 },
  { name:'Children Playing Scene', slug:'children-playing-scene', desc:'Happy children playing outdoors in colorful vector style.',
    cat:'people', catLabel:'People', sub:'children', style:'cartoon', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['children','kids','playing','fun','outdoor'],
    colors:['#EF4444','#FBBF24','#34D399'], dl:11200, likes:840, views:48000, rating:4.7, rc:322, comments:42,
    w:1400, h:800, fs:520, cid:'c8', daysAgo:14 },
  { name:'Senior Couple Illustrations', slug:'senior-couple-illustrations', desc:'Elderly couple lifestyle and wellness vector illustrations.',
    cat:'people', catLabel:'People', sub:'diversity', style:'flat', lic:'free', fmts:['svg','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['senior','elderly','couple','lifestyle','wellness'],
    colors:['#6366F1','#A5B4FC','#EEF2FF'], dl:4200, likes:315, views:17000, rating:4.4, rc:118, comments:10,
    w:1200, h:800, fs:280, cid:'c3', daysAgo:45 },
  { name:'Business Professional Icons', slug:'business-professional-icons', desc:'Professional business people avatar and character icon set.',
    cat:'people', catLabel:'People', sub:'professionals', style:'flat', lic:'commercial', fmts:['svg','eps','ai','png'],
    orient:'square', complex:'beginner', cm:'multi', tags:['business','professional','avatar','character','icons'],
    colors:['#111827','#3B82F6','#F97316'], dl:13600, likes:1010, views:58000, rating:4.5, rc:390, comments:47,
    w:800, h:800, fs:220, cid:'c6', daysAgo:26, flags:['staff'] },
  { name:'Youth Sports Team Vectors', slug:'youth-sports-team-vectors', desc:'Active youth team sports and athletic activity illustrations.',
    cat:'people', catLabel:'People', sub:'children', style:'cartoon', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['youth','sports','team','athletic','active'],
    colors:['#EF4444','#FBBF24','#3B82F6'], dl:6800, likes:505, views:28500, rating:4.6, rc:196, comments:21,
    w:1200, h:800, fs:440, cid:'c1', daysAgo:37 },
  { name:'Diversity Inclusion Concept', slug:'diversity-inclusion-concept', desc:'Diversity and inclusion abstract concept vector illustration.',
    cat:'people', catLabel:'People', sub:'diversity', style:'gradient', lic:'commercial', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'gradient', tags:['diversity','inclusion','equality','concept','abstract'],
    colors:['#F43F5E','#F97316','#FBBF24'], dl:3400, likes:255, views:14000, rating:4.7, rc:95, comments:7,
    w:1200, h:800, fs:195, cid:'c7', daysAgo:20, flags:['new'] },

  // ── ANIMALS ─────────────────────────────────────────────────────────────────
  { name:'Cat and Dog Pet Icons', slug:'cat-and-dog-pet-icons', desc:'Adorable cat and dog pet icon collection in flat style.',
    cat:'animals', catLabel:'Animals', sub:'pets', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'square', complex:'beginner', cm:'multi', tags:['cat','dog','pet','icons','animal'],
    colors:['#F97316','#92400E','#FEF3C7'], dl:14200, likes:1060, views:61000, rating:4.7, rc:422, comments:58,
    w:800, h:800, fs:185, cid:'c2', daysAgo:12, flags:['staff'] },
  { name:'Wildlife Safari Illustration', slug:'wildlife-safari-illustration', desc:'African safari wildlife scene with animals in natural habitat.',
    cat:'animals', catLabel:'Animals', sub:'wildlife', style:'flat', lic:'commercial', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'advanced', cm:'multi', tags:['safari','wildlife','africa','animals','nature'],
    colors:['#D97706','#92400E','#FEF3C7'], dl:5600, likes:420, views:23500, rating:4.6, rc:165, comments:15,
    w:1400, h:900, fs:650, cid:'c5', daysAgo:28 },
  { name:'Tropical Birds Collection', slug:'tropical-birds-collection', desc:'Colorful tropical bird illustrations in vibrant flat style.',
    cat:'animals', catLabel:'Animals', sub:'birds', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'portrait', complex:'medium', cm:'multi', tags:['tropical','birds','parrot','colorful','nature'],
    colors:['#10B981','#EF4444','#FBBF24'], dl:8700, likes:645, views:36000, rating:4.5, rc:240, comments:28,
    w:800, h:1100, fs:420, cid:'c4', daysAgo:21 },
  { name:'Ocean Marine Life Pack', slug:'ocean-marine-life-pack', desc:'Deep sea marine life and ocean creature vector illustrations.',
    cat:'animals', catLabel:'Animals', sub:'marine', style:'cartoon', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['ocean','marine','fish','dolphin','coral reef'],
    colors:['#0EA5E9','#0284C7','#BAE6FD'], dl:9300, likes:690, views:40000, rating:4.7, rc:278, comments:34,
    w:1400, h:900, fs:580, cid:'c8', daysAgo:16, flags:['new','editors'] },
  { name:'Farm Animals Scene', slug:'farm-animals-scene', desc:'Cute farm animal scene with barn and countryside setting.',
    cat:'animals', catLabel:'Animals', sub:'farm', style:'cartoon', lic:'commercial', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['farm','animals','barn','countryside','rural'],
    colors:['#34D399','#FBBF24','#F97316'], dl:6100, likes:455, views:25500, rating:4.4, rc:180, comments:19,
    w:1400, h:900, fs:490, cid:'c3', daysAgo:42 },
  { name:'Pet Care Icons Set', slug:'pet-care-icons-set', desc:'Comprehensive pet care and veterinary service icon collection.',
    cat:'animals', catLabel:'Animals', sub:'pets', style:'outline', lic:'free', fmts:['svg','png'],
    orient:'square', complex:'beginner', cm:'single', tags:['pet care','veterinary','grooming','icons','animal'],
    colors:['#10B981','#FFFFFF'], dl:7800, likes:580, views:32000, rating:4.3, rc:218, comments:23,
    w:800, h:800, fs:110, cid:'c6', daysAgo:55 },
  { name:'Zoo Animals Illustration', slug:'zoo-animals-illustration', desc:'Zoo animals collection with giraffe, lion, and elephant.',
    cat:'animals', catLabel:'Animals', sub:'wildlife', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['zoo','animals','giraffe','lion','elephant'],
    colors:['#D97706','#92400E','#34D399'], dl:5200, likes:390, views:21000, rating:4.5, rc:150, comments:12,
    w:1400, h:900, fs:540, cid:'c1', daysAgo:35 },
  { name:'Insect and Bug Collection', slug:'insect-bug-collection', desc:'Detailed insect and bug vector illustrations for nature projects.',
    cat:'animals', catLabel:'Animals', sub:'wildlife', style:'flat', lic:'commercial', fmts:['svg','eps'],
    orient:'square', complex:'advanced', cm:'multi', tags:['insect','bug','butterfly','bee','nature'],
    colors:['#059669','#34D399','#ECFDF5'], dl:2400, likes:180, views:9500, rating:4.4, rc:68, comments:5,
    w:800, h:800, fs:320, cid:'c7', daysAgo:48 },

  // ── NATURE ──────────────────────────────────────────────────────────────────
  { name:'Forest Trees Panorama', slug:'forest-trees-panorama', desc:'Misty forest panorama with tall trees and morning light.',
    cat:'nature', catLabel:'Nature', sub:'trees', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['forest','trees','nature','panorama','green'],
    colors:['#059669','#065F46','#ECFDF5'], dl:11400, likes:855, views:49000, rating:4.6, rc:338, comments:42,
    w:1600, h:800, fs:380, cid:'c8', daysAgo:18 },
  { name:'Mountain Landscape Pack', slug:'mountain-landscape-pack', desc:'Dramatic mountain and alpine landscape vector collection.',
    cat:'nature', catLabel:'Nature', sub:'mountains', style:'flat', lic:'commercial', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['mountain','landscape','alpine','scenic','outdoor'],
    colors:['#60A5FA','#9CA3AF','#FFFFFF'], dl:7600, likes:570, views:32000, rating:4.7, rc:224, comments:25,
    w:1600, h:900, fs:440, cid:'c5', daysAgo:30, flags:['editors'] },
  { name:'Tropical Flowers Collection', slug:'tropical-flowers-collection', desc:'Lush tropical flowers and botanical watercolor illustrations.',
    cat:'nature', catLabel:'Nature', sub:'flowers', style:'watercolor', lic:'free', fmts:['svg','eps','png'],
    orient:'square', complex:'medium', cm:'multi', tags:['tropical','flowers','botanical','watercolor','floral'],
    colors:['#EC4899','#F97316','#34D399'], dl:13200, likes:985, views:57000, rating:4.8, rc:392, comments:52,
    w:900, h:900, fs:520, cid:'c2', daysAgo:8, flags:['new','staff'] },
  { name:'Sky and Clouds Vectors', slug:'sky-and-clouds-vectors', desc:'Beautiful sky, cloud, and weather vector illustration set.',
    cat:'nature', catLabel:'Nature', sub:'sky', style:'flat', lic:'free', fmts:['svg','png'],
    orient:'landscape', complex:'beginner', cm:'gradient', tags:['sky','clouds','weather','blue','nature'],
    colors:['#60A5FA','#93C5FD','#DBEAFE'], dl:9800, likes:730, views:42000, rating:4.5, rc:288, comments:33,
    w:1400, h:800, fs:220, cid:'c4', daysAgo:24 },
  { name:'Desert Landscape Scene', slug:'desert-landscape-scene', desc:'Arid desert and dune landscape illustrations with cactus.',
    cat:'nature', catLabel:'Nature', sub:'mountains', style:'flat', lic:'commercial', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['desert','sand','dunes','cactus','landscape'],
    colors:['#D97706','#F59E0B','#FEF3C7'], dl:4100, likes:308, views:17000, rating:4.4, rc:112, comments:9,
    w:1400, h:800, fs:315, cid:'c6', daysAgo:52 },
  { name:'Rainforest Eco System', slug:'rainforest-eco-system', desc:'Amazon rainforest ecosystem with diverse flora and fauna.',
    cat:'nature', catLabel:'Nature', sub:'trees', style:'flat', lic:'free', fmts:['svg','eps','ai','png'],
    orient:'landscape', complex:'advanced', cm:'multi', tags:['rainforest','amazon','ecology','biodiversity','green'],
    colors:['#065F46','#10B981','#D1FAE5'], dl:5700, likes:425, views:23500, rating:4.7, rc:168, comments:14,
    w:1600, h:900, fs:610, cid:'c1', daysAgo:16, flags:['editors'] },
  { name:'River Flow Illustrations', slug:'river-flow-illustrations', desc:'Serene river and waterfall landscape vector illustrations.',
    cat:'nature', catLabel:'Nature', sub:'rivers', style:'flat', lic:'commercial', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['river','waterfall','stream','water','landscape'],
    colors:['#0EA5E9','#38BDF8','#E0F2FE'], dl:4600, likes:345, views:19000, rating:4.5, rc:130, comments:11,
    w:1400, h:800, fs:350, cid:'c3', daysAgo:41 },
  { name:'Winter Arctic Tundra', slug:'winter-arctic-tundra', desc:'Snowy arctic tundra and polar landscape vector scene.',
    cat:'nature', catLabel:'Nature', sub:'mountains', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['arctic','winter','snow','polar','tundra'],
    colors:['#DBEAFE','#93C5FD','#FFFFFF'], dl:3900, likes:292, views:16000, rating:4.3, rc:108, comments:8,
    w:1400, h:800, fs:280, cid:'c7', daysAgo:60 },

  // ── FOOD ────────────────────────────────────────────────────────────────────
  { name:'Fresh Fruits Market', slug:'fresh-fruits-market', desc:'Colorful fresh fruits market illustration with variety of produce.',
    cat:'food', catLabel:'Food', sub:'fruits', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['fruits','food','market','fresh','healthy'],
    colors:['#EF4444','#F97316','#FBBF24'], dl:12600, likes:940, views:54000, rating:4.6, rc:362, comments:48,
    w:1200, h:800, fs:460, cid:'c4', daysAgo:10, flags:['new'] },
  { name:'Coffee Shop Scene', slug:'coffee-shop-scene', desc:'Cozy coffee shop atmosphere vector illustration with barista.',
    cat:'food', catLabel:'Food', sub:'coffee', style:'flat', lic:'commercial', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['coffee','cafe','barista','cozy','drink'],
    colors:['#92400E','#D97706','#FEF3C7'], dl:8900, likes:660, views:37000, rating:4.7, rc:258, comments:32,
    w:1200, h:800, fs:540, cid:'c6', daysAgo:22, flags:['editors'] },
  { name:'Dessert and Bakery Icons', slug:'dessert-bakery-icons', desc:'Sweet desserts and bakery product icon collection.',
    cat:'food', catLabel:'Food', sub:'desserts', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'square', complex:'beginner', cm:'multi', tags:['dessert','bakery','cake','sweet','icons'],
    colors:['#EC4899','#F9A8D4','#FDF2F8'], dl:10200, likes:760, views:44000, rating:4.5, rc:308, comments:38,
    w:800, h:800, fs:180, cid:'c2', daysAgo:15 },
  { name:'Fast Food Restaurant Icons', slug:'fast-food-restaurant-icons', desc:'Fast food and restaurant menu icon collection.',
    cat:'food', catLabel:'Food', sub:'fast-food', style:'flat', lic:'free', fmts:['svg','png'],
    orient:'square', complex:'beginner', cm:'multi', tags:['fast food','restaurant','burger','pizza','icons'],
    colors:['#EF4444','#FBBF24','#111827'], dl:13400, likes:1000, views:58000, rating:4.4, rc:398, comments:52,
    w:800, h:800, fs:145, cid:'c8', daysAgo:18 },
  { name:'Wine and Beverages Pack', slug:'wine-beverages-pack', desc:'Premium wine, cocktail and beverage vector illustration set.',
    cat:'food', catLabel:'Food', sub:'drinks', style:'minimal', lic:'premium', fmts:['svg','eps','ai'],
    orient:'portrait', complex:'medium', cm:'multi', tags:['wine','beverage','cocktail','drink','premium'],
    colors:['#7C3AED','#8B5CF6','#EDE9FE'], dl:4300, likes:320, views:18000, rating:4.8, rc:125, comments:10,
    w:800, h:1100, fs:340, cid:'c1', daysAgo:35, flags:['premium'] },
  { name:'Vegetables Garden Vectors', slug:'vegetables-garden-vectors', desc:'Fresh garden vegetables vector illustration and icons.',
    cat:'food', catLabel:'Food', sub:'vegetables', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'square', complex:'beginner', cm:'multi', tags:['vegetables','garden','organic','food','healthy'],
    colors:['#059669','#34D399','#D1FAE5'], dl:7400, likes:555, views:30500, rating:4.4, rc:218, comments:24,
    w:800, h:800, fs:200, cid:'c5', daysAgo:28 },
  { name:'Restaurant Menu Template', slug:'restaurant-menu-template', desc:'Elegant restaurant menu design with food category sections.',
    cat:'food', catLabel:'Food', sub:'fast-food', style:'minimal', lic:'premium', fmts:['svg','ai','pdf'],
    orient:'portrait', complex:'medium', cm:'multi', tags:['restaurant','menu','elegant','design','template'],
    colors:['#111827','#D97706','#FEF3C7'], dl:3600, likes:270, views:14500, rating:4.6, rc:102, comments:8,
    w:900, h:1200, fs:290, cid:'c7', daysAgo:20, flags:['premium'] },
  { name:'Healthy Food Infographic', slug:'healthy-food-infographic', desc:'Nutrition and healthy eating infographic vector illustration.',
    cat:'food', catLabel:'Food', sub:'fruits', style:'flat', lic:'commercial', fmts:['svg','eps'],
    orient:'portrait', complex:'medium', cm:'multi', tags:['healthy','nutrition','food','infographic','diet'],
    colors:['#10B981','#34D399','#ECFDF5'], dl:5800, likes:435, views:24000, rating:4.5, rc:165, comments:16,
    w:900, h:1200, fs:380, cid:'c3', daysAgo:40 },

  // ── SPORTS ──────────────────────────────────────────────────────────────────
  { name:'Football Stadium Scene', slug:'football-stadium-scene', desc:'Epic football stadium match night scene vector illustration.',
    cat:'sports', catLabel:'Sports', sub:'football', style:'flat', lic:'commercial', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'advanced', cm:'multi', tags:['football','stadium','match','sport','night'],
    colors:['#16A34A','#FFFFFF','#111827'], dl:9200, likes:685, views:39500, rating:4.6, rc:272, comments:36,
    w:1600, h:900, fs:580, cid:'c6', daysAgo:13, flags:['new'] },
  { name:'Basketball Court Vectors', slug:'basketball-court-vectors', desc:'Basketball court and player action vector illustrations.',
    cat:'sports', catLabel:'Sports', sub:'basketball', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['basketball','court','sport','player','action'],
    colors:['#EA580C','#111827','#FFFFFF'], dl:7400, likes:555, views:32000, rating:4.5, rc:220, comments:26,
    w:1400, h:900, fs:420, cid:'c4', daysAgo:25 },
  { name:'Tennis Match Illustration', slug:'tennis-match-illustration', desc:'Professional tennis match and racket sport vector art.',
    cat:'sports', catLabel:'Sports', sub:'tennis', style:'flat', lic:'commercial', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['tennis','sport','match','court','racket'],
    colors:['#FBBF24','#16A34A','#FFFFFF'], dl:4100, likes:308, views:17000, rating:4.4, rc:115, comments:10,
    w:1400, h:900, fs:360, cid:'c3', daysAgo:38 },
  { name:'Running Marathon Pack', slug:'running-marathon-pack', desc:'Marathon running and athletics vector illustration set.',
    cat:'sports', catLabel:'Sports', sub:'running', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['running','marathon','athletics','sport','fitness'],
    colors:['#EF4444','#F97316','#FEF2F2'], dl:8600, likes:640, views:36000, rating:4.6, rc:255, comments:29,
    w:1400, h:900, fs:390, cid:'c8', daysAgo:20, flags:['new'] },
  { name:'Gym Equipment Icons', slug:'gym-equipment-icons', desc:'Gym and fitness equipment icon collection for sports apps.',
    cat:'sports', catLabel:'Sports', sub:'gym', style:'outline', lic:'free', fmts:['svg','png'],
    orient:'square', complex:'beginner', cm:'single', tags:['gym','fitness','equipment','icons','workout'],
    colors:['#111827','#FFFFFF'], dl:11400, likes:850, views:49000, rating:4.4, rc:338, comments:44,
    w:800, h:800, fs:115, cid:'c1', daysAgo:44 },
  { name:'Swimming Pool Competition', slug:'swimming-pool-competition', desc:'Olympic swimming pool competition vector illustration.',
    cat:'sports', catLabel:'Sports', sub:'swimming', style:'flat', lic:'commercial', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['swimming','pool','competition','olympic','water'],
    colors:['#0EA5E9','#38BDF8','#E0F2FE'], dl:3600, likes:270, views:15000, rating:4.5, rc:102, comments:8,
    w:1400, h:900, fs:340, cid:'c5', daysAgo:30 },
  { name:'Sports Icons Mega Pack', slug:'sports-icons-mega-pack', desc:'150+ sports and athletics icons covering all major sports.',
    cat:'sports', catLabel:'Sports', sub:'football', style:'flat', lic:'premium', fmts:['svg','eps','ai'],
    orient:'square', complex:'medium', cm:'multi', tags:['sports','icons','athletics','games','activities'],
    colors:['#EF4444','#3B82F6','#10B981'], dl:6400, likes:480, views:27500, rating:4.7, rc:195, comments:20,
    w:800, h:800, fs:720, cid:'c4', daysAgo:50, flags:['premium'] },
  { name:'Extreme Sports Adventure', slug:'extreme-sports-adventure', desc:'Extreme sports and outdoor adventure vector illustration.',
    cat:'sports', catLabel:'Sports', sub:'running', style:'flat', lic:'commercial', fmts:['svg','eps'],
    orient:'landscape', complex:'advanced', cm:'multi', tags:['extreme','adventure','outdoor','climbing','surfing'],
    colors:['#DC2626','#F97316','#111827'], dl:4900, likes:368, views:20500, rating:4.6, rc:142, comments:12,
    w:1400, h:900, fs:490, cid:'c7', daysAgo:18 },

  // ── TRAVEL ──────────────────────────────────────────────────────────────────
  { name:'Luxury Hotel Building', slug:'luxury-hotel-building', desc:'Modern luxury hotel architecture and hospitality illustration.',
    cat:'travel', catLabel:'Travel', sub:'hotels', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['hotel','luxury','architecture','hospitality','travel'],
    colors:['#D97706','#92400E','#FEF3C7'], dl:7800, likes:582, views:33000, rating:4.5, rc:228, comments:27,
    w:1400, h:900, fs:480, cid:'c6', daysAgo:17, flags:['new'] },
  { name:'Beach Paradise Vectors', slug:'beach-paradise-vectors', desc:'Tropical beach paradise with palm trees and sunset scene.',
    cat:'travel', catLabel:'Travel', sub:'beaches', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'gradient', tags:['beach','paradise','tropical','palm','sunset'],
    colors:['#0EA5E9','#F97316','#FBBF24'], dl:14600, likes:1090, views:63000, rating:4.8, rc:428, comments:57,
    w:1400, h:900, fs:460, cid:'c2', daysAgo:9, flags:['staff','editors'] },
  { name:'Airplane Travel Illustrations', slug:'airplane-travel-illustrations', desc:'Commercial airplane and air travel vector illustration set.',
    cat:'travel', catLabel:'Travel', sub:'airplanes', style:'flat', lic:'commercial', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['airplane','travel','aviation','flight','airport'],
    colors:['#3B82F6','#DBEAFE','#FFFFFF'], dl:8200, likes:610, views:35000, rating:4.5, rc:242, comments:28,
    w:1400, h:900, fs:420, cid:'c4', daysAgo:22 },
  { name:'World City Maps Pack', slug:'world-city-maps-pack', desc:'Hand-drawn style city and travel destination maps collection.',
    cat:'travel', catLabel:'Travel', sub:'adventure', style:'hand-drawn', lic:'free', fmts:['svg','eps'],
    orient:'square', complex:'advanced', cm:'multi', tags:['map','city','travel','destinations','hand-drawn'],
    colors:['#F59E0B','#D97706','#FEF3C7'], dl:6400, likes:480, views:27000, rating:4.6, rc:192, comments:20,
    w:900, h:900, fs:380, cid:'c1', daysAgo:36 },
  { name:'Road Trip Adventure Scene', slug:'road-trip-adventure-scene', desc:'Cross-country road trip adventure vector landscape illustration.',
    cat:'travel', catLabel:'Travel', sub:'cars', style:'flat', lic:'commercial', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['road trip','car','adventure','highway','travel'],
    colors:['#10B981','#3B82F6','#FEF3C7'], dl:5100, likes:382, views:21500, rating:4.5, rc:155, comments:14,
    w:1400, h:800, fs:360, cid:'c5', daysAgo:29 },
  { name:'Travel Icons Collection', slug:'travel-icons-collection', desc:'100+ travel and vacation icon pack for apps and websites.',
    cat:'travel', catLabel:'Travel', sub:'airplanes', style:'outline', lic:'free', fmts:['svg','png'],
    orient:'square', complex:'beginner', cm:'single', tags:['travel','icons','vacation','suitcase','passport'],
    colors:['#3B82F6','#FFFFFF'], dl:18200, likes:1360, views:78000, rating:4.6, rc:538, comments:72,
    w:800, h:800, fs:145, cid:'c8', daysAgo:60, flags:['staff'] },
  { name:'Mountain Hiking Trail', slug:'mountain-hiking-trail', desc:'Mountain hiking and trekking adventure vector illustrations.',
    cat:'travel', catLabel:'Travel', sub:'adventure', style:'flat', lic:'commercial', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['mountain','hiking','trail','adventure','outdoor'],
    colors:['#059669','#065F46','#ECFDF5'], dl:4200, likes:315, views:17500, rating:4.7, rc:120, comments:10,
    w:1400, h:900, fs:390, cid:'c3', daysAgo:24 },
  { name:'Cruise Ship Holiday', slug:'cruise-ship-holiday', desc:'Luxury cruise ship and ocean holiday vector illustration.',
    cat:'travel', catLabel:'Travel', sub:'beaches', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['cruise','ship','ocean','holiday','luxury'],
    colors:['#0EA5E9','#0284C7','#FFFFFF'], dl:3800, likes:285, views:15500, rating:4.3, rc:108, comments:9,
    w:1400, h:800, fs:420, cid:'c7', daysAgo:45 },

  // ── HOLIDAYS ────────────────────────────────────────────────────────────────
  { name:'Christmas Tree Decorations', slug:'christmas-tree-decorations', desc:'Beautiful Christmas tree and holiday decoration vector set.',
    cat:'holidays', catLabel:'Holidays', sub:'christmas', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'portrait', complex:'medium', cm:'multi', tags:['christmas','tree','decoration','holiday','winter'],
    colors:['#DC2626','#16A34A','#FBBF24'], dl:18400, likes:1380, views:82000, rating:4.8, rc:558, comments:78,
    w:800, h:1100, fs:560, cid:'c4', daysAgo:7, flags:['new','staff'] },
  { name:'Halloween Night Scene', slug:'halloween-night-scene', desc:'Spooky Halloween night scene with pumpkins and ghosts.',
    cat:'holidays', catLabel:'Holidays', sub:'halloween', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['halloween','pumpkin','ghost','spooky','night'],
    colors:['#EA580C','#111827','#8B5CF6'], dl:12800, likes:958, views:55000, rating:4.7, rc:385, comments:51,
    w:1400, h:900, fs:520, cid:'c8', daysAgo:14 },
  { name:"Valentine's Day Hearts", slug:'valentines-day-hearts', desc:"Romantic Valentine's Day heart and love vector collection.",
    cat:'holidays', catLabel:'Holidays', sub:'valentine', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'square', complex:'beginner', cm:'multi', tags:['valentine','heart','love','romance','pink'],
    colors:['#EC4899','#F43F5E','#FDF2F8'], dl:11600, likes:870, views:50000, rating:4.6, rc:338, comments:43,
    w:800, h:800, fs:240, cid:'c2', daysAgo:21 },
  { name:'New Year Fireworks Celebration', slug:'new-year-fireworks-celebration', desc:'New Year Eve fireworks and celebration vector illustrations.',
    cat:'holidays', catLabel:'Holidays', sub:'new-year', style:'gradient', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'gradient', tags:['new year','fireworks','celebration','party','night'],
    colors:['#FBBF24','#D97706','#111827'], dl:9400, likes:702, views:40500, rating:4.5, rc:278, comments:34,
    w:1400, h:900, fs:390, cid:'c1', daysAgo:12 },
  { name:'Easter Spring Vectors', slug:'easter-spring-vectors', desc:'Easter eggs, bunny and spring flowers vector illustration set.',
    cat:'holidays', catLabel:'Holidays', sub:'easter', style:'cartoon', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['easter','egg','bunny','spring','flowers'],
    colors:['#34D399','#FBBF24','#EC4899'], dl:7200, likes:540, views:31000, rating:4.5, rc:215, comments:26,
    w:1200, h:800, fs:440, cid:'c6', daysAgo:28 },
  { name:'Birthday Party Pack', slug:'birthday-party-pack', desc:'Fun birthday party decoration and celebration vector set.',
    cat:'holidays', catLabel:'Holidays', sub:'new-year', style:'cartoon', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['birthday','party','celebration','balloons','cake'],
    colors:['#EC4899','#8B5CF6','#FBBF24'], dl:10800, likes:808, views:46000, rating:4.6, rc:320, comments:40,
    w:1200, h:800, fs:480, cid:'c3', daysAgo:19 },
  { name:'Summer Festival Icons', slug:'summer-festival-icons', desc:'Summer festival and outdoor event icon collection.',
    cat:'holidays', catLabel:'Holidays', sub:'new-year', style:'flat', lic:'commercial', fmts:['svg','eps'],
    orient:'square', complex:'beginner', cm:'multi', tags:['summer','festival','outdoor','event','music'],
    colors:['#F97316','#FBBF24','#34D399'], dl:5600, likes:420, views:24000, rating:4.4, rc:162, comments:16,
    w:800, h:800, fs:175, cid:'c5', daysAgo:38 },
  { name:'Winter Holiday Pattern Set', slug:'winter-holiday-pattern-set', desc:'Seamless winter holiday patterns for wrapping and decoration.',
    cat:'holidays', catLabel:'Holidays', sub:'christmas', style:'flat', lic:'free', fmts:['svg','eps','ai'],
    orient:'square', complex:'medium', cm:'multi', tags:['winter','pattern','holiday','seamless','christmas'],
    colors:['#DC2626','#16A34A','#FFFFFF'], dl:8200, likes:612, views:35000, rating:4.6, rc:240, comments:28,
    w:800, h:800, fs:195, cid:'c7', daysAgo:10, flags:['new'] },

  // ── ABSTRACT ────────────────────────────────────────────────────────────────
  { name:'Geometric Pattern Library', slug:'geometric-pattern-library', desc:'50 seamless geometric patterns in flat and gradient styles.',
    cat:'abstract', catLabel:'Abstract', sub:'geometry', style:'gradient', lic:'free', fmts:['svg','eps','ai'],
    orient:'square', complex:'medium', cm:'gradient', tags:['geometric','pattern','abstract','seamless','shapes'],
    colors:['#6366F1','#8B5CF6','#EC4899'], dl:16400, likes:1228, views:70000, rating:4.7, rc:492, comments:66,
    w:800, h:800, fs:420, cid:'c4', daysAgo:11, flags:['staff','editors'] },
  { name:'Wave Lines Abstract Set', slug:'wave-lines-abstract-set', desc:'Fluid wave lines and abstract flowing shape collections.',
    cat:'abstract', catLabel:'Abstract', sub:'waves', style:'gradient', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'gradient', tags:['wave','lines','abstract','fluid','flowing'],
    colors:['#3B82F6','#8B5CF6','#EC4899'], dl:12800, likes:958, views:55000, rating:4.8, rc:385, comments:51,
    w:1400, h:800, fs:285, cid:'c6', daysAgo:6, flags:['new','editors'] },
  { name:'Neon Glow Abstract Pack', slug:'neon-glow-abstract-pack', desc:'Vibrant neon glow and light effects abstract vector collection.',
    cat:'abstract', catLabel:'Abstract', sub:'shapes', style:'gradient', lic:'premium', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'advanced', cm:'gradient', tags:['neon','glow','abstract','light','vibrant'],
    colors:['#EC4899','#6366F1','#0EA5E9'], dl:7400, likes:555, views:32000, rating:4.9, rc:222, comments:28,
    w:1400, h:900, fs:650, cid:'c8', daysAgo:18, flags:['premium','ai'] },
  { name:'Mesh Gradient Backgrounds', slug:'mesh-gradient-backgrounds', desc:'Premium mesh gradient and aurora background vector set.',
    cat:'abstract', catLabel:'Abstract', sub:'mesh', style:'gradient', lic:'free', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'gradient', tags:['mesh','gradient','background','aurora','colorful'],
    colors:['#EC4899','#8B5CF6','#3B82F6'], dl:14200, likes:1062, views:61000, rating:4.8, rc:428, comments:55,
    w:1440, h:900, fs:340, cid:'c2', daysAgo:14, flags:['new','ai','staff'] },
  { name:'Sacred Geometry Pack', slug:'sacred-geometry-pack', desc:'Sacred geometry and mandala vector illustration collection.',
    cat:'abstract', catLabel:'Abstract', sub:'geometry', style:'outline', lic:'free', fmts:['svg','eps','ai'],
    orient:'square', complex:'advanced', cm:'single', tags:['sacred','geometry','mandala','spiritual','pattern'],
    colors:['#D97706','#111827'], dl:9800, likes:735, views:42000, rating:4.6, rc:295, comments:38,
    w:800, h:800, fs:390, cid:'c1', daysAgo:24 },
  { name:'Glassmorphism UI Elements', slug:'glassmorphism-ui-elements', desc:'Trendy glassmorphism effect UI component vector library.',
    cat:'abstract', catLabel:'Abstract', sub:'shapes', style:'glassmorphism', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'medium', cm:'gradient', tags:['glassmorphism','glass','ui','blur','modern'],
    colors:['#FFFFFF','#3B82F6','#8B5CF6'], dl:11600, likes:868, views:50000, rating:4.7, rc:348, comments:44,
    w:1440, h:900, fs:520, cid:'c4', daysAgo:32 },
  { name:'Color Explosion Bursts', slug:'color-explosion-bursts', desc:'Dynamic color explosion and paint splash abstract vectors.',
    cat:'abstract', catLabel:'Abstract', sub:'shapes', style:'watercolor', lic:'free', fmts:['svg','eps','png'],
    orient:'square', complex:'medium', cm:'multi', tags:['color','explosion','paint','splash','abstract'],
    colors:['#EF4444','#F97316','#FBBF24'], dl:8900, likes:668, views:38000, rating:4.5, rc:268, comments:32,
    w:800, h:800, fs:480, cid:'c5', daysAgo:20 },
  { name:'Neumorphism Components', slug:'neumorphism-components', desc:'Soft UI neumorphism design components and interface elements.',
    cat:'abstract', catLabel:'Abstract', sub:'shapes', style:'neumorphism', lic:'commercial', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'medium', cm:'single', tags:['neumorphism','soft ui','design','components','modern'],
    colors:['#E5E7EB','#D1D5DB','#FFFFFF'], dl:5200, likes:390, views:22000, rating:4.6, rc:158, comments:15,
    w:1440, h:900, fs:280, cid:'c3', daysAgo:28 },

  // ── UI & UX ─────────────────────────────────────────────────────────────────
  { name:'UI Button Collection', slug:'ui-button-collection', desc:'Complete UI button states and styles in multiple design systems.',
    cat:'ui-ux', catLabel:'UI & UX', sub:'buttons', style:'flat', lic:'free', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'beginner', cm:'multi', tags:['buttons','ui','design','components','states'],
    colors:['#3B82F6','#FFFFFF','#111827'], dl:19200, likes:1440, views:82000, rating:4.7, rc:578, comments:76,
    w:1440, h:900, fs:180, cid:'c4', daysAgo:15, flags:['staff'] },
  { name:'Dashboard Layout Kit', slug:'dashboard-layout-kit', desc:'Admin dashboard layout and analytics UI vector kit.',
    cat:'ui-ux', catLabel:'UI & UX', sub:'dashboards', style:'flat', lic:'premium', fmts:['svg','eps','ai','pdf'],
    orient:'landscape', complex:'advanced', cm:'multi', tags:['dashboard','admin','analytics','ui','layout'],
    colors:['#111827','#3B82F6','#10B981'], dl:8400, likes:630, views:36000, rating:4.8, rc:260, comments:32,
    w:1440, h:900, fs:680, cid:'c6', daysAgo:20, flags:['premium','editors'] },
  { name:'Mobile App UI Kit', slug:'mobile-app-ui-kit', desc:'Complete mobile app UI kit with 80+ screens and components.',
    cat:'ui-ux', catLabel:'UI & UX', sub:'cards', style:'minimal', lic:'premium', fmts:['svg','eps','ai'],
    orient:'portrait', complex:'advanced', cm:'multi', tags:['mobile','app','ui kit','ios','android'],
    colors:['#111827','#3B82F6','#F9FAFB'], dl:11200, likes:840, views:48000, rating:4.9, rc:338, comments:44,
    w:800, h:1600, fs:920, cid:'c8', daysAgo:8, flags:['premium','new','editors'] },
  { name:'Charts and Graphs Library', slug:'charts-graphs-library', desc:'Data visualization charts and graphs vector component library.',
    cat:'ui-ux', catLabel:'UI & UX', sub:'charts', style:'flat', lic:'free', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['charts','graphs','data','visualization','analytics'],
    colors:['#3B82F6','#10B981','#F59E0B'], dl:14800, likes:1108, views:64000, rating:4.7, rc:448, comments:58,
    w:1440, h:900, fs:560, cid:'c4', daysAgo:22, flags:['staff'] },
  { name:'Wireframe UI Kit', slug:'wireframe-ui-kit', desc:'Low-fidelity wireframe and prototyping vector component kit.',
    cat:'ui-ux', catLabel:'UI & UX', sub:'wireframes', style:'minimal', lic:'free', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'single', tags:['wireframe','prototype','lo-fi','ux','design'],
    colors:['#9CA3AF','#FFFFFF','#111827'], dl:9600, likes:720, views:41000, rating:4.5, rc:290, comments:36,
    w:1440, h:900, fs:240, cid:'c1', daysAgo:35 },
  { name:'Card Component Library', slug:'card-component-library', desc:'Versatile card component collection for web and mobile design.',
    cat:'ui-ux', catLabel:'UI & UX', sub:'cards', style:'flat', lic:'free', fmts:['svg','eps','ai'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['cards','components','ui','design','library'],
    colors:['#FFFFFF','#F9FAFB','#3B82F6'], dl:12400, likes:928, views:53000, rating:4.6, rc:375, comments:48,
    w:1440, h:900, fs:410, cid:'c2', daysAgo:18 },
  { name:'Web Design System Kit', slug:'web-design-system-kit', desc:'Full design system kit with typography, colors, and components.',
    cat:'ui-ux', catLabel:'UI & UX', sub:'wireframes', style:'minimal', lic:'commercial', fmts:['svg','eps','ai','pdf'],
    orient:'landscape', complex:'advanced', cm:'multi', tags:['design system','tokens','components','typography','web'],
    colors:['#111827','#6366F1','#FFFFFF'], dl:7200, likes:540, views:30500, rating:4.8, rc:218, comments:28,
    w:1440, h:900, fs:840, cid:'c6', daysAgo:42 },
  { name:'Form Elements Pack', slug:'form-elements-pack', desc:'UI form elements, inputs, and interactive controls vector pack.',
    cat:'ui-ux', catLabel:'UI & UX', sub:'buttons', style:'flat', lic:'free', fmts:['svg','eps'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['form','inputs','controls','ui','interactive'],
    colors:['#3B82F6','#FFFFFF','#F3F4F6'], dl:8800, likes:660, views:38000, rating:4.5, rc:268, comments:32,
    w:1440, h:900, fs:310, cid:'c5', daysAgo:26 },

  // ── LOGOS ───────────────────────────────────────────────────────────────────
  { name:'Minimalist Brand Marks', slug:'minimalist-brand-marks', desc:'50 clean minimalist logo and brand mark designs.',
    cat:'logos', catLabel:'Logos', sub:'brand-marks', style:'minimal', lic:'commercial', fmts:['svg','eps','ai','pdf'],
    orient:'square', complex:'medium', cm:'single', tags:['logo','brand','minimalist','mark','identity'],
    colors:['#111827','#3B82F6'], dl:8600, likes:645, views:37000, rating:4.7, rc:258, comments:30,
    w:800, h:800, fs:280, cid:'c4', daysAgo:16, flags:['editors'] },
  { name:'Monogram Letters Collection', slug:'monogram-letters-collection', desc:'Elegant monogram letter combination logo designs.',
    cat:'logos', catLabel:'Logos', sub:'monograms', style:'minimal', lic:'premium', fmts:['svg','eps','ai'],
    orient:'square', complex:'advanced', cm:'single', tags:['monogram','letters','logo','elegant','typography'],
    colors:['#111827','#D97706'], dl:5400, likes:405, views:23000, rating:4.8, rc:165, comments:18,
    w:800, h:800, fs:360, cid:'c1', daysAgo:28, flags:['premium'] },
  { name:'Nature Logo Templates', slug:'nature-logo-templates', desc:'Organic nature and eco-friendly logo design templates.',
    cat:'logos', catLabel:'Logos', sub:'brand-marks', style:'minimal', lic:'commercial', fmts:['svg','eps','ai','cdr'],
    orient:'square', complex:'medium', cm:'single', tags:['nature','eco','organic','logo','green'],
    colors:['#059669','#065F46'], dl:7200, likes:540, views:31000, rating:4.6, rc:218, comments:24,
    w:800, h:800, fs:180, cid:'c6', daysAgo:20 },
  { name:'Badge and Emblem Designs', slug:'badge-emblem-designs', desc:'Classic badge and emblem vector designs for sports and brands.',
    cat:'logos', catLabel:'Logos', sub:'badges', style:'flat', lic:'commercial', fmts:['svg','eps','ai'],
    orient:'square', complex:'advanced', cm:'multi', tags:['badge','emblem','shield','crest','classic'],
    colors:['#D97706','#111827','#FFFFFF'], dl:6400, likes:480, views:27500, rating:4.7, rc:195, comments:21,
    w:800, h:800, fs:520, cid:'c8', daysAgo:35 },
  { name:'Tech Company Logo Pack', slug:'tech-company-logo-pack', desc:'Modern tech startup and company logo design collection.',
    cat:'logos', catLabel:'Logos', sub:'brand-marks', style:'minimal', lic:'free', fmts:['svg','eps','ai'],
    orient:'square', complex:'medium', cm:'gradient', tags:['tech','startup','company','logo','modern'],
    colors:['#3B82F6','#6366F1','#8B5CF6'], dl:11400, likes:852, views:49000, rating:4.6, rc:342, comments:44,
    w:800, h:800, fs:220, cid:'c4', daysAgo:12, flags:['new'] },
  { name:'Food Brand Logo Designs', slug:'food-brand-logo-designs', desc:'Restaurant and food brand identity logo vector templates.',
    cat:'logos', catLabel:'Logos', sub:'brand-marks', style:'flat', lic:'commercial', fmts:['svg','eps','ai','cdr'],
    orient:'square', complex:'medium', cm:'multi', tags:['food','restaurant','brand','logo','identity'],
    colors:['#EF4444','#F97316','#111827'], dl:5800, likes:435, views:25000, rating:4.5, rc:175, comments:18,
    w:800, h:800, fs:290, cid:'c3', daysAgo:22 },
  { name:'Creative Agency Logos', slug:'creative-agency-logos', desc:'Bold creative agency and studio logo mark collection.',
    cat:'logos', catLabel:'Logos', sub:'emblems', style:'minimal', lic:'premium', fmts:['svg','eps','ai'],
    orient:'square', complex:'advanced', cm:'gradient', tags:['creative','agency','studio','logo','bold'],
    colors:['#111827','#EC4899','#8B5CF6'], dl:4200, likes:315, views:18000, rating:4.8, rc:128, comments:13,
    w:800, h:800, fs:310, cid:'c7', daysAgo:30, flags:['premium'] },
  { name:'Sports Team Logo Kit', slug:'sports-team-logo-kit', desc:'Sports team and club logo design vector template collection.',
    cat:'logos', catLabel:'Logos', sub:'badges', style:'flat', lic:'commercial', fmts:['svg','eps','ai','cdr'],
    orient:'square', complex:'advanced', cm:'multi', tags:['sports','team','club','logo','badge'],
    colors:['#DC2626','#111827','#D97706'], dl:7600, likes:570, views:32000, rating:4.6, rc:228, comments:27,
    w:800, h:800, fs:480, cid:'c2', daysAgo:18 },

  // ── SOCIAL MEDIA ────────────────────────────────────────────────────────────
  { name:'Instagram Post Templates', slug:'instagram-post-templates', desc:'Trendy Instagram post and story design vector templates.',
    cat:'social', catLabel:'Social Media', sub:'instagram', style:'gradient', lic:'free', fmts:['svg','png'],
    orient:'square', complex:'beginner', cm:'gradient', tags:['instagram','post','template','social media','design'],
    colors:['#EC4899','#F97316','#FBBF24'], dl:22400, likes:1680, views:96000, rating:4.7, rc:672, comments:89,
    w:1080, h:1080, fs:340, cid:'c4', daysAgo:4, flags:['new','staff'] },
  { name:'TikTok Content Creator Pack', slug:'tiktok-content-creator-pack', desc:'TikTok content creation graphics and video overlay vectors.',
    cat:'social', catLabel:'Social Media', sub:'tiktok', style:'gradient', lic:'free', fmts:['svg','png'],
    orient:'portrait', complex:'beginner', cm:'gradient', tags:['tiktok','video','content','creator','social'],
    colors:['#111827','#EC4899','#0EA5E9'], dl:18600, likes:1394, views:80000, rating:4.6, rc:558, comments:74,
    w:1080, h:1920, fs:280, cid:'c8', daysAgo:6, flags:['new'] },
  { name:'YouTube Thumbnail Kit', slug:'youtube-thumbnail-kit', desc:'Eye-catching YouTube thumbnail and banner design vectors.',
    cat:'social', catLabel:'Social Media', sub:'youtube', style:'gradient', lic:'free', fmts:['svg','png'],
    orient:'landscape', complex:'medium', cm:'gradient', tags:['youtube','thumbnail','banner','creator','video'],
    colors:['#DC2626','#111827','#FFFFFF'], dl:16200, likes:1212, views:69000, rating:4.5, rc:488, comments:65,
    w:1280, h:720, fs:320, cid:'c6', daysAgo:9, flags:['staff'] },
  { name:'Facebook Cover Pack', slug:'facebook-cover-pack', desc:'Professional Facebook cover and banner design template vectors.',
    cat:'social', catLabel:'Social Media', sub:'facebook', style:'flat', lic:'free', fmts:['svg','png'],
    orient:'landscape', complex:'beginner', cm:'gradient', tags:['facebook','cover','banner','social','page'],
    colors:['#1D4ED8','#FFFFFF','#DBEAFE'], dl:12800, likes:958, views:55000, rating:4.4, rc:386, comments:50,
    w:1640, h:624, fs:280, cid:'c2', daysAgo:14 },
  { name:'LinkedIn Professional Pack', slug:'linkedin-professional-pack', desc:'LinkedIn profile banner and business post vector templates.',
    cat:'social', catLabel:'Social Media', sub:'linkedin', style:'flat', lic:'commercial', fmts:['svg','png'],
    orient:'landscape', complex:'beginner', cm:'multi', tags:['linkedin','professional','banner','business','career'],
    colors:['#0EA5E9','#111827','#FFFFFF'], dl:9400, likes:704, views:40500, rating:4.6, rc:282, comments:36,
    w:1584, h:396, fs:195, cid:'c1', daysAgo:20 },
  { name:'Social Media Icons 2024', slug:'social-media-icons-2024', desc:'Latest social media platform icon collection with all networks.',
    cat:'social', catLabel:'Social Media', sub:'instagram', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'square', complex:'beginner', cm:'multi', tags:['social media','icons','platforms','networks','apps'],
    colors:['#3B82F6','#EC4899','#111827'], dl:28600, likes:2148, views:124000, rating:4.8, rc:862, comments:114,
    w:800, h:800, fs:120, cid:'c8', daysAgo:30, flags:['editors','staff'] },
  { name:'Stories Design Templates', slug:'stories-design-templates', desc:'Instagram and WhatsApp stories design vector templates.',
    cat:'social', catLabel:'Social Media', sub:'instagram', style:'gradient', lic:'free', fmts:['svg','png'],
    orient:'portrait', complex:'beginner', cm:'gradient', tags:['stories','template','instagram','whatsapp','social'],
    colors:['#8B5CF6','#EC4899','#F97316'], dl:15400, likes:1154, views:66000, rating:4.7, rc:462, comments:60,
    w:1080, h:1920, fs:310, cid:'c4', daysAgo:10, flags:['new'] },
  { name:'Twitter/X Post Designs', slug:'twitter-x-post-designs', desc:'Twitter/X card and tweet visual design vector templates.',
    cat:'social', catLabel:'Social Media', sub:'instagram', style:'minimal', lic:'free', fmts:['svg','png'],
    orient:'landscape', complex:'beginner', cm:'multi', tags:['twitter','x','tweet','social media','card'],
    colors:['#111827','#FFFFFF','#3B82F6'], dl:8200, likes:614, views:35000, rating:4.4, rc:246, comments:30,
    w:1200, h:675, fs:180, cid:'c3', daysAgo:16 },

  // ── MARKETING ───────────────────────────────────────────────────────────────
  { name:'Event Flyer Template Pack', slug:'event-flyer-template-pack', desc:'Professional event and party flyer design vector templates.',
    cat:'marketing', catLabel:'Marketing', sub:'flyers', style:'gradient', lic:'free', fmts:['svg','eps','ai','pdf'],
    orient:'portrait', complex:'medium', cm:'gradient', tags:['flyer','event','party','design','template'],
    colors:['#8B5CF6','#EC4899','#111827'], dl:14200, likes:1064, views:61000, rating:4.6, rc:428, comments:56,
    w:800, h:1100, fs:560, cid:'c8', daysAgo:8, flags:['new','staff'] },
  { name:'Concert Poster Designs', slug:'concert-poster-designs', desc:'Bold concert and music event poster vector design templates.',
    cat:'marketing', catLabel:'Marketing', sub:'posters', style:'gradient', lic:'commercial', fmts:['svg','eps','ai','pdf'],
    orient:'portrait', complex:'medium', cm:'gradient', tags:['concert','poster','music','event','bold'],
    colors:['#111827','#FBBF24','#EF4444'], dl:8600, likes:644, views:37000, rating:4.7, rc:258, comments:32,
    w:800, h:1100, fs:620, cid:'c6', daysAgo:16, flags:['editors'] },
  { name:'Sale Banner Collection', slug:'sale-banner-collection', desc:'Eye-catching sale and promotion banner vector template set.',
    cat:'marketing', catLabel:'Marketing', sub:'banners', style:'flat', lic:'free', fmts:['svg','eps','png'],
    orient:'landscape', complex:'beginner', cm:'multi', tags:['sale','banner','promotion','discount','retail'],
    colors:['#EF4444','#FBBF24','#FFFFFF'], dl:19600, likes:1468, views:84000, rating:4.5, rc:592, comments:78,
    w:1200, h:400, fs:185, cid:'c4', daysAgo:12, flags:['staff'] },
  { name:'Product Brochure Template', slug:'product-brochure-template', desc:'Tri-fold and bi-fold product brochure design vector templates.',
    cat:'marketing', catLabel:'Marketing', sub:'brochures', style:'minimal', lic:'premium', fmts:['svg','ai','pdf'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['brochure','trifold','product','print','template'],
    colors:['#111827','#3B82F6','#FFFFFF'], dl:5200, likes:390, views:22000, rating:4.7, rc:158, comments:18,
    w:1200, h:800, fs:480, cid:'c1', daysAgo:28, flags:['premium'] },
  { name:'Presentation Slide Kit', slug:'presentation-slide-kit', desc:'Professional business presentation slide design vector kit.',
    cat:'marketing', catLabel:'Marketing', sub:'presentations', style:'flat', lic:'premium', fmts:['svg','ai','pdf'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['presentation','slides','business','pitch','deck'],
    colors:['#111827','#6366F1','#FFFFFF'], dl:8800, likes:660, views:38000, rating:4.8, rc:265, comments:32,
    w:1920, h:1080, fs:740, cid:'c4', daysAgo:18, flags:['premium','editors'] },
  { name:'Billboard Design Templates', slug:'billboard-design-templates', desc:'Large format billboard and outdoor advertising vector templates.',
    cat:'marketing', catLabel:'Marketing', sub:'banners', style:'flat', lic:'commercial', fmts:['svg','ai','pdf','eps'],
    orient:'landscape', complex:'medium', cm:'multi', tags:['billboard','outdoor','advertising','large format','print'],
    colors:['#111827','#F97316','#FFFFFF'], dl:3800, likes:285, views:15500, rating:4.5, rc:112, comments:10,
    w:1400, h:500, fs:360, cid:'c5', daysAgo:35 },
  { name:'Email Newsletter Templates', slug:'email-newsletter-templates', desc:'Modern HTML email newsletter design vector template collection.',
    cat:'marketing', catLabel:'Marketing', sub:'brochures', style:'flat', lic:'free', fmts:['svg','png'],
    orient:'portrait', complex:'medium', cm:'multi', tags:['email','newsletter','template','design','marketing'],
    colors:['#111827','#3B82F6','#F9FAFB'], dl:11600, likes:869, views:50000, rating:4.5, rc:350, comments:44,
    w:600, h:1200, fs:280, cid:'c6', daysAgo:22 },
  { name:'Data Infographic Pack', slug:'data-infographic-pack', desc:'Modern data infographic and statistics vector design collection.',
    cat:'marketing', catLabel:'Marketing', sub:'presentations', style:'flat', lic:'free', fmts:['svg','eps'],
    orient:'portrait', complex:'advanced', cm:'multi', tags:['infographic','data','statistics','design','visualization'],
    colors:['#3B82F6','#10B981','#F59E0B'], dl:9400, likes:705, views:40500, rating:4.6, rc:283, comments:35,
    w:900, h:1400, fs:440, cid:'c2', daysAgo:14, flags:['new'] },
];

function buildMockVectors(): VectorAsset[] {
  const getCreator = (id: string) => MOCK_CREATORS.find(c => c.id === id)!;
  const daysToIso = (days: number) => {
    const d = new Date('2026-07-15');
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  return SEEDS.map((s, i) => {
    const flags = s.flags ?? [];
    const imgW = s.orient === 'portrait' ? 400 : s.orient === 'square' ? 400 : 600;
    const imgH = s.orient === 'portrait' ? 560 : s.orient === 'square' ? 400 : 380;
    const previewUrl = `https://picsum.photos/seed/amxvec${i}/` + imgW + '/' + imgH;
    return {
      id: `vec-${i}`,
      slug: s.slug,
      name: s.name,
      description: s.desc,
      category: s.cat,
      categoryLabel: s.catLabel,
      subcategory: s.sub,
      previewUrl,
      thumbUrl: `https://picsum.photos/seed/amxvec${i}/320/240`,
      dominantColors: s.colors,
      formats: s.fmts,
      style: s.style,
      license: s.lic,
      orientation: s.orient,
      complexity: s.complex,
      colorMode: s.cm,
      isPremium: flags.includes('premium'),
      isFree: !flags.includes('premium'),
      isAiGenerated: flags.includes('ai'),
      isAnimated: flags.includes('animated'),
      isNew: flags.includes('new'),
      isStaffPick: flags.includes('staff'),
      isEditorsChoice: flags.includes('editors'),
      downloads: s.dl,
      likes: s.likes,
      views: s.views,
      rating: s.rating,
      ratingCount: s.rc,
      comments: s.comments,
      tags: s.tags,
      width: s.w,
      height: s.h,
      fileSize: s.fs,
      creator: getCreator(s.cid),
      uploadedAt: daysToIso(s.daysAgo),
      updatedAt: daysToIso(Math.max(0, s.daysAgo - 3)),
    } as VectorAsset;
  });
}

// ─── Filter state ─────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: VectorFilterState = {
  query:        '',
  categoryId:   null,
  subcategoryId: null,
  formats:      [],
  style:        null,
  license:      null,
  orientation:  null,
  complexity:   null,
  colorMode:    null,
  color:        null,
  isAiGenerated:null,
  isAnimated:   null,
  dateAdded:    'all',
  sort:         'popular',
  favoritesOnly:false,
  creatorId:    null,
};

const FAVORITES_KEY       = 'amx_vector_favorites';
const COLLECTIONS_KEY     = 'amx_vector_collections';
const RECENT_KEY          = 'amx_vector_recent';
const RECENT_SEARCHES_KEY = 'amx_vector_recent_searches';
const USER_RATINGS_KEY    = 'amx_vector_ratings';

@Injectable({ providedIn: 'root' })
export class VectorsService {
 

  // ── State ─────────────────────────────────────────────────────────────────
  readonly loading = signal(true);
  readonly loaded  = signal(false);
  readonly error   = signal<string | null>(null);

  readonly allAssets  = signal<VectorAsset[]>([]);
  readonly creators   = signal<VectorCreator[]>([]);

  // ── Filter state ──────────────────────────────────────────────────────────
  readonly filters = signal<VectorFilterState>({ ...DEFAULT_FILTERS });

  // ── Favorites ─────────────────────────────────────────────────────────────
  readonly favorites = signal<Set<string>>(this._loadFavorites());

  // ── Collections ───────────────────────────────────────────────────────────
  readonly collections = signal<VectorCollection[]>(this._loadCollections());

  // ── Recently viewed ───────────────────────────────────────────────────────
  readonly recentlyViewed = signal<string[]>(this._loadRecent());

  // ── Recent searches ───────────────────────────────────────────────────────
  readonly recentSearches = signal<string[]>(this._loadRecentSearches());

  // ── User ratings ──────────────────────────────────────────────────────────
  readonly userRatings = signal<Map<string, number>>(this._loadUserRatings());

  // ── Followed creators ─────────────────────────────────────────────────────
  readonly followedCreators = signal<Set<string>>(this._loadFollowed());

  // ── Categories ────────────────────────────────────────────────────────────
  readonly categories = signal<VectorCategory[]>(MOCK_CATEGORIES);

  // ── Derived: filtered & sorted ────────────────────────────────────────────
  readonly filtered = computed(() => {
    const f = this.filters();
    let list = this.allAssets();

    if (f.query) {
      const q = f.query.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.tags.some(t => t.includes(q)) ||
        a.categoryLabel.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }
    if (f.categoryId)    list = list.filter(a => a.category === f.categoryId);
    if (f.subcategoryId) list = list.filter(a => a.subcategory === f.subcategoryId);
    if (f.formats.length) list = list.filter(a => f.formats.every(fmt => a.formats.includes(fmt)));
    if (f.style)         list = list.filter(a => a.style === f.style);
    if (f.license)       list = list.filter(a => a.license === f.license);
    if (f.orientation)   list = list.filter(a => a.orientation === f.orientation);
    if (f.complexity)    list = list.filter(a => a.complexity === f.complexity);
    if (f.colorMode)     list = list.filter(a => a.colorMode === f.colorMode);
    if (f.color) {
      const target = f.color.toLowerCase();
      list = list.filter(a => a.dominantColors.some(c => c.toLowerCase() === target));
    }
    if (f.isAiGenerated !== null) list = list.filter(a => a.isAiGenerated === f.isAiGenerated);
    if (f.isAnimated    !== null) list = list.filter(a => a.isAnimated    === f.isAnimated);
    if (f.favoritesOnly) {
      const favs = this.favorites();
      list = list.filter(a => favs.has(a.id));
    }
    if (f.creatorId) list = list.filter(a => a.creator.id === f.creatorId);

    const now = Date.now();
    if (f.dateAdded === 'today') list = list.filter(a => now - new Date(a.uploadedAt).getTime() < 86400000);
    else if (f.dateAdded === 'week') list = list.filter(a => now - new Date(a.uploadedAt).getTime() < 7 * 86400000);
    else if (f.dateAdded === 'month') list = list.filter(a => now - new Date(a.uploadedAt).getTime() < 30 * 86400000);

    switch (f.sort) {
      case 'newest':    return [...list].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      case 'downloads': return [...list].sort((a, b) => b.downloads - a.downloads);
      case 'views':     return [...list].sort((a, b) => b.views - a.views);
      case 'likes':     return [...list].sort((a, b) => b.likes - a.likes);
      case 'rating':    return [...list].sort((a, b) => b.rating - a.rating);
      default:          return [...list].sort((a, b) => (b.downloads * 0.5 + b.views * 0.3 + b.likes * 0.2) - (a.downloads * 0.5 + a.views * 0.3 + a.likes * 0.2));
    }
  });

  // ── Derived sections ──────────────────────────────────────────────────────
  readonly featuredVectors  = computed(() => this.allAssets().filter(a => a.isEditorsChoice || a.isStaffPick).slice(0, 12));
  readonly trendingToday    = computed(() => [...this.allAssets()].sort((a, b) => b.views - a.views).slice(0, 20));
  readonly trendingWeek     = computed(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    return [...this.allAssets()]
      .filter(a => new Date(a.uploadedAt).getTime() > weekAgo || a.downloads > 5000)
      .sort((a, b) => (b.downloads + b.views) - (a.downloads + a.views))
      .slice(0, 20);
  });
  readonly trendingMonth    = computed(() => [...this.allAssets()].sort((a, b) => (b.downloads + b.likes) - (a.downloads + a.likes)).slice(0, 20));
  readonly mostViewed       = computed(() => [...this.allAssets()].sort((a, b) => b.views - a.views).slice(0, 20));
  readonly mostLiked        = computed(() => [...this.allAssets()].sort((a, b) => b.likes - a.likes).slice(0, 20));
  readonly editorChoice     = computed(() => this.allAssets().filter(a => a.isEditorsChoice).slice(0, 16));
  readonly newArrivals      = computed(() => [...this.allAssets()].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()).slice(0, 20));
  readonly mostDownloaded   = computed(() => [...this.allAssets()].sort((a, b) => b.downloads - a.downloads).slice(0, 20));
  readonly staffPicks       = computed(() => this.allAssets().filter(a => a.isStaffPick).slice(0, 12));
  readonly aiGenerated      = computed(() => this.allAssets().filter(a => a.isAiGenerated).slice(0, 16));
  readonly freeVectors      = computed(() => this.allAssets().filter(a => a.isFree).slice(0, 16));
  readonly premiumVectors   = computed(() => this.allAssets().filter(a => a.isPremium).slice(0, 16));
  readonly recentlyViewedAssets = computed(() => {
    const ids = this.recentlyViewed();
    return ids.map(id => this.allAssets().find(a => a.id === id)).filter(Boolean) as VectorAsset[];
  });
  readonly popularCreators  = computed(() => {
    return this.creators().map(creator => ({
      ...creator,
      topAssets: this.allAssets().filter(a => a.creator.id === creator.id)
        .sort((a, b) => b.downloads - a.downloads).slice(0, 3),
      totalDownloads: this.allAssets().filter(a => a.creator.id === creator.id)
        .reduce((sum, a) => sum + a.downloads, 0),
    })).sort((a, b) => b.totalDownloads - a.totalDownloads);
  });
  readonly featuredCollections = computed(() => {
    return SEASONAL_COLLECTIONS.map(col => ({
      ...col,
      assets: this.allAssets().filter(a => a.category === col.id || a.tags.some(t => col.label.toLowerCase().includes(t))).slice(0, 4),
    }));
  });

  // ── Related tags (from current results) ──────────────────────────────────
  readonly relatedTags = computed(() => {
    const q = this.filters().query.toLowerCase();
    const tagCounts = new Map<string, number>();
    this.filtered().slice(0, 60).forEach(a =>
      a.tags.forEach(t => { if (t !== q) tagCounts.set(t, (tagCounts.get(t) || 0) + 1); })
    );
    return [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t]) => t);
  });

  constructor() {
    this._loadData();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  private _loadData(): void {
    this.allAssets.set(buildMockVectors());
    this.creators.set(MOCK_CREATORS);
    this.categories.set(MOCK_CATEGORIES);
    this.loading.set(false);
    this.loaded.set(true);
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this._loadData();
  }

  // ── Methods ───────────────────────────────────────────────────────────────

  setFilter<K extends keyof VectorFilterState>(key: K, value: VectorFilterState[K]): void {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  resetFilters(): void {
    this.filters.set({ ...DEFAULT_FILTERS });
  }

  toggleFavorite(id: string): void {
    this.favorites.update(favs => {
      const next = new Set(favs);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  isFavorite(id: string): boolean {
    return this.favorites().has(id);
  }

  trackView(id: string): void {
    this.recentlyViewed.update(ids => {
      const next = [id, ...ids.filter(i => i !== id)].slice(0, 20);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  addRecentSearch(q: string): void {
    if (!q.trim()) return;
    this.recentSearches.update(prev => {
      const next = [q, ...prev.filter(s => s !== q)].slice(0, 12);
      try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  removeRecentSearch(q: string): void {
    this.recentSearches.update(prev => {
      const next = prev.filter(s => s !== q);
      try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  toggleFollowCreator(creatorId: string): void {
    this.followedCreators.update(s => {
      const next = new Set(s);
      next.has(creatorId) ? next.delete(creatorId) : next.add(creatorId);
      try { localStorage.setItem('amx_vec_followed', JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  isFollowing(creatorId: string): boolean {
    return this.followedCreators().has(creatorId);
  }

  // ── User Ratings ──────────────────────────────────────────────────────────

  rateAsset(assetId: string, rating: number): void {
    this.userRatings.update(map => {
      const next = new Map(map);
      next.set(assetId, rating);
      try { localStorage.setItem(USER_RATINGS_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  getUserRating(assetId: string): number {
    return this.userRatings().get(assetId) ?? 0;
  }

  // ── Collections ───────────────────────────────────────────────────────────

  createCollection(name: string): void {
    const col: VectorCollection = {
      id: `col-${Date.now()}`, name, assetIds: [], isPublic: false,
      createdAt: new Date().toISOString(),
    };
    this.collections.update(cols => {
      const next = [...cols, col];
      this._saveCollections(next);
      return next;
    });
  }

  renameCollection(colId: string, name: string): void {
    this.collections.update(cols => {
      const next = cols.map(c => c.id === colId ? { ...c, name } : c);
      this._saveCollections(next); return next;
    });
  }

  deleteCollection(colId: string): void {
    this.collections.update(cols => {
      const next = cols.filter(c => c.id !== colId);
      this._saveCollections(next); return next;
    });
  }

  addToCollection(colId: string, assetId: string): void {
    this.collections.update(cols => {
      const next = cols.map(c =>
        c.id === colId && !c.assetIds.includes(assetId)
          ? { ...c, assetIds: [...c.assetIds, assetId] }
          : c
      );
      this._saveCollections(next);
      return next;
    });
  }

  // ── Creator upload ────────────────────────────────────────────────────────
  addUploadedAsset(asset: VectorAsset): void {
    this.allAssets.update((all: VectorAsset[]) => [asset, ...all]);
  }

  getSimilar(asset: VectorAsset, limit = 8): VectorAsset[] {
    return this.allAssets()
      .filter(a => a.id !== asset.id && (a.category === asset.category || a.style === asset.style))
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  getByCreator(creatorId: string, excludeId?: string): VectorAsset[] {
    return this.allAssets().filter(a => a.creator.id === creatorId && a.id !== excludeId).slice(0, 8);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _loadFollowed(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem('amx_vec_followed') || '[]')); } catch { return new Set(); }
  }

  private _loadFavorites(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')); } catch { return new Set(); }
  }

  private _loadCollections(): VectorCollection[] {
    try { return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || '[]'); } catch { return []; }
  }

  private _saveCollections(cols: VectorCollection[]): void {
    try { localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols)); } catch {}
  }

  private _loadRecent(): string[] {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  }

  private _loadRecentSearches(): string[] {
    try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'); } catch { return []; }
  }

  private _loadUserRatings(): Map<string, number> {
    try {
      const raw = JSON.parse(localStorage.getItem(USER_RATINGS_KEY) || '[]');
      return new Map(raw);
    } catch { return new Map(); }
  }
}
