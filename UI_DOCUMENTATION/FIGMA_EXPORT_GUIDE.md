# Amarapix UI - Figma Export Guide for Backend Developers

## How to Create a Figma File from This UI

This guide helps you export all UI components from the Angular project into Figma for design handoff and backend development reference.

---

## Option 1: Manual Component Export (Recommended for Quick Reference)

### Step 1: Take Screenshots of Each Journey

Using the **Angular development server**, navigate through each journey and take screenshots:

```bash
npm start
# App will run on http://localhost:4200
```

#### Journey Screenshots Checklist:

**1. Authentication Flow**
- [ ] Login page (`/auth/login`)
- [ ] Register page (`/auth/register`)
- [ ] Forgot Password page (`/auth/forgot-password`)

**2. Marketplace**
- [ ] Asset list (`/marketplace`)
- [ ] Asset detail (`/marketplace/asset/:slug`)

**3. Collections (Premium)**
- [ ] Collections list (`/collections`)
- [ ] Collection detail (`/collections/:id`)

**4. Print on Demand**
- [ ] Print home (`/print`)
- [ ] Print configurator (`/print/configure/:productId`)
- [ ] Print orders (`/print/orders`)

**5. Other Features**
- [ ] Canvas editor (`/editor`)
- [ ] Academy (`/academy`)
- [ ] Pricing (`/pricing`)
- [ ] Workspace (`/workspace`)
- [ ] Affiliate (`/affiliate`)
- [ ] Admin dashboard (`/admin`)

### Step 2: Create Figma File Structure

In Figma, create the following structure:

```
Amarapix Client UI
├── 0. Design System
│   ├── Colors
│   ├── Typography
│   ├── Components
│   └── Icons
├── 1. Auth Flows
│   ├── Login
│   ├── Register
│   └── Forgot Password
├── 2. Marketplace
│   ├── Asset List
│   └── Asset Detail
├── 3. Collections
│   ├── Collections List
│   └── Collection Detail
├── 4. Print
│   ├── Print Home
│   ├── Configurator
│   └── Orders
├── 5. Editor
├── 6. Academy
├── 7. Pricing
├── 8. Workspace
├── 9. Affiliate
└── 10. Admin
```

### Step 3: Add Screenshots to Figma

1. Create a new Figma file
2. For each page, create frames with:
   - Screenshot/mockup
   - Annotations for interactive elements
   - Notes for backend integration points

---

## Option 2: Automated Export with Figma API

### Prerequisites
- Figma account with API access
- Figma API token

### Step 1: Create Figma File

```bash
# Run this script to create Figma frames programmatically
node scripts/export-to-figma.js
```

See `export-to-figma.js` (created below) for implementation.

---

## Export to PDF

### Using Built-in Browser Print

1. Open the generated HTML documentation:
```bash
open UI_DOCUMENTATION/index.html
```

2. Press `Cmd+P` (Mac) or `Ctrl+P` (Windows/Linux)

3. Click "Save as PDF" and choose:
   - `Amarapix_UI_Documentation.pdf`

### Using Command Line

```bash
# Install wkhtmltopdf if not already installed
brew install wkhtmltopdf

# Generate PDF from HTML
wkhtmltopdf UI_DOCUMENTATION/index.html UI_DOCUMENTATION/Amarapix_UI_Documentation.pdf
```

---

## Component Inventory

### Shared Components
| Component | Location | States |
|-----------|----------|--------|
| Header | `src/app/shared/components/header/` | default, logged-in, theme toggle |
| Footer | `src/app/shared/components/footer/` | default |
| Modal | `src/app/shared/components/modal/` | open, closed, loading |
| Spinner | `src/app/shared/components/spinner/` | loading |
| Asset Card | `src/app/shared/components/asset-card/` | default, hover, selected |
| Pagination | `src/app/shared/components/pagination/` | default, disabled, active |
| Search Bar | `src/app/shared/components/search-bar/` | empty, focused, with results |

### Feature Components

**Authentication**
- LoginComponent
- RegisterComponent
- ForgotPasswordComponent

**Marketplace**
- AssetListComponent
- AssetDetailComponent

**Collections**
- CollectionsComponent
- CollectionDetailComponent

**Print**
- PrintHomeComponent
- PrintConfiguratorComponent
- PrintOrdersComponent

**Canvas Editor**
- CanvasEditorComponent

**Academy**
- CourseListComponent
- CoursePlayerComponent

**Subscription**
- PricingComponent

**Workspace**
- WorkspaceDashboardComponent

**Affiliate**
- AffiliateDashboardComponent

**Admin**
- AdminDashboardComponent

---

## Color Palette for Figma

Create a color library with these colors:

