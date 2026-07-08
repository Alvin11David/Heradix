import {
  Component, ChangeDetectionStrategy, signal, computed,
  inject, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PrintProduct, PaperProductOptions, ApparelProductOptions,
  Lamination, PrintSide, ShirtSize, SleeveType,
} from '../../../core/models/print.model';
import { PRINT_PRODUCTS } from '../print-home/print-home.component';

const UGX_RATE = 3700;
const DELIVERY_FEE_UGX = 8000;

export type FulfillmentType = 'pickup' | 'delivery';
export type PaymentMethod   = 'mtn' | 'airtel' | 'visa';

@Component({
  selector: 'amx-print-configurator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './print-configurator.component.html',
  styleUrl:    './print-configurator.component.scss',
})
export class PrintConfiguratorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  product = signal<PrintProduct | null>(null);

  selectedSize      = signal<string>('');
  selectedPaperType = signal<string>('');
  selectedLaminate  = signal<Lamination>('NONE');
  selectedSide      = signal<PrintSide>('FRONT_AND_BACK');
  roundedCorners    = signal(false);
  selectedQty       = signal<number>(250);
  selectedLeadTime  = signal<number>(3);
  proofRequested    = signal(false);

  selectedShirtSize  = signal<ShirtSize>('M');
  selectedSleeve     = signal<SleeveType>('SHORT');
  selectedColorHex   = signal<string>('#ffffff');
  selectedColorName  = signal<string>('White');
  selectedBrand      = signal<string>('Gildan');
  selectedMaterial   = signal<string>('100% Cotton');
  selectedPrintAreas = signal<string[]>(['Front Center']);

  fulfillment      = signal<FulfillmentType>('pickup');
  deliveryAddress  = signal<string>('');
  deliveryPhone    = signal<string>('');

  checkoutOpen     = signal(false);
  paymentMethod    = signal<PaymentMethod>('mtn');
  mobileNumber     = signal<string>('');
  cardNumber       = signal<string>('');
  cardExpiry       = signal<string>('');
  cardCVV          = signal<string>('');
  orderSubmitted   = signal(false);

  activeTab = signal<'configure' | 'preview' | 'features'>('configure');

  isPaper = computed(() => this.product()?.options.kind === 'paper');

  paperOpts = computed(() =>
    this.isPaper() ? (this.product()!.options as PaperProductOptions) : null
  );

  apparelOpts = computed(() =>
    !this.isPaper() ? (this.product()!.options as ApparelProductOptions) : null
  );

  totalPriceUSD = computed(() => {
    const p = this.product();
    if (!p) return 0;

    if (this.isPaper()) {
      const opts = this.paperOpts()!;
      const base = opts.basePriceMap[this.selectedQty()] ?? p.fromPrice;
      const lead = opts.leadTimes.find(l => l.businessDays === this.selectedLeadTime());
      const mod  = lead?.priceMod ?? 1;
      const lam  = this.selectedLaminate() !== 'NONE' ? base * 0.15 : 0;
      const rc   = this.roundedCorners() ? 3.00 : 0;
      return +(base * mod + lam + rc).toFixed(2);
    } else {
      const opts = this.apparelOpts()!;
      const base = opts.basePriceMap[this.selectedBrand()] ?? p.fromPrice;
      return +(base * this.selectedQty()).toFixed(2);
    }
  });

  printingCostUGX = computed(() => Math.round(this.totalPriceUSD() * UGX_RATE));

  deliveryFeeUGX = computed(() =>
    this.fulfillment() === 'delivery' ? DELIVERY_FEE_UGX : 0
  );

  grandTotalUGX = computed(() => this.printingCostUGX() + this.deliveryFeeUGX());

  pricePerUnit = computed(() => {
    const p = this.product();
    if (!p || !this.isPaper()) return 0;
    const opts = this.paperOpts()!;
    const base = opts.basePriceMap[this.selectedQty()] ?? p.fromPrice;
    return Math.round((base / this.selectedQty()) * UGX_RATE);
  });

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('productId')!;
    const found = PRINT_PRODUCTS.find(p => p.id === productId);
    if (!found) { this.router.navigate(['/print']); return; }
    this.product.set(found);

    const opts = found.options;
    if (opts.kind === 'paper') {
      this.selectedSize.set(opts.sizes[0]?.label ?? '');
      this.selectedPaperType.set(opts.paperTypes[0]?.label ?? '');
      this.selectedQty.set(opts.quantities[3] ?? opts.quantities[0]);
      this.selectedLeadTime.set(opts.leadTimes.find(l => l.businessDays === 3)?.businessDays ?? opts.leadTimes[0]?.businessDays);
    } else {
      const ao = opts as ApparelProductOptions;
      this.selectedBrand.set(ao.brands[0] ?? 'Gildan');
      this.selectedMaterial.set(ao.materials[0] ?? '100% Cotton');
      this.selectedQty.set(ao.quantities[0] ?? 1);
      if (ao.colors[0]) {
        this.selectedColorHex.set(ao.colors[0].hex);
        this.selectedColorName.set(ao.colors[0].name);
      }
    }
  }

  selectColor(hex: string, name: string): void {
    this.selectedColorHex.set(hex);
    this.selectedColorName.set(name);
  }

  togglePrintArea(area: string): void {
    const current = this.selectedPrintAreas();
    if (current.includes(area)) {
      this.selectedPrintAreas.set(current.filter(a => a !== area));
    } else {
      this.selectedPrintAreas.set([...current, area]);
    }
  }

  setFulfillment(type: FulfillmentType): void { this.fulfillment.set(type); }
  setPaymentMethod(m: PaymentMethod): void    { this.paymentMethod.set(m); }

  openCheckout(): void  { this.checkoutOpen.set(true); }
  closeCheckout(): void { this.checkoutOpen.set(false); }

  submitOrder(): void {
    this.orderSubmitted.set(true);
  }

  goBack(): void { this.router.navigate(['/print']); }

  addToCart(): void {
    this.openCheckout();
  }

  laminationLabel(l: Lamination): string {
    const map: Record<Lamination, string> = {
      NONE: 'None', GLOSS: 'Gloss', MATTE: 'Matte',
      SOFT_TOUCH: 'Soft Touch', SPOT_UV: 'Spot UV',
    };
    return map[l] ?? l;
  }

  sideLabel(s: PrintSide): string {
    return s === 'FRONT_ONLY' ? 'Front Only' : 'Front & Back';
  }

  formatUGX(amount: number): string {
    return 'UGX ' + amount.toLocaleString('en-UG');
  }

  getSizeStyle(w: string, h: string): { [key: string]: string } {
    if (w === 'custom' || h === 'custom') return { width: '44px', height: '44px' };
    const wn = parseFloat(w);
    const hn = parseFloat(h);
    if (!wn || !hn) return { width: '44px', height: '44px' };
    const maxDim = 52;
    const scale  = maxDim / Math.max(wn, hn);
    return { width: Math.round(wn * scale) + 'px', height: Math.round(hn * scale) + 'px' };
  }

  starsArray(r: number): number[] { return Array.from({ length: 5 }, (_, i) => i + 1); }
}
