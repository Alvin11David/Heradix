import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

interface PricingPlan {
  key: string;
  label: string;
  icon: string;
  monthlyPrice: number;
  annualPrice: number;
  downloadsPerDay: number;
  gradient: string;
  accentColor: string;
  features: string[];
}

interface Benefit { icon: string; title: string; desc: string; }
interface Faq     { q: string; a: string; open: boolean; }

const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', rate: 1 },
  { code: 'UGX', flag: '🇺🇬', rate: 3680 },
  { code: 'EUR', flag: '🇪🇺', rate: 0.92 },
  { code: 'GBP', flag: '🇬🇧', rate: 0.79 },
  { code: 'KES', flag: '🇰🇪', rate: 130 },
  { code: 'NGN', flag: '🇳🇬', rate: 1570 },
  { code: 'ZAR', flag: '🇿🇦', rate: 18.6 },
  { code: 'BRL', flag: '🇧🇷', rate: 4.97 },
  { code: 'INR', flag: '🇮🇳', rate: 83 },
];

@Component({
  selector: 'amx-pricing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
})
export class PricingComponent {
  billing      = signal<'monthly' | 'annual'>('monthly');
  selectedPlan = signal<PricingPlan | null>(null);
  checkoutPlan = signal<PricingPlan | null>(null);
  paying       = signal(false);

  readonly currencies = CURRENCIES;
  selectedCurrency = signal(CURRENCIES[0]);

  convertedPrice = computed(() => {
    const plan = this.checkoutPlan();
    if (!plan) return 0;
    const usd = this.billing() === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    return usd * this.selectedCurrency().rate;
  });

  private readonly fb = inject(FormBuilder);
  payForm = this.fb.nonNullable.group({
    email:      ['', [Validators.required, Validators.email]],
    cardNumber: ['', [Validators.required, Validators.minLength(19)]],
    expiry:     ['', [Validators.required, Validators.minLength(5)]],
    cvc:        ['', [Validators.required, Validators.minLength(3)]],
    cardName:   ['', Validators.required],
    country:    ['UG', Validators.required],
  });

  openCheckout(plan: PricingPlan, event: Event): void {
    event.stopPropagation();
    this.selectedPlan.set(plan);
    this.checkoutPlan.set(plan);
    this.paying.set(false);
  }

  closeCheckout(event?: Event | MouseEvent): void {
    if (event && (event.target as HTMLElement).closest('.amx-checkout')) return;
    this.checkoutPlan.set(null);
  }

  submitPayment(): void {
    if (this.payForm.invalid) return;
    this.paying.set(true);
    setTimeout(() => {
      this.paying.set(false);
      this.checkoutPlan.set(null);
      alert('Subscription successful! Welcome to ' + this.selectedPlan()?.label);
    }, 1800);
  }

  readonly plans: PricingPlan[] = [
    {
      key: 'lite', label: 'PREMIUM LITE',
      icon: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
      monthlyPrice: 9.90, annualPrice: 7.90, downloadsPerDay: 5,
      gradient: 'linear-gradient(145deg,#ffffff 0%,#fff7ed 60%,#ffedd5 100%)',
      accentColor: '#f5820a',
      features: ['Access to the Academy','Any site archive','Simultaneous downloads','Maximum speed','Website without ads','Daily Updates','Immediate release'],
    },
    {
      key: 'pro', label: 'PREMIUM PRO',
      icon: 'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14',
      monthlyPrice: 19.90, annualPrice: 15.90, downloadsPerDay: 10,
      gradient: 'linear-gradient(145deg,#ffffff 0%,#fdf4ff 60%,#fae8ff 100%)',
      accentColor: '#a855f7',
      features: ['Access to the Academy','Any site archive','Simultaneous downloads','Maximum speed','Website without ads','Daily Updates','Immediate release'],
    },
    {
      key: 'plus', label: 'PREMIUM PLUS',
      icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      monthlyPrice: 34.90, annualPrice: 27.90, downloadsPerDay: 20,
      gradient: 'linear-gradient(145deg,#ffffff 0%,#f0fdf4 60%,#dcfce7 100%)',
      accentColor: '#22c55e',
      features: ['Access to the Academy','Any site archive','Simultaneous downloads','Maximum speed','Website without ads','Daily Updates','Immediate release'],
    },
  ];

  readonly benefits: Benefit[] = [
    { icon: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z', title: 'Exclusivity', desc: 'Get exclusive access to the PREMIUM arts created by our graphic design professionals.' },
    { icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3', title: 'Generous downloads', desc: 'Download according to your plan: 5, 10 or 20 daily downloads according to your chosen level.' },
    { icon: 'M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10', title: 'No ads', desc: 'Browse the entire site without seeing ads. With PREMIUM, no propaganda appears.' },
    { icon: 'M18 20V10M12 20V4M6 20v-6', title: "Don't use space on your hard drive", desc: 'All in the CLOUD, view all files before downloading to your computer.' },
    { icon: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15', title: 'Daily Updates', desc: 'Our partner designers ship arts every day, receive updates at no additional cost.' },
    { icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', title: 'Priority support', desc: 'Exclusive service for subscribers via WhatsApp from 8am to 10pm.' },
  ];

  readonly faqs: Faq[] = [
    { q: 'How does the download limit work?', a: 'Each plan allows a set number of downloads per day (5, 10 or 20). The counter resets at midnight UTC every day.', open: false },
    { q: 'Can I cancel my subscription at any time?', a: 'Yes. You can cancel at any time from your account settings. No cancellation fees apply and you keep access until the end of the billing period.', open: false },
    { q: 'What is the difference between monthly and annual payment?', a: 'Annual billing gives you a discounted monthly rate — you pay for 10 months and get 12. The full annual amount is charged upfront.', open: false },
    { q: 'Can downloaded files be used commercially?', a: 'Yes. All assets downloaded under a Premium plan come with a commercial licence for use in client work and paid projects.', open: false },
    { q: 'How is Premium activation done?', a: 'After payment is confirmed, your account is upgraded instantly. Refresh your session and premium features will be unlocked immediately.', open: false },
    { q: 'Can I switch plans later?', a: 'Absolutely. You can upgrade or downgrade at any time. Prorated credits are applied when switching between plans.', open: false },
  ];
}
