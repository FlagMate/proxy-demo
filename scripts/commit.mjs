#!/usr/bin/env node
/**
 * commit — mirror proxy-demo into VERSION-CONTROL/proxy-demo and push to `main`.
 * Copy-only (excludes node_modules, dist, and .git).
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEST_REL = '../VERSION-CONTROL/proxy-demo';
const BRANCH = 'main';

const folderRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = folderRoot;
const dest = path.resolve(folderRoot, DEST_REL);
const message = process.argv.slice(2).join(' ') || `feat(proxy-demo): sync v2.5.0 ${new Date().toISOString()}`;
const SKIP = new Set(['node_modules', 'dist', '.git']);

if (!existsSync(dest)) {
  mkdirSync(dest, { recursive: true });
}

const git = (args, opts = {}) => spawnSync('git', ['-C', dest, ...args], { encoding: 'utf8', ...opts });

// Initialize git repo in destination if needed
if (!existsSync(path.join(dest, '.git'))) {
  console.log(`[commit] initializing git repo at ${dest}`);
  git(['init', '-b', BRANCH]);
  git(['remote', 'add', 'origin', 'https://github.com/FlagMate/proxy-demo.git']);
}

console.log(`[commit] copy ${path.basename(src)} -> ${DEST_REL}`);
cpSync(src, dest, { recursive: true, force: true, filter: (from) => !SKIP.has(path.basename(from)) });

let co = git(['checkout', BRANCH]);
if (co.status !== 0) {
  console.log(`[commit] creating branch ${BRANCH}`);
  co = git(['checkout', '-B', BRANCH]);
}
if (co.status !== 0) {
  console.error(co.stderr || co.stdout);
  process.exit(1);
}

git(['add', '-A']);
if (!git(['status', '--porcelain']).stdout.trim()) {
  console.log('[commit] no changes — done.');
  process.exit(0);
}

console.log(`[commit] commit: ${message}`);
const c = git(['commit', '-m', message]);
if (c.status !== 0) {
  console.error(c.stderr || c.stdout);
  process.exit(1);
}

console.log(`[commit] push origin ${BRANCH}`);
const p = git(['push', '-u', 'origin', BRANCH], { stdio: 'inherit' });
if (p.status !== 0) {
  console.warn('[commit] push warning (saved locally). Remote might need authentication or manual token.');
}
console.log('[commit] done.');
