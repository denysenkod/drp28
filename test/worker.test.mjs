import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

async function loadWorker() {
  const source = await readFile(new URL('../server.ts', import.meta.url), 'utf8');
  const javascript = source
    .replaceAll(': unknown', '')
    .replaceAll(': ResponseInit', '')
    .replaceAll(': string', '')
    .replace('request: Request', 'request')
    .replaceAll('): Response', ')')
    .replace('): Promise<Response>', ')');
  const moduleUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(javascript)}`;

  return import(moduleUrl);
}

test('serves the frontend on the root route', async () => {
  const { default: worker } = await loadWorker();
  const response = await worker.fetch(new Request('https://example.com/'));
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.match(body, /<h1>DRP28<\/h1>/);
  assert.match(body, /fetch\('\/api\/status'\)/);
  assert.match(body, /id="api-response"/);
});

test('serves backend status as JSON', async () => {
  const { default: worker } = await loadWorker();
  const response = await worker.fetch(new Request('https://example.com/api/status'));
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
  const response = await worker.fetch(new Request('https://example.com/missing'));

  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Not found');
});

test('wrangler deploys the TypeScript worker entry', async () => {
  const config = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8');

  assert.match(config, /^name = "drp28"$/m);
  assert.match(config, /^main = "server\.ts"$/m);
  assert.match(config, /^compatibility_date = "\d{4}-\d{2}-\d{2}"$/m);
});
