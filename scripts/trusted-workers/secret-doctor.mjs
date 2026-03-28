#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const workspace = process.cwd();
const manifestPath = path.join(workspace, 'config', 'trusted-workers', 'secrets.manifest.json');

function readManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Secret manifest not found at ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function envName() {
  const raw = (process.env.ATOM_ENV || process.env.NODE_ENV || 'development').toLowerCase();
  if (raw === 'prod') return 'production';
  if (raw === 'stage') return 'preview';
  return raw;
}

function isRequired(item, currentEnv) {
  return Array.isArray(item.requiredIn) && item.requiredIn.includes(currentEnv);
}

function explainMissing(secret, currentEnv) {
  const lines = [];
  lines.push(`What happened: ${secret.name} is missing for ${currentEnv}.`);
  lines.push(`Why it matters: ${secret.plainEnglish} ${secret.ifMissing}`);
  lines.push('Choices:');
  lines.push(`1) Best choice — add it securely now with: ${secret.safeAddCommand}`);
  lines.push('   Consequence: the feature should work normally and the secret stays out of Git history.');
  lines.push('2) Fastest choice — disable or hide the affected feature temporarily.');
  lines.push('   Consequence: development can continue, but users will not get that capability.');
  lines.push('3) Ignore it for now.');
  lines.push('   Consequence: builds, runtime flows, or user actions may fail later and be harder to debug.');
  return lines.join('\n');
}

function buildReport(manifest, currentEnv) {
  const requiredSecrets = (manifest.secrets || []).filter((item) => isRequired(item, currentEnv));
  const present = [];
  const missing = [];

  for (const secret of requiredSecrets) {
    if (process.env[secret.name]) {
      present.push(secret.name);
    } else {
      missing.push(secret);
    }
  }

  return {
    environment: currentEnv,
    objective: manifest.objective,
    totalRequiredSecrets: requiredSecrets.length,
    present,
    missing,
    healthy: missing.length === 0,
  };
}

function printHumanReport(report) {
  console.log('Trusted Secret Worker Report');
  console.log('============================');
  console.log(`Environment: ${report.environment}`);
  console.log(`Objective: ${report.objective}`);
  console.log(`Required secrets checked: ${report.totalRequiredSecrets}`);
  console.log(`Present: ${report.present.length}`);
  console.log(`Missing: ${report.missing.length}`);
  console.log('');

  if (report.healthy) {
    console.log('Good news: all required secrets for this environment are present.');
    console.log('Consequence: the worker layer can trust the configuration more and focus on code/runtime issues.');
    return;
  }

  for (const secret of report.missing) {
    console.log(explainMissing(secret, report.environment));
    console.log('');
  }
}

function printJsonReport(report) {
  const safe = {
    environment: report.environment,
    objective: report.objective,
    totalRequiredSecrets: report.totalRequiredSecrets,
    present: report.present,
    missing: report.missing.map((secret) => ({
      name: secret.name,
      category: secret.category,
      usedBy: secret.usedBy,
      plainEnglish: secret.plainEnglish,
      ifMissing: secret.ifMissing,
      safeAddCommand: secret.safeAddCommand,
    })),
    healthy: report.healthy,
  };

  console.log(JSON.stringify(safe, null, 2));
}

try {
  const manifest = readManifest();
  const currentEnv = envName();
  const report = buildReport(manifest, currentEnv);
  const wantsJson = process.argv.includes('--json');

  if (wantsJson) {
    printJsonReport(report);
  } else {
    printHumanReport(report);
  }

  process.exit(report.healthy ? 0 : 1);
} catch (error) {
  console.error('Trusted Secret Worker failed.');
  console.error(`Reason: ${error instanceof Error ? error.message : String(error)}`);
  console.error('Choices:');
  console.error('1) Fix the manifest path or file structure now. Consequence: checks become reliable.');
  console.error('2) Skip this check temporarily. Consequence: secret drift may go unnoticed.');
  process.exit(2);
}
