const APP_NAME = 'DRP28';
const API_MESSAGE = 'Backend is running on Cloudflare Workers.';
const TRY_ON_GENERATION_LIMIT = 5;

interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  DB?: any;
  OPENAI_API_KEY?: string;
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

  if (used >= TRY_ON_GENERATION_LIMIT) {
    return json({
      ok: false,
      error: `Try-on generation limit reached. You have used all ${TRY_ON_GENERATION_LIMIT} generations.`,
      limit: TRY_ON_GENERATION_LIMIT,
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
    limit: TRY_ON_GENERATION_LIMIT,
    used: used + 1,
    remaining: Math.max(0, TRY_ON_GENERATION_LIMIT - used - 1),
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

// Upsert the owner's brief keyed by their session. The brief id is a stable
// share token: a brand-new id is only used the first time a session saves; on
// later saves the ON CONFLICT branch keeps the existing id so the share link
// never changes.
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
       ON CONFLICT(session_id) DO UPDATE SET
         items_json = excluded.items_json,
         details_json = excluded.details_json,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(id, sessionId, itemsJson, detailsJson)
    .run();

  const row = await db
    .prepare('SELECT * FROM style_briefs WHERE session_id = ?')
    .bind(sessionId)
    .first();

  return json({ ok: true, item: rowToStyleBrief(row) }, { status: 201 });
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

  if (url.pathname === '/api/briefs') {
    if (request.method === 'POST') return saveBrief(request, db);
  }

  const briefFeedbackMatch = url.pathname.match(/^\/api\/briefs\/([^/]+)\/feedback$/);
  if (briefFeedbackMatch) {
    if (request.method === 'POST') {
      return addBriefFeedback(request, db, decodeURIComponent(briefFeedbackMatch[1]));
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
