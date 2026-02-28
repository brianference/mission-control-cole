#!/usr/bin/env node
/**
 * Initialize interactions database and populate from JSONL logs
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const DB_PATH = '/root/.openclaw/data/interactions.db';
const OPENCLAW_ROOT = '/root/.openclaw/agents';

// Create database schema
function initDatabase() {
  const db = new Database(DB_PATH);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS llm_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      caller TEXT,
      session_id TEXT,
      task_type TEXT,
      prompt_tokens INTEGER,
      completion_tokens INTEGER,
      thinking_tokens INTEGER DEFAULT 0,
      cache_read_tokens INTEGER DEFAULT 0,
      cache_write_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER,
      duration_ms INTEGER DEFAULT 0,
      input_cost REAL DEFAULT 0,
      output_cost REAL DEFAULT 0,
      cache_cost REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      status TEXT DEFAULT 'success',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_timestamp ON llm_calls(timestamp);
    CREATE INDEX IF NOT EXISTS idx_model ON llm_calls(model);
    CREATE INDEX IF NOT EXISTS idx_provider ON llm_calls(provider);
    CREATE INDEX IF NOT EXISTS idx_session ON llm_calls(session_id);
    CREATE INDEX IF NOT EXISTS idx_caller ON llm_calls(caller);
    CREATE INDEX IF NOT EXISTS idx_task_type ON llm_calls(task_type);
  `);
  
  console.log('✅ Database schema created');
  db.close();
}

// Classify task type based on caller/session info
function classifyTaskType(caller, sessionId) {
  const c = (caller || '').toLowerCase();
  const s = (sessionId || '').toLowerCase();
  
  if (c.includes('coder') || c.includes('code') || s.includes('code')) return 'coding';
  if (c.includes('designer') || c.includes('design')) return 'design';
  if (c.includes('test') || c.includes('qa')) return 'testing';
  if (c.includes('pm') || c.includes('manager')) return 'planning';
  if (c.includes('cron') || s.includes('cron')) return 'automation';
  return 'general';
}

// Extract thinking tokens from extended usage if available
function extractThinkingTokens(usage) {
  // Some providers report thinking tokens separately
  if (usage.thinking) return usage.thinking;
  if (usage.thinkingTokens) return usage.thinkingTokens;
  
  // Opus 4.6 with extended thinking
  if (usage.extendedThinking) return usage.extendedThinking;
  
  return 0;
}

// Process JSONL session file
async function processSessionFile(filePath, agentName, db) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentSessionId = null;
  let inserted = 0;

  for await (const line of rl) {
    try {
      const event = JSON.parse(line);
      
      if (event.type === 'session' && event.id) {
        currentSessionId = event.id;
      }
      
      if (event.type === 'message' && event.message?.usage && currentSessionId) {
        const msg = event.message;
        const usage = msg.usage || {};
        const cost = usage.cost || {};
        
        const thinkingTokens = extractThinkingTokens(usage);
        const taskType = classifyTaskType(agentName, currentSessionId);
        
        db.prepare(`
          INSERT INTO llm_calls (
            timestamp, provider, model, caller, session_id, task_type,
            prompt_tokens, completion_tokens, thinking_tokens,
            cache_read_tokens, cache_write_tokens, total_tokens,
            input_cost, output_cost, cache_cost, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          event.timestamp || new Date().toISOString(),
          msg.provider || 'unknown',
          msg.model || 'unknown',
          agentName,
          currentSessionId,
          taskType,
          usage.input || 0,
          usage.output || 0,
          thinkingTokens,
          usage.cacheRead || 0,
          usage.cacheWrite || 0,
          usage.totalTokens || 0,
          cost.input || 0,
          cost.output || 0,
          (cost.cacheRead || 0) + (cost.cacheWrite || 0),
          cost.total || 0
        );
        
        inserted++;
      }
    } catch (err) {
      // Skip malformed lines
      continue;
    }
  }

  return inserted;
}

// Main migration
async function migrate() {
  console.log('🚀 Starting database migration...\n');
  
  // Initialize schema
  initDatabase();
  
  const db = new Database(DB_PATH);
  
  // Clear existing data (if re-running)
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM llm_calls').get().count;
  if (existingCount > 0) {
    console.log(`⚠️  Database already has ${existingCount} records`);
    console.log('Continuing will add new records...\n');
  }
  
  // Find all agents
  const agents = fs.readdirSync(OPENCLAW_ROOT, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  let totalInserted = 0;
  
  for (const agent of agents) {
    const sessionsPath = path.join(OPENCLAW_ROOT, agent, 'sessions');
    
    if (!fs.existsSync(sessionsPath)) continue;
    
    const sessionFiles = fs.readdirSync(sessionsPath)
      .filter(f => f.endsWith('.jsonl'));
    
    console.log(`📂 Processing ${agent}: ${sessionFiles.length} sessions`);
    
    for (const file of sessionFiles) {
      const filePath = path.join(sessionsPath, file);
      const inserted = await processSessionFile(filePath, agent, db);
      totalInserted += inserted;
    }
  }
  
  db.close();
  
  console.log(`\n✅ Migration complete!`);
  console.log(`   Total records inserted: ${totalInserted}`);
  console.log(`   Database: ${DB_PATH}`);
}

// Run migration
migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
