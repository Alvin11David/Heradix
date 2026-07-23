import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface MmMockup {
  nr: number;
  slug: string;
  name: string;
  folder: string;
  preview: string;
  category: string;
  tags: string[];
}

export interface MmMockupsResponse {
  success: boolean;
  total: number;
  pages: number;
  page: number;
  mockups: MmMockup[];
}

export interface MmMockupDetail {
  nr: number;
  slug: string;
  name: string;
  image: string;
  category: string;
  tags: string[];
  layers: MmLayer[];
}

export interface MmLayer {
  type: string;
  id: string;
  layer: string;
  label: string;
  placeholder?: { width: number; height: number };
}

export interface MmRenderRequest {
  nr: number;
  image_type?: string;
  layer_inputs: {
    id: string;
    checked?: boolean;
    data?: string;
    crop?: { x: number; y: number; width: number; height: number };
    color?: { red: number; green: number; blue: number };
  }[];
}

export interface MmRenderResponse {
  success: boolean;
  message: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class MediaModifierApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/mediamodifier-api';

  getMockups(page = 1): Observable<MmMockupsResponse> {
    const params = new HttpParams().set('page', String(page));
    return this.http.get<MmMockupsResponse>(`${this.base}/mockups`, { params });
  }

  searchMockups(q: string, page = 1): Observable<MmMockupsResponse> {
    let params = new HttpParams().set('q', q).set('page', String(page));
    return this.http.get<MmMockupsResponse>(`${this.base}/mockups/search`, { params });
  }

  getMockup(nr: number): Observable<MmMockupDetail> {
    return this.http.get<{ success: boolean; mockup: MmMockupDetail }>(`${this.base}/mockup/nr/${nr}`).pipe(
      map(r => r.mockup),
    );
  }

  renderMockup(body: MmRenderRequest): Observable<MmRenderResponse> {
    return this.http.post<MmRenderResponse>(`${this.base}/v2/mockup/render`, body);
  }
}
