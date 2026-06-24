import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { PrintSpec, PrintOrder, CreatePrintOrderPayload } from '../../core/models/print.model';
import { PaginatedResponse } from '../../core/models/asset.model';

@Injectable({ providedIn: 'root' })
export class PrintService {
  private readonly api = inject(ApiService);

  getSpecs(): Observable<PrintSpec[]> {
    return this.api.get<PrintSpec[]>('/print/specs');
  }

  createOrder(payload: CreatePrintOrderPayload): Observable<PrintOrder> {
    return this.api.post<PrintOrder>('/print/orders', payload);
  }

  getOrders(): Observable<PaginatedResponse<PrintOrder>> {
    return this.api.get<PaginatedResponse<PrintOrder>>('/print/orders');
  }

  getOrder(id: string): Observable<PrintOrder> {
    return this.api.get<PrintOrder>(`/print/orders/${id}`);
  }
}
