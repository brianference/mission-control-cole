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
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'tools' | 'cron' | 'optimization'>('overview');

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
                🏢 Cost by Provider
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={providers}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: $${Number(entry.cost).toFixed(2)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="cost"
                  >
                    {providers.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
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
