import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── Mockuuups API response types ──────────────────────────────────────────────

export interface MkuDevice {
  slug: string;
  title: string;
}

export interface MkuTag {
  slug: string;
  title: string;
}

export interface MkuPlacement {
  id: string;
  slug: string;
  title: string;
  family: string;
  width: number;
  height: number;
  unit?: 'px' | 'mm' | 'in' | 'cm';
  widthPoints?: number;
  heightPoints?: number;
  type: 'digital';
}

export interface MkuMockup {
  id: string;
  title: string;
  /** 500×320 thumbnail */
  thumbnail: string;
  width: number;
  height: number;
  tags: MkuTag[];
  placements: MkuPlacement[];
}

export interface MkuRenderContent {
  type: 'image' | 'screenshot';
  url: string;
  crop?: { x?: number; y?: number; width?: number; height?: number };
}

export interface MkuRenderRequest {
  mockup: string;
  size?: number;
  format?: 'image/png' | 'image/jpeg' | 'image/webp';
  trim?: boolean;
  contents: MkuRenderContent[];
  destination?: 'response' | 'cdn' | 'custom';
  mode?: 'sync' | 'async';
  cdn?: { expiration?: string };
}

export interface MkuRenderResponse {
  /** Returned when destination=cdn */
  url?: string;
  [key: string]: any;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class MockuuupsApiService {
  private readonly http = inject(HttpClient);
  /** Routed through Angular dev-server proxy (proxy.conf.js → api.mockuuups.studio) */
  private readonly base = '/mockuuups-api';

  /** Retrieve the full list of supported device slugs */
  getDevices(): Observable<MkuDevice[]> {
    return this.http.get<MkuDevice[]>(`${this.base}/devices`);
  }

  /**
   * Retrieve paginated mockup list, optionally filtered by device slug.
   * @param device  e.g. 'iphone-13-pro'
   * @param limit   items per page (default 50, max 50)
   * @param page    1-based page number
   */
  getMockups(params: { device?: string; limit?: number; page?: number } = {}): Observable<MkuMockup[]> {
    let p = new HttpParams();
    if (params.device) p = p.set('device', params.device);
    if (params.limit !== undefined)  p = p.set('limit', String(params.limit));
    if (params.page  !== undefined)  p = p.set('page',  String(params.page));
    return this.http.get<MkuMockup[]>(`${this.base}/mockups`, { params: p });
  }

  /**
   * Render a mockup with user content.
   * Uses destination=cdn so we get a URL back (works for sync mode too).
   */
  renderMockup(body: MkuRenderRequest): Observable<MkuRenderResponse | Blob> {
    return this.http.post<MkuRenderResponse>(`${this.base}/renders`, body);
  }

  /**
   * Upload a local File to 0x0.st (free, no-auth public temp hosting).
   * Returns the publicly accessible URL — valid for 30–365 days.
   * The Mockuuups render API requires a reachable HTTP URL for design content.
   */
  async uploadDesignToTemp(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('https://0x0.st', { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    const url = (await res.text()).trim();
    if (!url.startsWith('http')) throw new Error('Unexpected upload response');
    return url;
  }
}
