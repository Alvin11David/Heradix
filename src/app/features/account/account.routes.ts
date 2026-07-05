import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./account.component').then(m => m.AccountComponent),
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
      },
      {
        path: 'subscription',
        loadComponent: () => import('./subscription/subscription.component').then(m => m.SubscriptionComponent),
      },
      {
        path: 'payment-methods',
        loadComponent: () => import('./payment-methods/payment-methods.component').then(m => m.PaymentMethodsComponent),
      },
      {
        path: 'downloads',
        loadComponent: () => import('./downloads/downloads.component').then(m => m.DownloadsComponent),
      },
      {
        path: 'quota',
        loadComponent: () => import('./quota/quota.component').then(m => m.QuotaComponent),
      },
      {
        path: 'danger-zone',
        loadComponent: () => import('./danger-zone/danger-zone.component').then(m => m.DangerZoneComponent),
      },
    ],
  },
] as Routes;
