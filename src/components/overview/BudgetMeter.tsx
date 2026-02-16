import React, { useEffect, useState } from 'react';
import './BudgetMeter.css';

interface BudgetConfig {
  limits: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  alerts: {
    thresholds: number[];
    enabled: boolean;
  };
}

interface BudgetMeterProps {
  currentSpend: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  onSettingsClick: () => void;
}

type Period = 'daily' | 'weekly' | 'monthly';

const BudgetMeter: React.FC<BudgetMeterProps> = ({ currentSpend, onSettingsClick }) => {
  const [config, setConfig] = useState<BudgetConfig | null>(null);
  const [activePeriod, setActivePeriod] = useState<Period>('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load budget config
    fetch('/budget.json')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        // Use defaults if no config
        setConfig({
          limits: { daily: 100, weekly: 500, monthly: 1500 },
          alerts: { thresholds: [0.7, 0.9, 1.0], enabled: true }
        });
        setLoading(false);
      });
  }, []);

  if (loading || !config) {
    return (
      <div className="budget-meter glass-card">
        <div className="budget-loading">Loading budget...</div>
      </div>
    );
  }

  const limit = config.limits[activePeriod];
  const spent = currentSpend[activePeriod];
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const remaining = Math.max(limit - spent, 0);

  // Determine status color
  const getStatusColor = () => {
    if (percentage >= 100) return 'over';
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    return 'safe';
  };

  const status = getStatusColor();
  const periodLabels: Record<Period, string> = {
    daily: 'Today',
    weekly: 'This Week',
    monthly: 'This Month'
  };

  return (
    <div className={`budget-meter glass-card status-${status}`}>
      <div className="budget-header">
        <div className="budget-title">
          <span className="budget-icon">💰</span>
          <span>Budget</span>
          {config.alerts.enabled && <span className="alerts-badge" title="Alerts enabled">🔔</span>}
        </div>
        <button className="settings-btn" onClick={onSettingsClick} title="Budget Settings">
          ⚙️
        </button>
      </div>

      <div className="period-tabs">
        {(['daily', 'weekly', 'monthly'] as Period[]).map(period => (
          <button
            key={period}
            className={`period-tab ${activePeriod === period ? 'active' : ''}`}
            onClick={() => setActivePeriod(period)}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      <div className="budget-content">
        <div className="budget-progress-container">
          <div className="budget-progress-bar">
            <div 
              className={`budget-progress-fill status-${status}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
            {percentage > 100 && (
              <div 
                className="budget-progress-over"
                style={{ width: `${Math.min(percentage - 100, 50)}%` }}
              />
            )}
          </div>
          <div className="budget-progress-labels">
            <span className="budget-spent">${spent.toFixed(2)}</span>
            <span className="budget-limit">/ ${limit.toFixed(0)}</span>
          </div>
        </div>

        <div className="budget-stats">
          <div className="budget-stat">
            <span className="stat-label">{periodLabels[activePeriod]}</span>
            <span className={`stat-value percentage-${status}`}>
              {percentage.toFixed(0)}%
            </span>
          </div>
          <div className="budget-stat">
            <span className="stat-label">Remaining</span>
            <span className={`stat-value ${remaining <= 0 ? 'over' : ''}`}>
              {remaining <= 0 ? 'Over budget!' : `$${remaining.toFixed(2)}`}
            </span>
          </div>
        </div>

        {status === 'over' && (
          <div className="budget-alert">
            ⚠️ You've exceeded your {activePeriod} budget by ${(spent - limit).toFixed(2)}
          </div>
        )}
        {status === 'danger' && (
          <div className="budget-warning">
            ⚡ Approaching limit - {(100 - percentage).toFixed(0)}% remaining
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetMeter;
