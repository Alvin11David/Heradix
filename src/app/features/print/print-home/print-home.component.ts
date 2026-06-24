import {
  Component, ChangeDetectionStrategy, signal, computed,
  OnInit, OnDestroy, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  PrintCategory, PrintCategoryId, PrintProduct,
  PaperProductOptions, ApparelProductOptions,
} from '../../../core/models/print.model';

/* ── Static catalogue data ───────────────────────────────────── */
const CATEGORIES: PrintCategory[] = [
  { id: 'business-cards', label: 'Business Cards',      icon: 'business-card', description: 'Premium cards that make a lasting impression' },
  { id: 'brochures',      label: 'Brochures',           icon: 'brochure',      description: 'Fold & finish options for every campaign' },
  { id: 'flyers',         label: 'Flyers',              icon: 'flyer',         description: 'High-impact full-colour flyers' },
  { id: 'stickers',       label: 'Stickers',            icon: 'sticker',       description: 'Die-cut, kiss-cut, roll stickers & more' },
  { id: 'banners',        label: 'Banners',             icon: 'banner',        description: 'Retractable, vinyl & fabric banners' },
  { id: 'packaging',      label: 'Packaging',           icon: 'box',           description: 'Custom boxes, bags & mailers' },
  { id: 'postcards',      label: 'Postcards',           icon: 'postcard',      description: 'Direct mail ready postcards' },
  { id: 'apparel',        label: 'T-Shirts & Apparel',  icon: 'shirt',         description: 'Custom print on premium apparel brands' },
];

const PAPER_OPTS: PaperProductOptions = {
  kind: 'paper',
  sizes: [
    { label: '2" × 3.5"',   width: '2"',   height: '3.5"' },
    { label: '2.5" × 2.5"', width: '2.5"', height: '2.5"' },
    { label: '3.5" × 4"',   width: '3.5"', height: '4"' },
    { label: '3.5" × 5"',   width: '3.5"', height: '5"' },
    { label: '4" × 6"',     width: '4"',   height: '6"' },
    { label: '4" × 9"',     width: '4"',   height: '9"' },
    { label: '4.25" × 5.5"',width: '4.25"',height: '5.5"' },
    { label: '5" × 5"',     width: '5"',   height: '5"' },
    { label: '5" × 7"',     width: '5"',   height: '7"' },
    { label: '5.5" × 8.5"', width: '5.5"', height: '8.5"' },
    { label: '2.5" × 7"',   width: '2.5"', height: '7"' },
    { label: '3" × 4"',     width: '3"',   height: '4"' },
    { label: 'Custom Size',  width: 'custom', height: 'custom' },
  ],
  paperTypes: [
    { label: '14pt Cardstock Gloss', pt: 14 },
    { label: '16pt Cardstock Matte', pt: 16 },
    { label: '32pt Ultra Thick',     pt: 32 },
    { label: '100lb Text Uncoated',  pt: 0  },
  ],
  laminations:  ['NONE', 'GLOSS', 'MATTE', 'SOFT_TOUCH', 'SPOT_UV'],
  printSides:   ['FRONT_ONLY', 'FRONT_AND_BACK'],
  roundedCorners: true,
  bleedMm: 3.175,
  quantities: [25, 50, 100, 250, 500, 1000, 2500, 5000],
  leadTimes: [
    { label: '1 Business Day',  businessDays: 1, priceMod: 1.40 },
    { label: '2 Business Days', businessDays: 2, priceMod: 1.20 },
    { label: '3 Business Days', businessDays: 3, priceMod: 1.00 },
    { label: '5 Business Days', businessDays: 5, priceMod: 0.85 },
  ],
  basePriceMap: { 25: 14.99, 50: 18.99, 100: 22.99, 250: 32.12, 500: 44.00, 1000: 62.00, 2500: 119.00, 5000: 199.00 },
};

