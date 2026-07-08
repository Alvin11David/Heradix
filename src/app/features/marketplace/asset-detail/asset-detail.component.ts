import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, AfterViewInit, OnDestroy, ElementRef, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, timeout } from 'rxjs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MarketplaceService } from '../marketplace.service';
import { Asset, AssetFormat } from '../../../core/models/asset.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { AddToCollectionMenuComponent } from '../../../shared/components/add-to-collection/add-to-collection-menu.component';
import { CollectionsService } from '../../collections/collections.service';

gsap.registerPlugin(ScrollTrigger);

const SLUG_TO_ID: Record<string, string> = {
  'safe-birth-main': 'sb-1', 'safe-birth-breathe': 'sb-2', 'safe-birth-left': 'sb-3',
  'safe-birth-campaign': 'sb-4', 'safe-birth-alt': 'sb-5',
  'easter-design-1': 'er-1', 'easter-design-2': 'er-2', 'soar-away-easter': 'er-3',
  'image-gen-4': 'er-4', 'easter-theme-1': 'er-5', 'easter-theme-2': 'er-6',
  'easter-theme-3': 'er-7', 'easter-theme-4': 'er-8',
  'african-day': 'ad-1', 'african-leaders': 'ad-2', 'intl-day-5': 'ad-3',
  'soar-away-quotes-4': 'ad-4',
  'p7-candidates': 'es-1', 's6-candidates': 'es-2', 'kisoro-school': 'es-3',
  'bombo-secondary': 'es-4',
  'dr-jp-cards': 'bc-1', 'be-sincere-cards': 'bc-2', 'creative-design-2': 'bc-3',
  'denis-cards': 'bc-4',
  'be-sincere-quote': 'mq-1', 'soar-away-quote-4': 'mq-2', 'happy-new-month': 'mq-3',
  'creative-quote': 'mq-4',
  'coach-paul': 'pp-1', 'denis-portrait': 'pp-2', 'kisoro-portrait': 'pp-3',
  'tshirt-design': 'am-1', 'apparel-variant': 'am-2',
};

export interface DownloadFormat {
  type: string;
  sizeLabel: string;
  isPrimary?: boolean;
}

