import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT || 8787);
const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'frontend');
const MIGRATIONS_DIR = join(ROOT, 'migrations');
const API_STATUS = {
  ok: true,
  app: 'DRP28',
  message: 'Backend is running on Cloudflare Workers.',
  storage: 'memory'
};
const store = {
  gallery: [],
  quizResponses: [],
  userPhotos: [],
  favorites: []
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

function parseLabels(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;
  const seen = new Set();
  const labels = [];

  for (const item of source) {
    if (typeof item !== 'string') continue;
    const label = item.trim();
    const key = label.toLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }

  return labels;
}

function parseRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeGender(value) {
  if (typeof value !== 'string') return 'Unisex';

  const normalized = value.trim().toLowerCase();
  if (normalized === 'men' || normalized === 'man' || normalized === 'male') return 'Men';
  if (normalized === 'women' || normalized === 'woman' || normalized === 'female') return 'Women';
  return 'Unisex';
}

function normalizeLength(value) {
  if (typeof value !== 'string') return '';

  const normalized = value.trim().toLowerCase();
  if (normalized === 'very short') return 'Very Short';
  if (normalized === 'short') return 'Short';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'long') return 'Long';
  if (normalized === 'very long') return 'Very Long';
  return '';
}

function normalizeHairType(value) {
  if (typeof value !== 'string') return '';

  const normalized = value.trim().toLowerCase();
  if (normalized === 'straight' || normalized === 'straight hair') return 'Straight Hair';
  if (normalized === 'wavy' || normalized === 'wavy hair') return 'Wavy Hair';
  if (normalized === 'curly' || normalized === 'curly hair') return 'Curly Hair';
  if (normalized === 'coily' || normalized === 'coily hair') return 'Coily Hair';
  return '';
}

function normalizeMaintenanceLevel(value) {
  if (typeof value !== 'string') return '';

  const normalized = value.trim().toLowerCase();
  if (normalized === 'low') return 'Low';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'higher' || normalized === 'high') return 'High';
  return '';
}

function createItem(data) {
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...data
  };
}

function decodeJsonList(value) {
  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    return parseList(JSON.parse(value));
  } catch {
    return [];
  }
}

function inferSeedGender({ id = '', imageUrl = '', features = [] }) {
  const text = `${id} ${imageUrl} ${features.join(' ')}`.toLowerCase();
  if (text.includes('gq') || text.includes('mens-hair-trends')) return 'Men';
  if (text.includes('glamour') || text.includes('womens-hair-trends')) return 'Women';
  return 'Unisex';
}

