#!/usr/bin/env node
/**
 * OpenClaw Usage Data Collector
 * 
 * Scans all agent session JSONL files and extracts usage/cost data
 * Outputs aggregated data for the cost tracking dashboard
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENCLAW_ROOT = '/root/.openclaw/agents';
const OUTPUT_FILE = path.join(__dirname, '../public/usage-data.json');

// Model cost per 1M tokens (as of Feb 2026)
const MODEL_COSTS = {
  'claude-sonnet-4-5': { input: 3, output: 15, name: 'Claude Sonnet 4.5' },
  'claude-opus-4': { input: 15, output: 75, name: 'Claude Opus 4' },
  'claude-3-5-sonnet-20241022': { input: 3, output: 15, name: 'Claude 3.5 Sonnet' },
  'gpt-4o': { input: 2.5, output: 10, name: 'GPT-4o' },
  'gpt-4o-mini': { input: 0.15, output: 0.6, name: 'GPT-4o Mini' },
  'gpt-4-turbo': { input: 10, output: 30, name: 'GPT-4 Turbo' },
};

// Task type classification based on agent and session metadata
function classifyTaskType(sessionId, agentName) {
  if (agentName.includes('coder')) return 'coding';
  if (agentName.includes('designer')) return 'design';
  if (agentName.includes('test')) return 'testing';
  if (agentName.includes('pm')) return 'planning';
  if (sessionId.includes('cron')) return 'automation';
  return 'general';
}

async function processSessionFile(filePath, agentName) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const sessions = [];
  let currentSession = null;

  for await (const line of rl) {
    try {
      const event = JSON.parse(line);
      
      if (event.type === 'session' && event.id) {
        currentSession = {
          id: event.id,
          timestamp: event.timestamp,
          agent: agentName,
          messages: []
        };
      }
      
      if (event.type === 'message' && event.message?.usage && currentSession) {
        const msg = event.message;
        const usage = msg.usage;
        const cost = usage.cost || {};
        
        currentSession.messages.push({
          timestamp: event.timestamp,
          provider: msg.provider || 'unknown',
          model: msg.model || 'unknown',
          usage: {
            input: usage.input || 0,
            output: usage.output || 0,
            cacheRead: usage.cacheRead || 0,
            cacheWrite: usage.cacheWrite || 0,
            total: usage.totalTokens || 0
          },
          cost: {
            input: cost.input || 0,
            output: cost.output || 0,
            cacheRead: cost.cacheRead || 0,
            cacheWrite: cost.cacheWrite || 0,
            total: cost.total || 0
          }
        });
      }
    } catch (err) {
      // Skip malformed lines
      continue;
    }
  }

  if (currentSession && currentSession.messages.length > 0) {
    sessions.push(currentSession);
  }

  return sessions;
}

async function collectAllSessions() {
  const allSessions = [];
  
  // Find all agent directories
  const agents = fs.readdirSync(OPENCLAW_ROOT, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const agent of agents) {
    const sessionsPath = path.join(OPENCLAW_ROOT, agent, 'sessions');
    
    if (!fs.existsSync(sessionsPath)) continue;

    const sessionFiles = fs.readdirSync(sessionsPath)
      .filter(f => f.endsWith('.jsonl'));

    console.log(`Processing ${agent}: ${sessionFiles.length} sessions`);

    for (const file of sessionFiles) {
      const filePath = path.join(sessionsPath, file);
      const sessions = await processSessionFile(filePath, agent);
      allSessions.push(...sessions);
    }
  }

  return allSessions;
}

function aggregateData(sessions) {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  
  // Aggregate by day for last 30 days
  const dailyStats = {};
  const providerStats = {};
  const modelStats = {};
  const taskTypeStats = {};
  const weeklyTotal = { cost: 0, tokens: 0 };
  const monthlyTotal = { cost: 0, tokens: 0 };

  sessions.forEach(session => {
    session.messages.forEach(msg => {
      const msgDate = new Date(msg.timestamp);
      const dayKey = msgDate.toISOString().split('T')[0];
      const daysAgo = Math.floor((now - msgDate) / dayMs);
      
      // Initialize daily stats
      if (!dailyStats[dayKey]) {
        dailyStats[dayKey] = {
          date: dayKey,
          cost: 0,
          tokens: 0,
          requests: 0
        };
      }

      // Aggregate daily
      dailyStats[dayKey].cost += msg.cost.total;
      dailyStats[dayKey].tokens += msg.usage.total;
      dailyStats[dayKey].requests += 1;

      // Weekly (last 7 days)
      if (daysAgo <= 7) {
        weeklyTotal.cost += msg.cost.total;
        weeklyTotal.tokens += msg.usage.total;
      }

      // Monthly (last 30 days)
      if (daysAgo <= 30) {
        monthlyTotal.cost += msg.cost.total;
        monthlyTotal.tokens += msg.usage.total;
      }

      // Provider breakdown
      const provider = msg.provider === 'anthropic' ? 'Anthropic' : 
                       msg.provider === 'openai' ? 'OpenAI' : 'Other';
      if (!providerStats[provider]) {
        providerStats[provider] = { cost: 0, tokens: 0, requests: 0 };
      }
      providerStats[provider].cost += msg.cost.total;
      providerStats[provider].tokens += msg.usage.total;
      providerStats[provider].requests += 1;

      // Model breakdown
      const modelName = MODEL_COSTS[msg.model]?.name || msg.model;
      if (!modelStats[modelName]) {
        modelStats[modelName] = { cost: 0, tokens: 0, requests: 0 };
      }
      modelStats[modelName].cost += msg.cost.total;
      modelStats[modelName].tokens += msg.usage.total;
      modelStats[modelName].requests += 1;

      // Task type breakdown
      const taskType = classifyTaskType(session.id, session.agent);
      if (!taskTypeStats[taskType]) {
        taskTypeStats[taskType] = { cost: 0, tokens: 0, requests: 0 };
      }
      taskTypeStats[taskType].cost += msg.cost.total;
      taskTypeStats[taskType].tokens += msg.usage.total;
      taskTypeStats[taskType].requests += 1;
    });
  });

  // Convert to arrays and sort
  const dailyData = Object.values(dailyStats)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Last 30 days

  const providerData = Object.entries(providerStats).map(([name, stats]) => ({
    name,
    ...stats
  })).sort((a, b) => b.cost - a.cost);

  const modelData = Object.entries(modelStats).map(([name, stats]) => ({
    name,
    ...stats
  })).sort((a, b) => b.cost - a.cost);

  const taskTypeData = Object.entries(taskTypeStats).map(([name, stats]) => ({
    name,
    ...stats
  })).sort((a, b) => b.cost - a.cost);

  return {
    summary: {
      weekTotal: weeklyTotal.cost,
      monthTotal: monthlyTotal.cost,
      totalSessions: sessions.length,
      totalRequests: sessions.reduce((sum, s) => sum + s.messages.length, 0)
    },
    daily: dailyData,
    providers: providerData,
    models: modelData,
    taskTypes: taskTypeData,
    lastUpdated: now.toISOString()
  };
}

async function main() {
  console.log('🔍 Collecting OpenClaw usage data...');
  
  const sessions = await collectAllSessions();
  console.log(`\n📊 Found ${sessions.length} sessions`);
  
  const data = aggregateData(sessions);
  console.log(`\n💰 Summary:`);
  console.log(`   Week:  $${data.summary.weekTotal.toFixed(2)}`);
  console.log(`   Month: $${data.summary.monthTotal.toFixed(2)}`);
  
  // Ensure public directory exists
  const publicDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`\n✅ Data written to: ${OUTPUT_FILE}`);
}

main().catch(console.error);
