#!/usr/bin/env node
// COMANDOS Security Audit — dependency vulnerability check
// Zero-dependency wrapper. Detects the project ecosystem and runs the right
// native auditor (npm / pnpm / yarn / pip-audit), then summarizes.
// Usage: node scripts/deps-audit.mjs [path]   (default: current dir)
// Read-only. Does NOT install or modify anything (uses --package-lock-only style flags).

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.argv[2] || '.';
const has = (f) => existsSync(join(ROOT, f));

function run(cmd) {
  try {
    return { ok: true, out: execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 }) };
  } catch (e) {
    // auditors exit non-zero when vulns are found — that's expected, capture stdout
    return { ok: false, out: (e.stdout || '') + (e.stderr || ''), code: e.status };
  }
}

function cmdExists(bin) {
  try { execSync(process.platform === 'win32' ? `where ${bin}` : `command -v ${bin}`, { stdio: 'ignore' }); return true; }
  catch { return false; }
}

const report = { ecosystem: null, ran: null, summary: null, note: null, raw: '' };

console.log('\n=== COMANDOS Security Audit — Dependency Check ===');
console.log(`Scanned: ${ROOT}\n`);

// --- Node ecosystem --------------------------------------------------------
if (has('package.json')) {
  report.ecosystem = 'node';
  let mgr = 'npm';
  if (has('pnpm-lock.yaml')) mgr = 'pnpm';
  else if (has('yarn.lock')) mgr = 'yarn';

  if (!cmdExists(mgr) && mgr !== 'npm') mgr = cmdExists('npm') ? 'npm' : mgr;

  let res;
  // Use --json only. run() captures stdout even on non-zero exit (auditors exit 1
  // when vulns exist). Do NOT append a text fallback — it would corrupt the JSON.
  if (mgr === 'pnpm') res = run('pnpm audit --json');
  else if (mgr === 'yarn') res = run('yarn npm audit --json');
  else res = run('npm audit --json');

  report.ran = `${mgr} audit`;
  report.raw = res.out.slice(0, 20000);

  // try to parse npm --json shape
  try {
    const j = JSON.parse(res.out);
    const v = j.metadata?.vulnerabilities || j.vulnerabilities && countAdvisories(j);
    if (v) {
      report.summary = v;
      const total = (v.critical || 0) + (v.high || 0) + (v.moderate || 0) + (v.low || 0) + (v.info || 0);
      console.log(`Ecosystem: Node (${mgr})`);
      console.log(`Vulnerabilities: ${v.critical || 0} critical · ${v.high || 0} high · ${v.moderate || 0} moderate · ${v.low || 0} low`);
      console.log(total === 0 ? '✅ No known vulnerable dependencies.\n' : '🔴 Run `' + mgr + ' audit fix` and review — details below.\n');
    } else {
      console.log(`Ecosystem: Node (${mgr}). Could not parse JSON; raw output below.\n`);
    }
  } catch {
    console.log(`Ecosystem: Node (${mgr}). Text output (no lockfile → may be limited):\n`);
    console.log(res.out.slice(0, 3000));
  }
  if (!has('package-lock.json') && !has('pnpm-lock.yaml') && !has('yarn.lock')) {
    report.note = 'No lockfile found — audit may be incomplete. Recommend committing a lockfile.';
    console.log('⚠️  ' + report.note + '\n');
  }
}

// --- Python ecosystem ------------------------------------------------------
else if (has('requirements.txt') || has('pyproject.toml') || has('Pipfile')) {
  report.ecosystem = 'python';
  if (cmdExists('pip-audit')) {
    const res = run('pip-audit 2>&1 || true');
    report.ran = 'pip-audit';
    report.raw = res.out.slice(0, 20000);
    console.log('Ecosystem: Python (pip-audit)\n');
    console.log(res.out.slice(0, 4000));
  } else {
    report.note = 'pip-audit not installed. Install with: pip install pip-audit  (then re-run).';
    console.log('Ecosystem: Python.');
    console.log('⚠️  ' + report.note);
    console.log('   Alternative: `pip install safety && safety check`\n');
  }
}

// --- Other / unknown -------------------------------------------------------
else {
  report.ecosystem = 'unknown';
  report.note = 'No package.json / requirements.txt / pyproject.toml / Pipfile found.';
  console.log('No recognized dependency manifest found.');
  console.log('If this project uses Go (go.mod → `govulncheck`), Rust (Cargo.lock → `cargo audit`),');
  console.log('PHP (composer.lock → `composer audit`) or Ruby (Gemfile.lock → `bundle audit`),');
  console.log('run the matching tool. See references/dependencies.md.\n');
}

function countAdvisories(j) {
  const c = { critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
  for (const k of Object.keys(j.vulnerabilities || {})) {
    const sev = j.vulnerabilities[k].severity;
    if (c[sev] != null) c[sev]++;
  }
  return c;
}

console.log('---JSON---');
console.log(JSON.stringify({ ecosystem: report.ecosystem, ran: report.ran, summary: report.summary, note: report.note }, null, 2));
