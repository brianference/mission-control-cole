import React, { useEffect, useState } from 'react';
import './CommonPages.css';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  alias: string;
  status: 'ok' | 'error' | 'warning' | 'unknown';
  message: string;
  latency: number | null;
  is_default: boolean;
}

interface ProviderInfo {
  status: 'ok' | 'error' | 'warning';
  profiles: number;
}

interface ModelHealthData {
  lastChecked: string;
  providers: Record<string, ProviderInfo>;
  models: ModelInfo[];
  rawOutput?: string;
}

const providerEmoji: Record<string, string> = {
  anthropic: '🟣',
  google: '🔵',
  openrouter: '🟠',
};

const statusColor: Record<string, string> = {
  ok: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',
  unknown: '#9ca3af',
};

const statusBg: Record<string, string> = {
  ok: 'rgba(52, 211, 153, 0.1)',
  error: 'rgba(248, 113, 113, 0.1)',
  warning: 'rgba(251, 191, 36, 0.1)',
  unknown: 'rgba(156, 163, 175, 0.1)',
};

const ModelHealth: React.FC = () => {
  const [data, setData] = useState<ModelHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    fetch('/model-health.json')
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

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">🏥 Model Health</h1>
          <p className="page-subtitle">Checking model status...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">🏥 Model Health</h1>
          <p className="page-subtitle">Failed to load model health data</p>
        </div>
        <div className="glass-card p-6" style={{ borderColor: 'rgba(248, 113, 113, 0.3)' }}>
          <p style={{ color: '#f87171' }}>{error || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  const okModels = data.models.filter(m => m.status === 'ok');
  const errorModels = data.models.filter(m => m.status === 'error');
  const providerEntries = Object.entries(data.providers);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🏥 Model Health</h1>
          <p className="page-subtitle">Real-time status for all configured AI models</p>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card p-4" style={{ borderColor: 'rgba(52, 211, 153, 0.3)' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Models OK</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#34d399' }}>{okModels.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>of {data.models.length} total</div>
        </div>

        <div className="glass-card p-4" style={{ borderColor: errorModels.length > 0 ? 'rgba(248, 113, 113, 0.3)' : 'rgba(52, 211, 153, 0.3)' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Errors</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: errorModels.length > 0 ? '#f87171' : '#34d399' }}>
            {errorModels.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>auth issues</div>
        </div>

        <div className="glass-card p-4" style={{ borderColor: 'rgba(129, 140, 248, 0.3)' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Providers</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#818cf8' }}>{providerEntries.length}</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>configured</div>
        </div>

        <div className="glass-card p-4" style={{ borderColor: 'rgba(20, 184, 166, 0.3)' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Last Check</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#14b8a6', lineHeight: 1.3 }}>
            {new Date(data.lastChecked).toLocaleTimeString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            {new Date(data.lastChecked).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Provider Auth Status */}
      <div className="glass-card p-6" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🔑 Provider Authentication
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {providerEntries.map(([name, info]) => (
            <div
              key={name}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                background: statusBg[info.status],
                border: `1px solid ${statusColor[info.status]}40`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{providerEmoji[name] || '🔲'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#e5e7eb', textTransform: 'capitalize' }}>{name}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{info.profiles} profile{info.profiles !== 1 ? 's' : ''}</div>
              </div>
              <div style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                background: statusColor[info.status] + '30',
                color: statusColor[info.status],
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                {info.status === 'ok' ? '✓ OK' : info.status === 'error' ? '✗ Error' : info.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Models Grid */}
      <div className="glass-card p-6" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🤖 Model Status
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.models.map(model => (
            <div
              key={model.id}
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '10px',
                background: statusBg[model.status],
                border: `1px solid ${statusColor[model.status]}40`,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              {/* Status indicator */}
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: statusColor[model.status],
                flexShrink: 0,
                boxShadow: `0 0 6px ${statusColor[model.status]}`,
              }} />

              {/* Provider emoji */}
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                {providerEmoji[model.provider] || '🔲'}
              </span>

              {/* Model info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{model.name}</span>
                  {model.is_default && (
                    <span style={{
                      fontSize: '0.625rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '20px',
                      background: 'rgba(129, 140, 248, 0.2)',
                      color: '#818cf8',
                      border: '1px solid rgba(129, 140, 248, 0.3)',
                    }}>
                      DEFAULT
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
                  {model.alias}
                </div>
              </div>

              {/* Message */}
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'right', flexShrink: 0 }}>
                {model.message}
              </div>

              {/* Status badge */}
              <div style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '20px',
                background: statusColor[model.status] + '25',
                color: statusColor[model.status],
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
                letterSpacing: '0.05em',
              }}>
                {model.status === 'ok' ? '✓ OK' : model.status === 'error' ? '✗ ERROR' : model.status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fallback Chain */}
      <div className="glass-card p-6">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🔄 Fallback Chain
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { name: 'Claude Sonnet 4.5', badge: 'PRIMARY', color: '#818cf8' },
            { name: '→', badge: null, color: '#6b7280' },
            { name: 'Gemini 3 Flash', badge: 'FALLBACK 1', color: '#34d399' },
            { name: '→', badge: null, color: '#6b7280' },
            { name: 'MiniMax M2.1', badge: 'FALLBACK 2', color: '#fb923c' },
          ].map((item, idx) => (
            item.badge ? (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div style={{
                  padding: '0.625rem 1rem',
                  borderRadius: '8px',
                  background: item.color + '15',
                  border: `1px solid ${item.color}40`,
                  color: '#e5e7eb',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.625rem', color: item.color, marginTop: '0.25rem', letterSpacing: '0.05em' }}>
                  {item.badge}
                </div>
              </div>
            ) : (
              <span key={idx} style={{ color: '#4b5563', fontSize: '1.25rem' }}>{item.name}</span>
            )
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '1rem' }}>
          Configured in <code style={{ color: '#818cf8', fontSize: '0.75rem' }}>~/.openclaw/openclaw.json</code> via provider priority
        </p>
      </div>

      <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.75rem', marginTop: '1.5rem' }}>
        Last checked: {new Date(data.lastChecked).toLocaleString()}
      </div>
    </div>
  );
};

export default ModelHealth;
