import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

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
    favorite_images: []
  };

  const clone = (row) => ({ ...row });
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
              maintenance_level: values[7],
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

          if (sql.includes('DELETE FROM favorite_images')) {
            tables.favorite_images = tables.favorite_images.filter(
              (row) => row.session_id !== values[0] || row.image_id !== values[1]
            );
          }

          if (sql.includes('UPDATE gallery_images SET labels_json = ? WHERE id = ?')) {
            const row = tables.gallery_images.find((item) => item.id === values[1]);
            if (row) row.labels_json = values[0];
          }

          if (sql.includes('SET gender = ?, length = ?, hair_type = ?, maintenance_level = ?')) {
            const row = tables.gallery_images.find((item) => item.id === values[4]);
            if (row) {
              row.gender = values[0];
              row.length = values[1];
              row.hair_type = values[2];
              row.maintenance_level = values[3];
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

          return { results: [] };
        }
      };
    }
  };
}

async function createAssetEnv() {
  const index = await readFile(new URL('../frontend/index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../frontend/app.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../frontend/styles.css', import.meta.url), 'utf8');

  return {
    DB: createMockD1(),
    ASSETS: {
      async fetch(request) {
        const pathname = new URL(request.url).pathname;

        if (pathname === '/' || pathname === '/index.html') {
          return new Response(index, {
            headers: { 'content-type': 'text/html; charset=utf-8' }
          });
        }

        if (pathname === '/app.js') {
          return new Response(app, {
            headers: { 'content-type': 'text/javascript; charset=utf-8' }
          });
        }

        if (pathname === '/styles.css') {
          return new Response(styles, {
            headers: { 'content-type': 'text/css; charset=utf-8' }
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

test('serves the admin route through the frontend shell', async () => {
  const { default: worker } = await loadWorker();
  const response = await worker.fetch(new Request('https://example.com/admin'), await createAssetEnv());
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.doesNotMatch(body, /id="admin-nav-link"/);
  assert.doesNotMatch(body, /id="topbar-admin-toggle"/);
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
  assert.equal(created.item.maintenanceLevel, 'Low');
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
      maintenanceLevel: 'Higher'
    })
  }), env);
  const updated = await updateResponse.json();

  assert.equal(updateResponse.status, 200);
  assert.equal(updated.item.gender, 'Unisex');
  assert.equal(updated.item.length, 'Short');
  assert.equal(updated.item.hairType, 'Straight Hair');
  assert.equal(updated.item.maintenanceLevel, 'Higher');
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

test('returns 404 for unknown routes', async () => {
  const { default: worker } = await loadWorker();
  const response = await worker.fetch(new Request('https://example.com/missing'), await createAssetEnv());

  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Not found');
});

test('new static frontend is wired to image and database APIs', async () => {
  const app = await readFile(new URL('../frontend/app.js', import.meta.url), 'utf8');
  const index = await readFile(new URL('../frontend/index.html', import.meta.url), 'utf8');

  assert.ok(app.includes('gallery: "/api/gallery"'));
  assert.ok(app.includes('galleryLabels: (id)'));
  assert.ok(app.includes('galleryAttributes: (id)'));
  assert.ok(app.includes('favorites: "/api/favorites"'));
  assert.ok(app.includes('userPhotos: "/api/user-photos"'));
  assert.ok(app.includes('imageUrl'));
  assert.ok(app.includes('isAdminContext'));
  assert.ok(app.includes('syncStylesForCurrentRoute'));
  assert.ok(app.includes('No database-backed gallery pictures loaded.'));
  assert.ok(app.includes('saveStyleLabels'));
  assert.ok(app.includes('saveStyleAttributes'));
  assert.ok(app.includes('data-admin-attribute'));
  assert.ok(app.includes('normalizeGender(item.gender)'));
  assert.ok(app.includes('inferGender'));
  assert.ok(app.includes('toggleFavourite'));
  assert.ok(index.includes('data-filter="gender"'));
  assert.ok(index.includes('id="detail-gender"'));
  assert.ok(index.includes('id="results-grid"'));
  assert.ok(index.includes('/app.js'));
  assert.ok(index.includes('id="detail-label-admin"'));
  assert.ok(index.includes('id="detail-attribute-admin"'));
  assert.ok(!index.includes('admin-nav-link'));
  assert.ok(!index.includes('topbar-admin-toggle'));
});

test('wrangler deploys the TypeScript worker entry', async () => {
  const config = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');

  assert.match(config, /^name = "drp28"$/m);
  assert.match(config, /^main = "server\.ts"$/m);
  assert.match(config, /^\[assets\]$/m);
  assert.match(config, /^directory = "\.\/frontend"$/m);
  assert.match(config, /^\[\[d1_databases\]\]$/m);
  assert.match(config, /^binding = "DB"$/m);
  assert.match(config, /^migrations_dir = "migrations"$/m);
  assert.match(config, /^compatibility_date = "\d{4}-\d{2}-\d{2}"$/m);
});

test('local dev seeds memory gallery from migration files', async () => {
  const localDev = await readFile(new URL('../local-dev.mjs', import.meta.url), 'utf8');

  assert.ok(localDev.includes('seedGalleryFromMigrations'));
  assert.ok(localDev.includes('INSERT OR IGNORE INTO gallery_images'));
  assert.ok(localDev.includes('await seedGalleryFromMigrations()'));
});
