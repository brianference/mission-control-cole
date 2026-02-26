import React, { useEffect, useState, useRef, useCallback } from 'react';
// import { sendNotification } from '../notifications/NotificationBell';
import './BudgetMeter.css';

// ─── Stub for sendNotification ───────────────────────────────────────────────
const sendNotification = (notification: any) => {
  console.log('Budget notification:', notification);
  // TODO: Implement actual notification system
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface BudgetLimits {
  daily: number;
  weekly: number;
  monthly: number;
}

interface BudgetConfig {
  limits: BudgetLimits;
  agentCaps: Record<string, number>;
  alerts: {
    thresholds: number[];
    enabled: boolean;
    channel?: string;
  };
  lastAlert: {
    daily: string | null;
    weekly: string | null;
    monthly: string | null;
  };
  updatedAt: string;
}

interface SessionSummary {
  agent?: string;
  totalCost?: number;
}

interface AgentSpend {
  name: string;
  cost: number;
  cap: number | null;
}

export interface BudgetMeterProps {
  dailyCost: number;
  weeklyCost: number;
  monthlyCost: number;
  sessions: SessionSummary[];
}

type Period = 'daily' | 'weekly' | 'monthly';
type StatusLevel = 'safe' | 'warning' | 'danger' | 'over';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<StatusLevel, string> = {
  safe: '✅ On Track',
  warning: '⚠️ Warning',
  danger: '🚨 Approaching Limit',
  over: '🔴 Over Budget',
};

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const LS_LIMITS_KEY = 'budget-meter-limits';
const LS_ALERTS_KEY = 'budget-meter-alerts-fired';
const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusLevel(pct: number): StatusLevel {
  if (pct >= 100) return 'over';
  if (pct >= 90) return 'danger';
  if (pct >= 70) return 'warning';
  return 'safe';
}

function fmtDollar(n: number): string {
  return `$${n.toFixed(2)}`;
}

function aggregateAgentSpend(sessions: SessionSummary[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sessions) {
    const agent = s.agent ?? 'unknown';
    map[agent] = (map[agent] ?? 0) + (s.totalCost ?? 0);
  }
  return map;
}

// ─── Component ────────────────────────────────────────────────────────────────

const BudgetMeter: React.FC<BudgetMeterProps> = ({
  dailyCost,
  weeklyCost,
  monthlyCost,
  sessions,
}) => {
  const [config, setConfig] = useState<BudgetConfig | null>(null);
  const [limits, setLimits] = useState<BudgetLimits | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<BudgetLimits>({ daily: 100, weekly: 500, monthly: 1500 });
  const [loading, setLoading] = useState(true);
  const alertsFiredRef = useRef<Record<string, number>>({});

  // ── Load config ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/budget.json')
      .then(r => r.json())
      .then((data: BudgetConfig) => {
        setConfig(data);

        // Prefer localStorage overrides
        const stored = localStorage.getItem(LS_LIMITS_KEY);
        const overrides: Partial<BudgetLimits> = stored ? JSON.parse(stored) : {};
        const resolved: BudgetLimits = {
          daily: overrides.daily ?? data.limits.daily,
          weekly: overrides.weekly ?? data.limits.weekly,
          monthly: overrides.monthly ?? data.limits.monthly,
        };
        setLimits(resolved);
        setEditValues(resolved);
      })
      .catch(() => {
        const fallback: BudgetLimits = { daily: 100, weekly: 500, monthly: 1500 };
        setConfig({
          limits: fallback,
          agentCaps: {},
          alerts: { thresholds: [0.7, 0.9, 1.0], enabled: true },
          lastAlert: { daily: null, weekly: null, monthly: null },
          updatedAt: new Date().toISOString(),
        });
        setLimits(fallback);
        setEditValues(fallback);
      })
      .finally(() => setLoading(false));

    // Load fired-alerts tracker
    const storedAlerts = localStorage.getItem(LS_ALERTS_KEY);
    if (storedAlerts) {
      alertsFiredRef.current = JSON.parse(storedAlerts);
    }
  }, []);

  // ── Fire alerts ───────────────────────────────────────────────────────────
  const maybeAlert = useCallback(
    (period: Period, spent: number, limit: number, thresholds: number[]) => {
      const now = Date.now();
      const pct = limit > 0 ? spent / limit : 0;

      for (const threshold of thresholds) {
        if (pct < threshold) continue;

        const key = `${period}-${Math.round(threshold * 100)}`;
        const lastFired = alertsFiredRef.current[key] ?? 0;

        // Only fire if cooldown has passed
        if (now - lastFired < ALERT_COOLDOWN_MS) continue;

        // Build message
        let type: 'warning' | 'critical' = 'warning';
        let title = '';
        let message = '';

        if (threshold >= 1.0) {
          type = 'critical';
          const over = spent - limit;
          title = `🔴 ${PERIOD_LABELS[period]} Budget EXCEEDED`;
          message = `${fmtDollar(spent)} spent — ${fmtDollar(over)} over ${fmtDollar(limit)} limit`;
        } else if (threshold >= 0.9) {
          type = 'critical';
          title = `🚨 Approaching ${PERIOD_LABELS[period]} Limit`;
          message = `${fmtDollar(spent)} / ${fmtDollar(limit)} — only ${(100 - pct * 100).toFixed(0)}% remaining`;
        } else {
          type = 'warning';
          title = `💰 ${PERIOD_LABELS[period]} budget at ${Math.round(threshold * 100)}%`;
          message = `${fmtDollar(spent)} / ${fmtDollar(limit)}`;
        }

        sendNotification({
          type: type === 'critical' ? 'critical' : 'warning',
          category: 'system',
          title,
          message,
          link: '/costs',
        });

        // Record that we fired this alert
        alertsFiredRef.current[key] = now;
        localStorage.setItem(LS_ALERTS_KEY, JSON.stringify(alertsFiredRef.current));

        // Only fire the highest breached threshold per check
        break;
      }
    },
    [],
  );

  // ── Check thresholds when data changes ───────────────────────────────────
  useEffect(() => {
    if (!config || !limits || !config.alerts.enabled) return;

    const thresholds = [...config.alerts.thresholds].sort((a, b) => b - a); // highest first
    maybeAlert('daily', dailyCost, limits.daily, thresholds);
    maybeAlert('weekly', weeklyCost, limits.weekly, thresholds);
    maybeAlert('monthly', monthlyCost, limits.monthly, thresholds);
  }, [config, limits, dailyCost, weeklyCost, monthlyCost, maybeAlert]);

  // ── Edit helpers ─────────────────────────────────────────────────────────
  const handleSaveLimits = () => {
    setLimits(editValues);
    localStorage.setItem(LS_LIMITS_KEY, JSON.stringify(editValues));
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValues(limits ?? editValues);
    setEditing(false);
  };

  // ── Per-agent spend ───────────────────────────────────────────────────────
  const agentSpendMap = aggregateAgentSpend(sessions);
  const topAgents: AgentSpend[] = Object.entries(agentSpendMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, cost]) => {
      const capKey = Object.keys(config?.agentCaps ?? {}).find(
        k => k.toLowerCase() === name.toLowerCase(),
      );
      const cap = capKey
        ? (config!.agentCaps[capKey] ?? config!.agentCaps['default'] ?? null)
        : config?.agentCaps['default'] ?? null;
      return { name, cost, cap };
    });

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading || !limits || !config) {
    return (
      <div className="bm-cost-card glass-card">
        <div className="bm-cost-loading">⏳ Loading budget data…</div>
      </div>
    );
  }

  const periods: { key: Period; spent: number }[] = [
    { key: 'daily', spent: dailyCost },
    { key: 'weekly', spent: weeklyCost },
    { key: 'monthly', spent: monthlyCost },
  ];

  // Overall status = worst of the three periods
  const overallStatus: StatusLevel = periods.reduce<StatusLevel>((worst, { key, spent }) => {
    const s = getStatusLevel(limits[key] > 0 ? (spent / limits[key]) * 100 : 0);
    const rank: Record<StatusLevel, number> = { safe: 0, warning: 1, danger: 2, over: 3 };
    return rank[s] > rank[worst] ? s : worst;
  }, 'safe');

  return (
    <div className={`bm-cost-card glass-card bm-status-${overallStatus}`}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bm-header">
        <div className="bm-title">
          <span className="bm-title-icon">💰</span>
          <span>Budget Monitor</span>
          {config.alerts.enabled && (
            <span className="bm-alerts-active" title="Threshold alerts active">🔔</span>
          )}
        </div>
        <div className="bm-header-right">
          <span className={`bm-overall-badge bm-badge-${overallStatus}`}>
            {STATUS_LABELS[overallStatus]}
          </span>
          {!editing ? (
            <button className="bm-edit-btn" onClick={() => setEditing(true)}>
              ✏️ Edit Limits
            </button>
          ) : (
            <div className="bm-edit-actions">
              <button className="bm-save-btn" onClick={handleSaveLimits}>💾 Save</button>
              <button className="bm-cancel-btn" onClick={handleCancelEdit}>✕</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Limits Panel ──────────────────────────────────────────────── */}
      {editing && (
        <div className="bm-edit-panel">
          {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
            <label key={p} className="bm-edit-field">
              <span className="bm-edit-label">{PERIOD_LABELS[p]} Limit ($)</span>
              <input
                type="number"
                min={1}
                step={10}
                className="bm-edit-input"
                value={editValues[p]}
                onChange={e =>
                  setEditValues(prev => ({ ...prev, [p]: Number(e.target.value) }))
                }
              />
            </label>
          ))}
          <p className="bm-edit-note">Limits saved locally in your browser.</p>
        </div>
      )}

      {/* ── Progress Bars ──────────────────────────────────────────────────── */}
      <div className="bm-bars">
        {periods.map(({ key, spent }) => {
          const limit = limits[key];
          const rawPct = limit > 0 ? (spent / limit) * 100 : 0;
          const clampedPct = Math.min(rawPct, 100);
          const status = getStatusLevel(rawPct);

          return (
            <div key={key} className="bm-bar-row">
              <div className="bm-bar-meta">
                <div className="bm-bar-label">
                  <span className="bm-period-name">{PERIOD_LABELS[key]}</span>
                  <span className={`bm-period-badge bm-badge-${status}`}>
                    {rawPct.toFixed(0)}%
                  </span>
                </div>
                <div className="bm-bar-amounts">
                  <span className={`bm-spent bm-spent-${status}`}>{fmtDollar(spent)}</span>
                  <span className="bm-limit">/ {fmtDollar(limit)}</span>
                  {rawPct > 100 && (
                    <span className="bm-over-tag">
                      +{fmtDollar(spent - limit)} over
                    </span>
                  )}
                </div>
              </div>

              {/* Track */}
              <div className="bm-track">
                {/* Threshold markers */}
                {config.alerts.thresholds.map(t => (
                  t < 1 && (
                    <div
                      key={t}
                      className="bm-threshold-marker"
                      style={{ left: `${t * 100}%` }}
                      title={`${Math.round(t * 100)}% threshold`}
                    />
                  )
                ))}
                {/* Fill */}
                <div
                  className={`bm-fill bm-fill-${status}`}
                  style={{ width: `${clampedPct}%` }}
                />
              </div>

              {/* Remaining / over */}
              <div className="bm-bar-footer">
                {rawPct <= 100 ? (
                  <span className="bm-remaining">
                    {fmtDollar(limit - spent)} remaining
                  </span>
                ) : (
                  <span className="bm-exceeded">
                    ⚠️ Exceeded by {fmtDollar(spent - limit)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Per-Agent Spend ────────────────────────────────────────────────── */}
      {topAgents.length > 0 && (
        <div className="bm-agents">
          <div className="bm-agents-title">🤖 Top Agents by Spend</div>
          <div className="bm-agents-list">
            {topAgents.map(({ name, cost, cap }) => {
              const agentPct = cap !== null && cap > 0 ? Math.min((cost / cap) * 100, 100) : null;
              const agentStatus: StatusLevel =
                agentPct !== null ? getStatusLevel(agentPct) : 'safe';

              return (
                <div key={name} className="bm-agent-row">
                  <div className="bm-agent-meta">
                    <span className="bm-agent-name">{name}</span>
                    <div className="bm-agent-cost-wrap">
                      <span className={`bm-agent-cost bm-agent-cost-${agentStatus}`}>
                        {fmtDollar(cost)}
                      </span>
                      {cap !== null && (
                        <span className="bm-agent-cap">/ {fmtDollar(cap)} cap</span>
                      )}
                    </div>
                  </div>
                  {cap !== null && agentPct !== null && (
                    <div className="bm-agent-track">
                      <div
                        className={`bm-agent-fill bm-fill-${agentStatus}`}
                        style={{ width: `${agentPct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetMeter;
