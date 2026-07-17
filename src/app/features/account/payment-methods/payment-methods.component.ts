import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface SavedMethod {
  id: string;
  type: 'card' | 'paypal' | 'mtn' | 'airtel';
  network?: 'visa' | 'mastercard';
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  holderName?: string;
  isDefault: boolean;
  phoneNumber?: string;
  email?: string;
}

type PaymentProvider = 'visa' | 'mastercard' | 'paypal' | 'mtn' | 'airtel';

const PAYMENT_STORAGE_KEY = 'amx_payment_methods';

const DEFAULT_METHODS: SavedMethod[] = [
  {
    id: 'card_1', type: 'card', network: 'visa', last4: '4242',
    expiryMonth: 8, expiryYear: 2027, holderName: 'Kafuluma P.', isDefault: true,
  },
  {
    id: 'card_2', type: 'card', network: 'mastercard', last4: '8888',
    expiryMonth: 12, expiryYear: 2026, holderName: 'Kafuluma P.', isDefault: false,
  },
  {
    id: 'pp_1', type: 'paypal', last4: '', email: 'kafulumap@gmail.com', isDefault: false,
  },
  {
    id: 'mobile_1', type: 'mtn', last4: '1234',
    phoneNumber: '+256 77 123 4567', holderName: 'Kafuluma P.', isDefault: false,
  },
];

function loadSavedMethods(): SavedMethod[] {
  try {
    const raw = localStorage.getItem(PAYMENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedMethod[]) : DEFAULT_METHODS;
  } catch { return DEFAULT_METHODS; }
}

