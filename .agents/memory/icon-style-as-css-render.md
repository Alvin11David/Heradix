---
name: Icon style controls as live CSS render, not per-style artwork
description: Why the Icons page (icons8-style browser) applies technique/color/corners/stroke-width via CSS on one canonical SVG path instead of storing separate art per style combination.
---

For the `/icons` feature (Amarapix's icons8.com/icons/new-style browsing page), each icon stores exactly one canonical set of raw SVG path fragments (no wrapping `<svg>`, no per-style variants). Global "style pack" controls — technique (line/filled/3D/hand-drawn), color mode (mono/duo/multi/gradient), corners (round/sharp), stroke width — are applied entirely via CSS custom properties and descendant selectors on a wrapping container class, re-rendering the same markup across every style live in the browser (technique toggles `fill`/`stroke`/`filter`; color mode uses `:nth-child` coloring or a shared `<linearGradient>` def; hand-drawn uses an SVG `feTurbulence`/`feDisplacementMap` filter).

**Why:** icons8 itself re-skins one glyph across dozens of style packs rather than shipping separate artwork per combination; mirroring that at the CSS layer avoids an explosion of hand-authored variants (10 categories × 6 icons × 4 techniques × 4 color modes × 2 corner styles) for a demo icon set, and keeps recolor/style-switching instant with no re-fetch.

**How to apply:** when adding new icons, only author the bare path/shape fragments (e.g. `<rect .../><path d="..."/>`) — no `<svg>` wrapper, no inline `fill`/`stroke`/`stroke-width` attributes, since those would fight the CSS overrides. When *rendering* any icon markup via `[innerHTML]`, wrap it in `<svg viewBox="0 0 24 24">...</svg>` first (bare `<path>`/`<rect>` elements inserted directly into a non-SVG container like a `<span>` via `innerHTML` will not render — this bug cost a full debug cycle once already).
