const APP_NAME = 'DRP28';
const API_MESSAGE = 'Backend is running on Cloudflare Workers.';

interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  DB?: any;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...init.headers
    }
  });
}

function error(message: string, status = 400): Response {
  return json({ ok: false, error: message }, { status });
}

async function readJson(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function ensureDb(env: Env): any {
  if (!env.DB) {
    throw new Error('D1 database binding is not configured.');
  }

  return env.DB;
}

function parseList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string');
}

function parseLabels(value: unknown, fallback: string[] = []): string[] {
  const source = Array.isArray(value) ? value : fallback;
  const seen = new Set();
  const labels: string[] = [];

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

function parseRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function decodeJson(value: unknown, fallback: unknown): unknown {
  if (typeof value !== 'string') return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeGender(value: unknown): string {
  if (typeof value !== 'string') return 'Unisex';

  const normalized = value.trim().toLowerCase();
  if (normalized === 'men' || normalized === 'man' || normalized === 'male') return 'Men';
  if (normalized === 'women' || normalized === 'woman' || normalized === 'female') return 'Women';
  return 'Unisex';
}

function normalizeLength(value: unknown): string {
  if (typeof value !== 'string') return '';

  const normalized = value.trim().toLowerCase();
  if (normalized === 'very short') return 'Very Short';
  if (normalized === 'short') return 'Short';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'long') return 'Long';
  if (normalized === 'very long') return 'Very Long';
  return '';
}

function normalizeHairType(value: unknown): string {
  if (typeof value !== 'string') return '';

  const normalized = value.trim().toLowerCase();
  if (normalized === 'straight' || normalized === 'straight hair') return 'Straight Hair';
  if (normalized === 'wavy' || normalized === 'wavy hair') return 'Wavy Hair';
  if (normalized === 'curly' || normalized === 'curly hair') return 'Curly Hair';
  if (normalized === 'coily' || normalized === 'coily hair') return 'Coily Hair';
  return '';
}

function normalizeMaintenanceLevel(value: unknown): string {
  if (typeof value !== 'string') return '';

  const normalized = value.trim().toLowerCase();
  if (normalized === 'low') return 'Low';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'higher' || normalized === 'high') return 'High';
  return '';
}

function rowToGalleryImage(row: any): Record<string, unknown> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    gender: normalizeGender(row.gender),
    length: normalizeLength(row.length),
    hairType: normalizeHairType(row.hair_type),
    maintenanceLevel: normalizeMaintenanceLevel(row.upkeep),
    analysis: {
      hairType: normalizeHairType(row.hair_type),
      hairSubtype: row.hair_subtype || '',
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
      model: row.model || '',
      updatedAt: row.classified_at || ''
    },
    features: decodeJson(row.features_json, []),
    labels: decodeJson(row.labels_json, decodeJson(row.features_json, [])),
    createdAt: row.created_at
  };
}

function rowToQuizResponse(row: any): Record<string, unknown> {
  return {
    id: row.id,
    sessionId: row.session_id,
    answers: decodeJson(row.answers_json, {}),
    createdAt: row.created_at
  };
}

function rowToUserPhoto(row: any): Record<string, unknown> {
  return {
    id: row.id,
    sessionId: row.session_id,
    label: row.label,
    imageData: row.image_data,
    description: row.description,
    features: decodeJson(row.features_json, []),
    createdAt: row.created_at
  };
}

function rowToFavoriteImage(row: any): Record<string, unknown> {
  return {
    sessionId: row.session_id,
    imageId: row.image_id,
    createdAt: row.created_at
  };
}

async function listGallery(db: any): Promise<Response> {
  const { results } = await db
    .prepare('SELECT * FROM gallery_images ORDER BY created_at DESC')
    .all();

  return json({ ok: true, items: results.map(rowToGalleryImage) });
}

