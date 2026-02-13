import React, { useEffect, useState } from 'react';
import './TokenUsage.css';

export interface TokenUsageData {
  session: {
    used: number;
    limit: number;
    cost: number;
  };
  daily: {
    used: number;
    limit: number;
    cost: number;
  };
  monthly: {
    used: number;
    limit: number;
    cost: number;
  };
  provider: string;
  model: string;
}

interface TokenUsageProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const TokenUsage: React.FC<TokenUsageProps> = ({
  autoRefresh = true,
  refreshInterval = 60000, // 60 seconds
}) => {
  const [usage, setUsage] = useState<TokenUsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTokenUsage = async () => {
    try {
      const response = await fetch('/usage-data.json');
      const data = await response.json();
      
      // Calculate current usage from data
      const latestDay = data.daily[data.daily.length - 1];
      const monthlyTotal = data.summary.monthTotal;
      const monthlyTokens = data.summary.totalSessions * 50000; // Estimate
      
      const tokenUsage: TokenUsageData = {
        session: {
          used: 25000, // Simulated current session
          limit: 100000,
          cost: 0.05,
        },
        daily: {
          used: latestDay.tokens,
          limit: 500000000, // 500M tokens/day limit
          cost: latestDay.cost,
        },
        monthly: {
          used: monthlyTokens,
          limit: 10000000000, // 10B tokens/month limit
          cost: monthlyTotal,
        },
        provider: 'Anthropic',
        model: 'Claude Sonnet 4.5',
      };
      
      setUsage(tokenUsage);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch token usage:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenUsage();
    
    if (autoRefresh) {
      const interval = setInterval(fetchTokenUsage, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000000) return `${(tokens / 1000000000).toFixed(2)}B`;
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(2)}K`;
    return tokens.toString();
  };

  const getPercentage = (used: number, limit: number): number => {
    return Math.min((used / limit) * 100, 100);
  };

  const getStatusColor = (percentage: number): string => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'caution';
    return 'normal';
  };

  if (loading || !usage) {
    return (
      <div className="token-usage-loading">
        <div className="spinner"></div>
        <p>Loading token usage...</p>
      </div>
    );
  }

  const sessionPercent = getPercentage(usage.session.used, usage.session.limit);
  const dailyPercent = getPercentage(usage.daily.used, usage.daily.limit);
  const monthlyPercent = getPercentage(usage.monthly.used, usage.monthly.limit);

  return (
    <div className="token-usage">
      <div className="usage-header">
        <div className="provider-info">
          <span className="provider-icon">🏢</span>
          <div>
            <div className="provider-name">{usage.provider}</div>
            <div className="model-name">{usage.model}</div>
          </div>
        </div>
      </div>

      <div className="usage-metrics">
        {/* Session Usage */}
        <div className="usage-metric">
          <div className="metric-header">
            <span className="metric-label">Current Session</span>
            <span className="metric-value">
              {formatTokens(usage.session.used)} / {formatTokens(usage.session.limit)}
            </span>
          </div>
          <div className={`progress-bar ${getStatusColor(sessionPercent)}`}>
            <div 
              className="progress-fill" 
              style={{ width: `${sessionPercent}%` }}
            />
          </div>
          <div className="metric-footer">
            <span className={`percentage ${getStatusColor(sessionPercent)}`}>
              {sessionPercent.toFixed(1)}%
            </span>
            <span className="cost">${usage.session.cost.toFixed(2)}</span>
          </div>
        </div>

        {/* Daily Usage */}
        <div className="usage-metric">
          <div className="metric-header">
            <span className="metric-label">Today</span>
            <span className="metric-value">
              {formatTokens(usage.daily.used)} / {formatTokens(usage.daily.limit)}
            </span>
          </div>
          <div className={`progress-bar ${getStatusColor(dailyPercent)}`}>
            <div 
              className="progress-fill" 
              style={{ width: `${dailyPercent}%` }}
            />
          </div>
          <div className="metric-footer">
            <span className={`percentage ${getStatusColor(dailyPercent)}`}>
              {dailyPercent.toFixed(1)}%
            </span>
            <span className="cost">${usage.daily.cost.toFixed(2)}</span>
          </div>
        </div>

        {/* Monthly Usage */}
        <div className="usage-metric">
          <div className="metric-header">
            <span className="metric-label">This Month</span>
            <span className="metric-value">
              {formatTokens(usage.monthly.used)} / {formatTokens(usage.monthly.limit)}
            </span>
          </div>
          <div className={`progress-bar ${getStatusColor(monthlyPercent)}`}>
            <div 
              className="progress-fill" 
              style={{ width: `${monthlyPercent}%` }}
            />
          </div>
          <div className="metric-footer">
            <span className={`percentage ${getStatusColor(monthlyPercent)}`}>
              {monthlyPercent.toFixed(1)}%
            </span>
            <span className="cost">${usage.monthly.cost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {(sessionPercent >= 90 || dailyPercent >= 90 || monthlyPercent >= 90) && (
        <div className="usage-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            {sessionPercent >= 90 && 'Session limit approaching! '}
            {dailyPercent >= 90 && 'Daily limit approaching! '}
            {monthlyPercent >= 90 && 'Monthly limit approaching!'}
          </span>
        </div>
      )}
    </div>
  );
};

export default TokenUsage;
