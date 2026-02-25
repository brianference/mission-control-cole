import React, { useState, useEffect, useCallback } from 'react';
import WorkspaceActivity from '../components/WorkspaceActivity';
import { fetchSessions, fetchUsage, type ConnectionStatus } from '../utils/gatewayApi';
import './Agents.css';

const REFRESH_INTERVAL_MS = 30_000;

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  type: string;
  canSpawn?: string[];
}

interface ActiveSession {
  agentId: string;
  sessionKey: string;
  displayName: string;
  model: string;
  totalTokens: number;
  updatedAt: number;
  status: string;
  messageCount?: number;
  inputTokens?: number;
  outputTokens?: number;
}

// SessionsData kept for reference (used internally by gatewayApi)
// interface SessionsData { ... }

interface DailyUsage {
  date: string;
  cost: number;
  tokens: number;
  requests: number;
  sessions: number;
}

interface UsageData {
  summary: object;
  daily: DailyUsage[];
}

interface SpawnForm {
  task: string;
  model: string;
  timeout: string;
  label: string;
}

const CONTEXT_WINDOW = 200000;

const MODEL_OPTIONS = [
  { label: 'Claude Sonnet 4.5', value: 'anthropic/claude-sonnet-4-5' },
  { label: 'Claude Opus 4.6', value: 'anthropic/claude-opus-4-6' },
  { label: 'Gemini Flash', value: 'google/gemini-2.5-flash' },
  { label: 'Minimax M2.1', value: 'openrouter/minimax/minimax-m2.1' },
];

const TIMEOUT_OPTIONS = [
  { label: '30 min', value: '1800' },
  { label: '1 hr', value: '3600' },
  { label: '2 hr', value: '7200' },
  { label: '4 hr', value: '14400' },
];

