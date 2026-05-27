import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

async function loadWorker() {
  const source = await readFile(new URL('../server.ts', import.meta.url), 'utf8');
  const javascript = source
    .replace(/interface Env \{[\s\S]*?\n\}/, '')
    .replaceAll(': unknown', '')
    .replaceAll(': ResponseInit', '')
    .replaceAll(': string', '')
    .replace('env: Env', 'env')
    .replace('request: Request', 'request')
    .replaceAll('): Response', ')')
    .replace('): Promise<Response>', ')');
  const moduleUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(javascript)}`;

  return import(moduleUrl);
}

async function createAssetEnv() {
  const index = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../public/app.jsx', import.meta.url), 'utf8');

  return {
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
    message: 'Backend is running on Cloudflare Workers.'
  });
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
  assert.match(config, /^compatibility_date = "\d{4}-\d{2}-\d{2}"$/m);
});
