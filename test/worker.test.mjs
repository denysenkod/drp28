import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const FRONTEND_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function frontendUrl(path) {
  return new URL(`../frontend/${path.replace(/^\/+/, '')}`, import.meta.url);
}

async function readFrontendText(path) {
  return readFile(frontendUrl(path), 'utf8');
}

async function readFrontendSources() {
  const [app, styles, jsManifestRaw, cssManifestRaw] = await Promise.all([
    readFrontendText('app.js'),
    readFrontendText('styles.css'),
    readFrontendText('js/manifest.json'),
    readFrontendText('css/manifest.json')
  ]);
  const jsManifest = JSON.parse(jsManifestRaw);
  const cssManifest = JSON.parse(cssManifestRaw);
  const [jsFiles, cssFiles] = await Promise.all([
    Promise.all(jsManifest.map((item) => readFrontendText(item.file))),
    Promise.all(cssManifest.map((item) => readFrontendText(item.file)))
  ]);

  return {
    app: [app, ...jsFiles].join('\n'),
    styles: [styles, ...cssFiles].join('\n')
  };
}

function frontendContentType(path) {
  const match = /\.[^.]+$/.exec(path);
  return FRONTEND_TYPES[match?.[0]] || 'text/plain; charset=utf-8';
}

async function loadWorker() {
  if (!globalThis.crypto) {
    globalThis.crypto = { randomUUID };
  }

  const source = await readFile(new URL('../server.ts', import.meta.url), 'utf8');
  const javascript = source
    .replace(/interface Env \{[\s\S]*?\n\}/, '')
    .replaceAll(': unknown', '')
    .replaceAll(': ResponseInit', '')
    .replaceAll(': string[]', '')
    .replaceAll(': string', '')
    .replaceAll(': any', '')
    .replaceAll(': Env', '')
    .replaceAll(': Request', '')
    .replaceAll(': URL', '')
    .replaceAll(': Record<string, unknown>', '')
    .replaceAll(': Promise<any>', '')
    .replaceAll(': Promise<Response | null>', '')
    .replaceAll(': Promise<Response>', '')
    .replaceAll(' as Record<string, unknown>', '')
    .replace('env: Env', 'env')
    .replace('request: Request', 'request')
    .replaceAll('): Response', ')')
    .replace('): Promise<Response>', ')');
  const moduleUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(javascript)}`;

  return import(moduleUrl);
}

function createMockD1() {
  const tables = {
    gallery_images: [],
    quiz_responses: [],
    user_photos: [],
    favorite_images: [],
    try_on_generations: [],
    style_briefs: [],
    brief_feedback: []
  };

  const clone = (row) => row ? { ...row } : null;
  const now = () => new Date().toISOString();
  const orderByCreatedAt = (rows) => [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return {
    prepare(sql) {
      let values = [];

      return {
        bind(...nextValues) {
          values = nextValues;
          return this;
        },
        async run() {
          if (sql.includes('INSERT INTO gallery_images')) {
            tables.gallery_images.push({
              id: values[0],
              title: values[1],
              description: values[2],
              image_url: values[3],
              gender: values[4],
              length: values[5],
              hair_type: values[6],
              upkeep: values[7],
              features_json: values[8],
              labels_json: values[9],
              created_at: now()
            });
          }

          if (sql.includes('INSERT INTO quiz_responses')) {
            tables.quiz_responses.push({
              id: values[0],
              session_id: values[1],
              answers_json: values[2],
              created_at: now()
            });
          }

          if (sql.includes('INSERT INTO user_photos')) {
            tables.user_photos.push({
              id: values[0],
              session_id: values[1],
              label: values[2],
              image_data: values[3],
              description: values[4],
              features_json: values[5],
              created_at: now()
            });
          }

          if (sql.includes('INSERT OR IGNORE INTO favorite_images')) {
            const exists = tables.favorite_images.some(
              (row) => row.session_id === values[0] && row.image_id === values[1]
            );
            if (!exists) {
              tables.favorite_images.push({
                session_id: values[0],
                image_id: values[1],
                created_at: now()
              });
            }
          }

          if (sql.includes('INSERT INTO try_on_generations')) {
            tables.try_on_generations.push({
              id: values[0],
              session_id: values[1],
              style_id: values[2],
              model: values[3],
              created_at: now()
            });
          }

          if (sql.includes('DELETE FROM favorite_images WHERE image_id = ?')) {
            tables.favorite_images = tables.favorite_images.filter(
              (row) => row.image_id !== values[0]
            );
          }

          if (sql.includes('DELETE FROM favorite_images WHERE session_id = ? AND image_id = ?')) {
            tables.favorite_images = tables.favorite_images.filter(
              (row) => row.session_id !== values[0] || row.image_id !== values[1]
            );
          }

          if (sql.includes('INSERT INTO style_briefs')) {
            const existing = tables.style_briefs.find((row) => row.id === values[0]);
            if (existing) {
              existing.items_json = values[2];
              existing.details_json = values[3];
              existing.updated_at = now();
            } else {
              tables.style_briefs.push({
                id: values[0],
                session_id: values[1],
                items_json: values[2],
                details_json: values[3],
                created_at: now(),
                updated_at: now()
              });
            }
          }

          if (sql.includes('INSERT INTO brief_feedback')) {
            tables.brief_feedback.push({
              id: values[0],
              brief_id: values[1],
              item_id: values[2],
              author: values[3],
              rating: values[4],
              note: values[5],
              created_at: now()
            });
          }

          if (sql.includes('UPDATE brief_feedback SET author = ?, rating = ?, note = ? WHERE id = ?')) {
            const row = tables.brief_feedback.find((item) => item.id === values[3]);
            if (row) {
              row.author = values[0];
              row.rating = values[1];
              row.note = values[2];
            }
          }

          if (sql.includes('DELETE FROM brief_feedback WHERE id = ?')) {
            tables.brief_feedback = tables.brief_feedback.filter((row) => row.id !== values[0]);
          }

          if (sql.includes('DELETE FROM gallery_images WHERE id = ?')) {
            tables.gallery_images = tables.gallery_images.filter((row) => row.id !== values[0]);
          }

          if (sql.includes('UPDATE gallery_images SET labels_json = ? WHERE id = ?')) {
            const row = tables.gallery_images.find((item) => item.id === values[1]);
            if (row) row.labels_json = values[0];
          }

          if (sql.includes('SET gender = ?, length = ?, hair_type = ?, upkeep = ?')) {
            const row = tables.gallery_images.find((item) => item.id === values[4]);
            if (row) {
              row.gender = values[0];
              row.length = values[1];
              row.hair_type = values[2];
              row.upkeep = values[3];
            }
          }

          return { success: true };
        },
        async first() {
          if (sql.includes('FROM gallery_images WHERE id = ?')) {
            return clone(tables.gallery_images.find((row) => row.id === values[0]));
          }

          if (sql.includes('FROM quiz_responses WHERE id = ?')) {
            return clone(tables.quiz_responses.find((row) => row.id === values[0]));
          }

          if (sql.includes('FROM user_photos WHERE id = ?')) {
            return clone(tables.user_photos.find((row) => row.id === values[0]));
          }

          if (sql.includes('FROM favorite_images WHERE session_id = ? AND image_id = ?')) {
            return clone(tables.favorite_images.find(
              (row) => row.session_id === values[0] && row.image_id === values[1]
            ));
          }

          if (sql.includes('COUNT(*) AS count FROM try_on_generations WHERE session_id = ?')) {
            return {
              count: tables.try_on_generations.filter((row) => row.session_id === values[0]).length
            };
          }

          if (sql.includes('FROM style_briefs WHERE session_id = ?')) {
            return clone(tables.style_briefs.find((row) => row.session_id === values[0]));
          }

          if (sql.includes('FROM style_briefs WHERE id = ?')) {
            return clone(tables.style_briefs.find((row) => row.id === values[0]));
          }

          if (sql.includes('FROM brief_feedback WHERE id = ?')) {
            return clone(tables.brief_feedback.find((row) => row.id === values[0]));
          }

          return null;
        },
        async all() {
          if (sql.includes('FROM gallery_images')) {
            return { results: orderByCreatedAt(tables.gallery_images).map(clone) };
          }

          if (sql.includes('FROM quiz_responses WHERE session_id = ?')) {
            return {
              results: orderByCreatedAt(tables.quiz_responses)
                .filter((row) => row.session_id === values[0])
                .map(clone)
            };
          }

          if (sql.includes('FROM quiz_responses')) {
            return { results: orderByCreatedAt(tables.quiz_responses).map(clone) };
          }

          if (sql.includes('FROM user_photos WHERE session_id = ?')) {
            return {
              results: orderByCreatedAt(tables.user_photos)
                .filter((row) => row.session_id === values[0])
                .map(clone)
            };
          }

          if (sql.includes('FROM user_photos')) {
            return { results: orderByCreatedAt(tables.user_photos).map(clone) };
          }

          if (sql.includes('FROM favorite_images WHERE session_id = ?')) {
            return {
              results: orderByCreatedAt(tables.favorite_images)
                .filter((row) => row.session_id === values[0])
                .map(clone)
            };
          }

          if (sql.includes('FROM style_briefs WHERE session_id = ?')) {
            return {
              results: orderByCreatedAt(tables.style_briefs)
                .filter((row) => row.session_id === values[0])
                .map(clone)
            };
          }

          if (sql.includes('FROM brief_feedback WHERE brief_id = ?')) {
            return {
              results: tables.brief_feedback
                .filter((row) => row.brief_id === values[0])
                .sort((a, b) => a.created_at.localeCompare(b.created_at))
                .map(clone)
            };
          }

          return { results: [] };
        }
      };
    }
  };
}

async function createAssetEnv() {
  const assetPaths = [
    'index.html',
    'app.js',
    'styles.css'
  ];
  const [jsManifestRaw, cssManifestRaw] = await Promise.all([
    readFrontendText('js/manifest.json'),
    readFrontendText('css/manifest.json')
  ]);

  for (const item of JSON.parse(jsManifestRaw)) assetPaths.push(item.file);
  for (const item of JSON.parse(cssManifestRaw)) assetPaths.push(item.file);

  const assets = new Map();
  await Promise.all(assetPaths.map(async (assetPath) => {
    const normalized = assetPath.replace(/^\/+/, '');
    assets.set(normalized, await readFrontendText(normalized));
  }));

  return {
    DB: createMockD1(),
    ASSETS: {
      async fetch(request) {
        const pathname = new URL(request.url).pathname;
        const assetPath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');

        if (assets.has(assetPath)) {
          return new Response(assets.get(assetPath), {
            headers: { 'content-type': frontendContentType(assetPath) }
          });
        }

        return new Response('Not found', {
          status: 404,
          headers: { 'content-type': 'text/plain; charset=utf-8' }
        });
      }
    }
  };
}

test('serves the frontend on the root route', async () => {
  const { default: worker } = await loadWorker();
  const response = await worker.fetch(new Request('https://example.com/'), await createAssetEnv());
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.match(body, /id="results-grid"/);
  assert.match(body, /src="\/app\.js(?:\?v=[^"]+)?"/);
  assert.match(body, /href="\/styles\.css(?:\?v=[^"]+)?"/);
});

test('serves the admin route through the public frontend shell', async () => {
  const { default: worker } = await loadWorker();
  const response = await worker.fetch(new Request('https://example.com/admin'), await createAssetEnv());
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.doesNotMatch(body, /id="admin-nav-link"/);
  assert.doesNotMatch(body, /id="topbar-admin-toggle"/);
  assert.doesNotMatch(body, /id="stealth-admin-toggle"/);
  assert.doesNotMatch(body, /stealth-admin-switch/);
});

test('serves backend status as JSON', async () => {
  const { default: worker } = await loadWorker();
  const response = await worker.fetch(new Request('https://example.com/api/status'), await createAssetEnv());
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.deepEqual(body, {
    ok: true,
    app: 'DRP28',
    message: 'Backend is running on Cloudflare Workers.',
    storage: 'd1'
  });
});

test('stores and lists gallery images in D1', async () => {
  const { default: worker } = await loadWorker();
  const env = await createAssetEnv();
  const createResponse = await worker.fetch(new Request('https://example.com/api/gallery', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Soft Curtain Bangs',
      description: 'Face-framing medium cut.',
      imageUrl: 'https://example.com/curtain.webp',
      gender: 'Women',
      length: 'Medium',
      hairType: 'Wavy Hair',
      maintenanceLevel: 'Low',
      features: ['medium', 'wavy'],
      labels: ['soft', 'fringe']
    })
  }), env);
  const created = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(created.item.title, 'Soft Curtain Bangs');
  assert.equal(created.item.gender, 'Women');
  assert.equal(created.item.length, 'Medium');
  assert.equal(created.item.hairType, 'Wavy Hair');
  assert.equal(created.item.hairThickness, '');
  assert.equal(created.item.maintenanceLevel, 'Low');
  assert.deepEqual(created.item.analysis, {
    hairType: 'Wavy Hair',
    hairSubtype: '',
    hairThickness: '',
    length: 'Medium',
    faceShape: '',
    gender: 'Women',
    ethnicity: '',
    celebrity: 'none',
    upkeep: 'Low',
    haircutName: '',
    hairColour: '',
    vibe: '',
    maintenance: '',
    model: '',
    updatedAt: ''
  });
  assert.deepEqual(created.item.features, ['medium', 'wavy']);
  assert.deepEqual(created.item.labels, ['soft', 'fringe']);

  const listResponse = await worker.fetch(new Request('https://example.com/api/gallery'), env);
  const list = await listResponse.json();

  assert.equal(listResponse.status, 200);
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].id, created.item.id);
  assert.equal(list.items[0].gender, 'Women');
  assert.equal(list.items[0].length, 'Medium');
  assert.equal(list.items[0].hairType, 'Wavy Hair');
  assert.equal(list.items[0].maintenanceLevel, 'Low');
  assert.deepEqual(list.items[0].labels, ['soft', 'fringe']);
});

test('updates gallery image admin attributes in D1', async () => {
  const { default: worker } = await loadWorker();
  const env = await createAssetEnv();
  const createResponse = await worker.fetch(new Request('https://example.com/api/gallery', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Short Crop',
      imageUrl: 'https://example.com/crop.webp',
      gender: 'Men',
      features: ['crop'],
      labels: ['sharp']
    })
  }), env);
  const created = await createResponse.json();

  const updateResponse = await worker.fetch(new Request(`https://example.com/api/gallery/${created.item.id}/attributes`, {
    method: 'PUT',
    body: JSON.stringify({
      gender: 'Unisex',
      length: 'Short',
      hairType: 'Straight Hair',
      maintenanceLevel: 'High'
    })
  }), env);
  const updated = await updateResponse.json();

  assert.equal(updateResponse.status, 200);
  assert.equal(updated.item.gender, 'Unisex');
  assert.equal(updated.item.length, 'Short');
  assert.equal(updated.item.hairType, 'Straight Hair');
  assert.equal(updated.item.maintenanceLevel, 'High');
});

