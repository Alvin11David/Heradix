---
name: PNG download CORS handling
description: External PNG providers may block browser fetches or ignore cross-origin download filenames.
---

Fetch PNG bytes into a Blob and download through an object URL instead of assigning an external URL to an anchor's `download` attribute. Keep a CORS-enabled image-proxy fallback for providers that block browser requests.

**Why:** Several catalog URLs are cross-origin; at least one source returns Cloudflare 403 to browser-like requests, while direct anchor downloads open the provider resource instead of saving the requested file.

**How to apply:** Reuse the PNG component's blob-fetch/download path for original, resized, bulk, and ZIP downloads. Only count a download after the bytes are successfully retrieved and the browser download is triggered.