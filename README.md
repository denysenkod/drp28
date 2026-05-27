# DRP28

Minimal Cloudflare Worker backend serving the Salon frontend.

## What Runs

- `server.ts` handles Worker backend routes.
- `public/index.html` and `public/app.jsx` are the served frontend.
- `/api/status` is the backend health/status endpoint.
- `local-dev.mjs` is a fallback local server for machines with `node` but no `npm` or `npx`.

## Local Start Without npm

Use this on DoC/lab machines where `npm` and `npx` are unavailable:

```bash
node local-dev.mjs
```

Open:

```text
http://localhost:8787
```

Backend endpoint:

```text
http://localhost:8787/api/status
```

To use a different port:

```bash
PORT=3000 node local-dev.mjs
```

## Local Start With npm

If `npm`/`npx` are installed, use Wrangler for the Cloudflare-like local runtime:

```bash
npm start
```

Equivalent direct command:

```bash
npx wrangler dev
```

Fallback local server via npm:

```bash
npm run dev:local
```

## Tests

Run tests with plain Node:

```bash
node --test
```

If npm is available:

```bash
npm test
```

## Deploy

Manual deploy with npm available:

```bash
npm run deploy
```

Equivalent direct command:

```bash
npx wrangler deploy
```

## Cloudflare Workers CI/CD

In Cloudflare Workers Builds, use:

```text
Build command: npm test
Deploy command: npx wrangler deploy
Root directory: blank
```

The deploy uses `wrangler.toml`:

```toml
name = "drp28"
main = "server.ts"
compatibility_date = "2026-05-27"

[assets]
directory = "./public"
binding = "ASSETS"
```

## GitHub Actions CI

The workflow in `.github/workflows/ci.yml` runs on pushes and pull requests:

```bash
npm ci
npm test
```

## Useful Commands

```bash
git status --short
node --test
node local-dev.mjs
npm start
npm run deploy
```

## Notes

- Do not use `apt install npm` on lab machines unless you are an administrator.
- If `npx` is missing locally, use `node local-dev.mjs`.
- Cloudflare’s build environment has npm, so CI/CD can still use `npm test` and `npx wrangler deploy`.