test('updates gallery image labels in D1', async () => {
  const { default: worker } = await loadWorker();
  const env = await createAssetEnv();
  const createResponse = await worker.fetch(new Request('https://example.com/api/gallery', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Modern Shag',
      imageUrl: 'https://example.com/shag.webp',
      gender: 'Women',
      features: ['shag'],
      labels: ['layered']
    })
  }), env);
  const created = await createResponse.json();

  const updateResponse = await worker.fetch(new Request(`https://example.com/api/gallery/${created.item.id}/labels`, {
    method: 'PUT',
    body: JSON.stringify({ labels: ['curly', 'low maintenance', 'curly'] })
  }), env);
  const updated = await updateResponse.json();

  assert.equal(updateResponse.status, 200);
  assert.deepEqual(updated.item.labels, ['curly', 'low maintenance']);
});

test('deletes gallery images and their favorites in D1', async () => {
  const { default: worker } = await loadWorker();
  const env = await createAssetEnv();
  const createResponse = await worker.fetch(new Request('https://example.com/api/gallery', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Textured Bob',
      imageUrl: 'https://example.com/bob.webp',
      gender: 'Women',
      features: ['bob'],
      labels: ['textured']
    })
  }), env);
  const created = await createResponse.json();

  await worker.fetch(new Request('https://example.com/api/favorites', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: 'session-1',
      imageId: created.item.id
    })
  }), env);

  const deleteResponse = await worker.fetch(new Request(`https://example.com/api/gallery/${created.item.id}`, {
    method: 'DELETE'
  }), env);

  assert.equal(deleteResponse.status, 200);

  const galleryResponse = await worker.fetch(new Request('https://example.com/api/gallery'), env);
  const gallery = await galleryResponse.json();

  assert.equal(gallery.items.length, 0);

  const favoritesResponse = await worker.fetch(new Request('https://example.com/api/favorites?sessionId=session-1'), env);
  const favorites = await favoritesResponse.json();

  assert.equal(favorites.items.length, 0);
});

