#!/usr/bin/env node

/**
 * Generate active-sessions.json from real OpenClaw data
 * 
 * Usage: node gen-sessions.js
 * 
 * Calls: openclaw sessions list --json
 * Output: active-sessions.json in project root
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'active-sessions.json');

// Model context limits
const CONTEXT_LIMITS = {
  'claude-sonnet-4-5': 200000,
  'claude-opus-4': 200000,
  'google/gemini-2.5-flash': 1000000,
  'openai/gpt-4': 128000,
  'openai/gpt-4-turbo': 128000
};

function getContextLimit(model) {
  return CONTEXT_LIMITS[model] || 200000;
}

function generateSessionsData() {
  try {
    console.log('[gen-sessions] Fetching active agent sessions...');
    
    // Call openclaw sessions --json (active sessions from last 60 minutes)
    const stdout = execSync('openclaw sessions --json --active 60', {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 30000 // 30 second timeout
    });
    
    const result = JSON.parse(stdout);
    const sessions = result.sessions || [];
    
    console.log(`[gen-sessions] Found ${sessions.length} active sessions`);
    
    // Transform to expected format
    const transformedSessions = sessions.map(session => ({
      sessionKey: session.sessionKey || session.key,
      agentId: session.agentId || 'unknown',
      displayName: session.label || session.agentId || 'Agent',
      status: session.status || 'idle',
      model: session.model || 'claude-sonnet-4-5',
      totalTokens: session.tokens || 0,
      messageCount: session.messageCount || 0,
      createdAt: session.createdAt ? new Date(session.createdAt).getTime() : Date.now(),
      updatedAt: session.updatedAt ? new Date(session.updatedAt).getTime() : Date.now(),
      contextLimit: getContextLimit(session.model || 'claude-sonnet-4-5')
    }));
    
    // Sort by most recently active
    transformedSessions.sort((a, b) => b.updatedAt - a.updatedAt);
    
    const output = {
      sessions: transformedSessions,
      generatedAt: new Date().toISOString(),
      totalSessions: transformedSessions.length
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`[gen-sessions] ✓ Written ${transformedSessions.length} sessions to ${OUTPUT_FILE}`);
    
    return output;
    
  } catch (error) {
    console.error('[gen-sessions] Error:', error.message);
    
    // Write empty fallback
    const fallback = {
      sessions: [],
      generatedAt: new Date().toISOString(),
      totalSessions: 0,
      error: error.message
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fallback, null, 2));
    console.log(`[gen-sessions] ⚠ Written empty fallback due to error`);
    
    return fallback;
  }
}

// Run if called directly
if (require.main === module) {
  const result = generateSessionsData();
  
  if (result.totalSessions === 0) {
    console.log('[gen-sessions] No active agents found');
  } else {
    console.log('[gen-sessions] Agent summary:');
    result.sessions.forEach(s => {
      console.log(`  - ${s.displayName} (${s.model}): ${s.totalTokens.toLocaleString()} tokens, ${s.messageCount} messages`);
    });
  }
  
  process.exit(0);
}

module.exports = { generateSessionsData };
