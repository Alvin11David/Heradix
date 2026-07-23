/**
 * Angular dev-server proxy config.
 * Proxies /api/v1 → json-server (port 3000) and /mockuuups-api → Mockuuups Studio.
 * Reads MOCKUUUPS_API_KEY from environment (Replit Secret) at startup —
 * the key never ships to the browser.
 */
const apiKey = process.env['MOCKUUUPS_API_KEY'] || '';

if (!apiKey) {
  console.warn('\n⚠️  MOCKUUUPS_API_KEY is not set — Mockuuups API calls will return 401.\n');
}

module.exports = [
  // ── Local mock API (json-server) ──────────────────────────────────────────
  {
    context: ['/api/v1'],
    target: 'http://localhost:3000',
    changeOrigin: false,
    secure: false,
    on: {
      error: (err, _req, res) => {
        console.error('[API proxy]', err.message);
        if (res && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Mock API unavailable', detail: err.message }));
        }
      },
    },
  },
  // ── Mockuuups Studio API ───────────────────────────────────────────────────
  {
    context: ['/mockuuups-api'],
    target: 'https://api.mockuuups.studio/v1',
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/mockuuups-api': '' },
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    on: {
      error: (err, _req, res) => {
        console.error('[Mockuuups proxy]', err.message);
        if (res && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Proxy error', detail: err.message }));
        }
      },
    },
  },
];
