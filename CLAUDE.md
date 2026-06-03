# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DRP28** is a Cloudflare Workers backend for a salon hair-matching web app. The user uploads a photo or takes a quiz, and the app recommends hairstyles from a gallery based on their hair type, length, and other preferences.

## Architecture

### Backend (Cloudflare Worker)
- **server.ts**: Main Worker handler; routes HTTP requests to API endpoints or static assets
- Database: D1 (Cloudflare's SQLite); migrations in `/migrations/`
- API routes:
  - `GET /api/status` → health check
  - `GET /api/gallery` → paginated gallery images (filterable by hair type, length, gender)
  - `POST /api/gallery` → add images (admin)
  - `GET/POST /api/quiz-responses` → quiz answers
  - `GET/POST /api/user-photos` → user-uploaded hair photos
  - `GET/POST /api/favorites` → user favorite images
- All other routes → serve static assets from `/frontend/` via the ASSETS binding

### Frontend
- **frontend/index.html**: Single-page app shell
- **frontend/app.js**: Vanilla JavaScript; no build step. Manages quiz UI, gallery rendering, favorites, user photo uploads
- **frontend/styles.css**: Styling
- **frontend/Images/**: Static image assets

### Database Schema
Core tables:
- `gallery_images`: hairstyle catalog with AI analysis (hair type, subtype, gender, length, upkeep, features, labels)
- `quiz_responses`: quiz answers JSON keyed by session_id
- `user_photos`: user-uploaded hair photos with metadata
- `favorite_images`: many-to-many join of session → image

Seeded from migrations with GQ men's trends and Glamour women's haircuts.

### Local Development
- **With npm**: `npm start` launches Wrangler dev (full Cloudflare simulation, includes D1 local binding)
- **Without npm**: `node local-dev.mjs` (Node.js fallback server; memory-only storage, no persistence between restarts)
- Port: 8787 (configurable via `PORT=3000 node local-dev.mjs`)

### Testing
- Uses Node.js built-in test framework (`node --test`)
- Test file: `/test/worker.test.mjs`
- Strategy: transpiles server.ts to JavaScript by stripping TypeScript annotations, then imports it
- Includes a mock D1 database for in-memory testing without touching the real database

## Common Commands

```bash
# Local development (full Wrangler simulation)
npm start

# Local development (fallback, no npm needed)
node local-dev.mjs
PORT=3000 node local-dev.mjs

# Run tests
npm test
node --test

# D1 database
npm run db:migrate:local      # Apply migrations to local D1
npm run db:migrate:remote     # Apply migrations to remote D1 (needs token)
npm run db:list              # List D1 databases

# Gallery image AI analysis (requires OPENAI_API_KEY)
npm run analyze:gallery:local -- --limit 3 --dry-run
npm run analyze:gallery:local -- --limit 3
npm run analyze:gallery:remote -- --limit 10 --concurrency 5

# Deployment
npm run deploy               # Apply remote migrations + deploy Worker
npx wrangler deploy         # Deploy Worker only (manual)
```

## Key Files & Patterns

### server.ts
- Request handler for the Worker (see `export default { fetch }`)
- Helper functions for response formatting (`json()`, `error()`)
- Input parsing: `readJson()`, `parseList()`, `parseLabels()`, `normalizeGender()`, etc.
- Each API route is a function that accepts `(request, env)` and returns `Promise<Response>`
- Uses D1 via `env.DB.prepare(sql).bind(...).run()` for inserts/updates and `.all()` for queries
- Validation and normalization happen at the route layer (no separate service layer)

### gallery images & AI analysis
- Migration 0009+ add AI analysis columns: `hair_type`, `hair_subtype`, `analysis_model`, `classified_at`
- `/scripts/analyze-gallery-images.mjs` calls OpenAI with a structured JSON schema to classify images
- Use `--force` to re-analyze already-classified images; `--dry-run` to preview without writing

### wrangler.toml
- Worker name: `drp28`
- Assets binding: `ASSETS` → serves `/frontend/` as static files with SPA fallback
- D1 binding: `DB` → database_id must be set (already configured)
- `run_worker_first = true` so routes take precedence over static assets

### Test Transpilation
The test loader strips TypeScript:
- Type annotations (`: string`, `: Env`, etc.)
- Type imports and interfaces
Then imports the transpiled module as JavaScript.

**Pitfall**: If you add a new TypeScript feature (generics, `satisfies`, etc.) that isn't handled by the regex replacements, tests will fail. Keep types simple; add new type stripping rules to `test/worker.test.mjs` if needed.

## Database Queries

Common patterns in server.ts:
```typescript
// Insert
const stmt = env.DB.prepare(
  'INSERT INTO table (col1, col2) VALUES (?, ?)'
).bind(val1, val2);
await stmt.run();

// Query (returns array of rows)
const result = await env.DB.prepare(
  'SELECT * FROM table WHERE id = ?'
).bind(id).all();
const rows = result.results || [];

// Paginate
const limit = 20;
const offset = (page - 1) * limit;
const { results } = await env.DB.prepare(
  'SELECT * FROM gallery_images ORDER BY created_at DESC LIMIT ? OFFSET ?'
).bind(limit, offset).all();
```

JSON columns are stored as strings; parse with `JSON.parse()` when reading, stringify when writing.

## Deployment

Push to main → GitHub Actions runs tests → if pass, applies remote migrations and deploys Worker to Cloudflare.

**Requires GitHub secrets**:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Manual deploy locally:
```bash
npm run deploy
# (equiv: npx wrangler d1 migrations apply DB --remote && npx wrangler deploy)
```

## Filtering & Query Parameters

Frontend passes query params to `/api/gallery`:
- `gender` (Men, Women, Unisex)
- `length` (Very Short, Short, Medium, Long, Very Long)
- `hair_type` (Straight, Wavy, Curly, Coily)
- `hair_subtype` (1A–4C)
- `upkeep` (Low, Medium, High)
- `page` (pagination, default 1)

Backend returns filtered/paginated results. Filtering is done with WHERE clauses; no full-text search.

## Notes

- Frontend is vanilla JS; no build step, no framework. Changes to app.js are live without recompilation.
- D1 is transactional but not replicated; safe for prototype/testing, plan migration to larger DB if user base grows.
- Image URLs are stored as text in gallery_images; full image blobs go to R2 (not yet in place).
- The `local-dev.mjs` server is useful for testing on lab machines without npm; it's memory-only and doesn't persist.
- Hair analysis requires OpenAI API key; run with `--dry-run` first to preview.
