# DRP28

Minimal Cloudflare Worker backend serving the Salon frontend.

## What Runs

- `server.ts` handles Worker backend routes.
- `frontend/index.html`, `frontend/styles.css`, and `frontend/app.js` are the public frontend entrypoints. The implementation is split under `frontend/js/` and `frontend/css/`.
- `/api/status` is the backend health/status endpoint.
- `/api/gallery`, `/api/quiz-responses`, `/api/user-photos`, and `/api/favorites` are D1-backed storage endpoints.
- `local-dev.mjs` is a fallback local server for machines with `node` but no `npm` or `npx`.

## Frontend Structure

The frontend is still a static vanilla JavaScript app with no build step. `index.html` loads `/styles.css` and `/app.js`; those two files remain the public URLs so the Worker, Wrangler assets, and fallback local server keep serving the same interface.

### Public Entry Files

- `frontend/index.html` is the single-page app shell. It owns the permanent DOM anchors such as the top navigation, bottom navigation, results container, detail popup, favourites popup, product popup, and try-on popup. Runtime screens are rendered into `#app` by JavaScript.
- `frontend/styles.css` is the public stylesheet entrypoint. It contains only `@import` statements for the feature-specific CSS files in `frontend/css/`, keeping the served URL stable while making styles easier to edit by area.
- `frontend/app.js` is the public JavaScript entrypoint. It loads the files in `frontend/js/` sequentially as classic scripts, preserving the same global execution order the old single `app.js` had.

### JavaScript Files

- `frontend/js/storage.js` defines API endpoint constants, local-storage keys, session helpers, JSON fetch handling, hair-colour option metadata, and brief-detail defaults. It is loaded first because most other files need session, API, or persistence helpers.
- `frontend/js/icons.js` contains small inline SVG helper functions for search, gender, action, texture, face-shape, and length icons used throughout rendered markup.
- `frontend/js/fallback-styles.js` contains bundled fallback hairstyle records. These are shown while the gallery API is loading or when the API is unavailable.
- `frontend/js/products-and-normalizers.js` contains styling product metadata and the functions that normalize raw gallery API rows into the frontend style shape. This includes gender, face-shape, hair-colour, hair-thickness, length, maintenance, and product-related enrichment.
- `frontend/js/state.js` owns the main `state` object, cached DOM lookups, current overlay IDs, route/view switching, fallback style syncing, quiz-step movement, answer persistence, and start-over behavior.
- `frontend/js/data-loading.js` loads gallery images and favourites from the backend APIs, merges optimistic favourite changes, and refreshes the current render once data arrives.
- `frontend/js/quiz-filters.js` owns quiz-answer helpers, answer-derived filters, search normalization, scoring, preference options, and the final `computeResults()` pipeline.
- `frontend/js/rendering.js` renders the home feed, quiz flow, results/search screen, result cards, filter controls, carousel dots, upload previews, and the event wiring for those screens.
- `frontend/js/favourites.js` owns favourite toggling, optimistic favourite API writes, saved-count updates, detail save-state updates, and the saved styles overlay.
- `frontend/js/brief.js` manages the editable style brief collection, including item IDs, partition updates, annotations, first-choice flags, removing items, and mirroring uploaded self photos to the API.
- `frontend/js/brief-sharing.js` handles brief syncing, share payload construction, complete-profile prompts, share link creation, clipboard/native share integration, and share status messages.
- `frontend/js/shared-brief.js` renders shared briefs in read-only review mode, loads shared brief data, submits reviewer feedback, renders feedback lists, and manages stylist summary review state.
- `frontend/js/try-on.js` owns the haircut try-on popup, selfie upload handling, optional profile update prompt, try-on generation API call, error state, generated result rendering, and adding try-on results back into references.
- `frontend/js/detail-overlay.js` renders the hairstyle detail popup, detail image, maintenance copy, product chips, similar results, and detail save-state text.
- `frontend/js/product-overlay.js` turns product mentions into popup links and renders product descriptions, product photos, how-to-use steps, and result examples.
- `frontend/js/uploads.js` contains browser file helpers for reading and compressing image uploads plus selected-feature collection used by the profile/search flow.
- `frontend/js/utilities.js` contains shared HTML and attribute escaping helpers.
- `frontend/js/init.js` performs one-time startup: top/bottom navigation binding, overlay close handlers, Escape-key handling, browser history handling, URL parameter bootstrapping, initial render, gallery load, favourites load, and shared-brief loading.
- `frontend/js/manifest.json` documents the JavaScript load list and each file's purpose. Tests use it to inspect the split source set as one logical app.

### CSS Files

- `frontend/css/base.css` defines design tokens, global reset rules, typography defaults, navigation, app shell spacing, shared buttons, and other base primitives.
- `frontend/css/home.css` styles the welcome/home screen, HairMatch wordmark, survey CTA, home feed, and in-page search bar.
- `frontend/css/quiz.css` styles the quiz layout, progress bar, option cards, image/card grids, mobile carousel-ready quiz pieces, sliders, maintenance product choices, and quiz footer.
- `frontend/css/results.css` styles the search/results screen, upload/profile preview strips, filter and refine controls, result cards, gallery grid, base overlay layout, detail popup, and similar-results area.
- `frontend/css/short-laptop.css` contains the `min-width: 821px and max-height: 760px` overrides for short laptop screens. Keep quiz card aspect-ratio changes mirrored here.
- `frontend/css/brief.css` styles the profile/style brief, self/reference partitions, brief picker, reference add flow, annotations, first-choice controls, sharing controls, shared review UI, feedback, consultation details, and hair-colour combobox.
- `frontend/css/responsive.css` contains tablet and phone breakpoints, the mobile bottom tab bar, mobile quiz carousel behavior, carousel dots, compact result cards, and very small phone adjustments.
- `frontend/css/products-tryon.css` styles product links and chips, product popup content, overlay z-index layering, try-on popup frames, selfie target, generation controls, errors, and generated result display.
- `frontend/css/manifest.json` documents the CSS import list and each file's purpose. Tests use it to inspect the split source set as one logical stylesheet.

When changing frontend code, update the cache-busting version in `frontend/index.html`, `frontend/app.js`, and `frontend/styles.css` so browsers request the changed entrypoints and split assets.

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

To fill hair thickness and canonical hair colour metadata, run the hair
attributes analyzer. `hair_colour` already exists from the full classifier;
the `0014` migration adds `hair_thickness` and indexes both fields.

```bash
npm run db:migrate:local
npm run analyze:hair-attributes:local -- --limit 10 --dry-run
npm run analyze:hair-attributes:local
npm run db:migrate:remote
npm run analyze:hair-attributes:remote -- --limit 10 --dry-run
npm run analyze:hair-attributes:remote
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
