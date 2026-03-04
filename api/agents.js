#!/usr/bin/env node

/**
 * Mission Control API - Agent Management Endpoints
 * 
 * Provides REAL DATA from OpenClaw tools:
 * - GET /api/agents - List active agents and sessions
 * - GET /api/agents/:sessionId/logs - Get agent logs
 * - POST /api/agents/:sessionId/kill - Kill an agent
 * - POST /api/agents/spawn - Spawn new agent
 * 
 * NO MOCK DATA - Commandment #32
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.API_PORT || 19002; // Avoid conflict with gateway (19000)

// Execute OpenClaw agent tool command and return JSON
function executeOpenClawTool(toolName, params = {}) {
  return new Promise((resolve, reject) => {
    // Build tool call as JSON
    const toolCall = JSON.stringify({
      name: toolName,
      parameters: params
    });

    // Use agent command with --json and a message that invokes the tool
    const message = `Execute tool: ${toolCall}`;
    
    const proc = spawn('openclaw', [
      'agent',
      '--json',
      '--local',
      '--message', message
    ], {
      env: { ...process.env, PATH: process.env.PATH },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`OpenClaw CLI failed (exit ${code}): ${stderr}`));
        return;
      }

      try {
        // Try to parse JSON from stdout
        const lines = stdout.trim().split('\n');
        // Find the last line that looks like JSON
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith('{') || line.startsWith('[')) {
            const result = JSON.parse(line);
            // Extract tool result if wrapped in agent response
            if (result.toolResults && result.toolResults.length > 0) {
              resolve(JSON.parse(result.toolResults[0].output));
            } else {
              resolve(result);
            }
            return;
          }
        }
        // If no JSON found, return raw output
        resolve({ raw: stdout, stderr });
      } catch (e) {
        reject(new Error(`Failed to parse OpenClaw output: ${e.message}\nOutput: ${stdout}`));
      }
    });
  });
}

// GET /api/agents - List active sessions and subagents
async function listAgents() {
  try {
    // Fetch both sessions_list and subagents list using tool calls
    const [sessionsData, subagentsData] = await Promise.all([
      executeOpenClawTool('sessions_list', { limit: 50, messageLimit: 0 }),
      executeOpenClawTool('subagents', { action: 'list' })
    ]);

    const sessions = sessionsData.sessions || [];
    const subagents = subagentsData.active || [];
    const recentSubagents = subagentsData.recent || [];

    // Transform to agent format
    const agents = sessions.map(session => {
      const updatedMs = Date.now() - session.updatedAt;
      const isActive = updatedMs < 300000; // Active if updated in last 5 min

      return {
        sessionId: session.key,
        sessionKey: session.key,
        displayName: session.displayName || session.key.split(':').slice(-1)[0],
        model: session.model || 'unknown',
        totalTokens: session.totalTokens || 0,
        contextTokens: session.contextTokens || 200000,
        updatedAt: session.updatedAt,
        ageMs: updatedMs,
        kind: session.kind || 'session',
        channel: session.channel,
        status: isActive ? 'active' : 'idle'
      };
    });

    // Add subagents to the list
    subagents.forEach(sub => {
      agents.push({
        sessionId: sub.sessionKey || sub.key,
        sessionKey: sub.sessionKey || sub.key,
        displayName: `Subagent: ${sub.task?.substring(0, 50) || 'Unknown'}`,
        model: sub.model || 'unknown',
        totalTokens: sub.totalTokens || 0,
        contextTokens: 200000,
        updatedAt: sub.spawnedAt || Date.now(),
        ageMs: Date.now() - (sub.spawnedAt || Date.now()),
        kind: 'subagent',
        status: 'active'
      });
    });

    // Calculate summary stats
    const totalCost = agents.reduce((sum, agent) => {
      const pricing = { input: 3.00, output: 15.00 }; // Claude Sonnet default
      const inputCost = (agent.totalTokens * 0.7) / 1000000 * pricing.input;
      const outputCost = (agent.totalTokens * 0.3) / 1000000 * pricing.output;
      return sum + inputCost + outputCost;
    }, 0);

    const avgBurnRate = agents.length > 0
      ? agents.reduce((sum, agent) => {
          const hoursActive = agent.ageMs / (1000 * 60 * 60);
          if (hoursActive === 0) return sum;
          const tokensPerHour = agent.totalTokens / hoursActive;
          return sum + (tokensPerHour / 1000000 * 3.00); // Simplified burn rate
        }, 0) / agents.length
      : 0;

    return {
      success: true,
      timestamp: Date.now(),
      agents,
      stats: {
        total: agents.length,
        active: agents.filter(a => a.status === 'active').length,
        totalCost: totalCost.toFixed(2),
        avgBurnRate: avgBurnRate.toFixed(2)
      }
    };
  } catch (error) {
    throw new Error(`Failed to list agents: ${error.message}`);
  }
}

// GET /api/agents/:sessionId/logs - Get agent logs
async function getAgentLogs(sessionKey) {
  try {
    const data = await executeOpenClawTool('sessions_history', { sessionKey, limit: 50 });
    
    const messages = data.messages || [];
    
    return {
      success: true,
      sessionKey,
      messageCount: messages.length,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content?.substring(0, 1000) || '', // Truncate long messages
        timestamp: msg.timestamp || Date.now()
      }))
    };
  } catch (error) {
    throw new Error(`Failed to fetch logs: ${error.message}`);
  }
}

// POST /api/agents/:sessionId/kill - Kill an agent
async function killAgent(sessionKey) {
  try {
    // Use subagents kill if it's a subagent
    if (sessionKey.includes('subagent')) {
      const data = await executeOpenClawTool('subagents', { action: 'kill', target: sessionKey });
      return {
        success: true,
        message: `Killed subagent: ${sessionKey}`,
        data
      };
    }

    // For regular sessions, we can't really "kill" them, but we can clear/abort
    // This would require additional OpenClaw API support
    return {
      success: false,
      message: 'Killing regular sessions not yet supported. Use subagents kill for spawned agents.'
    };
  } catch (error) {
    throw new Error(`Failed to kill agent: ${error.message}`);
  }
}

// POST /api/agents/spawn - Spawn new agent
async function spawnAgent(task, model, options = {}) {
  try {
    const params = {
      task,
      runtime: 'subagent',
      mode: 'run'
    };

    if (model) {
      params.model = model;
    }

    const data = await executeOpenClawTool('sessions_spawn', params);

    return {
      success: true,
      message: `Spawned agent for task: ${task.substring(0, 50)}`,
      sessionKey: data.sessionKey || data.key,
      data
    };
  } catch (error) {
    throw new Error(`Failed to spawn agent: ${error.message}`);
  }
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // GET /api/agents
    if (pathname === '/api/agents' && req.method === 'GET') {
      const data = await listAgents();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    // GET /api/agents/:sessionId/logs
    const logsMatch = pathname.match(/^\/api\/agents\/([^/]+)\/logs$/);
    if (logsMatch && req.method === 'GET') {
      const sessionKey = decodeURIComponent(logsMatch[1]);
      const data = await getAgentLogs(sessionKey);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    // POST /api/agents/:sessionId/kill
    const killMatch = pathname.match(/^\/api\/agents\/([^/]+)\/kill$/);
    if (killMatch && req.method === 'POST') {
      const sessionKey = decodeURIComponent(killMatch[1]);
      const data = await killAgent(sessionKey);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    // POST /api/agents/spawn
    if (pathname === '/api/agents/spawn' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const { task, model } = JSON.parse(body);
          if (!task) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Task is required' }));
            return;
          }

          const data = await spawnAgent(task, model);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: e.message }));
        }
      });
      return;
    }

    // Health check
    if (pathname === '/api/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, status: 'ok' }));
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Not found' }));
  } catch (error) {
    console.error('API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: error.message }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Mission Control API running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /api/agents - List all agents`);
  console.log(`   GET  /api/agents/:id/logs - Get agent logs`);
  console.log(`   POST /api/agents/:id/kill - Kill agent`);
  console.log(`   POST /api/agents/spawn - Spawn new agent`);
  console.log(`   GET  /api/health - Health check`);
});
