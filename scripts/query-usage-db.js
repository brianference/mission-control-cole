#!/usr/bin/env node
/**
 * Query layer for interactions database
 */
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = '/root/.openclaw/data/interactions.db';

export function getDatabaseStats() {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_calls,
        SUM(total_cost) as total_cost,
        SUM(total_tokens) as total_tokens,
        MIN(timestamp) as first_call,
        MAX(timestamp) as last_call
      FROM llm_calls
    `).get();
    
    db.close();
    return stats;
  } catch (err) {
    console.error('Database query error:', err.message);
    return null;
  }
}

export function queryUsageByProvider(days = 30) {
  const db = new Database(DB_PATH, { readonly: true });
  
  const rows = db.prepare(`
    SELECT 
      provider,
      COUNT(*) as calls,
      SUM(prompt_tokens) as input_tokens,
      SUM(completion_tokens) as output_tokens,
      SUM(thinking_tokens) as thinking_tokens,
      SUM(total_tokens) as total_tokens,
      ROUND(SUM(total_cost), 2) as cost
    FROM llm_calls
    WHERE timestamp >= DATE('now', '-' || ? || ' days')
    GROUP BY provider
    ORDER BY cost DESC
  `).all(days);
  
  db.close();
  return rows;
}

export function queryUsageByModel(days = 30) {
  const db = new Database(DB_PATH, { readonly: true });
  
  const rows = db.prepare(`
    SELECT 
      provider,
      model,
      COUNT(*) as calls,
      SUM(prompt_tokens) as input_tokens,
      SUM(completion_tokens) as output_tokens,
      SUM(thinking_tokens) as thinking_tokens,
      SUM(cache_read_tokens) as cache_read,
      SUM(cache_write_tokens) as cache_write,
      SUM(total_tokens) as total_tokens,
      ROUND(SUM(input_cost), 2) as input_cost,
      ROUND(SUM(output_cost), 2) as output_cost,
      ROUND(SUM(cache_cost), 2) as cache_cost,
      ROUND(SUM(total_cost), 2) as total_cost
    FROM llm_calls
    WHERE timestamp >= DATE('now', '-' || ? || ' days')
    GROUP BY provider, model
    ORDER BY total_cost DESC
  `).all(days);
  
  db.close();
  return rows;
}

export function queryUsageByTaskType(days = 30) {
  const db = new Database(DB_PATH, { readonly: true });
  
  const rows = db.prepare(`
    SELECT 
      task_type,
      COUNT(*) as calls,
      SUM(total_tokens) as total_tokens,
      ROUND(SUM(total_cost), 2) as cost
    FROM llm_calls
    WHERE timestamp >= DATE('now', '-' || ? || ' days')
    GROUP BY task_type
    ORDER BY cost DESC
  `).all(days);
  
  db.close();
  return rows;
}

export function queryUsageByDay(days = 7) {
  const db = new Database(DB_PATH, { readonly: true });
  
  const rows = db.prepare(`
    SELECT 
      DATE(timestamp) as date,
      ROUND(SUM(total_cost), 2) as cost,
      SUM(total_tokens) as tokens,
      COUNT(*) as requests
    FROM llm_calls
    WHERE timestamp >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(timestamp)
    ORDER BY date
  `).all(days);
  
  db.close();
  return rows;
}

export function getThinkingTokenStats(days = 30) {
  const db = new Database(DB_PATH, { readonly: true });
  
  const row = db.prepare(`
    SELECT 
      SUM(thinking_tokens) as total_thinking,
      COUNT(CASE WHEN thinking_tokens > 0 THEN 1 END) as calls_with_thinking,
      MAX(thinking_tokens) as max_thinking_tokens,
      ROUND(AVG(CASE WHEN thinking_tokens > 0 THEN thinking_tokens END), 0) as avg_thinking_tokens
    FROM llm_calls
    WHERE timestamp >= DATE('now', '-' || ? || ' days')
  `).get(days);
  
  db.close();
  return row;
}

export function getAPIHealthStats(days = 7) {
  const db = new Database(DB_PATH, { readonly: true });
  
  // For now, all calls in DB are successful
  // In future, track failures in separate table or status column
  const row = db.prepare(`
    SELECT 
      COUNT(*) as total_calls,
      COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_calls,
      COUNT(CASE WHEN status = 'rate_limit' THEN 1 END) as rate_limits,
      COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
      ROUND(100.0 * COUNT(CASE WHEN status = 'success' THEN 1 END) / COUNT(*), 1) as success_rate
    FROM llm_calls
    WHERE timestamp >= DATE('now', '-' || ? || ' days')
  `).get(days);
  
  db.close();
  return row;
}

export function generateUsageJSON() {
  try {
    const providers = queryUsageByProvider(30);
    const models = queryUsageByModel(30);
    const taskTypes = queryUsageByTaskType(30);
    const daily = queryUsageByDay(30);
    const thinking = getThinkingTokenStats(30);
    const health = getAPIHealthStats(7);
    
    // Calculate totals
    const weekTotal = daily
      .filter(d => {
        const date = new Date(d.date);
        const now = new Date();
        const diff = (now - date) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      })
      .reduce((sum, d) => sum + (d.cost || 0), 0);
    
    const monthTotal = daily.reduce((sum, d) => sum + (d.cost || 0), 0);
    
    return {
      summary: {
        weekTotal: Math.round(weekTotal * 100) / 100,
        monthTotal: Math.round(monthTotal * 100) / 100,
        totalRequests: daily.reduce((sum, d) => sum + d.requests, 0)
      },
      daily,
      providers,
      models,
      taskTypes,
      thinking,
      health,
      lastUpdated: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error generating usage JSON:', err.message);
    return null;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const action = process.argv[2] || 'stats';
  
  if (action === 'stats') {
    const stats = getDatabaseStats();
    console.log('Database Stats:', stats);
  } else if (action === 'providers') {
    const providers = queryUsageByProvider(30);
    console.log('\nUsage by Provider (last 30 days):');
    console.table(providers);
  } else if (action === 'models') {
    const models = queryUsageByModel(30);
    console.log('\nUsage by Model (last 30 days):');
    console.table(models);
  } else if (action === 'tasks') {
    const tasks = queryUsageByTaskType(30);
    console.log('\nUsage by Task Type (last 30 days):');
    console.table(tasks);
  } else if (action === 'json') {
    const data = generateUsageJSON();
    console.log(JSON.stringify(data, null, 2));
  }
}
