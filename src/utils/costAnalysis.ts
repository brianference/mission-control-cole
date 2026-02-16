// Cost analysis utility functions for REAL OpenClaw data
// NO MOCK DATA - all functions process real session/usage data

export interface SessionData {
  id: string;
  timestamp: string;
  totalCost: number;
  tokens: number;
  model: string;
  provider: string;
  toolCalls: ToolCall[];
  hourOfDay: number;
  cacheHitRate: number;
  tokenEfficiency: number; // cost per 1K tokens
}

export interface ToolCall {
  tool: string;
  count: number;
  cost: number;
  avgDuration: number;
}

export interface CronJob {
  name: string;
  dailyCost: number;
  monthlyCost: number;
  frequency: string;
  avgCostPerRun: number;
  runsPerDay: number;
  optimization: string;
}

export interface CostSpike {
  date: string;
  cost: number;
  avgCost: number;
  multiplier: number;
}

// Parse cron cost summary from markdown
export function parseCronCosts(markdown: string): CronJob[] {
  const jobs: CronJob[] = [];
  
  // Parse the "Top 5 Most Expensive" table
  const tableMatch = markdown.match(/\| Rank \| Job Name[\s\S]*?\n\n/);
  if (!tableMatch) return jobs;
  
  const rows = tableMatch[0].split('\n').slice(2); // Skip header rows
  
  for (const row of rows) {
    if (!row.trim() || row.includes('---')) continue;
    
    const cols = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 5) continue;
    
    const [, name, monthlyCostStr, , frequency] = cols;
    const monthlyCost = parseFloat(monthlyCostStr.replace(/[$,]/g, ''));
    
    if (isNaN(monthlyCost)) continue;
    
    const runsPerDay = frequency.includes('30 min') ? 48
      : frequency.includes('2 hour') ? 12
      : frequency.includes('Daily') ? 1
      : 24;
    
    jobs.push({
      name,
      dailyCost: monthlyCost / 30,
      monthlyCost,
      frequency,
      avgCostPerRun: monthlyCost / (runsPerDay * 30),
      runsPerDay,
      optimization: runsPerDay > 24 ? 'Consider reducing frequency' : 'Optimized',
    });
  }
  
  return jobs;
}

// Calculate cost spikes (>threshold x average)
export function detectCostSpikes(
  daily: Array<{ date: string; cost: number }>,
  threshold: number = 2
): CostSpike[] {
  if (daily.length === 0) return [];
  
  const avgCost = daily.reduce((sum, d) => sum + d.cost, 0) / daily.length;
  
  return daily
    .filter(d => d.cost > avgCost * threshold)
    .map(d => ({
      date: d.date,
      cost: d.cost,
      avgCost,
      multiplier: d.cost / avgCost,
    }))
    .sort((a, b) => b.multiplier - a.multiplier);
}

// Calculate week-over-week change percentage
export function calculateWeekOverWeek(
  daily: Array<{ date: string; cost: number }>
): number {
  if (daily.length < 14) return 0;
  
  const thisWeek = daily.slice(0, 7).reduce((sum, d) => sum + d.cost, 0);
  const lastWeek = daily.slice(7, 14).reduce((sum, d) => sum + d.cost, 0);
  
  if (lastWeek === 0) return 0;
  
  return ((thisWeek - lastWeek) / lastWeek) * 100;
}

// Generate hour-of-day heatmap data from REAL sessions
export function generateHourOfDayHeatmap(sessions: SessionData[]) {
  const heatmap: { [hour: number]: { [day: number]: number } } = {};
  
  // Initialize heatmap
  for (let hour = 0; hour < 24; hour++) {
    heatmap[hour] = {};
    for (let day = 0; day < 7; day++) {
      heatmap[hour][day] = 0;
    }
  }
  
  // Aggregate real session data
  sessions.forEach(session => {
    const date = new Date(session.timestamp);
    const hour = date.getHours();
    const day = date.getDay();
    
    if (!heatmap[hour][day]) heatmap[hour][day] = 0;
    heatmap[hour][day] += session.totalCost;
  });
  
  // Convert to array format for Recharts
  const data = [];
  for (let hour = 0; hour < 24; hour++) {
    const row: any = { hour: `${hour}:00` };
    for (let day = 0; day < 7; day++) {
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day];
      row[dayName] = heatmap[hour][day] || 0;
    }
    data.push(row);
  }
  
  return data;
}

// Aggregate tool call statistics from REAL sessions
export function aggregateToolCalls(sessions: SessionData[]) {
  const toolStats: { [tool: string]: { count: number; cost: number; totalDuration: number; calls: number } } = {};
  
  sessions.forEach(session => {
    session.toolCalls.forEach(tc => {
      if (!toolStats[tc.tool]) {
        toolStats[tc.tool] = { count: 0, cost: 0, totalDuration: 0, calls: 0 };
      }
      toolStats[tc.tool].count += tc.count;
      toolStats[tc.tool].cost += tc.cost;
      toolStats[tc.tool].totalDuration += tc.avgDuration * tc.count;
      toolStats[tc.tool].calls += tc.count;
    });
  });
  
  return Object.entries(toolStats)
    .map(([tool, stats]) => ({
      tool,
      count: stats.count,
      cost: stats.cost,
      avgDuration: stats.calls > 0 ? stats.totalDuration / stats.calls : 0,
      efficiency: stats.count > 0 ? stats.cost / stats.count : 0,
    }))
    .sort((a, b) => b.cost - a.cost);
}
