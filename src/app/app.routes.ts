import { Routes } from '@angular/router';
import { authGuard, guestGuard, premiumGuard, adminGuard } from './core/guards';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: 'marketplace', pathMatch: 'full' },

  // Auth (guest only)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: 'login',            loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register',         loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password',  loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Marketplace
  {
    path: 'marketplace',
    children: [
      { path: '',              loadComponent: () => import('./features/marketplace/asset-list/asset-list.component').then(m => m.AssetListComponent) },
      { path: 'asset/:slug',  loadComponent: () => import('./features/marketplace/asset-detail/asset-detail.component').then(m => m.AssetDetailComponent) },
    ],
  },

  // Canvas Editor (auth required)
  {
    path: 'editor',
    canActivate: [authGuard],
    loadComponent: () => import('./features/editor/canvas-editor/canvas-editor.component').then(m => m.CanvasEditorComponent),
  },

  // Academy
  {
    path: 'academy',
    children: [
      { path: '', loadComponent: () => import('./features/academy/course-list/course-list.component').then(m => m.CourseListComponent) },
      { path: ':id', loadComponent: () => import('./features/academy/course-player/course-player.component').then(m => m.CoursePlayerComponent) },
    ],
  },

  // Pricing / Subscriptions
  {
    path: 'pricing',
    loadComponent: () => import('./features/subscription/pricing/pricing.component').then(m => m.PricingComponent),
  },

  // Workspace (auth required)
  {
    path: 'workspace',
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/workspace/workspace-dashboard/workspace-dashboard.component').then(m => m.WorkspaceDashboardComponent) },
    ],
  },

  // Collections (premium required)
  {
    path: 'collections',
    canActivate: [premiumGuard],
    children: [
      { path: '', loadComponent: () => import('./features/collections/collections/collections.component').then(m => m.CollectionsComponent) },
      { path: ':id', loadComponent: () => import('./features/collections/collection-detail/collection-detail.component').then(m => m.CollectionDetailComponent) },
    ],
  },

  // Affiliate (auth required)
  {
    path: 'affiliate',
    canActivate: [authGuard],
    loadComponent: () => import('./features/affiliate/affiliate-dashboard/affiliate-dashboard.component').then(m => m.AffiliateDashboardComponent),
  },

  // Print (auth required)
  {
    path: 'print',
    canActivate: [authGuard],
    loadComponent: () => import('./features/print/print-home/print-home.component').then(m => m.PrintHomeComponent),
  },
  {
    path: 'print/configure/:productId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/print/print-configurator/print-configurator.component').then(m => m.PrintConfiguratorComponent),
  },
  {
    path: 'print/orders',
    canActivate: [authGuard],
    loadComponent: () => import('./features/print/print-orders/print-orders.component').then(m => m.PrintOrdersComponent),
  },

  // Admin (admin guard)
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },

  // Fallback
  { path: 'unauthorized', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: '**', redirectTo: 'marketplace' },
];
