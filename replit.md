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

## User preferences
(none recorded yet)
