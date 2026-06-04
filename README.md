# DRP28

Minimal Cloudflare Worker backend serving the Salon frontend.

## What Runs

- `server.ts` handles Worker backend routes.
- `frontend/index.html`, `frontend/styles.css`, and `frontend/app.js` are the served frontend.
- `/api/status` is the backend health/status endpoint.
- `/api/gallery`, `/api/quiz-responses`, `/api/user-photos`, and `/api/favorites` are D1-backed storage endpoints.
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

The fallback server stores API data in memory only. Restarting it clears local gallery, quiz, photo, and favorites data.

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

## D1 Database Setup

There is no deployed database until you create one in Cloudflare.
The migrations also seed the gallery with British GQ men's hair trend image URLs and Glamour women's haircut image URLs. Gallery rows include a `gender` column; seeded GQ rows are backfilled as `Men`, and seeded Glamour rows are backfilled as `Women`.

Create the D1 database:

```bash
npx wrangler d1 create drp28
```

Copy the returned `database_id` into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "drp28"
database_id = "PASTE_DATABASE_ID_HERE"
migrations_dir = "migrations"
```

Apply migrations locally:

```bash
npm run db:migrate:local
```

Apply migrations to Cloudflare:

```bash
npm run db:migrate:remote
```

List D1 databases:

```bash
npm run db:list
```

## Gallery Image AI Analysis

After applying migrations, you can enrich existing `gallery_images` rows from their
`image_url` values. The script sends each pending image URL to OpenAI with a
structured output schema, stores the detailed result in gallery metadata
columns, and also backfills the existing UI filter columns.
The broad `hair_type` remains `straight`, `wavy`, `curly`, or `coily`;
`hair_subtype` stores the finer `1A` through `4C` pattern. The model used is
stored in `analysis_model`, and the classification timestamp is stored in
`classified_at`. The classifier also stores `ethnicity` using the supported
gallery categories and `celebrity`, which is set to a public figure name only
when existing row text explicitly identifies one; otherwise it stores `none`.
Rows missing `ethnicity` are treated as pending so older classified rows can be
backfilled without `--force`.

Set your OpenAI key locally in `.env`:

```bash
OPENAI_API_KEY="sk-..."
```

Or export it in the current terminal:

```bash
export OPENAI_API_KEY="sk-..."
```

Test against the local D1 database:

```bash
npm run db:migrate:local
npm run analyze:gallery:local -- --limit 3 --dry-run
npm run analyze:gallery:local -- --limit 3
```

Run against the remote Cloudflare D1 database:

```bash
npm run db:migrate:remote
npm run analyze:gallery:remote
```

To fill only celebrity/public-figure names without re-running the full hairstyle
classifier, use the celebrity-only analyzer. It reads only rows whose current
`gallery_images.celebrity` value is `none`; rows that already have a celebrity
name are not selected.

```bash
npm run analyze:celebrities:local -- --limit 10 --dry-run
npm run analyze:celebrities:local
npm run analyze:celebrities:remote -- --limit 10 --dry-run
npm run analyze:celebrities:remote
```

Useful options:

```bash
npm run analyze:gallery:remote -- --limit 10
npm run analyze:gallery:remote -- --concurrency 5
npm run analyze:gallery:remote -- --concurrency 5 --retries 3
npm run analyze:gallery:remote -- --force
OPENAI_MODEL=gpt-5-mini-2025-08-07 npm run analyze:gallery:remote
```

## Deploy

Manual deploy with npm available:

```bash
npm run deploy
```

This applies the remote D1 migrations and then deploys. The equivalent
direct commands are:

```bash
npx wrangler d1 migrations apply DB --remote
npx wrangler deploy
```

## Cloudflare Workers CI/CD

In Cloudflare Workers Builds, use:

```text
Build command: npm test
Deploy command: npm run deploy
Root directory: blank
```

The `npm run deploy` script applies the remote D1 migrations
(`npx wrangler d1 migrations apply DB --remote`) before running
`npx wrangler deploy`, so seed migrations are pushed to the live
database as part of every deploy. The Cloudflare build environment
already provides `CLOUDFLARE_API_TOKEN`, so no extra setup is needed.

The deploy uses `wrangler.toml`:

```toml
name = "drp28"
main = "server.ts"
compatibility_date = "2026-05-27"

[assets]
directory = "./frontend"
binding = "ASSETS"

[[d1_databases]]
binding = "DB"
database_name = "drp28"
database_id = "PASTE_DATABASE_ID_HERE"
migrations_dir = "migrations"
```

## GitHub Actions CI/CD

The workflow in `.github/workflows/ci.yml` runs tests on pushes and pull requests:

```bash
npm ci
npm test
```

On every push, after tests pass, GitHub Actions applies the latest remote D1
migrations and deploys the Worker directly to Cloudflare:

```bash
npm run db:migrate:remote
npx wrangler deploy
```

Configure these repository secrets in GitHub Actions:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

## Useful Commands

```bash
git status --short
node --test
node local-dev.mjs
npm start
npm run db:migrate:local
npm run db:migrate:remote
npm run deploy
```

## Notes

- Do not use `apt install npm` on lab machines unless you are an administrator.
- If `npx` is missing locally, use `node local-dev.mjs`.
- Replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.toml` before deploying with D1.
- Cloudflare’s build environment has npm, so CI/CD can still use `npm test` and `npx wrangler deploy`.
- D1 is fine for prototype photo data and metadata. For large production image files, use R2 for the binary image and keep only the URL/metadata/features in D1.
