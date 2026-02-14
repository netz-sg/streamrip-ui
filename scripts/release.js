#!/usr/bin/env node

/**
 * streamrip-ui Release Script
 *
 * Usage:
 *   npm run release -- <version> "<description>"
 *
 * Examples:
 *   npm run release -- 1.2.0 "feat: multi-source search, fix: progress bar"
 *   npm run release -- patch "fix: correct progress calculation"
 *   npm run release -- minor "feat: add drag & drop support"
 *   npm run release -- major "feat!: redesigned settings UI"
 *
 * Version can be:
 *   - Explicit: 1.2.0, 2.0.0, 1.0.3
 *   - Shorthand: patch, minor, major (auto-increments from current version)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Paths ────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const DESKTOP_PKG = path.join(ROOT, 'desktop', 'package.json');
const FRONTEND_PKG = path.join(ROOT, 'desktop', 'frontend', 'package.json');
const CHANGELOG = path.join(ROOT, 'CHANGELOG.md');

// ── Helpers ──────────────────────────────────────────────────────
function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
}

function runQuiet(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
    default: return null;
  }
}

function getDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the latest version from git tags, falling back to package.json.
 * This ensures we always bump from the highest existing version,
 * even if package.json is out of sync with the tags.
 */
function getLatestVersion() {
  try {
    const tags = runQuiet('git tag --sort=-version:refname')
      .split('\n')
      .filter(t => /^v\d+\.\d+\.\d+$/.test(t))
      .map(t => t.replace(/^v/, ''));

    if (tags.length > 0) {
      return tags[0]; // Already sorted descending
    }
  } catch {
    // No tags exist yet
  }
  // Fall back to package.json
  return readJson(DESKTOP_PKG).version;
}

// ── Parse args ───────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(`
  ╭─────────────────────────────────────────────────────────╮
  │  streamrip-ui Release Script                            │
  ├─────────────────────────────────────────────────────────┤
  │                                                         │
  │  Usage:                                                 │
  │    npm run release -- <version> "<description>"         │
  │                                                         │
  │  Version:                                               │
  │    1.2.0          Explicit version                      │
  │    patch          Auto-bump patch  (1.0.0 → 1.0.1)     │
  │    minor          Auto-bump minor  (1.0.0 → 1.1.0)     │
  │    major          Auto-bump major  (1.0.0 → 2.0.0)     │
  │                                                         │
  │  Examples:                                              │
  │    npm run release -- patch "fix: progress bar"         │
  │    npm run release -- 1.2.0 "feat: drag & drop"        │
  │    npm run release -- minor "feat: new search, fix: ui" │
  │                                                         │
  ╰─────────────────────────────────────────────────────────╯
`);
  process.exit(1);
}

const versionArg = args[0];
const description = args.slice(1).join(' ');

// ── Resolve version ──────────────────────────────────────────────
const desktopPkg = readJson(DESKTOP_PKG);
const currentVersion = getLatestVersion();

let newVersion;
if (['patch', 'minor', 'major'].includes(versionArg)) {
  newVersion = bumpVersion(currentVersion, versionArg);
} else if (/^\d+\.\d+\.\d+$/.test(versionArg)) {
  newVersion = versionArg;
} else {
  console.error(`\n  ✗ Invalid version: "${versionArg}". Use patch/minor/major or X.Y.Z\n`);
  process.exit(1);
}

const tag = `v${newVersion}`;

// ── Check for uncommitted changes ────────────────────────────────
const status = runQuiet('git status --porcelain');
const hasChanges = status.length > 0;

// ── Check if tag exists ──────────────────────────────────────────
try {
  runQuiet(`git rev-parse ${tag}`);
  console.error(`\n  ✗ Tag ${tag} already exists. Choose a different version.\n`);
  process.exit(1);
} catch {
  // Tag doesn't exist — good
}

// ── Log plan ─────────────────────────────────────────────────────
console.log(`
  ╭─────────────────────────────────────────────────────────╮
  │  streamrip-ui Release                                   │
  ├─────────────────────────────────────────────────────────┤
  │  Current version:  ${currentVersion.padEnd(37)}│
  │  New version:      ${newVersion.padEnd(37)}│
  │  Tag:              ${tag.padEnd(37)}│
  │  Description:      ${description.substring(0, 37).padEnd(37)}│
  ╰─────────────────────────────────────────────────────────╯