test('stores quiz responses and user photos in D1', async () => {
  const { default: worker } = await loadWorker();
  const env = await createAssetEnv();

  const quizResponse = await worker.fetch(new Request('https://example.com/api/quiz-responses', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: 'session-1',
      answers: { length: 'medium', texture: 'wavy' }
    })
  }), env);
  const quiz = await quizResponse.json();

  assert.equal(quizResponse.status, 201);
  assert.deepEqual(quiz.item.answers, { length: 'medium', texture: 'wavy' });

  const photoResponse = await worker.fetch(new Request('https://example.com/api/user-photos', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: 'session-1',
      label: 'Front',
      imageData: 'data:image/webp;base64,abc123',
      description: 'Front reference photo',
      features: ['face-front', 'natural-light']
    })
  }), env);
  const photo = await photoResponse.json();

  assert.equal(photoResponse.status, 201);
  assert.equal(photo.item.label, 'Front');
  assert.deepEqual(photo.item.features, ['face-front', 'natural-light']);

  const listResponse = await worker.fetch(new Request('https://example.com/api/user-photos?sessionId=session-1'), env);
  const list = await listResponse.json();

  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].id, photo.item.id);
});

test('try-on route requires the OpenAI API key', async () => {
  const { default: worker } = await loadWorker();
  const env = await createAssetEnv();

  const response = await worker.fetch(new Request('https://example.com/api/try-on', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: 'session-1',
      styleName: 'Layered Haircut',
      userImageData: 'data:image/png;base64,aaa',
      referenceImageUrl: 'https://example.com/reference.png'
    })
  }), env);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error, 'OpenAI API key is not configured.');
});

