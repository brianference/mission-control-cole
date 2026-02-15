#!/usr/bin/env node

/**
 * Generate real OpenClaw data from session JSONL files
 * Replaces mock data with actual session metrics, agent activity, and costs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENCLAW_ROOT = process.env.HOME + '/.openclaw';
const OUTPUT_DIR = path.join(__dirname, '../public');

// Parse a single JSONL session file
function parseSessionFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    // Skip files larger than 10MB to avoid hanging
    if (stats.size > 10 * 1024 * 1024) {
      console.log(`⏭️  Skipping large file: ${path.basename(filePath)} (${Math.round(stats.size / 1024 / 1024)}MB)`);
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    
    // Limit to first 1000 lines for performance
    const limitedLines = lines.slice(0, Math.min(lines.length, 1000));
    
    const events = limitedLines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    if (events.length === 0) return null;

    const session = events.find(e => e.type === 'session') || {};
    const modelChanges = events.filter(e => e.type === 'model_change');
    const userMessages = events.filter(e => e.type === 'user_message');
    const assistantMessages = events.filter(e => e.type === 'assistant_message');
    const toolUses = events.filter(e => e.type === 'tool_use');
    const toolResults = events.filter(e => e.type === 'tool_result');

    // Calculate token usage and cost
    let inputTokens = 0;
    let outputTokens = 0;
    let totalCost = 0;

    events.forEach(event => {
      // Handle different event structures
      if (event.message?.usage) {
        const usage = event.message.usage;
        inputTokens += usage.input || usage.input_tokens || 0;
        outputTokens += usage.output || usage.output_tokens || 0;
        
        // Extract cost from usage
        if (usage.cost) {
          if (typeof usage.cost === 'number') {
            totalCost += usage.cost;
          } else if (usage.cost.total) {
            totalCost += usage.cost.total;
          }
        }
      }
      
      // Fallback for direct usage field
      if (event.usage) {
        inputTokens += event.usage.input || event.usage.input_tokens || 0;
        outputTokens += event.usage.output || event.usage.output_tokens || 0;
        if (event.usage.cost) {
          totalCost += typeof event.usage.cost === 'number' ? event.usage.cost : (event.usage.cost.total || 0);
        }
      }
      
      // Direct cost field
      if (event.cost && typeof event.cost === 'number') {
        totalCost += event.cost;
      }
    });

    const totalTokens = inputTokens + outputTokens;

    // Get model info
    const currentModel = modelChanges.length > 0 
      ? modelChanges[modelChanges.length - 1] 
      : {};

    // Get timestamps
    const startTime = session.timestamp ? new Date(session.timestamp) : null;
    const lastEvent = events[events.length - 1];
    const endTime = lastEvent?.timestamp ? new Date(lastEvent.timestamp) : startTime;
    const duration = startTime && endTime ? endTime - startTime : 0;

    return {
      id: session.id || path.basename(filePath, '.jsonl'),
      startTime,
      endTime,
      duration,
      model: currentModel.modelId || 'unknown',
      provider: currentModel.provider || 'unknown',
      inputTokens,
      outputTokens,
      totalTokens,
      totalCost,
      messageCount: userMessages.length + assistantMessages.length,
      toolCalls: toolUses.length,
      tools: [...new Set(toolUses.map(t => t.name).filter(Boolean))],
      events: events.length,
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

// Find all session files across all agents
function findAllSessions() {
  const sessions = [];
  const agentsDir = path.join(OPENCLAW_ROOT, 'agents');
  
  if (!fs.existsSync(agentsDir)) {
    console.error('OpenClaw agents directory not found:', agentsDir);
    return sessions;
  }

  const agentDirs = fs.readdirSync(agentsDir);
  
  agentDirs.forEach(agentName => {
    const sessionsDir = path.join(agentsDir, agentName, 'sessions');
    
    if (!fs.existsSync(sessionsDir)) return;

    const files = fs.readdirSync(sessionsDir)
      .filter(f => f.endsWith('.jsonl'));

    console.log(`📂 ${agentName}: ${files.length} session files`);

    files.forEach((file, idx) => {
      if (idx % 10 === 0) {
        process.stdout.write(`   Processing ${idx}/${files.length}...\r`);
      }
      const sessionData = parseSessionFile(path.join(sessionsDir, file));
      if (sessionData) {
        sessions.push({
          ...sessionData,
          agent: agentName,
        });
      }
    });
    console.log(`   Processed ${files.length}/${files.length} ✅`);
  });

  return sessions;
}

// Generate activity stream data
function generateActivityStream(sessions) {
  const activities = [];
  const now = Date.now();

  // Sort sessions by start time (newest first)
  const recentSessions = sessions
    .filter(s => s.startTime)
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, 50); // Last 50 sessions

  recentSessions.forEach((session, idx) => {
    const age = now - session.startTime.getTime();
    
    // Agent activity
    if (session.messageCount > 0) {
      activities.push({
        id: `agent-${session.id}`,
        type: 'agent',
        icon: '🤖',
        title: `${session.agent} session completed`,
        description: `${session.messageCount} messages, ${session.toolCalls} tool calls`,
        timestamp: session.startTime.toISOString(),
        metadata: {
          agent: session.agent,
          model: session.model,
          cost: session.totalCost,
          duration: session.duration,
          status: 'success',
        },
      });
    }

    // Tool usage activities
    if (session.toolCalls > 5 && idx < 10) {
      activities.push({
        id: `tools-${session.id}`,
        type: 'system',
        icon: '🛠️',
        title: `Heavy tool usage detected`,
        description: `${session.toolCalls} tool calls in ${Math.round(session.duration / 1000 / 60)}m`,
        timestamp: session.endTime ? session.endTime.toISOString() : session.startTime.toISOString(),
        metadata: {
          status: session.totalCost > 1 ? 'warning' : 'success',
        },
      });
    }

    // High cost warning
    if (session.totalCost > 5 && idx < 5) {
      activities.push({
        id: `cost-${session.id}`,
        type: 'error',
        icon: '💰',
        title: `High cost session`,
        description: `$${session.totalCost.toFixed(2)} - Review optimization opportunities`,
        timestamp: session.endTime ? session.endTime.toISOString() : session.startTime.toISOString(),
        metadata: {
          cost: session.totalCost,
          status: 'warning',
        },
      });
    }
  });

  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20);
}

// Generate active agents data
function generateActiveAgents(sessions) {
  const now = Date.now();
  const recentWindow = 2 * 60 * 60 * 1000; // 2 hours

  const recentSessions = sessions.filter(s => {
    if (!s.startTime) return false;
    const age = now - s.startTime.getTime();
    return age < recentWindow;
  });

  // Group by agent
  const agentMap = new Map();
  
  recentSessions.forEach(session => {
    const existing = agentMap.get(session.agent) || {
      id: session.agent,
      name: session.agent,
      sessionCount: 0,
      totalCost: 0,
      totalTokens: 0,
      totalToolCalls: 0,
      models: new Set(),
      lastActivity: null,
    };

    existing.sessionCount++;
    existing.totalCost += session.totalCost;
    existing.totalTokens += session.totalTokens;
    existing.totalToolCalls += session.toolCalls;
    existing.models.add(session.model);
    
    if (!existing.lastActivity || session.startTime > existing.lastActivity) {
      existing.lastActivity = session.startTime;
    }

    agentMap.set(session.agent, existing);
  });

  return Array.from(agentMap.values()).map(agent => ({
    id: agent.id,
    name: agent.name,
    status: agent.sessionCount > 0 ? 'running' : 'idle',
    sessionCount: agent.sessionCount,
    totalCost: agent.totalCost,
    totalTokens: agent.totalTokens,
    toolCalls: agent.totalToolCalls,
    model: Array.from(agent.models)[0] || 'unknown',
    lastActivity: agent.lastActivity ? agent.lastActivity.toISOString() : null,
  }));
}

// Generate cost tracking data
function generateCostData(sessions) {
  const validSessions = sessions.filter(s => s.startTime);
  
  // Calculate summary
  const summary = {
    totalSessions: validSessions.length,
    totalCost: validSessions.reduce((sum, s) => sum + s.totalCost, 0),
    totalTokens: validSessions.reduce((sum, s) => sum + s.totalTokens, 0),
    totalRequests: validSessions.reduce((sum, s) => sum + s.messageCount, 0),
  };

  // Daily breakdown
  const dailyMap = new Map();
  validSessions.forEach(session => {
    const date = session.startTime.toISOString().split('T')[0];
    const existing = dailyMap.get(date) || {
      date,
      cost: 0,
      tokens: 0,
      requests: 0,
      sessions: 0,
    };
    
    existing.cost += session.totalCost;
    existing.tokens += session.totalTokens;
    existing.requests += session.messageCount;
    existing.sessions++;
    
    dailyMap.set(date, existing);
  });

  const daily = Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Last 30 days

  // Provider breakdown
  const providerMap = new Map();
  validSessions.forEach(session => {
    const existing = providerMap.get(session.provider) || {
      name: session.provider,
      cost: 0,
      tokens: 0,
      requests: 0,
    };
    
    existing.cost += session.totalCost;
    existing.tokens += session.totalTokens;
    existing.requests += session.messageCount;
    
    providerMap.set(session.provider, existing);
  });

  const providers = Array.from(providerMap.values())
    .sort((a, b) => b.cost - a.cost);

  // Model breakdown
  const modelMap = new Map();
  validSessions.forEach(session => {
    const existing = modelMap.get(session.model) || {
      name: session.model,
      cost: 0,
      tokens: 0,
      requests: 0,
    };
    
    existing.cost += session.totalCost;
    existing.tokens += session.totalTokens;
    existing.requests += session.messageCount;
    
    modelMap.set(session.model, existing);
  });

  const models = Array.from(modelMap.values())
    .sort((a, b) => b.cost - a.cost);

  // Calculate week totals
  const now = Date.now();
  const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
  const monthAgo = now - (30 * 24 * 60 * 60 * 1000);

  const weekSessions = validSessions.filter(s => s.startTime.getTime() > weekAgo);
  const monthSessions = validSessions.filter(s => s.startTime.getTime() > monthAgo);

  summary.weekTotal = weekSessions.reduce((sum, s) => sum + s.totalCost, 0);
  summary.monthTotal = monthSessions.reduce((sum, s) => sum + s.totalCost, 0);

  return {
    summary,
    daily,
    providers,
    models,
    sessions: validSessions.slice(-100), // Last 100 sessions
    lastUpdated: new Date().toISOString(),
  };
}

// Main execution
function main() {
  console.log('🔍 Scanning OpenClaw sessions...');
  
  const sessions = findAllSessions();
  console.log(`✅ Found ${sessions.length} sessions`);

  if (sessions.length === 0) {
    console.log('⚠️  No sessions found. Using empty data.');
  }

  console.log('\n📊 Generating data files...');

  // Generate activity stream
  const activityStream = generateActivityStream(sessions);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'activity-stream.json'),
    JSON.stringify(activityStream, null, 2)
  );
  console.log(`✅ activity-stream.json (${activityStream.length} activities)`);

  // Generate active agents
  const activeAgents = generateActiveAgents(sessions);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'active-agents.json'),
    JSON.stringify(activeAgents, null, 2)
  );
  console.log(`✅ active-agents.json (${activeAgents.length} agents)`);

  // Generate cost data (updates usage-data.json)
  const costData = generateCostData(sessions);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'usage-data.json'),
    JSON.stringify(costData, null, 2)
  );
  console.log(`✅ usage-data.json (${costData.summary.totalSessions} sessions, $${costData.summary.totalCost.toFixed(2)} total)`);

  console.log('\n✨ Real data generation complete!');
  console.log(`📁 Files saved to: ${OUTPUT_DIR}`);
}

main();