`);

// ── Step 1: Update package.json versions ─────────────────────────
console.log('  [1/6] Updating package.json versions...');
desktopPkg.version = newVersion;
writeJson(DESKTOP_PKG, desktopPkg);

const frontendPkg = readJson(FRONTEND_PKG);
frontendPkg.version = newVersion;
writeJson(FRONTEND_PKG, frontendPkg);

// ── Step 2: Update CHANGELOG.md ──────────────────────────────────
console.log('  [2/6] Updating CHANGELOG.md...');

// Parse description into categories
const entries = description.split(',').map(s => s.trim()).filter(Boolean);
const features = [];
const fixes = [];
const other = [];

for (const entry of entries) {
  if (/^feat[:(]/i.test(entry)) {
    features.push(entry.replace(/^feat[:(]\s*/i, '').replace(/\)?\s*$/, ''));
  } else if (/^fix[:(]/i.test(entry)) {
    fixes.push(entry.replace(/^fix[:(]\s*/i, '').replace(/\)?\s*$/, ''));
  } else {
    other.push(entry);
  }
}

let changelogEntry = `## [${newVersion}] - ${getDate()}\n\n`;

if (features.length > 0) {
  changelogEntry += '### Features\n';
  features.forEach(f => { changelogEntry += `- ${f}\n`; });
  changelogEntry += '\n';
}
if (fixes.length > 0) {
  changelogEntry += '### Bug Fixes\n';
  fixes.forEach(f => { changelogEntry += `- ${f}\n`; });
  changelogEntry += '\n';
}
if (other.length > 0) {
  changelogEntry += '### Other\n';
  other.forEach(o => { changelogEntry += `- ${o}\n`; });
  changelogEntry += '\n';
}

if (fs.existsSync(CHANGELOG)) {
  const existing = fs.readFileSync(CHANGELOG, 'utf-8');
  // Insert after the header line
  const headerEnd = existing.indexOf('\n');
  if (headerEnd !== -1 && existing.startsWith('# Changelog')) {
    const newChangelog = existing.substring(0, headerEnd + 1) + '\n' + changelogEntry + existing.substring(headerEnd + 1);
    fs.writeFileSync(CHANGELOG, newChangelog, 'utf-8');
  } else {
    fs.writeFileSync(CHANGELOG, `# Changelog\n\n${changelogEntry}${existing}`, 'utf-8');
  }
} else {
  fs.writeFileSync(CHANGELOG, `# Changelog\n\n${changelogEntry}`, 'utf-8');
}

// ── Step 3: Git add ──────────────────────────────────────────────
console.log('  [3/6] Staging all changes...');
run('git add -A');

// ── Step 4: Git commit ───────────────────────────────────────────
console.log('  [4/6] Committing...');
const commitMsg = `release: v${newVersion} — ${description}`;
run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);

// ── Step 5: Create tag ───────────────────────────────────────────
console.log('  [5/6] Creating tag...');
run(`git tag -a ${tag} -m "Release ${tag}: ${description.replace(/"/g, '\\"')}"`);

// ── Step 6: Push ────────────────────────────────────────────────
console.log('  [6/6] Pushing to origin...');
run('git push origin main');
run(`git push origin ${tag}`);

// ── Done ─────────────────────────────────────────────────────────
console.log(`
  ╭─────────────────────────────────────────────────────────╮
  │  ✓  Release ${tag} published!${' '.repeat(Math.max(0, 32 - tag.length))}│
  │                                                         │
  │  CI is now building the installers.                     │
  │  Check progress:                                        │
  │  → github.com/netz-sg/streamrip-ui/actions              │
  │                                                         │
  │  Release will appear at:                                │
  │  → github.com/netz-sg/streamrip-ui/releases             │
  ╰─────────────────────────────────────────────────────────╯
`);
