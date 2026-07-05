import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

interface DownloadRecord {
  id: string;
  assetTitle: string;
  assetType: string;
  thumbnail: string;
  fileSize: number;
  format: string;
  downloadedAt: Date;
  status: 'completed' | 'processing' | 'failed';
}

@Component({
  selector: 'amx-downloads',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './downloads.component.html',
  styleUrl: './downloads.component.scss',
})
export class DownloadsComponent {
  readonly searchQuery = signal('');

  readonly sortColumn = signal<'date' | 'name' | 'size'>('date');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  readonly currentPage = signal(1);
  readonly pageSize = 8;

  private readonly allDownloads: DownloadRecord[] = [
    { id: 'd1',  assetTitle: 'Mountain Sunrise Landscape',      assetType: 'photo',   thumbnail: '', fileSize: 4_2_00_000, format: 'JPG',  downloadedAt: this.d(0),   status: 'completed' },
    { id: 'd2',  assetTitle: 'Abstract Geometry Pack',           assetType: 'vector',  thumbnail: '', fileSize: 1_8_00_000, format: 'SVG',  downloadedAt: this.d(-1),  status: 'completed' },
    { id: 'd3',  assetTitle: 'Minimal Brand Mockup',             assetType: 'mockup',  thumbnail: '', fileSize: 8_5_00_000, format: 'PSD',  downloadedAt: this.d(-2),  status: 'completed' },
    { id: 'd4',  assetTitle: 'Urban Photography Bundle',         assetType: 'photo',   thumbnail: '', fileSize: 1_2_00_000, format: 'RAW',  downloadedAt: this.d(-3),  status: 'completed' },
    { id: 'd5',  assetTitle: 'Social Media Template Kit',        assetType: 'template',thumbnail: '', fileSize: 3_4_00_000, format: 'AI',   downloadedAt: this.d(-5),  status: 'completed' },
    { id: 'd6',  assetTitle: 'Watercolor Texture Set',           assetType: 'photo',   thumbnail: '', fileSize: 2_1_00_000, format: 'PNG',  downloadedAt: this.d(-7),  status: 'completed' },
    { id: 'd7',  assetTitle: 'Logo Animation Pack',              assetType: 'vector',  thumbnail: '', fileSize: 5_6_00_000, format: 'MP4',  downloadedAt: this.d(-10), status: 'failed' },
    { id: 'd8',  assetTitle: 'E-commerce UI Components',         assetType: 'template',thumbnail: '', fileSize: 9_2_00_000, format: 'FIG',  downloadedAt: this.d(-14), status: 'completed' },
    { id: 'd9',  assetTitle: 'Vintage Font Collection',          assetType: 'vector',  thumbnail: '', fileSize: 1_5_00_000, format: 'TTF',  downloadedAt: this.d(-20), status: 'completed' },
    { id: 'd10', assetTitle: '3D Render – Glass Sculpture',      assetType: 'photo',   thumbnail: '', fileSize: 7_8_00_000, format: 'PNG',  downloadedAt: this.d(-30), status: 'processing' },
    { id: 'd11', assetTitle: 'Presentation Deck Template',       assetType: 'template',thumbnail: '', fileSize: 2_2_00_000, format: 'PPTX', downloadedAt: this.d(-45), status: 'completed' },
    { id: 'd12', assetTitle: 'Mockup – T-Shirt Print',           assetType: 'mockup',  thumbnail: '', fileSize: 6_1_00_000, format: 'PSD',  downloadedAt: this.d(-60), status: 'completed' },
    { id: 'd13', assetTitle: 'Icon Set – Finance & Business',    assetType: 'vector',  thumbnail: '', fileSize: 7_8_00_000, format: 'SVG',  downloadedAt: this.d(-90), status: 'completed' },
    { id: 'd14', assetTitle: 'Drone Footage – Coastline',        assetType: 'photo',   thumbnail: '', fileSize: 2_4_00_000, format: 'MP4',  downloadedAt: this.d(-120),status: 'failed' },
    { id: 'd15', assetTitle: 'Resume Template – Modern',         assetType: 'template',thumbnail: '', fileSize: 4_2_00_000, format: 'DOCX', downloadedAt: this.d(-180),status: 'completed' },
    { id: 'd16', assetTitle: 'Brush Strokes Overlay',            assetType: 'photo',   thumbnail: '', fileSize: 3_1_00_000, format: 'PNG',  downloadedAt: this.d(-240),status: 'completed' },
    { id: 'd17', assetTitle: 'Dashboard UI Kit',                 assetType: 'template',thumbnail: '', fileSize: 1_1_00_000, format: 'FIG',  downloadedAt: this.d(-300),status: 'completed' },
    { id: 'd18', assetTitle: 'Packaging Mockup – Box',           assetType: 'mockup',  thumbnail: '', fileSize: 9_5_00_000, format: 'AI',   downloadedAt: this.d(-365),status: 'processing' },
    { id: 'd19', assetTitle: 'Neon Sign Vector Set',             assetType: 'vector',  thumbnail: '', fileSize: 2_8_00_000, format: 'EPS',  downloadedAt: this.d(-400),status: 'completed' },
    { id: 'd20', assetTitle: 'Portrait Retouching Presets',      assetType: 'photo',   thumbnail: '', fileSize: 1_2_00_000, format: 'XMP',  downloadedAt: this.d(-500),status: 'completed' },
  ];

