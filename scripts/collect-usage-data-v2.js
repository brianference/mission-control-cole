#!/usr/bin/env node
/**
 * OpenClaw Usage Data Collector v2
 * 
 * Uses interactions.db if available, falls back to JSONL parsing
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateUsageJSON } from './query-usage-db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = '/root/.openclaw/data/interactions.db';
const OUTPUT_FILE = path.join(__dirname, '../public/usage-data.json');

async function collectUsage() {
  console.log('📊 Collecting usage data...');
  
  // Try database first
  if (fs.existsSync(DB_PATH)) {
    console.log('✅ Using interactions.db');
    const data = generateUsageJSON();
    
    if (data) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
      console.log(`✅ Wrote ${OUTPUT_FILE}`);
      console.log(`   Week: $${data.summary.weekTotal}`);
      console.log(`   Month: $${data.summary.monthTotal}`);
      console.log(`   Requests: ${data.summary.totalRequests}`);
      return;
    }
  }
  
  // Fall back to JSONL parsing
  console.log('⚠️  Database not available, falling back to JSONL parsing');
  const { exec } = await import('child_process');
  exec('node scripts/collect-usage-data.js', (err, stdout, stderr) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    console.log(stdout);
  });
}

collectUsage().catch(err => {
  console.error('Collection failed:', err);
  process.exit(1);
});
