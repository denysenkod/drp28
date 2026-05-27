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

function rowToGalleryImage(row: any): Record<string, unknown> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    features: decodeJson(row.features_json, []),
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
  const features = parseList(body.features);

  await db
    .prepare(
      `INSERT INTO gallery_images (id, title, description, image_url, features_json)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, body.title.trim(), description, imageUrl, JSON.stringify(features))
    .run();

  const row = await db
    .prepare('SELECT * FROM gallery_images WHERE id = ?')
    .bind(id)
    .first();

  return json({ ok: true, item: rowToGalleryImage(row) }, { status: 201 });
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

  if (url.pathname === '/api/quiz-responses') {
    if (request.method === 'GET') return listQuizResponses(url, db);
    if (request.method === 'POST') return createQuizResponse(request, db);
  }

  if (url.pathname === '/api/user-photos') {
    if (request.method === 'GET') return listUserPhotos(url, db);
    if (request.method === 'POST') return createUserPhoto(request, db);
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

    return env.ASSETS.fetch(request);
  }
};
