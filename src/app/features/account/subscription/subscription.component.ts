import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../core/auth/auth.service';
import { SubscriptionService } from '../../subscription/subscription.service';
import { Plan, Subscription } from '../../../core/models/subscription.model';

interface PlanOption extends Plan {
  popular?: boolean;
  features: string[];
}

interface PlanDiff {
  label: string;
  current: string;
  target: string;
}

@Component({
  selector: 'amx-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss',
})
export class SubscriptionComponent {
  private readonly authSvc = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly subscriptionSvc = inject(SubscriptionService);

  readonly user = computed(() => this.authSvc.currentUser());

  readonly plans: PlanOption[] = [
    {
      id: 'free', name: 'Free', price: 0, currency: 'USD', interval: 'month',
      dailyFreeDl: 3, dailyPremiumDl: 0, editorAccess: 'LIMITED', academyAccess: 'PREVIEW',
      collectionsAccess: false, workspaceSeats: 1,
      features: ['3 free downloads / day', 'Limited editor', 'Academy preview', '1 workspace seat'],
    },
    {
      id: 'premium-monthly', name: 'Premium', price: 19, currency: 'USD', interval: 'month',
      dailyFreeDl: null, dailyPremiumDl: 20, editorAccess: 'FULL', academyAccess: 'FULL',
      collectionsAccess: true, workspaceSeats: 3,
      features: ['Unlimited free downloads', '20 premium / day', 'Full editor', 'Full academy', '3 workspace seats'],
      popular: true,
    },
    {
      id: 'premium-annual', name: 'Premium Annual', price: 190, currency: 'USD', interval: 'year',
      dailyFreeDl: null, dailyPremiumDl: 50, editorAccess: 'FULL', academyAccess: 'FULL',
      collectionsAccess: true, workspaceSeats: 5,
      features: ['Unlimited free downloads', '50 premium / day', 'Full editor', 'Full academy', '5 workspace seats', '2 months free'],
    },
    {
      id: 'team', name: 'Team', price: 49, currency: 'USD', interval: 'month',
      dailyFreeDl: null, dailyPremiumDl: null, editorAccess: 'FULL', academyAccess: 'FULL',
      collectionsAccess: true, workspaceSeats: 15,
      features: ['Unlimited downloads', 'Full editor', 'Full academy', '15 workspace seats', 'Priority support', 'Team management'],
    },
  ];

  private readonly _planOverride = signal<PlanOption | null>(null);

  private readonly _defaultPlan = computed<PlanOption>(() => {
    const role = this.user()?.role ?? 'FREE';
    if (role === 'ADMIN' || role === 'PREMIUM') return this.plans[1];
    return this.plans[0];
  });

  readonly currentPlan = computed(() => this._planOverride() ?? this._defaultPlan());
  readonly currentPlanIndex = computed(() => this.plans.findIndex(p => p.id === this.currentPlan().id));

  readonly subscription = computed<Subscription>(() => {
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    return {
      id: 'sub_mock_001',
      userId: this.user()?.id ?? '',
      planId: this.currentPlan().id,
      status: 'ACTIVE',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: end.toISOString(),
      cancelAtPeriodEnd: false,
    };
  });

  readonly renewalDate = computed(() => {
    const d = new Date(this.subscription().currentPeriodEnd);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  });

  readonly statusLabel = computed(() => {
    const sub = this.subscription();
    if (sub.cancelAtPeriodEnd) return 'cancels';
    if (sub.status === 'CANCELED') return 'canceled';
    if (sub.status === 'PAST_DUE') return 'past-due';
    return 'active';
  });

  readonly isActive = computed(() => this.statusLabel() === 'active');
  readonly showDunning = computed(() => this.dunning() || this.subscription().status === 'PAST_DUE');
  readonly cancelEndDate = computed(() => {
    const d = new Date(this.subscription().currentPeriodEnd);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  });

  readonly dunning = signal(false);

  simulatePastDue(): void { this.dunning.set(true); }
  dismissDunning(): void { this.dunning.set(false); }

  readonly showCancelConfirm = signal(false);
  readonly showCancelSuccess = signal(false);
  readonly cancelSaving = signal(false);

  openCancelConfirm(): void { this.showCancelConfirm.set(true); }

  closeCancelConfirm(): void {
    if (!this.cancelSaving()) this.showCancelConfirm.set(false);
  }

  confirmCancel(): void {
    this.cancelSaving.set(true);
    this.subscriptionSvc.cancelSubscription().subscribe({
      next: () => {
        this.cancelSaving.set(false);
        this.showCancelConfirm.set(false);
        this.showCancelSuccess.set(true);
        setTimeout(() => this.showCancelSuccess.set(false), 4000);
      },
      error: () => {
        setTimeout(() => {
          this.cancelSaving.set(false);
          this.showCancelConfirm.set(false);
          this.showCancelSuccess.set(true);
          setTimeout(() => this.showCancelSuccess.set(false), 4000);
        }, 800);
      },
    });
  }

  readonly reactivating = signal(false);