test('try-on usage reports the configured generation limit for the session', async () => {
  const { default: worker } = await loadWorker();
  const env = { ...(await createAssetEnv()), TRY_ON_GENERATION_LIMIT: '7' };

  const response = await worker.fetch(new Request('https://example.com/api/try-on/usage?sessionId=session-usage'), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.limit, 7);
  assert.equal(body.used, 0);
  assert.equal(body.remaining, 7);
});

test('try-on route limits successful generations per session', async () => {
  const { default: worker } = await loadWorker();
  const env = { ...(await createAssetEnv()), OPENAI_API_KEY: 'test-key' };
  const originalFetch = globalThis.fetch;
  let openAiCalls = 0;

  globalThis.fetch = async (url) => {
    assert.equal(url, 'https://api.openai.com/v1/images/edits');
    openAiCalls += 1;
    return new Response(JSON.stringify({ data: [{ b64_json: 'generated-image' }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  };

  try {
    for (let index = 1; index <= 5; index += 1) {
      const response = await worker.fetch(new Request('https://example.com/api/try-on', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'session-limit',
          styleId: 'style-1',
          styleName: 'Layered Haircut',
          userImageData: 'data:image/png;base64,aaa',
          referenceImageData: 'data:image/png;base64,bbb'
        })
      }), env);
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.used, index);
      assert.equal(body.remaining, 5 - index);
      assert.equal(body.imageData, 'data:image/png;base64,generated-image');
    }

    const blocked = await worker.fetch(new Request('https://example.com/api/try-on', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'session-limit',
        styleId: 'style-1',
        styleName: 'Layered Haircut',
        userImageData: 'data:image/png;base64,aaa',
        referenceImageData: 'data:image/png;base64,bbb'
      })
    }), env);
    const blockedBody = await blocked.json();

    assert.equal(blocked.status, 429);
    assert.equal(blockedBody.used, 5);
    assert.equal(blockedBody.remaining, 0);
    assert.match(blockedBody.error, /all 5 generations/);
    assert.equal(openAiCalls, 5);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('stores and removes favorite images in D1', async () => {
  const { default: worker } = await loadWorker();
  const env = await createAssetEnv();

  const createResponse = await worker.fetch(new Request('https://example.com/api/favorites', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: 'session-1',
      imageId: 'curtain'
    })
  }), env);
  const created = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(created.item.sessionId, 'session-1');
  assert.equal(created.item.imageId, 'curtain');

  const listResponse = await worker.fetch(new Request('https://example.com/api/favorites?sessionId=session-1'), env);
  const list = await listResponse.json();

  assert.equal(listResponse.status, 200);
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].imageId, 'curtain');

  const deleteResponse = await worker.fetch(new Request('https://example.com/api/favorites', {
    method: 'DELETE',
    body: JSON.stringify({
      sessionId: 'session-1',
      imageId: 'curtain'
    })
  }), env);

  assert.equal(deleteResponse.status, 200);

  const emptyResponse = await worker.fetch(new Request('https://example.com/api/favorites?sessionId=session-1'), env);
  const empty = await emptyResponse.json();

  assert.equal(empty.items.length, 0);
});

