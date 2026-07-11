---
name: Editor dirty/save-state initialization
description: Why the canvas editor's save indicator can get stuck on "Saving…" on load, and how to avoid it.
---

Calling a shared "on canvas modified" handler during initial canvas setup (to sync layers, read props, etc.) will also mark the project dirty if that handler unconditionally sets a dirty flag. This makes a persistent save indicator show "Saving…" forever after a fresh page load, even though the user hasn't changed anything.

**Why:** Setup code (initial grid render, restoring canvas JSON, syncing the layers panel) legitimately needs the same handler used for real edits, but "just finished loading" and "user made a change" are different events and must not share a dirty flag transition.

**How to apply:** After any initial/restore canvas setup completes, explicitly reset the dirty/save-state signals to their clean values (e.g. `dirty.set(false)`, `saveState.set('saved')`) rather than assuming they start clean. Applies to `EditorService`/`CanvasEditorComponent` in `src/app/features/editor/` and any similar pattern where a shared mutation-tracking callback also runs during setup.
