// Mock session data generator for development
// In production, this would parse real JSONL files

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

// Generate mock session data based on usage-data.json patterns
export function generateMockSessions(count: number = 100): SessionData[] {
  const sessions: SessionData[] = [];
  const models = [
    { name: 'Claude Sonnet 4.5', weight: 70 },
    { name: 'claude-opus-4-5', weight: 15 },
    { name: 'claude-haiku-4-5', weight: 15 },
  ];
  
  const tools = ['exec', 'read', 'write', 'browser', 'web_search', 'memory_store', 'nodes'];
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    date.setHours(Math.floor(Math.random() * 24));
    
    const model = weightedRandom(models);
    const baseCost = model.name.includes('Sonnet') ? Math.random() * 20 
      : model.name.includes('Opus') ? Math.random() * 50
      : Math.random() * 2;
    
    const totalCost = baseCost + Math.random() * 30;
    const tokens = Math.floor(totalCost * 10000);
    
    // Generate tool calls
    const numTools = Math.floor(Math.random() * 8) + 2;
    const toolCalls: ToolCall[] = [];
    for (let j = 0; j < numTools; j++) {
      const tool = tools[Math.floor(Math.random() * tools.length)];
      toolCalls.push({
        tool,
        count: Math.floor(Math.random() * 20) + 1,
        cost: Math.random() * 5,
        avgDuration: Math.random() * 2000 + 100,
      });
    }
    
    sessions.push({
      id: `session-${i}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: date.toISOString(),
      totalCost,
      tokens,
      model: model.name,
      provider: model.name.includes('Claude') ? 'Anthropic' : 'OpenAI',
      toolCalls,
      hourOfDay: date.getHours(),
      cacheHitRate: Math.random() * 0.95,
      tokenEfficiency: (totalCost / tokens) * 1000,
    });
  }
  
  return sessions.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function weightedRandom(items: { name: string; weight: number }[]) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  
  return items[0];
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

// Calculate cost spikes (>2x average)
export interface CostSpike {
  date: string;
  cost: number;
  avgCost: number;
  multiplier: number;
}

export function detectCostSpikes(
  daily: Array<{ date: string; cost: number }>,
  threshold: number = 2
): CostSpike[] {
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

// Calculate week-over-week change
export function calculateWeekOverWeek(
  daily: Array<{ date: string; cost: number }>
): number {
  if (daily.length < 14) return 0;
  
  const thisWeek = daily.slice(0, 7).reduce((sum, d) => sum + d.cost, 0);
  const lastWeek = daily.slice(7, 14).reduce((sum, d) => sum + d.cost, 0);
  
  return ((thisWeek - lastWeek) / lastWeek) * 100;
}

// Generate hour-of-day heatmap data
export function generateHourOfDayHeatmap(sessions: SessionData[]) {
  const heatmap: { [hour: number]: { [day: number]: number } } = {};
  
  for (let hour = 0; hour < 24; hour++) {
    heatmap[hour] = {};
    for (let day = 0; day < 7; day++) {
      heatmap[hour][day] = 0;
    }
  }
  
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

// Aggregate tool call statistics
export function aggregateToolCalls(sessions: SessionData[]) {
  const toolStats: { [tool: string]: { count: number; cost: number; avgDuration: number } } = {};
  
  sessions.forEach(session => {
    session.toolCalls.forEach(tc => {
      if (!toolStats[tc.tool]) {
        toolStats[tc.tool] = { count: 0, cost: 0, avgDuration: 0 };
      }
      toolStats[tc.tool].count += tc.count;
      toolStats[tc.tool].cost += tc.cost;
      toolStats[tc.tool].avgDuration += tc.avgDuration;
    });
  });
  
  return Object.entries(toolStats)
    .map(([tool, stats]) => ({
      tool,
      count: stats.count,
      cost: stats.cost,
      avgDuration: stats.avgDuration / sessions.length,
      efficiency: stats.count > 0 ? stats.cost / stats.count : 0,
    }))
    .sort((a, b) => b.cost - a.cost);
}
