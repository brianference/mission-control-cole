import React, { useState, useEffect, useCallback } from 'react';
import { fetchCrons, type CronJob, type ConnectionStatus } from '../utils/gatewayApi';
import './CronPanel.css';

const REFRESH_INTERVAL_MS = 30_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTs(ms?: number): string {
  if (!ms) return '—';
  const d = new Date(ms);
  const now = Date.now();
  const diff = now - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatNextRun(ms?: number): string {
  if (!ms) return '—';
  const now = Date.now();
  const diff = ms - now;
  if (diff < 0) return 'overdue';
  if (diff < 60_000) return 'in <1m';
  if (diff < 3600_000) return `in ${Math.floor(diff / 60_000)}m`;
  if (diff < 86400_000) return `in ${Math.floor(diff / 3600_000)}h`;
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(ms?: number): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

function statusClass(status: string): string {
  if (status === 'ok') return 'status-ok';
  if (status === 'error') return 'status-error';
  if (status === 'running') return 'status-running';
  return 'status-unknown';
}

function statusLabel(job: CronJob): string {
  if (!job.enabled) return 'Disabled';
  if (job.lastStatus === 'ok') return '✓ OK';
  if (job.lastStatus === 'error') return '✗ Error';
  if (job.lastStatus === 'running') return '⟳ Running';
  return '— Unknown';
}

function modelShort(model: string): string {
  if (!model || model === 'unknown') return '—';
  if (model.includes('gemini')) return 'Gemini Flash';
  if (model.includes('sonnet-4-5')) return 'Sonnet 4.5';
  if (model.includes('sonnet')) return 'Sonnet';
  if (model.includes('haiku')) return 'Haiku';
  if (model.includes('minimax')) return 'Minimax';
  if (model.includes('opus')) return 'Opus';
  return model.split('/').pop() || model;
}

// ── Component ─────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'enabled' | 'disabled' | 'error';

const CronPanel: React.FC = () => {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [status, setStatus] = useState<ConnectionStatus>('offline');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    const result = await fetchCrons();
    setJobs(result.data.jobs);
    setLastUpdated(result.data.lastUpdated);
    setStatus(result.status);
    setLoading(false);
    setCountdown(REFRESH_INTERVAL_MS / 1000);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Countdown timer
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => (c <= 1 ? REFRESH_INTERVAL_MS / 1000 : c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleToggle = async (job: CronJob) => {
    const action = job.enabled ? 'disable' : 'enable';
    const cmd = `openclaw crons ${action} ${job.id}`;
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      // ignore
    }
    showToast(`Command copied: ${cmd}`);
  };

  const handleRunNow = async (job: CronJob) => {
    const cmd = `openclaw crons run ${job.id}`;
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      // ignore
    }
    showToast(`Command copied: ${cmd}`);
  };

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = jobs.filter(j => {
    if (filter === 'enabled' && !j.enabled) return false;
    if (filter === 'disabled' && j.enabled) return false;
    if (filter === 'error' && j.lastStatus !== 'error') return false;
    if (search && !j.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: jobs.length,
    enabled: jobs.filter(j => j.enabled).length,
    disabled: jobs.filter(j => !j.enabled).length,
    error: jobs.filter(j => j.lastStatus === 'error').length,
  };

  if (loading) {
    return (
      <div className="cron-panel">
        <header className="page-header">
          <h1 className="page-title gradient-text">Cron Control</h1>
        </header>
        <div className="loading-state">Loading cron jobs…</div>
      </div>
    );
  }

  return (
    <div className="cron-panel">
      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div className="toast-notification">
          <span className="toast-icon">📋</span>
          {toast}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="page-header">
        <div>
          <h1 className="page-title gradient-text">Cron Control</h1>
          <p className="page-subtitle">
            {counts.enabled} enabled · {counts.disabled} disabled · {counts.error} errors
          </p>
        </div>
        <div className="cron-header-right">
          <span className={`live-badge live-badge--${status}`}>
            {status === 'live' ? '🟢 LIVE' : status === 'cached' ? '🟡 CACHED' : '🔴 OFFLINE'}
          </span>
          <span className="refresh-info">↻ {countdown}s</span>
        </div>
      </header>

      {/* ── Last updated ─────────────────────────────────────────────── */}
      {lastUpdated && (
        <div className="cron-meta">
          Data built: {new Date(lastUpdated).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="cron-filters">
        <div className="filter-tabs">
          {(['all', 'enabled', 'disabled', 'error'] as FilterType[]).map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''} ${f === 'error' && counts.error > 0 ? 'has-errors' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="filter-count">{counts[f]}</span>
            </button>
          ))}
        </div>
        <div className="cron-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search cron jobs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="cron-table-wrap card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🕐</span>
            <p>No cron jobs match your filter</p>
          </div>
        ) : (
          <table className="cron-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Schedule</th>
                <th>Model</th>
                <th>Last Run</th>
                <th>Next Run</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(job => (
                <tr key={job.id} className={!job.enabled ? 'row-disabled' : ''}>
                  <td className="col-name">
                    <div className="job-name">{job.name}</div>
                    {job.consecutiveErrors > 0 && (
                      <div className="error-count">⚠ {job.consecutiveErrors} errors</div>
                    )}
                    {job.lastError && (
                      <div className="error-msg" title={job.lastError}>
                        {job.lastError.slice(0, 40)}{job.lastError.length > 40 ? '…' : ''}
                      </div>
                    )}
                  </td>
                  <td className="col-schedule">
                    <code className="schedule-code">{job.schedule}</code>
                    {job.tz && job.tz !== 'UTC' && (
                      <div className="schedule-tz">{job.tz.split('/').pop()}</div>
                    )}
                  </td>
                  <td className="col-model">
                    <span className="model-tag">{modelShort(job.model)}</span>
                  </td>
                  <td className="col-lastrun">{formatTs(job.lastRunMs)}</td>
                  <td className={`col-nextrun ${job.nextRunMs && job.nextRunMs < Date.now() ? 'overdue' : ''}`}>
                    {formatNextRun(job.nextRunMs)}
                  </td>
                  <td className="col-duration">{formatDuration(job.lastDurationMs)}</td>
                  <td className="col-status">
                    <span className={`status-badge ${!job.enabled ? 'status-disabled' : statusClass(job.lastStatus)}`}>
                      {statusLabel(job)}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-group">
                      <button
                        className={`toggle-btn ${job.enabled ? 'btn-disable' : 'btn-enable'}`}
                        onClick={() => handleToggle(job)}
                        title={job.enabled ? 'Disable cron job' : 'Enable cron job'}
                      >
                        {job.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="run-now-btn"
                        onClick={() => handleRunNow(job)}
                        title="Copy run-now command"
                        disabled={!job.enabled}
                      >
                        ▶ Run
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Note ──────────────────────────────────────────────────────── */}
      <div className="cron-note">
        <span>ℹ️</span> Toggle and Run buttons copy the CLI command to clipboard. Run it in your terminal to take effect.
      </div>
    </div>
  );
};

export default CronPanel;
