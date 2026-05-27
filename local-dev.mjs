import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 8787);
const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const API_STATUS = {
  ok: true,
  app: 'DRP28',
  message: 'Backend is running on Cloudflare Workers.'
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/babel; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

function send(res, status, body, contentType) {
  res.writeHead(status, { 'content-type': contentType });
  res.end(body);
}

async function serveAsset(pathname, res) {
  const assetPath = pathname === '/' ? '/index.html' : pathname;
  const normalized = normalize(assetPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(PUBLIC_DIR, normalized);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
    return;
  }

  try {
    const body = await readFile(filePath);
    const contentType = MIME_TYPES[extname(filePath)] || 'application/octet-stream';
    send(res, 200, body, contentType);
  } catch {
    send(res, 404, 'Not found', 'text/plain; charset=utf-8');
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/status') {
    send(res, 200, JSON.stringify(API_STATUS), 'application/json; charset=utf-8');
    return;
  }

  await serveAsset(url.pathname, res);
}).listen(PORT, () => {
  console.log(`Local DRP28 server running at http://localhost:${PORT}`);
});
