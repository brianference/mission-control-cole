#!/usr/bin/env node

/**
 * Generate agents data JSON file
 * 
 * This script calls OpenClaw tools directly (within agent context)
 * and outputs a static JSON file that the dashboard can fetch.
 * 
 * Run periodically via cron or prebuild script.
 * 
 * Usage: openclaw agent --local --message "$(cat gen-agents-data.js | tail -n +20)"
 */

// This code runs INSIDE an OpenClaw agent context
(async () => {
  try {
    // Call tools to get real data
    const sessionsResult = await sessions_list({ limit: 50, messageLimit: 0 });
    const subagentsResult = await subagents({ action: 'list' });

    const sessions = sessionsResult.sessions || [];
    const activeSubagents = subagentsResult.active || [];
    const recentSubagents = subagentsResult.recent || [];

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

    // Add active subagents
    activeSubagents.forEach(sub => {
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

    // Calculate stats
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
          return sum + (tokensPerHour / 1000000 * 3.00);
        }, 0) / agents.length
      : 0;

    const output = {
      success: true,
      timestamp: Date.now(),
      generated: new Date().toISOString(),
      agents,
      stats: {
        total: agents.length,
        active: agents.filter(a => a.status === 'active').length,
        totalCost: totalCost.toFixed(2),
        avgBurnRate: avgBurnRate.toFixed(2)
      }
    };

    // Write to file
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, '..', 'agents-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✅ Generated agents data: ${agents.length} agents, $${totalCost.toFixed(2)} total cost`);
    console.log(`   Output: ${outputPath}`);
  } catch (error) {
    console.error('❌ Failed to generate agents data:', error);
    process.exit(1);
  }
})();