const BROCHURE_OPTS: PaperProductOptions = {
  kind: 'paper',
  sizes: [
    { label: '8.5" × 11"',  width: '8.5"', height: '11"' },
    { label: '5.5" × 8.5"', width: '5.5"', height: '8.5"' },
    { label: '8.5" × 14"',  width: '8.5"', height: '14"' },
  ],
  paperTypes: [
    { label: '100lb Gloss Text',  pt: 0 },
    { label: '80lb Matte Text',   pt: 0 },
    { label: '100lb Gloss Cover', pt: 0 },
  ],
  laminations:  ['NONE', 'GLOSS', 'MATTE', 'SOFT_TOUCH'],
  printSides:   ['FRONT_AND_BACK'],
  roundedCorners: false,
  bleedMm: 3.175,
  quantities: [25, 50, 100, 250, 500, 1000],
  leadTimes: [
    { label: '3 Business Days', businessDays: 3, priceMod: 1.00 },
    { label: '5 Business Days', businessDays: 5, priceMod: 0.85 },
  ],
  basePriceMap: { 25: 24.99, 50: 34.99, 100: 49.99, 250: 79.99, 500: 119.00, 1000: 189.00 },
};

const APPAREL_OPTS: ApparelProductOptions = {
  kind: 'apparel',
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  sleeveTypes: ['SHORT', 'LONG', 'SLEEVELESS'],
  colors: [
    { name: 'White',        hex: '#ffffff' },
    { name: 'Black',        hex: '#1a1a1a' },
    { name: 'Navy Blue',    hex: '#1e3a5f' },
    { name: 'Forest Green', hex: '#1a4a2e' },
    { name: 'Heather Grey', hex: '#9ca3af' },
    { name: 'Royal Blue',   hex: '#2563eb' },
    { name: 'Red',          hex: '#dc2626' },
    { name: 'Burgundy',     hex: '#7f1d1d' },
    { name: 'Orange',       hex: '#ea580c' },
    { name: 'Yellow',       hex: '#eab308' },
    { name: 'Purple',       hex: '#7c3aed' },
    { name: 'Pink',         hex: '#ec4899' },
  ],
  brands: ['Gildan', 'Hanes', 'Bella+Canvas', 'Sport-Tek', 'Next Level', 'American Apparel'],
  materials: ['100% Cotton', '50/50 Blend', 'Polyester DryFit', 'Tri-Blend', 'Organic Cotton'],
  printAreas: ['Front Center', 'Back Center', 'Left Chest', 'Right Sleeve', 'Full Front'],
  quantities: [1, 6, 12, 24, 48, 72, 100],
  basePriceMap: { 'Gildan': 10.63, 'Hanes': 10.00, 'Bella+Canvas': 18.50, 'Sport-Tek': 16.00, 'Next Level': 14.99, 'American Apparel': 24.99 },
};

const JUMPER_OPTS: ApparelProductOptions = {
  kind: 'apparel',
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  sleeveTypes: ['LONG'],
  colors: [
    { name: 'White',        hex: '#ffffff' },
    { name: 'Black',        hex: '#1a1a1a' },
    { name: 'Navy Blue',    hex: '#1e3a5f' },
    { name: 'Forest Green', hex: '#1a4a2e' },
    { name: 'Heather Grey', hex: '#9ca3af' },
    { name: 'Royal Blue',   hex: '#2563eb' },
    { name: 'Maroon',       hex: '#800000' },
  ],
  brands: ['Gildan', 'Hanes', 'Bella+Canvas', 'Sport-Tek'],
  materials: ['80% Cotton 20% Polyester', '100% Fleece', 'Tri-Blend Fleece'],
  printAreas: ['Front Center', 'Back Center', 'Left Chest', 'Full Front'],
  quantities: [1, 6, 12, 24, 48, 72, 100],
  basePriceMap: { 'Gildan': 18.00, 'Hanes': 16.50, 'Bella+Canvas': 28.00, 'Sport-Tek': 24.00 },
};

