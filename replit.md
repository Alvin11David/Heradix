# Amarapix Client UI

## Overview
Angular 20 client application for Amarapix — a design-asset marketplace with an in-browser Fabric.js-based canvas editor (text, shapes, images, AI tools, export to PNG/PDF/SVG/JPG). Ships with a local mock API (`db.json` + `json-server`) for development, plus some PDF/export tooling scripts.

## Running on Replit
- Dev server: `npx ng serve` (bound via the "Start application" workflow), configured in `angular.json` under `projects.Amarapix_ClientUI.architect.serve.options` with `host: 0.0.0.0`, `port: 5000`, `allowedHosts: true` so it works behind the Replit preview proxy.
- The mock API (`npm run mock-api`, json-server on port 3000) is not started by default — the app currently shows "Cannot reach server" network errors in the console when the mock API isn't running. Start it manually if backend-dependent features are needed.

## Recent changes
- Canvas editor UX: added a lightweight custom hover/focus tooltip (`data-tip` attribute + CSS) plus `aria-label` to icon-only buttons across the editor toolbar, layers panel, properties panel, status bar, and modals, so previously unlabeled icons now show a clear name on hover/keyboard focus. Undo/Redo buttons now use a real `[disabled]` binding (previously class-only, not actually disabled for keyboard/screen readers).
- Canvas editor made fully functional frontend-only (no backend needed):
  - **Save/Autosave**: now persists the project (including canvas JSON) to `localStorage` instead of calling the missing backend; reloading the editor restores your work. Fixed a bug where the status bar was stuck showing "Saving…" forever on load.
  - **Export**: PNG/JPG/SVG/PDF are now generated entirely client-side via Fabric's `toDataURL()`/`toSVG()` plus the new `jspdf` dependency — no export backend call.
  - **Remove Background (AI Tools)**: replaced the fake `setTimeout` mock with a real client-side chroma-key algorithm (samples the image's corner color, keys out matching pixels with edge feathering). Works best on photos with a plain/solid background; "Apply" now genuinely swaps the canvas image, "Discard" cancels cleanly.
  - **Templates**: category filter buttons, the search box, and template tiles (sidebar + modal) are now data-driven and functional — picking one resizes the canvas, applies a gradient background, and drops in an editable title/subtitle.
  - **Arrow tool**: fixed — it previously opened the file-upload dialog; it now draws an actual arrow shape (reusing the existing arrowhead rendering used by the Line tool).
- **New Icons browsing experience** (`/icons` route, header "Icons" nav now points here instead of `/marketplace`): a from-scratch icon library page modeled on icons8.com/icons/new's feature set, built with 60 original hand-authored line-icon SVGs across 10 categories (`src/app/features/icons/icons.service.ts`, model in `src/app/core/models/icon.model.ts`).
  - Left sidebar: category list, animation toggle, OS/platform, technique (line/filled/3D/hand-drawn), color mode (mono/duo/multi/gradient), corners, stroke width, filter size, aesthetic, trendiness, author, and a favorites filter (persisted in `localStorage`).
  - Toolbar: search (plus an "AI search" toggle that broadens matching to token/prefix overlap instead of exact substring), a live recolor color picker, and a grid density (detailed/compact) toggle.
  - Icon grid is grouped into date sections (Today/Yesterday/This week/This month/Earlier) computed from each icon's seeded `createdAt`.
  - Icon detail slide-over panel: large live preview, favorite toggle, copy-SVG-to-clipboard, PNG export at multiple sizes (client-side canvas rendering) and SVG download, tags, related icons.
  - Style controls (technique/color mode/corners/stroke width) are implemented as live CSS-driven renders of a single canonical SVG path per icon (not separate artwork per style) — see memory note `icon-style-as-css-render.md` for why.
- **PNG section** (`/png`, `src/app/features/png/`): finished out the stalled implementation and added features modeled on Pixabay/PNGWing/PNGTree-style transparent PNG libraries, on top of the existing filter/sort/collections/favorites system:
  - **Create Your Own Cutout**: a hero CTA opens an upload tool that removes the background from any user-uploaded photo entirely client-side (drag-and-drop or file picker → chroma-key removal → download PNG / use in editor). Reuses the same corner-sampling chroma-key algorithm as the canvas editor's "Remove Background" tool, extracted into a shared utility at `src/app/shared/utils/bg-removal.ts` (`removeBackgroundFromImage`, `resizeImageToDataUrl`) so both features stay in sync.
  - **Recently viewed rail**: surfaces the `recentAssets` the service was already tracking in `localStorage` but that had no UI before.
  - **Functional size-based downloads**: the detail panel's Small/Medium/Large size picker now actually resizes the PNG client-side via canvas before downloading (previously cosmetic — always downloaded full resolution regardless of the selected size). Falls back to full-resolution download with a toast if the source image can't be read cross-origin.
  - **Lightbox zoom**: click the detail panel preview for a fullscreen pan/zoom view on a checkerboard background, with prev/next navigation.
  - **Prev/Next navigation**: arrow keys or panel header buttons cycle through the current result set without closing the detail panel.
  - **Bulk select**: a "Select" toggle in the toolbar lets users multi-select cards and batch-download them.
  - **Premium paywall gating**: PRO-badged assets now actually check `AuthService.isPremium()` before downloading, using in the editor, or bulk-downloading (previously the "Premium"/"PRO" badge was cosmetic only) — locked assets show a lock icon and redirect non-subscribers to `/pricing` with an explanatory toast, matching Shutterstock/Adobe Stock/Envato Elements-style paywalls.
  - **Curated Packs strip**: a PNGTree/Freepik-style row of themed bundles (Holiday, Business, Animals, Tech, etc.) that jump straight to a pre-filtered view of the grid.
  - **Search by color**: Pixabay-style color swatches surfaced directly under the hero search bar (in addition to the existing sidebar color-tone filter) for one-click visual search.
  - **License & Usage panel**: the detail panel now states usage terms (personal/commercial use, attribution, resale restrictions, premium requirement) — CleanPNG/PNGWing-style license disclosure.
  - **Report this image**: a lightweight compliance/DMCA-style report link + modal in the detail panel, matching CleanPNG/KissPNG's content-report flow (client-side only, no backend to send to).
  - **Recent searches**: Pixabay/PNGTree-style search history dropdown (separate from "Recently viewed" assets) — shown when the search box is focused empty, persisted in `localStorage`, with per-term remove and "Clear" all.
  - **Related search tag cloud**: PNGWing/CleanPNG/KissPNG-style tag cloud below the results grid, computed from the most common tags in the current result set (excludes the active query term).
  - **File size estimates in the size picker**: each Small/Medium/Large option in the detail panel now shows an approximate KB/MB download size (heuristic based on target pixel dimensions), matching PNGWing/CleanPNG's "know before you download" pattern — see `src/app/shared/utils/file-size-estimate.ts`.
  - **ZIP bundle downloads**: "Download as ZIP" for bulk-selected assets, and a per-board zip button in the Collections modal — CleanPNG "resource pack"/Freepik pack-style single-file download instead of N separate browser downloads. Uses the `jszip` dependency; fetches each asset, zips client-side, and triggers one download.

## AI Mockup Studio (`/mockups/studio`)
- 5-step wizard for generating custom mockups via AI prompt
- Route: `/mockups/studio` → `src/app/features/mockups/ai-studio/ai-studio.component.ts`
- No auth guard — publicly accessible
- **Step 1: Search Product** — live search against mock product catalog (BELLA+CANVAS, Next Level, Gildan, etc.) with quick-pick pills
- **Step 2: Confirm Product** — detail card with color swatch picker and decoration type list
- **Step 3: Choose Style** — visual style cards (Baseline, Lifestyle, Studio, Flat Lay, Artistic, Minimal)
- **Step 4: Describe Design** — AI prompt textarea with quick-add chips and writing tips
- **Step 5: Generate** — animated progress orb with stage labels, then result panel with 4 view variants, download/editor/regenerate actions
- Persistent left-rail stepper with step status (active/complete/locked), product summary card
- Dark "Forge" design language (`#0c0c0f` background, `#f5820a` accents) — contrasts with the light marketplace
- Discovery CTA banner added to the `/mockups` hero section pointing to the Studio
- Generation and downloads are client-side stubs; connect to a real API via `startGeneration()` and `downloadVariant()` in the component

## Mockups Module (`/mockups`)
- Full mockups marketplace and creation tool, modeled on Canva, Placeit, Smartmockups, Freepik, and Envato Elements
- Route: `/mockups` → `src/app/features/mockups/mockups.component.ts`
- Header "Mockups" nav link updated to point to `/mockups`
- Data model: `src/app/core/models/mockup.model.ts`
- Service: `src/app/features/mockups/mockups.service.ts` — 40+ mock assets across 9 categories, computed signals for all homepage sections and browse/filter state, localStorage persistence for favorites/collections/recent searches
- **Homepage**: hero with gradient + AI search toggle, color swatches, trending tags; 12+ curated sections (Featured, Trending, AI-Generated, Devices, Apparel, Packaging, Branding, Editor's Picks, Free, Most Downloaded, Creators, Recently Viewed); seasonal collections strip; trending tags cloud
- **Browse mode**: sticky toolbar with sort, view-mode (masonry/grid/list), bulk select + download; collapsible sidebar with full filter set (category, subcategory, scene type, orientation, license, format, AI, favorites, date, background color); infinite-scroll load-more; active filter chips; related tags cloud
- **Detail panel** (slide-over): full preview + thumbnail strip + lightbox zoom; Info / Smart Editor / Similar tabs; stats, specs, license disclosure, creator, color palette, tags, format download buttons
- **Smart Mockup Editor tab**: drag-and-drop / file-upload design zone; placement sliders (scale, rotation, position); background color picker; lighting controls (brightness, contrast, opacity); effects toggles (shadow, reflection, gloss, finish type); 6 AI tool buttons (Auto Fit, Remove BG, Add Shadow, Perspective, Color Match, Lighting)
- **AI panel**: text prompt → simulated generation with toast feedback
- **Collections modal**: add-to-collection, create new collection, persisted in localStorage
- **Report modal**: content flagging for copyright/inappropriate/spam/quality
- **Lightbox**: full-screen preview with prev/next navigation (keyboard + buttons)
- **Favorites & bulk select**: persistent favorites, multi-select mode with batch download, premium paywall gating
- All state managed via Angular Signals (ChangeDetectionStrategy.OnPush)

## Vectors Module (`/vectors`)
- Full vector library and marketplace: homepage with 10+ curated sections (Featured, Trending, Staff Picks, AI Generated, Free, Premium, New Arrivals, etc.), category grid, seasonal collections, trending colors/tags/styles
- Browse mode: sidebar filters (category, format SVG/EPS/AI/PDF/CDR/DXF/PNG, style, license, orientation, complexity, date, special toggles), masonry/grid/list views, sort by popular/newest/downloads/views/likes/rating, active filter chips, related tag cloud
- Asset cards: hover overlay with Download + Edit actions, favorite/collect quick actions, dominant color dots, format badges, creator avatar + verified badge, PRO/FREE/AI/NEW/Animated badges
- Detail panel: tabbed (Info / Similar / Creator), format download buttons, "Open in Editor" CTA, stats grid, star rating, color palette, tags, license disclosure, report modal
- Collections: create/add-to from the detail panel, persisted in localStorage
- Bulk select mode: multi-select cards, batch download
- Search: hero search with recent searches dropdown, AI toggle, format chips; browse search bar with auto-suggest
- Premium gating: PRO assets check AuthService.isPremium() before download; redirects to /pricing
- All state managed via Angular Signals in `src/app/features/vectors/vectors.service.ts`; mock data in same file (ALL_VECTORS, buildAssets())
- Route: `/vectors` → `src/app/features/vectors/vectors.component.ts`
- Header "Vectors" nav link updated to point to `/vectors`
- Installed `onnxruntime-web` to fix pre-existing dev server crash from `@imgly/background-removal`

## User preferences
(none recorded yet)