| Name | Value | Usage |
|------|-------|-------|
| Primary Orange | #f5820a | Buttons, CTAs, highlights |
| Dark Gray | #1a1a2e | Text, headers |
| Medium Gray | #6c757d | Secondary text |
| Light Gray | #f5f5f5 | Backgrounds |
| White | #ffffff | Cards, modals |
| Border Gray | #d8d8e8 | Borders, dividers |
| Dark Background | #0f1419 | Dark mode background |
| Dark Card | #1a1f2e | Dark mode cards |
| Success Green | #00aa00 | Success states |
| Error Red | #cc0000 | Error states |

---

## Typography for Figma

### Font Family: Lato

| Style | Weight | Size | Line Height | Usage |
|-------|--------|------|-------------|-------|
| Display | 900 | 42px | 1.2 | Page titles |
| Heading 1 | 800 | 36px | 1.3 | Section titles |
| Heading 2 | 800 | 28px | 1.3 | Subsection titles |
| Heading 3 | 700 | 24px | 1.4 | Card titles |
| Body | 400 | 14px | 1.6 | Regular text |
| Body Bold | 600 | 14px | 1.6 | Emphasized text |
| Caption | 400 | 12px | 1.4 | Small text |

---

## Interactive States to Document

For each component, document these states:

### Button States
- [ ] Default
- [ ] Hover
- [ ] Active/Pressed
- [ ] Disabled
- [ ] Loading

### Form States
- [ ] Empty
- [ ] Focused
- [ ] Filled
- [ ] Error
- [ ] Success

### Component States
- [ ] Default
- [ ] Loading
- [ ] Empty
- [ ] Error
- [ ] Success

---

## Export Checklist

- [ ] All 10 user journey flows documented
- [ ] Screenshots of each page state
- [ ] Component library created
- [ ] Color palette defined
- [ ] Typography styles established
- [ ] Interactive states documented
- [ ] Responsive breakpoints shown (mobile, tablet, desktop)
- [ ] Dark mode variations included
- [ ] API integration points annotated
- [ ] PDF generated and saved
- [ ] Figma file shared with backend team

---

## Figma File Share Instructions

### For Team Members

1. Create a Figma team
2. Invite backend developers as viewers
3. Share the file link: `https://www.figma.com/file/...`

### File Protection
- Lock design layers
- Create read-only sections
- Document all changes in version history

---

## Backend Developer Integration Guide

### Using This Documentation

**Backend developers should:**

1. **Review User Journeys** - Understand the complete user flows
2. **Check Route Guards** - Implement proper authentication/authorization
3. **Build API Endpoints** - Create endpoints matching the documented routes
4. **Handle Errors** - Implement error states shown in UI
5. **Support Responsive Design** - Ensure API works on all screen sizes
6. **Mobile Payment Integration** - Implement MTN/Airtel payment gateways

### Key Integration Points

1. **Authentication**
   - JWT token generation
   - Password hashing and validation
   - Session management

2. **Asset Management**
   - Asset metadata storage
   - File upload/download handling
   - Search and filtering

3. **Collections**
   - Collection creation and management
   - Asset association
   - Sharing functionality

4. **Print on Demand**
   - Product catalog management
   - Order processing
   - Payment integration (MTN/Airtel)
   - Shipping integration

5. **Subscription**
   - Plan management
   - Payment processing
   - Access control based on tier

---

## Testing Against UI

### Manual Testing Checklist

- [ ] All links navigate correctly
- [ ] Form validation matches UI feedback
- [ ] Error messages match UI design
- [ ] Loading states appear at correct times
- [ ] Success notifications match design
- [ ] Dark mode works across all pages
- [ ] Responsive behavior matches breakpoints

### Automated Testing

Run UI tests:
```bash
npm test
```

---

## Final Deliverables

### For Backend Team Folder:

1. **`DEVELOPER_GUIDE.md`** - Comprehensive guide with all endpoints
2. **`index.html`** - Interactive documentation (open in browser)
3. **`amarapix-ui-structure.json`** - Complete structure as JSON
4. **`Figma_Export_Guide.md`** - This file
5. **`Amarapix_UI_Documentation.pdf`** - PDF version of all docs
6. **Screenshots folder** - All page screenshots

### Share Via:
- Google Drive for easy collaboration
- GitHub wiki for version control
- Figma for design reference
- Slack for quick access

---

## Questions for Backend Team

As you build the backend, refer to:

1. **API Contract** - See `amarapix-ui-structure.json`
2. **User Flows** - See `DEVELOPER_GUIDE.md` → User Journeys
3. **Component States** - Take screenshots and reference Figma
4. **Error Handling** - Follow the error states shown in UI
5. **Validation Rules** - Match form validation in UI

---

## Version Control

Keep documentation updated:

```bash
# After UI changes
python3 generate_ui_docs.py
git add UI_DOCUMENTATION/
git commit -m "docs: update UI documentation"
```

---

*Last Updated: Generated at project runtime*

For Figma design system integration, see: [Figma Design System Best Practices](https://www.figma.com/best-practices/)
