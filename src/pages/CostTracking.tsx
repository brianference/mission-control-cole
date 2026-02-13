import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
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

const COLORS = ['#818cf8', '#c084fc', '#fb923c', '#34d399', '#fbbf24', '#f87171'];

const CostTracking: React.FC = () => {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/usage-data.json')
      .then(res => res.json())
      .then(data => {
        setData(data);
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">💰 Cost Tracking</h1>
        <p className="page-subtitle">
          OpenClaw AI usage and spending analysis
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="text-sm text-gray-400 mb-1">This Week</div>
          <div className="text-3xl font-bold text-indigo-400">
            ${summary.weekTotal.toFixed(2)}
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="text-sm text-gray-400 mb-1">This Month</div>
          <div className="text-3xl font-bold text-purple-400">
            ${summary.monthTotal.toFixed(2)}
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="text-sm text-gray-400 mb-1">Total Sessions</div>
          <div className="text-3xl font-bold text-emerald-400">
            {summary.totalSessions.toLocaleString()}
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="text-sm text-gray-400 mb-1">API Requests</div>
          <div className="text-3xl font-bold text-orange-400">
            {summary.totalRequests.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 30-Day Spending Trend */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          📈 30-Day Spending Trend
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value.toFixed(2)}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                borderRadius: '8px',
              }}
              formatter={(value: any) => `$${Number(value).toFixed(2)}`}
              labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="cost"
              stroke="#818cf8"
              strokeWidth={2}
              dot={{ fill: '#818cf8', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Provider & Model Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Cost by Provider */}
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

        {/* Cost by Model */}
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
              <Bar dataKey="cost" fill="#c084fc" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost by Task Type */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          🎯 Cost by Task Type
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={taskTypes}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value.toFixed(0)}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                borderRadius: '8px',
              }}
              formatter={(value: any) => `$${Number(value).toFixed(2)}`}
            />
            <Bar dataKey="cost" fill="#34d399" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Routing Suggestions */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          💡 Cost Optimization Recommendations
        </h2>
        <div className="space-y-4">
          {getOptimizationTips(data).map((tip, index) => (
            <div key={index} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
              <span className="text-2xl">{tip.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{tip.title}</h3>
                <p className="text-gray-300 text-sm">{tip.description}</p>
                {tip.saving && (
                  <p className="text-emerald-400 text-sm mt-2">
                    💰 Potential savings: ${tip.saving.toFixed(2)}/month
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-gray-400 text-sm mt-6">
        Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

function getOptimizationTips(data: UsageData) {
  const tips = [];
  const { models, taskTypes } = data;

  // Tip 1: Check if expensive models are used for simple tasks
  const expensiveModels = models.filter(m =>
    m.name.includes('Opus') || m.name.includes('GPT-4') && !m.name.includes('Mini')
  );
  const simpleTasks = taskTypes.find(t => t.name === 'general' || t.name === 'automation');

  if (expensiveModels.length > 0 && simpleTasks) {
    const potentialSaving = expensiveModels.reduce((sum, m) => sum + m.cost, 0) * 0.3;
    tips.push({
      icon: '⚡',
      title: 'Consider cheaper models for routine tasks',
      description: `You're using ${expensiveModels.map(m => m.name).join(', ')} for some tasks. Claude Sonnet 4.5 or GPT-4o Mini could handle many routine operations at 5-10x lower cost.`,
      saving: potentialSaving
    });
  }

  // Tip 2: Check for high general usage
  const generalUsage = taskTypes.find(t => t.name === 'general');
  if (generalUsage && generalUsage.cost > data.summary.monthTotal * 0.5) {
    tips.push({
      icon: '🎯',
      title: 'Classify more tasks',
      description: `${((generalUsage.cost / data.summary.monthTotal) * 100).toFixed(0)}% of costs are in 'general' category. Better task classification can help identify optimization opportunities.`,
      saving: undefined
    });
  }

  // Tip 3: Automation efficiency
  const automationUsage = taskTypes.find(t => t.name === 'automation');
  if (automationUsage && automationUsage.cost > 50) {
    tips.push({
      icon: '🤖',
      title: 'Optimize cron jobs',
      description: `Automation tasks cost $${automationUsage.cost.toFixed(2)}/month. Review cron frequency and consider batching similar checks.`,
      saving: automationUsage.cost * 0.2
    });
  }

  // Tip 4: Use prompt caching
  if (data.summary.monthTotal > 100) {
    tips.push({
      icon: '💾',
      title: 'Leverage prompt caching',
      description: 'For repeated system prompts and context, Anthropic\'s prompt caching can reduce costs by 90%. Ensure large context blocks are reused across requests.',
      saving: data.summary.monthTotal * 0.15
    });
  }

  // Default tip if no specific recommendations
  if (tips.length === 0) {
    tips.push({
      icon: '✅',
      title: 'Usage looks optimized',
      description: 'Your current model selection and task distribution appear well-balanced. Continue monitoring for trends.',
      saving: undefined
    });
  }

  return tips;
}

export default CostTracking;