test('saves a shareable brief, reads it back, and accepts reviewer feedback', async () => {
  const { default: worker } = await loadWorker();
  const env = await createAssetEnv();

  // Owner saves their brief.
  const saveResponse = await worker.fetch(new Request('https://example.com/api/briefs', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: 'session-owner',
      items: [
        { id: 'item-1', partition: 'me', imageUrl: 'data:image/webp;base64,aaa', rating: 4, annotation: 'current cut' },
        { id: 'item-2', partition: 'references', imageUrl: 'https://example.com/ref.webp', rating: 5, annotation: 'love this' }
      ],
      details: { colour: 'Platinum blonde', allergies: 'PPD', previousTreatments: 'box dye', damage: 'dry ends', notes: 'keep length' }
    })
  }), env);
  const saved = await saveResponse.json();

  assert.equal(saveResponse.status, 201);
  assert.equal(saved.item.sessionId, 'session-owner');
  assert.equal(saved.item.items.length, 2);
  assert.equal(saved.item.details.colour, 'Platinum blonde');
  assert.equal(saved.item.details.allergies, 'PPD');
  assert.deepEqual(saved.item.feedback, []);
  const briefId = saved.item.id;
  assert.ok(briefId);

  // Re-saving with the same id updates that specific brief.
  const updateResponse = await worker.fetch(new Request('https://example.com/api/briefs', {
    method: 'POST',
    body: JSON.stringify({
      id: briefId,
      sessionId: 'session-owner',
      items: [{ id: 'item-1', partition: 'me', rating: 3, annotation: 'updated' }]
    })
  }), env);
  const updated = await updateResponse.json();
  assert.equal(updated.item.id, briefId);
  assert.equal(updated.item.items.length, 1);

  // A new completion for the same session creates a distinct stored brief/link.
  const secondSaveResponse = await worker.fetch(new Request('https://example.com/api/briefs', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: 'session-owner',
      items: [{ id: 'item-3', partition: 'references', rating: 5, annotation: 'second brief' }]
    })
  }), env);
  const secondSaved = await secondSaveResponse.json();
  const secondBriefId = secondSaved.item.id;
  assert.notEqual(secondBriefId, briefId);

  // A reviewer opens the link and adds feedback.
  const feedbackResponse = await worker.fetch(new Request(`https://example.com/api/briefs/${briefId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ author: 'Stylist', itemId: 'item-1', rating: 4, note: 'Great starting point' })
  }), env);
  const feedback = await feedbackResponse.json();

  assert.equal(feedbackResponse.status, 201);
  assert.equal(feedback.item.author, 'Stylist');
  assert.equal(feedback.item.itemId, 'item-1');
  assert.equal(feedback.item.rating, 4);

  // Reading the brief returns items plus the feedback.
  const getResponse = await worker.fetch(new Request(`https://example.com/api/briefs/${briefId}`), env);
  const got = await getResponse.json();

  assert.equal(getResponse.status, 200);
  assert.equal(got.item.id, briefId);
  assert.equal(typeof got.item.details, 'object');
  assert.equal(got.item.feedback.length, 1);
  assert.equal(got.item.feedback[0].note, 'Great starting point');

  const listResponse = await worker.fetch(new Request('https://example.com/api/briefs?sessionId=session-owner'), env);
  const listed = await listResponse.json();

  assert.equal(listResponse.status, 200);
  assert.equal(listed.items.length, 2);
  assert.deepEqual(
    new Set(listed.items.map((item) => item.id)),
    new Set([briefId, secondBriefId])
  );
  assert.equal(listed.items.find((item) => item.id === briefId).feedback.length, 1);
  assert.equal(listed.items.find((item) => item.id === secondBriefId).feedback.length, 0);
});

