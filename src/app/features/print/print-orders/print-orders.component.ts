import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintService } from '../print.service';
import { PrintOrder } from '../../../core/models/print.model';


@Component({
  selector: 'amx-print-orders',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="print-page">
      <h1 class="print-page__title">Print Orders</h1>

      <div class="orders-list" *ngIf="loading()">
        <div class="skeleton skeleton--card" style="height:90px;margin-bottom:12px" *ngFor="let _ of [1,2,3]"></div>
      </div>

      <div class="orders-list" *ngIf="!loading()">
        <div *ngFor="let order of orders()" class="order-card">
          <div class="order-card__status">
            <span class="status-badge status-badge--{{ order.status.toLowerCase() }}">
              {{ order.status.replace('_', ' ') }}
            </span>
          </div>
          <div class="order-card__body">
            <p class="order-card__id">Order #{{ order.id.slice(0, 8).toUpperCase() }}</p>
            <p class="order-card__meta">
              Qty: {{ order.quantity }} &bull;
              {{ order.totalPrice | currency:order.currency }} &bull;
              {{ order.createdAt | date:'mediumDate' }}
            </p>
            <p class="order-card__tracking" *ngIf="order.trackingNumber">
              Tracking: {{ order.trackingNumber }}
            </p>
          </div>
        </div>

        <p class="empty-state" *ngIf="orders().length === 0">No print orders yet.</p>
      </div>
    </div>
  `,
  styleUrl: './print-orders.component.scss',
})
export class PrintOrdersComponent implements OnInit {
  private readonly svc = inject(PrintService);

  orders  = signal<PrintOrder[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.svc.getOrders().subscribe({
      next: (res) => { this.orders.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
