import { Injectable, signal, computed } from '@angular/core';

export interface DownloadEvent {
  id: string;
  assetId: string;
  assetTitle: string;
  assetType: 'vector' | 'photo' | 'mockup' | 'template' | 'icon' | 'other';
  format: string;
  fileSize: number;
  downloadedAt: string; // ISO string
  status: 'completed' | 'failed';
}

const STORAGE_KEY = 'amx_download_history';
const MAX_RECORDS = 500;

@Injectable({ providedIn: 'root' })
export class DownloadTrackingService {

  private readonly _history = signal<DownloadEvent[]>(this._load());

  /** Full list newest-first */
  readonly history = this._history.asReadonly();

  /** Counts for quota enforcement */
  readonly todayCount = computed(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return this._history().filter(e => new Date(e.downloadedAt) >= start).length;
  });

  readonly monthCount = computed(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return this._history().filter(e => new Date(e.downloadedAt) >= start).length;
  });

  /** Record a new download event */
  record(partial: Omit<DownloadEvent, 'id' | 'downloadedAt' | 'status'>): void {
    const event: DownloadEvent = {
      ...partial,
      id: `dl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      downloadedAt: new Date().toISOString(),
      status: 'completed',
    };
    this._history.update(h => [event, ...h].slice(0, MAX_RECORDS));
    this._persist();
  }

  private _load(): DownloadEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as DownloadEvent[]) : [];
    } catch {
      return [];
    }
  }

  private _persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._history()));
    } catch {}
  }
}
