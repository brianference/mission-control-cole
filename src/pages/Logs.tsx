import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Search, RefreshCw } from 'lucide-react';
import './Logs.css';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  app: string;
  message: string;
}

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/logs.json');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
        setError(null);
      } else {
        // No logs.json yet - show empty state
        setLogs([]);
        setError('No logs available. Generate logs with generate-real-data.sh');
      }
    } catch {
      setLogs([]);
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Auto-refresh every 30 seconds if not paused
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (logContainerRef.current && !isPaused) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.app.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'debug': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <RefreshCw className="spin" size={24} />
          <span>Loading logs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <span className="page-icon">📋</span>
            System Logs
          </h1>
          <p className="page-subtitle">Real-time gateway and session logs</p>
        </div>
        <div className="header-actions">
          <button 
            className={`btn-secondary ${isPaused ? 'paused' : ''}`}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button className="btn-secondary" onClick={fetchLogs}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      <div className="logs-controls card">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="level-filters">
          {(['all', 'info', 'warn', 'error', 'debug'] as const).map(level => (
            <button
              key={level}
              className={`level-btn ${levelFilter === level ? 'active' : ''}`}
              onClick={() => setLevelFilter(level)}
              style={level !== 'all' ? { borderColor: getLevelColor(level as LogLevel) } : {}}
            >
              {level.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="logs-container card" ref={logContainerRef}>
        {error && (
          <div className="logs-empty">
            <span className="empty-icon">📭</span>
            <p>{error}</p>
            <code>./generate-real-data.sh</code>
          </div>
        )}
        {!error && filteredLogs.length === 0 && (
          <div className="logs-empty">
            <span className="empty-icon">🔍</span>
            <p>No logs match your filters</p>
          </div>
        )}
        {filteredLogs.map((log, index) => (
          <div key={index} className="log-entry">
            <span className="log-timestamp">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span 
              className="log-level"
              style={{ color: getLevelColor(log.level) }}
            >
              [{log.level.toUpperCase()}]
            </span>
            <span className="log-app">{log.app}</span>
            <span className="log-message">{log.message}</span>
          </div>
        ))}
      </div>

      <div className="logs-footer">
        <span>{filteredLogs.length} log entries</span>
        <span className="status-indicator">
          {isPaused ? '⏸️ Paused' : '🔄 Auto-refresh: 30s'}
        </span>
      </div>
    </div>
  );
};

export default Logs;
