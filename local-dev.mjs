import { createServer } from 'node:http';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT || 8787);
const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(ROOT, 'frontend');
const MIGRATIONS_DIR = join(ROOT, 'migrations');
const LOCAL_STORE_PATH = join(ROOT, '.local-dev-store.json');
const API_STATUS = {
  ok: true,
  app: 'DRP28',
  message: 'Backend is running on Cloudflare Workers.',
  storage: 'memory+persistent-briefs'
};
const TRY_ON_GENERATION_LIMIT = 5;
const store = {
  gallery: [],
  quizResponses: [],
  userPhotos: [],
  favorites: [],
  tryOnGenerations: [],
  briefs: [],
  briefFeedback: []
};

async function loadLocalStore() {
  try {
    const raw = await readFile(LOCAL_STORE_PATH, 'utf8');
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.briefs)) store.briefs = saved.briefs;
    if (Array.isArray(saved.briefFeedback)) store.briefFeedback = saved.briefFeedback;
  } catch {
    // The fallback server can start with an empty store on first run.
  }
}

async function persistLocalStore() {
  const payload = {
    briefs: store.briefs,
    briefFeedback: store.briefFeedback
  };
  try {
    await writeFile(LOCAL_STORE_PATH, JSON.stringify(payload, null, 2));
  } catch {
    // Local persistence is best-effort; API responses should still work.
  }
}

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

function send(res, status, body, contentType, headers = {}) {
  res.writeHead(status, { 'content-type': contentType, ...headers });
  res.end(body);
}

function sendJson(res, status, body, headers = {}) {
  send(res, status, JSON.stringify(body), 'application/json; charset=utf-8', headers);
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

function readCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};

  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (!name) continue;
    try {
      cookies[name] = decodeURIComponent(rest.join('=') || '');
    } catch {
      cookies[name] = rest.join('=') || '';
    }
  }

  return cookies;
}

function cookieSuffix(req, maxAge) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${proto === 'https' ? '; Secure' : ''}`;
}

function clearCookie(name, req) {
  return `${name}=; ${cookieSuffix(req, 0)}`;
}

function pinterestConfigured() {
  return Boolean(process.env.PINTEREST_CLIENT_ID && process.env.PINTEREST_CLIENT_SECRET);
}

function pinterestRedirectUri(req) {
  if (process.env.PINTEREST_REDIRECT_URI) return process.env.PINTEREST_REDIRECT_URI;
  const host = req.headers.host || `localhost:${PORT}`;
  return `http://${host}/api/pinterest/auth/callback`;
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

function imageExtensionFromType(type) {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('webp')) return 'webp';
  if (normalized.includes('gif')) return 'gif';
  return 'jpg';
}

function dataUrlToBlob(value) {
  const match = /^data:([^;,]+);base64,(.+)$/i.exec(String(value || '').trim());
  if (!match) {
    throw new Error('Invalid image data URL.');
  }
  return new Blob([Buffer.from(match[2], 'base64')], { type: match[1] });
}

async function imageBlobFromInput(value, label) {
  const source = String(value || '').trim();
  if (!source) throw new Error(`${label} image is required.`);
  if (source.startsWith('data:')) return dataUrlToBlob(source);

  const url = new URL(source);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`${label} image URL must be HTTP or HTTPS.`);
  }

  const response = await fetch(url.toString(), { headers: { accept: 'image/*' } });
  if (!response.ok) throw new Error(`Could not fetch ${label.toLowerCase()} image.`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('image/')) {
    throw new Error(`${label} URL did not return an image.`);
  }
  return response.blob();
}

function tryOnPrompt(styleName) {
  const name = typeof styleName === 'string' && styleName.trim() ? styleName.trim() : 'the reference haircut';
  return [
    'Edit the first image, which is the user selfie. Use the second image only as the hairstyle reference.',
    `Apply ${name} from the reference to the user as a realistic salon try-on.`,
    'Change only the hair: haircut silhouette, length, layers, fringe, texture, volume, parting, hairline styling, and visible hair color where necessary to match the reference.',
    'Preserve the user identity exactly. Do not change face shape, facial features, skin tone, expression, age, body, pose, clothing, background, lighting, camera angle, or image composition.',
    'Keep the result photorealistic and honest, as if the user genuinely had this haircut today.'
  ].join(' ');
}