async function createGalleryImage(request: Request, db: any): Promise<Response> {
  const body = await readJson(request);

  if (!body || typeof body.title !== 'string' || !body.title.trim()) {
    return error('Gallery image title is required.');
  }

  const id = crypto.randomUUID();
  const description = typeof body.description === 'string' ? body.description : '';
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : '';
  const gender = normalizeGender(body.gender);
  const length = normalizeLength(body.length);
  const hairType = normalizeHairType(body.hairType);
  const maintenanceLevel = normalizeMaintenanceLevel(body.maintenanceLevel);
  const features = parseList(body.features);
  const labels = parseLabels(body.labels, features);

  await db
    .prepare(
      `INSERT INTO gallery_images (id, title, description, image_url, gender, length, hair_type, upkeep, features_json, labels_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, body.title.trim(), description, imageUrl, gender, length, hairType, maintenanceLevel, JSON.stringify(features), JSON.stringify(labels))
    .run();

  const row = await db
    .prepare('SELECT * FROM gallery_images WHERE id = ?')
    .bind(id)
    .first();

  return json({ ok: true, item: rowToGalleryImage(row) }, { status: 201 });
}

async function updateGalleryImageAttributes(request: Request, db: any, id: string): Promise<Response> {
  const body = await readJson(request);

  if (!body || typeof body !== 'object') {
    return error('Gallery image attributes are required.');
  }

  const existing = await db
    .prepare('SELECT * FROM gallery_images WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return error('Gallery image not found.', 404);
  }

  const gender = normalizeGender(body.gender);
  const length = normalizeLength(body.length);
  const hairType = normalizeHairType(body.hairType);
  const maintenanceLevel = normalizeMaintenanceLevel(body.maintenanceLevel);

  if (!length) return error('Gallery image length must be Very Short, Short, Medium, Long, or Very Long.');
  if (!hairType) return error('Gallery image texture must be Straight Hair, Wavy Hair, Curly Hair, or Coily Hair.');
  if (!maintenanceLevel) return error('Gallery image upkeep must be Low, Medium, or High.');

  await db
    .prepare(
      `UPDATE gallery_images
       SET gender = ?, length = ?, hair_type = ?, upkeep = ?
       WHERE id = ?`
    )
    .bind(gender, length, hairType, maintenanceLevel, id)
    .run();

  const row = await db
    .prepare('SELECT * FROM gallery_images WHERE id = ?')
    .bind(id)
    .first();

  return json({ ok: true, item: rowToGalleryImage(row) });
}

async function updateGalleryImageLabels(request: Request, db: any, id: string): Promise<Response> {
  const body = await readJson(request);

  if (!body || !Array.isArray(body.labels)) {
    return error('Gallery image labels array is required.');
  }

  const existing = await db
    .prepare('SELECT * FROM gallery_images WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return error('Gallery image not found.', 404);
  }

  const labels = parseLabels(body.labels);

  await db
    .prepare('UPDATE gallery_images SET labels_json = ? WHERE id = ?')
    .bind(JSON.stringify(labels), id)
    .run();

  const row = await db
    .prepare('SELECT * FROM gallery_images WHERE id = ?')
    .bind(id)
    .first();

  return json({ ok: true, item: rowToGalleryImage(row) });
}

async function deleteGalleryImage(db: any, id: string): Promise<Response> {
  const existing = await db
    .prepare('SELECT * FROM gallery_images WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) {
    return error('Gallery image not found.', 404);
  }

  await db
    .prepare('DELETE FROM favorite_images WHERE image_id = ?')
    .bind(id)
    .run();

  await db
    .prepare('DELETE FROM gallery_images WHERE id = ?')
    .bind(id)
    .run();

  return json({ ok: true });
}

async function listQuizResponses(url: URL, db: any): Promise<Response> {
  const sessionId = url.searchParams.get('sessionId');
  const query = sessionId
    ? db.prepare('SELECT * FROM quiz_responses WHERE session_id = ? ORDER BY created_at DESC').bind(sessionId)
    : db.prepare('SELECT * FROM quiz_responses ORDER BY created_at DESC');
  const { results } = await query.all();

  return json({ ok: true, items: results.map(rowToQuizResponse) });
}

async function createQuizResponse(request: Request, db: any): Promise<Response> {
  const body = await readJson(request);

  if (!body || typeof body.sessionId !== 'string' || !body.sessionId.trim()) {
    return error('Quiz response sessionId is required.');
  }

  const id = crypto.randomUUID();
  const answers = parseRecord(body.answers);

  await db
    .prepare(
      `INSERT INTO quiz_responses (id, session_id, answers_json)
       VALUES (?, ?, ?)`
    )
    .bind(id, body.sessionId.trim(), JSON.stringify(answers))
    .run();

  const row = await db
    .prepare('SELECT * FROM quiz_responses WHERE id = ?')
    .bind(id)
    .first();

  return json({ ok: true, item: rowToQuizResponse(row) }, { status: 201 });
}

async function listUserPhotos(url: URL, db: any): Promise<Response> {
  const sessionId = url.searchParams.get('sessionId');
  const query = sessionId
    ? db.prepare('SELECT * FROM user_photos WHERE session_id = ? ORDER BY created_at DESC').bind(sessionId)
    : db.prepare('SELECT * FROM user_photos ORDER BY created_at DESC');
  const { results } = await query.all();

  return json({ ok: true, items: results.map(rowToUserPhoto) });
}

async function createUserPhoto(request: Request, db: any): Promise<Response> {
  const body = await readJson(request);

  if (!body || typeof body.sessionId !== 'string' || !body.sessionId.trim()) {
    return error('User photo sessionId is required.');
  }

  if (typeof body.imageData !== 'string' || !body.imageData.trim()) {
    return error('User photo imageData is required.');
  }

  const id = crypto.randomUUID();
  const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim() : 'Photo';
  const description = typeof body.description === 'string' ? body.description : '';
  const features = parseList(body.features);

  await db
    .prepare(
      `INSERT INTO user_photos (id, session_id, label, image_data, description, features_json)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, body.sessionId.trim(), label, body.imageData, description, JSON.stringify(features))
    .run();

  const row = await db
    .prepare('SELECT * FROM user_photos WHERE id = ?')
    .bind(id)
    .first();

  return json({ ok: true, item: rowToUserPhoto(row) }, { status: 201 });
}

