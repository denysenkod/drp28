#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const DEFAULT_MODEL = 'gpt-5-mini-2025-08-07';
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const HAIR_ATTRIBUTES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    hair_thickness: {
      type: 'string',
      description: 'Visible hair strand/density thickness category for the person in the image.',
      enum: ['especially thin', 'thin', 'thick', 'especially thick']
    },
    hair_colour: {
      type: 'string',
      description: 'Dominant visible hair colour category.',
      enum: ['black', 'brown', 'blonde', 'red', 'grey', 'other']
    }
  },
  required: ['hair_thickness', 'hair_colour']
};

function parseArgs(argv) {
  const options = {
    databaseBinding: 'DB',
    dryRun: false,
    force: false,
    limit: null,
    location: 'local',
    delayMs: 300,
    concurrency: 3,
    retries: 2
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--remote') {
      options.location = 'remote';
    } else if (arg === '--local') {
      options.location = 'local';
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--limit') {
      options.limit = readPositiveInteger(argv[++index], '--limit');
    } else if (arg.startsWith('--limit=')) {
      options.limit = readPositiveInteger(arg.slice('--limit='.length), '--limit');
    } else if (arg === '--delay-ms') {
      options.delayMs = readNonNegativeInteger(argv[++index], '--delay-ms');
    } else if (arg.startsWith('--delay-ms=')) {
      options.delayMs = readNonNegativeInteger(arg.slice('--delay-ms='.length), '--delay-ms');
    } else if (arg === '--concurrency') {
      options.concurrency = readPositiveInteger(argv[++index], '--concurrency');
    } else if (arg.startsWith('--concurrency=')) {
      options.concurrency = readPositiveInteger(arg.slice('--concurrency='.length), '--concurrency');
    } else if (arg === '--retries') {
      options.retries = readNonNegativeInteger(argv[++index], '--retries');
    } else if (arg.startsWith('--retries=')) {
      options.retries = readNonNegativeInteger(arg.slice('--retries='.length), '--retries');
    } else if (arg === '--database' || arg === '--binding') {
      options.databaseBinding = readValue(argv[++index], arg);
    } else if (arg.startsWith('--database=')) {
      options.databaseBinding = readValue(arg.slice('--database='.length), '--database');
    } else if (arg.startsWith('--binding=')) {
      options.databaseBinding = readValue(arg.slice('--binding='.length), '--binding');
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function readValue(value, name) {
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function readPositiveInteger(value, name) {
  const parsed = Number(readValue(value, name));
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function readNonNegativeInteger(value, name) {
  const parsed = Number(readValue(value, name));
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }
  return parsed;
}

function printHelp() {
  console.log(`Analyze gallery image URLs and backfill hair thickness and hair colour.

Usage:
  OPENAI_API_KEY=... node scripts/analyze-gallery-hair-attributes.mjs [--local|--remote] [options]

Options:
  --local              Read/write the local Wrangler D1 database. Default.
  --remote             Read/write the remote Cloudflare D1 database.
  --force              Re-analyze rows that already have hair_thickness and hair_colour.
  --dry-run            Analyze and print output without updating D1.
  --limit <n>          Analyze at most n rows.
  --delay-ms <n>       Delay between OpenAI requests. Default: 300.
  --concurrency <n>    Number of images to analyze at the same time. Default: 3.
  --retries <n>        Retry failed rows before skipping them. Default: 2.
  --database <name>    D1 binding/database name. Default: DB.

Environment:
  OPENAI_API_KEY       Required unless --help is used. Can be set in .env.
  OPENAI_MODEL         Optional. Can be set in .env. Default: ${DEFAULT_MODEL}.`);
}

async function loadDotEnv() {
  let content = '';

  try {
    content = await readFile(new URL('../.env', import.meta.url), 'utf8');
  } catch {
    return;
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: REPO_ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}\n${stderr || stdout}`));
      }
    });
  });
}

function parseWranglerJson(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;

  const jsonStart = Math.min(
    ...[trimmed.indexOf('['), trimmed.indexOf('{')].filter((index) => index >= 0)
  );

  if (!Number.isFinite(jsonStart)) {
    throw new Error(`Wrangler did not return JSON:\n${stdout}`);
  }

  return JSON.parse(trimmed.slice(jsonStart));
}

async function runD1(sql, options) {
  const args = [
    'wrangler',
    'd1',
    'execute',
    options.databaseBinding,
    options.location === 'remote' ? '--remote' : '--local',
    '--json',
    '--command',
    sql
  ];
  const stdout = await runCommand('npx', args);
  return parseWranglerJson(stdout);
}

async function fetchRows(options) {
  const where = [
    "image_url IS NOT NULL",
    "TRIM(image_url) <> ''"
  ];

  if (!options.force) {
    where.push(`(
      hair_thickness IS NULL OR hair_thickness = '' OR
      hair_colour IS NULL OR hair_colour = ''
    )`);
  }

  const limitSql = options.limit ? ` LIMIT ${options.limit}` : '';
  const response = await runD1(
    `SELECT id, title, description, image_url, labels_json, features_json, hair_thickness, hair_colour
     FROM gallery_images
     WHERE ${where.join(' AND ')}
     ORDER BY created_at ASC${limitSql};`,
    options
  );

  return unwrapD1Results(response);
}

function unwrapD1Results(response) {
  if (Array.isArray(response)) {
    const item = response.find((entry) => Array.isArray(entry?.results));
    return item?.results || [];
  }

  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.result?.[0]?.results)) return response.result[0].results;
  return [];
}

function buildPrompt(row) {
  return `Analyze this hairstyle image for HairMatch.

Return only structured data matching the provided schema. Use the visible hair in the image as the source of truth.

Classify:
- hair_thickness: especially thin, thin, thick, or especially thick
- hair_colour: black, brown, blonde, red, grey, or other

Hair thickness guidance:
- especially thin: visibly sparse, very fine, low-density, scalp-visible, or delicate strands.
- thin: fine or lower-density hair, but not extremely sparse.
- thick: dense or coarse-looking hair with clear body and coverage.
- especially thick: very dense, voluminous, heavy, coarse, or abundant hair.

Hair colour guidance:
- Choose the dominant visible colour category.
- Use brown for brunette.
- Use grey for grey, gray, white, or silver hair.
- Use other for fantasy/dyed colours that are not mainly black, brown, blonde, red, or grey.

Existing gallery title: ${row.title || 'Untitled'}
Existing gallery description: ${row.description || ''}
Existing hair thickness: ${row.hair_thickness || ''}
Existing hair colour: ${row.hair_colour || ''}
Existing gallery image URL/source: ${row.image_url || ''}`;
}

async function analyzeImage(row, apiKey, model) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildPrompt(row)
            },
            {
              type: 'input_image',
              image_url: row.image_url
            }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'gallery_hair_attributes_analysis',
          strict: true,
          schema: HAIR_ATTRIBUTES_SCHEMA
        }
      }
    })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message || response.statusText;
    throw new Error(`OpenAI request failed for ${row.id}: ${message}`);
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error(`OpenAI response for ${row.id} did not include output text.`);
  }

  return validateAnalysis(JSON.parse(outputText));
}

function extractOutputText(value) {
  if (typeof value?.output_text === 'string') return value.output_text;

  const chunks = [];
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;

    if ((node.type === 'output_text' || node.type === 'text') && typeof node.text === 'string') {
      chunks.push(node.text);
    }

    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }

    for (const child of Object.values(node)) {
      visit(child);
    }
  };

  visit(value?.output);
  return chunks.join('').trim();
}

function validateAnalysis(value) {
  const hairThickness = String(value?.hair_thickness || '').trim().toLowerCase();
  const hairColour = String(value?.hair_colour || '').trim().toLowerCase();
  const validThickness = HAIR_ATTRIBUTES_SCHEMA.properties.hair_thickness.enum;
  const validColours = HAIR_ATTRIBUTES_SCHEMA.properties.hair_colour.enum;

  if (!validThickness.includes(hairThickness)) {
    throw new Error(`OpenAI output has invalid hair_thickness "${value?.hair_thickness}".`);
  }

  if (!validColours.includes(hairColour)) {
    throw new Error(`OpenAI output has invalid hair_colour "${value?.hair_colour}".`);
  }

  return {
    hair_thickness: hairThickness,
    hair_colour: hairColour
  };
}

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function parseJsonList(value) {
  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function mergeLabels(row, analysis) {
  const labels = [
    ...parseJsonList(row.labels_json),
    ...parseJsonList(row.features_json),
    analysis.hair_thickness,
    analysis.hair_colour
  ];
  const seen = new Set();

  return labels.filter((label) => {
    const trimmed = label.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function updateRow(row, analysis, model, options) {
  const labels = mergeLabels(row, analysis);
  const sql = `UPDATE gallery_images
SET
  hair_thickness = ${sqlString(analysis.hair_thickness)},
  hair_colour = ${sqlString(analysis.hair_colour)},
  labels_json = ${sqlString(JSON.stringify(labels))},
  analysis_model = ${sqlString(model)}
WHERE id = ${sqlString(row.id)};`;

  if (options.dryRun) {
    console.log(JSON.stringify({ id: row.id, title: row.title, analysis }, null, 2));
    return;
  }

  await runD1(sql, options);
}

async function withRetries(label, attempts, task) {
  let lastError = null;

  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) break;

      const delayMs = 1000 * 2 ** attempt;
      console.warn(`${label} failed, retrying in ${delayMs}ms: ${error.message}`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

async function processRow(row, index, total, apiKey, model, options) {
  console.log(`[${index + 1}/${total}] Checking ${row.id}: ${row.title || row.image_url}`);

  const analysis = await withRetries(
    `OpenAI hair attributes analysis for ${row.id}`,
    options.retries,
    () => analyzeImage(row, apiKey, model)
  );

  await withRetries(
    `D1 hair attributes update for ${row.id}`,
    options.retries,
    () => updateRow(row, analysis, model, options)
  );

  console.log(`[${index + 1}/${total}] ${row.id}: ${analysis.hair_thickness}, ${analysis.hair_colour}`);

  if (options.delayMs > 0) {
    await sleep(options.delayMs);
  }
}

async function processRows(rows, apiKey, model, options) {
  let nextIndex = 0;
  const failures = [];
  const workerCount = Math.min(options.concurrency, rows.length);

  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < rows.length) {
      const index = nextIndex;
      nextIndex += 1;

      try {
        await processRow(rows[index], index, rows.length, apiKey, model, options);
      } catch (error) {
        failures.push({
          id: rows[index].id,
          title: rows[index].title || '',
          error: error.message
        });
        console.error(`[${index + 1}/${rows.length}] Failed ${rows[index].id}: ${error.message}`);
      }
    }
  });

  await Promise.all(workers);
  return failures;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  await loadDotEnv();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required.');
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const rows = await fetchRows(options);

  console.log(`Found ${rows.length} gallery image row(s) to analyze for hair attributes in ${options.location} D1.`);
  const failures = await processRows(rows, apiKey, model, options);

  if (failures.length) {
    console.error(`Gallery hair attributes analysis finished with ${failures.length} failed row(s):`);
    for (const failure of failures) {
      console.error(`- ${failure.id}${failure.title ? ` (${failure.title})` : ''}: ${failure.error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    options.dryRun
      ? 'Dry run complete. No D1 rows were updated.'
      : 'Gallery hair attributes analysis complete.'
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
