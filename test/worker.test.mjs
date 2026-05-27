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
    user_photos: []
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
              features_json: values[4],
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

          return { results: [] };
        }
      };
    }
  };
}

async function createAssetEnv() {
  const index = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../public/app.jsx', import.meta.url), 'utf8');

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

        if (pathname === '/app.jsx') {
          return new Response(app, {
            headers: { 'content-type': 'text/babel; charset=utf-8' }
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
  assert.match(body, /id="root"/);
  assert.ok(body.includes('src="/app.jsx"'));
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
      features: ['medium', 'wavy']
    })
  }), env);
  const created = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(created.item.title, 'Soft Curtain Bangs');
  assert.deepEqual(created.item.features, ['medium', 'wavy']);

  const listResponse = await worker.fetch(new Request('https://example.com/api/gallery'), env);
  const list = await listResponse.json();

  assert.equal(listResponse.status, 200);
  assert.equal(list.items.length, 1);
  assert.equal(list.items[0].id, created.item.id);
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

test('returns 404 for unknown routes', async () => {
  const { default: worker } = await loadWorker();
  const response = await worker.fetch(new Request('https://example.com/missing'), await createAssetEnv());

  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Not found');
});

test('combined frontend bundle includes only Salon and backend wiring', async () => {
  const app = await readFile(new URL('../public/app.jsx', import.meta.url), 'utf8');
  const removedComponentNames = [
    'At' + 'elierApp',
    'Mir' + 'rorApp'
  ];

  assert.ok(app.includes('window.SalonApp = SalonApp'));
  for (const componentName of removedComponentNames) {
    assert.ok(!app.includes(`window.${componentName}`));
    assert.ok(!app.includes(componentName));
  }
  assert.ok(app.includes('Object.assign(window, {'));
  assert.ok(!app.includes("fetch('/api/status')"));
  assert.ok(!app.includes('shell-bar'));
  assert.ok(app.includes('ReactDOM.createRoot'));
});

test('wrangler deploys the TypeScript worker entry', async () => {
  const config = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');

  assert.match(config, /^name = "drp28"$/m);
  assert.match(config, /^main = "server\.ts"$/m);
  assert.match(config, /^\[assets\]$/m);
  assert.match(config, /^directory = "\.\/public"$/m);
  assert.match(config, /^\[\[d1_databases\]\]$/m);
  assert.match(config, /^binding = "DB"$/m);
  assert.match(config, /^migrations_dir = "migrations"$/m);
  assert.match(config, /^compatibility_date = "\d{4}-\d{2}-\d{2}"$/m);
});
