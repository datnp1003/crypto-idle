'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');
const { sendJson, sendText } = require('./http-utils.js');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(res, pathname) {
  if (pathname === '/') pathname = '/index.html';

  const filePath = path.join(ROOT, pathname);
  if (!filePath.startsWith(ROOT)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }
    const ext = path.extname(filePath);
    const contentType = MIME[ext] || 'text/plain; charset=utf-8';
    sendText(res, 200, contentType, data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  serveStatic(res, pathname);
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

module.exports = { server };
