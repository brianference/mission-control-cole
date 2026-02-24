#!/usr/bin/env node
/**
 * Generate real-time usage data from OpenClaw session logs
 * Replaces usage-data.json with current data
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUBLIC_DIR = path.join(__dirname, '../public');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'usage-data.json');

// Helper to parse session log JSON files
function parseSessionLogs() {
  const agentsDir = path.join(process.env.HOME || '/root', '.openclaw/agents');
  
  if (!fs.existsSync(agentsDir)) {
    console.error('Agents directory not found:', agentsDir);
    return [];
  }

  // Find all session JSONL files across all agents
  const files = [];
  const agents = fs.readdirSync(agentsDir);
  
  for (const agent of agents) {
    const sessionsDir = path.join(agentsDir, agent, 'sessions');
    if (fs.existsSync(sessionsDir)) {
      const sessionFiles = fs.readdirSync(sessionsDir)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => path.join(sessionsDir, f));
      files.push(...sessionFiles);
    }
  }

  const sessions = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.trim().split('\n');
      
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          if (event.usage && event.usage.total_cost) {
            sessions.push({
              date: event.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0],
              cost: parseFloat(event.usage.total_cost) || 0,
              tokens: parseInt(event.usage.total_tokens) || 0,
              model: event.model || 'unknown',
              provider: event.provider || 'unknown'
            });
          }
        } catch (e) {
          // Skip malformed lines
        }
      }
    } catch (e) {
      console.error('Error reading file:', file, e.message);
    }
  }

  return sessions;
}

// Aggregate sessions by date
function aggregateByDate(sessions) {
  const byDate = {};
  const byProvider = {};
  const byModel = {};

  for (const session of sessions) {
    // By date
    if (!byDate[session.date]) {
      byDate[session.date] = { cost: 0, tokens: 0, sessions: 0 };
    }
    byDate[session.date].cost += session.cost;
    byDate[session.date].tokens += session.tokens;
    byDate[session.date].sessions += 1;

    // By provider
    if (!byProvider[session.provider]) {
      byProvider[session.provider] = { cost: 0, tokens: 0, requests: 0 };
    }
    byProvider[session.provider].cost += session.cost;
    byProvider[session.provider].tokens += session.tokens;
    byProvider[session.provider].requests += 1;

    // By model
    if (!byModel[session.model]) {
      byModel[session.model] = { cost: 0, tokens: 0, requests: 0 };
    }
    byModel[session.model].cost += session.cost;
    byModel[session.model].tokens += session.tokens;
    byModel[session.model].requests += 1;
  }

  return { byDate, byProvider, byModel };
}

// Calculate time-based totals
function calculateTotals(byDate) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let dailyTotal = 0;
  let weeklyTotal = 0;
  let monthlyTotal = 0;
  let totalSessions = 0;
  let totalTokens = 0;

  for (const [date, data] of Object.entries(byDate)) {
    const dateObj = new Date(date);
    monthlyTotal += data.cost;
    totalSessions += data.sessions;
    totalTokens += data.tokens;

    if (date === today) {
      dailyTotal = data.cost;
    }
    if (dateObj >= weekAgo) {
      weeklyTotal += data.cost;
    }
  }

  return {
    daily: dailyTotal,
    weekly: weeklyTotal,
    monthly: monthlyTotal,
    totalSessions,
    totalTokens
  };
}

// Main execution
console.log('📊 Generating live usage data from OpenClaw logs...');

const sessions = parseSessionLogs();
console.log(`  Found ${sessions.length} session events`);

const { byDate, byProvider, byModel } = aggregateByDate(sessions);
const totals = calculateTotals(byDate);

// Format for output
const daily = Object.entries(byDate)
  .map(([date, data]) => ({
    date,
    cost: data.cost,
    tokens: data.tokens,
    requests: 0,
    sessions: data.sessions
  }))
  .sort((a, b) => new Date(a.date) - new Date(b.date));

const providers = Object.entries(byProvider).map(([name, data]) => ({
  name,
  cost: data.cost,
  tokens: data.tokens,
  requests: data.requests
}));

const models = Object.entries(byModel).map(([name, data]) => ({
  name,
  cost: data.cost,
  tokens: data.tokens,
  requests: data.requests
}));

const output = {
  summary: {
    totalSessions: totals.totalSessions,
    totalCost: totals.monthly,
    totalTokens: totals.totalTokens,
    totalRequests: 0,
    weekTotal: totals.weekly,
    monthTotal: totals.monthly,
    dailyTotal: totals.daily
  },
  daily,
  providers,
  models,
  taskTypes: [],
  sessions: [],
  lastUpdated: new Date().toISOString()
};

// Write to file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

console.log('✅ Usage data generated:');
console.log(`  Daily: $${totals.daily.toFixed(2)}`);
console.log(`  Weekly: $${totals.weekly.toFixed(2)}`);
console.log(`  Monthly: $${totals.monthly.toFixed(2)}`);
console.log(`  Saved to: ${OUTPUT_FILE}`);
