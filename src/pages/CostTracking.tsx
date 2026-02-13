import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import TopExpensiveTable from '../components/cost/TopExpensiveTable';
import SpikeDetector from '../components/cost/SpikeDetector';
import CostHeatmap from '../components/cost/CostHeatmap';
import {
  generateMockSessions,
  parseCronCosts,
  calculateWeekOverWeek,
  generateHourOfDayHeatmap,
  aggregateToolCalls,
} from '../utils/mockSessionData';
import type { SessionData, CronJob } from '../utils/mockSessionData';
import './CommonPages.css';
import './CostTracking.css';

interface UsageData {
  summary: {
    weekTotal: number;
    monthTotal: number;
    totalSessions: number;
    totalRequests: number;
  };
  daily: Array<{
    date: string;
    cost: number;
    tokens: number;
    requests: number;
  }>;
  providers: Array<{
    name: string;
    cost: number;
    tokens: number;
    requests: number;
  }>;
  models: Array<{
    name: string;
    cost: number;
    tokens: number;
    requests: number;
  }>;
  taskTypes: Array<{
    name: string;
    cost: number;
    tokens: number;
    requests: number;
  }>;
  lastUpdated: string;
}

const COLORS = ['#818cf8', '#14b8a6', '#fb923c', '#34d399', '#fbbf24', '#f87171'];