const HOODIE_OPTS: ApparelProductOptions = {
  kind: 'apparel',
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  sleeveTypes: ['LONG'],
  colors: [
    { name: 'Black',        hex: '#1a1a1a' },
    { name: 'White',        hex: '#ffffff' },
    { name: 'Navy Blue',    hex: '#1e3a5f' },
    { name: 'Heather Grey', hex: '#9ca3af' },
    { name: 'Forest Green', hex: '#1a4a2e' },
    { name: 'Burgundy',     hex: '#7f1d1d' },
  ],
  brands: ['Gildan', 'Bella+Canvas', 'Champion', 'Sport-Tek'],
  materials: ['80% Cotton 20% Polyester', 'Premium Fleece', 'Heavyweight Cotton'],
  printAreas: ['Front Chest', 'Back Center', 'Full Front', 'Sleeve'],
  quantities: [1, 6, 12, 24, 48],
  basePriceMap: { 'Gildan': 22.00, 'Bella+Canvas': 35.00, 'Champion': 30.00, 'Sport-Tek': 28.00 },
};

const CAP_OPTS: ApparelProductOptions = {
  kind: 'apparel',
  sizes: ['One Size', 'S/M', 'L/XL'] as any,
  sleeveTypes: [] as any,
  colors: [
    { name: 'Black',      hex: '#1a1a1a' },
    { name: 'White',      hex: '#ffffff' },
    { name: 'Navy Blue',  hex: '#1e3a5f' },
    { name: 'Red',        hex: '#dc2626' },
    { name: 'Royal Blue', hex: '#2563eb' },
    { name: 'Khaki',      hex: '#c3a882' },
    { name: 'Camo Green', hex: '#4a5240' },
  ],
  brands: ['Yupoong', 'Otto', 'Richardson', 'Port Authority'],
  materials: ['100% Cotton Twill', 'Polyester Mesh', 'Wool Blend'],
  printAreas: ['Front Panel', 'Side Panel', 'Back Panel'],
  quantities: [1, 6, 12, 24, 48, 100],
  basePriceMap: { 'Yupoong': 12.00, 'Otto': 10.50, 'Richardson': 14.00, 'Port Authority': 11.00 },
};

const UMBRELLA_OPTS: ApparelProductOptions = {
  kind: 'apparel',
  sizes: ['Standard 46"', 'Large 60"', 'Golf 62"'] as any,
  sleeveTypes: [] as any,
  colors: [
    { name: 'Black',  hex: '#1a1a1a' },
    { name: 'Red',    hex: '#dc2626' },
    { name: 'Blue',   hex: '#2563eb' },
    { name: 'Green',  hex: '#16a34a' },
    { name: 'White',  hex: '#ffffff' },
    { name: 'Yellow', hex: '#eab308' },
  ],
  brands: ['Totes', 'ShedRain', 'Custom Branding'],
  materials: ['Pongee Polyester', 'UV-Coated Nylon', 'Auto-Open Fiberglass'],
  printAreas: ['Full Canopy Panel', 'Single Panel', 'Two Panels'],
  quantities: [1, 6, 12, 24, 50, 100],
  basePriceMap: { 'Totes': 18.00, 'ShedRain': 22.00, 'Custom Branding': 15.00 },
};