function parseSqlValueTuples(valuesSql) {
  const tuples = [];
  let tuple = null;
  let field = '';
  let inString = false;

  for (let index = 0; index < valuesSql.length; index += 1) {
    const char = valuesSql[index];
    const next = valuesSql[index + 1];

    if (inString) {
      if (char === "'" && next === "'") {
        field += "'";
        index += 1;
      } else if (char === "'") {
        inString = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === "'") {
      inString = true;
      continue;
    }

    if (char === '(' && tuple === null) {
      tuple = [];
      field = '';
      continue;
    }

    if (char === ')' && tuple) {
      tuple.push(field.trim());
      tuples.push(tuple);
      tuple = null;
      field = '';
      continue;
    }

    if (char === ',' && tuple) {
      tuple.push(field.trim());
      field = '';
      continue;
    }

    if (tuple) field += char;
  }

  return tuples;
}

async function seedGalleryFromMigrations() {
  const migrationFiles = (await readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith('.sql'))
    .sort();
  let seedOffset = 0;

  for (const file of migrationFiles) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    const insertPattern = /INSERT OR IGNORE INTO gallery_images\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?);/gi;
    let match;

    while ((match = insertPattern.exec(sql))) {
      const columns = match[1].split(',').map((column) => column.trim());
      const tuples = parseSqlValueTuples(match[2]);

      for (const tuple of tuples) {
        const row = Object.fromEntries(columns.map((column, index) => [column, tuple[index] || '']));
        if (!row.id || store.gallery.some((item) => item.id === row.id)) continue;

        const features = decodeJsonList(row.features_json);
        const labels = parseLabels(decodeJsonList(row.labels_json), features);
        store.gallery.push({
          id: row.id,
          createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, seedOffset)).toISOString(),
          title: row.title || row.id,
          description: row.description || '',
          imageUrl: row.image_url || '',
          gender: normalizeGender(row.gender) || inferSeedGender({ id: row.id, imageUrl: row.image_url, features }),
          length: normalizeLength(row.length),
          hairType: normalizeHairType(row.hair_type),
          maintenanceLevel: normalizeMaintenanceLevel(row.upkeep),
          analysis: {
            hairType: normalizeHairType(row.hair_type),
            hairSubtype: row.hair_subtype || '',
            length: normalizeLength(row.length),
            faceShape: row.face_shape || '',
            gender: normalizeGender(row.gender),
            upkeep: normalizeMaintenanceLevel(row.upkeep),
            haircutName: row.haircut_name || '',
            hairColour: row.hair_colour || '',
            vibe: row.vibe || '',
            maintenance: row.maintenance || '',
            model: row.analysis_model || '',
            updatedAt: row.classified_at || ''
          },
          features,
          labels
        });
        seedOffset += 1;
      }
    }
  }
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
        gender: normalizeGender(body.gender),
        length: normalizeLength(body.length),
        hairType: normalizeHairType(body.hairType),
        maintenanceLevel: normalizeMaintenanceLevel(body.maintenanceLevel),
        features: parseList(body.features),
        labels: parseLabels(body.labels, parseList(body.features))
      });
      store.gallery.unshift(item);
      sendJson(res, 201, { ok: true, item });
      return true;
    }
  }

  const galleryImageMatch = url.pathname.match(/^\/api\/gallery\/([^/]+)$/);
  if (galleryImageMatch) {
    if (req.method === 'DELETE') {
      const id = decodeURIComponent(galleryImageMatch[1]);
      const initialLength = store.gallery.length;
      store.gallery = store.gallery.filter((item) => item.id !== id);

      if (store.gallery.length === initialLength) {
        sendJson(res, 404, { ok: false, error: 'Gallery image not found.' });
        return true;
      }

      store.favorites = store.favorites.filter((item) => item.imageId !== id);
      sendJson(res, 200, { ok: true });
      return true;
    }
  }

  const galleryAttributesMatch = url.pathname.match(/^\/api\/gallery\/([^/]+)\/attributes$/);
  if (galleryAttributesMatch) {
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = await readJson(req);
      if (!body || typeof body !== 'object') {
        sendJson(res, 400, { ok: false, error: 'Gallery image attributes are required.' });
        return true;
      }

      const id = decodeURIComponent(galleryAttributesMatch[1]);
      const item = store.gallery.find((galleryItem) => galleryItem.id === id);
      if (!item) {
        sendJson(res, 404, { ok: false, error: 'Gallery image not found.' });
        return true;
      }

      const length = normalizeLength(body.length);
      const hairType = normalizeHairType(body.hairType);
      const maintenanceLevel = normalizeMaintenanceLevel(body.maintenanceLevel);

      if (!length) {
        sendJson(res, 400, { ok: false, error: 'Gallery image length must be Short, Medium, or Long.' });
        return true;
      }
      if (!hairType) {
        sendJson(res, 400, { ok: false, error: 'Gallery image texture must be Straight Hair, Wavy Hair, or Curly Hair.' });
        return true;
      }
      if (!maintenanceLevel) {
        sendJson(res, 400, { ok: false, error: 'Gallery image upkeep must be Low, Medium, or High.' });
        return true;
      }

      item.gender = normalizeGender(body.gender);
      item.length = length;
      item.hairType = hairType;
      item.maintenanceLevel = maintenanceLevel;
      sendJson(res, 200, { ok: true, item });
      return true;
    }
  }

  const galleryLabelsMatch = url.pathname.match(/^\/api\/gallery\/([^/]+)\/labels$/);
  if (galleryLabelsMatch) {
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = await readJson(req);
      if (!body || !Array.isArray(body.labels)) {
        sendJson(res, 400, { ok: false, error: 'Gallery image labels array is required.' });
        return true;
      }

      const id = decodeURIComponent(galleryLabelsMatch[1]);
      const item = store.gallery.find((galleryItem) => galleryItem.id === id);
      if (!item) {
        sendJson(res, 404, { ok: false, error: 'Gallery image not found.' });
        return true;
      }

      item.labels = parseLabels(body.labels);
      sendJson(res, 200, { ok: true, item });
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

  if (url.pathname === '/api/favorites') {
    if (req.method === 'GET') {
      const sessionId = url.searchParams.get('sessionId');
      if (!sessionId || !sessionId.trim()) {
        sendJson(res, 400, { ok: false, error: 'Favorite image sessionId is required.' });
        return true;
      }

      const items = store.favorites
        .filter((item) => item.sessionId === sessionId.trim())
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      sendJson(res, 200, { ok: true, items });
      return true;
    }

    if (req.method === 'POST') {
      const body = await readJson(req);
      if (!body || typeof body.sessionId !== 'string' || !body.sessionId.trim()) {
        sendJson(res, 400, { ok: false, error: 'Favorite image sessionId is required.' });
        return true;
      }
      if (typeof body.imageId !== 'string' || !body.imageId.trim()) {
        sendJson(res, 400, { ok: false, error: 'Favorite image imageId is required.' });
        return true;
      }

      const sessionId = body.sessionId.trim();
      const imageId = body.imageId.trim();
      let item = store.favorites.find((fav) => fav.sessionId === sessionId && fav.imageId === imageId);
      if (!item) {
        item = createItem({ sessionId, imageId });
        store.favorites.unshift(item);
      }

      sendJson(res, 201, { ok: true, item });
      return true;
    }

    if (req.method === 'DELETE') {
      const body = await readJson(req);
      const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : url.searchParams.get('sessionId');
      const imageId = typeof body?.imageId === 'string' ? body.imageId : url.searchParams.get('imageId');

      if (!sessionId || !sessionId.trim()) {
        sendJson(res, 400, { ok: false, error: 'Favorite image sessionId is required.' });
        return true;
      }
      if (!imageId || !imageId.trim()) {
        sendJson(res, 400, { ok: false, error: 'Favorite image imageId is required.' });
        return true;
      }

      store.favorites = store.favorites.filter(
        (item) => item.sessionId !== sessionId.trim() || item.imageId !== imageId.trim()
      );
      sendJson(res, 200, { ok: true });
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
  const assetPath = pathname === '/' || pathname === '/admin' || pathname === '/admin/' ? '/index.html' : pathname;
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

await seedGalleryFromMigrations();

createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (await handleApi(req, res, url)) {
    return;
  }

  await serveAsset(url.pathname, res);
}).listen(PORT, () => {
  console.log(`Local DRP28 server running at http://localhost:${PORT}`);
});
