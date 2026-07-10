---
name: Icon-only button labeling
description: How to make icon-only buttons discoverable and accessible without relying on native title tooltips.
---

Use a `data-tip="Label text"` attribute plus `aria-label="Label text"` on icon-only buttons, driven by a shared CSS rule (`[data-tip]::after` with `:hover`/`:focus-visible`) that renders a small floating label. Do not also set the native `title` attribute on the same element — browsers show both the native tooltip and the custom one, which looks buggy and duplicated.

**Why:** native `title` tooltips are slow to appear, inconsistent across browsers, and invisible to keyboard-only/touch users; `aria-label` alone gives no visible hint to sighted mouse users who don't know a control is interactive. The two need to be paired, but never both `title` and `data-tip` on the one element.

**How to apply:** when auditing an existing UI for "icons without labels," check for elements with an icon but no visible text sibling — add `aria-label` + `data-tip` (never `title` alongside them), and place the shared tooltip CSS once at a global/shared stylesheet level (or component-level if only one component needs it) rather than duplicating per button.