  private d(daysAgo: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + daysAgo);
    d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
    return d;
  }

  readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    let list = this.allDownloads;
    if (q) {
      list = list.filter(r => r.assetTitle.toLowerCase().includes(q));
    }

    const col = this.sortColumn();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (col === 'name') return a.assetTitle.localeCompare(b.assetTitle) * dir;
      if (col === 'size') return (a.fileSize - b.fileSize) * dir;
      return (a.downloadedAt.getTime() - b.downloadedAt.getTime()) * dir;
    });

    return list;
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  readonly page = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  readonly totalCount = computed(() => this.filtered().length);

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  sortBy(col: 'date' | 'name' | 'size'): void {
    if (this.sortColumn() === col) {
      this.sortDir.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(col);
      this.sortDir.set(col === 'date' ? 'desc' : 'asc');
    }
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  formatSize(bytes: number): string {
    if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + ' MB';
    if (bytes >= 1_000) return (bytes / 1_000).toFixed(1) + ' KB';
    return bytes + ' B';
  }

  relativeTime(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    if (hours < 24) return hours + 'h ago';
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + 'd ago';
    if (days < 30) return Math.floor(days / 7) + 'w ago';
    if (days < 365) return Math.floor(days / 30) + 'mo ago';
    return Math.floor(days / 365) + 'y ago';
  }

  fullDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  readonly assetIcons: Record<string, string> = {
    photo: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M10 13l-2 2 2 2 M14 13l2 2-2 2',
    vector: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
    mockup: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M12 22V12 M3.3 7l8.7 5 8.7-5',
    template: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M8 12h8 M8 16h5',
  };

  readonly typeLabels: Record<string, string> = {
    photo: 'Photo', vector: 'Vector', mockup: 'Mockup', template: 'Template',
  };

  readonly formatColors: Record<string, string> = {
    JPG: '#e11d48', PNG: '#2563eb', SVG: '#7c3aed', PSD: '#2563eb',
    AI: '#ea580c', FIG: '#f59e0b', MP4: '#0891b2', RAW: '#059669',
    TTF: '#6366f1', PPTX: '#d97706', DOCX: '#2563eb', EPS: '#7c3aed', XMP: '#059669',
  };

  sortIcon(col: 'date' | 'name' | 'size'): string {
    if (this.sortColumn() !== col) return 'M7 10l5-5 5 5 M7 14l5 5 5-5';
    return this.sortDir() === 'asc'
      ? 'M7 14l5-5 5 5'
      : 'M7 10l5 5 5-5';
  }
}
