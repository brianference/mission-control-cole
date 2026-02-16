import React, { useEffect, useState } from 'react';
import './TopRecommendations.css';

interface Recommendation {
  id: string;
  category: 'model' | 'agent' | 'cron';
  priority: 'high' | 'medium' | 'low';
  title: string;
  context: string;
  action: string;
}

interface UsageData {
  daily: Array<{
    date: string;
    cost: number;
    requests?: number;
    byModel?: Record<string, { cost: number; requests: number }>;
    byProvider?: Record<string, { cost: number; requests: number }>;
  }>;
  models: Array<{ name: string; cost: number; requests: number }>;
  providers: Array<{ name: string; cost: number; requests: number }>;
  summary?: { weekTotal: number; monthTotal: number };
}

interface TopRecommendationsProps {
  timeRange: 'daily' | 'weekly';
}

const TopRecommendations: React.FC<TopRecommendationsProps> = ({ timeRange }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateRecommendations = async () => {
      try {
        const response = await fetch('/usage-data.json');
        const data: UsageData = await response.json();

        const recs: Recommendation[] = [];

        // Get recent data for analysis
        const recentDays = timeRange === 'daily' ? 1 : 7;
        const recentData = data.daily.slice(-recentDays);

        // === MODEL COST OPTIMIZATION ===
        // Check if expensive models (Opus) being used for high-volume work
        const opusUsage = data.models.find(m => m.name.includes('opus'));
        const haikuUsage = data.models.find(m => m.name.includes('haiku'));
        const sonnetUsage = data.models.find(m => m.name.includes('sonnet'));

        if (opusUsage && opusUsage.cost > 50) {
          // Check request patterns
          const avgCostPerRequest = opusUsage.cost / opusUsage.requests;
          if (avgCostPerRequest < 0.50 && opusUsage.requests > 100) {
            recs.push({
              id: 'model-opus-downgrade',
              category: 'model',
              priority: 'high',
              title: 'High-volume Opus usage detected',
              context: `${opusUsage.requests} Opus requests @ $${opusUsage.cost.toFixed(2)} total`,
              action: 'Consider Sonnet for routine tasks'
            });
          }
        }

        // Check if Sonnet used where Haiku would suffice
        if (sonnetUsage && sonnetUsage.requests > 500) {
          // Look for patterns suggesting simple tasks
          const recentSonnetDays = recentData.filter(d => 
            (d.byModel?.['claude-sonnet-4-5']?.requests ?? 0) > 50
          );
          if (recentSonnetDays.length > 0) {
            recs.push({
              id: 'model-sonnet-to-haiku',
              category: 'model',
              priority: 'medium',
              title: 'Sonnet handling high request volume',
              context: `${sonnetUsage.requests} requests this period`,
              action: 'Evaluate tasks for Haiku compatibility'
            });
          }
        }

        // Check if Haiku is underutilized
        if (haikuUsage && haikuUsage.requests < 200 && sonnetUsage && sonnetUsage.requests > 1000) {
          recs.push({
            id: 'model-haiku-underused',
            category: 'model',
            priority: 'medium',
            title: 'Haiku underutilized vs Sonnet',
            context: `Haiku: ${haikuUsage.requests} vs Sonnet: ${sonnetUsage.requests}`,
            action: 'Route simple tasks to Haiku'
          });
        }

        // === AGENT OPTIMIZATION ===
        // Check for cost spikes indicating inefficient agent patterns
        const avgDailyCost = recentData.reduce((sum, d) => sum + d.cost, 0) / recentData.length;
        const highCostDays = recentData.filter(d => d.cost > avgDailyCost * 1.5);

        if (highCostDays.length > 0) {
          recs.push({
            id: 'agent-cost-spikes',
            category: 'agent',
            priority: 'high',
            title: 'Cost spikes detected',
            context: `${highCostDays.length} day(s) exceeded avg by 50%+`,
            action: 'Review agent activity on spike days'
          });
        }

        // Check request-to-cost ratio for inefficiency
        const totalRequests = recentData.reduce((sum, d) => sum + (d.requests || 0), 0);
        const totalCost = recentData.reduce((sum, d) => sum + d.cost, 0);
        const costPerRequest = totalCost / totalRequests;

        if (costPerRequest > 0.10) {
          recs.push({
            id: 'agent-efficiency',
            category: 'agent',
            priority: 'medium',
            title: 'High cost per request',
            context: `$${costPerRequest.toFixed(3)}/request average`,
            action: 'Batch operations where possible'
          });
        }

        // === CRON/HEARTBEAT OPTIMIZATION ===
        // Check for provider diversity (good) vs single provider (risky)
        const anthropicShare = data.providers.find(p => p.name === 'anthropic');
        const totalProviderCost = data.providers.reduce((sum, p) => sum + p.cost, 0);
        
        if (anthropicShare && totalProviderCost > 0) {
          const anthropicPercent = (anthropicShare.cost / totalProviderCost) * 100;
          if (anthropicPercent > 90) {
            recs.push({
              id: 'cron-provider-diversity',
              category: 'cron',
              priority: 'medium',
              title: 'Single provider dependency',
              context: `${anthropicPercent.toFixed(0)}% spend on Anthropic`,
              action: 'Consider Gemini/Minimax for cron jobs'
            });
          }
        }

        // Check for potential cron consolidation
        const requestsPerDay = totalRequests / recentDays;
        if (requestsPerDay > 2000) {
          recs.push({
            id: 'cron-consolidate',
            category: 'cron',
            priority: 'low',
            title: 'High daily request volume',
            context: `~${Math.round(requestsPerDay)} requests/day`,
            action: 'Review cron intervals for consolidation'
          });
        }

        // Sort by priority
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        setRecommendations(recs.slice(0, 5)); // Top 5 recommendations
      } catch (err) {
        console.error('Failed to generate recommendations:', err);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    generateRecommendations();
  }, [timeRange]);

  const categoryConfig = {
    model: { icon: '🧠', label: 'Model Optimization' },
    agent: { icon: '🤖', label: 'Agent Optimization' },
    cron: { icon: '⏰', label: 'Cron/Heartbeat' }
  };

  const priorityConfig = {
    high: { icon: '⚡', label: 'High Impact' },
    medium: { icon: '📋', label: 'Recommended' },
    low: { icon: '💡', label: 'Consider' }
  };

  if (loading) {
    return (
      <div className="top-recs">
        <div className="top-recs-header">
          <span className="top-recs-icon">🎯</span>
          <span className="top-recs-title">Loading recommendations...</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="top-recs">
        <div className="top-recs-header">
          <span className="top-recs-icon">✅</span>
          <span className="top-recs-title">No optimizations needed</span>
        </div>
        <p className="no-recs">Usage patterns look efficient!</p>
      </div>
    );
  }

  return (
    <div className="top-recs">
      <div className="top-recs-header">
        <span className="top-recs-icon">🎯</span>
        <span className="top-recs-title">
          {timeRange === 'daily' ? "Today's" : "This Week's"} Recommendations
        </span>
        <span className="rec-count">{recommendations.length}</span>
      </div>

      <div className="recs-list">
        {recommendations.map((rec) => (
          <div key={rec.id} className={`rec-card priority-${rec.priority}`}>
            <div className="rec-header">
              <span className="rec-category-icon" title={categoryConfig[rec.category].label}>
                {categoryConfig[rec.category].icon}
              </span>
              <span className="rec-priority-icon" title={priorityConfig[rec.priority].label}>
                {priorityConfig[rec.priority].icon}
              </span>
              <span className="rec-title">{rec.title}</span>
            </div>
            <div className="rec-details">
              <div className="rec-context">
                <span className="detail-label">Status:</span>
                <span>{rec.context}</span>
              </div>
              <div className="rec-impact">
                <span className="detail-label">Action:</span>
                <span>{rec.action}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopRecommendations;
