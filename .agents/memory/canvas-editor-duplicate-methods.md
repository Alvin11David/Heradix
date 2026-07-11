---
name: Canvas editor pre-existing methods
description: Methods that already exist in CanvasEditorComponent — do NOT re-implement
---

## Rule
Before adding any new method to CanvasEditorComponent, grep for it first. The following methods already existed in the component before context menu work:

- `selectAll()` — at ~line 2855, handles visible/non-grid objects
- `onDocClick()` — at ~line 1837, decorated with `@HostListener('document:click')`, closes font picker
- `deleteSelected()` — at ~line 2728
- `duplicateSelected()` — at ~line 3410
- `groupSelected()` / `ungroupSelected()` — at ~line 1340/1361
- `toggleSelectedLock()` — at ~line 3451
- `alignSelected()` — at ~line 3479
- `copySelected()` / `pasteClipboard()` — at ~line 3841/3862
- `nudgeSelected()` — at ~line 3905
- `bringSelectedToFront()` / `sendSelectedToBack()` / `moveSelectedForward()` / `moveSelectedBackward()` — at ~line 1416-1470

**Why:** Adding duplicates causes TS2393 and NG1012 (decorated duplicate) compile errors.

**How to apply:** When adding new functionality, extend existing methods (e.g. add `hideCtxMenu()` call to existing `onDocClick`) rather than re-declaring them.
