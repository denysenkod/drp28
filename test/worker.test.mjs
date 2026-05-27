import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

async function loadWorker() {
  const source = await readFile(new URL('../server.ts', import.meta.url), 'utf8');
  const javascript = source
    .replace('request: Request', 'request')
    .replace('): Promise<Response>', ')');
  const moduleUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(javascript)}`;

  return import(moduleUrl);
}

test('responds successfully on the root route', async () => {
  const { default: worker } = await loadWorker();
  const response = await worker.fetch(new Request('https://example.com/'));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(await response.text(), 'Hello, World! 🚀 Deployed via Cloudflare Workers.');
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
