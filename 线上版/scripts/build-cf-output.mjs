#!/usr/bin/env node
/**
 * Builds Cloudflare Build Output Specification v0 at 线上版/.cloudflare/output/v0/
 * for zero-dependency deployment via `cf deploy --prebuilt`.
 *
 * Usage:
 *   node scripts/build-cf-output.mjs --kv-id <KV_NAMESPACE_ID> [--account-id <ACCOUNT_ID>]
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_V0 = path.join(ROOT, '.cloudflare', 'output', 'v0');
const WORKER_DIR = path.join(OUT_V0, 'workers', 'default');
const BUNDLE_DIR = path.join(WORKER_DIR, 'bundle');
const ASSETS_DIR = path.join(WORKER_DIR, 'assets');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--') && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      out[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const kvId = args['kv-id'] || process.env.CF_STUDY_KV_ID || '';
  const accountId = args['account-id'] || process.env.CLOUDFLARE_ACCOUNT_ID || undefined;
  const workerName = args.name || 'liora-study-hall';

  // Clean output directory
  await fsp.rm(OUT_V0, { recursive: true, force: true });
  await fsp.mkdir(BUNDLE_DIR, { recursive: true });
  await fsp.mkdir(ASSETS_DIR, { recursive: true });

  // 1. Copy Worker module into bundle/
  await fsp.copyFile(path.join(ROOT, 'cloudflare', 'worker.js'), path.join(BUNDLE_DIR, 'index.js'));

  // 2. Copy static assets from public/ (excluding any accidental local data/ or auth files)
  await fsp.cp(path.join(ROOT, 'public'), ASSETS_DIR, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(path.join(ROOT, 'public'), src);
      if (!rel) return true;
      if (rel === 'data' || rel.startsWith('data' + path.sep)) return false;
      if (path.basename(rel) === '.DS_Store') return false;
      return true;
    }
  });

  // 3. Write root config.json
  const rootConfig = {
    ...(accountId ? { accountId } : {}),
    buildContext: { isPreview: false }
  };
  await fsp.writeFile(path.join(OUT_V0, 'config.json'), JSON.stringify(rootConfig, null, 2));

  // 4. Write workers/default/worker.config.json
  const envBindings = {
    ASSETS: { type: 'assets' },
    AUTH_USER: { type: 'secret' },
    AUTH_PASS_HASH: { type: 'secret' },
    SESSION_SECRET: { type: 'secret' }
  };
  if (kvId) {
    envBindings.STUDY_KV = { type: 'kv', id: kvId };
  }

  const workerConfig = {
    name: workerName,
    compatibilityDate: '2026-11-23',
    compatibilityFlags: [],
    workersDev: true,
    previewUrls: false,
    observability: {
      enabled: true,
      headSamplingRate: 1,
      logs: { enabled: true, invocationLogs: true },
      traces: { enabled: true }
    },
    assets: {
      htmlHandling: 'none',
      notFoundHandling: 'none',
      runWorkerFirst: true
    },
    env: envBindings,
    manifest: {
      type: 'partial',
      mainModule: 'index.js',
      modules: {}
    }
  };
  await fsp.writeFile(path.join(WORKER_DIR, 'worker.config.json'), JSON.stringify(workerConfig, null, 2));

  const assetFiles = [];
  (function walk(d) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else assetFiles.push(full);
    }
  })(ASSETS_DIR);

  console.log(`Built Cloudflare Output v0 -> ${OUT_V0}`);
  console.log(`Worker: ${workerName} | KV bound: ${kvId ? kvId : '(none - dry-run)'} | Static assets: ${assetFiles.length} files`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
