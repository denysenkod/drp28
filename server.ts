const APP_NAME = 'DRP28';
const API_MESSAGE = 'Backend is running on Cloudflare Workers.';
const DEFAULT_TRY_ON_GENERATION_LIMIT = 5;

interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  DB?: any;
  OPENAI_API_KEY?: string;
  TRY_ON_GENERATION_LIMIT?: string;
  PINTEREST_CLIENT_ID?: string;
  PINTEREST_CLIENT_SECRET?: string;
  PINTEREST_REDIRECT_URI?: string;
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

function readCookies(request: Request): any {
  const header = request.headers.get('cookie') || '';
  const cookies: any = {};

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

function cookieSuffix(request: Request, maxAge: any): string {
  const url = new URL(request.url);
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${url.protocol === 'https:' ? '; Secure' : ''}`;
}

function clearCookie(name: string, request: Request): string {
  return `${name}=; ${cookieSuffix(request, 0)}`;
}

function pinterestConfigured(env: Env): any {
  return Boolean(env.PINTEREST_CLIENT_ID && env.PINTEREST_CLIENT_SECRET);
}

function pinterestRedirectUri(request: Request, env: Env): string {
  if (env.PINTEREST_REDIRECT_URI) return env.PINTEREST_REDIRECT_URI;
  const url = new URL(request.url);
  url.pathname = '/api/pinterest/auth/callback';
  url.search = '';
  return url.toString();
}

function ensureDb(env: Env): any {
  if (!env.DB) {
    throw new Error('D1 database binding is not configured.');
  }

  return env.DB;
}

function tryOnGenerationLimit(env: Env) {
  const configured = Number(env.TRY_ON_GENERATION_LIMIT);
  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_TRY_ON_GENERATION_LIMIT;
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

function imageExtensionFromType(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('webp')) return 'webp';
  if (normalized.includes('gif')) return 'gif';
  return 'jpg';
}

function dataUrlToBlob(value: string) {
  const match = /^data:([^;,]+);base64,(.+)$/i.exec(value.trim());
  if (!match) {
    throw new Error('Invalid image data URL.');
  }

  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: match[1] });
}

async function imageBlobFromInput(value: string, label: string) {
  const source = value.trim();
  if (!source) {
    throw new Error(`${label} image is required.`);
  }

  if (source.startsWith('data:')) {
    return dataUrlToBlob(source);
  }

  const url = new URL(source);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`${label} image URL must be HTTP or HTTPS.`);
  }

  const response = await fetch(url.toString(), {
    headers: { accept: 'image/*' }
  });
  if (!response.ok) {
    throw new Error(`Could not fetch ${label.toLowerCase()} image.`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('image/')) {
    throw new Error(`${label} URL did not return an image.`);
  }

  return response.blob();
}

function tryOnPrompt(styleName: unknown): string {
  const name = typeof styleName === 'string' && styleName.trim() ? styleName.trim() : 'the reference haircut';
  return [
    'Edit the first image, which is the user selfie. Use the second image only as the hairstyle reference.',
    `Apply ${name} from the reference to the user as a realistic salon try-on.`,
    'Change only the hair: haircut silhouette, length, layers, fringe, texture, volume, parting, hairline styling, and visible hair color where necessary to match the reference.',
    'Preserve the user identity exactly. Do not change face shape, facial features, skin tone, expression, age, body, pose, clothing, background, lighting, camera angle, or image composition.',
    'Keep the result photorealistic and honest, as if the user genuinely had this haircut today.'
  ].join(' ');
}

async function getTryOnUsage(url: URL, db: any, limit: any): Promise<Response> {
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId || !sessionId.trim()) {
    return error('Try-on sessionId is required.');
  }

  const usageRow = await db
    .prepare('SELECT COUNT(*) AS count FROM try_on_generations WHERE session_id = ?')
    .bind(sessionId.trim())
    .first();
  const used = Number(usageRow?.count || 0);

  return json({
    ok: true,
    limit,
    used,
    remaining: Math.max(0, limit - used)
  });
}

async function createTryOnImage(request: Request, env: Env): Promise<Response> {
  if (!env.OPENAI_API_KEY) {
    return error('OpenAI API key is not configured.', 503);
  }

  const body = await readJson(request);
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';
  const userImage = typeof body?.userImageData === 'string' ? body.userImageData : '';
  const referenceImage = typeof body?.referenceImageData === 'string'
    ? body.referenceImageData
    : typeof body?.referenceImageUrl === 'string'
      ? body.referenceImageUrl
      : '';

  if (!sessionId) {
    return error('Try-on sessionId is required.');
  }

  if (!env.DB) {
    return error('D1 database binding is not configured.', 503);
  }

  const usageRow = await env.DB
    .prepare('SELECT COUNT(*) AS count FROM try_on_generations WHERE session_id = ?')
    .bind(sessionId)
    .first();
  const used = Number(usageRow?.count || 0);
  const limit = tryOnGenerationLimit(env);

  if (used >= limit) {
    return json({
      ok: false,
      error: `Try-on generation limit reached. You have used all ${limit} generations.`,
      limit,
      used,
      remaining: 0
    }, { status: 429 });
  }

  if (!userImage.trim()) {
    return error('A selfie image is required.');
  }

  if (!referenceImage.trim()) {
    return error('A reference hairstyle image is required.');
  }

  let userBlob;
  let referenceBlob;

  try {
    [userBlob, referenceBlob] = await Promise.all([
      imageBlobFromInput(userImage, 'Selfie'),
      imageBlobFromInput(referenceImage, 'Reference')
    ]);
  } catch (err) {
    return error(err instanceof Error ? err.message : 'Invalid try-on images.');
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
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: form
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof data?.error?.message === 'string'
      ? data.error.message
      : 'Try-on generation failed.';
    return error(message, response.status);
  }

  const b64 = data?.data?.[0]?.b64_json;
  if (typeof b64 !== 'string' || !b64) {
    return error('Try-on generation did not return an image.', 502);
  }

  await env.DB
    .prepare(
      `INSERT INTO try_on_generations (id, session_id, style_id, model)
       VALUES (?, ?, ?, ?)`
    )
    .bind(crypto.randomUUID(), sessionId, typeof body?.styleId === 'string' ? body.styleId.trim() : '', 'gpt-image-2')
    .run();

  return json({
    ok: true,
    model: 'gpt-image-2',
    limit,
    used: used + 1,
    remaining: Math.max(0, limit - used - 1),
    imageData: `data:image/png;base64,${b64}`
  });
}

function rowToBriefFeedback(row: any): Record<string, unknown> {
  return {
    id: row.id,
    briefId: row.brief_id,
    itemId: row.item_id || null,
    author: row.author,
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
    note: row.note || '',
    createdAt: row.created_at
  };
}

function rowToStyleBrief(row: any, feedback: any = []): Record<string, unknown> {
  return {
    id: row.id,
    sessionId: row.session_id,
    items: decodeJson(row.items_json, []),
    details: decodeJson(row.details_json, {}),
    feedback: feedback.map(rowToBriefFeedback),
    createdAt: row.created_at,
    updatedAt: row.updated_at
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

// Upsert a single draft/snapshot by id. Sessions may own multiple completed
// briefs; the client starts a new id after each completed share so feedback
// threads and share links stay separate.
async function saveBrief(request: Request, db: any): Promise<Response> {
  const body = await readJson(request);

  if (!body || typeof body.sessionId !== 'string' || !body.sessionId.trim()) {
    return error('Style brief sessionId is required.');
  }

  if (!Array.isArray(body.items)) {
    return error('Style brief items must be an array.');
  }

  const sessionId = body.sessionId.trim();
  const itemsJson = JSON.stringify(body.items);
  const detailsJson = JSON.stringify(parseRecord(body.details));
  const requestedId = typeof body.id === 'string' ? body.id.trim() : '';
  const id = requestedId || crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO style_briefs (id, session_id, items_json, details_json, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         items_json = excluded.items_json,
         details_json = excluded.details_json,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(id, sessionId, itemsJson, detailsJson)
    .run();

  const row = await db
    .prepare('SELECT * FROM style_briefs WHERE id = ?')
    .bind(id)
    .first();

  const feedback = await db
    .prepare('SELECT * FROM brief_feedback WHERE brief_id = ? ORDER BY created_at ASC')
    .bind(id)
    .all();

  return json({ ok: true, item: rowToStyleBrief(row, feedback.results || []) }, { status: 201 });
}

async function listBriefs(url: URL, db: any): Promise<Response> {
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId || !sessionId.trim()) {
    return error('Style brief sessionId is required.');
  }

  const { results } = await db
    .prepare('SELECT * FROM style_briefs WHERE session_id = ? ORDER BY updated_at DESC')
    .bind(sessionId.trim())
    .all();

  const items = [];
  for (const row of results || []) {
    const feedback = await db
      .prepare('SELECT * FROM brief_feedback WHERE brief_id = ? ORDER BY created_at ASC')
      .bind(row.id)
      .all();
    items.push(rowToStyleBrief(row, feedback.results || []));
  }

  return json({ ok: true, items });
}

// Public read of a shared brief: returns the owner's items plus any reviewer
// feedback. Used both by the owner (to confirm a share) and by reviewers.
async function getBrief(db: any, id: string): Promise<Response> {
  const row = await db
    .prepare('SELECT * FROM style_briefs WHERE id = ?')
    .bind(id)
    .first();

  if (!row) {
    return error('Style brief not found.', 404);
  }

  const { results } = await db
    .prepare('SELECT * FROM brief_feedback WHERE brief_id = ? ORDER BY created_at ASC')
    .bind(id)
    .all();

  return json({ ok: true, item: rowToStyleBrief(row, results || []) });
}

// A reviewer appends feedback to a shared brief. Stored in its own table so the
// owner's auto-save never overwrites it. Feedback needs a note, a rating, or both.
async function addBriefFeedback(request: Request, db: any, id: string): Promise<Response> {
  const brief = await db
    .prepare('SELECT id FROM style_briefs WHERE id = ?')
    .bind(id)
    .first();

  if (!brief) {
    return error('Style brief not found.', 404);
  }

  const body = await readJson(request);
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  const hasRating = body && body.rating !== null && body.rating !== undefined && body.rating !== '';
  const rating = hasRating ? Math.max(0, Math.min(5, Math.round(Number(body.rating) || 0))) : null;

  if (!note && rating === null) {
    return error('Feedback needs a note or a rating.');
  }

  const author = typeof body?.author === 'string' && body.author.trim()
    ? body.author.trim().slice(0, 80)
    : 'Reviewer';
  const itemId = typeof body?.itemId === 'string' && body.itemId.trim() ? body.itemId.trim() : null;
  const feedbackId = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO brief_feedback (id, brief_id, item_id, author, rating, note)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(feedbackId, id, itemId, author, rating, note)
    .run();

  const row = await db
    .prepare('SELECT * FROM brief_feedback WHERE id = ?')
    .bind(feedbackId)
    .first();

  return json({ ok: true, item: rowToBriefFeedback(row) }, { status: 201 });
}

// A reviewer edits a piece of feedback they previously left. Like creation,
// the result must still carry a note, a rating, or both.
async function updateBriefFeedback(request: Request, db: any, id: string, feedbackId: string): Promise<Response> {
  const existing = await db
    .prepare('SELECT * FROM brief_feedback WHERE id = ? AND brief_id = ?')
    .bind(feedbackId, id)
    .first();

  if (!existing) {
    return error('Feedback not found.', 404);
  }

  const body = await readJson(request);
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  const hasRating = body && body.rating !== null && body.rating !== undefined && body.rating !== '';
  const rating = hasRating ? Math.max(0, Math.min(5, Math.round(Number(body.rating) || 0))) : null;

  if (!note && rating === null) {
    return error('Feedback needs a note or a rating.');
  }

  const author = typeof body?.author === 'string' && body.author.trim()
    ? body.author.trim().slice(0, 80)
    : existing.author || 'Reviewer';

  await db
    .prepare('UPDATE brief_feedback SET author = ?, rating = ?, note = ? WHERE id = ?')
    .bind(author, rating, note, feedbackId)
    .run();

  const row = await db
    .prepare('SELECT * FROM brief_feedback WHERE id = ?')
    .bind(feedbackId)
    .first();

  return json({ ok: true, item: rowToBriefFeedback(row) });
}

// A reviewer removes a piece of feedback they previously left.
async function deleteBriefFeedback(db: any, id: string, feedbackId: string): Promise<Response> {
  const existing = await db
    .prepare('SELECT id FROM brief_feedback WHERE id = ? AND brief_id = ?')
    .bind(feedbackId, id)
    .first();

  if (!existing) {
    return error('Feedback not found.', 404);
  }

  await db
    .prepare('DELETE FROM brief_feedback WHERE id = ?')
    .bind(feedbackId)
    .run();

  return json({ ok: true, id: feedbackId });
}

function pinterestAuthStart(request: Request, env: Env): Response {
  if (!pinterestConfigured(env)) {
    return error('Pinterest credentials are not configured.', 503);
  }

  const state = crypto.randomUUID();
  const authUrl = new URL('https://www.pinterest.com/oauth/');
  authUrl.searchParams.set('client_id', env.PINTEREST_CLIENT_ID || '');
  authUrl.searchParams.set('redirect_uri', pinterestRedirectUri(request, env));
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'boards:read,pins:read');
  authUrl.searchParams.set('state', state);

  return json(
    { ok: true, authUrl: authUrl.toString() },
    { headers: { 'set-cookie': `pinterest_oauth_state=${encodeURIComponent(state)}; ${cookieSuffix(request, 600)}` } }
  );
}

async function pinterestTokenRequest(request: Request, env: Env, params: any): Promise<any> {
  const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: {
      authorization: `Basic ${btoa(`${env.PINTEREST_CLIENT_ID}:${env.PINTEREST_CLIENT_SECRET}`)}`,
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof data?.message === 'string'
      ? data.message
      : typeof data?.error_description === 'string'
        ? data.error_description
        : 'Pinterest authorization failed.';
    throw new Error(message);
  }

  return data;
}

function pinterestCallbackHtml(request: Request, ok: any, message: string): Response {
  const origin = new URL(request.url).origin;
  const payload = JSON.stringify({ type: 'pinterest-auth', ok, message });

  return new Response(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Pinterest</title></head>
<body>
<script>
window.opener && window.opener.postMessage(${payload}, ${JSON.stringify(origin)});
window.close();
</script>
</body>
</html>`, {
    status: ok ? 200 : 400,
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}

async function pinterestAuthCallback(request: Request, env: Env, url: URL): Promise<Response> {
  if (!pinterestConfigured(env)) {
    return pinterestCallbackHtml(request, false, 'Pinterest credentials are not configured.');
  }

  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  const cookies = readCookies(request);

  if (!code || !state || state !== cookies.pinterest_oauth_state) {
    return pinterestCallbackHtml(request, false, 'Pinterest authorization could not be verified.');
  }

  try {
    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('redirect_uri', pinterestRedirectUri(request, env));

    const data = await pinterestTokenRequest(request, env, params);
    const accessToken = typeof data?.access_token === 'string' ? data.access_token : '';
    const refreshToken = typeof data?.refresh_token === 'string' ? data.refresh_token : '';
    const expiresIn = Math.max(60, Math.min(Number(data?.expires_in || 2592000), 2592000));

    if (!accessToken) {
      return pinterestCallbackHtml(request, false, 'Pinterest did not return an access token.');
    }

    const headers = new Headers({ 'content-type': 'text/html; charset=utf-8' });
    headers.append('set-cookie', `pinterest_access_token=${encodeURIComponent(accessToken)}; ${cookieSuffix(request, expiresIn)}`);
    if (refreshToken) {
      headers.append('set-cookie', `pinterest_refresh_token=${encodeURIComponent(refreshToken)}; ${cookieSuffix(request, 5184000)}`);
    }
    headers.append('set-cookie', clearCookie('pinterest_oauth_state', request));

    const html = await pinterestCallbackHtml(request, true, 'Pinterest connected.').text();
    return new Response(html, { status: 200, headers });
  } catch (err) {
    return pinterestCallbackHtml(request, false, err instanceof Error ? err.message : 'Pinterest authorization failed.');
  }
}

async function pinterestAccessToken(request: Request): Promise<any> {
  const cookies = readCookies(request);
  return typeof cookies.pinterest_access_token === 'string' ? cookies.pinterest_access_token : '';
}

async function pinterestApi(request: Request, path: string, params: any = {}): Promise<Response> {
  const accessToken = await pinterestAccessToken(request);
  if (!accessToken) {
    return error('Pinterest is not connected.', 401);
  }

  const apiUrl = new URL(`https://api.pinterest.com/v5${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && String(value).trim()) {
      apiUrl.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(apiUrl.toString(), {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json'
    }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof data?.message === 'string'
      ? data.message
      : response.status === 401
        ? 'Pinterest authorization expired. Please connect again.'
        : 'Pinterest request failed.';
    return error(message, response.status);
  }

  return json({ ok: true, ...data });
}

function pinterestStatus(request: Request, env: Env): Response {
  const cookies = readCookies(request);
  return json({
    ok: true,
    configured: pinterestConfigured(env),
    connected: Boolean(cookies.pinterest_access_token)
  });
}

function pinterestLogout(request: Request): Response {
  const headers = new Headers();
  headers.append('set-cookie', clearCookie('pinterest_access_token', request));
  headers.append('set-cookie', clearCookie('pinterest_refresh_token', request));
  headers.append('set-cookie', clearCookie('pinterest_oauth_state', request));
  return json({ ok: true }, { headers });
}

function extractPinterestImageUrl(media: any): string {
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

function normalizePinterestBoard(board: any): Record<string, unknown> {
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

function normalizePinterestPin(pin: any): Record<string, unknown> {
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

async function listPinterestBoards(request: Request, url: URL): Promise<Response> {
  const pageSize = Math.max(1, Math.min(Number(url.searchParams.get('page_size') || 50), 100));
  const response = await pinterestApi(request, '/boards', {
    page_size: pageSize,
    bookmark: url.searchParams.get('bookmark') || ''
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return json(data, { status: response.status });

  return json({
    ok: true,
    items: Array.isArray(data.items) ? data.items.map(normalizePinterestBoard) : [],
    bookmark: data.bookmark || null
  });
}

async function listPinterestPins(request: Request, url: URL, boardId: string): Promise<Response> {
  const pageSize = Math.max(1, Math.min(Number(url.searchParams.get('page_size') || 50), 100));
  const response = await pinterestApi(request, `/boards/${encodeURIComponent(boardId)}/pins`, {
    page_size: pageSize,
    bookmark: url.searchParams.get('bookmark') || ''
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return json(data, { status: response.status });

  return json({
    ok: true,
    items: Array.isArray(data.items) ? data.items.map(normalizePinterestPin).filter((pin: any) => pin.imageUrl) : [],
    bookmark: data.bookmark || null
  });
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

  if (url.pathname === '/api/try-on') {
    if (request.method === 'POST') return createTryOnImage(request, env);
  }

  if (url.pathname === '/api/pinterest/status') {
    if (request.method === 'GET') return pinterestStatus(request, env);
  }

  if (url.pathname === '/api/pinterest/auth/start') {
    if (request.method === 'GET') return pinterestAuthStart(request, env);
  }

  if (url.pathname === '/api/pinterest/auth/callback') {
    if (request.method === 'GET') return pinterestAuthCallback(request, env, url);
  }

  if (url.pathname === '/api/pinterest/logout') {
    if (request.method === 'POST') return pinterestLogout(request);
  }

  if (url.pathname === '/api/pinterest/boards') {
    if (request.method === 'GET') return listPinterestBoards(request, url);
  }

  const pinterestPinsMatch = url.pathname.match(/^\/api\/pinterest\/boards\/([^/]+)\/pins$/);
  if (pinterestPinsMatch) {
    if (request.method === 'GET') {
      return listPinterestPins(request, url, decodeURIComponent(pinterestPinsMatch[1]));
    }
  }

  let db: any;

  try {
    db = ensureDb(env);
  } catch {
    return error('D1 database binding is not configured.', 503);
  }

  if (url.pathname === '/api/try-on/usage') {
    if (request.method === 'GET') return getTryOnUsage(url, db, tryOnGenerationLimit(env));
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

  if (url.pathname === '/api/briefs') {
    if (request.method === 'GET') return listBriefs(url, db);
    if (request.method === 'POST') return saveBrief(request, db);
  }

  const briefFeedbackMatch = url.pathname.match(/^\/api\/briefs\/([^/]+)\/feedback$/);
  if (briefFeedbackMatch) {
    if (request.method === 'POST') {
      return addBriefFeedback(request, db, decodeURIComponent(briefFeedbackMatch[1]));
    }
  }

  const briefFeedbackItemMatch = url.pathname.match(/^\/api\/briefs\/([^/]+)\/feedback\/([^/]+)$/);
  if (briefFeedbackItemMatch) {
    const briefId = decodeURIComponent(briefFeedbackItemMatch[1]);
    const feedbackId = decodeURIComponent(briefFeedbackItemMatch[2]);
    if (request.method === 'PUT' || request.method === 'PATCH') {
      return updateBriefFeedback(request, db, briefId, feedbackId);
    }
    if (request.method === 'DELETE') {
      return deleteBriefFeedback(db, briefId, feedbackId);
    }
  }

  const briefMatch = url.pathname.match(/^\/api\/briefs\/([^/]+)$/);
  if (briefMatch) {
    if (request.method === 'GET') return getBrief(db, decodeURIComponent(briefMatch[1]));
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
