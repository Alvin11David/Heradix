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

## User preferences
(none recorded yet)
