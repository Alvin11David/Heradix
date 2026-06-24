#!/usr/bin/env python3
"""
Amarapix UI Documentation Generator
Generates comprehensive UI documentation with journey flows for backend developers
"""

import json
import os
from datetime import datetime
from pathlib import Path

# Document structure with all user journeys
PROJECT_STRUCTURE = {
    "project": "Amarapix Client UI",
    "version": "1.0.0",
    "generatedAt": datetime.now().isoformat(),
    "journeys": [
        {
            "id": "signup-login",
            "title": "User Signup & Login Journey",
            "description": "Complete flow from landing to authenticated user",
            "routes": [
                {"path": "/", "component": "Marketplace (Asset List)", "features": ["Browse assets", "Search", "Filter by format/category"]},
                {"path": "/auth/login", "component": "Login", "features": ["Email/Password login", "Remember me", "Forgot password link"]},
                {"path": "/auth/register", "component": "Register", "features": ["Email signup", "Password validation", "Terms acceptance"]},
                {"path": "/auth/forgot-password", "component": "Forgot Password", "features": ["Email recovery", "Password reset"]},
            ]
        },
        {
            "id": "marketplace-journey",
            "title": "Marketplace Asset Discovery",
            "description": "Browse, search, and view asset details",
            "routes": [
                {"path": "/marketplace", "component": "Asset List", "features": ["Grid view", "Search bar", "Filters", "Pagination"]},
                {"path": "/marketplace/asset/:slug", "component": "Asset Detail", "features": ["Preview", "Download formats", "Similar assets", "Share options"]},
            ]
        },
        {
            "id": "collections-journey",
            "title": "Collections Management",
            "description": "Organize and manage user collections (Premium)",
            "routes": [
                {"path": "/collections", "component": "Collections List", "features": ["View all collections", "2x2 mosaic preview", "Search collections"]},
                {"path": "/collections/:id", "component": "Collection Detail", "features": ["View all items in collection", "Click item to view asset detail"]},
            ]
        },
        {
            "id": "editor-journey",
            "title": "Canvas Editor",
            "description": "Design and edit assets (Authenticated)",
            "routes": [
                {"path": "/editor", "component": "Canvas Editor", "features": ["Design tools", "Template library", "Real-time preview", "Export options"]},
            ]
        },
        {
            "id": "print-journey",
            "title": "Print on Demand",
            "description": "Configure and order printed products (Authenticated)",
            "routes": [
                {"path": "/print", "component": "Print Home", "features": ["Product showcase", "Hero slider", "Product categories"]},
                {"path": "/print/configure/:productId", "component": "Print Configurator", "features": ["Product selection", "Size options", "Pricing", "UGX currency", "Checkout", "Mobile payment integration"]},
                {"path": "/print/orders", "component": "Print Orders", "features": ["Order history", "Status tracking", "Download receipts"]},
            ]
        },
        {
            "id": "academy-journey",
            "title": "Academy & Learning",
            "description": "Video courses and educational content",
            "routes": [
                {"path": "/academy", "component": "Course List", "features": ["Browse courses", "Course categories", "Difficulty levels"]},
                {"path": "/academy/:id", "component": "Course Player", "features": ["Video playback", "Course navigation", "Progress tracking"]},
            ]
        },
        {
            "id": "subscription-journey",
            "title": "Subscription & Pricing",
            "description": "Upgrade to premium features",
            "routes": [
                {"path": "/pricing", "component": "Pricing Page", "features": ["Subscription tiers", "Feature comparison", "CTA buttons"]},
            ]
        },
        {
            "id": "workspace-journey",
            "title": "User Workspace",
            "description": "Personal dashboard and settings (Authenticated)",
            "routes": [
                {"path": "/workspace", "component": "Workspace Dashboard", "features": ["User info", "Recent assets", "Quick actions", "Settings"]},
            ]
        },
        {
            "id": "affiliate-journey",
            "title": "Affiliate Program",
            "description": "Referral and earnings management (Authenticated)",
            "routes": [
                {"path": "/affiliate", "component": "Affiliate Dashboard", "features": ["Earnings stats", "Referral links", "Commission tracking"]},
            ]
        },
        {
            "id": "admin-journey",
            "title": "Admin Management",
            "description": "Administrative controls (Admin only)",
            "routes": [
                {"path": "/admin", "component": "Admin Dashboard", "features": ["User management", "Asset moderation", "Analytics", "Settings"]},
            ]
        },
    ],
    "components": {
        "shared": [
            {"name": "Header", "features": ["Navigation", "Logo", "User menu", "Theme toggle", "Search"]},
            {"name": "Footer", "features": ["Links", "Social media", "Copyright", "Newsletter signup"]},
            {"name": "Modal", "features": ["Dialogs", "Forms", "Confirmations"]},
            {"name": "Spinner", "features": ["Loading states", "Progress indicators"]},
            {"name": "Pagination", "features": ["Navigation", "Page info"]},
            {"name": "Search Bar", "features": ["Text input", "Search button", "Auto-suggestions"]},
            {"name": "Asset Card", "features": ["Thumbnail", "Title", "Meta info", "Hover effects"]},
        ]
    },
    "theme": {
        "mode": "Light & Dark",
        "colors": {
            "primary": "#f5820a (Orange)",
            "text": "#1a1a2e (Dark gray)",
            "textMuted": "#6c757d (Medium gray)",
            "background": "#ffffff (Light)",
            "backgroundDark": "#0f1419 (Dark mode)",
        },
        "typography": {
            "fontFamily": "Lato, sans-serif",
            "weights": ["400 (Regular)", "600 (Semi-bold)", "700 (Bold)", "800 (Extra-bold)", "900 (Black)"]
        },
        "spacing": "8px base unit",
        "borderRadius": "8px - 16px",
        "transitions": "0.2s - 0.3s ease"
    },
    "api_endpoints": {
        "auth": {
            "POST /api/auth/login": {"body": "{ email, password }", "response": "{ token, user }"},
            "POST /api/auth/register": {"body": "{ email, password, name }", "response": "{ token, user }"},
            "POST /api/auth/logout": {"response": "success"},
        },
        "assets": {
            "GET /api/assets": {"params": "q, format, orientation, page", "response": "Asset[]"},
            "GET /api/assets/:slug": {"response": "Asset with details"},
            "POST /api/assets/:id/download": {"response": "{ downloadUrl }"},
        },
        "collections": {
            "GET /api/collections": {"response": "Collection[]"},
            "GET /api/collections/:id": {"response": "Collection with assets"},
            "POST /api/collections": {"body": "{ name, description }", "response": "Collection"},
            "POST /api/collections/:id/assets": {"body": "{ assetId }", "response": "success"},
        },
        "subscription": {
            "GET /api/subscription/plans": {"response": "Plan[]"},
            "POST /api/subscription/subscribe": {"body": "{ planId }", "response": "Subscription"},
        }
    },
    "guards": {
        "authGuard": "Requires user to be authenticated",
        "guestGuard": "Only allows unauthenticated users (auth pages)",
        "premiumGuard": "Requires premium subscription",
        "adminGuard": "Requires admin role",
    },
    "key_features": [
        "Dark Mode with automatic OS preference detection",
        "Responsive design (mobile, tablet, desktop)",
        "Asset marketplace with advanced filtering",
        "Print on Demand with UGX pricing & mobile payments (MTN/Airtel)",
        "Collections management for organizing assets",
        "Canvas editor for design customization",
        "Video academy with course progression",
        "Affiliate program with earnings tracking",
        "Premium subscription tiers",
        "Real-time search and filtering",
    ]
}

