#!/usr/bin/env node

/**
 * Generate logs.json from real OpenClaw system data
 * 
 * Usage: node gen-logs.js
 * 
 * Sources:
 * - OpenClaw session activity
 * - System logs (journalctl for openclaw service)
 * - Cron job execution logs
 * - Gateway activity
 * 
 * Output: logs.json in project root
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'logs.json');

// Log level priorities for sorting
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

function getSessionLogs() {
  try {
    console.log('[gen-logs] Fetching session activity...');
    
    // Get recent sessions to extract activity logs
    const stdout = execSync('openclaw sessions --json --active 120', {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 15000
    });
    
    const result = JSON.parse(stdout);
    const sessions = result.sessions || [];
    
    const logs = sessions.map(session => {
      const timestamp = session.updatedAt || session.createdAt;
      const timestampISO = typeof timestamp === 'number' 
        ? new Date(timestamp).toISOString()
        : (timestamp || new Date().toISOString());
      
      return {
        timestamp: timestampISO,
        level: session.status === 'error' ? 'error' : 'info',
        source: 'agent',
        agentId: session.agentId || 'unknown',
        message: session.status === 'error' 
          ? `Agent error: ${session.label || session.agentId}`
          : `Agent ${session.status || 'active'}: ${session.label || session.agentId}`,
        metadata: {
          sessionKey: session.sessionKey || session.key,
          model: session.model,
          tokens: session.tokens,
          messageCount: session.messageCount
        }
      };
    });
    
    console.log(`[gen-logs] ✓ Extracted ${logs.length} session logs`);
    return logs;
    
  } catch (error) {
    console.log(`[gen-logs] ⚠ Session logs unavailable: ${error.message}`);
    return [];
  }
}

function getCronLogs() {
  try {
    console.log('[gen-logs] Fetching cron job logs...');
    
    // Get cron data
    const stdout = execSync('openclaw cron list --json', {
      encoding: 'utf-8',
      maxBuffer: 5 * 1024 * 1024,
      timeout: 5000
    });
    
    const result = JSON.parse(stdout);
    const crons = result.crons || [];
    
    // Generate logs for recent cron runs
    const logs = crons
      .filter(cron => cron.lastRun)
      .map(cron => ({
        timestamp: cron.lastRun,
        level: cron.lastRunStatus === 'error' ? 'error' : 'info',
        source: 'cron',
        cronId: cron.id,
        message: cron.lastRunStatus === 'error'
          ? `Cron job failed: ${cron.prompt || cron.id}`
          : `Cron job executed: ${cron.prompt || cron.id}`,
        metadata: {
          schedule: cron.schedule,
          model: cron.model,
          lastRunStatus: cron.lastRunStatus,
          cost: cron.lastRunCost
        }
      }));
    
    console.log(`[gen-logs] ✓ Extracted ${logs.length} cron logs`);
    return logs;
    
  } catch (error) {
    console.log(`[gen-logs] ⚠ Cron logs unavailable: ${error.message}`);
    return [];
  }
}

function getSystemLogs() {
  try {
    console.log('[gen-logs] Fetching system logs...');
    
    // Get OpenClaw gateway logs from journalctl
    const stdout = execSync(
      'journalctl -u openclaw-gateway --since "24 hours ago" --no-pager --output json --lines 20 2>/dev/null',
      {
        encoding: 'utf-8',
        maxBuffer: 5 * 1024 * 1024,
        timeout: 10000
      }
    );
    
    const lines = stdout.trim().split('\n').filter(Boolean);
    const logs = lines.map(line => {
      try {
        const entry = JSON.parse(line);
        return {
          timestamp: new Date(parseInt(entry.__REALTIME_TIMESTAMP) / 1000).toISOString(),
          level: entry.PRIORITY <= 3 ? 'error' : (entry.PRIORITY === 4 ? 'warn' : 'info'),
          source: 'gateway',
          message: entry.MESSAGE || 'Gateway activity',
          metadata: {
            unit: entry._SYSTEMD_UNIT,
            pid: entry._PID
          }
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    console.log(`[gen-logs] ✓ Extracted ${logs.length} system logs`);
    return logs;
    
  } catch (error) {
    console.log(`[gen-logs] ⚠ System logs unavailable: ${error.message}`);
    return [];
  }
}

function getWorkspaceLogs() {
  try {
    console.log('[gen-logs] Scanning workspace activity...');
    
    // Check for recent git commits as activity logs
    const stdout = execSync(
      'cd /root/.openclaw/workspace && git log --since="24 hours ago" --pretty=format:"%aI|%s" --max-count=10 2>/dev/null',
      {
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024,
        timeout: 5000
      }
    );
    
    const lines = stdout.trim().split('\n').filter(Boolean);
    const logs = lines.map(line => {
      const [timestamp, message] = line.split('|');
      return {
        timestamp: timestamp || new Date().toISOString(),
        level: 'info',
        source: 'workspace',
        message: `Git commit: ${message}`,
        metadata: {
          repo: 'workspace'
        }
      };
    });
    
    console.log(`[gen-logs] ✓ Extracted ${logs.length} workspace logs`);
    return logs;
    
  } catch (error) {
    console.log(`[gen-logs] ⚠ Workspace logs unavailable: ${error.message}`);
    return [];
  }
}

function generateLogsData() {
  try {
    console.log('[gen-logs] Generating logs.json from real data...\n');
    
    // Aggregate logs from all sources
    const allLogs = [
      ...getSessionLogs(),
      ...getCronLogs(),
      ...getSystemLogs(),
      ...getWorkspaceLogs()
    ];
    
    // Sort by timestamp (newest first)
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Take last 100 logs
    const recentLogs = allLogs.slice(0, 100);
    
    const output = {
      logs: recentLogs,
      generatedAt: new Date().toISOString(),
      totalLogs: recentLogs.length,
      sources: {
        agents: recentLogs.filter(l => l.source === 'agent').length,
        crons: recentLogs.filter(l => l.source === 'cron').length,
        gateway: recentLogs.filter(l => l.source === 'gateway').length,
        workspace: recentLogs.filter(l => l.source === 'workspace').length
      },
      levels: {
        error: recentLogs.filter(l => l.level === 'error').length,
        warn: recentLogs.filter(l => l.level === 'warn').length,
        info: recentLogs.filter(l => l.level === 'info').length,
        debug: recentLogs.filter(l => l.level === 'debug').length
      }
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`\n[gen-logs] ✓ Written ${recentLogs.length} logs to ${OUTPUT_FILE}`);
    console.log(`[gen-logs] Sources: ${output.sources.agents} agents, ${output.sources.crons} crons, ${output.sources.gateway} gateway, ${output.sources.workspace} workspace`);
    console.log(`[gen-logs] Levels: ${output.levels.error} errors, ${output.levels.warn} warnings, ${output.levels.info} info`);
    
    return output;
    
  } catch (error) {
    console.error('[gen-logs] Error:', error.message);
    
    // Write empty fallback
    const fallback = {
      logs: [],
      generatedAt: new Date().toISOString(),
      totalLogs: 0,
      sources: { agents: 0, crons: 0, gateway: 0, workspace: 0 },
      levels: { error: 0, warn: 0, info: 0, debug: 0 },
      error: error.message
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fallback, null, 2));
    console.log(`[gen-logs] ⚠ Written empty fallback due to error`);
    
    return fallback;
  }
}

// Run if called directly
if (require.main === module) {
  const result = generateLogsData();
  
  if (result.totalLogs === 0) {
    console.log('\n[gen-logs] No logs found - empty fallback created');
  }
  
  process.exit(0);
}

module.exports = { generateLogsData };
