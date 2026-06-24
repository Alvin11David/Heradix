
# Manual Figma File Setup for Amarapix UI

## Step 1: Create Figma File

1. Go to https://www.figma.com
2. Create new file: "Amarapix Client UI"
3. Create these pages:

## Page Structure

### Page: Design System
- Frame: "Colors"
  - {
  "primary": "#f5820a (Orange)",
  "text": "#1a1a2e (Dark gray)",
  "textMuted": "#6c757d (Medium gray)",
  "background": "#ffffff (Light)",
  "backgroundDark": "#0f1419 (Dark mode)"
}
- Frame: "Typography"
  - Font: Lato
  - Weights: 400 (Regular), 600 (Semi-bold), 700 (Bold), 800 (Extra-bold), 900 (Black)
- Frame: "Spacing"
  - Base unit: 8px base unit

### Page: Journeys Overview
For each journey in the journeys array:
- Create Frame: Journey Name
- Add route flow diagram
- Add component list

### Page: Components Library
For each component group:
- Frame: Component Name
- Add component states
- Document props/features

### Page: Mobile Responsive
- Frame: Mobile (375px)
- Frame: Tablet (768px)
- Frame: Desktop (1440px)

## Sections to Create


### Journey 1: User Signup & Login Journey
**Description:** Complete flow from landing to authenticated user

**Routes:**
- / → Marketplace (Asset List)
- /auth/login → Login
- /auth/register → Register
- /auth/forgot-password → Forgot Password

**Features:**
- Browse assets
- Search
- Filter by format/category
- Email/Password login
- Remember me
- Forgot password link
- Email signup
- Password validation
- Terms acceptance
- Email recovery
- Password reset


### Journey 2: Marketplace Asset Discovery
**Description:** Browse, search, and view asset details

**Routes:**
- /marketplace → Asset List
- /marketplace/asset/:slug → Asset Detail

**Features:**
- Grid view
- Search bar
- Filters
- Pagination
- Preview
- Download formats
- Similar assets
- Share options


### Journey 3: Collections Management
**Description:** Organize and manage user collections (Premium)

**Routes:**
- /collections → Collections List
- /collections/:id → Collection Detail

**Features:**
- View all collections
- 2x2 mosaic preview
- Search collections
- View all items in collection
- Click item to view asset detail


### Journey 4: Canvas Editor
**Description:** Design and edit assets (Authenticated)

**Routes:**
- /editor → Canvas Editor

**Features:**
- Design tools
- Template library
- Real-time preview
- Export options


### Journey 5: Print on Demand
**Description:** Configure and order printed products (Authenticated)

**Routes:**
- /print → Print Home
- /print/configure/:productId → Print Configurator
- /print/orders → Print Orders

**Features:**
- Product showcase
- Hero slider
- Product categories
- Product selection
- Size options
- Pricing
- UGX currency
- Checkout
- Mobile payment integration
- Order history
- Status tracking
- Download receipts


### Journey 6: Academy & Learning
**Description:** Video courses and educational content

**Routes:**
- /academy → Course List
- /academy/:id → Course Player

**Features:**
- Browse courses
- Course categories
- Difficulty levels
- Video playback
- Course navigation
- Progress tracking


### Journey 7: Subscription & Pricing
**Description:** Upgrade to premium features

**Routes:**
- /pricing → Pricing Page

**Features:**
- Subscription tiers
- Feature comparison
- CTA buttons


### Journey 8: User Workspace
**Description:** Personal dashboard and settings (Authenticated)

**Routes:**
- /workspace → Workspace Dashboard

**Features:**
- User info
- Recent assets
- Quick actions
- Settings


### Journey 9: Affiliate Program
**Description:** Referral and earnings management (Authenticated)

**Routes:**
- /affiliate → Affiliate Dashboard

**Features:**
- Earnings stats
- Referral links
- Commission tracking


### Journey 10: Admin Management
**Description:** Administrative controls (Admin only)

**Routes:**
- /admin → Admin Dashboard

**Features:**
- User management
- Asset moderation
- Analytics
- Settings


## Component States to Document

### Authentication Components
- LoginComponent
  - Empty form
  - Form filled
  - Loading
  - Error state
  - Success redirect

- RegisterComponent
  - Email validation state
  - Password strength indicator
  - Terms agreement
  - Loading state

### Asset Components
- AssetCard
  - Default state
  - Hover state
  - Downloaded state
  - Selected state

- AssetDetailComponent
  - Image preview
  - Download panel
  - Share modal
  - Similar assets grid

### Print Components
- PrintConfiguratorComponent
  - Product selection
  - Size options
  - Price display (UGX)
  - Checkout form
  - Payment method selection (MTN/Airtel)

### Collections
- CollectionsComponent
  - Empty state
  - Populated grid
  - Search results
  
- CollectionDetailComponent
  - Items grid
  - Item hover states
  - Click to asset detail

## Responsive Breakpoints

Create mockups for:
- Mobile: 360px - 480px
- Tablet: 768px - 1024px
- Desktop: 1200px+

## Dark Mode

For each page, show:
- Light mode version
- Dark mode version
- Theme toggle interaction

## Interactive Prototypes

Create links between frames:
- Login → Register
- Register → Marketplace
- Asset List → Asset Detail
- Collections → Collection Detail → Asset Detail
- Print Home → Configurator → Orders

## Assets to Include

Paste actual screenshots from:
```bash
npm start
```

Then screenshot each page at:
- localhost:4200/
- localhost:4200/auth/login
- localhost:4200/auth/register
- localhost:4200/marketplace
- localhost:4200/marketplace/asset/example
- localhost:4200/collections
- localhost:4200/collections/safe-birth
- localhost:4200/print
- localhost:4200/pricing
- etc.

## Export Settings

When exporting to PDF:
1. File → Export → PDF
2. Include all pages
3. Include artboards
4. Verify fonts are embedded

## Sharing

1. Right-click file
2. Share → Set permissions
3. Copy link
4. Share with backend team

## Version Control

Keep Figma file in sync:
- Update when UI changes
- Document changes in file history
- Tag major versions
- Link to commits in GitHub
