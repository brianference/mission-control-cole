import React, { useEffect, useState } from 'react';
import './CommonPages.css';

interface Alert {
  id: string;
  type: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  dismissed: boolean;
  source: string;
}

interface AlertData {
  lastChecked: string;
  alerts: Alert[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
}

const severityConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  error: { color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)', icon: '🔴', label: 'ERROR' },
  warning: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', icon: '🟡', label: 'WARNING' },
  info: { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)', icon: '🔵', label: 'INFO' },
  success: { color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)', icon: '🟢', label: 'OK' },
};

const sourceEmoji: Record<string, string> = {
  cron: '⏰',
  gateway: '🌐',
  'model-health': '🤖',
  'commands-log': '📜',
  telegram: '📨',
  system: '⚙️',
};

const DISMISSED_KEY = 'mc-alert-dismissed';

const loadDismissed = (): Set<string> => {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const saveDismissed = (ids: Set<string>) => {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {
    // Empty catch block intentional - localStorage errors are non-critical
  }
};

const AlertCenter: React.FC = () => {
  const [data, setData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showDismissed, setShowDismissed] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetch('/alerts.json')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const dismissAlert = (id: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
    saveDismissed(newDismissed);
  };

  const restoreAlert = (id: string) => {
    const newDismissed = new Set(dismissed);
    newDismissed.delete(id);
    setDismissed(newDismissed);
    saveDismissed(newDismissed);
  };

  const clearAllDismissed = () => {
    setDismissed(new Set());
    saveDismissed(new Set());
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">🚨 Alert Center</h1>
          <p className="page-subtitle">Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">🚨 Alert Center</h1>
        </div>
        <div className="glass-card p-6" style={{ borderColor: 'rgba(248, 113, 113, 0.3)' }}>
          <p style={{ color: '#f87171' }}>{error || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  const allAlerts = data.alerts || [];
  const activeAlerts = allAlerts.filter(a => !dismissed.has(a.id));
  const filteredAlerts = (showDismissed ? allAlerts : activeAlerts).filter(
    a => filterSeverity === 'all' || a.severity === filterSeverity
  );

  const activeErrors = activeAlerts.filter(a => a.severity === 'error').length;
  const activeWarnings = activeAlerts.filter(a => a.severity === 'warning').length;
  const dismissedCount = dismissed.size;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🚨 Alert Center</h1>
          <p className="page-subtitle">System alerts, cron failures, and model errors</p>
        </div>
        <button
          onClick={loadData}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(129, 140, 248, 0.2)',
            border: '1px solid rgba(129, 140, 248, 0.4)',
            borderRadius: '8px',
            color: '#818cf8',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div
          className="glass-card p-4"
          style={{ borderColor: activeErrors > 0 ? 'rgba(248, 113, 113, 0.4)' : 'rgba(52, 211, 153, 0.3)', cursor: 'pointer' }}
          onClick={() => setFilterSeverity(filterSeverity === 'error' ? 'all' : 'error')}
        >
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>🔴 Errors</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: activeErrors > 0 ? '#f87171' : '#34d399' }}>
            {activeErrors}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>active</div>
        </div>

        <div
          className="glass-card p-4"
          style={{ borderColor: activeWarnings > 0 ? 'rgba(251, 191, 36, 0.4)' : 'rgba(52, 211, 153, 0.3)', cursor: 'pointer' }}
          onClick={() => setFilterSeverity(filterSeverity === 'warning' ? 'all' : 'warning')}
        >
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>🟡 Warnings</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: activeWarnings > 0 ? '#fbbf24' : '#34d399' }}>
            {activeWarnings}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>active</div>
        </div>

        <div
          className="glass-card p-4"
          style={{ borderColor: 'rgba(96, 165, 250, 0.3)', cursor: 'pointer' }}
          onClick={() => setFilterSeverity(filterSeverity === 'info' ? 'all' : 'info')}
        >
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>🔵 Info</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#60a5fa' }}>
            {activeAlerts.filter(a => a.severity === 'info').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>active</div>
        </div>

        <div className="glass-card p-4" style={{ borderColor: 'rgba(156, 163, 175, 0.3)' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>💤 Dismissed</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#9ca3af' }}>{dismissedCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>hidden</div>
        </div>
      </div>

      {/* Status Banner */}
      {activeErrors === 0 && activeWarnings === 0 && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'rgba(52, 211, 153, 0.1)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <div>
            <div style={{ fontWeight: 600, color: '#34d399' }}>All Systems Nominal</div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              No errors or warnings detected. System is operating normally.
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'error', 'warning', 'info'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '20px',
                border: `1px solid ${filterSeverity === sev ? '#818cf8' : 'rgba(255,255,255,0.1)'}`,
                background: filterSeverity === sev ? 'rgba(129, 140, 248, 0.2)' : 'transparent',
                color: filterSeverity === sev ? '#818cf8' : '#9ca3af',
                cursor: 'pointer',
                fontSize: '0.8rem',
                textTransform: 'capitalize',
              }}
            >
              {sev === 'all' ? '🔍 All' : sev === 'error' ? '🔴 Errors' : sev === 'warning' ? '🟡 Warnings' : '🔵 Info'}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#9ca3af' }}>
            <input
              type="checkbox"
              checked={showDismissed}
              onChange={e => setShowDismissed(e.target.checked)}
            />
            Show dismissed
          </label>
          {dismissedCount > 0 && (
            <button
              onClick={clearAllDismissed}
              style={{
                padding: '0.375rem 0.75rem',
                background: 'transparent',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Clear dismissed
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="glass-card p-8" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <div style={{ fontSize: '1.25rem', color: '#e5e7eb', marginBottom: '0.5rem' }}>No alerts to show</div>
          <div style={{ color: '#6b7280' }}>
            {filterSeverity !== 'all' ? `No ${filterSeverity} alerts` : 'All clear!'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredAlerts.map(alert => {
            const config = severityConfig[alert.severity] || severityConfig.info;
            const isDismissed = dismissed.has(alert.id);

            return (
              <div
                key={alert.id}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  background: isDismissed ? 'rgba(255,255,255,0.02)' : config.bg,
                  border: `1px solid ${isDismissed ? 'rgba(255,255,255,0.05)' : config.color + '40'}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  opacity: isDismissed ? 0.5 : 1,
                }}
              >
                {/* Severity Icon */}
                <span style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '0.125rem' }}>{config.icon}</span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{alert.title}</span>

                    {/* Severity badge */}
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: '20px',
                      background: config.color + '25',
                      color: config.color,
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                    }}>
                      {config.label}
                    </span>

                    {/* Source badge */}
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: '20px',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#9ca3af',
                      fontSize: '0.625rem',
                    }}>
                      {sourceEmoji[alert.source] || '📌'} {alert.source}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                    {alert.message}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Dismiss / Restore button */}
                <button
                  onClick={() => isDismissed ? restoreAlert(alert.id) : dismissAlert(alert.id)}
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: 'transparent',
                    border: `1px solid ${isDismissed ? 'rgba(52, 211, 153, 0.3)' : 'rgba(156, 163, 175, 0.2)'}`,
                    borderRadius: '6px',
                    color: isDismissed ? '#34d399' : '#9ca3af',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isDismissed ? '↩ Restore' : '✕ Dismiss'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.75rem', marginTop: '1.5rem' }}>
        Last checked: {new Date(data.lastChecked).toLocaleString()}
      </div>
    </div>
  );
};

export default AlertCenter;