export const PRINT_PRODUCTS: PrintProduct[] = [
  {
    id: 'standard-business-card',
    categoryId: 'business-cards',
    name: 'Standard Business Cards',
    tagline: 'A classic 2" × 3.5" format that delivers fast, professional results.',
    imageUrl: '/assets/images/Branding_Print/Business_Card.jpg',
    rating: 4.3, reviewCount: 1684, fromPrice: 14.99, currency: 'USD',
    isPremium: false,
    features: ['Standard 3.5" × 2" size + custom sizes', 'Thick premium cardstock', 'Gloss, matte or uncoated finishes', 'Optional rounded corners', 'Quantities from 25 to 5,000'],
    options: PAPER_OPTS,
  },
  {
    id: 'square-business-card',
    categoryId: 'business-cards',
    name: 'Square Business Cards',
    tagline: 'Balanced and bold for creative designs.',
    imageUrl: '/assets/images/Branding_Print/Business_Card2.jpg',
    rating: 4.5, reviewCount: 892, fromPrice: 18.99, currency: 'USD',
    isPremium: false,
    features: ['2.5" × 2.5" square format', 'Premium cardstock options', 'Spot UV available', 'Stand-out design impression'],
    options: { ...PAPER_OPTS, sizes: [{ label: '2.5" × 2.5"', width: '2.5"', height: '2.5"' }] },
  },
  {
    id: 'tri-fold-brochure',
    categoryId: 'brochures',
    name: 'Tri-Fold Brochure',
    tagline: 'Classic tri-fold for any campaign or event.',
    imageUrl: '/assets/images/Branding_Print/Brochure.jpg',
    rating: 4.4, reviewCount: 621, fromPrice: 24.99, currency: 'USD',
    isPremium: false,
    features: ['Letter & half-letter sizes', 'Gloss or matte finish', 'Full-colour both sides', '100lb coated text stock'],
    options: BROCHURE_OPTS,
  },
  {
    id: 'half-fold-brochure',
    categoryId: 'brochures',
    name: 'Half-Fold Brochure',
    tagline: 'Clean & professional booklet-style layout.',
    imageUrl: '/assets/images/Branding_Print/Brochure-2.jpg',
    rating: 4.2, reviewCount: 308, fromPrice: 22.99, currency: 'USD',
    isPremium: false,
    features: ['Multiple fold styles', '80lb or 100lb text', 'Full bleed printing'],
    options: BROCHURE_OPTS,
  },
  {
    id: 'full-colour-flyer',
    categoryId: 'flyers',
    name: 'Full-Colour Flyers',
    tagline: 'High-impact promotional flyers for any event.',
    imageUrl: '/assets/images/Branding_Print/Brochure_desigh.jpg',
    rating: 4.6, reviewCount: 2140, fromPrice: 12.99, currency: 'USD',
    isPremium: false,
    features: ['Letter & A5 sizes', 'Same-day turnaround available', 'Single or double sided', '60lb to 100lb text options'],
    options: { ...BROCHURE_OPTS, sizes: [{ label: '8.5" × 11"', width: '8.5"', height: '11"' }, { label: '5.5" × 8.5"', width: '5.5"', height: '8.5"' }] },
  },
  {
    id: 'custom-tshirt',
    categoryId: 'apparel',
    name: 'Custom T-Shirts',
    tagline: 'Classic, comfortable and custom shirts tailored to your brand.',
    imageUrl: '/assets/images/Branding_Print/Tshirts.jpg',
    rating: 4.7, reviewCount: 3280, fromPrice: 10.63, currency: 'USD',
    isPremium: false,
    features: ['Custom print designs', 'Extensive sizes & colours', 'Multiple brand options', 'Screen print & DTG available', 'No minimum for DTG'],
    options: APPAREL_OPTS,
  },
  {
    id: 'custom-jumper',
    categoryId: 'apparel',
    name: 'Custom Jumpers',
    tagline: 'Premium branded jumpers for teams and events.',
    imageUrl: '/assets/images/Branding_Print/Jumper.jpg',
    rating: 4.6, reviewCount: 840, fromPrice: 16.50, currency: 'USD',
    isPremium: false,
    features: ['Heavyweight fleece options', 'Long sleeve comfort fit', 'Custom print & embroidery', 'Team & bulk discounts'],
    options: JUMPER_OPTS,
  },
  {
    id: 'custom-hoodie',
    categoryId: 'apparel',
    name: 'Custom Hoodies',
    tagline: 'Hood jackets branded to perfection.',
    imageUrl: '/assets/images/Branding_Print/Hood-Jacket.jpg',
    rating: 4.8, reviewCount: 1250, fromPrice: 22.00, currency: 'USD',
    isPremium: false,
    features: ['Kangaroo pocket available', 'Premium fleece material', 'Full front or chest print', 'Embroidery option'],
    options: HOODIE_OPTS,
  },
  {
    id: 'custom-cap',
    categoryId: 'apparel',
    name: 'Custom Caps & Hats',
    tagline: 'Embroidered & printed caps for your team.',
    imageUrl: '/assets/images/Branding_Print/Cap_Branding.jpg',
    rating: 4.5, reviewCount: 960, fromPrice: 10.50, currency: 'USD',
    isPremium: false,
    features: ['Structured & unstructured styles', 'Embroidery & print options', 'Adjustable fit', 'Multiple colour options'],
    options: CAP_OPTS,
  },
  {
    id: 'custom-umbrella',
    categoryId: 'apparel',
    name: 'Custom Umbrellas',
    tagline: 'Branded umbrellas for outdoor events and gifting.',
    imageUrl: '/assets/images/Branding_Print/Umbrella.jpg',
    rating: 4.4, reviewCount: 420, fromPrice: 15.00, currency: 'USD',
    isPremium: false,
    features: ['Full canopy panel branding', 'Auto-open mechanism', 'UV-protective coating', 'Bulk order discounts'],
    options: UMBRELLA_OPTS,
  },
  {
    id: 'vinyl-sticker',
    categoryId: 'stickers',
    name: 'Vinyl Stickers',
    tagline: 'Waterproof die-cut vinyl stickers for any surface.',
    imageUrl: '/assets/images/Branding_Print/stickers.jpg',
    rating: 4.8, reviewCount: 4100, fromPrice: 9.99, currency: 'USD',
    isPremium: false,
    features: ['Die-cut to any shape', 'Waterproof & UV resistant', 'Indoor & outdoor use', 'Fast 1-day turnaround'],
    options: { ...PAPER_OPTS, laminations: ['GLOSS', 'MATTE'] as any },
  },
  {
    id: 'retractable-banner',
    categoryId: 'banners',
    name: 'Retractable Banners',
    tagline: 'Portable pull-up banners for events & trade shows.',
    imageUrl: '/assets/images/Branding_Print/Pullup_Banner.jpg',
    rating: 4.5, reviewCount: 1200, fromPrice: 49.99, currency: 'USD',
    isPremium: false,
    features: ['33" × 79" standard size', 'Premium vinyl material', 'Carry bag included', 'Hardware & stand included'],
    options: { ...PAPER_OPTS, sizes: [{ label: '33" × 79"', width: '33"', height: '79"' }, { label: '24" × 63"', width: '24"', height: '63"' }], laminations: ['NONE'] as any },
  },
];