test('lets a reviewer edit and delete their feedback', async () => {
  const { default: worker } = await loadWorker();
  const env = await createAssetEnv();

  const save = await worker.fetch(new Request('https://example.com/api/briefs', {
    method: 'POST',
    body: JSON.stringify({ sessionId: 'session-edit', items: [] })
  }), env);
  const briefId = (await save.json()).item.id;

  const created = await worker.fetch(new Request(`https://example.com/api/briefs/${briefId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ author: 'Stylist', note: 'First take' })
  }), env);
  const feedbackId = (await created.json()).item.id;

  // Edit the note.
  const edited = await worker.fetch(new Request(`https://example.com/api/briefs/${briefId}/feedback/${feedbackId}`, {
    method: 'PUT',
    body: JSON.stringify({ author: 'Stylist', note: 'Revised take' })
  }), env);
  const editedBody = await edited.json();
  assert.equal(edited.status, 200);
  assert.equal(editedBody.item.note, 'Revised take');

  // Editing to an empty note is rejected.
  const emptyEdit = await worker.fetch(new Request(`https://example.com/api/briefs/${briefId}/feedback/${feedbackId}`, {
    method: 'PUT',
    body: JSON.stringify({ note: '   ' })
  }), env);
  assert.equal(emptyEdit.status, 400);

  // Editing missing feedback is a 404.
  const missingEdit = await worker.fetch(new Request(`https://example.com/api/briefs/${briefId}/feedback/nope`, {
    method: 'PUT',
    body: JSON.stringify({ note: 'x' })
  }), env);
  assert.equal(missingEdit.status, 404);

  // Delete the feedback.
  const deleted = await worker.fetch(new Request(`https://example.com/api/briefs/${briefId}/feedback/${feedbackId}`, {
    method: 'DELETE'
  }), env);
  assert.equal(deleted.status, 200);

  // It no longer comes back with the brief.
  const got = await worker.fetch(new Request(`https://example.com/api/briefs/${briefId}`), env);
  assert.equal((await got.json()).item.feedback.length, 0);

  // Deleting again is a 404.
  const deleteAgain = await worker.fetch(new Request(`https://example.com/api/briefs/${briefId}/feedback/${feedbackId}`, {
    method: 'DELETE'
  }), env);
  assert.equal(deleteAgain.status, 404);
});