async function listFavoriteImages(url: URL, db: any): Promise<Response> {
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId || !sessionId.trim()) {
    return error('Favorite image sessionId is required.');
  }

  const { results } = await db
    .prepare('SELECT * FROM favorite_images WHERE session_id = ? ORDER BY created_at DESC')
    .bind(sessionId.trim())
    .all();

  return json({ ok: true, items: results.map(rowToFavoriteImage) });
}

async function createFavoriteImage(request: Request, db: any): Promise<Response> {
  const body = await readJson(request);

  if (!body || typeof body.sessionId !== 'string' || !body.sessionId.trim()) {
    return error('Favorite image sessionId is required.');
  }

  if (typeof body.imageId !== 'string' || !body.imageId.trim()) {
    return error('Favorite image imageId is required.');
  }

  await db
    .prepare(
      `INSERT OR IGNORE INTO favorite_images (session_id, image_id)
       VALUES (?, ?)`
    )
    .bind(body.sessionId.trim(), body.imageId.trim())
    .run();

  const row = await db
    .prepare('SELECT * FROM favorite_images WHERE session_id = ? AND image_id = ?')
    .bind(body.sessionId.trim(), body.imageId.trim())
    .first();

  return json({ ok: true, item: rowToFavoriteImage(row) }, { status: 201 });
}

async function deleteFavoriteImage(request: Request, url: URL, db: any): Promise<Response> {
  const body = await readJson(request);
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : url.searchParams.get('sessionId');
  const imageId = typeof body?.imageId === 'string' ? body.imageId : url.searchParams.get('imageId');

  if (!sessionId || !sessionId.trim()) {
    return error('Favorite image sessionId is required.');
  }

  if (!imageId || !imageId.trim()) {
    return error('Favorite image imageId is required.');
  }

  await db
    .prepare('DELETE FROM favorite_images WHERE session_id = ? AND image_id = ?')
    .bind(sessionId.trim(), imageId.trim())
    .run();

  return json({ ok: true });
}

async function handleApi(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (url.pathname === '/api/status') {
    return json({
      ok: true,
      app: APP_NAME,
      message: API_MESSAGE,
      storage: env.DB ? 'd1' : 'not_configured'
    });
  }

  if (!url.pathname.startsWith('/api/')) {
    return null;
  }

  let db: any;

  try {
    db = ensureDb(env);
  } catch {
    return error('D1 database binding is not configured.', 503);
  }

  if (url.pathname === '/api/gallery') {
    if (request.method === 'GET') return listGallery(db);
    if (request.method === 'POST') return createGalleryImage(request, db);
  }

  const galleryImageMatch = url.pathname.match(/^\/api\/gallery\/([^/]+)$/);
  if (galleryImageMatch) {
    if (request.method === 'DELETE') {
      return deleteGalleryImage(db, decodeURIComponent(galleryImageMatch[1]));
    }
  }

  const galleryLabelsMatch = url.pathname.match(/^\/api\/gallery\/([^/]+)\/labels$/);
  if (galleryLabelsMatch) {
    if (request.method === 'PUT' || request.method === 'PATCH') {
      return updateGalleryImageLabels(request, db, decodeURIComponent(galleryLabelsMatch[1]));
    }
  }

  const galleryAttributesMatch = url.pathname.match(/^\/api\/gallery\/([^/]+)\/attributes$/);
  if (galleryAttributesMatch) {
    if (request.method === 'PUT' || request.method === 'PATCH') {
      return updateGalleryImageAttributes(request, db, decodeURIComponent(galleryAttributesMatch[1]));
    }
  }

  if (url.pathname === '/api/quiz-responses') {
    if (request.method === 'GET') return listQuizResponses(url, db);
    if (request.method === 'POST') return createQuizResponse(request, db);
  }

  if (url.pathname === '/api/user-photos') {
    if (request.method === 'GET') return listUserPhotos(url, db);
    if (request.method === 'POST') return createUserPhoto(request, db);
  }

  if (url.pathname === '/api/favorites') {
    if (request.method === 'GET') return listFavoriteImages(url, db);
    if (request.method === 'POST') return createFavoriteImage(request, db);
    if (request.method === 'DELETE') return deleteFavoriteImage(request, url, db);
  }

  return error('API route not found.', 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const apiResponse = await handleApi(request, env, url);

    if (apiResponse) {
      return apiResponse;
    }

    if (url.pathname === '/admin' || url.pathname === '/admin/') {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = '/index.html';
      return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    }

    return env.ASSETS.fetch(request);
  }
};