async function handleTryOn(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 503, { ok: false, error: 'OpenAI API key is not configured.' });
    return true;
  }

  const body = await readJson(req);
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';
  const userImage = typeof body?.userImageData === 'string' ? body.userImageData : '';
  const referenceImage = typeof body?.referenceImageData === 'string'
    ? body.referenceImageData
    : typeof body?.referenceImageUrl === 'string'
      ? body.referenceImageUrl
      : '';

  if (!sessionId) {
    sendJson(res, 400, { ok: false, error: 'Try-on sessionId is required.' });
    return true;
  }

  const used = store.tryOnGenerations.filter((item) => item.sessionId === sessionId).length;
  if (used >= TRY_ON_GENERATION_LIMIT) {
    sendJson(res, 429, {
      ok: false,
      error: `Try-on generation limit reached. You have used all ${TRY_ON_GENERATION_LIMIT} generations.`,
      limit: TRY_ON_GENERATION_LIMIT,
      used,
      remaining: 0
    });
    return true;
  }

  if (!userImage.trim()) {
    sendJson(res, 400, { ok: false, error: 'A selfie image is required.' });
    return true;
  }
  if (!referenceImage.trim()) {
    sendJson(res, 400, { ok: false, error: 'A reference hairstyle image is required.' });
    return true;
  }

  let userBlob;
  let referenceBlob;
  try {
    [userBlob, referenceBlob] = await Promise.all([
      imageBlobFromInput(userImage, 'Selfie'),
      imageBlobFromInput(referenceImage, 'Reference')
    ]);
  } catch (err) {
    sendJson(res, 400, { ok: false, error: err instanceof Error ? err.message : 'Invalid try-on images.' });
    return true;
  }

  const form = new FormData();
  form.append('model', 'gpt-image-2');
  form.append('prompt', tryOnPrompt(body?.styleName));
  form.append('quality', 'medium');
  form.append('size', '1024x1536');
  form.append('image[]', userBlob, `selfie.${imageExtensionFromType(userBlob.type || 'image/jpeg')}`);
  form.append('image[]', referenceBlob, `reference.${imageExtensionFromType(referenceBlob.type || 'image/jpeg')}`);

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    sendJson(res, response.status, {
      ok: false,
      error: typeof data?.error?.message === 'string' ? data.error.message : 'Try-on generation failed.'
    });
    return true;
  }

  const b64 = data?.data?.[0]?.b64_json;
  if (typeof b64 !== 'string' || !b64) {
    sendJson(res, 502, { ok: false, error: 'Try-on generation did not return an image.' });
    return true;
  }

  store.tryOnGenerations.unshift(createItem({
    sessionId,
    styleId: typeof body?.styleId === 'string' ? body.styleId.trim() : '',
    model: 'gpt-image-2'
  }));

  sendJson(res, 200, {
    ok: true,
    model: 'gpt-image-2',
    limit: TRY_ON_GENERATION_LIMIT,
    used: used + 1,
    remaining: Math.max(0, TRY_ON_GENERATION_LIMIT - used - 1),
    imageData: `data:image/png;base64,${b64}`
  });
  return true;
}

function handlePinterestAuthStart(req, res) {
  if (!pinterestConfigured()) {
    sendJson(res, 503, { ok: false, error: 'Pinterest credentials are not configured.' });
    return true;
  }

  const state = randomUUID();
  const authUrl = new URL('https://www.pinterest.com/oauth/');
  authUrl.searchParams.set('client_id', process.env.PINTEREST_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', pinterestRedirectUri(req));
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'boards:read,pins:read');
  authUrl.searchParams.set('state', state);

  sendJson(res, 200, { ok: true, authUrl: authUrl.toString() }, {
    'set-cookie': `pinterest_oauth_state=${encodeURIComponent(state)}; ${cookieSuffix(req, 600)}`
  });
  return true;
}