// Demo sessions for display when real data is empty
const DEMO_SESSIONS: ActiveSession[] = [
  {
    agentId: 'main',
    sessionKey: 'main',
    displayName: 'main',
    model: 'claude-sonnet-4-5',
    totalTokens: 164000,
    updatedAt: Date.now() - 14 * 60 * 1000,
    status: 'running',
  },
  {
    agentId: 'coder',
    sessionKey: 'coder-agent',
    displayName: 'coder-agent',
    model: 'claude-sonnet-4-5',
    totalTokens: 80000,
    updatedAt: Date.now() - 3 * 60 * 1000,
    status: 'running',
  },
];

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [dataStatus, setDataStatus] = useState<ConnectionStatus>('offline');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Command Center state
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [killConfirmSession, setKillConfirmSession] = useState<ActiveSession | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [generatedCommand, setGeneratedCommand] = useState<string>('');
  const [spawnForm, setSpawnForm] = useState<SpawnForm>({
    task: '',
    model: 'anthropic/claude-sonnet-4-5',
    timeout: '3600',
    label: '',
  });

  const loadSessions = useCallback(async () => {
    const { data, status } = await fetchSessions();
    const realSessions = data.sessions || [];
    setActiveSessions(realSessions.length > 0 ? realSessions : DEMO_SESSIONS);
    setDataStatus(status);
    setLastUpdated(data.lastUpdated);
    setCountdown(REFRESH_INTERVAL_MS / 1000);
  }, []);

  useEffect(() => {
    // Initial load: agents + sessions + usage in parallel
    void Promise.all([
      fetch('/agents.json').then(res => res.json()),
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSessions(),
      fetchUsage(),
    ])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(([agentsData, , usage]: [Agent[], void, any]) => {
        setAgents(agentsData);
        setFilteredAgents(agentsData);
        setUsageData(usage as UsageData | null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load agents:', err);
        setActiveSessions(DEMO_SESSIONS);
        setLoading(false);
      });

    // Auto-refresh sessions every 30s
    const interval = setInterval(loadSessions, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadSessions]);

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(c => (c <= 1 ? REFRESH_INTERVAL_MS / 1000 : c - 1));
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilteredAgents(agents);
    } else {
      const filtered = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAgents(filtered);
    }
  }, [searchTerm, agents]);

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // ── Session helpers ───────────────────────────────────────────────────────────
  const getAgentStatus = (agentId: string): { isActive: boolean; session?: ActiveSession } => {
    const session = activeSessions.find(s => s.agentId === agentId);
    if (session) {
      const thirtyMinAgo = currentTime - 30 * 60 * 1000;
      const isActive = session.updatedAt > thirtyMinAgo;
      return { isActive, session };
    }
    return { isActive: false };
  };

  const getContextPct = (tokens: number): number =>
    Math.min(100, Math.round((tokens / CONTEXT_WINDOW) * 100));

  const getContextClass = (pct: number): string => {
    if (pct >= 80) return 'ctx-critical';
    if (pct >= 60) return 'ctx-warning';
    return 'ctx-ok';
  };

  const formatTimeAgo = (ts: number): string => {
    const diffMs = currentTime - ts;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ${diffMin % 60}m ago`;
  };

  // ── Kill session ──────────────────────────────────────────────────────────────
  const confirmKill = (session: ActiveSession) => {
    setKillConfirmSession(session);
  };

  const executeKill = async () => {
    if (!killConfirmSession) return;
    const cmd = `openclaw session kill ${killConfirmSession.sessionKey}`;
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      // clipboard may fail in non-secure contexts
    }
    setKillConfirmSession(null);
    showToast('Command copied — run in terminal to kill session');
  };

  // ── Spawn agent ───────────────────────────────────────────────────────────────
  const handleSpawn = async () => {
    if (!spawnForm.task.trim()) return;
    const modelLabel = MODEL_OPTIONS.find(m => m.value === spawnForm.model)?.label || spawnForm.model;
    const timeoutLabel = TIMEOUT_OPTIONS.find(t => t.value === spawnForm.timeout)?.label || spawnForm.timeout + 's';
    const labelPart = spawnForm.label ? `\n  label: "${spawnForm.label}"` : '';
    const cmd = `# sessions_spawn equivalent command:
openclaw sessions spawn \\
  --task "${spawnForm.task.replace(/"/g, '\\"')}" \\
  --model "${spawnForm.model}" \\
  --timeout ${spawnForm.timeout}${spawnForm.label ? ` \\\n  --label "${spawnForm.label}"` : ''}