def generate_json_export(output_path):
    """Generate JSON documentation"""
    with open(output_path, 'w') as f:
        json.dump(PROJECT_STRUCTURE, f, indent=2)
    print(f"✓ JSON documentation saved: {output_path}")

def generate_markdown_export(output_path):
    """Generate comprehensive Markdown documentation"""
    md_content = f"""# Amarapix Client UI - Developer Documentation

**Generated:** {datetime.now().strftime('%B %d, %Y at %H:%M')}

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

**Project:** {PROJECT_STRUCTURE['project']}
**Version:** {PROJECT_STRUCTURE['version']}

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
{json.dumps(PROJECT_STRUCTURE['components']['shared'], indent=2)}

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
{json.dumps(PROJECT_STRUCTURE['theme']['colors'], indent=2)}

### Typography
{json.dumps(PROJECT_STRUCTURE['theme']['typography'], indent=2)}

### Spacing & Layout
- **Base Unit:** {PROJECT_STRUCTURE['theme']['spacing']}
- **Border Radius:** {PROJECT_STRUCTURE['theme']['borderRadius']}
- **Transitions:** {PROJECT_STRUCTURE['theme']['transitions']}

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
  Body: {{ "email": "user@example.com", "password": "***" }}
  Response: {{ "token": "JWT_TOKEN", "user": {{...}} }}

POST /api/auth/register
  Body: {{ "email": "user@example.com", "password": "***", "name": "John" }}
  Response: {{ "token": "JWT_TOKEN", "user": {{...}} }}

POST /api/auth/logout
  Response: {{ "success": true }}
```

### Asset Endpoints
```
GET /api/assets?q=search&format=PSD&orientation=LANDSCAPE&page=1&limit=12
  Response: {{ "data": [{{...}}], "total": 100, "page": 1 }}

GET /api/assets/:slug
  Response: {{ Asset object with full details }}

POST /api/assets/:id/download
  Body: {{ "format": "PSD" }}
  Response: {{ "downloadUrl": "https://..." }}
```

### Collections Endpoints
```
GET /api/collections
  Response: [{{ Collection }}, ...]

GET /api/collections/:id
  Response: {{ Collection with all assets }}

POST /api/collections
  Body: {{ "name": "My Collection", "description": "..." }}
  Response: {{ Collection }}

POST /api/collections/:id/assets
  Body: {{ "assetId": "asset-123" }}
  Response: {{ "success": true }}

DELETE /api/collections/:id/assets/:assetId
  Response: {{ "success": true }}
```

### Subscription Endpoints
```
GET /api/subscription/plans
  Response: [{{ Plan }}, ...]

POST /api/subscription/subscribe
  Body: {{ "planId": "premium" }}
  Response: {{ Subscription }}

POST /api/subscription/cancel
  Response: {{ "success": true }}
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

{chr(10).join([f"- {feature}" for feature in PROJECT_STRUCTURE['key_features']])}

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

*Last Updated: {datetime.now().strftime('%B %d, %Y')}*
"""
    
    with open(output_path, 'w') as f:
        f.write(md_content)
    print(f"✓ Markdown documentation saved: {output_path}")

