#!/usr/bin/env node
/**
 * gen-crons.js — Generate public/crons.json from ~/.openclaw/cron/jobs.json
 * Run as part of the prebuild step.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CRON_JOBS_PATH = path.join(os.homedir(), '.openclaw', 'cron', 'jobs.json');
const OUTPUT_PATH = path.join(__dirname, '../public/crons.json');

if (!fs.existsSync(CRON_JOBS_PATH)) {
  console.log('gen-crons.js: ~/.openclaw/cron/jobs.json not found — skipping (CI mode)');
  process.exit(0);
}

try {
  const raw = fs.readFileSync(CRON_JOBS_PATH, 'utf8');
  const data = JSON.parse(raw);
  const jobs = data.jobs || [];

  const result = jobs.map(j => {
    const sched = j.schedule || {};
    const expr = sched.expr || sched.cron || sched.interval || JSON.stringify(sched);
    const state = j.state || {};

    return {
      id: j.id,
      name: j.name,
      enabled: j.enabled ?? true,
      schedule: expr,
      scheduleKind: sched.kind || 'cron',
      tz: sched.tz || 'UTC',
      model: (j.payload || {}).model || 'unknown',
      lastRunMs: state.lastRunAtMs,
      nextRunMs: state.nextRunAtMs,
      lastStatus: state.lastStatus || 'unknown',
      lastDurationMs: state.lastDurationMs,
      consecutiveErrors: state.consecutiveErrors || 0,
      lastError: state.lastError,
      agentId: j.agentId || 'main',
    };
  });

  const output = {
    lastUpdated: new Date().toISOString(),
    jobs: result,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`gen-crons.js: wrote ${result.length} cron jobs → public/crons.json`);
} catch (err) {
  console.error('gen-crons.js: error generating crons.json:', err.message);
  process.exit(0); // Don't fail build
}