@Component({
  selector: 'amx-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-methods.component.html',
  styleUrl: './payment-methods.component.scss',
})
export class PaymentMethodsComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly billingCountry = signal<'UG' | 'OTHER'>('UG');
  readonly showMobileMoney = computed(() => this.billingCountry() === 'UG');

  readonly savedMethods = signal<SavedMethod[]>(loadSavedMethods());

  constructor() {
    // Persist any change to savedMethods immediately
    effect(() => {
      try {
        localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(this.savedMethods()));
      } catch {}
    });
  }

  readonly showAddModal = signal(false);
  readonly newMethodType = signal<PaymentProvider>('visa');
  readonly newMethodSaving = signal(false);
  readonly addSuccess = signal(false);

  readonly newCardNumber = signal('');
  readonly newCardExpiry = signal('');
  readonly newCardCvc = signal('');
  readonly newCardName = signal('');
  readonly newPhoneNumber = signal('');
  readonly newEmail = signal('');
  readonly newIsDefault = signal(false);

  readonly addStep = signal(0);

  readonly removingMethod = signal<SavedMethod | null>(null);
  private removeTimeout: ReturnType<typeof setTimeout> | null = null;

  onCardNumberInput(value: string): void {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.newCardNumber.set(formatted.slice(0, 19));
  }

  onCardExpiryInput(value: string): void {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 2) {
      this.newCardExpiry.set(cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4));
    } else {
      this.newCardExpiry.set(cleaned);
    }
  }

  readonly detectedCardType = computed<'visa' | 'mastercard'>(() => {
    const num = this.newCardNumber().replace(/\s/g, '');
    if (num.startsWith('5')) return 'mastercard';
    return 'visa';
  });

  readonly previewNetwork = computed(() => {
    const t = this.newMethodType();
    if (t === 'visa' || t === 'mastercard') return this.detectedCardType();
    return t;
  });

  readonly previewDisplay = computed(() => {
    const raw = this.newCardNumber().replace(/\s/g, '');
    if (!raw) return '••••  ••••  ••••  ••••';
    const padded = (raw + '••••••••••••••••').slice(0, 16);
    return padded.replace(/(.{4})/g, '$1  ').trim();
  });

  readonly previewExpiry = computed(() => this.newCardExpiry() || 'MM/YY');

  readonly previewName = computed(() => {
    const n = this.newCardName().trim();
    return n || 'YOUR NAME';
  });

  toggleCountry(): void {
    this.billingCountry.update(c => c === 'UG' ? 'OTHER' : 'UG');
  }

  setDefault(id: string): void {
    this.savedMethods.update(list =>
      list.map(m => ({ ...m, isDefault: m.id === id }))
    );
  }

  removeMethod(id: string): void {
    const removed = this.savedMethods().find(m => m.id === id);
    if (!removed) return;

    if (this.removeTimeout) clearTimeout(this.removeTimeout);

    this.savedMethods.update(list => {
      const updated = list.filter(m => m.id !== id);
      if (removed.isDefault && updated.length > 0) {
        updated[0].isDefault = true;
      }
      return updated;
    });

    this.removingMethod.set(removed);
    this.removeTimeout = setTimeout(() => {
      this.removingMethod.set(null);
      this.removeTimeout = null;
    }, 5000);
  }

  undoRemove(): void {
    const method = this.removingMethod();
    if (!method) return;
    if (this.removeTimeout) {
      clearTimeout(this.removeTimeout);
      this.removeTimeout = null;
    }
    this.savedMethods.update(list => [...list, method]);
    this.removingMethod.set(null);
  }

  isExpiringSoon(m: SavedMethod): boolean {
    if (!m.expiryMonth || !m.expiryYear) return false;
    const now = new Date();
    const monthsLeft = (m.expiryYear - now.getFullYear()) * 12 + (m.expiryMonth - (now.getMonth() + 1));
    return monthsLeft >= 0 && monthsLeft <= 2;
  }

  openAddModalWith(provider: PaymentProvider): void {
    this.openAddModal();
    this.newMethodType.set(provider);
  }

  openAddModal(): void {
    this.newMethodType.set('visa');
    this.newCardNumber.set('');
    this.newCardExpiry.set('');
    this.newCardCvc.set('');
    this.newCardName.set('');
    this.newPhoneNumber.set('');
    this.newEmail.set('');
    this.newIsDefault.set(false);
    this.addStep.set(0);
    this.addSuccess.set(false);
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    if (!this.newMethodSaving()) this.showAddModal.set(false);
  }

  selectProvider(provider: PaymentProvider): void {
    this.newMethodType.set(provider);
  }

  nextStep(): void {
    this.addStep.update(s => s + 1);
  }

  prevStep(): void {
    this.addStep.update(s => s - 1);
  }

  confirmAdd(): void {
    this.newMethodSaving.set(true);
    setTimeout(() => {
      const provider = this.newMethodType();
      const isCard = provider === 'visa' || provider === 'mastercard';
      const isMobile = provider === 'mtn' || provider === 'airtel';
      const id = `${provider}_${Date.now()}`;
      const method: SavedMethod = {
        id,
        type: isCard ? 'card' : provider === 'paypal' ? 'paypal' : provider,
        network: isCard ? provider : undefined,
        last4: isCard
          ? this.newCardNumber().replace(/\s/g, '').slice(-4)
          : (isMobile ? this.newPhoneNumber().slice(-4) : ''),
        holderName: this.newCardName() || undefined,
        email: provider === 'paypal' ? this.newEmail() : undefined,
        phoneNumber: isMobile ? this.newPhoneNumber() : undefined,
        isDefault: this.newIsDefault() || this.savedMethods().length === 0,
      };

      this.savedMethods.update(list => {
        if (method.isDefault) {
          return [...list.map(m => ({ ...m, isDefault: false })), method];
        }
        return [...list, method];
      });

      this.newMethodSaving.set(false);
      this.addSuccess.set(true);
      setTimeout(() => {
        this.addSuccess.set(false);
        this.showAddModal.set(false);
      }, 1200);
    }, 800);
  }

  readonly providerIcon: Record<PaymentProvider, string> = {
    visa: `<img src="assets/images/thumbnails/Visa logo png image.jpeg" alt="Visa" style="height:22px;width:auto;display:block">`,
    mastercard: `<img src="assets/images/thumbnails/mastercard.jpeg" alt="Mastercard" style="height:22px;width:auto;display:block">`,
    paypal: `<img src="assets/images/thumbnails/PayPal.jpeg" alt="PayPal" style="height:22px;width:auto;display:block">`,
    mtn: `<img src="assets/images/thumbnails/MTN Logo PNG Vector (EPS) Free Download.jpeg" alt="MTN" style="height:22px;width:auto;display:block">`,
    airtel: `<img src="assets/images/thumbnails/Airtel Lottery.jpeg" alt="Airtel" style="height:22px;width:auto;display:block">`,
  };

  readonly providerName: Record<PaymentProvider, string> = {
    visa: 'Visa', mastercard: 'Mastercard', paypal: 'PayPal', mtn: 'MTN Mobile Money', airtel: 'Airtel Money',
  };

  readonly providerColor: Record<PaymentProvider, string> = {
    visa: '#1A1F71',
    mastercard: '#EB001B',
    paypal: '#003087',
    mtn: '#FFCC00',
    airtel: '#E30000',
  };

  readonly providerGradient: Record<PaymentProvider, string> = {
    visa: 'linear-gradient(135deg, #0d1542 0%, #1A1F71 35%, #2a3d8f 65%, #4a6abd 100%)',
    mastercard: 'linear-gradient(135deg, #8a0012 0%, #EB001B 35%, #F79E1B 70%, #ffb74d 100%)',
    paypal: 'linear-gradient(135deg, #001435 0%, #003087 35%, #0070e0 65%, #009cde 100%)',
    mtn: 'linear-gradient(135deg, #cc9900 0%, #FFCC00 35%, #ffe066 65%, #fff5cc 100%)',
    airtel: 'linear-gradient(135deg, #5e0000 0%, #a30000 25%, #E30000 50%, #cc3333 75%, #991111 100%)',
  };

  readonly providerLogoWhite: Record<PaymentProvider, boolean> = {
    visa: true, mastercard: true, paypal: true, mtn: false, airtel: true,
  };

  providerKey(m: SavedMethod): PaymentProvider {
    return (m.network || (m.type === 'card' ? 'visa' : m.type)) as PaymentProvider;
  }

  safeIcon(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