  reactivate(): void {
    this.reactivating.set(true);
    setTimeout(() => {
      this.reactivating.set(false);
      this.showToastMsg('Subscription reactivated');
    }, 800);
  }

  readonly upgradeTarget = signal<PlanOption | null>(null);
  readonly upgradeSaving = signal(false);
  readonly upgradeError = signal('');

  readonly isDowngrade = computed(() => {
    const t = this.upgradeTarget();
    const c = this.currentPlan();
    if (!t || !c) return false;
    const tIdx = this.plans.findIndex(p => p.id === t.id);
    const cIdx = this.plans.findIndex(p => p.id === c.id);
    return tIdx < cIdx && c.price > 0;
  });

  readonly isAnnualSwitch = computed(() => {
    const t = this.upgradeTarget();
    const c = this.currentPlan();
    if (!t || !c) return false;
    return c.id === 'premium-monthly' && t.id === 'premium-annual';
  });

  readonly isUpgrade = computed(() => {
    if (!this.upgradeTarget()) return false;
    return !this.isDowngrade() && !this.isAnnualSwitch();
  });

  readonly planDiffs = computed<PlanDiff[]>(() => {
    const curr = this.currentPlan();
    const target = this.upgradeTarget();
    if (!curr || !target) return [];

    const fmtVal = (plan: PlanOption, field: string): string => {
      switch (field) {
        case 'dailyFreeDl': return plan.dailyFreeDl === null ? 'Unlimited' : String(plan.dailyFreeDl);
        case 'dailyPremiumDl': return plan.dailyPremiumDl === null ? 'Unlimited' : String(plan.dailyPremiumDl);
        case 'editorAccess': return plan.editorAccess === 'FULL' ? 'Full' : 'Limited';
        case 'academyAccess': return plan.academyAccess === 'FULL' ? 'Full' : 'Preview';
        case 'collectionsAccess': return plan.collectionsAccess ? 'Yes' : 'No';
        case 'workspaceSeats': return String(plan.workspaceSeats);
        default: return '';
      }
    };

    const pairs: { label: string; field: string }[] = [
      { label: 'Free downloads', field: 'dailyFreeDl' },
      { label: 'Premium downloads', field: 'dailyPremiumDl' },
      { label: 'Editor access', field: 'editorAccess' },
      { label: 'Academy', field: 'academyAccess' },
      { label: 'Collections', field: 'collectionsAccess' },
      { label: 'Workspace seats', field: 'workspaceSeats' },
    ];

    const diffs: PlanDiff[] = [];
    for (const p of pairs) {
      const c = fmtVal(curr, p.field);
      const t = fmtVal(target, p.field);
      if (c !== t) {
        diffs.push({ label: p.label, current: c, target: t });
      }
    }

    if (this.isAnnualSwitch()) {
      diffs.unshift({ label: 'Billing', current: '$19/month', target: '$190/year' });
    }

    return diffs;
  });

  openUpgrade(plan: PlanOption): void {
    if (plan.id === this.currentPlan().id) return;
    if (plan.id === 'team') {
      this.openContactSales();
      return;
    }
    this.upgradeError.set('');
    this.upgradeTarget.set(plan);
  }

  closeUpgrade(): void {
    if (!this.upgradeSaving()) {
      this.upgradeTarget.set(null);
      this.upgradeError.set('');
    }
  }

  confirmUpgrade(): void {
    const target = this.upgradeTarget();
    if (!target) return;

    this.upgradeSaving.set(true);
    this.upgradeError.set('');

    this.subscriptionSvc.checkout({
      planId: target.id,
      provider: 'stripe',
    }).subscribe({
      next: (res) => {
        this.upgradeSaving.set(false);
        this.upgradeTarget.set(null);
        this._planOverride.set(target);
        this.showToastMsg(`Switched to ${target.name}`);
        if (res.checkoutUrl) {
          window.open(res.checkoutUrl, '_blank');
        }
      },
      error: () => {
        setTimeout(() => {
          this.upgradeSaving.set(false);
          this.upgradeTarget.set(null);
          this._planOverride.set(target);
          this.showToastMsg(`Switched to ${target.name}`);
        }, 1200);
      },
    });
  }

  readonly showContactSales = signal(false);
  readonly contactSending = signal(false);
  readonly contactSent = signal(false);

  contactName = '';
  contactEmail = '';
  contactCompany = '';
  contactSize = 5;

  openContactSales(): void {
    this.showContactSales.set(true);
  }

  closeContactSales(): void {
    if (!this.contactSending()) {
      this.showContactSales.set(false);
      this.contactSent.set(false);
    }
  }

  sendContactInquiry(): void {
    this.contactSending.set(true);
    setTimeout(() => {
      this.contactSending.set(false);
      this.contactSent.set(true);
      setTimeout(() => {
        this.showContactSales.set(false);
        this.contactSent.set(false);
        this.showToastMsg('Thanks! Our team will reach out soon.');
      }, 1500);
    }, 1000);
  }

  readonly showToast = signal(false);
  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');

  private showToastMsg(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 4000);
  }

  safeIcon(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
