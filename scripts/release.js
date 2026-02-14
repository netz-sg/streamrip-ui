#!/usr/bin/env node

/**
 * streamrip-ui — Interactive Release CLI
 *
 * Usage:
 *   cd desktop
 *   npm run release
 *
 * You'll be guided step-by-step through the release process.
 * Nothing is pushed until you confirm.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ── Paths ────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const DESKTOP_PKG = path.join(ROOT, 'desktop', 'package.json');
const FRONTEND_PKG = path.join(ROOT, 'desktop', 'frontend', 'package.json');
const CHANGELOG = path.join(ROOT, 'CHANGELOG.md');

// ── Colors (ANSI) ────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

// ── Readline ─────────────────────────────────────────────────────
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function close() {
  rl.close();
}

// ── Helpers ──────────────────────────────────────────────────────
function run(cmd) {
  console.log(`  ${c.dim}$ ${cmd}${c.reset}`);
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function runQuiet(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim();
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function bumpVersion(current, type) {
  const [ma, mi, pa] = current.split('.').map(Number);
  if (type === 'major') return `${ma + 1}.0.0`;
  if (type === 'minor') return `${ma}.${mi + 1}.0`;
  return `${ma}.${mi}.${pa + 1}`;
}

function getDate() {
  return new Date().toISOString().split('T')[0];
}

function getLatestVersion() {
  try {
    const tags = runQuiet('git tag --sort=-version:refname')
      .split('\n')
      .filter(t => /^v\d+\.\d+\.\d+$/.test(t))
      .map(t => t.replace(/^v/, ''));
    if (tags.length > 0) return tags[0];
  } catch { /* no tags */ }
  return readJson(DESKTOP_PKG).version;
}

function tagExists(tag) {
  try { runQuiet(`git rev-parse ${tag}`); return true; }
  catch { return false; }
}

