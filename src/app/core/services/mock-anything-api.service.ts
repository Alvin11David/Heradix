import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface MockAnythingResponse<T> {
  data: T;
  success: boolean;
  message: string;
}

export interface MockProductBrief {
  name: string;
  uuid: string;
  sizes: { label: string; is_reference_size: boolean }[];
}

export interface MockProductDecoration {
  location: string;
  name: string;
  surface: string;
}

export interface MockProductColor {
  name: string;
  hex: string;
}

export interface MockProductDetail {
  uuid: string;
  name: string;
  brand: string;
  style_code: string;
  category: string;
  subcategory: string | null;
  decorations: MockProductDecoration[];
  colors: MockProductColor[];
  supported_sizes: string[];
}

export interface MockStyle {
  id: string;
  description: string;
  available_with: string[];
}

export interface MockCreateRequest {
  product_id: string;
  style_id: string;
  prompt?: string;
  image_url?: string;
  format?: string;
  width?: number;
  height?: number;
}

export interface MockCreateResponse {
  task_id: string;
  state: string;
  image_url: string | null;
  status: string;
}

export interface MockStatusData {
  task_id: string;
  state: 'PENDING' | 'SUCCESS' | 'FAILURE';
  image_url: string | null;
  status: string;
  selected_size: string | null;
  aspect_ratio: string | null;
  mockup: {
    type: string;
    uuid: string;
    name: string;
    thumbnail: string;
    smart_objects: any[];
  } | null;
}

@Injectable({ providedIn: 'root' })
export class MockAnythingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/mock-anything-api';

  searchProducts(query: string, limit = 20): Observable<MockProductBrief[]> {
    const params = new HttpParams().set('query', query).set('limit', String(limit));
    return this.http.get<MockAnythingResponse<MockProductBrief[]>>(`${this.base}/mock-anything/products`, { params }).pipe(
      map(r => r.data ?? []),
    );
  }

  getProduct(uuid: string): Observable<MockProductDetail> {
    return this.http.get<MockAnythingResponse<MockProductDetail>>(`${this.base}/mock-anything/products/${uuid}`).pipe(
      map(r => r.data),
    );
  }

  getStyles(): Observable<MockStyle[]> {
    return this.http.get<MockAnythingResponse<MockStyle[]>>(`${this.base}/mock-anything/styles`).pipe(
      map(r => r.data ?? []),
    );
  }

  createMockup(body: MockCreateRequest): Observable<MockCreateResponse> {
    return this.http.post<MockAnythingResponse<MockCreateResponse>>(`${this.base}/mock-anything/create`, body).pipe(
      map(r => r.data),
    );
  }

  getStatus(taskId: string): Observable<MockStatusData> {
    return this.http.get<MockAnythingResponse<MockStatusData>>(`${this.base}/mock-anything/status/${taskId}`).pipe(
      map(r => r.data),
    );
  }
}
