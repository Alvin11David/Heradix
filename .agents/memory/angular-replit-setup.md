---
name: Angular Replit setup
description: How to make an imported Angular CLI app serve correctly behind the Replit preview proxy.
---

Setting `ng serve --host 0.0.0.0 --port 5000` alone is not durable for the "Start application" workflow here since the workflow just runs `npx ng serve`. Instead set it directly in `angular.json` under `projects.<name>.architect.serve.options`:

```json
"options": { "host": "0.0.0.0", "port": 5000, "allowedHosts": true }
```

**Why:** the Replit preview proxy connects with a host header that isn't `localhost`, so without `allowedHosts: true` the dev server rejects requests; without explicit host/port config baked into angular.json, workflow restarts default back to Angular's own defaults (localhost:4200).

**How to apply:** whenever setting up or fixing preview visibility for an Angular project on Replit, check/set this block before debugging further.