function pinterestCallbackBody(req, ok, message) {
  const origin = `http://${req.headers.host || `localhost:${PORT}`}`;
  const payload = JSON.stringify({ type: 'pinterest-auth', ok, message });
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Pinterest</title></head>
<body>
<script>
window.opener && window.opener.postMessage(${payload}, ${JSON.stringify(origin)});
window.close();
</script>
</body>
</html>`;
}

async function handlePinterestCallback(req, res, url) {
  if (!pinterestConfigured()) {
    send(res, 400, pinterestCallbackBody(req, false, 'Pinterest credentials are not configured.'), 'text/html; charset=utf-8');
    return true;
  }

  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  const cookies = readCookies(req);

  if (!code || !state || state !== cookies.pinterest_oauth_state) {
    send(res, 400, pinterestCallbackBody(req, false, 'Pinterest authorization could not be verified.'), 'text/html; charset=utf-8');
    return true;
  }

  try {
    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('redirect_uri', pinterestRedirectUri(req));

    const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || typeof data.access_token !== 'string') {
      send(res, 400, pinterestCallbackBody(req, false, data.message || data.error_description || 'Pinterest authorization failed.'), 'text/html; charset=utf-8');
      return true;
    }

    const cookiesToSet = [
      `pinterest_access_token=${encodeURIComponent(data.access_token)}; ${cookieSuffix(req, Math.max(60, Math.min(Number(data.expires_in || 2592000), 2592000)))}`,
      clearCookie('pinterest_oauth_state', req)
    ];
    if (typeof data.refresh_token === 'string') {
      cookiesToSet.push(`pinterest_refresh_token=${encodeURIComponent(data.refresh_token)}; ${cookieSuffix(req, 5184000)}`);
    }

    send(res, 200, pinterestCallbackBody(req, true, 'Pinterest connected.'), 'text/html; charset=utf-8', {
      'set-cookie': cookiesToSet
    });
  } catch (err) {
    send(res, 400, pinterestCallbackBody(req, false, err instanceof Error ? err.message : 'Pinterest authorization failed.'), 'text/html; charset=utf-8');
  }

  return true;
}

function extractPinterestImageUrl(media) {
  if (!media || typeof media !== 'object') return '';
  const preferred = ['orig', '1200x', '600x', '400x300', '150x150'];
  for (const key of preferred) {
    const url = media?.images?.[key]?.url;
    if (typeof url === 'string' && url) return url;
  }

  const stack = [media];
  while (stack.length) {
    const item = stack.shift();
    if (!item || typeof item !== 'object') continue;
    if (typeof item.url === 'string' && /^https?:\/\//.test(item.url)) return item.url;
    for (const value of Object.values(item)) {
      if (value && typeof value === 'object') stack.push(value);
    }
  }

  return '';
}

function normalizePinterestBoard(board) {
  return {
    id: board.id,
    name: board.name || 'Pinterest board',
    description: board.description || '',
    privacy: board.privacy || '',
    pinCount: Number(board.pin_count || 0),
    coverImageUrl: extractPinterestImageUrl(board.media) || board?.media?.image_cover_url || '',
    thumbnails: Array.isArray(board?.media?.pin_thumbnail_urls) ? board.media.pin_thumbnail_urls : []
  };
}

function normalizePinterestPin(pin) {
  return {
    id: pin.id,
    title: pin.title || pin.alt_text || 'Pinterest style',
    description: pin.description || '',
    imageUrl: extractPinterestImageUrl(pin.media),
    link: pin.link || '',
    createdAt: pin.created_at || '',
    dominantColor: pin.dominant_color || '',
    boardId: pin.board_id || ''
  };
}

async function pinterestApi(req, res, path, params = {}) {
  const accessToken = readCookies(req).pinterest_access_token;
  if (!accessToken) {
    sendJson(res, 401, { ok: false, error: 'Pinterest is not connected.' });
    return null;
  }

  const apiUrl = new URL(`https://api.pinterest.com/v5${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && String(value).trim()) {
      apiUrl.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(apiUrl.toString(), {
    headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    sendJson(res, response.status, {
      ok: false,
      error: data.message || (response.status === 401 ? 'Pinterest authorization expired. Please connect again.' : 'Pinterest request failed.')
    });
    return null;
  }

  return data;
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
          hairThickness: row.hair_thickness || '',
          maintenanceLevel: normalizeMaintenanceLevel(row.upkeep),
          analysis: {
            hairType: normalizeHairType(row.hair_type),
            hairSubtype: row.hair_subtype || '',
            hairThickness: row.hair_thickness || '',
            length: normalizeLength(row.length),
            faceShape: row.face_shape || '',
            gender: normalizeGender(row.gender),
            ethnicity: row.ethnicity || '',
            celebrity: row.celebrity || 'none',
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

  if (url.pathname === '/api/pinterest/status' && req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      configured: pinterestConfigured(),
      connected: Boolean(readCookies(req).pinterest_access_token)
    });
    return true;
  }

  if (url.pathname === '/api/pinterest/auth/start' && req.method === 'GET') {
    return handlePinterestAuthStart(req, res);
  }

  if (url.pathname === '/api/pinterest/auth/callback' && req.method === 'GET') {
    return handlePinterestCallback(req, res, url);
  }

  if (url.pathname === '/api/pinterest/logout' && req.method === 'POST') {
    sendJson(res, 200, { ok: true }, {
      'set-cookie': [
        clearCookie('pinterest_access_token', req),
        clearCookie('pinterest_refresh_token', req),
        clearCookie('pinterest_oauth_state', req)
      ]
    });
    return true;
  }

  if (url.pathname === '/api/pinterest/boards' && req.method === 'GET') {
    const data = await pinterestApi(req, res, '/boards', {
      page_size: Math.max(1, Math.min(Number(url.searchParams.get('page_size') || 50), 100)),
      bookmark: url.searchParams.get('bookmark') || ''
    });
    if (!data) return true;
    sendJson(res, 200, {
      ok: true,
      items: Array.isArray(data.items) ? data.items.map(normalizePinterestBoard) : [],
      bookmark: data.bookmark || null
    });
    return true;
  }

  const pinterestPinsMatch = url.pathname.match(/^\/api\/pinterest\/boards\/([^/]+)\/pins$/);
  if (pinterestPinsMatch && req.method === 'GET') {
    const data = await pinterestApi(req, res, `/boards/${encodeURIComponent(decodeURIComponent(pinterestPinsMatch[1]))}/pins`, {
      page_size: Math.max(1, Math.min(Number(url.searchParams.get('page_size') || 50), 100)),
      bookmark: url.searchParams.get('bookmark') || ''
    });
    if (!data) return true;
    sendJson(res, 200, {
      ok: true,
      items: Array.isArray(data.items) ? data.items.map(normalizePinterestPin).filter((pin) => pin.imageUrl) : [],
      bookmark: data.bookmark || null
    });
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

  if (url.pathname === '/api/try-on') {
    if (req.method === 'POST') return handleTryOn(req, res);
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

  if (url.pathname === '/api/briefs') {
    if (req.method === 'GET') {
      const sessionId = url.searchParams.get('sessionId');
      if (!sessionId || !sessionId.trim()) {
        sendJson(res, 400, { ok: false, error: 'Style brief sessionId is required.' });
        return true;
      }

      const items = store.briefs
        .filter((brief) => brief.sessionId === sessionId.trim())
        .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
        .map((brief) => ({
          ...brief,
          feedback: store.briefFeedback
            .filter((item) => item.briefId === brief.id)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        }));
      sendJson(res, 200, { ok: true, items });
      return true;
    }

    if (req.method === 'POST') {
      const body = await readJson(req);
      if (!body || typeof body.sessionId !== 'string' || !body.sessionId.trim()) {
        sendJson(res, 400, { ok: false, error: 'Style brief sessionId is required.' });
        return true;
      }
      if (!Array.isArray(body.items)) {
        sendJson(res, 400, { ok: false, error: 'Style brief items must be an array.' });
        return true;
      }

      const sessionId = body.sessionId.trim();
      const details = parseRecord(body.details);
      const requestedId = typeof body.id === 'string' ? body.id.trim() : '';
      let brief = requestedId ? store.briefs.find((item) => item.id === requestedId) : null;
      if (brief) {
        brief.items = body.items;
        brief.details = details;
        brief.updatedAt = new Date().toISOString();
      } else {
        brief = createItem({ id: requestedId || randomUUID(), sessionId, items: body.items, details, updatedAt: new Date().toISOString() });
        store.briefs.unshift(brief);
      }

      const feedback = store.briefFeedback
        .filter((item) => item.briefId === brief.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      await persistLocalStore();
      sendJson(res, 201, { ok: true, item: { ...brief, feedback } });
      return true;
    }
  }

  const briefFeedbackMatch = url.pathname.match(/^\/api\/briefs\/([^/]+)\/feedback$/);
  if (briefFeedbackMatch) {
    if (req.method === 'POST') {
      const id = decodeURIComponent(briefFeedbackMatch[1]);
      const brief = store.briefs.find((item) => item.id === id);
      if (!brief) {
        sendJson(res, 404, { ok: false, error: 'Style brief not found.' });
        return true;
      }

      const body = await readJson(req);
      const note = typeof body?.note === 'string' ? body.note.trim() : '';
      const hasRating = body && body.rating !== null && body.rating !== undefined && body.rating !== '';
      const rating = hasRating ? Math.max(0, Math.min(5, Math.round(Number(body.rating) || 0))) : null;

      if (!note && rating === null) {
        sendJson(res, 400, { ok: false, error: 'Feedback needs a note or a rating.' });
        return true;
      }

      const author = typeof body?.author === 'string' && body.author.trim()
        ? body.author.trim().slice(0, 80)
        : 'Reviewer';
      const itemId = typeof body?.itemId === 'string' && body.itemId.trim() ? body.itemId.trim() : null;
      const feedback = createItem({ briefId: id, itemId, author, rating, note });
      store.briefFeedback.push(feedback);

      await persistLocalStore();
      sendJson(res, 201, { ok: true, item: feedback });
      return true;
    }
  }

  const briefFeedbackItemMatch = url.pathname.match(/^\/api\/briefs\/([^/]+)\/feedback\/([^/]+)$/);
  if (briefFeedbackItemMatch) {
    const id = decodeURIComponent(briefFeedbackItemMatch[1]);
    const feedbackId = decodeURIComponent(briefFeedbackItemMatch[2]);
    const existing = store.briefFeedback.find((item) => item.id === feedbackId && item.briefId === id);

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!existing) {
        sendJson(res, 404, { ok: false, error: 'Feedback not found.' });
        return true;
      }

      const body = await readJson(req);
      const note = typeof body?.note === 'string' ? body.note.trim() : '';
      const hasRating = body && body.rating !== null && body.rating !== undefined && body.rating !== '';
      const rating = hasRating ? Math.max(0, Math.min(5, Math.round(Number(body.rating) || 0))) : null;

      if (!note && rating === null) {
        sendJson(res, 400, { ok: false, error: 'Feedback needs a note or a rating.' });
        return true;
      }

      existing.author = typeof body?.author === 'string' && body.author.trim()
        ? body.author.trim().slice(0, 80)
        : existing.author || 'Reviewer';
      existing.rating = rating;
      existing.note = note;

      await persistLocalStore();
      sendJson(res, 200, { ok: true, item: existing });
      return true;
    }

    if (req.method === 'DELETE') {
      if (!existing) {
        sendJson(res, 404, { ok: false, error: 'Feedback not found.' });
        return true;
      }
      store.briefFeedback = store.briefFeedback.filter((item) => item.id !== feedbackId);
      await persistLocalStore();
      sendJson(res, 200, { ok: true, id: feedbackId });
      return true;
    }
  }

  const briefMatch = url.pathname.match(/^\/api\/briefs\/([^/]+)$/);
  if (briefMatch) {
    if (req.method === 'GET') {
      const id = decodeURIComponent(briefMatch[1]);
      const brief = store.briefs.find((item) => item.id === id);
      if (!brief) {
        sendJson(res, 404, { ok: false, error: 'Style brief not found.' });
        return true;
      }

      const feedback = store.briefFeedback
        .filter((item) => item.briefId === id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      sendJson(res, 200, { ok: true, item: { ...brief, feedback } });
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

await loadLocalStore();
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