/* ── Hero slider samples ─────────────────────────────────────── */
export const HERO_SLIDES = [
  { img: '/assets/images/Branding_Print/All_Branding.jpg',      label: 'Full Branding Packages' },
  { img: '/assets/images/Branding_Print/Tshirt-2.jpg',          label: 'Custom T-Shirts' },
  { img: '/assets/images/Branding_Print/Business_cards-2.jpg',  label: 'Premium Business Cards' },
  { img: '/assets/images/Branding_Print/Pullup_Banner.jpg',     label: 'Pull-Up Banners' },
  { img: '/assets/images/Branding_Print/Cap_Branding.jpg',      label: 'Custom Caps & Hats' },
];

const SAMPLES = [
  { img: '/assets/images/Branding_Print/Business_Card.jpg',     label: 'Business Cards' },
  { img: '/assets/images/Branding_Print/Tshirts.jpg',           label: 'Custom T-Shirts' },
  { img: '/assets/images/Branding_Print/Pullup_Banner.jpg',     label: 'Pull-Up Banner' },
  { img: '/assets/images/Branding_Print/Brochure.jpg',          label: 'Tri-Fold Brochure' },
  { img: '/assets/images/Branding_Print/Cap_Branding.jpg',      label: 'Custom Caps' },
  { img: '/assets/images/Branding_Print/Umbrella.jpg',          label: 'Branded Umbrellas' },
  { img: '/assets/images/Branding_Print/Jumper.jpg',            label: 'Custom Jumpers' },
  { img: '/assets/images/Branding_Print/Bag_Branding.jpg',      label: 'Branded Bags' },
];

