---
name: Angular preview readiness
description: How to tell when the restarted Angular preview is actually serving the app.
---

After restarting the Angular workflow, an HTTP 200 from the Replit preview domain does not always mean the app is ready. While Angular compiles, the proxy can return a plain “Running” placeholder, and screenshot capture may fail to connect. Wait until workflow logs show compilation complete and the dev server listening before visual checks.

**Why:** During a full Angular rebuild, the workflow restart returned before `ng serve` finished compiling, and the proxy temporarily returned a successful status with placeholder content.

**How to apply:** After a workflow restart, verify the workflow output shows the dev server listening and that the preview response contains the app document before taking screenshots.
