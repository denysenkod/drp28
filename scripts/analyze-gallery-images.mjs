#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const DEFAULT_MODEL = 'gpt-5-mini-2025-08-07';
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    hair_type: {
      type: 'string',
      description: 'Broad visible curl pattern category for the hairstyle.',
      enum: ['straight', 'wavy', 'curly', 'coily']
    },
    hair_subtype: {
      type: 'string',
      description: 'Detailed Andre Walker hair typing subtype: 1A-1C straight, 2A-2C wavy, 3A-3C curly, 4A-4C coily.',
      enum: ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C']
    },
    length: {
      type: 'string',
      description: 'Visible hair length category based on where the hair falls on the head, neck, shoulders, or below.',
      enum: ['very short', 'short', 'medium', 'long', 'very long']
    },
    face_shape: {
      type: 'string',
      description: 'Best estimate of the visible face shape in the image.',
      enum: ['oval', 'round', 'square', 'heart', 'diamond', 'rectangle', 'triangle']
    },
    gender: {
      type: 'string',
      description: 'Presentation category for the hairstyle in the image.',
      enum: ['male', 'female']
    },
    upkeep: {
      type: 'string',
      description: 'Estimated maintenance difficulty for keeping this haircut styled day to day.',
      enum: ['low', 'medium', 'high']
    },
    haircut_name: {
      type: 'string',
      description: 'Short salon-friendly name for the haircut or hairstyle.'
    },
    hair_colour: {
      type: 'string',
      description: 'Concise visible hair color, including notable tones such as blonde, brunette, black, red, silver, balayage, highlighted, or dyed.'
    },
    vibe: {
      type: 'string',
      description: 'Overall style impression conveyed by the haircut.',
      enum: ['casual', 'professional', 'classic', 'bold', 'soft', 'natural', 'playful']
    },
    maintenance: {
      type: 'string',
      description: 'Exactly two practical sentences explaining how to maintain this haircut or hairstyle.'
    }
  },
  required: [
    'hair_type',
    'hair_subtype',
    'length',
    'face_shape',
    'gender',
    'upkeep',
    'haircut_name',
    'hair_colour',
    'vibe',
    'maintenance'
  ]
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
  console.log(`Analyze gallery image URLs with OpenAI and write attributes back to D1.

Usage:
  OPENAI_API_KEY=... node scripts/analyze-gallery-images.mjs [--local|--remote] [options]

Options:
  --local              Read/write the local Wrangler D1 database. Default.
  --remote             Read/write the remote Cloudflare D1 database.
  --force              Re-analyze rows that already have classified_at.
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
    where.push("(classified_at IS NULL OR classified_at = '')");
  }

  const limitSql = options.limit ? ` LIMIT ${options.limit}` : '';
  const response = await runD1(
    `SELECT id, title, image_url, labels_json, features_json, classified_at
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

Return only structured data matching the provided schema. Use the visible hairstyle as the source of truth.

Classify:
- hair_type: straight, wavy, curly, or coily
- hair_subtype: 1A, 1B, or 1C for straight hair; 2A, 2B, or 2C for wavy hair; 3A, 3B, or 3C for curly hair; 4A, 4B, or 4C for coily hair
- length: very short, short, medium, long, or very long
- face_shape: oval, round, square, heart, diamond, rectangle, or triangle
- gender: male or female
- upkeep: low, medium, or high
- haircut_name: concise salon-friendly haircut name
- hair_colour: concise visible hair colour
- vibe: casual, professional, classic, bold, soft, natural, or playful
- maintenance: exactly two sentences explaining how to maintain it

Hair Subtype guidance:
- 1A is very straight/fine, 1B is straight with medium body, 1C is straight/coarser with slight bend.
- 2A is loose waves, 2B is defined S-waves, 2C is strong waves with some curl.
- 3A is loose curls, 3B is springy ringlets, 3C is tight corkscrew curls.
- 4A is tight S-shaped coils, 4B is dense zig-zag coils, 4C is the tightest densely packed coil pattern.

Existing gallery title: ${row.title || 'Untitled'}`;
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
          name: 'haircut_image_analysis',
          strict: true,
          schema: ANALYSIS_SCHEMA
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
  const keys = ANALYSIS_SCHEMA.required;
  for (const key of keys) {
    if (typeof value?.[key] !== 'string' || !value[key].trim()) {
      throw new Error(`OpenAI output is missing "${key}".`);
    }
  }

  return Object.fromEntries(keys.map((key) => [key, value[key].trim()]));
}

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function normalizeUiGender(value) {
  return value === 'male' ? 'Men' : 'Women';
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
    analysis.hair_type,
    analysis.hair_subtype,
    analysis.length,
    analysis.face_shape,
    analysis.gender,
    analysis.upkeep,
    analysis.haircut_name,
    analysis.hair_colour,
    analysis.vibe
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
  hair_type = ${sqlString(analysis.hair_type)},
  hair_subtype = ${sqlString(analysis.hair_subtype)},
  length = ${sqlString(analysis.length)},
  face_shape = ${sqlString(analysis.face_shape)},
  upkeep = ${sqlString(analysis.upkeep)},
  haircut_name = ${sqlString(analysis.haircut_name)},
  hair_colour = ${sqlString(analysis.hair_colour)},
  vibe = ${sqlString(analysis.vibe)},
  maintenance = ${sqlString(analysis.maintenance)},
  analysis_model = ${sqlString(model)},
  classified_at = CURRENT_TIMESTAMP,
  gender = ${sqlString(normalizeUiGender(analysis.gender))},
  labels_json = ${sqlString(JSON.stringify(labels))}
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
  console.log(`[${index + 1}/${total}] Analyzing ${row.id}: ${row.title || row.image_url}`);

  const analysis = await withRetries(
    `OpenAI analysis for ${row.id}`,
    options.retries,
    () => analyzeImage(row, apiKey, model)
  );

  await withRetries(
    `D1 update for ${row.id}`,
    options.retries,
    () => updateRow(row, analysis, model, options)
  );

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

  console.log(`Found ${rows.length} gallery image row(s) to analyze in ${options.location} D1.`);
  const failures = await processRows(rows, apiKey, model, options);

  if (failures.length) {
    console.error(`Gallery image analysis finished with ${failures.length} failed row(s):`);
    for (const failure of failures) {
      console.error(`- ${failure.id}${failure.title ? ` (${failure.title})` : ''}: ${failure.error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(options.dryRun ? 'Dry run complete. No D1 rows were updated.' : 'Gallery image analysis complete.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