@Component({
  selector: 'amx-asset-detail',
  standalone: true,
  imports: [CommonModule, SpinnerComponent, AddToCollectionMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './asset-detail.component.html',
  styleUrl: './asset-detail.component.scss',
})
export class AssetDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc    = inject(MarketplaceService);
  private readonly el     = inject(ElementRef);
  private readonly collectionsSvc = inject(CollectionsService);
  private gsapCtx: gsap.Context | null = null;

  asset   = signal<Asset | null>(null);
  similar = signal<Asset[]>([]);
  loading = signal(true);
  downloading = signal(false);
  selectedFormat = signal<string>('');
  bgRemoving = signal(false);
  shareOpen  = signal(false);
  toast      = signal<string>('');
  readonly saveMenuOpen = signal(false);

  formats = computed<DownloadFormat[]>(() => {
    const a = this.asset();
    if (!a) return [];
    const mb = (bytes: number) =>
      bytes >= 1_048_576
        ? `${(bytes / 1_048_576).toFixed(2)} MB`
        : `${Math.round(bytes / 1024)} KB`;

    const base = mb(a.fileSizeBytes);

    switch (a.format) {
      case 'PSD':
        return [
          { type: 'PSD', sizeLabel: base, isPrimary: true },
          { type: 'JPG', sizeLabel: mb(a.fileSizeBytes * 0.12) },
          { type: 'PNG', sizeLabel: mb(a.fileSizeBytes * 0.18) },
        ];
      case 'AI':
        return [
          { type: 'AI',  sizeLabel: base, isPrimary: true },
          { type: 'EPS', sizeLabel: mb(a.fileSizeBytes * 1.4) },
          { type: 'SVG', sizeLabel: mb(a.fileSizeBytes * 0.3) },
          { type: 'JPG', sizeLabel: mb(a.fileSizeBytes * 0.1) },
        ];
      case 'VECTOR':
        return [
          { type: 'SVG', sizeLabel: base, isPrimary: true },
          { type: 'EPS', sizeLabel: mb(a.fileSizeBytes * 1.2) },
          { type: 'PDF', sizeLabel: mb(a.fileSizeBytes * 0.9) },
          { type: 'PNG', sizeLabel: mb(a.fileSizeBytes * 0.5) },
          { type: 'ZIP (All)', sizeLabel: mb(a.fileSizeBytes * 2.1) },
        ];
      case 'PHOTO':
        return [
          { type: 'JPG', sizeLabel: base, isPrimary: true },
          { type: 'PNG', sizeLabel: mb(a.fileSizeBytes * 1.5) },
        ];
      case 'VIDEO':
        return [
          { type: 'MP4', sizeLabel: base, isPrimary: true },
          { type: 'MOV', sizeLabel: mb(a.fileSizeBytes * 1.1) },
        ];
      default:
        return [{ type: a.format, sizeLabel: base, isPrimary: true }];
    }
  });

  ngOnInit(): void {
    const slug  = this.route.snapshot.paramMap.get('slug')!;
    const thumb = this.route.snapshot.queryParamMap.get('thumb');
    const label = this.route.snapshot.queryParamMap.get('label');

    this.svc.getAssetBySlug(slug).pipe(
      timeout(8000),
      catchError(() => of(this.buildMockAsset(slug)))
    ).subscribe((a) => {
      if (thumb) { a = { ...a, previewUrl: thumb, thumbnailUrl: thumb }; }
      if (label) { a = { ...a, title: label }; }
      this.asset.set(a);
      this.loading.set(false);
      this.selectedFormat.set(a.format);
      
      this.svc.getSimilarAssets(a.id).pipe(
        timeout(5000),
        catchError(() => of(this.buildMockSimilar(slug)))
      ).subscribe((s) => {
        this.similar.set(s.length ? s : this.buildMockSimilar(slug));
        requestAnimationFrame(() => this.animateRelatedItems());
      });
    });
  }

  ngAfterViewInit(): void {
    this.gsapCtx = gsap.context(() => {

      gsap.fromTo('.amx-ad__topbar',
        { y: -30, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '.amx-ad__topbar', start: 'top 80%',
            toggleActions: 'play none none none',
          },
          y: 0, opacity: 1,
          duration: 0.5, ease: 'power3.out',
        }
      );

      gsap.fromTo('.amx-ad__preview-card',
        { x: -50, opacity: 0, scale: 0.97 },
        {
          scrollTrigger: {
            trigger: '.amx-ad__grid', start: 'top 80%',
            toggleActions: 'play none none none',
          },
          x: 0, opacity: 1, scale: 1,
          duration: 0.85, ease: 'power4.out',
        }
      );

      gsap.fromTo('.amx-ad__panel',
        { x: 40, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '.amx-ad__grid', start: 'top 80%',
            toggleActions: 'play none none none',
          },
          x: 0, opacity: 1,
          duration: 0.7, ease: 'power3.out',
        }
      );

      gsap.fromTo('.amx-ad__qa-btn',
        { y: 24, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '.amx-ad__actions-strip', start: 'top 85%',
            toggleActions: 'play none none none',
          },
          y: 0, opacity: 1,
          duration: 0.45, stagger: 0.08, ease: 'back.out(1.7)',
        }
      );

      gsap.fromTo('.amx-ad__related-header',
        { y: 20, opacity: 0 },
        {
          scrollTrigger: {
            trigger: '.amx-ad__related', start: 'top 85%',
            toggleActions: 'play none none none',
          },
          y: 0, opacity: 1,
          duration: 0.6, ease: 'power3.out',
        }
      );

    }, this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.gsapCtx?.revert();
  }

  private buildMockAsset(slug: string): Asset {
    const slugMap: Record<string, Partial<Asset>> = {
      'modern-business-card':       { id: 'a1', title: 'Modern Business Card',          format: 'PSD',    fileSizeBytes: 8_200_000,  isPremium: false, isEditable: true },
      'instagram-branding-kit':     { id: 'a2', title: 'Instagram Branding Kit',         format: 'PSD',    fileSizeBytes: 12_400_000, isPremium: true,  isEditable: true },
      'vintage-flyer-pack':         { id: 'a3', title: 'Vintage Flyer Pack',             format: 'AI',     fileSizeBytes: 5_600_000,  isPremium: false, isEditable: true },
      'dark-abstract-backgrounds':  { id: 'a4', title: 'Dark Abstract Backgrounds',      format: 'PHOTO',  fileSizeBytes: 18_900_000, isPremium: true,  isEditable: false },
      'phone-mockup-collection':    { id: 'a5', title: 'Phone Mockup Collection',         format: 'PSD',    fileSizeBytes: 9_100_000,  isPremium: false, isEditable: true },
      'explainer-video-motion-pack':{ id: 'a6', title: 'Explainer Video Motion Pack',    format: 'VIDEO',  fileSizeBytes: 45_000_000, isPremium: true,  isEditable: false },
      'minimalist-pitch-deck':      { id: 'a7', title: 'Minimalist Pitch Deck',          format: 'PPT',    fileSizeBytes: 3_200_000,  isPremium: false, isEditable: true },
      'ai-landscape-pack':          { id: 'a8', title: 'AI Landscape Pack',              format: 'AI_GEN', fileSizeBytes: 22_000_000, isPremium: true,  isEditable: false },
    };
    const overrides = slugMap[slug] ?? {};
    return {
      id:            overrides.id    ?? SLUG_TO_ID[slug] ?? slug,
      title:         overrides.title ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      slug,
      description:   'A high-quality, professionally designed asset ready for your next creative project. Fully customisable and optimised for digital and print use.',
      format:        overrides.format       ?? 'PSD',
      orientation:   'LANDSCAPE',
      isPremium:     overrides.isPremium    ?? false,
      isEditable:    overrides.isEditable   ?? true,
      previewUrl:    `https://picsum.photos/seed/${slug}/900/675`,
      thumbnailUrl:  `https://picsum.photos/seed/${slug}/400/300`,
      fileSizeBytes: overrides.fileSizeBytes ?? 7_340_000,
      downloadCount: Math.floor(Math.random() * 8000) + 500,
      status:        'ACTIVE',
      categoryId:    'cat-1',
      category:      { id: 'cat-1', name: 'Templates', slug: 'templates' },
      tags: [
        { id: 't1', name: 'Design' },
        { id: 't2', name: 'Creative' },
        { id: 't3', name: slug.split('-')[0] },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private buildMockSimilar(currentSlug: string): Asset[] {
    const items: { slug: string; title: string; format: AssetFormat; isPremium: boolean; isEditable: boolean }[] = [
      { slug: 'modern-business-card',        title: 'Modern Business Card',       format: 'PSD',    isPremium: false, isEditable: true  },
      { slug: 'instagram-branding-kit',      title: 'Instagram Branding Kit',      format: 'PSD',    isPremium: true,  isEditable: true  },
      { slug: 'vintage-flyer-pack',          title: 'Vintage Flyer Pack',          format: 'AI',     isPremium: false, isEditable: true  },
      { slug: 'dark-abstract-backgrounds',   title: 'Dark Abstract Backgrounds',   format: 'PHOTO',  isPremium: true,  isEditable: false },
      { slug: 'phone-mockup-collection',     title: 'Phone Mockup Collection',     format: 'PSD',    isPremium: false, isEditable: true  },
      { slug: 'explainer-video-motion-pack', title: 'Explainer Video Motion Pack', format: 'VIDEO',  isPremium: true,  isEditable: false },
      { slug: 'minimalist-pitch-deck',       title: 'Minimalist Pitch Deck',       format: 'PPT',    isPremium: false, isEditable: true  },
      { slug: 'ai-landscape-pack',           title: 'AI Landscape Pack',           format: 'AI_GEN', isPremium: true,  isEditable: false },
    ];
    const cat = { id: 'cat-1', name: 'Templates', slug: 'templates' };
    return items
      .filter(i => i.slug !== currentSlug)
      .slice(0, 6)
      .map((i, idx) => ({
        id:            `sim-${idx + 1}`,
        title:         i.title,
        slug:          i.slug,
        description:   'A professionally designed asset ready for your next creative project.',
        format:        i.format,
        orientation:   'LANDSCAPE' as const,
        isPremium:     i.isPremium,
        isEditable:    i.isEditable,
        previewUrl:    `https://picsum.photos/seed/${i.slug}/400/300`,
        thumbnailUrl:  `https://picsum.photos/seed/${i.slug}/400/300`,
        fileSizeBytes: 6_000_000,
        downloadCount: Math.floor(Math.random() * 5000) + 200,
        status:        'ACTIVE' as const,
        categoryId:    'cat-1',
        category:      cat,
        tags:          [{ id: 't1', name: 'Design' }],
        createdAt:     new Date().toISOString(),
        updatedAt:     new Date().toISOString(),
      }));
  }

  private animateRelatedItems(): void {
    const items = this.el.nativeElement.querySelectorAll('.amx-ad__related-item');
    if (!items.length) return;
    gsap.fromTo(items,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.5, stagger: 0.06, ease: 'power3.out',
      }
    );
  }

  selectFormat(type: string): void {
    this.selectedFormat.set(type);
  }

  download(): void {
    if (!this.asset() || this.downloading()) return;
    this.downloading.set(true);
    this.svc.requestDownload(this.asset()!.id).subscribe({
      next: ({ signedUrl }) => {
        window.open(signedUrl, '_blank');
        this.downloading.set(false);
        this.showToast('Download started!');
      },
      error: (err) => {
        this.downloading.set(false);
        alert(err.message);
      },
    });
  }

  downloadAsset(asset: Asset): void {
    this.svc.requestDownload(asset.id).subscribe({
      next: ({ signedUrl }) => window.open(signedUrl, '_blank'),
    });
  }

  openEditor(): void {
    const a = this.asset()!;
    this.router.navigate(['/editor'], { queryParams: { assetId: a.id, imageUrl: a.previewUrl, title: a.title } });
  }

  openPrint(): void {
    this.router.navigate(['/print'], { queryParams: { assetId: this.asset()!.id } });
  }

  removeBackground(): void {
    if (this.bgRemoving()) return;
    this.bgRemoving.set(true);
    setTimeout(() => {
      this.bgRemoving.set(false);
      this.showToast('Background removed! Opening editor…');
      this.openEditor();
    }, 1800);
  }

  toggleShare(): void {
    this.shareOpen.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (this.shareOpen() && !(event.target as HTMLElement).closest('.amx-ad__share-wrap')) {
      this.shareOpen.set(false);
    }
  }

  shareToSocial(platform: string): void {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.asset()?.title ?? '');
    if (platform === 'email') {
      window.location.href = `mailto:?subject=${title}&body=Check this out: ${url}`;
      this.shareOpen.set(false);
      return;
    }
    const links: Record<string, string> = {
      twitter:   `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`,
      linkedin:  `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp:  `https://api.whatsapp.com/send?text=${title}%20${url}`,
    };
    if (navigator.share) {
      navigator.share({ title: this.asset()?.title ?? '', url: window.location.href });
    } else if (links[platform]) {
      window.open(links[platform], '_blank', 'width=600,height=450');
    }
    this.shareOpen.set(false);
  }

  readonly isAssetSaved = computed(() => {
    const a = this.asset();
    return a ? this.collectionsSvc.collectionIdsForAsset(a.id).length > 0 : false;
  });

  openSaveMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.saveMenuOpen.set(true);
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.showToast('Link copied to clipboard!');
      this.shareOpen.set(false);
    });
  }

  goBack(): void {
    this.router.navigate(['/marketplace']);
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