def generate_html_export(output_path):
    """Generate interactive HTML documentation"""
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Amarapix Client UI - Developer Documentation</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        
        header {{
            background: linear-gradient(135deg, #f5820a 0%, #ff9a3d 100%);
            color: white;
            padding: 40px 20px;
            border-radius: 10px;
            margin-bottom: 40px;
        }}
        
        header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        
        header p {{
            font-size: 1.1em;
            opacity: 0.9;
        }}
        
        .toc {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        
        .toc h2 {{
            margin-bottom: 15px;
            color: #f5820a;
        }}
        
        .toc ul {{
            list-style: none;
        }}
        
        .toc li {{
            margin: 10px 0;
        }}
        
        .toc a {{
            color: #0066cc;
            text-decoration: none;
        }}
        
        .toc a:hover {{
            text-decoration: underline;
        }}
        
        .section {{
            background: white;
            padding: 30px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        
        .section h2 {{
            color: #f5820a;
            margin-bottom: 20px;
            border-bottom: 2px solid #f5820a;
            padding-bottom: 10px;
        }}
        
        .section h3 {{
            color: #333;
            margin-top: 20px;
            margin-bottom: 10px;
        }}
        
        .journey {{
            border-left: 4px solid #f5820a;
            padding-left: 20px;
            margin: 15px 0;
        }}
        
        .journey h4 {{
            color: #f5820a;
            margin-bottom: 5px;
        }}
        
        .route-flow {{
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }}
        
        .endpoint {{
            background: #f0f0f0;
            padding: 10px;
            border-left: 3px solid #0066cc;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            border-radius: 3px;
        }}
        
        .endpoint.get {{ border-left-color: #00aa00; }}
        .endpoint.post {{ border-left-color: #ff6600; }}
        .endpoint.put {{ border-left-color: #0066cc; }}
        .endpoint.delete {{ border-left-color: #cc0000; }}
        
        .feature-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }}
        
        .feature-card {{
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #ddd;
        }}
        
        .feature-card h5 {{
            color: #f5820a;
            margin-bottom: 10px;
        }}
        
        .feature-card ul {{
            list-style: none;
            padding-left: 10px;
        }}
        
        .feature-card li {{
            margin: 5px 0;
            color: #666;
        }}
        
        .feature-card li:before {{
            content: "✓ ";
            color: #00aa00;
            font-weight: bold;
            margin-right: 5px;
        }}
        
        footer {{
            text-align: center;
            padding: 20px;
            color: #666;
            margin-top: 40px;
        }}
        
        @media (max-width: 768px) {{
            header h1 {{ font-size: 1.8em; }}
            .feature-grid {{ grid-template-columns: 1fr; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎨 Amarapix Client UI</h1>
            <p>Comprehensive Developer Documentation</p>
            <p style="margin-top: 10px; font-size: 0.9em;">Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}</p>
        </header>
        
        <div class="toc">
            <h2>📋 Quick Navigation</h2>
            <ul>
                <li><a href="#journeys">User Journeys</a></li>
                <li><a href="#components">Components</a></li>
                <li><a href="#theme">Theme & Styling</a></li>
                <li><a href="#api">API Integration</a></li>
                <li><a href="#guards">Route Guards</a></li>
                <li><a href="#features">Key Features</a></li>
            </ul>
        </div>
        
        <div id="journeys" class="section">
            <h2>📍 User Journeys</h2>
            
            {chr(10).join([f'''
            <div class="journey">
                <h4>🔄 {journey["title"]}</h4>
                <p>{journey["description"]}</p>
                <div class="route-flow">
                    {" → ".join([r["path"] for r in journey["routes"]])}
                </div>
                <h5>Components & Features:</h5>
                <ul>
                    {"".join([f'<li><strong>{r["component"]}</strong>: {", ".join(r["features"])}</li>' for r in journey["routes"]])}
                </ul>
            </div>
            ''' for journey in PROJECT_STRUCTURE['journeys']])}
        </div>
        
        <div id="components" class="section">
            <h2>🧩 Component Structure</h2>
            
            <h3>Shared Components</h3>
            <div class="feature-grid">
                {chr(10).join([f'''
                <div class="feature-card">
                    <h5>{comp["name"]}</h5>
                    <ul>
                        {"".join([f"<li>{feat}</li>" for feat in comp["features"]])}
                    </ul>
                </div>
                ''' for comp in PROJECT_STRUCTURE['components']['shared']])}
            </div>
        </div>
        
        <div id="theme" class="section">
            <h2>🎨 Theme & Styling</h2>
            
            <h3>Color Palette</h3>
            <div class="feature-grid">
                {chr(10).join([f'<div class="feature-card"><h5>{k}</h5><p><code>{v}</code></p></div>' for k, v in PROJECT_STRUCTURE['theme']['colors'].items()])}
            </div>
            
            <h3>Typography</h3>
            <ul>
                <li><strong>Font Family:</strong> {PROJECT_STRUCTURE['theme']['typography']['fontFamily']}</li>
                <li><strong>Font Weights:</strong> {", ".join(PROJECT_STRUCTURE['theme']['typography']['weights'])}</li>
            </ul>
            
            <h3>Layout</h3>
            <ul>
                <li><strong>Spacing Base:</strong> {PROJECT_STRUCTURE['theme']['spacing']}</li>
                <li><strong>Border Radius:</strong> {PROJECT_STRUCTURE['theme']['borderRadius']}</li>
                <li><strong>Transitions:</strong> {PROJECT_STRUCTURE['theme']['transitions']}</li>
            </ul>
        </div>
        
        <div id="api" class="section">
            <h2>🔌 API Integration</h2>
            
            <h3>Authentication Endpoints</h3>
            <div class="endpoint post">POST /api/auth/login</div>
            <div class="endpoint post">POST /api/auth/register</div>
            <div class="endpoint post">POST /api/auth/logout</div>
            
            <h3>Asset Endpoints</h3>
            <div class="endpoint get">GET /api/assets?q=search&format=PSD&page=1</div>
            <div class="endpoint get">GET /api/assets/:slug</div>
            <div class="endpoint post">POST /api/assets/:id/download</div>
            
            <h3>Collections Endpoints</h3>
            <div class="endpoint get">GET /api/collections</div>
            <div class="endpoint get">GET /api/collections/:id</div>
            <div class="endpoint post">POST /api/collections</div>
            <div class="endpoint post">POST /api/collections/:id/assets</div>
            
            <h3>Print Endpoints</h3>
            <div class="endpoint get">GET /api/print/products</div>
            <div class="endpoint post">POST /api/print/checkout</div>
            <div class="endpoint get">GET /api/print/orders</div>
        </div>
        
        <div id="guards" class="section">
            <h2>🔐 Route Guards</h2>
            <div class="feature-grid">
                {chr(10).join([f'<div class="feature-card"><h5>{k}</h5><p>{v}</p></div>' for k, v in PROJECT_STRUCTURE['guards'].items()])}
            </div>
        </div>
        
        <div id="features" class="section">
            <h2>✨ Key Features</h2>
            <ul>
                {chr(10).join([f"<li>{feat}</li>" for feat in PROJECT_STRUCTURE['key_features']])}
            </ul>
        </div>
        
        <footer>
            <p>📚 Amarapix Client UI - Developer Documentation</p>
            <p>For questions, refer to component files in <code>/src/app/</code></p>
        </footer>
    </div>
</body>
</html>
"""
    
    with open(output_path, 'w') as f:
        f.write(html_content)
    print(f"✓ HTML documentation saved: {output_path}")

def main():
    """Generate all documentation files"""
    docs_dir = Path("/Volumes/Untitled 3/Amarapix company/Amarapix_Platform/Amarapix_ClientUI/UI_DOCUMENTATION")
    docs_dir.mkdir(exist_ok=True)
    
    print("\n🚀 Generating Amarapix UI Documentation...\n")
    
    generate_json_export(docs_dir / "amarapix-ui-structure.json")
    generate_markdown_export(docs_dir / "DEVELOPER_GUIDE.md")
    generate_html_export(docs_dir / "index.html")
    
    print(f"\n✅ All documentation files generated in: {docs_dir}\n")
    print("📄 Files created:")
    print("   1. amarapix-ui-structure.json - Complete project structure as JSON")
    print("   2. DEVELOPER_GUIDE.md - Comprehensive markdown guide")
    print("   3. index.html - Interactive HTML documentation")
    print("\n💡 Next Steps:")
    print("   - Open index.html in a browser to view interactive docs")
    print("   - Share DEVELOPER_GUIDE.md with backend team")
    print("   - Use amarapix-ui-structure.json for API integration planning")

if __name__ == "__main__":
    main()
