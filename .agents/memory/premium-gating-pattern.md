---
name: Premium/paywall gating pattern
description: How to gate premium-only assets behind a subscription check in this app, and which existing service to reuse.
---

`AuthService` (`src/app/core/auth/auth.service.ts`) exposes `isPremium: Signal<boolean>` (true when the mock user's role is `PREMIUM` or `ADMIN`) and `isLoggedIn`/`currentUser` signals. Any feature that has an `isPremium` flag on its asset model (marketplace assets, PNG library, icons, etc.) should check `authService.isPremium()` before allowing a real download/export, not just show a "Premium" badge.

**Why:** The pre-existing `asset-detail` component only shows a "Become Premium" label/notice on premium assets — it never actually blocks the `download()` call client-side (it relies on a real backend endpoint that isn't running in this mock-data environment), so premium gating was effectively decorative there. When adding gating to a new self-contained/localStorage-driven feature (no real backend), do the check client-side explicitly: block the action and redirect to `/pricing` (or `/subscription/pricing`) with a toast, rather than assuming the badge alone communicates the restriction.

**How to apply:** `inject(AuthService)`, add a small `isLocked(item)` helper (`item.isPremium && !auth.isPremium()`), and call it at the top of every download/export/use-in-editor action for that asset — not just in the primary panel button, but also card hover actions, list rows, and bulk-download loops (skip locked items there and toast how many were skipped).

Note the app's default mock user has role `ADMIN`, so `isPremium()` is `true` out of the box in dev — to see the locked/paywall UI while testing, you'd need a mock user with a non-premium role, or temporarily force `isPremium` to `false` while verifying visually.