function box(title, lines) {
  const w = 57;
  const hr = '\u2500'.repeat(w);
  console.log(`\n  ${c.cyan}\u256d${hr}\u256e${c.reset}`);
  if (title) {
    const clean = title.replace(/\x1b\[[0-9;]*m/g, '');
    console.log(`  ${c.cyan}\u2502${c.reset}  ${title}${' '.repeat(Math.max(0, w - clean.length - 2))}${c.cyan}\u2502${c.reset}`);
    console.log(`  ${c.cyan}\u251c${hr}\u2524${c.reset}`);
  }
  for (const line of lines) {
    const clean = line.replace(/\x1b\[[0-9;]*m/g, '');
    const pad = Math.max(0, w - clean.length - 2);
    console.log(`  ${c.cyan}\u2502${c.reset}  ${line}${' '.repeat(pad)}${c.cyan}\u2502${c.reset}`);
  }
  console.log(`  ${c.cyan}\u2570${hr}\u256f${c.reset}\n`);
}

// ══════════════════════════════════════════════════════════════════
// ── Main ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
async function main() {
  const currentVersion = getLatestVersion();

  box(`${c.bold}streamrip-ui Release${c.reset}`, [
    `${c.dim}Current version:${c.reset}  ${c.bold}v${currentVersion}${c.reset}`,
    '',
    `${c.dim}You'll be guided through the release.${c.reset}`,
    `${c.dim}Nothing is pushed until you confirm.${c.reset}`,
  ]);

  // ───────────────────────────────────────────────────────────────
  // Step 1: Choose version type
  // ───────────────────────────────────────────────────────────────
  const patchV = bumpVersion(currentVersion, 'patch');
  const minorV = bumpVersion(currentVersion, 'minor');
  const majorV = bumpVersion(currentVersion, 'major');

  console.log(`  ${c.bold}Which type of release?${c.reset}\n`);
  console.log(`    ${c.green}1${c.reset})  patch   ${c.dim}v${patchV}${c.reset}   ${c.dim}\u2500 Bug fixes, small changes${c.reset}`);
  console.log(`    ${c.yellow}2${c.reset})  minor   ${c.dim}v${minorV}${c.reset}   ${c.dim}\u2500 New features (backward compatible)${c.reset}`);
  console.log(`    ${c.red}3${c.reset})  major   ${c.dim}v${majorV}${c.reset}   ${c.dim}\u2500 Breaking changes${c.reset}`);
  console.log(`    ${c.magenta}4${c.reset})  custom  ${c.dim}........${c.reset}   ${c.dim}\u2500 Enter version manually${c.reset}`);
  console.log('');

  const typeChoice = await ask(`  ${c.cyan}\u25b8${c.reset} Choice ${c.dim}[1-4]${c.reset}: `);

  let newVersion;
  switch (typeChoice) {
    case '1': newVersion = patchV; break;
    case '2': newVersion = minorV; break;
    case '3': newVersion = majorV; break;
    case '4': {
      const custom = await ask(`  ${c.cyan}\u25b8${c.reset} Version ${c.dim}(X.Y.Z)${c.reset}: `);
      if (!/^\d+\.\d+\.\d+$/.test(custom)) {
        console.error(`\n  ${c.red}\u2717 Invalid format. Use X.Y.Z${c.reset}\n`);
        close(); process.exit(1);
      }
      newVersion = custom;
      break;
    }
    default:
      console.error(`\n  ${c.red}\u2717 Invalid choice.${c.reset}\n`);
      close(); process.exit(1);
  }

  const tag = `v${newVersion}`;
  if (tagExists(tag)) {
    console.error(`\n  ${c.red}\u2717 Tag ${tag} already exists!${c.reset}\n`);
    close(); process.exit(1);
  }

  console.log(`\n  ${c.green}\u2713${c.reset} Version: ${c.bold}${tag}${c.reset}\n`);

  // ───────────────────────────────────────────────────────────────
  // Step 2: Collect changes
  // ───────────────────────────────────────────────────────────────
  console.log(`  ${c.bold}What changed?${c.reset}  ${c.dim}Add entries, then press Enter on empty to finish.${c.reset}\n`);

  const changes = { features: [], fixes: [], other: [] };
  let entryCount = 0;

  while (true) {
    console.log(`    ${c.green}1${c.reset})  Feature     ${c.yellow}2${c.reset})  Bug Fix     ${c.magenta}3${c.reset})  Other     ${c.dim}Enter${c.reset}) Done`);
    const cat = await ask(`\n  ${c.cyan}\u25b8${c.reset} Type ${c.dim}[1/2/3/Enter]${c.reset}: `);

    if (cat === '') {
      if (entryCount === 0) {
        console.log(`  ${c.red}Add at least one change.${c.reset}\n`);
        continue;
      }
      break;
    }

    let label, key;
    if (cat === '1') { label = 'Feature'; key = 'features'; }
    else if (cat === '2') { label = 'Bug Fix'; key = 'fixes'; }
    else if (cat === '3') { label = 'Other'; key = 'other'; }
    else { console.log(`  ${c.red}Invalid, try 1/2/3 or Enter.${c.reset}\n`); continue; }

    const desc = await ask(`  ${c.cyan}\u25b8${c.reset} ${label}: `);
    if (desc) {
      changes[key].push(desc);
      entryCount++;
      console.log(`    ${c.green}\u2713${c.reset} ${c.dim}${label}:${c.reset} ${desc}\n`);
    }
  }

  // Build description string for commit message
  const allEntries = [];
  changes.features.forEach(f => allEntries.push(`feat: ${f}`));
  changes.fixes.forEach(f => allEntries.push(`fix: ${f}`));
  changes.other.forEach(o => allEntries.push(o));
  const description = allEntries.join(', ');

  // ───────────────────────────────────────────────────────────────
  // Step 3: Summary & confirm
  // ───────────────────────────────────────────────────────────────
  const summaryLines = [
    `${c.dim}Version:${c.reset}  ${c.bold}v${currentVersion}${c.reset} ${c.dim}\u2192${c.reset} ${c.green}${c.bold}v${newVersion}${c.reset}`,
    '',
  ];

  if (changes.features.length > 0) {
    summaryLines.push(`${c.green}Features:${c.reset}`);
    changes.features.forEach(f => summaryLines.push(`  ${c.green}+${c.reset} ${f}`));
  }
  if (changes.fixes.length > 0) {
    summaryLines.push(`${c.yellow}Bug Fixes:${c.reset}`);
    changes.fixes.forEach(f => summaryLines.push(`  ${c.yellow}~${c.reset} ${f}`));
  }
  if (changes.other.length > 0) {
    summaryLines.push(`${c.magenta}Other:${c.reset}`);
    changes.other.forEach(o => summaryLines.push(`  ${c.magenta}\u00b7${c.reset} ${o}`));
  }

  summaryLines.push('');
  summaryLines.push(`${c.dim}Actions:${c.reset}`);
  summaryLines.push(`  1. Update package.json versions`);
  summaryLines.push(`  2. Write CHANGELOG.md`);
  summaryLines.push(`  3. git commit + tag ${c.bold}${tag}${c.reset}`);
  summaryLines.push(`  4. git push \u2192 CI builds installers`);

  box('Release Summary', summaryLines);

  const confirm = await ask(`  ${c.cyan}\u25b8${c.reset} Publish release? ${c.dim}[Y/n]${c.reset}: `);
  if (confirm && !['y', 'yes', 'j', 'ja', ''].includes(confirm.toLowerCase())) {
    console.log(`\n  ${c.yellow}Aborted. Nothing was changed.${c.reset}\n`);
    close(); process.exit(0);
  }

  console.log('');

  // ───────────────────────────────────────────────────────────────
  // Execute
  // ───────────────────────────────────────────────────────────────
  console.log(`  ${c.cyan}[1/6]${c.reset} Updating package.json...`);
  const desktopPkg = readJson(DESKTOP_PKG);
  desktopPkg.version = newVersion;
  writeJson(DESKTOP_PKG, desktopPkg);
  const frontendPkg = readJson(FRONTEND_PKG);
  frontendPkg.version = newVersion;
  writeJson(FRONTEND_PKG, frontendPkg);

  console.log(`  ${c.cyan}[2/6]${c.reset} Writing CHANGELOG.md...`);
  let entry = `## [${newVersion}] - ${getDate()}\n\n`;
  if (changes.features.length > 0) {
    entry += '### Features\n';
    changes.features.forEach(f => { entry += `- ${f}\n`; });
    entry += '\n';
  }
  if (changes.fixes.length > 0) {
    entry += '### Bug Fixes\n';
    changes.fixes.forEach(f => { entry += `- ${f}\n`; });
    entry += '\n';
  }
  if (changes.other.length > 0) {
    entry += '### Other\n';
    changes.other.forEach(o => { entry += `- ${o}\n`; });
    entry += '\n';
  }

  if (fs.existsSync(CHANGELOG)) {
    const existing = fs.readFileSync(CHANGELOG, 'utf-8');
    const idx = existing.indexOf('\n');
    if (idx !== -1 && existing.startsWith('# Changelog')) {
      fs.writeFileSync(CHANGELOG, existing.substring(0, idx + 1) + '\n' + entry + existing.substring(idx + 1), 'utf-8');
    } else {
      fs.writeFileSync(CHANGELOG, `# Changelog\n\n${entry}${existing}`, 'utf-8');
    }
  } else {
    fs.writeFileSync(CHANGELOG, `# Changelog\n\n${entry}`, 'utf-8');
  }

  console.log(`  ${c.cyan}[3/6]${c.reset} Staging changes...`);
  run('git add -A');

  console.log(`  ${c.cyan}[4/6]${c.reset} Committing...`);
  const msg = `release: v${newVersion} \u2014 ${description}`;
  run(`git commit -m "${msg.replace(/"/g, '\\"')}"`);

  console.log(`  ${c.cyan}[5/6]${c.reset} Tagging ${c.bold}${tag}${c.reset}...`);
  const tagMsg = `Release ${tag}: ${description}`;
  run(`git tag -a ${tag} -m "${tagMsg.replace(/"/g, '\\"')}"`);

  console.log(`  ${c.cyan}[6/6]${c.reset} Pushing...`);
  run('git push origin main');
  run(`git push origin ${tag}`);

  box(`${c.green}\u2713${c.reset}  Release ${c.bold}${tag}${c.reset} published!`, [
    '',
    'CI is now building the installers.',
    '',
    `${c.dim}Progress:${c.reset}  github.com/netz-sg/streamrip-ui/actions`,
    `${c.dim}Release:${c.reset}   github.com/netz-sg/streamrip-ui/releases`,
    '',
  ]);

  close();
}

main().catch((err) => {
  console.error(`\n  ${c.red}\u2717 Release failed:${c.reset} ${err.message}\n`);
  close();
  process.exit(1);
});
