#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const DEFAULT_MODEL = 'gpt-5-mini-2025-08-07';
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

const CELEBRITY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    celebrity: {
      type: 'string',
      description:
        'Exact public figure, celebrity, actor, musician, athlete, influencer, model, politician, or otherwise notable person name if confidently identifiable; otherwise exactly "none".'
    }
  },
  required: ['celebrity']
};

function parseArgs(argv) {
  const options = {
    databaseBinding: 'DB',
    dryRun: false,
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
  console.log(`Analyze gallery image URLs and backfill celebrity names only for rows currently set to "none".

Usage:
  OPENAI_API_KEY=... node scripts/analyze-gallery-celebrities.mjs [--local|--remote] [options]

Options:
  --local              Read/write the local Wrangler D1 database. Default.
  --remote             Read/write the remote Cloudflare D1 database.
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
  const limitSql = options.limit ? ` LIMIT ${options.limit}` : '';
  const response = await runD1(
    `SELECT id, title, description, image_url, labels_json, celebrity
     FROM gallery_images
     WHERE image_url IS NOT NULL
       AND TRIM(image_url) <> ''
       AND LOWER(TRIM(celebrity)) = 'none'
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
  return `Analyze this gallery image for HairMatch.

Return only structured data matching the provided schema.

Goal:
- If the image clearly shows, or the row context clearly identifies, a real public figure, celebrity, actor, athlete, musician, model, influencer, politician, or other notable person, return that person's commonly used full name.
- If the person is not confidently identifiable as a public figure, return exactly "none".
- Do not guess from resemblance. Only return a name when you are confident.
- If multiple people are visible, return the most prominent public figure only when confidently identifiable; otherwise return "none".

Existing gallery title: ${row.title || 'Untitled'}
Existing gallery description: ${row.description || ''}
Existing current celebrity value: ${row.celebrity || ''}
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
          name: 'gallery_celebrity_analysis',
          strict: true,
          schema: CELEBRITY_SCHEMA
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
  if (typeof value?.celebrity !== 'string' || !value.celebrity.trim()) {
    throw new Error('OpenAI output is missing "celebrity".');
  }

  return {
    celebrity: normalizeCelebrity(value.celebrity)
  };
}

function normalizeCelebrity(value) {
  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase();
  if (
    [
      'none',
      'no',
      'unknown',
      'n/a',
      'na',
      'not a celebrity',
      'not celebrity',
      'not identifiable',
      'unidentified'
    ].includes(normalized)
  ) {
    return 'none';
  }
  return trimmed;
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

function mergeCelebrityLabel(row, celebrity) {
  const labels = [...parseJsonList(row.labels_json), celebrity];
  const seen = new Set();

  return labels.filter((label) => {
    const trimmed = label.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function updateRow(row, analysis, options) {
  if (analysis.celebrity === 'none') {
    if (options.dryRun) {
      console.log(JSON.stringify({ id: row.id, title: row.title, celebrity: 'none', action: 'skip' }, null, 2));
    }
    return false;
  }

  const labels = mergeCelebrityLabel(row, analysis.celebrity);
  const sql = `UPDATE gallery_images
SET
  celebrity = ${sqlString(analysis.celebrity)},
  labels_json = ${sqlString(JSON.stringify(labels))}
WHERE id = ${sqlString(row.id)}
  AND LOWER(TRIM(celebrity)) = 'none';`;

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        { id: row.id, title: row.title, celebrity: analysis.celebrity, action: 'update' },
        null,
        2
      )
    );
    return true;
  }

  await runD1(sql, options);
  return true;
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
    `OpenAI celebrity analysis for ${row.id}`,
    options.retries,
    () => analyzeImage(row, apiKey, model)
  );

  const updated = await withRetries(
    `D1 celebrity update for ${row.id}`,
    options.retries,
    () => updateRow(row, analysis, options)
  );

  if (updated) {
    console.log(`[${index + 1}/${total}] ${row.id}: ${analysis.celebrity}`);
  } else {
    console.log(`[${index + 1}/${total}] ${row.id}: no public figure found`);
  }

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

  console.log(`Found ${rows.length} gallery image row(s) with celebrity = "none" in ${options.location} D1.`);
  const failures = await processRows(rows, apiKey, model, options);

  if (failures.length) {
    console.error(`Gallery celebrity analysis finished with ${failures.length} failed row(s):`);
    for (const failure of failures) {
      console.error(`- ${failure.id}${failure.title ? ` (${failure.title})` : ''}: ${failure.error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    options.dryRun
      ? 'Dry run complete. No D1 rows were updated.'
      : 'Gallery celebrity analysis complete.'
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