/* ── Component ───────────────────────────────────────────────── */
@Component({
  selector: 'amx-print-home',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './print-home.component.html',
  styleUrl: './print-home.component.scss',
})
export class PrintHomeComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private slideTimer?: ReturnType<typeof setInterval>;

  /* State */
  offerDismissed   = signal(false);
  activeCategory   = signal<PrintCategoryId>('business-cards');
  activeTab        = signal<'start' | 'upload'>('start');
  selectedSize     = signal<string>('2" × 3.5"');
  heroSlideIndex   = signal(0);

  /* Data */
  categories  = CATEGORIES;
  samples     = SAMPLES;
  heroSlides  = HERO_SLIDES;

  /* Derived */
  filteredProducts = computed(() =>
    PRINT_PRODUCTS.filter(p => p.categoryId === this.activeCategory())
  );

  /* Quick-start size options for the "Start Printing" tab */
  quickSizes = [
    { label: '2" × 3.5"',    width: 2,   height: 3.5 },
    { label: '2.5" × 2.5"',  width: 2.5, height: 2.5 },
    { label: '3.5" × 5"',    width: 3.5, height: 5   },
    { label: '4" × 6"',      width: 4,   height: 6   },
    { label: '5" × 7"',      width: 5,   height: 7   },
    { label: '4.25" × 5.5"', width: 4.25,height: 5.5 },
    { label: '5.5" × 8.5"',  width: 5.5, height: 8.5 },
    { label: '5" × 5"',      width: 5,   height: 5   },
    { label: '2.5" × 7"',    width: 2.5, height: 7   },
    { label: '3" × 4"',      width: 3,   height: 4   },
    { label: '4" × 9"',      width: 4,   height: 9   },
    { label: '8.5" × 11"',   width: 8.5, height: 11  },
    { label: 'Custom Size',   width: 0,   height: 0   },
  ];

  ngOnInit(): void {
    this.slideTimer = setInterval(() => {
      this.heroSlideIndex.update(i => (i + 1) % this.heroSlides.length);
    }, 3500);
  }

  ngOnDestroy(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
  }

  /* Helpers */
  setCategory(id: PrintCategoryId): void { this.activeCategory.set(id); }
  setTab(t: 'start' | 'upload'): void    { this.activeTab.set(t); }
  selectSize(s: string): void            { this.selectedSize.set(s); }
  dismissOffer(): void                   { this.offerDismissed.set(true); }
  goToSlide(i: number): void             { this.heroSlideIndex.set(i); }

  /** Return a CSS-safe aspect-ratio-like scale for the size shape */
  sizeCardStyle(w: number, h: number): { [key: string]: string } {
    if (!w || !h) return { width: '60px', height: '60px' };
    const maxDim = 64;
    const scale = maxDim / Math.max(w, h);
    const pw = Math.round(w * scale);
    const ph = Math.round(h * scale);
    return { width: pw + 'px', height: ph + 'px' };
  }

  configure(productId: string): void {
    this.router.navigate(['/print', 'configure', productId]);
  }

  startPrinting(): void {
    const activeProducts = this.filteredProducts();
    const first = activeProducts[0];
    if (first) { this.configure(first.id); }
  }

  starsArray(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  trackByCat(_: number, c: PrintCategory): string  { return c.id; }
  trackByProd(_: number, p: PrintProduct): string  { return p.id; }
  trackBySample(_: number, s: { img: string }): string { return s.img; }
  trackByIdx(i: number): number { return i; }
}
