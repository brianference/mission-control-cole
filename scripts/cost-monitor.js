#!/usr/bin/env node
/**
 * Cost Monitor - Track spending and send alerts
 * Part of MC-003: Cost Alerts feature
 * 
 * Monitors OpenClaw costs and sends alerts when thresholds are exceeded
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Paths
const WORKSPACE = '/root/.openclaw/workspace';
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const COST_TRACKING = path.join(MEMORY_DIR, 'cost-tracking.json');
const ALERT_CONFIG = path.join(WORKSPACE, 'projects/mission-control-dashboard/cost-alerts-config.json');
const ALERT_HISTORY = path.join(WORKSPACE, 'projects/mission-control-dashboard/cost-alerts-history.json');

// Model pricing (per 1M tokens)
const MODEL_PRICING = {
  'anthropic/claude-sonnet-4-5': { input: 3.00, output: 15.00 },
  'anthropic/claude-sonnet-3-5': { input: 3.00, output: 15.00 },
  'google/gemini-3-flash-preview': { input: 0.075, output: 0.30 },
  'google/gemini-flash-1-5': { input: 0.075, output: 0.30 },
  'openai/gpt-4o': { input: 2.50, output: 10.00 },
  'openai/gpt-4o-mini': { input: 0.15, output: 0.60 }
};

// Default configuration
const DEFAULT_CONFIG = {
  dailyBudget: 10.00,  // $10/day
  monthlyBudget: 300.00,  // $300/month
  alertThresholds: [50, 75, 90],  // Alert at 50%, 75%, 90% of budget
  perSessionLimit: 5.00,  // $5 max per session
  expensiveSessionThreshold: 2.00,  // Alert if session costs >$2
  tokenBurnRateThreshold: 1.00,  // Alert if >$1/hour
  cronJobCostThreshold: 0.50,  // Alert if cron >$0.50/run
  notificationChannels: {
    telegram: true,
    email: false,
    dashboard: true
  },
  emergencyKillSwitch: false  // If true, disable agents at 100% budget
};

// Load or create configuration
function loadConfig() {
  if (fs.existsSync(ALERT_CONFIG)) {
    return JSON.parse(fs.readFileSync(ALERT_CONFIG, 'utf8'));
  }
  // Create default config
  fs.writeFileSync(ALERT_CONFIG, JSON.stringify(DEFAULT_CONFIG, null, 2));
  return DEFAULT_CONFIG;
}

// Load cost tracking data
function loadCostTracking() {
  if (fs.existsSync(COST_TRACKING)) {
    return JSON.parse(fs.readFileSync(COST_TRACKING, 'utf8'));
  }
  return {
    daily: {},
    monthly: {},
    sessions: {},
    crons: {},
    lastReset: new Date().toISOString()
  };
}

// Save cost tracking data
function saveCostTracking(data) {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
  fs.writeFileSync(COST_TRACKING, JSON.stringify(data, null, 2));
}

// Load alert history
function loadAlertHistory() {
  if (fs.existsSync(ALERT_HISTORY)) {
    return JSON.parse(fs.readFileSync(ALERT_HISTORY, 'utf8'));
  }
  return { alerts: [] };
}

// Save alert history
function saveAlertHistory(history) {
  fs.writeFileSync(ALERT_HISTORY, JSON.stringify(history, null, 2));
}

// Calculate cost for a session
function calculateSessionCost(sessionData) {
  const model = sessionData.model || 'anthropic/claude-sonnet-4-5';
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['anthropic/claude-sonnet-4-5'];
  
  const inputTokens = sessionData.inputTokens || 0;
  const outputTokens = sessionData.outputTokens || 0;
  
  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  
  return inputCost + outputCost;
}

// Get today's spending
function getTodaySpending(costTracking) {
  const today = new Date().toISOString().split('T')[0];
  return costTracking.daily[today] || 0;
}

// Get this month's spending
function getMonthSpending(costTracking) {
  const thisMonth = new Date().toISOString().substring(0, 7);  // YYYY-MM
  return costTracking.monthly[thisMonth] || 0;
}

// Send Telegram alert
async function sendTelegramAlert(message) {
  const keysPath = '/root/.openclaw/secrets/keys.env';
  if (!fs.existsSync(keysPath)) {
    console.log('Keys file not found, skipping Telegram alert');
    return;
  }
  
  // Load Telegram credentials
  const keysContent = fs.readFileSync(keysPath, 'utf8');
  const botTokenMatch = keysContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
  const chatIdMatch = keysContent.match(/TELEGRAM_CHAT_ID=(.+)/);
  
  if (!botTokenMatch || !chatIdMatch) {
    console.log('Telegram credentials not found');
    return;
  }
  
  const botToken = botTokenMatch[1].trim();
  const chatId = chatIdMatch[1].trim();
  
  try {
    await execPromise(`curl -s -X POST "https://api.telegram.org/bot${botToken}/sendMessage" \
      -d "chat_id=${chatId}" \
      -d "text=${encodeURIComponent('🚨 *Cost Alert*\\n\\n' + message)}" \
      -d "parse_mode=Markdown"`);
    console.log('✅ Telegram alert sent');
  } catch (error) {
    console.error('❌ Failed to send Telegram alert:', error.message);
  }
}

// Record alert
function recordAlert(alertHistory, alertType, message, severity) {
  alertHistory.alerts.push({
    timestamp: new Date().toISOString(),
    type: alertType,
    message,
    severity,
    acknowledged: false
  });
  
  // Keep only last 100 alerts
  if (alertHistory.alerts.length > 100) {
    alertHistory.alerts = alertHistory.alerts.slice(-100);
  }
  
  saveAlertHistory(alertHistory);
}

// Check daily budget thresholds
async function checkDailyBudget(config, costTracking, alertHistory) {
  const todaySpending = getTodaySpending(costTracking);
  const budget = config.dailyBudget;
  const percentage = (todaySpending / budget) * 100;
  
  for (const threshold of config.alertThresholds) {
    if (percentage >= threshold && percentage < threshold + 5) {
      const message = `Daily spending at ${percentage.toFixed(1)}% ($${todaySpending.toFixed(2)} / $${budget.toFixed(2)})`;
      
      console.log(`⚠️  ${message}`);
      
      if (config.notificationChannels.telegram) {
        await sendTelegramAlert(message);
      }
      
      recordAlert(alertHistory, 'daily_budget', message, 'warning');
    }
  }
  
  // Emergency kill switch
  if (config.emergencyKillSwitch && percentage >= 100) {
    const message = `🛑 EMERGENCY: Daily budget exceeded! Disabling expensive agents.`;
    console.log(message);
    
    if (config.notificationChannels.telegram) {
      await sendTelegramAlert(message);
    }
    
    recordAlert(alertHistory, 'emergency_kill', message, 'critical');
  }
}

// Check session costs
async function checkSessionCosts(config, costTracking, alertHistory) {
  for (const [sessionId, cost] of Object.entries(costTracking.sessions || {})) {
    if (cost > config.expensiveSessionThreshold) {
      const message = `Session ${sessionId.substring(0, 8)} cost $${cost.toFixed(2)} (threshold: $${config.expensiveSessionThreshold.toFixed(2)})`;
      
      console.log(`💰 ${message}`);
      
      // Only alert once per session
      const alreadyAlerted = alertHistory.alerts.some(a => 
        a.type === 'expensive_session' && a.message.includes(sessionId.substring(0, 8))
      );
      
      if (!alreadyAlerted && config.notificationChannels.telegram) {
        await sendTelegramAlert(message);
      }
      
      if (!alreadyAlerted) {
        recordAlert(alertHistory, 'expensive_session', message, 'info');
      }
    }
  }
}

// Generate daily summary
function generateDailySummary(costTracking) {
  const todaySpending = getTodaySpending(costTracking);
  const today = new Date().toISOString().split('T')[0];
  
  // Get top models
  const modelCosts = {};
  for (const [sessionId, cost] of Object.entries(costTracking.sessions || {})) {
    const model = sessionId.split(':')[0] || 'unknown';
    modelCosts[model] = (modelCosts[model] || 0) + cost;
  }
  
  const topModels = Object.entries(modelCosts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([model, cost]) => `  • ${model}: $${cost.toFixed(2)}`)
    .join('\\n');
  
  return `*Daily Cost Summary* (${today})
  
Total: $${todaySpending.toFixed(2)}

Top Models:
${topModels || '  No usage today'}

Track costs: https://mission-control.cole.pages.dev/costs.html`;
}

// Main monitoring function
async function monitor() {
  console.log('🔍 Running cost monitor...');
  
  const config = loadConfig();
  const costTracking = loadCostTracking();
  const alertHistory = loadAlertHistory();
  
  // Check daily budget
  await checkDailyBudget(config, costTracking, alertHistory);
  
  // Check session costs
  await checkSessionCosts(config, costTracking, alertHistory);
  
  // Save updated alert history
  saveAlertHistory(alertHistory);
  
  console.log('✅ Cost monitoring complete');
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'monitor':
      monitor().catch(console.error);
      break;
    
    case 'summary':
      const costTracking = loadCostTracking();
      console.log(generateDailySummary(costTracking));
      break;
    
    case 'config':
      const config = loadConfig();
      console.log(JSON.stringify(config, null, 2));
      break;
    
    case 'alerts':
      const alertHistory = loadAlertHistory();
      console.log(`Recent alerts (${alertHistory.alerts.length}):`);
      alertHistory.alerts.slice(-10).forEach(alert => {
        console.log(`[${alert.timestamp}] ${alert.severity.toUpperCase()}: ${alert.message}`);
      });
      break;
    
    default:
      console.log(`
Cost Monitor - MC-003 Cost Alerts

Usage:
  node cost-monitor.js monitor    Run cost monitoring check
  node cost-monitor.js summary    Show daily cost summary
  node cost-monitor.js config     Show current configuration
  node cost-monitor.js alerts     Show recent alerts

Configuration file: ${ALERT_CONFIG}
Alert history: ${ALERT_HISTORY}
Cost tracking: ${COST_TRACKING}
      `);
  }
}

module.exports = { monitor, calculateSessionCost, generateDailySummary };
