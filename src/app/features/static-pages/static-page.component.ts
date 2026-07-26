import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface PageContent {
  title: string;
  subtitle: string;
  icon: string;
  sections: { heading: string; body: string }[];
}

const PAGES: Record<string, PageContent> = {
  about: {
    title: 'About Amarapix',
    subtitle: 'Premium design assets for creators, designers and agencies worldwide.',
    icon: '✦',
    sections: [
      {
        heading: 'Our Mission',
        body: 'Amarapix was founded with a single belief: great design should be accessible to everyone. We curate and create premium graphic assets — vectors, PSD templates, mockups, icons, photos and more — so designers and businesses can bring ideas to life faster.',
      },
      {
        heading: 'What We Offer',
        body: 'From a sprawling marketplace of over one million assets to an in-browser canvas editor, AI-powered design tools, and an academy of world-class courses, Amarapix is the end-to-end creative platform for modern teams.',
      },
      {
        heading: 'Our Story',
        body: 'Born out of frustration with fragmented, overpriced design tool ecosystems, our team of designers and engineers built the platform they wished existed. Today we serve hundreds of thousands of creators across more than 80 countries.',
      },
      {
        heading: 'Built for Creators',
        body: 'Whether you are a solo freelancer, a growing agency, or a global brand, Amarapix scales with you. Every plan includes commercial licensing, so you can use any asset in client projects without worry.',
      },
    ],
  },
  contact: {
    title: 'Contact Us',
    subtitle: "We'd love to hear from you. Reach out through any of the channels below.",
    icon: '✉',
    sections: [
      {
        heading: 'General Enquiries',
        body: 'For general questions about Amarapix, our assets, or your account, email us at hello@amarapix.com. We typically respond within one business day.',
      },
      {
        heading: 'Sales & Partnerships',
        body: 'Interested in an enterprise plan, a brand partnership, or a bulk licensing deal? Contact our sales team at sales@amarapix.com.',
      },
      {
        heading: 'Technical Support',
        body: 'Experiencing a technical issue? Use the in-app support chat or email support@amarapix.com with a description of the problem and your account email.',
      },
      {
        heading: 'Press & Media',
        body: 'For press enquiries, interview requests, or media assets, please contact press@amarapix.com.',
      },
    ],
  },
  careers: {
    title: 'Careers at Amarapix',
    subtitle: 'Join a passionate team building the future of creative tools.',
    icon: '◈',
    sections: [
      {
        heading: 'Why Amarapix',
        body: 'We are a remote-first company that values creativity, ownership, and work-life balance. Every team member ships real features and is a direct contributor to a platform used by hundreds of thousands of people.',
      },
      {
        heading: 'Open Roles',
        body: 'We regularly hire for roles in engineering, design, content, marketing and customer success. Check our LinkedIn page or email careers@amarapix.com to enquire about current openings.',
      },
      {
        heading: 'Our Culture',
        body: 'We move fast but care about quality. We give each other direct, constructive feedback. We celebrate wins and learn openly from mistakes. Diversity of thought and background makes our product better.',
      },
      {
        heading: 'Benefits',
        body: 'Competitive salary · Full remote flexibility · Premium access to Amarapix · Learning & development budget · Annual team retreat · Health allowance',
      },
    ],
  },
  licence: {
    title: 'Types of Licence',
    subtitle: 'Understand how you can use Amarapix assets in your projects.',
    icon: '⊙',
    sections: [
      {
        heading: 'Free Licence',
        body: 'Free assets may be used in personal and commercial projects with attribution. They may not be resold as standalone files, used in print-on-demand products, or included in template marketplaces.',
      },
      {
        heading: 'Premium Licence',
        body: 'Premium assets (available to subscribers) come with a full commercial licence. Use them in unlimited client projects, digital products, social media, advertising, and merchandise — no attribution required.',
      },
      {
        heading: 'Extended Licence',
        body: 'Need to include an asset in a product you will sell (e.g. a UI kit, a template pack, or a print-on-demand item)? Contact us to discuss an Extended Licence for that specific asset.',
      },
      {
        heading: 'What Is Never Allowed',
        body: 'Regardless of licence tier, you may not: redistribute original or minimally modified files, claim authorship of our assets, or use them in ways that promote hate, violence, or illegal activity.',
      },
    ],
  },
  refund: {
    title: 'Refund Policy',
    subtitle: 'We want you to be happy with your Amarapix subscription.',
    icon: '↩',
    sections: [
      {
        heading: '7-Day Money-Back Guarantee',
        body: 'If you are not satisfied with your Premium subscription, contact us within 7 days of your initial purchase and we will issue a full refund — no questions asked.',
      },
      {
        heading: 'Renewal Charges',
        body: 'Subscription renewals are non-refundable. If you do not wish to renew, cancel your subscription at least 24 hours before the renewal date. You will retain access until the end of your current billing period.',
      },
      {
        heading: 'One-Time Purchases',
        body: 'Extended licences and one-time asset purchases are non-refundable once the download has been initiated, as digital files cannot be "returned".',
      },
      {
        heading: 'How to Request a Refund',
        body: 'Email billing@amarapix.com with your account email and purchase date. Refunds are processed within 5–10 business days depending on your payment provider.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Please read these terms carefully before using Amarapix.',
    icon: '§',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By accessing or using Amarapix you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our platform.',
      },
      {
        heading: '2. Your Account',
        body: 'You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at security@amarapix.com if you suspect unauthorised access.',
      },
      {
        heading: '3. Intellectual Property',
        body: 'All assets on Amarapix are owned by Amarapix Media Ltd or licensed from contributing artists. Your licence to use any asset is governed by the applicable Licence type (see Types of Licence). You do not acquire ownership of any asset by downloading it.',
      },
      {
        heading: '4. Prohibited Uses',
        body: 'You may not use Amarapix to upload, store, or distribute unlawful, defamatory, infringing, or harmful content. We reserve the right to terminate accounts that violate these terms.',
      },
      {
        heading: '5. Disclaimer & Limitation of Liability',
        body: 'Amarapix is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Amarapix Media Ltd shall not be liable for any indirect or consequential damages arising from your use of the platform.',
      },
      {
        heading: '6. Changes to These Terms',
        body: 'We may update these terms from time to time. Continued use of Amarapix after changes are posted constitutes acceptance. Last updated: July 2025.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your personal data.',
    icon: '⊕',
    sections: [
      {
        heading: 'Data We Collect',
        body: 'We collect information you provide directly (name, email, payment details) and data generated by your use of Amarapix (downloads, searches, editor activity). We also use standard analytics and error-tracking tools.',
      },
      {
        heading: 'How We Use Your Data',
        body: 'We use your data to operate and improve the platform, process payments, send account-related communications, and personalise your experience. We do not sell your personal data to third parties.',
      },
      {
        heading: 'Cookies',
        body: 'Amarapix uses essential cookies for authentication and optional analytics cookies to understand how users interact with the platform. You can manage cookie preferences in your browser settings.',
      },
      {
        heading: 'Your Rights',
        body: 'Depending on your location you may have rights to access, correct, or delete your personal data. Submit requests to privacy@amarapix.com. We will respond within 30 days.',
      },
      {
        heading: 'Data Retention & Security',
        body: 'We retain your data for as long as your account is active or as required by law. We use industry-standard encryption and access controls to protect your information.',
      },
      {
        heading: 'Contact',
        body: 'Questions about this policy? Email privacy@amarapix.com or write to Amarapix Media Ltd, 71–75 Shelton Street, London, WC2H 9JQ, United Kingdom.',
      },
    ],
  },
  report: {
    title: 'Report a File',
    subtitle: 'Help us keep Amarapix safe and legally compliant.',
    icon: '⚑',
    sections: [
      {
        heading: 'What Can Be Reported',
        body: 'You may report any asset that you believe infringes your copyright, contains illegal content, is improperly labelled, or violates our community standards.',
      },
      {
        heading: 'Copyright Infringement (DMCA)',
        body: 'If you believe an asset on Amarapix infringes your copyright, please send a DMCA takedown notice to legal@amarapix.com. Include: a description of the copyrighted work, the URL of the infringing asset, your contact details, and a statement of good faith belief.',
      },
      {
        heading: 'Other Violations',
        body: 'For non-copyright issues (illegal content, hate speech, misleading files), email abuse@amarapix.com with the asset URL and a brief description of the problem.',
      },
      {
        heading: 'Response Time',
        body: 'We review all reports within 3 business days and take appropriate action. Valid DMCA notices result in the asset being removed pending investigation.',
      },
    ],
  },
};

@Component({
  selector: 'amx-static-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="amx-static">
      <div class="amx-static__hero">
        <div class="amx-static__inner">
          <span class="amx-static__icon">{{ page().icon }}</span>
          <h1 class="amx-static__title">{{ page().title }}</h1>
          <p class="amx-static__subtitle">{{ page().subtitle }}</p>
        </div>
      </div>

      <div class="amx-static__body">
        <div class="amx-static__inner">
          <div class="amx-static__sections">
            <section class="amx-static__section" *ngFor="let s of page().sections">
              <h2 class="amx-static__section-heading">{{ s.heading }}</h2>
              <p class="amx-static__section-body">{{ s.body }}</p>
            </section>
          </div>

          <div class="amx-static__cta">
            <a routerLink="/marketplace" class="amx-static__back-link">← Back to Marketplace</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .amx-static {
      min-height: 100vh;
      background: #0a0a0a;
      color: #e5e5e5;
      font-family: inherit;
    }

    .amx-static__hero {
      background: linear-gradient(135deg, #111 0%, #1a1a1a 100%);
      border-bottom: 1px solid #222;
      padding: 80px 24px 60px;
      text-align: center;
    }

    .amx-static__inner {
      max-width: 760px;
      margin: 0 auto;
    }

    .amx-static__icon {
      display: block;
      font-size: 2.5rem;
      margin-bottom: 20px;
      color: #f5820a;
    }

    .amx-static__title {
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #fff;
      margin: 0 0 16px;
    }

    .amx-static__subtitle {
      font-size: 1.125rem;
      color: #888;
      margin: 0;
      line-height: 1.6;
    }

    .amx-static__body {
      padding: 60px 24px 100px;
    }

    .amx-static__sections {
      display: grid;
      gap: 40px;
    }

    .amx-static__section {
      padding: 32px;
      background: #141414;
      border: 1px solid #222;
      border-radius: 12px;
    }

    .amx-static__section-heading {
      font-size: 1.125rem;
      font-weight: 600;
      color: #fff;
      margin: 0 0 12px;
    }

    .amx-static__section-body {
      font-size: 0.9375rem;
      color: #aaa;
      line-height: 1.75;
      margin: 0;
    }

    .amx-static__cta {
      margin-top: 48px;
      text-align: center;
    }

    .amx-static__back-link {
      color: #f5820a;
      text-decoration: none;
      font-size: 0.9375rem;
      font-weight: 500;
      transition: opacity 0.15s;

      &:hover { opacity: 0.75; }
    }
  `],
})
export class StaticPageComponent {
  private readonly router = inject(Router);

  readonly page = computed<PageContent>(() => {
    const url = this.router.url.replace(/^\//, '').split('?')[0];
    return PAGES[url] ?? {
      title: 'Page Not Found',
      subtitle: 'The page you are looking for does not exist.',
      icon: '⊗',
      sections: [{ heading: 'Go back', body: 'Use the navigation above or click the link below to return to the marketplace.' }],
    };
  });
}