test('rejects empty feedback and missing briefs', async () => {
  const { default: worker } = await loadWorker();
  const env = await createAssetEnv();

  const missing = await worker.fetch(new Request('https://example.com/api/briefs/nope'), env);
  assert.equal(missing.status, 404);

  const save = await worker.fetch(new Request('https://example.com/api/briefs', {
    method: 'POST',
    body: JSON.stringify({ sessionId: 'session-x', items: [] })
  }), env);
  const saved = await save.json();

  const empty = await worker.fetch(new Request(`https://example.com/api/briefs/${saved.item.id}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ note: '   ' })
  }), env);
  assert.equal(empty.status, 400);
});

test('returns 404 for unknown routes', async () => {
  const { default: worker } = await loadWorker();
  const response = await worker.fetch(new Request('https://example.com/missing'), await createAssetEnv());

  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Not found');
});

test('new static frontend is wired to image and database APIs', async () => {
  const { app, styles } = await readFrontendSources();
  const index = await readFrontendText('index.html');

  assert.ok(app.includes('gallery: "/api/gallery"'));
  assert.ok(app.includes('favorites: "/api/favorites"'));
  assert.ok(app.includes('userPhotos: "/api/user-photos"'));
  assert.ok(app.includes('tryOn: "/api/try-on"'));
  assert.ok(app.includes('function openTryOn()'));
  assert.ok(app.includes('function applyTryOn()'));
  assert.ok(app.includes('function addTryOnResultToReferences'));
  assert.ok(app.includes('source: "try-on"'));
  assert.ok(app.includes('const showGenerationFrame = isGenerating || hasResult;'));
  assert.ok(app.includes('data-try-on-profile="yes">Yes</button>'));
  assert.ok(app.includes('data-try-on-profile="no">No</button>'));
  assert.ok(app.includes('class="try-on-generated-frame'));
  assert.ok(index.includes('id="detail-try-on"'));
  assert.ok(index.includes('id="try-on-overlay"'));
  assert.ok(index.includes('styles.css?v=2026-06-12-try-on-flow'));
  assert.ok(index.includes('app.js?v=2026-06-12-try-on-flow'));
  assert.ok(app.includes('imageUrl'));
  assert.ok(app.includes('syncStylesForCurrentRoute'));
  assert.ok(!app.includes('isAdminContext'));
  assert.ok(!app.includes('ADMIN_MODE_KEY'));
  assert.ok(!app.includes('canAdminEditStyle'));
  assert.ok(!app.includes('saveStyleLabels'));
  assert.ok(!app.includes('saveStyleAttributes'));
  assert.ok(!app.includes('deleteStyle'));
  assert.ok(!app.includes('data-admin-attribute'));
  assert.ok(app.includes('normalizeGender(item.gender)'));
  assert.ok(app.includes('inferGender'));
  assert.ok(app.includes('faceShape: normalizeFaceShape'));
  assert.ok(app.includes('function preferenceOptions(question)'));
  assert.ok(app.includes('function selectedPreferenceValues(question)'));
  assert.ok(app.includes('!option.exclusive && !option.selectAll'));
  assert.ok(app.includes('function answerFilteredStyles()'));
  assert.ok(app.includes('function styleHaystack(style)'));
  assert.ok(app.includes('function normalizeSearchText(value)'));
  assert.ok(app.includes('function optionEthnicityMatch(style, option)'));
  assert.ok(app.includes('function hairColourKey(value)'));
  assert.ok(app.includes('const HAIR_COLOUR_FILTER ='));
  assert.ok(app.includes('const HAIR_THICKNESS_FILTER ='));
  assert.ok(app.includes('function optionHairColourMatch(style, option)'));
  assert.ok(app.includes('function optionHairThicknessMatch(style, option)'));
  assert.ok(app.includes('optionGroupPasses(style, "face"'));
  assert.ok(app.includes('optionGroupPasses(style, "ethnicity", (option) => optionEthnicityMatch(style, option))'));
  assert.ok(app.includes('optionGroupPasses(style, "hair_colour", (option) => optionHairColourMatch(style, option))'));
  assert.ok(app.includes('optionGroupPasses(style, "hair_thickness", (option) => optionHairThicknessMatch(style, option))'));
  assert.ok(app.includes('const haystack = styleHaystack(style);'));
  assert.ok(app.includes('hairColours.has(hairColourKey(style.hairColour))'));
  assert.ok(app.includes('style.hairThickness === thickness'));
  assert.ok(app.includes('function computeResults()'));
  assert.ok(app.includes('return scoredStyles(refined);'));
  assert.ok(app.includes('toggleFavourite'));
  assert.ok(index.includes('data-filter="gender"'));
  assert.ok(index.includes('id="results-grid"'));
  assert.ok(index.includes('/app.js'));
  assert.ok(!index.includes('id="stealth-admin-toggle"'));
  assert.ok(!index.includes('stealth-admin-switch'));
  assert.ok(!index.includes('id="detail-label-admin"'));
  assert.ok(!index.includes('id="detail-attribute-admin"'));
  assert.ok(!index.includes('id="detail-delete"'));
  assert.ok(!index.includes('admin-nav-link'));
  assert.ok(!index.includes('topbar-admin-toggle'));
  assert.match(styles, /\.welcome-logo\s*\{[\s\S]*font-size: 56px;/);
  assert.ok(styles.includes('.try-on-generating-visual'));
  assert.ok(styles.includes('@keyframes tryOnSweep'));
  assert.ok(!styles.includes('stealth-admin-switch'));
  assert.ok(!styles.includes('admin-attribute'));
  assert.ok(!styles.includes('admin-label'));
});

test('wrangler deploys the TypeScript worker entry', async () => {
  const config = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');

  assert.match(config, /^name = "drp28"$/m);
  assert.match(config, /^main = "server\.ts"$/m);
  assert.match(config, /^\[assets\]$/m);
  assert.match(config, /^directory = "\.\/frontend"$/m);
  assert.match(config, /^run_worker_first = true$/m);
  assert.match(config, /^not_found_handling = "single-page-application"$/m);
  assert.match(config, /^\[\[d1_databases\]\]$/m);
  assert.match(config, /^binding = "DB"$/m);
  assert.match(config, /^migrations_dir = "migrations"$/m);
  assert.match(config, /^compatibility_date = "\d{4}-\d{2}-\d{2}"$/m);
});

test('GitHub Actions deploys pushes after remote D1 migrations', async () => {
  const workflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

  assert.match(workflow, /^\s+deploy:$/m);
  assert.match(workflow, /needs: test/);
  assert.match(workflow, /if: github\.event_name == 'push'/);
  assert.match(workflow, /name: Apply remote D1 migrations/);
  assert.match(workflow, /run: npm run db:migrate:remote/);
  assert.match(workflow, /name: Deploy Worker/);
  assert.match(workflow, /run: npx wrangler deploy/);
  assert.match(workflow, /CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/);
  assert.match(workflow, /CLOUDFLARE_ACCOUNT_ID: \$\{\{ secrets\.CLOUDFLARE_ACCOUNT_ID \}\}/);
});

test('gallery image AI analysis script is wired to D1 and structured outputs', async () => {
  const migration = await readFile(new URL('../migrations/0009_gallery_image_ai_analysis.sql', import.meta.url), 'utf8');
  const subtypeMigration = await readFile(new URL('../migrations/0010_gallery_image_hair_subtype.sql', import.meta.url), 'utf8');
  const cleanupMigration = await readFile(new URL('../migrations/0011_remove_analysis_column_prefix.sql', import.meta.url), 'utf8');
  const blockedRowsMigration = await readFile(new URL('../migrations/0012_delete_blocked_allthingshair_rows.sql', import.meta.url), 'utf8');
  const demographicsMigration = await readFile(new URL('../migrations/0013_gallery_image_demographics.sql', import.meta.url), 'utf8');
  const hairAttributesMigration = await readFile(new URL('../migrations/0014_gallery_image_hair_thickness.sql', import.meta.url), 'utf8');
  const script = await readFile(new URL('../scripts/analyze-gallery-images.mjs', import.meta.url), 'utf8');
  const celebrityScript = await readFile(new URL('../scripts/analyze-gallery-celebrities.mjs', import.meta.url), 'utf8');
  const hairAttributesScript = await readFile(new URL('../scripts/analyze-gallery-hair-attributes.mjs', import.meta.url), 'utf8');
  const packageJson = await readFile(new URL('../package.json', import.meta.url), 'utf8');

  assert.match(migration, /analysis_hair_type/);
  assert.match(subtypeMigration, /analysis_hair_subtype/);
  assert.match(cleanupMigration, /RENAME COLUMN analysis_hair_subtype TO hair_subtype/);
  assert.match(cleanupMigration, /RENAME COLUMN analysis_updated_at TO classified_at/);
  assert.match(cleanupMigration, /DROP COLUMN analysis_length/);
  assert.doesNotMatch(cleanupMigration, /RENAME COLUMN analysis_model/);
  assert.match(blockedRowsMigration, /ath-asianwomen-%/);
  assert.match(blockedRowsMigration, /assets\.unileversolutions\.com/);
  assert.match(blockedRowsMigration, /classified_at = ''/);
  assert.match(demographicsMigration, /ADD COLUMN ethnicity/);
  assert.match(demographicsMigration, /ADD COLUMN celebrity/);
  assert.match(hairAttributesMigration, /ADD COLUMN hair_thickness/);
  assert.match(hairAttributesMigration, /idx_gallery_images_hair_thickness/);
  assert.match(hairAttributesMigration, /idx_gallery_images_hair_colour/);
  assert.match(migration, /analysis_face_shape/);
  assert.match(migration, /analysis_hair_colour/);
  assert.match(migration, /analysis_maintenance/);
  assert.match(script, /https:\/\/api\.openai\.com\/v1\/responses/);
  assert.match(script, /async function loadDotEnv/);
  assert.match(script, /type: 'input_image'/);
  assert.match(script, /--concurrency/);
  assert.match(script, /--retries/);
  assert.match(script, /async function processRows/);
  assert.match(script, /async function withRetries/);
  assert.match(script, /Promise\.all\(workers\)/);
  assert.match(script, /finished with \$\{failures\.length\} failed row/);
  assert.match(script, /ethnicity IS NULL OR ethnicity = ''/);
  assert.match(script, /celebrity IS NULL OR celebrity = ''/);
  assert.match(script, /type: 'json_schema'/);
  assert.match(script, /description: 'Broad visible curl pattern category/);
  assert.match(script, /Subtype guidance:/);
  assert.match(script, /enum: \['straight', 'wavy', 'curly', 'coily'\]/);
  assert.match(script, /enum: \['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C'\]/);
  assert.match(script, /enum: \['black', 'south east asian', 'asian', 'south-asian', 'latino', 'middle-eastern', 'white'\]/);
  assert.match(script, /celebrity: a public figure name only if/);
  assert.match(script, /ethnicity =/);
  assert.match(script, /celebrity =/);
  assert.match(script, /hair_subtype =/);
  assert.match(script, /classified_at = CURRENT_TIMESTAMP/);
  assert.match(script, /analysis_model =/);
  assert.doesNotMatch(script, /analysis_hair_subtype =/);
  assert.doesNotMatch(script, /analysis_updated_at/);
  assert.match(script, /labels_json =/);
  assert.match(packageJson, /"analyze:gallery:local"/);
  assert.match(packageJson, /"analyze:gallery:remote"/);
  assert.match(packageJson, /"analyze:celebrities:local"/);
  assert.match(packageJson, /"analyze:celebrities:remote"/);
  assert.match(packageJson, /"analyze:hair-attributes:local"/);
  assert.match(packageJson, /"analyze:hair-attributes:remote"/);
  assert.match(celebrityScript, /gallery_celebrity_analysis/);
  assert.match(celebrityScript, /type: 'input_image'/);
  assert.match(celebrityScript, /LOWER\(TRIM\(celebrity\)\) = 'none'/);
  assert.match(celebrityScript, /celebrity =/);
  assert.match(celebrityScript, /labels_json =/);
  assert.doesNotMatch(celebrityScript, /hair_type =/);
  assert.match(hairAttributesScript, /gallery_hair_attributes_analysis/);
  assert.match(hairAttributesScript, /type: 'input_image'/);
  assert.match(hairAttributesScript, /hair_thickness IS NULL OR hair_thickness = ''/);
  assert.match(hairAttributesScript, /enum: \['especially thin', 'thin', 'thick', 'especially thick'\]/);
  assert.match(hairAttributesScript, /enum: \['black', 'brown', 'blonde', 'red', 'grey', 'other'\]/);
  assert.match(hairAttributesScript, /hair_thickness =/);
  assert.match(hairAttributesScript, /hair_colour =/);
});

test('local dev seeds memory gallery and persists shared briefs', async () => {
  const localDev = await readFile(new URL('../local-dev.mjs', import.meta.url), 'utf8');

  assert.ok(localDev.includes('seedGalleryFromMigrations'));
  assert.ok(localDev.includes('INSERT OR IGNORE INTO gallery_images'));
  assert.ok(localDev.includes('loadLocalStore'));
  assert.ok(localDev.includes('persistLocalStore'));
  assert.ok(localDev.includes('.local-dev-store.json'));
  assert.ok(localDev.includes('await seedGalleryFromMigrations()'));
});