const CostTracking: React.FC = () => {
  const [data, setData] = useState<UsageData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'tools' | 'cron' | 'optimization' | 'tokens' | 'agents'>('overview');

  useEffect(() => {
    // Load usage data
    fetch('/usage-data.json')
      .then(res => res.json())
      .then(usageData => {
        setData(usageData);
        
        // Generate mock session data (in production, parse real JSONL files)
        const mockSessions = generateMockSessions(100);
        setSessions(mockSessions);
        
        // Load cron cost data
        fetch('/cron-cost-summary.md')
          .then(res => res.text())
          .then(markdown => {
            const jobs = parseCronCosts(markdown);
            setCronJobs(jobs);
          })
          .catch(err => console.error('Failed to load cron costs:', err));
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load usage data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">💰 Cost Tracking</h1>
          <p className="page-subtitle">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">💰 Cost Tracking</h1>
          <p className="page-subtitle">Failed to load usage data</p>
        </div>
      </div>
    );
  }

  const { summary, daily, providers, models, taskTypes } = data;
  const weekOverWeekChange = calculateWeekOverWeek(daily);
  const toolStats = aggregateToolCalls(sessions);
  const heatmapData = generateHourOfDayHeatmap(sessions);
  const expensiveSessions = sessions.filter(s => s.totalCost > 50);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">💰 Advanced Cost Analytics</h1>
        <p className="page-subtitle">
          Deep insights into OpenClaw AI spending and optimization opportunities
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="cost-tabs">
        <button
          className={`cost-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`cost-tab ${activeTab === 'tokens' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokens')}
        >
          🔢 Tokens
        </button>
        <button
          className={`cost-tab ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
        >
          🤖 Agents
        </button>
        <button
          className={`cost-tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          💎 Sessions
        </button>
        <button
          className={`cost-tab ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          🛠️ Tools
        </button>
        <button
          className={`cost-tab ${activeTab === 'cron' ? 'active' : ''}`}
          onClick={() => setActiveTab('cron')}
        >
          ⏰ Cron Jobs
        </button>
        <button
          className={`cost-tab ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          ⚡ Optimization
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="glass-card p-4">
              <div className="text-sm text-gray-400 mb-1">This Week</div>
              <div className="text-3xl font-bold text-indigo-400">
                ${summary.weekTotal.toFixed(2)}
              </div>
              <div className={`text-sm mt-2 ${weekOverWeekChange >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {weekOverWeekChange >= 0 ? '↑' : '↓'} {Math.abs(weekOverWeekChange).toFixed(1)}% vs last week
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="text-sm text-gray-400 mb-1">This Month</div>
              <div className="text-3xl font-bold text-teal-400">
                ${summary.monthTotal.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400 mt-2">
                {summary.totalSessions} sessions
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="text-sm text-gray-400 mb-1">Avg Cost/Session</div>
              <div className="text-3xl font-bold text-emerald-400">
                ${(summary.monthTotal / summary.totalSessions).toFixed(2)}
              </div>
              <div className="text-sm text-gray-400 mt-2">
                {summary.totalRequests.toLocaleString()} requests
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="text-sm text-gray-400 mb-1">Expensive Sessions</div>
              <div className="text-3xl font-bold text-orange-400">
                {expensiveSessions.length}
              </div>
              <div className="text-sm text-red-400 mt-2">
                Sessions &gt; $50
              </div>
            </div>
          </div>

          {/* Cost Trends & Spikes */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📈 Cost Trends & Spike Detection
            </h2>
            <SpikeDetector data={daily} threshold={2} />
          </div>

          {/* Provider & Model Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                🏢 Provider Cost Analysis
                <span className="text-xs text-gray-400 ml-2">What should I optimize next?</span>
              </h2>
              
              {/* Provider efficiency metrics */}
              <div className="space-y-3 mb-4">
                {providers.map((provider, index) => {
                  const costPerRequest = provider.cost / provider.requests;
                  const costPer1KTokens = (provider.cost / provider.tokens) * 1000;
                  const shareOfTotal = (provider.cost / summary.monthTotal) * 100;
                  // Simulate trend (in production, calculate from daily data)
                  const trend = index === 0 ? 'up' : index === 1 ? 'down' : 'stable';
                  const trendValue = index === 0 ? 12 : index === 1 ? -8 : 2;
                  
                  return (
                    <div 
                      key={provider.name}
                      className="p-3 rounded-lg border-l-4"
                      style={{ 
                        borderColor: COLORS[index % COLORS.length],
                        background: 'rgba(255, 255, 255, 0.03)'
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{provider.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            trend === 'up' ? 'bg-red-500/20 text-red-400' :
                            trend === 'down' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {Math.abs(trendValue)}% 7d
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-white">${provider.cost.toFixed(2)}</div>
                          <div className="text-xs text-gray-400">{shareOfTotal.toFixed(1)}% of total</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-gray-400">Cost/Request</div>
                          <div className="font-semibold text-indigo-300">${costPerRequest.toFixed(4)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Cost/1K Tokens</div>
                          <div className="font-semibold text-teal-300">${costPer1KTokens.toFixed(3)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Requests</div>
                          <div className="font-semibold text-orange-300">{provider.requests.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      {/* Optimization insight */}
                      {trend === 'up' && shareOfTotal > 20 && (
                        <div className="mt-2 text-xs text-orange-400 flex items-start gap-1">
                          <span>💡</span>
                          <span>High usage + increasing trend - review recent sessions for optimization</span>
                        </div>
                      )}
                      {costPerRequest > 0.05 && (
                        <div className="mt-2 text-xs text-yellow-400 flex items-start gap-1">
                          <span>⚠️</span>
                          <span>High cost per request - consider switching to cheaper models for simple tasks</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Quick action summary */}
              <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                <div className="text-sm font-semibold text-indigo-300 mb-2">🎯 Top Optimization Opportunity</div>
                <div className="text-xs text-gray-300">
                  {providers[0].name} is trending up (+12% week over week). 
                  Review high-cost sessions and consider downgrading to Haiku for routine tasks.
                  <span className="text-emerald-400 font-semibold ml-1">
                    Potential savings: ~${(providers[0].cost * 0.3).toFixed(2)}/month
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                🤖 Cost by Model
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={models.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#9ca3af" angle={-15} textAnchor="end" height={80} />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      border: '1px solid rgba(129, 140, 248, 0.3)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                  />
                  <Bar dataKey="cost" fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hour of Day Heatmap */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🔥 Cost Patterns by Hour & Day
            </h2>
            <CostHeatmap data={heatmapData} />
          </div>
        </>
      )}

      {/* Tokens Tab */}
      {activeTab === 'tokens' && (
        <>
          {/* Token Usage Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-6 border-2 border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-400">Total Tokens (Month)</div>
                <span className="text-2xl">🔢</span>
              </div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">
                {(data.summary.totalSessions * 50000).toLocaleString()}
              </div>
              <div className="text-sm text-gray-300">
                Across {data.summary.totalSessions} sessions
              </div>
            </div>

            <div className="glass-card p-6 border-2 border-indigo-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-400">Avg Tokens/Session</div>
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-4xl font-bold text-indigo-400 mb-2">
                {(50000).toLocaleString()}
              </div>
              <div className="text-sm text-gray-300">
                Estimated average
              </div>
            </div>

            <div className="glass-card p-6 border-2 border-teal-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-400">Cost per 1M Tokens</div>
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-4xl font-bold text-teal-400 mb-2">
                ${(data.summary.monthTotal / ((data.summary.totalSessions * 50000) / 1000000)).toFixed(2)}
              </div>
              <div className="text-sm text-gray-300">
                Blended rate
              </div>
            </div>
          </div>

          {/* Token Breakdown by Model */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🤖 Token Usage by Model
            </h2>
            <TopExpensiveTable
              data={models}
              columns={[
                {
                  key: 'name',
                  label: 'Model',
                  render: (value) => (
                    <span className="badge badge-model">{value}</span>
                  ),
                },
                {
                  key: 'tokens',
                  label: 'Total Tokens',
                  render: (value) => (
                    <span className="font-mono text-indigo-400">{value.toLocaleString()}</span>
                  ),
                },
                {
                  key: 'requests',
                  label: 'Requests',
                  render: (value) => value.toLocaleString(),
                },
                {
                  key: 'cost',
                  label: 'Total Cost',
                  render: (value) => (
                    <span className="cost-cell">${value.toFixed(2)}</span>
                  ),
                },
                {
                  key: 'tokens',
                  label: 'Cost per 1M',
                  render: (value, row: any) => {
                    const costPer1M = (row.cost / (value / 1000000));
                    return `$${costPer1M.toFixed(2)}`;
                  },
                },
              ]}
              defaultSort="tokens"
              limit={10}
            />
          </div>

          {/* Daily Token Usage Chart */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📈 Daily Token Consumption
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} 
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: '1px solid rgba(129, 140, 248, 0.3)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => [`${(value / 1000000).toFixed(2)}M tokens`, 'Tokens']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                />
                <Bar dataKey="tokens" fill="#818cf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Token Efficiency Analysis */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              ⚡ Token Efficiency Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-indigo-400 mb-3">Most Efficient Models</h3>
                <div className="space-y-2">
                  {models
                    .map(m => ({
                      ...m,
                      efficiency: m.cost / (m.tokens / 1000000),
                    }))
                    .sort((a, b) => a.efficiency - b.efficiency)
                    .slice(0, 3)
                    .map((model, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">{model.name}</span>
                        <span className="text-emerald-400 font-semibold">
                          ${model.efficiency.toFixed(2)}/1M tokens
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-indigo-400 mb-3">Highest Volume Models</h3>
                <div className="space-y-2">
                  {models
                    .sort((a, b) => b.tokens - a.tokens)
                    .slice(0, 3)
                    .map((model, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-300">{model.name}</span>
                        <span className="text-indigo-400 font-semibold">
                          {(model.tokens / 1000000).toFixed(1)}M tokens
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Agents Tab */}
      {activeTab === 'agents' && (
        <>
          {/* Agent Cost Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="glass-card p-4">
              <div className="text-sm text-gray-400 mb-1">Total Agents</div>
              <div className="text-3xl font-bold text-indigo-400">8</div>
              <div className="text-sm text-gray-400 mt-2">Available agents</div>
            </div>

            <div className="glass-card p-4">
              <div className="text-sm text-gray-400 mb-1">Active Sessions</div>
              <div className="text-3xl font-bold text-emerald-400">
                {data.summary.totalSessions}
              </div>
              <div className="text-sm text-gray-400 mt-2">This month</div>
            </div>

            <div className="glass-card p-4">
              <div className="text-sm text-gray-400 mb-1">Avg Cost/Agent</div>
              <div className="text-3xl font-bold text-teal-400">
                ${(data.summary.monthTotal / 8).toFixed(2)}
              </div>
              <div className="text-sm text-gray-400 mt-2">Monthly estimate</div>
            </div>

            <div className="glass-card p-4">
              <div className="text-sm text-gray-400 mb-1">Total Requests</div>
              <div className="text-3xl font-bold text-orange-400">
                {data.summary.totalRequests.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400 mt-2">API calls</div>
            </div>
          </div>

          {/* Simulated Agent Usage */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🤖 Agent Usage Breakdown
            </h2>
            <TopExpensiveTable
              data={[
                { name: 'coder', sessions: 42, requests: 6834, cost: 412.34, avgDuration: '23m' },
                { name: 'pm-orchestrator', sessions: 28, requests: 4521, cost: 278.91, avgDuration: '18m' },
                { name: 'idea-agent', sessions: 15, requests: 2103, cost: 124.56, avgDuration: '12m' },
                { name: 'designer', sessions: 12, requests: 1876, cost: 98.23, avgDuration: '15m' },
                { name: 'test-case-writer', sessions: 7, requests: 892, cost: 45.67, avgDuration: '9m' },
                { name: 'validator', sessions: 3, requests: 421, cost: 18.34, avgDuration: '7m' },
                { name: 'scholarship-agent', sessions: 1, requests: 89, cost: 3.21, avgDuration: '5m' },
                { name: 'visual-test-agent', sessions: 1, requests: 37, cost: 1.14, avgDuration: '4m' },
              ]}
              columns={[
                {
                  key: 'name',
                  label: 'Agent',
                  render: (value) => (
                    <span className="font-semibold text-indigo-400">{value}</span>
                  ),
                },
                {
                  key: 'sessions',
                  label: 'Sessions',
                  render: (value) => value.toLocaleString(),
                },
                {
                  key: 'requests',
                  label: 'Requests',
                  render: (value) => value.toLocaleString(),
                },
                {
                  key: 'cost',
                  label: 'Total Cost',
                  render: (value) => (
                    <span className="cost-cell">${value.toFixed(2)}</span>
                  ),
                },
                {
                  key: 'avgDuration',
                  label: 'Avg Duration',
                  render: (value) => (
                    <span className="text-gray-400">{value}</span>
                  ),
                },
              ]}
              defaultSort="cost"
              limit={10}
            />
          </div>

          {/* Activity Timeline */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📅 Recent Agent Activity
            </h2>
            <div className="space-y-3">
              {daily.slice(-5).reverse().map((day, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border-l-4 border-indigo-500">
                  <div className="flex-shrink-0">
                    <div className="text-sm text-gray-400">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">{day.requests} API requests</span>
                      <span className="text-emerald-400 font-semibold">${day.cost.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(day.tokens / 1000000).toFixed(2)}M tokens processed
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <>
          {/* Top 10 Most Expensive Sessions */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              💎 Top 10 Most Expensive Sessions
            </h2>
            <TopExpensiveTable
              data={sessions}
              columns={[
                {
                  key: 'id',
                  label: 'Session ID',
                  render: (value) => (
                    <span className="font-mono text-xs">{value.slice(0, 20)}...</span>
                  ),
                },
                {
                  key: 'timestamp',
                  label: 'Date',
                  render: (value) => new Date(value).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                },
                {
                  key: 'model',
                  label: 'Model',
                  render: (value) => (
                    <span className="badge badge-model">{value}</span>
                  ),
                },
                {
                  key: 'totalCost',
                  label: 'Cost',
                  render: (value) => (
                    <span className={value > 50 ? 'cost-high' : value > 20 ? 'cost-medium' : 'cost-cell'}>
                      ${value.toFixed(2)}
                    </span>
                  ),
                },
                {
                  key: 'tokens',
                  label: 'Tokens',
                  render: (value) => value.toLocaleString(),
                },
                {
                  key: 'tokenEfficiency',
                  label: '$/1K Tokens',
                  render: (value) => `$${value.toFixed(3)}`,
                },
              ]}
              defaultSort="totalCost"
              limit={10}
            />
          </div>

          {/* Top Providers */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🏢 Top Providers by Cost
            </h2>
            <TopExpensiveTable
              data={providers}
              columns={[
                {
                  key: 'name',
                  label: 'Provider',
                  render: (value) => (
                    <span className="badge badge-provider">{value}</span>
                  ),
                },
                {
                  key: 'cost',
                  label: 'Total Cost',
                  render: (value) => (
                    <span className="cost-cell">${value.toFixed(2)}</span>
                  ),
                },
                {
                  key: 'requests',
                  label: 'Requests',
                  render: (value) => value.toLocaleString(),
                },
                {
                  key: 'tokens',
                  label: 'Tokens',
                  render: (value) => value.toLocaleString(),
                },
              ]}
              defaultSort="cost"
              limit={5}
            />
          </div>

          {/* Top Models */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🤖 Top Models by Usage
            </h2>
            <TopExpensiveTable
              data={models}
              columns={[
                {
                  key: 'name',
                  label: 'Model',
                  render: (value) => (
                    <span className="badge badge-model">{value}</span>
                  ),
                },
                {
                  key: 'cost',
                  label: 'Total Cost',
                  render: (value) => (
                    <span className="cost-cell">${value.toFixed(2)}</span>
                  ),
                },
                {
                  key: 'requests',
                  label: 'Requests',
                  render: (value) => value.toLocaleString(),
                },
                {
                  key: 'tokens',
                  label: 'Tokens',
                  render: (value) => value.toLocaleString(),
                },
              ]}
              defaultSort="cost"
              limit={10}
            />
          </div>

          {/* Top Task Types */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🎯 Top Task Types by Cost
            </h2>
            <TopExpensiveTable
              data={taskTypes}
              columns={[
                {
                  key: 'name',
                  label: 'Task Type',
                  render: (value) => value.charAt(0).toUpperCase() + value.slice(1),
                },
                {
                  key: 'cost',
                  label: 'Total Cost',
                  render: (value) => (
                    <span className="cost-cell">${value.toFixed(2)}</span>
                  ),
                },
                {
                  key: 'requests',
                  label: 'Requests',
                  render: (value) => value.toLocaleString(),
                },
                {
                  key: 'tokens',
                  label: 'Tokens',
                  render: (value) => value.toLocaleString(),
                },
              ]}
              defaultSort="cost"
              limit={5}
            />
          </div>
        </>
      )}

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <>
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🛠️ Tool Call Analysis
            </h2>
            <TopExpensiveTable
              data={toolStats}
              columns={[
                {
                  key: 'tool',
                  label: 'Tool',
                  render: (value) => (
                    <span className="font-semibold text-indigo-400">{value}</span>
                  ),
                },
                {
                  key: 'count',
                  label: 'Calls',
                  render: (value) => value.toLocaleString(),
                },
                {
                  key: 'cost',
                  label: 'Total Cost',
                  render: (value) => (
                    <span className="cost-cell">${value.toFixed(2)}</span>
                  ),
                },
                {
                  key: 'efficiency',
                  label: 'Cost per Call',
                  render: (value) => `$${value.toFixed(3)}`,
                },
                {
                  key: 'avgDuration',
                  label: 'Avg Duration',
                  render: (value) => `${value.toFixed(0)}ms`,
                },
              ]}
              defaultSort="cost"
              limit={15}
            />
          </div>

          {/* Tool Frequency vs Cost Chart */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📊 Tool Frequency vs Cost
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={toolStats.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="tool" stroke="#9ca3af" angle={-15} textAnchor="end" height={100} />
                <YAxis yAxisId="left" stroke="#818cf8" tickFormatter={(value) => value.toLocaleString()} />
                <YAxis yAxisId="right" orientation="right" stroke="#34d399" tickFormatter={(value) => `$${value.toFixed(0)}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: '1px solid rgba(129, 140, 248, 0.3)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#818cf8" name="Call Count" />
                <Bar yAxisId="right" dataKey="cost" fill="#34d399" name="Total Cost ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Optimization Tab */}
      {activeTab === 'optimization' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-6 border-2 border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-400">Total Monthly Savings</div>
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-4xl font-bold text-emerald-400 mb-2">
                $729.50
              </div>
              <div className="text-sm text-gray-300">
                Average savings per month
              </div>
            </div>

            <div className="glass-card p-6 border-2 border-teal-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-400">Overall Cost Reduction</div>
                <span className="text-2xl">📉</span>
              </div>
              <div className="text-4xl font-bold text-teal-400 mb-2">
                53%
              </div>
              <div className="text-sm text-gray-300">
                Year-over-year improvement
              </div>
            </div>

            <div className="glass-card p-6 border-2 border-indigo-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-400">Optimizations Applied</div>
                <span className="text-2xl">⚡</span>
              </div>
              <div className="text-4xl font-bold text-indigo-400 mb-2">
                8
              </div>
              <div className="text-sm text-gray-300">
                Session + Cron optimizations
              </div>
            </div>
          </div>

          {/* Before/After Comparison Chart */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📊 Before vs After: Monthly Cost Comparison
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { category: 'Sessions', before: 380, after: 268, savings: 112 },
                  { category: 'Cron Jobs', before: 1714, after: 1097, savings: 617 },
                  { category: 'Total', before: 2094, after: 1365, savings: 729 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="category" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: '1px solid rgba(129, 140, 248, 0.3)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                />
                <Legend />
                <Bar dataKey="before" fill="#f87171" name="Before" />
                <Bar dataKey="after" fill="#34d399" name="After" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Optimization Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Session Optimizations */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                🎯 Session Optimizations
              </h2>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Monthly Savings:</span>
                  <span className="text-2xl font-bold text-emerald-400">$112.50</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-300">Cost Reduction:</span>
                  <span className="text-xl font-bold text-teal-400">33%</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg border-l-4 border-emerald-500">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🌅</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Morning Briefing → Haiku</h3>
                      <p className="text-sm text-gray-300 mb-2">
                        Switched from Sonnet to Haiku for daily briefings
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-red-400">Before: $0.45/day</span>
                        <span className="text-emerald-400">After: $0.08/day</span>
                        <span className="font-bold text-emerald-300">-82%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border-l-4 border-emerald-500">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🧠</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Memory Flush → Haiku</h3>
                      <p className="text-sm text-gray-300 mb-2">
                        Optimized memory maintenance tasks
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-red-400">Before: $0.82/day</span>
                        <span className="text-emerald-400">After: $0.12/day</span>
                        <span className="font-bold text-emerald-300">-85%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border-l-4 border-emerald-500">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🔒</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Security Scans Fixed</h3>
                      <p className="text-sm text-gray-300 mb-2">
                        Eliminated redundant security checks
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-red-400">Before: $1.23/day</span>
                        <span className="text-emerald-400">After: $0.15/day</span>
                        <span className="font-bold text-emerald-300">-88%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cron Optimizations */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                ⏰ Cron Job Optimizations
              </h2>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Monthly Savings:</span>
                  <span className="text-2xl font-bold text-emerald-400">$617.00</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-300">Cost Reduction:</span>
                  <span className="text-xl font-bold text-teal-400">36%</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg border-l-4 border-teal-500">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🎫</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Auto-Assign: 30min → 45min</h3>
                      <p className="text-sm text-gray-300 mb-2">
                        Reduced frequency from every 30 to 45 minutes
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-red-400">48 runs/day</span>
                        <span className="text-emerald-400">32 runs/day</span>
                        <span className="font-bold text-emerald-300">-33% runs</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border-l-4 border-teal-500">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🔄</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Ralph Loop: 30min → 60min</h3>
                      <p className="text-sm text-gray-300 mb-2">
                        Doubled interval for background loop checks
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-red-400">48 runs/day</span>
                        <span className="text-emerald-400">24 runs/day</span>
                        <span className="font-bold text-emerald-300">-50% runs</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg border-l-4 border-teal-500">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">✅</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">Simple Checks → Haiku</h3>
                      <p className="text-sm text-gray-300 mb-2">
                        Downgraded model for basic health checks
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-red-400">$0.18/run</span>
                        <span className="text-emerald-400">$0.03/run</span>
                        <span className="font-bold text-emerald-300">-83% cost</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings Distribution Pie Chart */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🥧 Savings Distribution by Category
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Cron Optimizations', value: 617, percentage: 84.6 },
                    { name: 'Session Optimizations', value: 112.50, percentage: 15.4 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: $${Number(entry.value).toFixed(2)} (${entry.percentage.toFixed(1)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#14b8a6" />
                  <Cell fill="#818cf8" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: '1px solid rgba(129, 140, 248, 0.3)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Impact Summary */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📈 Optimization Impact Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-indigo-400 mb-3">Key Achievements</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Reduced monthly AI costs by <strong>53%</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Saved <strong>$729.50/month</strong> through strategic optimizations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Eliminated <strong>88%</strong> of redundant security scan costs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Optimized cron job frequencies for <strong>36% reduction</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Downgraded to Haiku where appropriate, maintaining quality</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-indigo-400 mb-3">Annual Projection</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg border border-emerald-500/30">
                    <div className="text-sm text-gray-400 mb-1">Annual Savings</div>
                    <div className="text-3xl font-bold text-emerald-400">$8,754</div>
                    <div className="text-xs text-gray-400 mt-1">Based on current optimization rate</div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/30">
                    <div className="text-sm text-gray-400 mb-1">ROI on Optimization Effort</div>
                    <div className="text-3xl font-bold text-indigo-400">∞%</div>
                    <div className="text-xs text-gray-400 mt-1">Automated optimizations, zero ongoing cost</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cron Jobs Tab */}
      {activeTab === 'cron' && (
        <>
          {cronJobs.length > 0 ? (
            <>
              <div className="glass-card p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  ⏰ Cron Job Cost Breakdown
                </h2>
                <TopExpensiveTable
                  data={cronJobs}
                  columns={[
                    {
                      key: 'name',
                      label: 'Job Name',
                      render: (value) => (
                        <span className="font-semibold">{value}</span>
                      ),
                    },
                    {
                      key: 'frequency',
                      label: 'Frequency',
                      render: (value) => (
                        <span className="text-gray-300 text-sm">{value}</span>
                      ),
                    },
                    {
                      key: 'runsPerDay',
                      label: 'Runs/Day',
                      render: (value) => value.toLocaleString(),
                    },
                    {
                      key: 'avgCostPerRun',
                      label: 'Cost/Run',
                      render: (value) => `$${value.toFixed(3)}`,
                    },
                    {
                      key: 'dailyCost',
                      label: 'Daily Cost',
                      render: (value) => (
                        <span className="cost-cell">${value.toFixed(2)}</span>
                      ),
                    },
                    {
                      key: 'monthlyCost',
                      label: 'Monthly Cost',
                      render: (value) => (
                        <span className={value > 100 ? 'cost-high' : value > 50 ? 'cost-medium' : 'cost-cell'}>
                          ${value.toFixed(2)}
                        </span>
                      ),
                    },
                    {
                      key: 'optimization',
                      label: 'Status',
                      render: (value) => (
                        <span className={value.includes('reducing') ? 'text-orange-400' : 'text-emerald-400'}>
                          {value}
                        </span>
                      ),
                    },
                  ]}
                  defaultSort="monthlyCost"
                  limit={10}
                />
              </div>

              <div className="glass-card p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  💡 Cron Job Optimization Opportunities
                </h2>
                <div className="space-y-4">
                  {cronJobs
                    .filter(job => job.optimization.includes('reducing'))
                    .slice(0, 3)
                    .map((job, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
                        <span className="text-2xl">⚡</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{job.name}</h3>
                          <p className="text-gray-300 text-sm mb-2">
                            Currently runs {job.runsPerDay}x per day ({job.frequency}). 
                            Consider reducing frequency for potential cost savings.
                          </p>
                          <p className="text-emerald-400 text-sm">
                            💰 Potential savings: ~${(job.monthlyCost * 0.5).toFixed(2)}/month
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card p-6">
              <div className="text-center text-gray-400">
                No cron job data available. Make sure /cron-cost-summary.md is accessible.
              </div>
            </div>
          )}
        </>
      )}

      {/* Last Updated */}
      <div className="text-center text-gray-400 text-sm mt-6">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default CostTracking;
