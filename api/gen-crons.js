#!/usr/bin/env node
// Generate crons.json from OpenClaw cron list
const { execSync } = require('child_process');
const fs = require('fs');

console.log('📋 Generating crons.json from OpenClaw...');

try {
  // Get raw cron data from OpenClaw
  const output = execSync('openclaw cron list --json', { encoding: 'utf-8' });
  const data = JSON.parse(output);
  
  if (!data.jobs || !Array.isArray(data.jobs)) {
    console.error('❌ Invalid cron data structure');
    process.exit(1);
  }
  
  // Model pricing (per 1M tokens)
  const modelPricing = {
    'anthropic/claude-sonnet-4-5': { input: 3.00, output: 15.00 },
    'anthropic/claude-sonnet-4-6': { input: 3.00, output: 15.00 },
    'google/gemini-2.5-flash': { input: 0.075, output: 0.30 },
    'google/gemini-3-flash-preview': { input: 0.10, output: 0.40 },
    'openrouter/minimax/minimax-m2.1': { input: 0.15, output: 0.60 }
  };
  
  // Transform cron jobs
  const crons = data.jobs.map(job => {
    // Parse schedule
    let humanSchedule = 'Unknown schedule';
    if (job.schedule.kind === 'every') {
      const everyMs = job.schedule.everyMs;
      const hours = Math.floor(everyMs / 3600000);
      const minutes = Math.floor((everyMs % 3600000) / 60000);
      humanSchedule = hours > 0 
        ? `Every ${hours} hour${hours > 1 ? 's' : ''}`
        : `Every ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (job.schedule.kind === 'cron') {
      humanSchedule = parseCronExpression(job.schedule.expr);
    }
    
    // Estimate cost per run (rough estimate based on average token usage)
    const model = job.payload?.model || 'none';
    const avgTokens = 5000; // Conservative estimate
    const pricing = modelPricing[model];
    const costPerRun = pricing 
      ? ((pricing.input + pricing.output) * avgTokens / 1000000)
      : 0.00;
    
    // Calculate runs today
    const runsToday = calculateRunsToday(job);
    
    return {
      id: job.id,
      name: job.name,
      schedule: job.schedule.kind === 'cron' ? job.schedule.expr : `every ${job.schedule.everyMs}ms`,
      human_schedule: humanSchedule,
      enabled: job.enabled,
      last_status: job.state?.lastRunStatus === 'ok' ? 'ok' : 
                   job.state?.lastRunStatus === 'error' ? 'error' : 
                   !job.enabled ? 'disabled' : 'pending',
      last_run: job.state?.lastRunAtMs || null,
      next_run: job.state?.nextRunAtMs || null,
      model: model,
      cost_per_run: parseFloat(costPerRun.toFixed(3)),
      runs_today: runsToday,
      prompt: job.payload?.message?.substring(0, 200) || 'No prompt available',
      agent_id: job.agentId || 'main',
      session_target: job.sessionTarget || 'isolated',
      timeout_seconds: job.payload?.timeoutSeconds || 300
    };
  });
  
  // Calculate summary stats
  const stats = {
    total: crons.length,
    enabled: crons.filter(c => c.enabled).length,
    disabled: crons.filter(c => !c.enabled).length,
    errors: crons.filter(c => c.last_status === 'error').length,
    expensive: crons.filter(c => c.cost_per_run > 1.0).length,
    total_runs_today: crons.reduce((sum, c) => sum + c.runs_today, 0),
    total_cost_today: crons.reduce((sum, c) => sum + (c.cost_per_run * c.runs_today), 0),
    projected_monthly_cost: crons.reduce((sum, c) => {
      const runsPerDay = estimateRunsPerDay(c);
      return sum + (c.cost_per_run * runsPerDay * 30);
    }, 0)
  };
  
  const result = {
    crons,
    stats,
    generated_at: new Date().toISOString(),
    source: 'openclaw cron list'
  };
  
  fs.writeFileSync('crons.json', JSON.stringify(result, null, 2));
  console.log(`✅ Generated crons.json with ${crons.length} jobs`);
  console.log(`📊 Stats: ${stats.enabled} enabled, ${stats.disabled} disabled, ${stats.errors} errors`);
  console.log(`💰 Estimated cost today: $${stats.total_cost_today.toFixed(2)} | Monthly: $${stats.projected_monthly_cost.toFixed(2)}`);
  
} catch (error) {
  console.error('❌ Failed to generate crons.json:', error.message);
  process.exit(1);
}

// Helper functions
function parseCronExpression(expr) {
  // Basic cron expression parser (minute hour day month weekday)
  const parts = expr.split(' ');
  if (parts.length < 5) return `Cron: ${expr}`;
  
  const [min, hour, day, month, weekday] = parts;
  
  // Common patterns
  if (expr === '0 * * * *') return 'Every hour';
  if (expr === '*/15 * * * *') return 'Every 15 minutes';
  if (expr === '0 0 * * *') return 'Daily at midnight';
  if (expr === '0 0 * * 0') return 'Sundays at midnight';
  if (expr === '0 0 * * 1') return 'Mondays at midnight';
  
  // Hour-based
  if (min === '0' && hour !== '*') {
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    
    if (weekday === '*' && day === '*') {
      return `Daily at ${hour12}:00 ${ampm}`;
    } else if (weekday !== '*') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${days[parseInt(weekday)]}s at ${hour12}:00 ${ampm}`;
    }
  }
  
  return `Cron: ${expr}`;
}

function calculateRunsToday(job) {
  if (!job.enabled || !job.state?.lastRunAtMs) return 0;
  
  const now = Date.now();
  const dayStart = new Date().setHours(0, 0, 0, 0);
  
  if (job.state.lastRunAtMs < dayStart) return 0;
  
  // Estimate based on schedule
  if (job.schedule.kind === 'every') {
    const hoursSinceDayStart = (now - dayStart) / 3600000;
    const runsPerHour = 3600000 / job.schedule.everyMs;
    return Math.floor(runsPerHour * hoursSinceDayStart);
  }
  
  // For cron jobs, return 1 if it ran today
  return job.state.lastRunAtMs >= dayStart ? 1 : 0;
}

function estimateRunsPerDay(cron) {
  if (!cron.enabled) return 0;
  
  if (cron.schedule.includes('every')) {
    // Parse everyMs from schedule
    const match = cron.schedule.match(/every (\d+)ms/);
    if (match) {
      const everyMs = parseInt(match[1]);
      return Math.floor(86400000 / everyMs); // 24 hours in ms / everyMs
    }
  }
  
  // For cron expressions, estimate conservatively
  if (cron.schedule.includes('* * *')) return 24; // hourly
  if (cron.schedule.includes('*/15')) return 96; // every 15 min
  if (cron.schedule.includes('0 0 *')) return 1; // daily
  
  return 1; // Default: once per day
}
