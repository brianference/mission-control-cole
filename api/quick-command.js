/**
 * Quick Commands API - Execute common operations
 * MC-004: Deploy, security scan, git push, backup, health check, etc.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Command timeout (5 minutes max)
const COMMAND_TIMEOUT = 300000;

// Command history file
const HISTORY_FILE = path.join(__dirname, '..', 'quick-commands-history.json');

/**
 * Execute a quick command
 */
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { command, confirmation } = JSON.parse(event.body || '{}');

    if (!command) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Command is required' }),
      };
    }

    // Security: whitelist of allowed commands
    const allowedCommands = {
      'deploy-all': deployAll,
      'security-scan': securityScan,
      'git-push-all': gitPushAll,
      'backup-now': backupNow,
      'health-check': healthCheck,
      'clean-logs': cleanLogs,
      'restart-gateway': restartGateway,
    };

    if (!allowedCommands[command]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Unknown command' }),
      };
    }

    const startTime = Date.now();
    const result = await allowedCommands[command](confirmation);
    const duration = Date.now() - startTime;

    // Save to history
    await saveCommandHistory({
      command,
      timestamp: new Date().toISOString(),
      duration,
      status: result.success ? 'success' : 'error',
      output: result.output.substring(0, 500), // Truncate long output
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: result.success,
        output: result.output,
        duration,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Quick command error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Command execution failed',
        message: error.message,
      }),
    };
  }
};

/**
 * Deploy All - Push to GitHub + trigger Cloudflare builds
 */
async function deployAll() {
  try {
    const commands = [
      'cd /root/.openclaw/workspace/mission-control-dashboard && git add . && git commit -m "Auto-deploy" || true',
      'cd /root/.openclaw/workspace/mission-control-dashboard && git push origin main',
      'cd /root/.openclaw/workspace/python-kanban && git add . && git commit -m "Auto-deploy" || true',
      'cd /root/.openclaw/workspace/python-kanban && git push origin master',
    ];

    const results = [];
    for (const cmd of commands) {
      try {
        const { stdout, stderr } = await execAsync(cmd, { timeout: COMMAND_TIMEOUT });
        results.push(stdout || stderr);
      } catch (err) {
        results.push(`Error: ${err.message}`);
      }
    }

    return {
      success: true,
      output: results.join('\n\n'),
    };
  } catch (error) {
    return {
      success: false,
      output: `Deploy failed: ${error.message}`,
    };
  }
}

/**
 * Security Scan - Run security-sentinel
 */
async function securityScan() {
  try {
    const { stdout, stderr } = await execAsync(
      'cd /root/.openclaw/workspace && bash skills/security-sentinel/scripts/scan-workspace.sh 2>&1',
      { timeout: COMMAND_TIMEOUT }
    );
    return {
      success: true,
      output: stdout || stderr || 'Security scan complete - no output',
    };
  } catch (error) {
    return {
      success: false,
      output: `Security scan failed: ${error.message}`,
    };
  }
}

/**
 * Git Push All - Commit and push all dirty repos
 */
async function gitPushAll(confirmation) {
  try {
    const repos = [
      '/root/.openclaw/workspace',
      '/root/.openclaw/workspace/python-kanban',
      '/root/.openclaw/workspace/projects/mobileclaw',
      '/root/.openclaw/workspace/mission-control-cole',
      '/root/.openclaw/workspace/projects/mission-control-dashboard',
    ];

    const results = [];
    let totalFiles = 0;

    for (const repo of repos) {
      try {
        // Check for changes
        const { stdout: status } = await execAsync(`cd ${repo} && git status --porcelain`, { timeout: 10000 });
        
        if (status.trim()) {
          const fileCount = status.trim().split('\n').length;
          totalFiles += fileCount;

          // Commit and push
          const { stdout: commitOut } = await execAsync(
            `cd ${repo} && git add . && git commit -m "Quick command: git push all" && git push`,
            { timeout: COMMAND_TIMEOUT }
          );
          results.push(`${path.basename(repo)}: ${fileCount} files pushed\n${commitOut}`);
        } else {
          results.push(`${path.basename(repo)}: No changes`);
        }
      } catch (err) {
        results.push(`${path.basename(repo)}: ${err.message}`);
      }
    }

    return {
      success: true,
      output: `Total files: ${totalFiles}\n\n${results.join('\n\n')}`,
    };
  } catch (error) {
    return {
      success: false,
      output: `Git push failed: ${error.message}`,
    };
  }
}

/**
 * Backup Now - Trigger Supermemory backup
 */
async function backupNow() {
  try {
    const { stdout, stderr } = await execAsync(
      'cd /root/.openclaw/workspace && python3 update-supermemory.py 2>&1',
      { timeout: COMMAND_TIMEOUT }
    );
    return {
      success: true,
      output: stdout || stderr || 'Backup complete',
    };
  } catch (error) {
    return {
      success: false,
      output: `Backup failed: ${error.message}`,
    };
  }
}

/**
 * Health Check - Run gateway watchdog
 */
async function healthCheck() {
  try {
    const commands = [
      'openclaw status',
      'systemctl status openclaw-gateway --no-pager -l',
    ];

    const results = [];
    for (const cmd of commands) {
      try {
        const { stdout, stderr } = await execAsync(cmd, { timeout: 10000 });
        results.push(stdout || stderr);
      } catch (err) {
        results.push(`${cmd}: ${err.message}`);
      }
    }

    return {
      success: true,
      output: results.join('\n\n'),
    };
  } catch (error) {
    return {
      success: false,
      output: `Health check failed: ${error.message}`,
    };
  }
}

/**
 * Clean Logs - Archive old logs
 */
async function cleanLogs() {
  try {
    const commands = [
      'find /root/.openclaw/workspace/memory -name "*.md" -mtime +30 -exec gzip {} \\;',
      'find /tmp -name "*.log" -mtime +7 -delete',
      'journalctl --vacuum-time=7d',
    ];

    const results = [];
    for (const cmd of commands) {
      try {
        const { stdout, stderr } = await execAsync(cmd, { timeout: 60000 });
        results.push(stdout || stderr || `${cmd}: OK`);
      } catch (err) {
        results.push(`${cmd}: ${err.message}`);
      }
    }

    return {
      success: true,
      output: results.join('\n'),
    };
  } catch (error) {
    return {
      success: false,
      output: `Log cleanup failed: ${error.message}`,
    };
  }
}

/**
 * Restart Gateway - systemctl restart openclaw-gateway
 */
async function restartGateway(confirmation) {
  if (!confirmation) {
    return {
      success: false,
      output: 'Confirmation required: This will restart the gateway and may interrupt active sessions.',
    };
  }

  try {
    const { stdout, stderr } = await execAsync(
      'systemctl restart openclaw-gateway',
      { timeout: 30000 }
    );
    return {
      success: true,
      output: stdout || stderr || 'Gateway restarted successfully',
    };
  } catch (error) {
    return {
      success: false,
      output: `Gateway restart failed: ${error.message}`,
    };
  }
}

/**
 * Save command execution to history
 */
async function saveCommandHistory(entry) {
  try {
    let history = [];
    try {
      const data = await fs.readFile(HISTORY_FILE, 'utf8');
      history = JSON.parse(data);
    } catch (err) {
      // File doesn't exist yet
    }

    history.unshift(entry);
    
    // Keep last 100 commands
    if (history.length > 100) {
      history = history.slice(0, 100);
    }

    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Failed to save command history:', error);
  }
}
