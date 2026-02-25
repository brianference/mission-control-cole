import React, { useEffect, useState } from 'react';
import './CommonPages.css';

interface MemoryFile {
  name: string;
  modified: string;
  size: number;
}

interface MemoryHealthData {
  lastChecked: string;
  memoryFiles: {
    count: number;
    latest: MemoryFile | null;
    recentFiles: MemoryFile[];
  };
  mem0: {
    status: string;
    provider: string;
    embedder: string;
  };
  supermemory: {
    status: string;
    client: string;
  };
  backupScript: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const timeAgo = (isoDate: string): string => {
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
};

const statusDot = (status: string) => {
  const isOk = status === 'ok' || status === 'configured' || status === 'key_configured';
  return {
    color: isOk ? '#34d399' : status === 'not_configured' ? '#fbbf24' : '#f87171',
    label: isOk ? 'OK' : status === 'not_configured' ? 'Not Configured' : 'Error',
    icon: isOk ? '✅' : status === 'not_configured' ? '⚠️' : '❌',
  };
};

const MemoryHealth: React.FC = () => {
  const [data, setData] = useState<MemoryHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    fetch('/memory-health.json')
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
          <h1 className="page-title">🧠 Memory Health</h1>
          <p className="page-subtitle">Checking memory systems...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">🧠 Memory Health</h1>
        </div>
        <div className="glass-card p-6" style={{ borderColor: 'rgba(248, 113, 113, 0.3)' }}>
          <p style={{ color: '#f87171' }}>{error || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  const mem0Status = statusDot(data.mem0.status);
  const supermemoryStatus = statusDot(data.supermemory.status);
  const latestFile = data.memoryFiles.latest;
  const latestModified = latestFile ? new Date(latestFile.modified) : null;
  const backupAge = latestModified ? timeAgo(latestFile!.modified) : 'Unknown';
  const backupAgeHours = latestModified
    ? (new Date().getTime() - latestModified.getTime()) / 3600000
    : Infinity;
  const backupHealth = backupAgeHours < 1 ? 'excellent' : backupAgeHours < 24 ? 'ok' : backupAgeHours < 72 ? 'warning' : 'error';
  const backupColor = { excellent: '#34d399', ok: '#60a5fa', warning: '#fbbf24', error: '#f87171' }[backupHealth];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🧠 Memory Health</h1>
          <p className="page-subtitle">Memory backup status, mem0 AI memory, and Supermemory cloud</p>
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
        <div className="glass-card p-4" style={{ borderColor: `${backupColor}40` }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>💾 Last Backup</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: backupColor }}>{backupAge}</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            {latestFile ? latestFile.name : 'No backup found'}
          </div>
        </div>

        <div className="glass-card p-4" style={{ borderColor: 'rgba(129, 140, 248, 0.3)' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>📁 Memory Files</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#818cf8' }}>{data.memoryFiles.count}</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>daily logs</div>
        </div>

        <div className="glass-card p-4" style={{ borderColor: `${mem0Status.color}40` }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>🤖 mem0</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: mem0Status.color }}>{mem0Status.icon}</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{mem0Status.label}</div>
        </div>

        <div className="glass-card p-4" style={{ borderColor: `${supermemoryStatus.color}40` }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>☁️ Supermemory</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: supermemoryStatus.color }}>{supermemoryStatus.icon}</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{supermemoryStatus.label}</div>
        </div>
      </div>

      {/* Memory Backup Section */}
      <div className="glass-card p-6" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          💾 Memory Backup Files
        </h2>

        {/* Latest backup highlight */}
        {latestFile && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            background: `${backupColor}15`,
            border: `1px solid ${backupColor}40`,
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: `${backupColor}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0,
            }}>
              {backupHealth === 'excellent' ? '✅' : backupHealth === 'ok' ? '📝' : backupHealth === 'warning' ? '⚠️' : '🔴'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#e5e7eb' }}>Latest: {latestFile.name}</div>
              <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                Modified {new Date(latestFile.modified).toLocaleString()} ({backupAge})
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatBytes(latestFile.size)}</div>
            </div>
            <div style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '20px',
              background: `${backupColor}25`,
              color: backupColor,
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              {backupHealth.toUpperCase()}
            </div>
          </div>
        )}

        {/* Recent files list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.memoryFiles.recentFiles.slice(0, 5).map((file, idx) => (
            <div
              key={idx}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>📄</span>
              <span style={{ flex: 1, color: '#d1d5db', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                {file.name}
              </span>
              <span style={{ color: '#9ca3af', fontSize: '0.75rem', flexShrink: 0 }}>
                {formatBytes(file.size)}
              </span>
              <span style={{ color: '#6b7280', fontSize: '0.75rem', flexShrink: 0 }}>
                {timeAgo(file.modified)}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
          Total: {data.memoryFiles.count} files in workspace/memory/
        </div>
      </div>

      {/* mem0 Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="glass-card p-6" style={{ borderColor: `${mem0Status.color}30` }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🤖 mem0 Status
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: `${mem0Status.color}15`,
              border: `1px solid ${mem0Status.color}40`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{mem0Status.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#e5e7eb' }}>Status: {mem0Status.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{data.mem0.status}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>LLM Provider</div>
              <div style={{ fontSize: '0.875rem', color: '#d1d5db', fontFamily: 'monospace' }}>{data.mem0.provider}</div>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Embedder</div>
              <div style={{ fontSize: '0.875rem', color: '#d1d5db', fontFamily: 'monospace' }}>{data.mem0.embedder}</div>
            </div>

            {data.mem0.status === 'not_configured' && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#fbbf24',
              }}>
                ⚠️ mem0 plugin not found in openclaw.json config. Uses OpenAI API key when configured.
              </div>
            )}
          </div>
        </div>

        {/* Supermemory Status */}
        <div className="glass-card p-6" style={{ borderColor: `${supermemoryStatus.color}30` }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ☁️ Supermemory
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              background: `${supermemoryStatus.color}15`,
              border: `1px solid ${supermemoryStatus.color}40`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{supermemoryStatus.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#e5e7eb' }}>Status: {supermemoryStatus.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{data.supermemory.status}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Client</div>
              <div style={{ fontSize: '0.75rem', color: '#d1d5db', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {data.supermemory.client}
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Backup Script</div>
              <div style={{ fontSize: '0.75rem', color: '#d1d5db', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {data.backupScript}
              </div>
            </div>

            {supermemoryStatus.label === 'OK' && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#34d399',
              }}>
                ✅ SUPERMEMORY_API_KEY configured. Cloud backup available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="glass-card p-6">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏗️ Memory Architecture
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            { icon: '📝', title: 'Daily Logs', desc: 'memory/YYYY-MM-DD.md', color: '#818cf8' },
            { icon: '🧠', title: 'Long-term Memory', desc: 'MEMORY.md curated', color: '#14b8a6' },
            { icon: '🤖', title: 'mem0 (AI)', desc: 'Vector + semantic search', color: '#fbbf24' },
            { icon: '☁️', title: 'Supermemory', desc: 'Cloud backup API', color: '#34d399' },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '1rem',
                borderRadius: '8px',
                background: `${item.color}10`,
                border: `1px solid ${item.color}30`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.icon}</div>
              <div style={{ fontWeight: 600, color: '#e5e7eb', marginBottom: '0.25rem' }}>{item.title}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.75rem', marginTop: '1.5rem' }}>
        Last checked: {new Date(data.lastChecked).toLocaleString()}
      </div>
    </div>
  );
};

export default MemoryHealth;
