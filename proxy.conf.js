const mockuuupsKey = process.env['MOCKUUUPS_API_KEY'] || 'A1zQo7EDELTWYg0vxXTpsDKKMmlIBJa9';
const mockAnythingKey = process.env['MOCKANYTHING_API_KEY'] || '6ec63ba5-49f9-4f57-ae6a-5b77e93d2c9f:78df385f1864ddb68e7bbdffdceda0a8b2709e06649ee794a3792ef4eaa713d9';
const mediamodifierKey = process.env['MEDIAMODIFIER_API_KEY'] || '15fdbcf0-fb51-461a-8347-0d1110496d26';

if (!mockuuupsKey) {
  console.warn('\n⚠️  MOCKUUUPS_API_KEY is not set — API calls will return 401.\n');
}
if (!mockAnythingKey) {
  console.warn('\n⚠️  MOCKANYTHING_API_KEY is not set — API calls will return 401.\n');
}
if (!mediamodifierKey) {
  console.warn('\n⚠️  MEDIAMODIFIER_API_KEY is not set — API calls will return 401.\n');
}

module.exports = [
  {
    context: ['/mockuuups-api'],
    target: 'https://api.mockuuups.studio/v1',
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/mockuuups-api': '' },
    headers: {
      Authorization: `Bearer ${mockuuupsKey}`,
      Accept: 'application/json',
    },
    on: {
      error: (err, _req, res) => {
        console.error('[Mockuuups proxy] ERROR', err.message);
        if (res && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Proxy error', detail: err.message }));
        }
      },
    },
  },
  {
    context: ['/mock-anything-api'],
    target: 'https://app.dynamicmockups.com/api/v1',
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/mock-anything-api': '' },
    headers: {
      'x-api-key': mockAnythingKey,
      Accept: 'application/json',
    },
    on: {
      error: (err, _req, res) => {
        console.error('[MockAnything proxy] ERROR', err.message);
        if (res && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Proxy error', detail: err.message }));
        }
      },
    },
  },
  {
    context: ['/mediamodifier-api'],
    target: 'https://api.mediamodifier.com',
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/mediamodifier-api': '' },
    headers: {
      api_key: mediamodifierKey,
      Accept: 'application/json',
    },
    on: {
      error: (err, _req, res) => {
        console.error('[MediaModifier proxy] ERROR', err.message);
        if (res && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Proxy error', detail: err.message }));
        }
      },
    },
  },
];