# Or via OpenClaw API:
# model: ${modelLabel}
# timeout: ${timeoutLabel}${labelPart}`;
    setGeneratedCommand(cmd);
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      // clipboard may fail
    }
    showToast('Command copied to clipboard');
  };

  const closeSpawnModal = () => {
    setShowSpawnModal(false);
    setGeneratedCommand('');
    setSpawnForm({ task: '', model: 'anthropic/claude-sonnet-4-5', timeout: '3600', label: '' });
  };

  // ── Token burn rate ───────────────────────────────────────────────────────────
  const getBurnRate = () => {
    if (!usageData?.daily?.length) return null;
    const today = new Date().toISOString().split('T')[0];
    let entry = usageData.daily.find(d => d.date === today);
    if (!entry) {
      // Fall back to last available entry
      entry = usageData.daily[usageData.daily.length - 1];
    }
    if (!entry) return null;

    const now = new Date();
    let hoursElapsed: number;
    if (entry.date === today) {
      hoursElapsed = now.getHours() + now.getMinutes() / 60;
      if (hoursElapsed < 0.1) hoursElapsed = 0.1;
    } else {
      hoursElapsed = 24;
    }
    const tokPerHr = Math.round(entry.tokens / hoursElapsed);
    return {
      cost: entry.cost.toFixed(2),
      tokens: entry.tokens,
      tokPerHr,
      date: entry.date,
      isToday: entry.date === today,
    };
  };

  // ── Display helpers ───────────────────────────────────────────────────────────
  const getAgentIcon = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('coder') || n.includes('developer')) return '👨‍💻';
    if (n.includes('designer') || n.includes('morpheus')) return '🎨';
    if (n.includes('pm') || n.includes('orchestrator')) return '📋';
    if (n.includes('test') || n.includes('validator')) return '🧪';
    if (n.includes('idea')) return '💡';
    if (n.includes('scholarship')) return '🎓';
    if (n.includes('visual')) return '👁️';
    if (n.includes('candi')) return '🍬';
    return '🤖';
  };

  const formatModelName = (model: string): string => {
    if (model.includes('minimax')) return 'Minimax M2.1';
    if (model.includes('opus-4-6')) return 'Claude Opus 4.6';
    if (model.includes('opus-4-5')) return 'Claude Opus 4.5';
    if (model.includes('sonnet')) return 'Claude Sonnet';
    if (model.includes('haiku')) return 'Claude Haiku';
    if (model.includes('gemini')) return 'Gemini';
    if (model.includes('gpt')) return 'GPT-5.2';
    return model.split('/').pop() || model;
  };

  const getCostTier = (model: string): { label: string; className: string } => {
    if (model.includes('minimax') || model.includes('haiku'))
      return { label: '💰 Low Cost', className: 'cost-low' };
    if (model.includes('sonnet') || model.includes('gemini'))
      return { label: '💵 Medium', className: 'cost-medium' };
    if (model.includes('opus') || model.includes('gpt'))
      return { label: '💎 Premium', className: 'cost-high' };
    return { label: '❓ Unknown', className: 'cost-unknown' };
  };

  if (loading) {
    return (
      <div className="agents-page">
        <header className="page-header">
          <h1 className="page-title gradient-text">Agents</h1>
        </header>
        <div className="loading-state">Loading agents...</div>
      </div>
    );
  }

  const activeCount = agents.filter(a => getAgentStatus(a.id).isActive).length;
  const burnRate = getBurnRate();

  return (
    <div className="agents-page">
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="toast-notification">
          <span className="toast-icon">✅</span>
          {toast}
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <header className="page-header">
        <div>
          <h1 className="page-title gradient-text">Agents</h1>
          <p className="page-subtitle">
            {agents.length} agents configured • {activeCount} active now
          </p>
        </div>
        <div className="agents-header-right">
          {/* Connection Status Badge */}
          <span className={`live-badge live-badge--${dataStatus}`}>
            {dataStatus === 'live' ? '🟢 LIVE' : dataStatus === 'cached' ? '🟡 CACHED' : '🔴 OFFLINE'}
          </span>
          <span className="refresh-countdown">↻ {countdown}s</span>
          {lastUpdated && (
            <span className="last-updated-text">
              Built {new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {/* Token Burn Rate */}
        {burnRate && (
          <div className="burn-rate-widget card">
            <span className="burn-icon">🔥</span>
            <div className="burn-stats">
              <span className="burn-label">{burnRate.isToday ? 'Today' : burnRate.date}:</span>
              <span className="burn-cost">${burnRate.cost}</span>
              <span className="burn-sep">•</span>
              <span className="burn-tokens">
                {burnRate.tokens >= 1000
                  ? `${(burnRate.tokens / 1000).toFixed(0)}K`
                  : burnRate.tokens}{' '}
                tokens
              </span>
              <span className="burn-sep">•</span>
              <span className="burn-rate">
                ~{burnRate.tokPerHr >= 1000
                  ? `${(burnRate.tokPerHr / 1000).toFixed(1)}K`
                  : burnRate.tokPerHr}{' '}
                tok/hr
              </span>
            </div>
          </div>
        )}
      </header>

      {/* ── Live Sessions Panel ────────────────────────────────────────────── */}
      <section className="live-sessions-panel card">
        <div className="live-sessions-header">
          <div className="live-sessions-title">
            <span className="live-icon">⚡</span>
            <h2>Live Sessions</h2>
            <span className="session-count-badge">{activeSessions.length}</span>
          </div>
          <button
            className="spawn-btn"
            onClick={() => setShowSpawnModal(true)}
          >
            <span>+</span> Spawn Agent
          </button>
        </div>

        {activeSessions.length === 0 ? (
          <div className="no-sessions">
            <span>💤</span> No active sessions
          </div>
        ) : (
          <div className="sessions-list">
            {activeSessions.map((session) => {
              const ctxPct = getContextPct(session.totalTokens);
              const ctxClass = getContextClass(ctxPct);
              const timeAgo = formatTimeAgo(session.updatedAt);

              return (
                <div key={session.sessionKey} className={`session-row ${ctxClass}`}>
                  <div className="session-info">
                    <span className="session-bot-icon">🤖</span>
                    <div className="session-meta">
                      <div className="session-top">
                        <span className="session-name">{session.displayName}</span>
                        <span className="session-model">{formatModelName(session.model)}</span>
                        {ctxPct >= 80 && (
                          <span className="ctx-warn-badge">⚠️ Context warning</span>
                        )}
                        {ctxPct >= 60 && ctxPct < 80 && (
                          <span className="ctx-caution-badge">⚠️ Nearing limit</span>
                        )}
                      </div>
                      <div className="session-ctx-bar-wrap">
                        <div className="session-ctx-bar">
                          <div
                            className={`session-ctx-fill ${ctxClass}`}
                            style={{ width: `${ctxPct}%` }}
                          />
                        </div>
                        <span className="session-ctx-pct">{ctxPct}% ctx</span>
                      </div>
                      <div className="session-bottom">
                        <span className="session-tokens">
                          {(session.totalTokens / 1000).toFixed(0)}K tokens
                        </span>
                        {session.messageCount !== undefined && session.messageCount > 0 && (
                          <>
                            <span className="session-sep">•</span>
                            <span className="session-msgs">{session.messageCount} msgs</span>
                          </>
                        )}
                        <span className="session-sep">•</span>
                        <span className="session-time">Active {timeAgo}</span>
                      </div>
                      <div className="session-key-row">
                        <span className="session-key-label">key:</span>
                        <code className="session-key-code">{session.sessionKey.slice(0, 28)}{session.sessionKey.length > 28 ? '…' : ''}</code>
                        <span className="session-kind-badge">{session.status}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="kill-btn"
                    onClick={() => confirmKill(session)}
                    title={`Kill session ${session.displayName}`}
                  >
                    Kill
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div className="search-section">
        <div className="search-box card">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search agents by name, description, or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="search-clear"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="search-results">
          Showing {filteredAgents.length} of {agents.length} agents
        </div>
      </div>

      {/* ── Workspace Activity ─────────────────────────────────────────────── */}
      <WorkspaceActivity />

      {/* ── Agent Grid ─────────────────────────────────────────────────────── */}
      <section className="agents-grid-section">
        <div className="agents-grid">
          {filteredAgents.map((agent) => {
            const { isActive, session } = getAgentStatus(agent.id);
            const costTier = getCostTier(agent.model);
            const ctxPct = session ? getContextPct(session.totalTokens) : 0;
            const ctxClass = getContextClass(ctxPct);

            return (
              <div key={agent.id} className={`agent-card card ${isActive ? 'agent-active' : ''}`}>
                <div className="agent-header">
                  <div className="agent-title-group">
                    <span className="agent-icon">{getAgentIcon(agent.name)}</span>
                    <h3 className="agent-name">{agent.name}</h3>
                  </div>
                  <span
                    className={`status-dot ${isActive ? 'online active-pulse' : 'offline'}`}
                    title={isActive ? 'Active' : 'Idle'}
                  />
                </div>

                <div className="agent-description">{agent.description}</div>

                <div className="agent-model">
                  <span className="model-label">Model:</span>
                  <span className="model-value">{formatModelName(agent.model)}</span>
                  <span className={`cost-badge ${costTier.className}`}>{costTier.label}</span>
                </div>

                {/* Mini context bar when agent has active session */}
                {isActive && session && (
                  <div className="agent-ctx-bar-wrap">
                    <div className="agent-ctx-bar">
                      <div
                        className={`agent-ctx-fill ${ctxClass}`}
                        style={{ width: `${ctxPct}%` }}
                      />
                    </div>
                    <span className="agent-ctx-label">{ctxPct}% ctx</span>
                  </div>
                )}

                {agent.canSpawn && agent.canSpawn.length > 0 && (
                  <div className="agent-spawns">
                    <span className="spawns-label">Can spawn:</span>
                    <span className="spawns-value">{agent.canSpawn.length} agents</span>
                  </div>
                )}

                <div className="agent-footer">
                  <div className="agent-type">
                    <span className="type-badge">{agent.type}</span>
                  </div>
                  <div className="agent-stats">
                    <div className="stat-item">
                      <span className={`stat-value ${isActive ? 'status-active' : 'status-idle'}`}>
                        {isActive ? 'Active' : 'Idle'}
                      </span>
                      <span className="stat-label">Status</span>
                    </div>
                    {session && (
                      <div className="stat-item">
                        <span className="stat-value">{(session.totalTokens / 1000).toFixed(0)}K</span>
                        <span className="stat-label">Tokens</span>
                      </div>
                    )}
                    {isActive && session && (
                      <div className="stat-item">
                        <span className="stat-value stat-time">
                          {formatTimeAgo(session.updatedAt)}
                        </span>
                        <span className="stat-label">Last seen</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAgents.length === 0 && (
          <div className="empty-state card">
            <span className="empty-icon">🔍</span>
            <h3>No agents found</h3>
            <p>Try adjusting your search term</p>
          </div>
        )}
      </section>

      {/* ── Kill Confirmation Modal ────────────────────────────────────────── */}
      {killConfirmSession && (
        <div className="modal-overlay" onClick={() => setKillConfirmSession(null)}>
          <div className="modal-card card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Kill Session</h3>
              <button className="modal-close" onClick={() => setKillConfirmSession(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-desc">
                Kill session <strong className="session-name-highlight">{killConfirmSession.displayName}</strong>?
              </p>
              <div className="kill-cmd-preview">
                <code>openclaw session kill {killConfirmSession.sessionKey}</code>
              </div>
              <p className="modal-note">
                This will copy the kill command to your clipboard. Run it in your terminal to terminate the session.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setKillConfirmSession(null)}>
                Cancel
              </button>
              <button className="btn-kill" onClick={executeKill}>
                📋 Copy &amp; Kill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Spawn Agent Modal ──────────────────────────────────────────────── */}
      {showSpawnModal && (
        <div className="modal-overlay" onClick={closeSpawnModal}>
          <div className="modal-card spawn-modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚡ Spawn Agent</h3>
              <button className="modal-close" onClick={closeSpawnModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label className="form-label">Task <span className="required">*</span></label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe what the agent should do..."
                  value={spawnForm.task}
                  onChange={e => setSpawnForm(f => ({ ...f, task: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Model</label>
                  <select
                    className="form-select"
                    value={spawnForm.model}
                    onChange={e => setSpawnForm(f => ({ ...f, model: e.target.value }))}
                  >
                    {MODEL_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Timeout</label>
                  <select
                    className="form-select"
                    value={spawnForm.timeout}
                    onChange={e => setSpawnForm(f => ({ ...f, timeout: e.target.value }))}
                  >
                    {TIMEOUT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Label <span className="optional">(optional)</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="agent label for tracking"
                  value={spawnForm.label}
                  onChange={e => setSpawnForm(f => ({ ...f, label: e.target.value }))}
                />
              </div>

              {generatedCommand && (
                <div className="spawn-cmd-output">
                  <div className="spawn-cmd-label">Generated command:</div>
                  <pre className="spawn-cmd-pre">{generatedCommand}</pre>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeSpawnModal}>
                Cancel
              </button>
              <button
                className="btn-spawn"
                onClick={handleSpawn}
                disabled={!spawnForm.task.trim()}
              >
                📋 Generate &amp; Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
