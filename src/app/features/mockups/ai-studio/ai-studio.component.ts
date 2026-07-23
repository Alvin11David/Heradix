import {
  Component, ChangeDetectionStrategy, signal, computed, OnInit, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface StudioProduct {
  id: string;
  name: string;
  brand: string;
  sku: string;
  sizes: number;
  colors: number;
  decorations: number;
  category: string;
  thumbnail: string;
}

export interface StudioStyle {
  id: string;
  label: string;
  description: string;
  tag: string;
  gradient: string;
  icon: string;
}

export type StudioStep = 1 | 2 | 3 | 4 | 5;

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_PRODUCTS: StudioProduct[] = [
  { id: 'p1',  brand: 'Paragon',       sku: '241',   name: 'Biloxi Performance Colorblocked Hoodie',   sizes: 8, colors: 6,  decorations: 5, category: 'Hoodie',    thumbnail: '' },
  { id: 'p2',  brand: 'JERZEES',       sku: '96C',   name: 'Unisex NuBlend Colorblock Raglan Hoodie',  sizes: 6, colors: 4,  decorations: 4, category: 'Hoodie',    thumbnail: '' },
  { id: 'p3',  brand: 'BELLA+CANVAS',  sku: '3719',  name: 'Unisex Sponge Fleece Hoodie',              sizes: 7, colors: 12, decorations: 6, category: 'Hoodie',    thumbnail: '' },
  { id: 'p4',  brand: 'BELLA+CANVAS',  sku: '3729',  name: 'Unisex Sponge Fleece Drop Shoulder Hoodie',sizes: 6, colors: 10, decorations: 6, category: 'Hoodie',    thumbnail: '' },
  { id: 'p5',  brand: 'BELLA+CANVAS',  sku: '4719',  name: 'Unisex 10oz Heavyweight Hoodie',           sizes: 8, colors: 8,  decorations: 5, category: 'Hoodie',    thumbnail: '' },
  { id: 'p6',  brand: 'Next Level',    sku: '9300',  name: 'Unisex Malibu Welt Pocket Hoodie',         sizes: 7, colors: 9,  decorations: 6, category: 'Hoodie',    thumbnail: '' },
  { id: 'p7',  brand: 'Next Level',    sku: '9307',  name: 'Unisex Heavyweight Fleece Hoodie',          sizes: 7, colors: 7,  decorations: 5, category: 'Hoodie',    thumbnail: '' },
  { id: 'p8',  brand: 'Code V',        sku: '3969',  name: 'Unisex Camo Fleece Hoodie Sweatshirt',     sizes: 6, colors: 3,  decorations: 6, category: 'Hoodie',    thumbnail: '' },
  { id: 'p9',  brand: 'Alternative',   sku: '9595',  name: 'Challenger Eco-Fleece Hoodie',             sizes: 5, colors: 5,  decorations: 4, category: 'Hoodie',    thumbnail: '' },
  { id: 'p10', brand: 'Augusta',       sku: '5418',  name: "Men's 60/40 Fleece Full-Zip Hoodie",       sizes: 9, colors: 6,  decorations: 5, category: 'Hoodie',    thumbnail: '' },
  { id: 'p11', brand: 'LAT',           sku: '6926',  name: 'Unisex Elevated Fleece Basic Hoodie',      sizes: 6, colors: 8,  decorations: 5, category: 'Hoodie',    thumbnail: '' },
  { id: 'p12', brand: 'Port Authority', sku: 'L132', name: "Women's Cozy Fleece Hoodie",               sizes: 8, colors: 7,  decorations: 5, category: 'Hoodie',    thumbnail: '' },
  // T-Shirts
  { id: 't1',  brand: 'BELLA+CANVAS',  sku: '3001',  name: 'Unisex Jersey Short Sleeve Tee',           sizes: 12, colors: 25, decorations: 8, category: 'T-Shirt',  thumbnail: '' },
  { id: 't2',  brand: 'Gildan',        sku: 'G500',  name: 'Heavy Cotton Adult T-Shirt',               sizes: 10, colors: 20, decorations: 6, category: 'T-Shirt',  thumbnail: '' },
  { id: 't3',  brand: 'Next Level',    sku: '3600',  name: 'Unisex Cotton T-Shirt',                    sizes: 8,  colors: 15, decorations: 6, category: 'T-Shirt',  thumbnail: '' },
  // Mugs
  { id: 'm1',  brand: 'Printful',      sku: 'PM-11', name: '11oz Ceramic White Mug',                   sizes: 2,  colors: 2,  decorations: 3, category: 'Mug',      thumbnail: '' },
  { id: 'm2',  brand: 'Printful',      sku: 'PM-15', name: '15oz Large Ceramic Mug',                   sizes: 1,  colors: 3,  decorations: 3, category: 'Mug',      thumbnail: '' },
];

const STUDIO_STYLES: StudioStyle[] = [
  {
    id: 'baseline',
    label: 'Baseline',
    description: 'Clean, default render. No stylistic modification — matches the standard pipeline.',
    tag: 'Default',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    icon: '◻',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    description: 'Natural light, real-world context. Person wearing or using the product.',
    tag: 'Popular',
    gradient: 'linear-gradient(135deg, #2d5a27 0%, #1a3a20 100%)',
    icon: '🌿',
  },
  {
    id: 'studio',
    label: 'Studio Shot',
    description: 'Professional studio lighting on a clean background. Sharp shadows.',
    tag: 'Clean',
    gradient: 'linear-gradient(135deg, #1e2a3a 0%, #0f1f30 100%)',
    icon: '🏛',
  },
  {
    id: 'flat-lay',
    label: 'Flat Lay',
    description: 'Overhead flat-lay composition with complementary props and surfaces.',
    tag: 'Trendy',
    gradient: 'linear-gradient(135deg, #3a2a1e 0%, #2a1a0f 100%)',
    icon: '⬛',
  },
  {
    id: 'artistic',
    label: 'Artistic',
    description: 'Bold creative direction. Editorial quality with dramatic lighting and colour.',
    tag: 'Creative',
    gradient: 'linear-gradient(135deg, #3a1e3a 0%, #2a0f2a 100%)',
    icon: '🎨',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'White or soft background, negative space, zen-like composition.',
    tag: 'Simple',
    gradient: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
    icon: '○',
  },
];

const QUICK_PROMPTS = [
  'bold graphic logo centered',
  'vintage distressed text',
  'minimalist line art',
  'neon glow effect',
  'floral print pattern',
  'geometric abstract design',
  'hand-lettered typography',
  'photorealistic print',
];

// ── Component ─────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-ai-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-studio.component.html',
  styleUrl: './ai-studio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiStudioComponent implements OnInit {
  private router = inject(Router);

  // ── Stepper state ──────────────────────────────────────────────────────────
  currentStep = signal<StudioStep>(1);

  steps = [
    { n: 1 as StudioStep, label: 'Search Product',   icon: '🔍' },
    { n: 2 as StudioStep, label: 'Select Product',   icon: '👕' },
    { n: 3 as StudioStep, label: 'Choose Style',     icon: '🎨' },
    { n: 4 as StudioStep, label: 'Describe Design',  icon: '✏️' },
    { n: 5 as StudioStep, label: 'Generate',         icon: '⚡' },
  ];

  // ── Step 1: Search ─────────────────────────────────────────────────────────
  searchQuery = signal('');
  isSearching = signal(false);
  searchDone = signal(false);
  searchResults = signal<StudioProduct[]>([]);

  quickSearchTerms = ['t-shirt', 'hoodie', 'mug', 'poster', 'tote bag', 'cap', 'jacket', 'sweatshirt'];

  // ── Step 2: Product ────────────────────────────────────────────────────────
  selectedProduct = signal<StudioProduct | null>(null);
  selectedColor = signal(0);

  productColors = [
    '#1a1a1a', '#f5f5f5', '#f5820a', '#2563eb', '#16a34a',
    '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#d97706',
  ];

  // ── Step 3: Style ──────────────────────────────────────────────────────────
  allStyles = STUDIO_STYLES;
  selectedStyle = signal<StudioStyle | null>(null);

  // ── Step 4: Design prompt ──────────────────────────────────────────────────
  designPrompt = signal('');
  quickPrompts = QUICK_PROMPTS;
  maxPromptLen = 500;

  promptRemaining = computed(() => this.maxPromptLen - this.designPrompt().length);

  // ── Step 5: Generation ─────────────────────────────────────────────────────
  generating = signal(false);
  generationProgress = signal(0);
  generationStage = signal('');
  generationDone = signal(false);

  generationStages = [
    'Analyzing product dimensions…',
    'Mapping print area…',
    'Applying style transfer…',
    'Rendering lighting & shadows…',
    'Compositing final image…',
    'Applying AI enhancements…',
    'Exporting high-resolution mockup…',
  ];

  // Fake generated mockup colors (gradient previews as stand-ins for real images)
  generatedVariants = [
    { label: 'Front view',     gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { label: 'Side view',      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { label: 'Back view',      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { label: 'Detail shot',    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  ];
  activeVariant = signal(0);

  // ── Computed helpers ───────────────────────────────────────────────────────
  canProceedStep1 = computed(() => !!this.selectedProduct());
  canProceedStep2 = computed(() => !!this.selectedProduct());
  canProceedStep3 = computed(() => !!this.selectedStyle());
  canProceedStep4 = computed(() => this.designPrompt().trim().length >= 3);

  stepCompleted = computed(() => ({
    1: !!this.selectedProduct(),
    2: !!this.selectedProduct(),
    3: !!this.selectedStyle(),
    4: this.designPrompt().trim().length >= 3,
    5: this.generationDone(),
  }));

  ngOnInit() {
    // Pre-populate with featured products so the page isn't empty on load
    this.searchResults.set(MOCK_PRODUCTS.slice(0, 8));
    this.searchDone.set(true);
  }

  // ── Step 1 actions ─────────────────────────────────────────────────────────
  onSearchInput(ev: Event) {
    this.searchQuery.set((ev.target as HTMLInputElement).value);
  }

  onSearchKeydown(ev: KeyboardEvent) {
    if (ev.key === 'Enter') this.doSearch();
  }

  doSearch() {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return;
    this.isSearching.set(true);
    this.searchDone.set(false);
    // Simulate API latency
    setTimeout(() => {
      const filtered = MOCK_PRODUCTS.filter(
        p => p.name.toLowerCase().includes(q) ||
             p.brand.toLowerCase().includes(q) ||
             p.category.toLowerCase().includes(q) ||
             p.sku.toLowerCase().includes(q),
      );
      this.searchResults.set(filtered.length ? filtered : MOCK_PRODUCTS.slice(0, 8));
      this.isSearching.set(false);
      this.searchDone.set(true);
    }, 800);
  }

  quickSearch(term: string) {
    this.searchQuery.set(term);
    this.doSearch();
  }

  pickProduct(product: StudioProduct) {
    this.selectedProduct.set(product);
    this.selectedColor.set(0);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  goStep(n: StudioStep) {
    // Can only go back freely; forward requires completion
    if (n < this.currentStep() || this.canGoTo(n)) {
      this.currentStep.set(n);
    }
  }

  canGoTo(n: StudioStep): boolean {
    const comp = this.stepCompleted();
    for (let i = 1; i < n; i++) {
      if (!comp[i as StudioStep]) return false;
    }
    return true;
  }

  next() {
    const s = this.currentStep();
    if (s < 5) this.currentStep.set((s + 1) as StudioStep);
    if (s + 1 === 5) this.startGeneration();
  }

  back() {
    const s = this.currentStep();
    if (s > 1) this.currentStep.set((s - 1) as StudioStep);
  }

  // ── Step 5: generation ─────────────────────────────────────────────────────
  startGeneration() {
    this.generating.set(true);
    this.generationProgress.set(0);
    this.generationDone.set(false);
    this.generationStage.set(this.generationStages[0]);

    let stageIdx = 0;
    let progress = 0;

    const tick = setInterval(() => {
      progress += Math.random() * 4 + 2;
      if (progress >= 100) progress = 100;
      this.generationProgress.set(Math.round(progress));

      const newIdx = Math.min(
        Math.floor((progress / 100) * this.generationStages.length),
        this.generationStages.length - 1,
      );
      if (newIdx !== stageIdx) {
        stageIdx = newIdx;
        this.generationStage.set(this.generationStages[stageIdx]);
      }

      if (progress >= 100) {
        clearInterval(tick);
        setTimeout(() => {
          this.generating.set(false);
          this.generationDone.set(true);
        }, 500);
      }
    }, 120);
  }

  regenerate() {
    this.generationDone.set(false);
    this.startGeneration();
  }

  downloadVariant() {
    const variant = this.generatedVariants[this.activeVariant()];
    const product = this.selectedProduct();
    const style   = this.selectedStyle();
    const label   = variant?.label ?? 'mockup';
    const name    = product?.name ?? 'product';

    // Create a canvas-rendered gradient image as a stand-in for the real generated image
    const canvas  = document.createElement('canvas');
    canvas.width  = 800;
    canvas.height = 800;
    const ctx     = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 800, 800);
      // Parse gradient colors from the variant definition
      const colorMatch = variant.gradient.match(/#[0-9a-fA-F]{6}/g) ?? ['#667eea', '#764ba2'];
      grad.addColorStop(0, colorMatch[0]);
      grad.addColorStop(1, colorMatch[1] ?? colorMatch[0]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 800);

      // Label the variant
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, 400, 370);
      ctx.font = '20px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`${style?.label ?? ''} · ${label}`, 400, 410);

      const link = document.createElement('a');
      link.download = `amarapix-mockup-${label.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }

  openInEditor() {
    this.router.navigate(['/editor']);
  }

  startOver() {
    this.currentStep.set(1);
    this.selectedProduct.set(null);
    this.selectedStyle.set(null);
    this.designPrompt.set('');
    this.generationDone.set(false);
    this.searchDone.set(false);
    this.searchResults.set([]);
    this.searchQuery.set('');
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  brandInitial(brand: string) {
    return brand.slice(0, 2).toUpperCase();
  }

  appendPrompt(chip: string) {
    const cur = this.designPrompt().trim();
    this.designPrompt.set(cur ? `${cur}, ${chip}` : chip);
  }

  trackByStyle(_: number, s: StudioStyle) { return s.id; }
  trackByProduct(_: number, p: StudioProduct) { return p.id; }
}
