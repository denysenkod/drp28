import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT || 8787);
const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'public');
const API_STATUS = {
  ok: true,
  app: 'DRP28',
  message: 'Backend is running on Cloudflare Workers.',
  storage: 'memory'
};
const store = {
  gallery: [],
  quizResponses: [],
  userPhotos: []
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

function sendJson(res, status, body) {
  send(res, status, JSON.stringify(body), 'application/json; charset=utf-8');
}

function readJson(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : null);
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

function parseList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function parseRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function createItem(data) {
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...data
  };
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/status') {
    sendJson(res, 200, API_STATUS);
    return true;
  }

  if (url.pathname === '/api/gallery') {
    if (req.method === 'GET') {
      sendJson(res, 200, { ok: true, items: store.gallery });
      return true;
    }

    if (req.method === 'POST') {
      const body = await readJson(req);
      if (!body || typeof body.title !== 'string' || !body.title.trim()) {
        sendJson(res, 400, { ok: false, error: 'Gallery image title is required.' });
        return true;
      }

      const item = createItem({
        title: body.title.trim(),
        description: typeof body.description === 'string' ? body.description : '',
        imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : '',
        features: parseList(body.features)
      });
      store.gallery.unshift(item);
      sendJson(res, 201, { ok: true, item });
      return true;
    }
  }

  if (url.pathname === '/api/quiz-responses') {
    if (req.method === 'GET') {
      const sessionId = url.searchParams.get('sessionId');
      const items = sessionId
        ? store.quizResponses.filter((item) => item.sessionId === sessionId)
        : store.quizResponses;
      sendJson(res, 200, { ok: true, items });
      return true;
    }

    if (req.method === 'POST') {
      const body = await readJson(req);
      if (!body || typeof body.sessionId !== 'string' || !body.sessionId.trim()) {
        sendJson(res, 400, { ok: false, error: 'Quiz response sessionId is required.' });
        return true;
      }

      const item = createItem({
        sessionId: body.sessionId.trim(),
        answers: parseRecord(body.answers)
      });
      store.quizResponses.unshift(item);
      sendJson(res, 201, { ok: true, item });
      return true;
    }
  }

  if (url.pathname === '/api/user-photos') {
    if (req.method === 'GET') {
      const sessionId = url.searchParams.get('sessionId');
      const items = sessionId
        ? store.userPhotos.filter((item) => item.sessionId === sessionId)
        : store.userPhotos;
      sendJson(res, 200, { ok: true, items });
      return true;
    }

    if (req.method === 'POST') {
      const body = await readJson(req);
      if (!body || typeof body.sessionId !== 'string' || !body.sessionId.trim()) {
        sendJson(res, 400, { ok: false, error: 'User photo sessionId is required.' });
        return true;
      }
      if (typeof body.imageData !== 'string' || !body.imageData.trim()) {
        sendJson(res, 400, { ok: false, error: 'User photo imageData is required.' });
        return true;
      }

      const item = createItem({
        sessionId: body.sessionId.trim(),
        label: typeof body.label === 'string' && body.label.trim() ? body.label.trim() : 'Photo',
        imageData: body.imageData,
        description: typeof body.description === 'string' ? body.description : '',
        features: parseList(body.features)
      });
      store.userPhotos.unshift(item);
      sendJson(res, 201, { ok: true, item });
      return true;
    }
  }

  if (url.pathname.startsWith('/api/')) {
    sendJson(res, 404, { ok: false, error: 'API route not found.' });
    return true;
  }

  return false;
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

  if (await handleApi(req, res, url)) {
    return;
  }

  await serveAsset(url.pathname, res);
}).listen(PORT, () => {
  console.log(`Local DRP28 server running at http://localhost:${PORT}`);
});
