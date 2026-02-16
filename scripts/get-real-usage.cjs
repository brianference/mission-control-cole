#!/usr/bin/env node
/**
 * Extract REAL usage data from OpenClaw sessions
 * NO MOCK DATA - Commandment #32
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

async function parseSessionFile(filePath) {
  const usage = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        
        // Extract from message entries with usage data
        if (entry.type === 'message' && entry.message?.usage) {
          const u = entry.message.usage;
          const cost = u.cost?.total || 0;
          
          if (cost > 0 || u.input > 0 || u.output > 0) {
            usage.push({
              timestamp: entry.timestamp,
              model: entry.message.model || 'unknown',
              provider: entry.message.provider || 'unknown',
              inputTokens: u.input || 0,
              outputTokens: u.output || 0,
              cost: cost
            });
          }
        }
        
        // Extract from model_change entries
        if (entry.type === 'model_change') {
          // Just track model changes, no cost
        }
        
        // Extract from summary entries if they exist
        if (entry.type === 'summary' && entry.usage) {
          usage.push({
            timestamp: entry.timestamp,
            model: entry.model || 'unknown',
            provider: entry.provider || 'unknown',
            inputTokens: entry.usage.input || 0,
            outputTokens: entry.usage.output || 0,
            cost: entry.usage.cost?.total || 0
          });
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
  } catch (e) {
    // Skip unreadable files
  }
  
  return usage;
}

async function aggregateUsage() {
  const openclawDir = path.join(process.env.HOME, '.openclaw');
  const workspaceDir = path.join(openclawDir, 'workspace');
  const agentsDir = path.join(openclawDir, 'agents');
  
  const allUsage = [];
  
  // Find JSONL files using find command
  try {
    const findResult = execSync(
      `find ${agentsDir} -name "*.jsonl" -type f 2>/dev/null`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    
    const files = findResult.split('\n').filter(f => f.trim());
    console.log(`Found ${files.length} session files`);
    
    for (const fullPath of files) {
      const usage = await parseSessionFile(fullPath);
      allUsage.push(...usage);
    }
  } catch (e) {
    console.error('Error finding session files:', e.message);
  }
  
  // Also check workspace JSONL files
  try {
    const wsFiles = execSync(
      `find ${workspaceDir} -maxdepth 1 -name "*.jsonl" -type f 2>/dev/null`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    
    const files = wsFiles.split('\n').filter(f => f.trim());
    console.log(`Found ${files.length} workspace session files`);
    
    for (const fullPath of files) {
      const usage = await parseSessionFile(fullPath);
      allUsage.push(...usage);
    }
  } catch (e) {
    // Ignore
  }
  
  console.log(`Total usage entries: ${allUsage.length}`);
  
  // Aggregate by day, provider, and model
  const byDay = {};
  const byProvider = {};
  const byModel = {};
  
  for (const entry of allUsage) {
    if (!entry.timestamp) continue;
    
    const date = new Date(entry.timestamp).toISOString().split('T')[0];
    const cost = entry.cost || 0;
    const tokens = (entry.inputTokens || 0) + (entry.outputTokens || 0);
    
    // By day
    if (!byDay[date]) {
      byDay[date] = { cost: 0, tokens: 0, requests: 0, byProvider: {}, byModel: {} };
    }
    byDay[date].cost += cost;
    byDay[date].tokens += tokens;
    byDay[date].requests += 1;
    
    // Normalize provider name
    const provider = (entry.provider || 'unknown').replace('openclaw', 'OpenClaw');
    const model = entry.model || 'unknown';
    
    // By provider within day
    if (!byDay[date].byProvider[provider]) {
      byDay[date].byProvider[provider] = { cost: 0, tokens: 0, requests: 0 };
    }
    byDay[date].byProvider[provider].cost += cost;
    byDay[date].byProvider[provider].tokens += tokens;
    byDay[date].byProvider[provider].requests += 1;
    
    // By model within day
    if (!byDay[date].byModel[model]) {
      byDay[date].byModel[model] = { cost: 0, tokens: 0, requests: 0 };
    }
    byDay[date].byModel[model].cost += cost;
    byDay[date].byModel[model].tokens += tokens;
    byDay[date].byModel[model].requests += 1;
    
    // Totals by provider
    if (!byProvider[provider]) {
      byProvider[provider] = { cost: 0, tokens: 0, requests: 0 };
    }
    byProvider[provider].cost += cost;
    byProvider[provider].tokens += tokens;
    byProvider[provider].requests += 1;
    
    // Totals by model
    if (!byModel[model]) {
      byModel[model] = { cost: 0, tokens: 0, requests: 0 };
    }
    byModel[model].cost += cost;
    byModel[model].tokens += tokens;
    byModel[model].requests += 1;
  }
  
  // Format output
  const daily = Object.entries(byDay)
    .map(([date, data]) => ({
      date,
      cost: Math.round(data.cost * 100) / 100,
      tokens: data.tokens,
      requests: data.requests,
      byProvider: Object.fromEntries(
        Object.entries(data.byProvider).map(([k, v]) => [
          k, 
          { cost: Math.round(v.cost * 100) / 100, tokens: v.tokens, requests: v.requests }
        ])
      ),
      byModel: Object.fromEntries(
        Object.entries(data.byModel).map(([k, v]) => [
          k,
          { cost: Math.round(v.cost * 100) / 100, tokens: v.tokens, requests: v.requests }
        ])
      )
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14); // Last 14 days
  
  const providers = Object.entries(byProvider)
    .map(([name, data]) => ({ 
      name, 
      cost: Math.round(data.cost * 100) / 100,
      tokens: data.tokens,
      requests: data.requests
    }))
    .filter(p => p.name !== 'unknown' && p.name !== 'delivery-mirror')
    .sort((a, b) => b.cost - a.cost);
  
  const models = Object.entries(byModel)
    .map(([name, data]) => ({
      name,
      cost: Math.round(data.cost * 100) / 100,
      tokens: data.tokens,
      requests: data.requests
    }))
    .filter(m => m.name !== 'unknown' && m.name !== 'delivery-mirror')
    .sort((a, b) => b.cost - a.cost);
  
  const totalCost = daily.reduce((sum, d) => sum + d.cost, 0);
  const totalTokens = daily.reduce((sum, d) => sum + d.tokens, 0);
  const totalRequests = daily.reduce((sum, d) => sum + d.requests, 0);
  
  return {
    summary: {
      weekTotal: Math.round(totalCost * 100) / 100,
      monthTotal: Math.round(totalCost * 100) / 100,
      totalSessions: daily.length,
      totalRequests
    },
    daily,
    providers,
    models,
    taskTypes: [],
    lastUpdated: new Date().toISOString(),
    _note: "REAL DATA from OpenClaw session files - NO MOCK DATA"
  };
}

async function main() {
  console.log('Extracting REAL usage data from OpenClaw sessions...');
  const data = await aggregateUsage();
  
  const outputPath = path.join(__dirname, '..', 'public', 'usage-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  
  console.log(`\nWritten to ${outputPath}`);
  console.log(`Summary: ${data.summary.totalRequests} requests, $${data.summary.monthTotal} total`);
  console.log(`Days with data: ${data.daily.length}`);
  console.log(`Providers: ${data.providers.map(p => p.name).join(', ')}`);
  console.log(`Models: ${data.models.slice(0, 5).map(m => m.name).join(', ')}`);
}

main().catch(console.error);
