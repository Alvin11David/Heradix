# Amarapix Client UI - Developer Documentation

**Generated:** April 23, 2026 at 22:17

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [User Journeys](#user-journeys)
3. [Component Structure](#component-structure)
4. [Theme & Styling](#theme--styling)
5. [API Integration](#api-integration)
6. [Route Guards](#route-guards)
7. [Key Features](#key-features)

---

## Project Overview

**Project:** Amarapix Client UI
**Version:** 1.0.0

This documentation provides a comprehensive guide to the Amarapix Client UI for backend developers to understand the frontend architecture, user journeys, and integration points.

---

## User Journeys

### 1. Signup & Login Journey
**Route:** `/` → `/auth/login` → `/auth/register` → `/marketplace`

**Flow:**
- User lands on marketplace (guest can browse)
- User clicks "Login" or "Sign Up"
- Login: `/auth/login` (email/password, remember me, forgot password link)
- Register: `/auth/register` (create account with email validation)
- Forgot Password: `/auth/forgot-password` (email recovery)
- On success → redirected to `/marketplace`

**Key Endpoints:**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`

---

### 2. Marketplace Asset Discovery
**Route:** `/marketplace` → `/marketplace/asset/:slug`

**Flow:**
- User browses asset grid with search and filters
- Filters: format (PSD, AI, VECTOR, etc.), orientation (LANDSCAPE, PORTRAIT, SQUARE)
- Pagination support
- Click asset → view full detail page
- Detail page: preview, download formats, similar assets, share options

**Key Endpoints:**
- `GET /api/assets?q=search&format=PSD&orientation=LANDSCAPE&page=1`
- `GET /api/assets/:slug`
- `POST /api/assets/:id/download`

---

### 3. Collections Journey (Premium)
**Route:** `/collections` → `/collections/:id` → `/marketplace/asset/:slug`

**Flow:**
- User views all collections in a grid (2x2 mosaic preview)
- Search collections by name or format
- Click collection → view all items in that collection
- Click item → view full asset detail page (like marketplace)
- Manage collections: add/remove assets

**Key Endpoints:**
- `GET /api/collections`
- `GET /api/collections/:id`
- `POST /api/collections` (create)
- `POST /api/collections/:id/assets` (add asset)
- `DELETE /api/collections/:id/assets/:assetId` (remove asset)

---

### 4. Canvas Editor Journey
**Route:** `/editor`

**Flow:**
- Authenticated users only
- Access design tools and templates
- Edit assets with real-time preview
- Export or save designs

**Key Endpoints:**
- `GET /api/editor/templates`
- `POST /api/editor/save`
- `POST /api/editor/export`

---

### 5. Print on Demand Journey
**Route:** `/print` → `/print/configure/:productId` → `/print/orders`

**Flow:**
- Browse print products (T-shirts, posters, business cards, etc.)
- View hero slider with branding images
- Select product → `/print/configure/:productId`
- Configure: size, color, quantity, branding
- View pricing in UGX (Ugandan Shillings)
- Select delivery/pickup options
- Checkout with mobile payments (MTN Mobile Money, Airtel Money)
- View order history in `/print/orders`

**Key Endpoints:**
- `GET /api/print/products`
- `GET /api/print/products/:id`
- `POST /api/print/quote`
- `POST /api/print/checkout` (with mobile payment integration)
- `GET /api/print/orders`

---

### 6. Academy & Learning
**Route:** `/academy` → `/academy/:id`

**Flow:**
- Browse available courses by category
- Click course → video player with navigation
- Track progress through course
- Download course materials

**Key Endpoints:**
- `GET /api/academy/courses`
- `GET /api/academy/courses/:id`
- `POST /api/academy/progress`

---

### 7. Subscription & Pricing
**Route:** `/pricing`

**Flow:**
- View subscription tiers (Free, Premium, Enterprise)
- Compare features across tiers
- Click CTA button to upgrade
- Integrated with payment processor

**Key Endpoints:**
- `GET /api/subscription/plans`
- `POST /api/subscription/subscribe`
- `POST /api/subscription/cancel`

---

### 8. User Workspace
**Route:** `/workspace` (Authenticated)

**Flow:**
- User dashboard with personal info
- Quick access to recent assets
- Settings and preferences
- Profile management

**Key Endpoints:**
- `GET /api/users/me`
- `PUT /api/users/:id`
- `GET /api/users/:id/assets`

---

### 9. Affiliate Program
**Route:** `/affiliate` (Authenticated)

**Flow:**
- View earnings and commission stats
- Generate referral links
- Track referrals and conversions
- Withdraw earnings

**Key Endpoints:**
- `GET /api/affiliate/stats`
- `GET /api/affiliate/referrals`
- `POST /api/affiliate/withdraw`

---

### 10. Admin Dashboard
**Route:** `/admin` (Admin only)

**Flow:**
- User management (view, edit, ban users)
- Asset moderation and approval
- Analytics and reports
- System settings

**Key Endpoints:**
- `GET /api/admin/users`
- `GET /api/admin/assets`
- `POST /api/admin/assets/:id/approve`
- `GET /api/admin/analytics`

---

## Component Structure

### Shared Components
[
  {
    "name": "Header",
    "features": [
      "Navigation",
      "Logo",
      "User menu",
      "Theme toggle",
      "Search"
    ]
  },
  {
    "name": "Footer",
    "features": [
      "Links",
      "Social media",
      "Copyright",
      "Newsletter signup"
    ]
  },
  {
    "name": "Modal",
    "features": [
      "Dialogs",
      "Forms",
      "Confirmations"
    ]
  },
  {
    "name": "Spinner",
    "features": [
      "Loading states",
      "Progress indicators"
    ]
  },
  {
    "name": "Pagination",
    "features": [
      "Navigation",
      "Page info"
    ]
  },
  {
    "name": "Search Bar",
    "features": [
      "Text input",
      "Search button",
      "Auto-suggestions"
    ]
  },
  {
    "name": "Asset Card",
    "features": [
      "Thumbnail",
      "Title",
      "Meta info",
      "Hover effects"
    ]
  }
]

### Feature-Specific Components

#### Auth
- LoginComponent
- RegisterComponent
- ForgotPasswordComponent

#### Marketplace
- AssetListComponent (with filtering, search, pagination)
- AssetDetailComponent (with download, share, similar assets)

#### Collections
- CollectionsComponent (grid view with search)
- CollectionDetailComponent (items grid with click to view)

#### Editor
- CanvasEditorComponent (design tools, templates, export)

#### Print
- PrintHomeComponent (product showcase, hero slider)
- PrintConfiguratorComponent (product config, UGX pricing, checkout)
- PrintOrdersComponent (order history, tracking)

#### Academy
- CourseListComponent (course browsing)
- CoursePlayerComponent (video player, progress tracking)

#### Subscription
- PricingComponent (tier comparison, CTAs)

#### Workspace
- WorkspaceDashboardComponent (user dashboard)

#### Affiliate
- AffiliateDashboardComponent (stats, referrals, earnings)

#### Admin
- AdminDashboardComponent (management tools, analytics)

---

## Theme & Styling

### Color Palette
{
  "primary": "#f5820a (Orange)",
  "text": "#1a1a2e (Dark gray)",
  "textMuted": "#6c757d (Medium gray)",
  "background": "#ffffff (Light)",
  "backgroundDark": "#0f1419 (Dark mode)"
}

### Typography
{
  "fontFamily": "Lato, sans-serif",
  "weights": [
    "400 (Regular)",
    "600 (Semi-bold)",
    "700 (Bold)",
    "800 (Extra-bold)",
    "900 (Black)"
  ]
}

### Spacing & Layout
- **Base Unit:** 8px base unit
- **Border Radius:** 8px - 16px
- **Transitions:** 0.2s - 0.3s ease

### Dark Mode
- Automatic detection of OS preference
- Manual toggle in header
- CSS custom properties for theming
- Smooth transitions between themes

---

## API Integration

### Authentication Endpoints
```
POST /api/auth/login
  Body: { "email": "user@example.com", "password": "***" }
  Response: { "token": "JWT_TOKEN", "user": {...} }

POST /api/auth/register
  Body: { "email": "user@example.com", "password": "***", "name": "John" }
  Response: { "token": "JWT_TOKEN", "user": {...} }

POST /api/auth/logout
  Response: { "success": true }
```

### Asset Endpoints
```
GET /api/assets?q=search&format=PSD&orientation=LANDSCAPE&page=1&limit=12
  Response: { "data": [{...}], "total": 100, "page": 1 }

GET /api/assets/:slug
  Response: { Asset object with full details }

POST /api/assets/:id/download
  Body: { "format": "PSD" }
  Response: { "downloadUrl": "https://..." }
```

### Collections Endpoints
```
GET /api/collections
  Response: [{ Collection }, ...]

GET /api/collections/:id
  Response: { Collection with all assets }

POST /api/collections
  Body: { "name": "My Collection", "description": "..." }
  Response: { Collection }

POST /api/collections/:id/assets
  Body: { "assetId": "asset-123" }
  Response: { "success": true }

DELETE /api/collections/:id/assets/:assetId
  Response: { "success": true }
```

### Subscription Endpoints
```
GET /api/subscription/plans
  Response: [{ Plan }, ...]

POST /api/subscription/subscribe
  Body: { "planId": "premium" }
  Response: { Subscription }

POST /api/subscription/cancel
  Response: { "success": true }
```

---

## Route Guards

### Auth Guard
- Protects authenticated-only routes
- Redirects to `/auth/login` if not authenticated

### Guest Guard
- Only allows unauthenticated users
- Used for auth routes (login, register)
- Redirects to `/marketplace` if already authenticated

### Premium Guard
- Requires premium subscription
- Used for collections, premium features

### Admin Guard
- Requires admin role
- Used for admin dashboard

---

## Key Features

- Dark Mode with automatic OS preference detection
- Responsive design (mobile, tablet, desktop)
- Asset marketplace with advanced filtering
- Print on Demand with UGX pricing & mobile payments (MTN/Airtel)
- Collections management for organizing assets
- Canvas editor for design customization
- Video academy with course progression
- Affiliate program with earnings tracking
- Premium subscription tiers
- Real-time search and filtering

---

## Architecture Notes

### Routing
- Angular routing with lazy-loaded feature modules
- Child routes for related components
- Route guards for access control

### State Management
- Angular signals for reactive state
- RxJS observables for async operations
- Service-based architecture

### Styling
- SCSS with variables and mixins
- CSS custom properties for theming
- BEM naming convention
- Responsive grid layouts

### Performance
- Lazy image loading with `loading="lazy"`
- Component-level change detection
- Optimized API calls with caching
- Code splitting with lazy-loaded routes

---

## Getting Started for Backend Developers

1. **Review the API Endpoints** - Understand the contract between frontend and backend
2. **Follow the Journey Flows** - See how users navigate through the application
3. **Check Route Guards** - Ensure authentication/authorization is properly implemented
4. **Implement Missing Endpoints** - Build API endpoints as specified
5. **Handle Errors** - Implement proper error handling and validation
6. **Mobile Payment Integration** - Integrate MTN and Airtel mobile money for print orders

---

## Contact & Support

For questions about the UI implementation or integration, please refer to the component files in:
- `/src/app/features/` - Feature components
- `/src/app/shared/` - Shared components
- `/src/app/core/` - Core services and models

---

*Last Updated: April 23, 2026*
