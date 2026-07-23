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
  popular: boolean;
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

const ANNUAL_DISCOUNT = 0.20;

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
  paySuccess   = signal(false);
  payError     = signal('');

  readonly currencies = CURRENCIES;
  readonly annualDiscount = ANNUAL_DISCOUNT;
  selectedCurrency = signal(CURRENCIES[0]);

  monthlyPrice = (n: number) => n;
  annualPrice  = (n: number) => +(n * (1 - ANNUAL_DISCOUNT)).toFixed(2);

  displayPrice = computed(() => {
    const plan = this.checkoutPlan();
    if (!plan) return 0;
    const usd = this.billing() === 'monthly' ? plan.monthlyPrice : this.annualPrice(plan.monthlyPrice);
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
    this.payForm.markAllAsTouched();
    if (this.payForm.invalid) return;
    this.paying.set(true);
    this.payError.set('');

    // Simulate payment processing (real integration would use Stripe/payment SDK)
    setTimeout(() => {
      this.paying.set(false);
      const plan = this.selectedPlan();

      // Store subscription locally so the rest of the app reflects the upgrade
      try {
        localStorage.setItem('amx_subscription', JSON.stringify({
          planKey: plan?.key,
          planLabel: plan?.label,
          activatedAt: new Date().toISOString(),
          billingCycle: this.billing(),
        }));
      } catch { /* storage full */ }

      this.paySuccess.set(true);
      // Auto-close checkout after showing success screen
      setTimeout(() => {
        this.paySuccess.set(false);
        this.checkoutPlan.set(null);
      }, 3500);
    }, 1800);
  }

  readonly plans: PricingPlan[] = [
    {
      key: 'lite', label: 'Premium Lite',
      icon: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
      monthlyPrice: 9.90, annualPrice: 7.90, downloadsPerDay: 5, popular: false,
      features: [
        'Access to the Academy',
        '5 downloads / day',
        'Standard resolution assets',
        'Any site archive',
        'Website without ads',
        'Daily updates',
        'Email support',
      ],
    },
    {
      key: 'pro', label: 'Premium Pro',
      icon: 'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14',
      monthlyPrice: 19.90, annualPrice: 15.90, downloadsPerDay: 10, popular: true,
      features: [
        'Everything in Lite',
        '10 downloads / day',
        'High resolution assets',
        'Commercial license',
        'Simultaneous downloads',
        'Priority support',
        'Exclusive PRO assets',
        'Early access to new content',
      ],
    },
    {
      key: 'plus', label: 'Premium Plus',
      icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      monthlyPrice: 34.90, annualPrice: 27.90, downloadsPerDay: 20, popular: false,
      features: [
        'Everything in Pro',
        '20 downloads / day',
        'Ultra HD / vector assets',
        'Unlimited simultaneous downloads',
        'Custom asset requests',
        'Team collaboration',
        'Enterprise-grade support',
        'Dedicated account manager',
      ],
    },
  ];

  readonly benefits: Benefit[] = [
    { icon: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z', title: 'Exclusive Access', desc: 'Get exclusive access to premium arts created by our professional graphic designers.' },
    { icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3', title: 'Generous Downloads', desc: 'Choose your plan: 5, 10 or 20 daily downloads to suit your creative workflow.' },
    { icon: 'M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10', title: 'Ad-Free Experience', desc: 'Browse the entire marketplace without any ads or interruptions.' },
    { icon: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15', title: 'Daily Updates', desc: 'New assets shipped every day by our partner designers — always fresh content.' },
    { icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', title: 'Priority Support', desc: 'Subscribers get priority support via WhatsApp and email from 8am to 10pm.' },
    { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', title: 'Secure & Reliable', desc: 'All transactions are encrypted and you are protected by our 30-day satisfaction guarantee.' },
  ];

  readonly faqs: Faq[] = [
    { q: 'How does the download limit work?', a: 'Each plan allows a set number of downloads per day (5, 10 or 20). The counter resets at midnight UTC every day. Unused downloads do not carry over.', open: false },
    { q: 'Can I cancel my subscription at any time?', a: 'Yes. You can cancel at any time from your account settings. No cancellation fees apply and you keep access until the end of the billing period.', open: false },
    { q: 'What is the difference between monthly and annual payment?', a: 'Annual billing gives you a 20% discount on the monthly rate — you effectively get 2 months free every year. The full annual amount is charged upfront.', open: false },
    { q: 'Can downloaded files be used commercially?', a: 'Yes. All assets downloaded under a Premium plan come with a commercial licence for use in client work and paid projects.', open: false },
    { q: 'How is Premium activation done?', a: 'After payment is confirmed, your account is upgraded instantly. Refresh your session and premium features will be unlocked immediately.', open: false },
    { q: 'Can I switch plans later?', a: 'Absolutely. You can upgrade or downgrade at any time. Prorated credits are applied when switching between plans.', open: false },
  ];
}
