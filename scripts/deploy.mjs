#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'dist');
const MONOREPO_ROOT = resolve(ROOT, '..');

const LANDING_DEMO_DIR = join(MONOREPO_ROOT, 'proxy-landing', 'public', 'demo');
const DASHBOARD_DEMO_DIR = join(MONOREPO_ROOT, 'proxy-dashboard', 'public', 'demo');

const DEPLOYMENT_LANDING_DEMO_DIR = join(MONOREPO_ROOT, 'DEPLOYMENT', 'proxy-landing', 'public', 'demo');
const DEPLOYMENT_DASHBOARD_DEMO_DIR = join(MONOREPO_ROOT, 'DEPLOYMENT', 'proxy-dashboard', 'public', 'demo');

console.log('[proxy-demo:deploy] Building proxy-demo with Vite...');
execSync('npx vite build', { cwd: ROOT, stdio: 'inherit' });

const indexHtmlPath = join(DIST, 'index.html');
if (!existsSync(indexHtmlPath)) {
  console.error('[proxy-demo:deploy] Error: dist/index.html was not generated!');
  process.exit(1);
}

function deployToDirectory(targetDir, label) {
  if (existsSync(targetDir)) {
    rmSync(targetDir, { recursive: true, force: true });
  }
  mkdirSync(targetDir, { recursive: true });
  cpSync(DIST, targetDir, { recursive: true });
  console.log(`[proxy-demo:deploy] Deployed -> ${label}`);
}

// 1. Deploy to proxy-landing/public/demo
deployToDirectory(LANDING_DEMO_DIR, 'proxy-landing/public/demo');

// 2. Deploy to proxy-dashboard/public/demo
deployToDirectory(DASHBOARD_DEMO_DIR, 'proxy-dashboard/public/demo');

// 3. Mirror to DEPLOYMENT targets if folders exist
if (existsSync(dirname(DEPLOYMENT_LANDING_DEMO_DIR))) {
  deployToDirectory(DEPLOYMENT_LANDING_DEMO_DIR, 'DEPLOYMENT/proxy-landing/public/demo');
}
if (existsSync(dirname(DEPLOYMENT_DASHBOARD_DEMO_DIR))) {
  deployToDirectory(DEPLOYMENT_DASHBOARD_DEMO_DIR, 'DEPLOYMENT/proxy-dashboard/public/demo');
}

console.log('[proxy-demo:deploy] Deployment complete.');
